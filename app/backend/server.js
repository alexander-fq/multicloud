/**
 * Server Entry Point
 * Starts the HTTP server and initializes the application
 *
 * This file is separate from app.js to allow app.js to be
 * imported in tests without starting the server.
 */

const { app, initializeDatabase } = require('./src/app');

/**
 * Get port from environment or use default
 */
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialize database connection
    console.log('[Server] Initializing database connection...');
    await initializeDatabase();

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log('='.repeat(70));
      console.log(`[Server] GovTech Tramites API`);
      console.log(`[Server] Environment: ${NODE_ENV}`);
      console.log(`[Server] Server running on http://${HOST}:${PORT}`);
      console.log(`[Server] API Base URL: http://${HOST}:${PORT}/api/v1`);
      console.log(`[Server] Health Check: http://${HOST}:${PORT}/api/v1/health`);
      console.log('='.repeat(70));
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[Server] Error: Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('[Server] Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n[Server] ${signal} received. Closing server...`);

      server.close(() => {
        console.log('[Server] HTTP server closed');
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('[Server] Failed to start server:', error.message);
    process.exit(1);
  }
}

/**
 * Start the server
 */
startServer();
