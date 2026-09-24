const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new ApiError(400, 'name, email and password are required.', 'VALIDATION_ERROR');
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');
    }
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await user.comparePassword(password || ''))) {
      throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }
    return res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { signup, login };
