/**
 * Database connection test script
 * Run with: node test-db-connection.js
 */

require('dotenv').config();
const { testConnection, getPoolStatus, closeConnection } = require('./src/config/database');

async function runTest() {
  console.log('='.repeat(60));
  console.log('DATABASE CONNECTION TEST');
  console.log('='.repeat(60));
  console.log();

  try {
    // Test connection
    console.log('[TEST] Testing database connection...');
    await testConnection();
    console.log();

    // Get pool status
    console.log('[TEST] Connection pool status:');
    const poolStatus = getPoolStatus();
    console.log(JSON.stringify(poolStatus, null, 2));
    console.log();

    console.log('[TEST] ✓ All tests passed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('[TEST] ✗ Test failed!');
    console.error('[TEST] Error:', error.message);
    console.log('='.repeat(60));
    process.exit(1);

  } finally {
    // Close connection
    await closeConnection();
  }
}

runTest();
