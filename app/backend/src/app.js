const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const { getMonitoringService } = require('./services/factory');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
// const security = require('./middleware/security');
// const requestLogger = require('./middleware/requestLogger');

// Routes
const healthRoutes = require('./routes/health');
const migrationRoutes = require('./routes/migration');
const infoRoutes = require('./routes/info');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
// app.use(security);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));
// app.use(requestLogger);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/info', infoRoutes);

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
      info: '/api/info'
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
