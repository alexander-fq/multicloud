const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Configuration and utilities
const config = require('./config/env');
const logger = require('./utils/logger');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { corsOptions, helmetOptions, apiLimiter } = require('./middleware/security');
const { requestLogger } = require('./middleware/requestLogger');

// Routes
const healthRoutes = require('./routes/health');
const migrationRoutes = require('./routes/migration');
const infoRoutes = require('./routes/info');
const demoRoutes = require('./routes/demo');

const app = express();

// Log application start
logger.info('Starting GovTech Cloud Migration Platform', {
  environment: config.nodeEnv,
  cloudProvider: config.cloudProvider,
  port: config.port
});

// Trust proxy (for rate limiting to work correctly behind load balancers)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

// Compression middleware (gzip)
app.use(compression());

// Body parsing
app.use(express.json({ limit: config.isDevelopment ? '10mb' : '1mb' }));
app.use(express.urlencoded({ extended: true, limit: config.isDevelopment ? '10mb' : '1mb' }));

// Logging middleware
if (config.isDevelopment) {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting (apply to all /api routes)
app.use('/api/', apiLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/demo', demoRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'GovTech Cloud Migration Platform',
    version: '1.0.0',
    description: 'Multi-cloud backend architecture for government digital transformation',
    provider: process.env.CLOUD_PROVIDER || 'aws',
    endpoints: {
      health: '/api/health',
      migration: '/api/migration',
      info: '/api/info',
      demo: '/api/demo'
    },
    documentation: 'https://github.com/alexander-fq/multicloud'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/info',
      'POST /api/migration/scan'
    ]
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
