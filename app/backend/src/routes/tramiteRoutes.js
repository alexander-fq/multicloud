/**
 * Tramite Routes
 * Defines all HTTP endpoints for tramite operations
 *
 * Base path: /api/v1/tramites
 *
 * Routes follow RESTful conventions:
 * - GET    /                      - List all tramites (paginated)
 * - GET    /estadisticas          - Get statistics
 * - GET    /numero/:numeroTramite - Get tramite by number
 * - GET    /dni/:dni              - Get tramites by DNI
 * - POST   /                      - Create new tramite
 * - PUT    /:numeroTramite        - Update existing tramite
 */

const express = require('express');
const router = express.Router();

// Import controller methods
const {
  getAllTramites,
  getTramiteByNumero,
  getTramitesByDNI,
  createTramite,
  updateTramite,
  getEstadisticas
} = require('../controllers/tramiteController');

/**
 * @route   GET /api/v1/tramites
 * @desc    Get all tramites with pagination and optional filters
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10, max: 100)
 * @query   estado - Filter by status
 * @query   tipoTramite - Filter by type
 * @query   dni - Filter by DNI
 * @access  Public
 */
router.get('/', getAllTramites);

/**
 * @route   GET /api/v1/tramites/estadisticas
 * @desc    Get tramites statistics
 * @access  Public
 * @note    This route must be BEFORE /:numeroTramite to avoid conflicts
 */
router.get('/estadisticas', getEstadisticas);

/**
 * @route   GET /api/v1/tramites/numero/:numeroTramite
 * @desc    Get tramite by procedure number
 * @param   numeroTramite - Procedure number (format: TRAM-YYYYMMDD-XXXXX)
 * @access  Public
 */
router.get('/numero/:numeroTramite', getTramiteByNumero);

/**
 * @route   GET /api/v1/tramites/dni/:dni
 * @desc    Get all tramites for a specific DNI
 * @param   dni - Citizen DNI (8 digits)
 * @access  Public
 */
router.get('/dni/:dni', getTramitesByDNI);

/**
 * @route   POST /api/v1/tramites
 * @desc    Create new tramite
 * @body    { dni, nombreCiudadano, tipoTramite, estado?, ... }
 * @access  Public
 */
router.post('/', createTramite);

/**
 * @route   PUT /api/v1/tramites/:numeroTramite
 * @desc    Update existing tramite
 * @param   numeroTramite - Procedure number
 * @body    Fields to update (partial update)
 * @access  Public
 */
router.put('/:numeroTramite', updateTramite);

/**
 * Export router
 */
module.exports = router;
