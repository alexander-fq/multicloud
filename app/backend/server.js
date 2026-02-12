const config = require('./src/config/env');
const logger = require('./src/utils/logger');
const app = require('./src/app');
const { getDatabaseService, getAuthService, getProvider } = require('./src/services/factory');

const PORT = config.port;
const HOST = config.host;

async function startServer() {
  try {
    logger.info('Starting GovTech Cloud Migration Platform');
    logger.info(`Cloud Provider: ${getProvider().toUpperCase()}`);
    logger.info(`Environment: ${config.nodeEnv}`);

    // Test database connection
    logger.info('Testing database connection...');
    const db = getDatabaseService();
    const dbConnected = await db.testConnection();

    if (!dbConnected) {
      logger.warn('Database connection failed, but server will continue');
    } else {
      logger.info('Database connected successfully');
      const stats = await db.getPoolStats();
      logger.info(`Pool stats: ${stats.total} total, ${stats.idle} idle, ${stats.waiting} waiting`);
    }

    // Verify cloud credentials
    logger.info('Verifying cloud credentials...');
    const auth = getAuthService();
    const credsValid = await auth.verifyCredentials();

    if (!credsValid) {
      logger.warn('Cloud credentials verification failed');
      logger.warn('Some features may not work correctly');
    } else {
      logger.info('Cloud credentials verified');
      const identity = await auth.getCurrentIdentity();
      logger.info(`Account: ${identity.account || identity.userId}`);
    }

    // Start server
    const server = app.listen(PORT, HOST, () => {
      logger.info('Server is running!');
      logger.info(`URL: http://${HOST}:${PORT}`);
      logger.info(`Health: http://${HOST}:${PORT}/api/health`);
      logger.info(`Info: http://${HOST}:${PORT}/api/info`);
      logger.info('Ready to handle requests...');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        logger.info('Server closed');
        await db.close();
        logger.info('Database connections closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(async () => {
        logger.info('Server closed');
        await db.close();
        logger.info('Database connections closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

startServer();
