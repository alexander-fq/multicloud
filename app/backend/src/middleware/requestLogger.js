/**
 * Request Logger Middleware
 * Logs all HTTP requests with detailed information
 *
 * Logs:
 * - Method and URL
 * - Status code
 * - Response time
 * - User agent
 * - IP address
 */

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get color code for status
 * @param {number} status - HTTP status code
 * @returns {string} ANSI color code
 */
function getStatusColor(status) {
  if (status >= 500) return '\x1b[31m'; // Red
  if (status >= 400) return '\x1b[33m'; // Yellow
  if (status >= 300) return '\x1b[36m'; // Cyan
  if (status >= 200) return '\x1b[32m'; // Green
  return '\x1b[0m'; // Reset
}

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
    const statusColor = getStatusColor(res.statusCode);
    const resetColor = '\x1b[0m';

    // Build log message
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown'
    };

    // Add content length if available
    const contentLength = res.get('content-length');
    if (contentLength) {
      logData.size = formatBytes(parseInt(contentLength));
    }

    // Colorized console output for development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${statusColor}${req.method}${resetColor} ${req.originalUrl} ` +
        `${statusColor}${res.statusCode}${resetColor} ` +
        `${duration}ms`
      );
    } else {
      // Structured JSON log for production
      console.log(JSON.stringify(logData));
    }

    // Log errors with more detail
    if (res.statusCode >= 400 && responseBody) {
      console.error('[Request Error]', {
        ...logData,
        error: responseBody.message,
        details: responseBody.errors || responseBody.details
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
