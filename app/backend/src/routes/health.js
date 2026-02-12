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
    }

  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
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
      return res.json({
        status: 'unhealthy',
        message: 'Database connection failed',
        provider: getProvider()
      });
    }

    res.json({
      status: 'healthy',
      stats,
      provider: getProvider()
    });
  } catch (error) {
    res.json({
      status: 'unhealthy',
      error: error.message,
      provider: getProvider()
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
      return res.json({
        status: 'unhealthy',
        message: 'Cloud credentials verification failed',
        provider: getProvider()
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
    res.json({
      status: 'unhealthy',
      error: error.message,
      provider: getProvider()
    });
  }
});

module.exports = router;
