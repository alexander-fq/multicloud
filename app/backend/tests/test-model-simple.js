/**
 * Simple Tramite Model Test
 * Basic verification of model functionality
 */

require('dotenv').config();
const { testConnection, syncDatabase, closeConnection } = require('./src/config/database');
const { Tramite, TipoTramite, EstadoTramite } = require('./src/models/Tramite');
const { sequelize } = require('./src/config/database');

async function simpleTest() {
  try {
    console.log('1. Connecting to database...');
    await testConnection();
    console.log('   ✓ Connected\n');

    console.log('2. Synchronizing model...');
    await syncDatabase({ force: true });
    console.log('   ✓ Synchronized\n');

    console.log('3. Creating test record...');
    const tramite = await Tramite.create({
      dni: '12345678',
      nombreCiudadano: 'Juan Pérez',
      tipoTramite: TipoTramite.DNI
    });
    console.log(`   ✓ Created: ${tramite.numeroTramite}\n`);

    console.log('4. Finding by DNI...');
    const found = await Tramite.findByDNI('12345678');
    console.log(`   ✓ Found ${found.length} record(s)\n`);

    console.log('5. Verifying indexes...');
    const indexes = await sequelize.getQueryInterface().showIndex('tramites');
    console.log(`   ✓ ${indexes.length} indexes created\n`);

    console.log('✓ ALL TESTS PASSED!\n');

  } catch (error) {
    console.error('✗ ERROR:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

simpleTest();
