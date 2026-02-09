/**
 * Controller Test Script
 * Tests controller methods with mock req/res objects
 * Run with: node test-controller.js
 */

require('dotenv').config();
const { testConnection, syncDatabase, closeConnection } = require('./src/config/database');
const {
  getAllTramites,
  getTramiteByNumero,
  getTramitesByDNI,
  createTramite,
  updateTramite,
  getEstadisticas
} = require('./src/controllers/tramiteController');
const { Tramite, TipoTramite, EstadoTramite } = require('./src/models/Tramite');

// Mock response object
function createMockRes() {
  const res = {
    statusCode: null,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  return res;
}

async function runControllerTests() {
  console.log('='.repeat(70));
  console.log('CONTROLLER TESTS');
  console.log('='.repeat(70));
  console.log();

  try {
    // Connect to database
    console.log('[SETUP] Connecting to database...');
    await testConnection();
    await syncDatabase({ force: true });
    console.log('[SETUP] ✓ Database ready\n');

    // Test 1: createTramite
    console.log('[TEST 1] createTramite - Valid data');
    let req = {
      body: {
        dni: '12345678',
        nombreCiudadano: 'Juan Pérez García',
        tipoTramite: TipoTramite.DNI,
        documentosPendientes: ['Foto', 'Pago de tasa'],
        oficinaAsignada: 'Oficina Central'
      }
    };
    let res = createMockRes();
    await createTramite(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Número: ${res.data.data?.numeroTramite}`);
    console.log(`Message: ${res.data.message}`);
    const tramite1Numero = res.data.data?.numeroTramite;
    console.log();

    // Test 2: createTramite - Missing required fields
    console.log('[TEST 2] createTramite - Missing required fields');
    req = { body: { dni: '87654321' } };
    res = createMockRes();
    await createTramite(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Message: ${res.data.message}`);
    console.log();

    // Test 3: createTramite - Invalid DNI
    console.log('[TEST 3] createTramite - Invalid DNI');
    req = {
      body: {
        dni: '123',
        nombreCiudadano: 'Test User',
        tipoTramite: TipoTramite.PASAPORTE
      }
    };
    res = createMockRes();
    await createTramite(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Message: ${res.data.message}`);
    console.log();

    // Create more test data
    console.log('[SETUP] Creating additional test data...');
    await Tramite.create({
      dni: '11111111',
      nombreCiudadano: 'María López',
      tipoTramite: TipoTramite.PASAPORTE,
      estado: EstadoTramite.EN_PROCESO
    });
    await Tramite.create({
      dni: '12345678',
      nombreCiudadano: 'Juan Pérez García',
      tipoTramite: TipoTramite.LICENCIA,
      estado: EstadoTramite.APROBADO
    });
    await Tramite.create({
      dni: '22222222',
      nombreCiudadano: 'Carlos Sánchez',
      tipoTramite: TipoTramite.CERTIFICADO,
      estado: EstadoTramite.FINALIZADO
    });
    console.log('[SETUP] ✓ Additional data created\n');

    // Test 4: getAllTramites - No filters
    console.log('[TEST 4] getAllTramites - No filters (page 1, limit 10)');
    req = { query: {} };
    res = createMockRes();
    await getAllTramites(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Results: ${res.data.data?.length}`);
    console.log(`Pagination:`, res.data.pagination);
    console.log();

    // Test 5: getAllTramites - With pagination
    console.log('[TEST 5] getAllTramites - Custom pagination (page 1, limit 2)');
    req = { query: { page: '1', limit: '2' } };
    res = createMockRes();
    await getAllTramites(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Results: ${res.data.data?.length}`);
    console.log(`Pagination:`, res.data.pagination);
    console.log();

    // Test 6: getAllTramites - Filter by estado
    console.log('[TEST 6] getAllTramites - Filter by estado=PENDIENTE');
    req = { query: { estado: EstadoTramite.PENDIENTE } };
    res = createMockRes();
    await getAllTramites(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Results: ${res.data.data?.length}`);
    console.log();

    // Test 7: getAllTramites - Filter by DNI
    console.log('[TEST 7] getAllTramites - Filter by DNI=12345678');
    req = { query: { dni: '12345678' } };
    res = createMockRes();
    await getAllTramites(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Results: ${res.data.data?.length}`);
    console.log();

    // Test 8: getTramiteByNumero - Valid numero
    console.log('[TEST 8] getTramiteByNumero - Valid numero');
    req = { params: { numeroTramite: tramite1Numero } };
    res = createMockRes();
    await getTramiteByNumero(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Found: ${res.data.data?.numeroTramite}`);
    console.log();

    // Test 9: getTramiteByNumero - Not found
    console.log('[TEST 9] getTramiteByNumero - Not found');
    req = { params: { numeroTramite: 'TRAM-20260101-99999' } };
    res = createMockRes();
    await getTramiteByNumero(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Message: ${res.data.message}`);
    console.log();

    // Test 10: getTramiteByNumero - Invalid format
    console.log('[TEST 10] getTramiteByNumero - Invalid format');
    req = { params: { numeroTramite: 'INVALID' } };
    res = createMockRes();
    await getTramiteByNumero(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Message: ${res.data.message}`);
    console.log();

    // Test 11: getTramitesByDNI - Valid DNI
    console.log('[TEST 11] getTramitesByDNI - Valid DNI (12345678)');
    req = { params: { dni: '12345678' } };
    res = createMockRes();
    await getTramitesByDNI(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Count: ${res.data.count}`);
    console.log();

    // Test 12: getTramitesByDNI - Invalid DNI
    console.log('[TEST 12] getTramitesByDNI - Invalid DNI');
    req = { params: { dni: '123' } };
    res = createMockRes();
    await getTramitesByDNI(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Message: ${res.data.message}`);
    console.log();

    // Test 13: updateTramite - Valid update
    console.log('[TEST 13] updateTramite - Valid update');
    req = {
      params: { numeroTramite: tramite1Numero },
      body: {
        estado: EstadoTramite.EN_PROCESO,
        proximoPaso: 'Revisar documentos en oficina',
        observaciones: 'Documentos recibidos correctamente'
      }
    };
    res = createMockRes();
    await updateTramite(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`New estado: ${res.data.data?.estado}`);
    console.log(`Message: ${res.data.message}`);
    console.log();

    // Test 14: updateTramite - Not found
    console.log('[TEST 14] updateTramite - Not found');
    req = {
      params: { numeroTramite: 'TRAM-20260101-99999' },
      body: { estado: EstadoTramite.APROBADO }
    };
    res = createMockRes();
    await updateTramite(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Message: ${res.data.message}`);
    console.log();

    // Test 15: updateTramite - Invalid estado
    console.log('[TEST 15] updateTramite - Invalid estado');
    req = {
      params: { numeroTramite: tramite1Numero },
      body: { estado: 'INVALID_STATUS' }
    };
    res = createMockRes();
    await updateTramite(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Message: ${res.data.message}`);
    console.log();

    // Test 16: getEstadisticas
    console.log('[TEST 16] getEstadisticas');
    req = {};
    res = createMockRes();
    await getEstadisticas(req, res);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Success: ${res.data.success}`);
    console.log(`Statistics:`, JSON.stringify(res.data.data, null, 2));
    console.log();

    console.log('='.repeat(70));
    console.log('✓ ALL CONTROLLER TESTS COMPLETED');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n✗ TEST FAILED!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);

  } finally {
    await closeConnection();
  }
}

runControllerTests();
