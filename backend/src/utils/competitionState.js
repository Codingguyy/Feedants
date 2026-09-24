/**
 * Central place for the "what can this user do right now" business logic,
 * so the controller and any future endpoint (push notifications, admin
 * dashboard, etc.) derive the same truth from the same function instead of
 * re-implementing the rules.
 */

const REGISTERABLE_PHASES = new Set(['REGISTRATION_OPEN']);
const WITHDRAWABLE_PHASES = new Set(['REGISTRATION_OPEN', 'REGISTRATION_FULL']);

function buildCompetitionResponse(competitionDoc, { registration } = {}) {
  const now = new Date();
  const phase = competitionDoc.computePhase(now);
  const spotsRemaining = competitionDoc.spotsRemaining();
  const isRegistered = !!registration && registration.status === 'CONFIRMED';

  // The countdown the UI should show depends on the phase: while
  // registration is open, count down to the registration deadline; once
  // registration is closed but the event hasn't started, count down to
  // kickoff; while ongoing, count down to the end.
  let countdownTarget = null;
  let countdownLabel = null;
  if (phase === 'UPCOMING') {
    countdownTarget = competitionDoc.registrationStartDate;
    countdownLabel = 'Registration opens in';
  } else if (phase === 'REGISTRATION_OPEN') {
    countdownTarget = competitionDoc.registrationEndDate;
    countdownLabel = 'Registration closes in';
  } else if (phase === 'REGISTRATION_FULL' || phase === 'REGISTRATION_CLOSED') {
    countdownTarget = competitionDoc.competitionStartDate;
    countdownLabel = 'Starts in';
  } else if (phase === 'ONGOING') {
    countdownTarget = competitionDoc.competitionEndDate;
    countdownLabel = 'Ends in';
  }

  const canRegister = !isRegistered && REGISTERABLE_PHASES.has(phase) && spotsRemaining > 0;
  const canWithdraw = isRegistered && WITHDRAWABLE_PHASES.has(phase);

  return {
    id: competitionDoc._id,
    title: competitionDoc.title,
    description: competitionDoc.description,
    rules: competitionDoc.rules,
    category: competitionDoc.category,
    bannerImageUrl: competitionDoc.bannerImageUrl,
    hostName: competitionDoc.hostName,
    isOnline: competitionDoc.isOnline,
    location: competitionDoc.location,

    prizePool: competitionDoc.prizePool,
    currency: competitionDoc.currency,
    entryFee: competitionDoc.entryFee,

    registrationStartDate: competitionDoc.registrationStartDate,
    registrationEndDate: competitionDoc.registrationEndDate,
    competitionStartDate: competitionDoc.competitionStartDate,
    competitionEndDate: competitionDoc.competitionEndDate,

    maxParticipants: competitionDoc.maxParticipants,
    currentParticipantsCount: competitionDoc.currentParticipantsCount,
    spotsRemaining,
    // Below a small threshold this drives an "X spots left" urgency UI.
    isAlmostFull: spotsRemaining > 0 && spotsRemaining <= Math.max(3, Math.ceil(competitionDoc.maxParticipants * 0.05)),

    phase,
    countdownTarget,
    countdownLabel,

    // Personalised / actionable state - undefined for anonymous viewers so
    // the client knows to render a "Login to register" CTA instead.
    viewer: {
      isRegistered,
      canRegister,
      canWithdraw,
      registeredAt: registration ? registration.registeredAt : null,
    },

    serverTime: now, // lets the client correct for clock drift on countdowns
  };
}

module.exports = { buildCompetitionResponse, REGISTERABLE_PHASES, WITHDRAWABLE_PHASES };
