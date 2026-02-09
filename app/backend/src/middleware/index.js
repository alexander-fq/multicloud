/**
 * Middleware Index
 * Central export point for all middleware
 */

const { notFoundHandler, errorHandler, asyncHandler } = require('./errorHandler');
const { validate, validators, schemas } = require('./validator');
const { requestLogger, skipPaths } = require('./requestLogger');
const {
  corsOptions,
  helmetOptions,
  apiLimiter,
  createLimiter,
  authLimiter
} = require('./security');

module.exports = {
  // Error handling
  notFoundHandler,
  errorHandler,
  asyncHandler,

  // Validation
  validate,
  validators,
  schemas,

  // Logging
  requestLogger,
  skipPaths,

  // Security
  corsOptions,
  helmetOptions,
  apiLimiter,
  createLimiter,
  authLimiter
};
