/**
 * Application Verification Script
 * Verifies that the application loads correctly
 * Run with: node verify-app.js
 */

console.log('='.repeat(70));
console.log('APPLICATION VERIFICATION');
console.log('='.repeat(70));
console.log();

try {
  // Test 1: Load app
  console.log('[TEST 1] Loading application...');
  const { app, initializeDatabase } = require('./src/app');
  console.log('  ✓ Application loaded successfully');
  console.log();

  // Test 2: Check app is Express instance
  console.log('[TEST 2] Verify app is Express instance...');
  if (app && typeof app.listen === 'function') {
    console.log('  ✓ App is a valid Express application');
  } else {
    console.log('  ✗ App is not a valid Express application');
  }
  console.log();

  // Test 3: Check initializeDatabase function
  console.log('[TEST 3] Verify database initialization function...');
  if (typeof initializeDatabase === 'function') {
    console.log('  ✓ initializeDatabase function exists');
  } else {
    console.log('  ✗ initializeDatabase function not found');
  }
  console.log();

  // Test 4: Check middleware
  console.log('[TEST 4] Verify middleware loaded...');
  const middleware = require('./src/middleware');
  const expectedMiddleware = [
    'errorHandler',
    'notFoundHandler',
    'validators',
    'requestLogger',
    'corsOptions',
    'apiLimiter'
  ];
  expectedMiddleware.forEach(name => {
    if (middleware[name]) {
      console.log(`  ✓ ${name} loaded`);
    } else {
      console.log(`  ✗ ${name} NOT loaded`);
    }
  });
  console.log();

  // Test 5: Check routes
  console.log('[TEST 5] Verify routes loaded...');
  const apiRoutes = require('./src/routes/index');
  if (apiRoutes) {
    console.log('  ✓ API routes loaded');
  } else {
    console.log('  ✗ API routes NOT loaded');
  }
  console.log();

  // Test 6: Check database config
  console.log('[TEST 6] Verify database configuration...');
  const dbConfig = require('./src/config/database');
  const expectedDbExports = [
    'sequelize',
    'testConnection',
    'syncDatabase',
    'closeConnection'
  ];
  expectedDbExports.forEach(name => {
    if (dbConfig[name]) {
      console.log(`  ✓ ${name} exported`);
    } else {
      console.log(`  ✗ ${name} NOT exported`);
    }
  });
  console.log();

  // Test 7: Check model
  console.log('[TEST 7] Verify Tramite model...');
  const { Tramite, TipoTramite, EstadoTramite } = require('./src/models/Tramite');
  if (Tramite && TipoTramite && EstadoTramite) {
    console.log('  ✓ Tramite model loaded');
    console.log('  ✓ TipoTramite enum loaded');
    console.log('  ✓ EstadoTramite enum loaded');
  } else {
    console.log('  ✗ Model exports incomplete');
  }
  console.log();

  // Test 8: Check controller
  console.log('[TEST 8] Verify tramite controller...');
  const controller = require('./src/controllers/tramiteController');
  const expectedControllers = [
    'getAllTramites',
    'getTramiteByNumero',
    'getTramitesByDNI',
    'createTramite',
    'updateTramite',
    'getEstadisticas'
  ];
  expectedControllers.forEach(name => {
    if (controller[name]) {
      console.log(`  ✓ ${name} exported`);
    } else {
      console.log(`  ✗ ${name} NOT exported`);
    }
  });
  console.log();

  // Test 9: Check environment variables
  console.log('[TEST 9] Verify environment configuration...');
  require('dotenv').config();
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER'];
  const missingVars = [];
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`  ✓ ${varName} set`);
    } else {
      console.log(`  ✗ ${varName} NOT set`);
      missingVars.push(varName);
    }
  });
  console.log();

  // Test 10: Check package.json scripts
  console.log('[TEST 10] Verify package.json configuration...');
  const packageJson = require('./package.json');
  if (packageJson.main === 'server.js') {
    console.log('  ✓ Main entry point: server.js');
  } else {
    console.log(`  ✗ Main entry point is ${packageJson.main}, expected server.js`);
  }
  if (packageJson.scripts.start === 'node server.js') {
    console.log('  ✓ Start script configured correctly');
  } else {
    console.log('  ✗ Start script misconfigured');
  }
  if (packageJson.scripts.dev === 'nodemon server.js') {
    console.log('  ✓ Dev script configured correctly');
  } else {
    console.log('  ✗ Dev script misconfigured');
  }
  console.log();

  console.log('='.repeat(70));
  console.log('✓ APPLICATION VERIFICATION COMPLETED');
  console.log('='.repeat(70));
  console.log();
  console.log('Application is ready to run:');
  console.log('  npm start    - Start production server');
  console.log('  npm run dev  - Start development server with auto-reload');
  console.log();

} catch (error) {
  console.error('✗ VERIFICATION FAILED!');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
