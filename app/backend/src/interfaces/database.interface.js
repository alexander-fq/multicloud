/**
 * Database Service Interface
 * All cloud providers must implement these methods
 */
class DatabaseService {
  /**
   * Execute a query
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} - Query results
   */
  async query(query, params = []) {
    throw new Error('Method query() must be implemented');
  }

  /**
   * Get connection pool statistics
   * @returns {Promise<Object>} - Pool stats
   */
  async getPoolStats() {
    throw new Error('Method getPoolStats() must be implemented');
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    throw new Error('Method testConnection() must be implemented');
  }

  /**
   * Close database connections
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('Method close() must be implemented');
  }
}

module.exports = DatabaseService;
