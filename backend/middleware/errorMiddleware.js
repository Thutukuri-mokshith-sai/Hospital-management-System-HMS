// Wrapper to catch errors in async functions and pass them to the global handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for developer
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  console.error(err.stack);

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    res.status(404);
  }

  // Mongoose Duplicate Key (e.g. email)
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    res.status(400);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message);
    res.status(400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    res.status(401);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    res.status(401);
  }

  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    success: false,
    message: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { asyncHandler, errorHandler };