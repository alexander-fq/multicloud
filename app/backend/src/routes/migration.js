const express = require('express');
const { getProvider, getScannerService } = require('../services/factory');
const logger = require('../utils/logger');
const MigrationPlanner = require('../migration/generator/migration-planner');
const { validateMigrationPlan } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/migration/scan
 * Scan current infrastructure configuration using REAL AWS SDK
 */
router.post('/scan', async (req, res) => {
  try {
    const provider = getProvider();
    logger.info('Starting real infrastructure scan', { provider });

    // Get scanner service from factory (real AWS scanning)
    const scanner = getScannerService();

    // Perform REAL scan of AWS resources
    const scanResult = await scanner.scan();

    logger.info('Infrastructure scan completed successfully', {
      provider,
      resourceCount: scanResult.resourceCounts
    });

    res.json({
      success: true,
      data: scanResult
    });
  } catch (error) {
    logger.error('Infrastructure scan failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Scan failed',
      message: error.message
    });
  }
});

/**
 * POST /api/migration/plan
 * Create REAL migration plan from one cloud to another using MigrationPlanner
 */
router.post('/plan', validateMigrationPlan, async (req, res) => {
  try {
    const { from, to } = req.body;
    logger.info(`Creating migration plan: ${from} → ${to}`);

    // Get scanner to get current infrastructure state
    const scanner = getScannerService();
    const scanResults = await scanner.scan();

    // Generate REAL migration plan
    const planner = new MigrationPlanner();
    const migrationPlan = await planner.generatePlan(scanResults, from, to);

    logger.info('Migration plan generated successfully', {
      from,
      to,
      steps: migrationPlan.steps.length,
      complexity: migrationPlan.complexity.level
    });

    res.json({
      success: true,
      data: migrationPlan
    });
  } catch (error) {
    logger.error('Migration plan generation failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate migration plan',
      message: error.message
    });
  }
});

/**
 * GET /api/migration/providers
 * List all supported providers and their status
 */
router.get('/providers', (req, res) => {
  res.json({
    providers: [
      {
        name: 'aws',
        displayName: 'Amazon Web Services',
        status: 'implemented',
        services: { storage: 'S3', database: 'RDS', compute: 'EKS', monitoring: 'CloudWatch' }
      },
      {
        name: 'oci',
        displayName: 'Oracle Cloud Infrastructure',
        status: 'pending',
        services: { storage: 'Object Storage', database: 'OCI DB', compute: 'OKE', monitoring: 'OCI Monitoring' }
      },
      {
        name: 'gcp',
        displayName: 'Google Cloud Platform',
        status: 'pending',
        services: { storage: 'Cloud Storage', database: 'Cloud SQL', compute: 'GKE', monitoring: 'Cloud Operations' }
      },
      {
        name: 'azure',
        displayName: 'Microsoft Azure',
        status: 'pending',
        services: { storage: 'Blob Storage', database: 'Azure SQL', compute: 'AKS', monitoring: 'Azure Monitor' }
      }
    ],
    current: getProvider()
  });
});

module.exports = router;
