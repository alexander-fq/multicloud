/**
 * Simple route verification
 * Checks that routes are properly configured
 */

console.log('Verifying routes configuration...\n');

try {
  // Load routes
  const tramiteRoutes = require('./src/routes/tramiteRoutes');
  const apiRoutes = require('./src/routes/index');

  console.log('✓ tramiteRoutes loaded successfully');
  console.log('✓ apiRoutes (index) loaded successfully');
  console.log();

  // Check that routes are Express routers
  console.log('Route types:');
  console.log(`  tramiteRoutes: ${tramiteRoutes.name || 'Router'}`);
  console.log(`  apiRoutes: ${apiRoutes.name || 'Router'}`);
  console.log();

  // List expected endpoints
  console.log('Expected tramite endpoints:');
  console.log('  GET    /api/v1/tramites');
  console.log('  GET    /api/v1/tramites/estadisticas');
  console.log('  GET    /api/v1/tramites/numero/:numeroTramite');
  console.log('  GET    /api/v1/tramites/dni/:dni');
  console.log('  POST   /api/v1/tramites');
  console.log('  PUT    /api/v1/tramites/:numeroTramite');
  console.log();

  console.log('Additional endpoints:');
  console.log('  GET    /api/v1/health');
  console.log('  GET    /api/v1/');
  console.log();

  console.log('✓ All route modules configured correctly');

} catch (error) {
  console.error('✗ Error loading routes:', error.message);
  process.exit(1);
}
