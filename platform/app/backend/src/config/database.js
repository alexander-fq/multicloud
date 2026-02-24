/**
 * Database configuration module for PostgreSQL with Sequelize ORM
 * Handles connection pooling, SSL, and environment-based configuration
 */

const { Sequelize } = require('sequelize');

// Environment variables with defaults
const {
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_NAME = 'tramites_db',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_SSL = 'false',
  NODE_ENV = 'development'
} = process.env;

/**
 * Sequelize instance configuration
 * Connection pooling optimized for moderate load
 */
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  dialect: 'postgres',

  // Connection pool configuration
  pool: {
    max: 5,           // Maximum number of connection in pool
    min: 0,           // Minimum number of connection in pool
    acquire: 30000,   // Maximum time (ms) to get connection before throwing error
    idle: 10000       // Maximum time (ms) a connection can be idle before being released
  },

  // SSL configuration for production
  dialectOptions: {
    ssl: DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false // Allow self-signed certificates (cloud providers)
    } : false
  },

  // Logging configuration
  logging: NODE_ENV === 'development' ? console.log : false,

  // Timezone configuration
  timezone: '-05:00', // Peru timezone (GMT-5)

  // Prevent Sequelize from pluralizing table names
  define: {
    freezeTableName: true,
    underscored: true,      // Use snake_case for automatically added attributes
    timestamps: true        // Enable createdAt and updatedAt
  }
});

/**
 * Test database connection with retry logic
 * Attempts to connect 3 times with exponential backoff
 * @returns {Promise<boolean>} Connection success status
 */
async function testConnection(retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log(`[DB] Connection established successfully (attempt ${attempt}/${retries})`);
      console.log(`[DB] Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}`);
      console.log(`[DB] SSL: ${DB_SSL === 'true' ? 'enabled' : 'disabled'}`);
      return true;
    } catch (error) {
      console.error(`[DB] Connection attempt ${attempt}/${retries} failed:`, error.message);

      if (attempt < retries) {
        console.log(`[DB] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error('[DB] All connection attempts failed');
        throw error;
      }
    }
  }
}

/**
 * Synchronize all models with database
 * WARNING: In production, use migrations instead of sync
 * @param {Object} options - Sequelize sync options
 */
async function syncDatabase(options = {}) {
  try {
    const defaultOptions = {
      force: false,  // Don't drop tables
      alter: NODE_ENV === 'development' // Alter tables in development only
    };

    await sequelize.sync({ ...defaultOptions, ...options });
    console.log('[DB] Database synchronized successfully');
  } catch (error) {
    console.error('[DB] Error synchronizing database:', error.message);
    throw error;
  }
}

/**
 * Close database connection gracefully
 * Should be called during application shutdown
 */
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('[DB] Connection closed successfully');
  } catch (error) {
    console.error('[DB] Error closing connection:', error.message);
    throw error;
  }
}

/**
 * Get connection pool status
 * Useful for monitoring and debugging
 * @returns {Object} Pool statistics
 */
function getPoolStatus() {
  const pool = sequelize.connectionManager.pool;
  return {
    size: pool.size,
    available: pool.available,
    using: pool.using,
    waiting: pool.waiting
  };
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
  getPoolStatus
};
