const express = require('express');
const { getDatabaseService, getAuthService, getProvider } = require('../services/factory');

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    provider: getProvider(),
    uptime: process.uptime(),
    checks: {}
  };

  try {
    // Check database
    const db = getDatabaseService();
    const dbHealthy = await db.testConnection();
    const dbStats = await db.getPoolStats();

    health.checks.database = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      stats: dbStats
    };

    // Check cloud credentials
    const auth = getAuthService();
    const credsValid = await auth.verifyCredentials();

    health.checks.cloudCredentials = {
      status: credsValid ? 'healthy' : 'unhealthy'
    };

    // Overall status
    if (!dbHealthy || !credsValid) {
      health.status = 'degraded';
      res.status(503);
    }

  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    res.status(503);
  }

  health.responseTime = `${Date.now() - startTime}ms`;
  res.json(health);
});

/**
 * GET /api/health/database
 * Database-specific health check
 */
router.get('/database', async (req, res) => {
  try {
    const db = getDatabaseService();
    const healthy = await db.testConnection();
    const stats = await db.getPoolStats();

    if (!healthy) {
      return res.status(503).json({
        status: 'unhealthy',
        message: 'Database connection failed'
      });
    }

    res.json({
      status: 'healthy',
      stats,
      provider: getProvider()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * GET /api/health/cloud
 * Cloud provider health check
 */
router.get('/cloud', async (req, res) => {
  try {
    const auth = getAuthService();
    const valid = await auth.verifyCredentials();
    const identity = valid ? await auth.getCurrentIdentity() : null;

    if (!valid) {
      return res.status(503).json({
        status: 'unhealthy',
        message: 'Cloud credentials verification failed'
      });
    }

    res.json({
      status: 'healthy',
      provider: getProvider(),
      identity: {
        account: identity.account || identity.userId,
        arn: identity.arn
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
