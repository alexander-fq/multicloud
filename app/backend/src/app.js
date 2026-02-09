/**
 * Express Application Setup
 * Main application file that configures Express and middleware
 *
 * This file exports the Express app without starting the server,
 * which allows for easier testing and modular server startup.
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

// Import middleware
const {
  requestLogger,
  errorHandler,
  notFoundHandler,
  corsOptions,
  helmetOptions,
  apiLimiter
} = require('./middleware');

// Import routes
const apiRoutes = require('./routes/index');

// Import database connection
const { testConnection, closeConnection } = require('./config/database');

/**
 * Create Express application
 */
const app = express();

/**
 * Trust proxy
 * Enable if behind reverse proxy (Nginx, AWS ALB, etc.)
 */
app.set('trust proxy', 1);

/**
 * Security Middleware
 * Apply security headers and CORS
 */
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

/**
 * Body Parser Middleware
 * Parse JSON and URL-encoded bodies
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Compression Middleware
 * Compress response bodies
 */
app.use(compression());

/**
 * Request Logger Middleware
 * Log all HTTP requests
 */
app.use(requestLogger);

/**
 * Rate Limiting Middleware
 * Apply rate limiting to all API routes
 */
app.use('/api', apiLimiter);

/**
 * API Routes
 * Mount all API routes under /api/v1
 */
app.use('/api/v1', apiRoutes);

/**
 * Root Route
 * Simple welcome message
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GovTech Tramites API',
    version: '1.0.0',
    endpoints: {
      api: '/api/v1',
      health: '/api/v1/health',
      tramites: '/api/v1/tramites',
      documentation: '/api/v1/docs'
    }
  });
});

/**
 * Not Found Handler
 * Handles requests to undefined routes
 * Must be placed AFTER all other routes
 */
app.use(notFoundHandler);

/**
 * Error Handler Middleware
 * Centralized error handling
 * Must be placed LAST in the middleware chain
 */
app.use(errorHandler);

/**
 * Database Connection
 * Test database connection on startup
 */
async function initializeDatabase() {
  try {
    await testConnection();
    console.log('[App] Database connection initialized');
  } catch (error) {
    console.error('[App] Failed to connect to database:', error.message);
    // Don't exit, let the app start anyway (graceful degradation)
    // In production, you might want to exit here
    if (process.env.NODE_ENV === 'production') {
      console.error('[App] Exiting due to database connection failure in production');
      process.exit(1);
    }
  }
}

/**
 * Graceful Shutdown
 * Handles SIGTERM and SIGINT signals
 */
async function gracefulShutdown(signal) {
  console.log(`\n[App] ${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connection
    await closeConnection();
    console.log('[App] Database connection closed');

    // Give ongoing requests time to complete
    setTimeout(() => {
      console.log('[App] Graceful shutdown completed');
      process.exit(0);
    }, 1000);

  } catch (error) {
    console.error('[App] Error during shutdown:', error.message);
    process.exit(1);
  }
}

/**
 * Register shutdown handlers
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('[App] Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('[App] Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

/**
 * Export app and initialization function
 */
module.exports = {
  app,
  initializeDatabase
};
