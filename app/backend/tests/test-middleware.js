/**
 * Middleware Test Script
 * Tests validation schemas and middleware functionality
 * Run with: node test-middleware.js
 */

const { schemas, validate } = require('./src/middleware/validator');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

console.log('='.repeat(70));
console.log('MIDDLEWARE TESTS');
console.log('='.repeat(70));
console.log();

// Test validation schemas
console.log('[TEST 1] Validation Schemas');
console.log('-'.repeat(70));

// Test 1.1: Valid tramite data
console.log('\n1.1 - Valid tramite data:');
const validData = {
  dni: '12345678',
  nombreCiudadano: 'Juan Pérez García',
  tipoTramite: 'DNI',
  documentosPendientes: ['Foto', 'Pago']
};

const { error: error1, value: value1 } = schemas.createTramite.validate(validData);
if (error1) {
  console.log('  ✗ Failed:', error1.details[0].message);
} else {
  console.log('  ✓ Passed');
  console.log('  Validated data:', value1);
}

// Test 1.2: Invalid DNI (too short)
console.log('\n1.2 - Invalid DNI (too short):');
const invalidDNI = {
  dni: '123',
  nombreCiudadano: 'Test User',
  tipoTramite: 'DNI'
};

const { error: error2 } = schemas.createTramite.validate(invalidDNI);
if (error2) {
  console.log('  ✓ Validation failed as expected');
  console.log('  Error:', error2.details[0].message);
} else {
  console.log('  ✗ Should have failed but passed');
}

// Test 1.3: Missing required field
console.log('\n1.3 - Missing required field (nombreCiudadano):');
const missingField = {
  dni: '12345678',
  tipoTramite: 'DNI'
};

const { error: error3 } = schemas.createTramite.validate(missingField);
if (error3) {
  console.log('  ✓ Validation failed as expected');
  console.log('  Error:', error3.details[0].message);
} else {
  console.log('  ✗ Should have failed but passed');
}

// Test 1.4: Invalid tipoTramite
console.log('\n1.4 - Invalid tipoTramite:');
const invalidType = {
  dni: '12345678',
  nombreCiudadano: 'Test User',
  tipoTramite: 'INVALID_TYPE'
};

const { error: error4 } = schemas.createTramite.validate(invalidType);
if (error4) {
  console.log('  ✓ Validation failed as expected');
  console.log('  Error:', error4.details[0].message);
} else {
  console.log('  ✗ Should have failed but passed');
}

// Test 1.5: Invalid estado
console.log('\n1.5 - Invalid estado:');
const invalidStatus = {
  dni: '12345678',
  nombreCiudadano: 'Test User',
  tipoTramite: 'DNI',
  estado: 'INVALID_STATUS'
};

const { error: error5 } = schemas.createTramite.validate(invalidStatus);
if (error5) {
  console.log('  ✓ Validation failed as expected');
  console.log('  Error:', error5.details[0].message);
} else {
  console.log('  ✗ Should have failed but passed');
}

// Test 1.6: numeroTramite param validation
console.log('\n1.6 - numeroTramite param validation:');
const validNumero = { numeroTramite: 'TRAM-20260208-12345' };
const invalidNumero = { numeroTramite: 'INVALID' };

const { error: error6a } = schemas.tramiteNumeroParam.validate(validNumero);
const { error: error6b } = schemas.tramiteNumeroParam.validate(invalidNumero);

if (!error6a && error6b) {
  console.log('  ✓ Valid numero passed, invalid numero failed');
} else {
  console.log('  ✗ Validation not working correctly');
}

// Test 1.7: DNI param validation
console.log('\n1.7 - DNI param validation:');
const validDNIParam = { dni: '12345678' };
const invalidDNIParam = { dni: '123' };

const { error: error7a } = schemas.dniParam.validate(validDNIParam);
const { error: error7b } = schemas.dniParam.validate(invalidDNIParam);

if (!error7a && error7b) {
  console.log('  ✓ Valid DNI passed, invalid DNI failed');
} else {
  console.log('  ✗ Validation not working correctly');
}

// Test 1.8: Query params validation
console.log('\n1.8 - Query params validation:');
const validQuery = { page: '1', limit: '10', estado: 'PENDIENTE' };
const invalidQuery = { page: '0', limit: '200' };

const { error: error8a } = schemas.tramiteQuery.validate(validQuery);
const { error: error8b } = schemas.tramiteQuery.validate(invalidQuery);

if (!error8a && error8b) {
  console.log('  ✓ Valid query passed, invalid query failed');
  console.log('  Invalid query error:', error8b.details[0].message);
} else {
  console.log('  ✗ Validation not working correctly');
}

// Test 2: Error handler
console.log('\n\n[TEST 2] Error Handler');
console.log('-'.repeat(70));

console.log('\n2.1 - Error handler exists and is a function:');
if (typeof errorHandler === 'function') {
  console.log('  ✓ errorHandler is a function');
} else {
  console.log('  ✗ errorHandler is not a function');
}

console.log('\n2.2 - Not found handler exists and is a function:');
if (typeof notFoundHandler === 'function') {
  console.log('  ✓ notFoundHandler is a function');
} else {
  console.log('  ✗ notFoundHandler is not a function');
}

// Test 3: Middleware loading
console.log('\n\n[TEST 3] Middleware Loading');
console.log('-'.repeat(70));

try {
  const middleware = require('./src/middleware/index');
  console.log('\n3.1 - Load middleware index:');
  console.log('  ✓ Middleware index loaded successfully');

  console.log('\n3.2 - Check exported middleware:');
  const expectedExports = [
    'notFoundHandler',
    'errorHandler',
    'asyncHandler',
    'validate',
    'validators',
    'schemas',
    'requestLogger',
    'corsOptions',
    'helmetOptions',
    'apiLimiter'
  ];

  expectedExports.forEach(exportName => {
    if (middleware[exportName]) {
      console.log(`  ✓ ${exportName} exported`);
    } else {
      console.log(`  ✗ ${exportName} NOT exported`);
    }
  });

} catch (error) {
  console.log('  ✗ Error loading middleware:', error.message);
}

// Test 4: Validation middleware factory
console.log('\n\n[TEST 4] Validation Middleware Factory');
console.log('-'.repeat(70));

console.log('\n4.1 - Create validation middleware:');
const validationMiddleware = validate(schemas.createTramite, 'body');
if (typeof validationMiddleware === 'function') {
  console.log('  ✓ Validation middleware factory works');
} else {
  console.log('  ✗ Validation middleware factory failed');
}

console.log('\n4.2 - Test validation middleware execution:');
// Mock request, response, and next
const mockReq = {
  body: {
    dni: '12345678',
    nombreCiudadano: 'Test User',
    tipoTramite: 'DNI'
  }
};

const mockRes = {
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

let nextCalled = false;
const mockNext = () => { nextCalled = true; };

validationMiddleware(mockReq, mockRes, mockNext);

if (nextCalled) {
  console.log('  ✓ Validation passed and next() was called');
} else {
  console.log('  ✗ Validation failed or next() was not called');
  if (mockRes.data) {
    console.log('  Error:', mockRes.data);
  }
}

console.log();
console.log('='.repeat(70));
console.log('✓ MIDDLEWARE TESTS COMPLETED');
console.log('='.repeat(70));
console.log();
