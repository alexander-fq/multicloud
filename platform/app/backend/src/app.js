const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { errorHandler } = require('./middleware/errorHandler');
const { corsOptions, helmetOptions, apiLimiter } = require('./middleware/security');
const { requestLogger } = require('./middleware/requestLogger');

const healthRoutes = require('./routes/health');

const app = express();

// Trust proxy (for rate limiting behind load balancers)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
app.use(morgan('dev'));
app.use(requestLogger);

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api/health', healthRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'GovTech Cloud Migration Platform',
    version: '3.0.0',
    description: 'Multi-cloud infrastructure platform',
    endpoints: {
      health:         'GET  /api/health',
      healthDatabase: 'GET  /api/health/database',
      healthCloud:    'GET  /api/health/cloud',
    },
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET  /api/health',
      'GET  /api/health/database',
      'GET  /api/health/cloud',
    ],
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
