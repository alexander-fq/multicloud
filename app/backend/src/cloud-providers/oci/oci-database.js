/**
 * OCI Database Service
 * Handles database operations for Oracle Cloud Infrastructure
 * Uses PostgreSQL (cloud-agnostic - same as AWS)
 */

const { Pool } = require('pg');
const logger = require('../../utils/logger');

class OCIDatabaseService {
  constructor() {
    this.pool = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection pool
   * OCI Database Service uses standard PostgreSQL protocol
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.pool = new Pool({
        host: process.env.OCI_DB_HOST,
        port: process.env.OCI_DB_PORT || 5432,
        database: process.env.OCI_DB_NAME,
        user: process.env.OCI_DB_USER,
        password: process.env.OCI_DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });

      // Test connection
      await this.testConnection();

      this.initialized = true;
      logger.info('OCI Database connection pool initialized successfully');
    } catch (error) {
      logger.error('OCI Database initialization failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute a database query
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(text, params) {
    try {
      await this.initialize();

      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Executed OCI database query', {
        duration,
        rows: result.rowCount
      });

      return result;
    } catch (error) {
      logger.error('OCI database query failed', {
        error: error.message,
        query: text
      });
      throw error;
    }
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      if (!this.pool) {
        return false;
      }

      const result = await this.pool.query('SELECT NOW() as current_time, version() as pg_version');

      logger.info('OCI Database connection test successful', {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].pg_version
      });

      return true;
    } catch (error) {
      logger.error('OCI Database connection test failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get connection pool statistics
   * @returns {Object} Pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return {
        total: 0,
        idle: 0,
        waiting: 0
      };
    }

    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount
    };
  }

  /**
   * Execute a transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    await this.initialize();

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');

      logger.debug('OCI database transaction committed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('OCI database transaction rolled back', {
        error: error.message
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the database connection pool
   * @returns {Promise<void>}
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.initialized = false;
      logger.info('OCI Database connection pool closed');
    }
  }

  /**
   * Check if database is healthy
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    try {
      const isConnected = await this.testConnection();
      const stats = this.getPoolStats();

      return {
        healthy: isConnected,
        stats,
        provider: 'oci',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        provider: 'oci',
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = OCIDatabaseService;
