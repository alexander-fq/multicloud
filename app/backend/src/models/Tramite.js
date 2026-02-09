/**
 * Tramite Model
 * Represents a government procedure in the system
 *
 * Features:
 * - UUID primary key for distributed system compatibility
 * - Auto-generated unique procedure number (numeroTramite)
 * - ENUMs for categorical fields (tipoTramite, estado)
 * - PostgreSQL array for pending documents
 * - Indexes on frequently queried fields
 * - Comprehensive validations
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Enum: Procedure Types
 */
const TipoTramite = {
  DNI: 'DNI',
  PASAPORTE: 'PASAPORTE',
  LICENCIA: 'LICENCIA',
  CERTIFICADO: 'CERTIFICADO',
  REGISTRO: 'REGISTRO'
};

/**
 * Enum: Procedure Status
 */
const EstadoTramite = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  OBSERVADO: 'OBSERVADO',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
  FINALIZADO: 'FINALIZADO'
};

/**
 * Generate unique procedure number
 * Format: TRAM-YYYYMMDD-XXXXX
 * Example: TRAM-20260208-00001
 */
function generateNumeroTramite() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');

  return `TRAM-${year}${month}${day}-${random}`;
}

/**
 * Tramite Model Definition
 */
const Tramite = sequelize.define('Tramite', {
  // Primary Key - UUID
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the procedure'
  },

  // Unique procedure number (auto-generated)
  numeroTramite: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: {
      name: 'unique_numero_tramite',
      msg: 'Procedure number already exists'
    },
    validate: {
      notEmpty: {
        msg: 'Procedure number cannot be empty'
      },
      is: {
        args: /^TRAM-\d{8}-\d{5}$/,
        msg: 'Invalid procedure number format'
      }
    },
    comment: 'Unique procedure identifier (format: TRAM-YYYYMMDD-XXXXX)'
  },

  // Citizen identification - DNI (Peru)
  dni: {
    type: DataTypes.STRING(8),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'DNI cannot be empty'
      },
      len: {
        args: [8, 8],
        msg: 'DNI must be exactly 8 digits'
      },
      isNumeric: {
        msg: 'DNI must contain only numbers'
      }
    },
    comment: 'Citizen DNI (8 digits)'
  },

  // Citizen full name
  nombreCiudadano: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Citizen name cannot be empty'
      },
      len: {
        args: [3, 200],
        msg: 'Citizen name must be between 3 and 200 characters'
      }
    },
    comment: 'Full name of the citizen'
  },

  // Procedure type (ENUM)
  tipoTramite: {
    type: DataTypes.ENUM(...Object.values(TipoTramite)),
    allowNull: false,
    validate: {
      isIn: {
        args: [Object.values(TipoTramite)],
        msg: 'Invalid procedure type'
      }
    },
    comment: 'Type of procedure (DNI, PASAPORTE, LICENCIA, CERTIFICADO, REGISTRO)'
  },

  // Procedure status (ENUM)
  estado: {
    type: DataTypes.ENUM(...Object.values(EstadoTramite)),
    allowNull: false,
    defaultValue: EstadoTramite.PENDIENTE,
    validate: {
      isIn: {
        args: [Object.values(EstadoTramite)],
        msg: 'Invalid procedure status'
      }
    },
    comment: 'Current status of the procedure'
  },

  // Start date
  fechaInicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Start date must be a valid date'
      }
    },
    comment: 'Date when the procedure started'
  },

  // Estimated completion date
  fechaEstimadaFinalizacion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Estimated completion date must be a valid date'
      },
      isAfterStart(value) {
        if (value && this.fechaInicio && new Date(value) < new Date(this.fechaInicio)) {
          throw new Error('Estimated completion date must be after start date');
        }
      }
    },
    comment: 'Estimated date for procedure completion'
  },

  // Pending documents (PostgreSQL Array)
  documentosPendientes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    validate: {
      isArrayOfStrings(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('Pending documents must be an array');
        }
        if (value && value.some(item => typeof item !== 'string')) {
          throw new Error('All pending documents must be strings');
        }
      }
    },
    comment: 'List of pending documents'
  },

  // Next step description
  proximoPaso: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Next step description cannot exceed 1000 characters'
      }
    },
    comment: 'Description of the next step in the procedure'
  },

  // Observations or notes
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'Observations cannot exceed 2000 characters'
      }
    },
    comment: 'Additional observations or notes'
  },

  // Assigned office
  oficinaAsignada: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'Office name cannot exceed 100 characters'
      }
    },
    comment: 'Office responsible for the procedure'
  }

}, {
  // Model options
  tableName: 'tramites',
  timestamps: true,
  underscored: true,

  // Indexes for performance
  indexes: [
    {
      name: 'idx_tramites_numero_tramite',
      unique: true,
      fields: ['numero_tramite']
    },
    {
      name: 'idx_tramites_dni',
      fields: ['dni']
    },
    {
      name: 'idx_tramites_estado',
      fields: ['estado']
    },
    {
      name: 'idx_tramites_dni_estado',
      fields: ['dni', 'estado']
    },
    {
      name: 'idx_tramites_tipo_tramite',
      fields: ['tipo_tramite']
    },
    {
      name: 'idx_tramites_fecha_inicio',
      fields: ['fecha_inicio']
    }
  ],

  // Hooks
  hooks: {
    /**
     * Before validation: Generate numeroTramite if not provided
     */
    beforeValidate: (tramite) => {
      if (!tramite.numeroTramite) {
        tramite.numeroTramite = generateNumeroTramite();
      }
    },

    /**
     * Before create: Set default values
     */
    beforeCreate: (tramite) => {
      // Ensure documentosPendientes is an array
      if (!tramite.documentosPendientes) {
        tramite.documentosPendientes = [];
      }

      // Set default estimated completion date if not provided (30 days from start)
      if (!tramite.fechaEstimadaFinalizacion && tramite.fechaInicio) {
        const estimatedDate = new Date(tramite.fechaInicio);
        estimatedDate.setDate(estimatedDate.getDate() + 30);
        tramite.fechaEstimadaFinalizacion = estimatedDate.toISOString().split('T')[0];
      }
    }
  }
});

/**
 * Class Methods
 */

/**
 * Find procedures by DNI
 * @param {string} dni - Citizen DNI
 * @returns {Promise<Array>} List of procedures
 */
Tramite.findByDNI = async function(dni) {
  return await this.findAll({
    where: { dni },
    order: [['fecha_inicio', 'DESC']]
  });
};

/**
 * Find procedure by numero
 * @param {string} numeroTramite - Procedure number
 * @returns {Promise<Object>} Procedure or null
 */
Tramite.findByNumero = async function(numeroTramite) {
  return await this.findOne({
    where: { numeroTramite }
  });
};

/**
 * Get procedures by status
 * @param {string} estado - Status
 * @returns {Promise<Array>} List of procedures
 */
Tramite.findByEstado = async function(estado) {
  return await this.findAll({
    where: { estado },
    order: [['fecha_inicio', 'DESC']]
  });
};

/**
 * Get statistics
 * @returns {Promise<Object>} Statistics object
 */
Tramite.getEstadisticas = async function() {
  const total = await this.count();

  const porEstado = await this.findAll({
    attributes: [
      'estado',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total']
    ],
    group: ['estado'],
    raw: true
  });

  const porTipo = await this.findAll({
    attributes: [
      'tipo_tramite',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total']
    ],
    group: ['tipo_tramite'],
    raw: true
  });

  return {
    total,
    porEstado: porEstado.reduce((acc, item) => {
      acc[item.estado] = parseInt(item.total);
      return acc;
    }, {}),
    porTipo: porTipo.reduce((acc, item) => {
      acc[item.tipo_tramite] = parseInt(item.total);
      return acc;
    }, {})
  };
};

// Export model and enums
module.exports = {
  Tramite,
  TipoTramite,
  EstadoTramite
};
