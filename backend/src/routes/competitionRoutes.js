const express = require('express');
const rateLimit = require('express-rate-limit');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const {
  getCompetitionDetails,
  registerForCompetition,
  withdrawFromCompetition,
} = require('../controllers/competitionController');

const router = express.Router();

// Registration is the write-heavy, contention-prone endpoint (everyone
// hitting "Register" the moment a popular competition opens). A per-IP rate
// limit is a cheap first line of defence against accidental
// double-submit/retry storms on top of the DB-level concurrency handling.
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts, please slow down.' },
});

router.get('/:id', optionalAuth, getCompetitionDetails);
router.post('/:id/register', requireAuth, registerLimiter, registerForCompetition);
router.delete('/:id/register', requireAuth, withdrawFromCompetition);

module.exports = router;
