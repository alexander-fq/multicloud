/**
 * Application End-to-End Test
 * Tests the complete application by making real HTTP requests
 * Run with: node test-app.js
 */

const http = require('http');
const { app, initializeDatabase } = require('./src/app');
const { syncDatabase, closeConnection } = require('./src/config/database');

const PORT = 3001; // Use different port for testing
const BASE_URL = `http://localhost:${PORT}`;

let server;

/**
 * Make HTTP request helper
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Run tests
 */
async function runTests() {
  console.log('='.repeat(70));
  console.log('END-TO-END APPLICATION TEST');
  console.log('='.repeat(70));
  console.log();

  try {
    // Initialize database
    console.log('[SETUP] Initializing database...');
    await initializeDatabase();
    await syncDatabase({ force: true });
    console.log('[SETUP] ✓ Database ready\n');

    // Start server
    console.log('[SETUP] Starting test server...');
    server = app.listen(PORT);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[SETUP] ✓ Server running on port ${PORT}\n`);

    // Test 1: Root endpoint
    console.log('[TEST 1] GET / - Root endpoint');
    const test1 = await makeRequest('GET', '/');
    console.log(`  Status: ${test1.status}`);
    console.log(`  Success: ${test1.data.success}`);
    console.log(`  Message: ${test1.data.message}`);
    console.log();

    // Test 2: Health check
    console.log('[TEST 2] GET /api/v1/health - Health check');
    const test2 = await makeRequest('GET', '/api/v1/health');
    console.log(`  Status: ${test2.status}`);
    console.log(`  Success: ${test2.data.success}`);
    console.log(`  Message: ${test2.data.message}`);
    console.log();

    // Test 3: API info
    console.log('[TEST 3] GET /api/v1 - API info');
    const test3 = await makeRequest('GET', '/api/v1');
    console.log(`  Status: ${test3.status}`);
    console.log(`  Success: ${test3.data.success}`);
    console.log(`  Version: ${test3.data.version}`);
    console.log();

    // Test 4: Create tramite
    console.log('[TEST 4] POST /api/v1/tramites - Create tramite');
    const test4 = await makeRequest('POST', '/api/v1/tramites', {
      dni: '12345678',
      nombreCiudadano: 'Juan Pérez García',
      tipoTramite: 'DNI',
      documentosPendientes: ['Foto', 'Pago de tasa']
    });
    console.log(`  Status: ${test4.status}`);
    console.log(`  Success: ${test4.data.success}`);
    console.log(`  Número: ${test4.data.data?.numeroTramite}`);
    const numeroTramite = test4.data.data?.numeroTramite;
    console.log();

    // Test 5: Get all tramites
    console.log('[TEST 5] GET /api/v1/tramites - Get all tramites');
    const test5 = await makeRequest('GET', '/api/v1/tramites');
    console.log(`  Status: ${test5.status}`);
    console.log(`  Success: ${test5.data.success}`);
    console.log(`  Results: ${test5.data.data?.length}`);
    console.log(`  Total: ${test5.data.pagination?.total}`);
    console.log();

    // Test 6: Get tramite by numero
    console.log('[TEST 6] GET /api/v1/tramites/numero/:num - Get by numero');
    const test6 = await makeRequest('GET', `/api/v1/tramites/numero/${numeroTramite}`);
    console.log(`  Status: ${test6.status}`);
    console.log(`  Success: ${test6.data.success}`);
    console.log(`  Found: ${test6.data.data?.numeroTramite}`);
    console.log();

    // Test 7: Get tramites by DNI
    console.log('[TEST 7] GET /api/v1/tramites/dni/:dni - Get by DNI');
    const test7 = await makeRequest('GET', '/api/v1/tramites/dni/12345678');
    console.log(`  Status: ${test7.status}`);
    console.log(`  Success: ${test7.data.success}`);
    console.log(`  Count: ${test7.data.count}`);
    console.log();

    // Test 8: Update tramite
    console.log('[TEST 8] PUT /api/v1/tramites/:num - Update tramite');
    const test8 = await makeRequest('PUT', `/api/v1/tramites/${numeroTramite}`, {
      estado: 'EN_PROCESO',
      proximoPaso: 'Revisar documentos en oficina'
    });
    console.log(`  Status: ${test8.status}`);
    console.log(`  Success: ${test8.data.success}`);
    console.log(`  New estado: ${test8.data.data?.estado}`);
    console.log();

    // Test 9: Get statistics
    console.log('[TEST 9] GET /api/v1/tramites/estadisticas - Get statistics');
    const test9 = await makeRequest('GET', '/api/v1/tramites/estadisticas');
    console.log(`  Status: ${test9.status}`);
    console.log(`  Success: ${test9.data.success}`);
    console.log(`  Total: ${test9.data.data?.total}`);
    console.log();

    // Test 10: Validation error
    console.log('[TEST 10] POST /api/v1/tramites - Validation error (invalid DNI)');
    const test10 = await makeRequest('POST', '/api/v1/tramites', {
      dni: '123',
      nombreCiudadano: 'Test User',
      tipoTramite: 'DNI'
    });
    console.log(`  Status: ${test10.status}`);
    console.log(`  Success: ${test10.data.success}`);
    console.log(`  Message: ${test10.data.message}`);
    console.log();

    // Test 11: Not found error
    console.log('[TEST 11] GET /api/v1/tramites/numero/INVALID - Not found');
    const test11 = await makeRequest('GET', '/api/v1/tramites/numero/TRAM-20260101-99999');
    console.log(`  Status: ${test11.status}`);
    console.log(`  Success: ${test11.data.success}`);
    console.log(`  Message: ${test11.data.message}`);
    console.log();

    // Test 12: Invalid route
    console.log('[TEST 12] GET /api/v1/invalid - 404 Not Found');
    const test12 = await makeRequest('GET', '/api/v1/invalid');
    console.log(`  Status: ${test12.status}`);
    console.log(`  Success: ${test12.data.success}`);
    console.log(`  Message: ${test12.data.message}`);
    console.log();

    console.log('='.repeat(70));
    console.log('✓ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n✗ TEST FAILED!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

  } finally {
    // Cleanup
    console.log('\n[CLEANUP] Closing server and database...');
    if (server) {
      server.close();
    }
    await closeConnection();
    console.log('[CLEANUP] ✓ Cleanup complete');
    process.exit(0);
  }
}

// Run tests
runTests();
