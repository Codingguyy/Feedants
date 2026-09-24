const mongoose = require('mongoose');
const { Schema } = mongoose;

const registrationSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['CONFIRMED', 'WITHDRAWN'],
      default: 'CONFIRMED',
    },
    registeredAt: { type: Date, default: Date.now },
    withdrawnAt: { type: Date },
  },
  { timestamps: true }
);

// The core data-integrity guarantee for "one user can't register twice":
// enforced at the database level, not just in application code, so it holds
// even under concurrent requests / multiple app server instances.
registrationSchema.index({ competition: 1, user: 1 }, { unique: true });

// Fast lookup for "does this user have an active registration" and for
// participant listing / export endpoints.
registrationSchema.index({ competition: 1, status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
