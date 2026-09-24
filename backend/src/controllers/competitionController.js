const mongoose = require('mongoose');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const { ApiError } = require('../middleware/errorHandler');
const { buildCompetitionResponse } = require('../utils/competitionState');

/**
 * GET /api/competitions/:id
 * Public (optionalAuth). Returns competition details plus, if the caller is
 * authenticated, their personal registration state for this competition.
 */
async function getCompetitionDetails(req, res, next) {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition || competition.publishStatus === 'DRAFT') {
      throw new ApiError(404, 'Competition not found.', 'NOT_FOUND');
    }

    let registration = null;
    if (req.user) {
      registration = await Registration.findOne({
        competition: competition._id,
        user: req.user.id,
      }).lean();
    }

    return res.json(buildCompetitionResponse(competition, { registration }));
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/competitions/:id/register
 * Auth required.
 *
 * Concurrency strategy
 * ---------------------
 * Two invariants must hold even with thousands of simultaneous requests
 * hitting the same competition:
 *   1. currentParticipantsCount never exceeds maxParticipants.
 *   2. a given user can never end up with two CONFIRMED registrations.
 *
 * (1) is enforced by doing the "check spots and increment" as a single
 * atomic findOneAndUpdate whose filter re-checks the invariant in the same
 * operation the database executes (`$expr` comparing the two fields), so
 * there is no read-then-write gap for two requests to race through.
 *
 * (2) is enforced at the schema level with a unique compound index on
 * (competition, user), which the database guarantees even if two requests
 * from the same user land on different app server instances at the same
 * instant.
 *
 * Both writes (the counter increment and the Registration insert) are
 * wrapped in a MongoDB transaction so that if the Registration insert fails
 * (e.g. duplicate-key error from a double-submit), the counter increment is
 * rolled back rather than leaking a phantom spot.
 */
async function registerForCompetition(req, res, next) {
  const session = await mongoose.startSession();
  try {
    let responseCompetition;
    let responseRegistration;

    await session.withTransaction(async () => {
      const competition = await Competition.findById(req.params.id).session(session);
      if (!competition || competition.publishStatus !== 'PUBLISHED') {
        throw new ApiError(404, 'Competition not found.', 'NOT_FOUND');
      }

      const now = new Date();
      const phase = competition.computePhase(now);
      if (phase !== 'REGISTRATION_OPEN') {
        throw new ApiError(
          409,
          phaseToRegistrationErrorMessage(phase),
          'REGISTRATION_NOT_OPEN'
        );
      }

      // Atomic "spots available?" check + reservation. If another request
      // filled the last spot between our read above and this call, the
      // $expr condition fails to match and `updated` is null.
      const updated = await Competition.findOneAndUpdate(
        {
          _id: competition._id,
          $expr: { $lt: ['$currentParticipantsCount', '$maxParticipants'] },
        },
        { $inc: { currentParticipantsCount: 1 } },
        { new: true, session }
      );

      if (!updated) {
        throw new ApiError(409, 'This competition just reached its participant limit.', 'COMPETITION_FULL');
      }

      try {
        const [registration] = await Registration.create(
          [
            {
              competition: competition._id,
              user: req.user.id,
              status: 'CONFIRMED',
            },
          ],
          { session }
        );
        responseRegistration = registration;
      } catch (err) {
        // Duplicate registration (unique index) - the whole transaction
        // aborts, which also rolls back the $inc above.
        if (err.code === 11000) {
          throw new ApiError(409, 'You are already registered for this competition.', 'ALREADY_REGISTERED');
        }
        throw err;
      }

      responseCompetition = updated;
    });

    return res
      .status(201)
      .json(buildCompetitionResponse(responseCompetition, { registration: responseRegistration }));
  } catch (err) {
    return next(err);
  } finally {
    session.endSession();
  }
}

/**
 * DELETE /api/competitions/:id/register
 * Auth required. Withdraws the caller's registration, freeing a spot.
 * Business rule: withdrawal is only allowed while registration is still
 * "open" in spirit (open or full-but-within-window) - once the event has
 * moved into REGISTRATION_CLOSED/ONGOING/COMPLETED we keep the registration
 * intact (the seat was reserved for that window and organisers may have
 * already planned around it). This is a product decision, easy to relax.
 */
async function withdrawFromCompetition(req, res, next) {
  const session = await mongoose.startSession();
  try {
    let responseCompetition;

    await session.withTransaction(async () => {
      const competition = await Competition.findById(req.params.id).session(session);
      if (!competition) {
        throw new ApiError(404, 'Competition not found.', 'NOT_FOUND');
      }

      const registration = await Registration.findOne({
        competition: competition._id,
        user: req.user.id,
        status: 'CONFIRMED',
      }).session(session);

      if (!registration) {
        throw new ApiError(404, 'You do not have an active registration for this competition.', 'NOT_REGISTERED');
      }

      const phase = competition.computePhase(new Date());
      const withdrawable = phase === 'REGISTRATION_OPEN' || phase === 'REGISTRATION_FULL';
      if (!withdrawable) {
        throw new ApiError(409, 'Withdrawal is no longer available for this competition.', 'WITHDRAWAL_CLOSED');
      }

      registration.status = 'WITHDRAWN';
      registration.withdrawnAt = new Date();
      await registration.save({ session });

      // Only decrement if there's something to decrement - guards against
      // the counter ever going negative under any edge case.
      responseCompetition = await Competition.findOneAndUpdate(
        { _id: competition._id, currentParticipantsCount: { $gt: 0 } },
        { $inc: { currentParticipantsCount: -1 } },
        { new: true, session }
      ) || competition;
    });

    return res.json(buildCompetitionResponse(responseCompetition, { registration: null }));
  } catch (err) {
    return next(err);
  } finally {
    session.endSession();
  }
}

function phaseToRegistrationErrorMessage(phase) {
  switch (phase) {
    case 'UPCOMING':
      return 'Registration has not opened yet.';
    case 'REGISTRATION_FULL':
      return 'This competition is full.';
    case 'REGISTRATION_CLOSED':
      return 'Registration has closed for this competition.';
    case 'ONGOING':
      return 'This competition has already started.';
    case 'COMPLETED':
      return 'This competition has ended.';
    case 'CANCELLED':
      return 'This competition has been cancelled.';
    default:
      return 'Registration is not currently available.';
  }
}

module.exports = { getCompetitionDetails, registerForCompetition, withdrawFromCompetition };
