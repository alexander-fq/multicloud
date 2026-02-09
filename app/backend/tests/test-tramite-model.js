/**
 * Tramite Model Test Script
 * Tests model creation, validation, and database operations
 * Run with: node test-tramite-model.js
 */

require('dotenv').config();
const { testConnection, syncDatabase, closeConnection } = require('./src/config/database');
const { Tramite, TipoTramite, EstadoTramite } = require('./src/models/Tramite');
const { sequelize } = require('./src/config/database');

async function runTests() {
  console.log('='.repeat(70));
  console.log('TRAMITE MODEL TEST');
  console.log('='.repeat(70));
  console.log();

  try {
    // Step 1: Test database connection
    console.log('[STEP 1] Testing database connection...');
    await testConnection();
    console.log('✓ Database connection successful\n');

    // Step 2: Sync model with database
    console.log('[STEP 2] Synchronizing model with database...');
    await syncDatabase({ force: true }); // WARNING: This drops existing tables
    console.log('✓ Model synchronized successfully\n');

    // Step 3: Verify table was created
    console.log('[STEP 3] Verifying table structure...');
    const tableDescription = await sequelize.getQueryInterface().describeTable('tramites');
    console.log(`✓ Table 'tramites' created with ${Object.keys(tableDescription).length} columns`);
    console.log('Columns:', Object.keys(tableDescription).join(', '));
    console.log();

    // Step 4: Create test record with minimal data
    console.log('[STEP 4] Creating test record (minimal data)...');
    const tramite1 = await Tramite.create({
      dni: '12345678',
      nombreCiudadano: 'Juan Pérez García',
      tipoTramite: TipoTramite.DNI
    });
    console.log('✓ Test record created:');
    console.log(`  ID: ${tramite1.id}`);
    console.log(`  Número: ${tramite1.numeroTramite}`);
    console.log(`  Estado: ${tramite1.estado}`);
    console.log(`  Fecha Inicio: ${tramite1.fechaInicio}`);
    console.log(`  Fecha Estimada: ${tramite1.fechaEstimadaFinalizacion}`);
    console.log();

    // Step 5: Create record with complete data
    console.log('[STEP 5] Creating test record (complete data)...');
    const tramite2 = await Tramite.create({
      dni: '87654321',
      nombreCiudadano: 'María López Rodríguez',
      tipoTramite: TipoTramite.PASAPORTE,
      estado: EstadoTramite.EN_PROCESO,
      fechaInicio: '2026-02-01',
      fechaEstimadaFinalizacion: '2026-03-15',
      documentosPendientes: ['Partida de nacimiento', 'Foto tamaño pasaporte', 'Pago de tasa'],
      proximoPaso: 'Presentarse en oficina con documentos originales',
      observaciones: 'Ciudadano solicitó trámite urgente',
      oficinaAsignada: 'Oficina Central - Lima'
    });
    console.log('✓ Complete record created:');
    console.log(`  ID: ${tramite2.id}`);
    console.log(`  Número: ${tramite2.numeroTramite}`);
    console.log(`  Documentos pendientes: ${tramite2.documentosPendientes.length}`);
    console.log();

    // Step 6: Test findByDNI
    console.log('[STEP 6] Testing findByDNI...');
    const tramitesDni1 = await Tramite.findByDNI('12345678');
    console.log(`✓ Found ${tramitesDni1.length} procedure(s) for DNI 12345678`);
    console.log();

    // Step 7: Test findByNumero
    console.log('[STEP 7] Testing findByNumero...');
    const tramiteFound = await Tramite.findByNumero(tramite1.numeroTramite);
    console.log(`✓ Found procedure: ${tramiteFound.numeroTramite} - ${tramiteFound.nombreCiudadano}`);
    console.log();

    // Step 8: Test findByEstado
    console.log('[STEP 8] Testing findByEstado...');
    const tramitesPendientes = await Tramite.findByEstado(EstadoTramite.PENDIENTE);
    const tramitesEnProceso = await Tramite.findByEstado(EstadoTramite.EN_PROCESO);
    console.log(`✓ PENDIENTE: ${tramitesPendientes.length} procedure(s)`);
    console.log(`✓ EN_PROCESO: ${tramitesEnProceso.length} procedure(s)`);
    console.log();

    // Step 9: Create multiple records for statistics
    console.log('[STEP 9] Creating additional test records...');
    await Promise.all([
      Tramite.create({
        dni: '11111111',
        nombreCiudadano: 'Carlos Martínez',
        tipoTramite: TipoTramite.LICENCIA,
        estado: EstadoTramite.APROBADO
      }),
      Tramite.create({
        dni: '22222222',
        nombreCiudadano: 'Ana Torres',
        tipoTramite: TipoTramite.CERTIFICADO,
        estado: EstadoTramite.OBSERVADO
      }),
      Tramite.create({
        dni: '33333333',
        nombreCiudadano: 'Roberto Sánchez',
        tipoTramite: TipoTramite.REGISTRO,
        estado: EstadoTramite.FINALIZADO
      })
    ]);
    console.log('✓ Created 3 additional records');
    console.log();

    // Step 10: Test statistics
    console.log('[STEP 10] Testing getEstadisticas...');
    const stats = await Tramite.getEstadisticas();
    console.log('✓ Statistics retrieved:');
    console.log(`  Total procedures: ${stats.total}`);
    console.log('  By status:', JSON.stringify(stats.porEstado, null, 2));
    console.log('  By type:', JSON.stringify(stats.porTipo, null, 2));
    console.log();

    // Step 11: Test validation (should fail)
    console.log('[STEP 11] Testing validation (invalid DNI)...');
    try {
      await Tramite.create({
        dni: '123', // Invalid: too short
        nombreCiudadano: 'Test User',
        tipoTramite: TipoTramite.DNI
      });
      console.log('✗ Validation should have failed!');
    } catch (error) {
      console.log('✓ Validation failed as expected:', error.errors[0].message);
    }
    console.log();

    // Step 12: Verify indexes
    console.log('[STEP 12] Verifying indexes...');
    const indexes = await sequelize.getQueryInterface().showIndex('tramites');
    console.log(`✓ Found ${indexes.length} index(es):`);
    indexes.forEach(index => {
      console.log(`  - ${index.name}: [${index.fields.map(f => f.attribute).join(', ')}]${index.unique ? ' (UNIQUE)' : ''}`);
    });
    console.log();

    // Step 13: Test update
    console.log('[STEP 13] Testing update...');
    tramite1.estado = EstadoTramite.EN_PROCESO;
    tramite1.proximoPaso = 'Revisión de documentos completada. Esperar aprobación.';
    await tramite1.save();
    console.log(`✓ Updated procedure ${tramite1.numeroTramite}`);
    console.log(`  New status: ${tramite1.estado}`);
    console.log();

    // Step 14: List all procedures
    console.log('[STEP 14] Listing all procedures...');
    const allTramites = await Tramite.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });
    console.log(`✓ Total procedures in database: ${allTramites.length}`);
    console.log('\nRecords:');
    allTramites.forEach((t, index) => {
      console.log(`  ${index + 1}. ${t.numeroTramite} - ${t.nombreCiudadano} (${t.tipoTramite}) - ${t.estado}`);
    });
    console.log();

    console.log('='.repeat(70));
    console.log('✓ ALL TESTS PASSED!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n✗ TEST FAILED!');
    console.error('Error:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors.map(e => e.message));
    }
    console.error('\nStack trace:', error.stack);
    process.exit(1);

  } finally {
    // Close connection
    await closeConnection();
  }
}

// Run tests
runTests();
