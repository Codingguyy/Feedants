const jwt = require('jsonwebtoken');

/**
 * requireAuth - the route is not usable at all without a valid token.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

/**
 * optionalAuth - the competition details endpoint is publicly viewable, but
 * if a valid token is present we attach req.user so the response can include
 * "isRegistered" / personalised state. Anonymous viewers just don't get
 * those fields.
 */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
  } catch (err) {
    // Invalid/expired token on an optional-auth route: treat as anonymous
    // rather than failing the whole request.
  }
  return next();
}

module.exports = { requireAuth, optionalAuth };
