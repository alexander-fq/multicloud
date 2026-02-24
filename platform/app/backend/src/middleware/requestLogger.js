/**
 * Request Logger Middleware
 * Logs all HTTP requests with detailed information using Winston
 *
 * Logs:
 * - Method and URL
 * - Status code
 * - Response time
 * - User agent
 * - IP address
 */

const logger = require('../utils/logger');

/**
 * Request Logger Middleware
 * Logs information about each HTTP request
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Capture original res.json to log response
  const originalJson = res.json;
  let responseBody;

  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Use Winston logger
    logger.logResponse(req, res, duration);

    // Log errors with more detail
    if (res.statusCode >= 400 && responseBody) {
      logger.warn('Request returned error', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        error: responseBody.message || responseBody.error,
        duration: `${duration}ms`
      });
    }
  });

  next();
}

/**
 * Skip logger for certain paths
 * @param {Array} paths - Paths to skip logging
 * @returns {Function} Middleware
 */
function skipPaths(paths = []) {
  return (req, res, next) => {
    const shouldSkip = paths.some(path => req.path.startsWith(path));

    if (shouldSkip) {
      return next();
    }

    return requestLogger(req, res, next);
  };
}

module.exports = {
  requestLogger,
  skipPaths
};
