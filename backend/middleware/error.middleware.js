const { errorResponse } = require('../utils/response');

/**
 * Global Error Handling Middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // Production error handling
  if (err.isOperational) {
    return errorResponse(res, err.message, err.statusCode);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    return errorResponse(res, `Duplicate field value: ${value}. Please use another value!`, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    return errorResponse(res, `Invalid input data. ${errors.join('. ')}`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') return errorResponse(res, 'Invalid token. Please log in again!', 401);
  if (err.name === 'TokenExpiredError') return errorResponse(res, 'Your token has expired! Please log in again.', 401);

  // Generic production error
  console.error('ERROR 💥', err);
  return errorResponse(res, 'Something went very wrong!', 500);
};

module.exports = globalErrorHandler;
