/**
 * Demo Routes
 * Endpoints para modo demostración con datos simulados
 */

const express = require('express');
const demoData = require('../services/demo-data-generator');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/demo/cloud-infrastructure
 * Obtener datos simulados de infraestructura cloud
 */
router.get('/cloud-infrastructure', (req, res) => {
  try {
    const provider = req.query.provider || 'aws';
    logger.info(`Generating demo cloud infrastructure data for ${provider}`);

    const infrastructure = demoData.generateCloudInfrastructure(provider);

    res.json({
      success: true,
      mode: 'demo',
      data: infrastructure
    });
  } catch (error) {
    logger.error('Error generating demo cloud data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate demo data',
      message: error.message
    });
  }
});

/**
 * GET /api/demo/on-premise-infrastructure
 * Obtener datos simulados de infraestructura on-premise
 */
router.get('/on-premise-infrastructure', (req, res) => {
  try {
    logger.info('Generating demo on-premise infrastructure data');

    const infrastructure = demoData.generateOnPremiseInfrastructure();

    res.json({
      success: true,
      mode: 'demo',
      data: infrastructure
    });
  } catch (error) {
    logger.error('Error generating demo on-premise data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate demo data',
      message: error.message
    });
  }
});

/**
 * GET /api/demo/migration-waves
 * Obtener plan de ondas de migración simulado
 */
router.get('/migration-waves', (req, res) => {
  try {
    logger.info('Generating demo migration waves');

    const infrastructure = demoData.generateOnPremiseInfrastructure();
    const waves = demoData.generateMigrationWaves(infrastructure);

    res.json({
      success: true,
      mode: 'demo',
      data: {
        totalServers: infrastructure.totalResources,
        totalWaves: waves.length,
        estimatedTotalTime: '4-6 months',
        waves: waves
      }
    });
  } catch (error) {
    logger.error('Error generating demo waves', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate demo waves',
      message: error.message
    });
  }
});

/**
 * GET /api/demo/dependency-graph
 * Obtener grafo de dependencias simulado
 */
router.get('/dependency-graph', (req, res) => {
  try {
    logger.info('Generating demo dependency graph');

    const infrastructure = demoData.generateOnPremiseInfrastructure();

    res.json({
      success: true,
      mode: 'demo',
      data: infrastructure.dependencies
    });
  } catch (error) {
    logger.error('Error generating demo dependency graph', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate demo data',
      message: error.message
    });
  }
});

/**
 * POST /api/demo/simulate-migration
 * Simular una migración (retorna progreso simulado)
 */
router.post('/simulate-migration', async (req, res) => {
  try {
    const { wave, serverIds } = req.body;
    logger.info(`Simulating migration for wave ${wave}`);

    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    const simulation = {
      migrationId: `demo-migration-${Date.now()}`,
      wave: wave,
      serverCount: serverIds?.length || 8,
      status: 'in-progress',
      startTime: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      progress: {
        current: 0,
        total: serverIds?.length || 8,
        percentage: 0
      },
      phases: [
        { name: 'Backup Creation', status: 'in-progress', progress: 15 },
        { name: 'VM Conversion', status: 'pending', progress: 0 },
        { name: 'Data Transfer', status: 'pending', progress: 0 },
        { name: 'Network Configuration', status: 'pending', progress: 0 },
        { name: 'Validation', status: 'pending', progress: 0 }
      ],
      logs: [
        { timestamp: new Date().toISOString(), level: 'info', message: 'Migration started' },
        { timestamp: new Date().toISOString(), level: 'info', message: 'Creating pre-migration backups...' },
        { timestamp: new Date().toISOString(), level: 'info', message: 'Backup creation 15% complete' }
      ]
    };

    res.json({
      success: true,
      mode: 'demo',
      data: simulation
    });
  } catch (error) {
    logger.error('Error simulating migration', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to simulate migration',
      message: error.message
    });
  }
});

module.exports = router;
