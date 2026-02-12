const winston = require('winston');
const path = require('path');
const config = require('../config/env');

/**
 * Winston logger configuration
 * Logs to console and files with different levels
 */

// Custom format for console output (development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }

    return msg;
  })
);

// Custom format for file output (production)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: config.logLevel
  })
);

// File transports (only in non-test environments)
if (!config.isTest) {
  // Error logs file
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Combined logs file
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.logLevel,
  format: fileFormat,
  transports,
  exitOnError: false
});

// Add helpful methods
logger.logRequest = (req) => {
  logger.http(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

logger.logResponse = (req, res, responseTime) => {
  logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
    responseTime: `${responseTime}ms`,
    ip: req.ip
  });
};

logger.logError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    })
  };

  logger.error('Application error', errorData);
};

// Log initialization
logger.info('Logger initialized', {
  environment: config.nodeEnv,
  logLevel: config.logLevel
});

module.exports = logger;
