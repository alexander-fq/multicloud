/**
 * Validation Middleware
 * Uses Joi for request validation
 *
 * Validates request body, params, and query parameters
 * before they reach the controller
 */

const Joi = require('joi');

/**
 * Validation schemas for Tramite endpoints
 */
const schemas = {
  // Create tramite
  createTramite: Joi.object({
    dni: Joi.string()
      .length(8)
      .pattern(/^\d+$/)
      .required()
      .messages({
        'string.length': 'DNI must be exactly 8 digits',
        'string.pattern.base': 'DNI must contain only numbers',
        'any.required': 'DNI is required'
      }),

    nombreCiudadano: Joi.string()
      .min(3)
      .max(200)
      .required()
      .messages({
        'string.min': 'Citizen name must be at least 3 characters',
        'string.max': 'Citizen name cannot exceed 200 characters',
        'any.required': 'Citizen name is required'
      }),

    tipoTramite: Joi.string()
      .valid('DNI', 'PASAPORTE', 'LICENCIA', 'CERTIFICADO', 'REGISTRO')
      .required()
      .messages({
        'any.only': 'Invalid procedure type. Valid values: DNI, PASAPORTE, LICENCIA, CERTIFICADO, REGISTRO',
        'any.required': 'Procedure type is required'
      }),

    estado: Joi.string()
      .valid('PENDIENTE', 'EN_PROCESO', 'OBSERVADO', 'APROBADO', 'RECHAZADO', 'FINALIZADO')
      .optional()
      .messages({
        'any.only': 'Invalid status. Valid values: PENDIENTE, EN_PROCESO, OBSERVADO, APROBADO, RECHAZADO, FINALIZADO'
      }),

    fechaInicio: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
      }),

    fechaEstimadaFinalizacion: Joi.date()
      .iso()
      .greater(Joi.ref('fechaInicio'))
      .optional()
      .messages({
        'date.format': 'Estimated completion date must be in ISO format (YYYY-MM-DD)',
        'date.greater': 'Estimated completion date must be after start date'
      }),

    documentosPendientes: Joi.array()
      .items(Joi.string())
      .optional()
      .messages({
        'array.base': 'Pending documents must be an array of strings'
      }),

    proximoPaso: Joi.string()
      .max(1000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Next step cannot exceed 1000 characters'
      }),

    observaciones: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Observations cannot exceed 2000 characters'
      }),

    oficinaAsignada: Joi.string()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Office name cannot exceed 100 characters'
      })
  }),

  // Update tramite (all fields optional except numeroTramite in params)
  updateTramite: Joi.object({
    dni: Joi.string()
      .length(8)
      .pattern(/^\d+$/)
      .optional()
      .messages({
        'string.length': 'DNI must be exactly 8 digits',
        'string.pattern.base': 'DNI must contain only numbers'
      }),

    nombreCiudadano: Joi.string()
      .min(3)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Citizen name must be at least 3 characters',
        'string.max': 'Citizen name cannot exceed 200 characters'
      }),

    tipoTramite: Joi.string()
      .valid('DNI', 'PASAPORTE', 'LICENCIA', 'CERTIFICADO', 'REGISTRO')
      .optional()
      .messages({
        'any.only': 'Invalid procedure type'
      }),

    estado: Joi.string()
      .valid('PENDIENTE', 'EN_PROCESO', 'OBSERVADO', 'APROBADO', 'RECHAZADO', 'FINALIZADO')
      .optional()
      .messages({
        'any.only': 'Invalid status'
      }),

    fechaInicio: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.format': 'Start date must be in ISO format'
      }),

    fechaEstimadaFinalizacion: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.format': 'Estimated completion date must be in ISO format'
      }),

    documentosPendientes: Joi.array()
      .items(Joi.string())
      .optional(),

    proximoPaso: Joi.string()
      .max(1000)
      .optional()
      .allow(''),

    observaciones: Joi.string()
      .max(2000)
      .optional()
      .allow(''),

    oficinaAsignada: Joi.string()
      .max(100)
      .optional()
      .allow('')
  }),

  // URL params validation
  tramiteNumeroParam: Joi.object({
    numeroTramite: Joi.string()
      .pattern(/^TRAM-\d{8}-\d{5}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid procedure number format. Expected: TRAM-YYYYMMDD-XXXXX',
        'any.required': 'Procedure number is required'
      })
  }),

  dniParam: Joi.object({
    dni: Joi.string()
      .length(8)
      .pattern(/^\d+$/)
      .required()
      .messages({
        'string.length': 'DNI must be exactly 8 digits',
        'string.pattern.base': 'DNI must contain only numbers',
        'any.required': 'DNI is required'
      })
  }),

  // Query params validation for getAllTramites
  tramiteQuery: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),

    estado: Joi.string()
      .valid('PENDIENTE', 'EN_PROCESO', 'OBSERVADO', 'APROBADO', 'RECHAZADO', 'FINALIZADO')
      .optional()
      .messages({
        'any.only': 'Invalid status filter'
      }),

    tipoTramite: Joi.string()
      .valid('DNI', 'PASAPORTE', 'LICENCIA', 'CERTIFICADO', 'REGISTRO')
      .optional()
      .messages({
        'any.only': 'Invalid procedure type filter'
      }),

    dni: Joi.string()
      .length(8)
      .pattern(/^\d+$/)
      .optional()
      .messages({
        'string.length': 'DNI must be exactly 8 digits',
        'string.pattern.base': 'DNI must contain only numbers'
      })
  })
};

/**
 * Validation middleware factory
 * Creates middleware that validates request against a schema
 *
 * @param {Object} schema - Joi schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,  // Return all errors, not just the first one
      stripUnknown: true  // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    // Replace request property with validated value (with defaults and type coercion)
    req[property] = value;
    next();
  };
}

/**
 * Pre-configured validation middleware for common scenarios
 */
const validators = {
  // POST /tramites
  createTramite: validate(schemas.createTramite, 'body'),

  // PUT /tramites/:numeroTramite
  updateTramite: validate(schemas.updateTramite, 'body'),
  updateTramiteParams: validate(schemas.tramiteNumeroParam, 'params'),

  // GET /tramites/numero/:numeroTramite
  getTramiteByNumero: validate(schemas.tramiteNumeroParam, 'params'),

  // GET /tramites/dni/:dni
  getTramitesByDNI: validate(schemas.dniParam, 'params'),

  // GET /tramites?page=1&limit=10&...
  getAllTramitesQuery: validate(schemas.tramiteQuery, 'query')
};

module.exports = {
  validate,
  validators,
  schemas
};
