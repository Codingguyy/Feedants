class ApiError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
  }
}

function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  console.error('[error]', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message, code: 'VALIDATION_ERROR' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier.', code: 'INVALID_ID' });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'You are already registered for this competition.',
      code: 'DUPLICATE_REGISTRATION',
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || 'Something went wrong.',
    code: err.code || 'INTERNAL_ERROR',
  });
}

module.exports = { ApiError, notFound, errorHandler };
