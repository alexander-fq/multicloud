/**
 * Routes Index
 * Central registry for all API routes
 *
 * This file aggregates all route modules and exports them
 * with their corresponding base paths.
 */

const express = require('express');
const router = express.Router();

// Import route modules
const tramiteRoutes = require('./tramiteRoutes');

/**
 * Mount route modules
 *
 * Base path: /api/v1
 * All routes defined here will be prefixed with /api/v1
 */

// Tramite routes - /api/v1/tramites
router.use('/tramites', tramiteRoutes);

/**
 * Health check route
 * @route GET /api/v1/health
 * @desc Simple health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * API info route
 * @route GET /api/v1
 * @desc API information and available endpoints
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GovTech Tramites API',
    version: '1.0.0',
    endpoints: {
      tramites: '/api/v1/tramites',
      health: '/api/v1/health'
    },
    documentation: '/api/v1/docs'
  });
});

module.exports = router;
