/**
 * Error Handler Middleware
 * Centralized error handling for the entire application
 *
 * This middleware should be registered LAST in the middleware chain
 * to catch all errors from previous middleware and route handlers
 */

const logger = require('../utils/logger');

/**
 * Not Found Handler
 * Catches requests to undefined routes
 * Should be placed BEFORE the error handler
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found - ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

/**
 * Global Error Handler
 * Processes all errors and sends appropriate response
 *
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
function errorHandler(err, req, res, next) {
  // Log error using Winston
  logger.logError(err, req);

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Build error response
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    status: statusCode
  };

  // Add error details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose/Joi validation error
    errorResponse.message = 'Validation Error';
    errorResponse.errors = err.errors || err.details;
    return res.status(400).json(errorResponse);
  }

  if (err.name === 'SequelizeValidationError') {
    // Sequelize validation error
    errorResponse.message = 'Database Validation Error';
    errorResponse.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    return res.status(400).json(errorResponse);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    // Unique constraint violation
    errorResponse.message = 'Duplicate Entry';
    errorResponse.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(409).json(errorResponse);
  }

  if (err.name === 'SequelizeDatabaseError') {
    // Database error
    errorResponse.message = 'Database Error';
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.details = err.parent?.message;
    }
    return res.status(500).json(errorResponse);
  }

  if (err.name === 'UnauthorizedError') {
    // JWT authentication error
    errorResponse.message = 'Unauthorized';
    return res.status(401).json(errorResponse);
  }

  if (err.code === 'EBADCSRFTOKEN') {
    // CSRF token error
    errorResponse.message = 'Invalid CSRF Token';
    return res.status(403).json(errorResponse);
  }

  // Default error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch rejected promises
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json(data);
 *   }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler
};
