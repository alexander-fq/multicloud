/**
 * Routes Test Script
 * Lists all registered routes in the application
 * Run with: node test-routes.js
 */

const express = require('express');
const app = express();

// Import routes
const apiRoutes = require('./src/routes/index');

// Mount routes
app.use('/api/v1', apiRoutes);

/**
 * Extract all routes from Express app
 * @param {Object} stack - Express stack
 * @param {string} prefix - Route prefix
 * @returns {Array} List of routes
 */
function extractRoutes(stack, prefix = '') {
  const routes = [];

  stack.forEach(middleware => {
    if (middleware.route) {
      // Route middleware
      const methods = Object.keys(middleware.route.methods)
        .filter(method => middleware.route.methods[method])
        .map(method => method.toUpperCase());

      routes.push({
        method: methods.join(', '),
        path: prefix + middleware.route.path
      });

    } else if (middleware.name === 'router' && middleware.handle.stack) {
      // Router middleware
      const routerPath = middleware.regexp
        .toString()
        .replace('/^', '')
        .replace('\\/?(?=\\/|$)/i', '')
        .replace(/\\\//g, '/');

      const cleanPath = routerPath
        .replace(/\\/g, '')
        .replace(/\?/g, '')
        .replace(/\(\[\^/g, '')
        .replace(/\]\)/g, '')
        .replace(/\$/g, '')
        .replace(/i$/, '');

      const nestedRoutes = extractRoutes(
        middleware.handle.stack,
        prefix + cleanPath
      );

      routes.push(...nestedRoutes);
    }
  });

  return routes;
}

console.log('='.repeat(70));
console.log('REGISTERED ROUTES');
console.log('='.repeat(70));
console.log();

const routes = extractRoutes(app._router.stack);

// Group routes by prefix
const groupedRoutes = {};

routes.forEach(route => {
  const parts = route.path.split('/').filter(p => p);
  const prefix = parts.length > 1 ? `/${parts[0]}/${parts[1]}` : route.path;

  if (!groupedRoutes[prefix]) {
    groupedRoutes[prefix] = [];
  }

  groupedRoutes[prefix].push(route);
});

// Display routes grouped
Object.keys(groupedRoutes).sort().forEach(prefix => {
  console.log(`\n${prefix}`);
  console.log('-'.repeat(70));

  groupedRoutes[prefix].forEach(route => {
    const method = route.method.padEnd(10);
    console.log(`  ${method} ${route.path}`);
  });
});

console.log();
console.log('='.repeat(70));
console.log(`Total routes: ${routes.length}`);
console.log('='.repeat(70));
console.log();

// Summary by method
console.log('Routes by HTTP method:');
const methodCount = routes.reduce((acc, route) => {
  const methods = route.method.split(', ');
  methods.forEach(method => {
    acc[method] = (acc[method] || 0) + 1;
  });
  return acc;
}, {});

Object.keys(methodCount).sort().forEach(method => {
  console.log(`  ${method}: ${methodCount[method]}`);
});

console.log();
