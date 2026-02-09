/**
 * Tramite Controller
 * Handles all business logic for Tramite operations
 *
 * Response format:
 * {
 *   success: boolean,
 *   data: any,
 *   message?: string,
 *   pagination?: { page, limit, total, totalPages }
 * }
 */

const { Tramite, TipoTramite, EstadoTramite } = require('../models/Tramite');
const { Op } = require('sequelize');

/**
 * Get all tramites with pagination and optional filters
 * @route GET /api/v1/tramites
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 100)
 * @query estado - Filter by status
 * @query tipoTramite - Filter by type
 * @query dni - Filter by DNI
 */
async function getAllTramites(req, res) {
  try {
    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    // Build filter conditions
    const where = {};

    if (req.query.estado) {
      if (!Object.values(EstadoTramite).includes(req.query.estado)) {
        return res.status(400).json({
          success: false,
          message: `Invalid estado. Valid values: ${Object.values(EstadoTramite).join(', ')}`
        });
      }
      where.estado = req.query.estado;
    }

    if (req.query.tipoTramite) {
      if (!Object.values(TipoTramite).includes(req.query.tipoTramite)) {
        return res.status(400).json({
          success: false,
          message: `Invalid tipoTramite. Valid values: ${Object.values(TipoTramite).join(', ')}`
        });
      }
      where.tipoTramite = req.query.tipoTramite;
    }

    if (req.query.dni) {
      // Validate DNI format (8 digits)
      if (!/^\d{8}$/.test(req.query.dni)) {
        return res.status(400).json({
          success: false,
          message: 'DNI must be exactly 8 digits'
        });
      }
      where.dni = req.query.dni;
    }

    // Execute query with pagination
    const { count, rows } = await Tramite.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);

    console.log(`[Controller] Retrieved ${rows.length} tramites (page ${page}/${totalPages})`);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      }
    });

  } catch (error) {
    console.error('[Controller] Error in getAllTramites:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving tramites',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get tramite by numero
 * @route GET /api/v1/tramites/numero/:numeroTramite
 * @param numeroTramite - Procedure number
 */
async function getTramiteByNumero(req, res) {
  try {
    const { numeroTramite } = req.params;

    // Validate format
    if (!/^TRAM-\d{8}-\d{5}$/.test(numeroTramite)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid procedure number format. Expected: TRAM-YYYYMMDD-XXXXX'
      });
    }

    const tramite = await Tramite.findByNumero(numeroTramite);

    if (!tramite) {
      console.log(`[Controller] Tramite not found: ${numeroTramite}`);
      return res.status(404).json({
        success: false,
        message: `Tramite ${numeroTramite} not found`
      });
    }

    console.log(`[Controller] Retrieved tramite: ${numeroTramite}`);

    return res.status(200).json({
      success: true,
      data: tramite
    });

  } catch (error) {
    console.error('[Controller] Error in getTramiteByNumero:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving tramite',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get all tramites for a specific DNI
 * @route GET /api/v1/tramites/dni/:dni
 * @param dni - Citizen DNI (8 digits)
 */
async function getTramitesByDNI(req, res) {
  try {
    const { dni } = req.params;

    // Validate DNI format
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI must be exactly 8 digits'
      });
    }

    const tramites = await Tramite.findByDNI(dni);

    console.log(`[Controller] Found ${tramites.length} tramites for DNI: ${dni}`);

    return res.status(200).json({
      success: true,
      data: tramites,
      count: tramites.length
    });

  } catch (error) {
    console.error('[Controller] Error in getTramitesByDNI:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving tramites by DNI',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Create new tramite
 * @route POST /api/v1/tramites
 * @body { dni, nombreCiudadano, tipoTramite, estado?, fechaInicio?, fechaEstimadaFinalizacion?, documentosPendientes?, proximoPaso?, observaciones?, oficinaAsignada? }
 */
async function createTramite(req, res) {
  try {
    const {
      dni,
      nombreCiudadano,
      tipoTramite,
      estado,
      fechaInicio,
      fechaEstimadaFinalizacion,
      documentosPendientes,
      proximoPaso,
      observaciones,
      oficinaAsignada
    } = req.body;

    // Validate required fields
    if (!dni || !nombreCiudadano || !tipoTramite) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: dni, nombreCiudadano, tipoTramite'
      });
    }

    // Validate DNI format
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI must be exactly 8 digits'
      });
    }

    // Validate nombre length
    if (nombreCiudadano.length < 3 || nombreCiudadano.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'nombreCiudadano must be between 3 and 200 characters'
      });
    }

    // Validate tipoTramite
    if (!Object.values(TipoTramite).includes(tipoTramite)) {
      return res.status(400).json({
        success: false,
        message: `Invalid tipoTramite. Valid values: ${Object.values(TipoTramite).join(', ')}`
      });
    }

    // Validate estado if provided
    if (estado && !Object.values(EstadoTramite).includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Invalid estado. Valid values: ${Object.values(EstadoTramite).join(', ')}`
      });
    }

    // Create tramite
    const tramite = await Tramite.create({
      dni,
      nombreCiudadano,
      tipoTramite,
      estado,
      fechaInicio,
      fechaEstimadaFinalizacion,
      documentosPendientes,
      proximoPaso,
      observaciones,
      oficinaAsignada
    });

    console.log(`[Controller] Created tramite: ${tramite.numeroTramite} for DNI: ${dni}`);

    return res.status(201).json({
      success: true,
      data: tramite,
      message: 'Tramite created successfully'
    });

  } catch (error) {
    console.error('[Controller] Error in createTramite:', error.message);

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating tramite',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Update existing tramite
 * @route PUT /api/v1/tramites/:numeroTramite
 * @param numeroTramite - Procedure number
 * @body - Fields to update (partial update allowed)
 */
async function updateTramite(req, res) {
  try {
    const { numeroTramite } = req.params;
    const updates = req.body;

    // Validate numeroTramite format
    if (!/^TRAM-\d{8}-\d{5}$/.test(numeroTramite)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid procedure number format. Expected: TRAM-YYYYMMDD-XXXXX'
      });
    }

    // Find tramite
    const tramite = await Tramite.findByNumero(numeroTramite);

    if (!tramite) {
      return res.status(404).json({
        success: false,
        message: `Tramite ${numeroTramite} not found`
      });
    }

    // Prevent updating certain fields
    const nonUpdatableFields = ['id', 'numeroTramite', 'createdAt', 'updatedAt'];
    nonUpdatableFields.forEach(field => delete updates[field]);

    // Validate estado if being updated
    if (updates.estado && !Object.values(EstadoTramite).includes(updates.estado)) {
      return res.status(400).json({
        success: false,
        message: `Invalid estado. Valid values: ${Object.values(EstadoTramite).join(', ')}`
      });
    }

    // Validate tipoTramite if being updated
    if (updates.tipoTramite && !Object.values(TipoTramite).includes(updates.tipoTramite)) {
      return res.status(400).json({
        success: false,
        message: `Invalid tipoTramite. Valid values: ${Object.values(TipoTramite).join(', ')}`
      });
    }

    // Validate DNI if being updated
    if (updates.dni && !/^\d{8}$/.test(updates.dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI must be exactly 8 digits'
      });
    }

    // Update tramite
    await tramite.update(updates);

    console.log(`[Controller] Updated tramite: ${numeroTramite}`);

    return res.status(200).json({
      success: true,
      data: tramite,
      message: 'Tramite updated successfully'
    });

  } catch (error) {
    console.error('[Controller] Error in updateTramite:', error.message);

    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error updating tramite',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get statistics
 * @route GET /api/v1/tramites/estadisticas
 */
async function getEstadisticas(req, res) {
  try {
    const stats = await Tramite.getEstadisticas();

    console.log('[Controller] Retrieved statistics');

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[Controller] Error in getEstadisticas:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  getAllTramites,
  getTramiteByNumero,
  getTramitesByDNI,
  createTramite,
  updateTramite,
  getEstadisticas
};
