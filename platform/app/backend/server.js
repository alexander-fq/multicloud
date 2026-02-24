const config = require('./src/config/env');
const logger = require('./src/utils/logger');
const app = require('./src/app');

const PORT = config.port;
const HOST = config.host;

async function startServer() {
  try {
    logger.info('Starting GovTech Cloud Migration Platform');
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Cloud Provider: ${(process.env.CLOUD_PROVIDER || 'aws').toUpperCase()}`);

    const server = app.listen(PORT, HOST, () => {
      logger.info('Server is running!');
      logger.info(`URL:    http://${HOST}:${PORT}`);
      logger.info(`Health: http://${HOST}:${PORT}/api/health`);
      logger.info(`Demo:   http://${HOST}:${PORT}/api/demo`);
      logger.info('Ready to handle requests...');
    });

    const shutdown = () => {
      logger.info('Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT',  shutdown);

  } catch (error) {
    logger.error('Failed to start server', { message: error.message });
    process.exit(1);
  }
}

startServer();
