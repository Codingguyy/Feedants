const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * `publishStatus` is the admin-controlled lifecycle (draft/published/cancelled).
 * The user-facing *phase* (upcoming / registration open / registration closed /
 * ongoing / completed) is NOT stored - it is derived at read time from the
 * date fields below via `computePhase()`. Storing a redundant "status" that
 * has to be flipped by a cron job is a common source of bugs (server clock
 * drift, missed cron runs, timezone bugs); deriving it from timestamps on
 * every read is cheap and always correct.
 */
const competitionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    rules: { type: [String], default: [] },
    category: { type: String, trim: true, default: 'General' },
    bannerImageUrl: { type: String, default: '' },
    hostName: { type: String, required: true },

    prizePool: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    entryFee: { type: Number, required: true, min: 0, default: 0 },

    // Registration window
    registrationStartDate: { type: Date, required: true },
    registrationEndDate: { type: Date, required: true },

    // Competition window
    competitionStartDate: { type: Date, required: true },
    competitionEndDate: { type: Date, required: true },

    maxParticipants: { type: Number, required: true, min: 1 },

    // Denormalized counter, kept in sync transactionally with Registration
    // documents (see competitionController.register). Reading this avoids an
    // expensive COUNT-style aggregation on every page view, which matters at
    // "thousands of concurrent users" scale.
    currentParticipantsCount: { type: Number, default: 0, min: 0 },

    publishStatus: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'],
      default: 'PUBLISHED',
    },

    isOnline: { type: Boolean, default: true },
    location: { type: String, default: '' },

    // Optimistic-concurrency safety net in addition to the atomic
    // findOneAndUpdate used for registration (see model note in README).
    __v: { type: Number, select: false },
  },
  { timestamps: true, optimisticConcurrency: true }
);

competitionSchema.index({ competitionStartDate: 1 });
competitionSchema.index({ registrationEndDate: 1 });
competitionSchema.index({ publishStatus: 1 });

/**
 * Derives the user-facing lifecycle phase from the current time and the
 * competition's date fields. Pure function of (doc, now) -> phase string.
 */
competitionSchema.methods.computePhase = function computePhase(now = new Date()) {
  if (this.publishStatus === 'CANCELLED') return 'CANCELLED';
  if (this.publishStatus === 'DRAFT') return 'DRAFT';

  if (now < this.registrationStartDate) return 'UPCOMING';
  if (now >= this.registrationStartDate && now < this.registrationEndDate) {
    return this.currentParticipantsCount >= this.maxParticipants
      ? 'REGISTRATION_FULL'
      : 'REGISTRATION_OPEN';
  }
  if (now >= this.registrationEndDate && now < this.competitionStartDate) {
    return 'REGISTRATION_CLOSED';
  }
  if (now >= this.competitionStartDate && now < this.competitionEndDate) {
    return 'ONGOING';
  }
  return 'COMPLETED';
};

competitionSchema.methods.spotsRemaining = function spotsRemaining() {
  return Math.max(this.maxParticipants - this.currentParticipantsCount, 0);
};

module.exports = mongoose.model('Competition', competitionSchema);
