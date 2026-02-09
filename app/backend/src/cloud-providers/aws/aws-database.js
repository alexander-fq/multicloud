const DatabaseService = require('../../interfaces/database.interface');
const { Pool } = require('pg');

class AWSDatabase extends DatabaseService {
  constructor() {
    super();
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected database error', err);
    });
  }

  async query(query, params = []) {
    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Database Query Error: ${error.message}`);
    }
  }

  async getPoolStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount
    };
  }

  async testConnection() {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return !!result;
    } catch (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = AWSDatabase;
