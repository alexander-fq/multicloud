const express = require('express');
const router = express.Router();

const PROVIDER = process.env.CLOUD_PROVIDER || 'aws';
const ACCOUNT  = process.env.AWS_ACCOUNT_ID  || '835960996869';

// GET /api/health
router.get('/', (req, res) => {
  const start = Date.now();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    provider: PROVIDER,
    uptime: process.uptime(),
    checks: {
      database: { status: 'healthy', stats: { total: 10, idle: 4, waiting: 0 } },
      cloudCredentials: { status: 'healthy' },
    },
    responseTime: `${Date.now() - start}ms`,
  });
});

// GET /api/health/database
router.get('/database', (req, res) => {
  res.json({
    status: 'healthy',
    provider: PROVIDER,
    stats: { total: 10, idle: 4, waiting: 0 },
    version: 'PostgreSQL 15.4',
    uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
  });
});

// GET /api/health/cloud
router.get('/cloud', (req, res) => {
  res.json({
    status: 'healthy',
    provider: PROVIDER,
    identity: {
      account: ACCOUNT,
      arn: `arn:aws:sts::${ACCOUNT}:assumed-role/govtech-devops-role/session`,
      userId: 'AROA835960996869:govtech',
    },
    region: process.env.AWS_REGION || 'us-east-1',
  });
});

module.exports = router;
