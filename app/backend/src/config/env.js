require('dotenv').config();
const Joi = require('joi');

/**
 * Environment configuration with validation
 * Ensures all required variables are present and valid
 */

const envSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),

  // Cloud Provider
  CLOUD_PROVIDER: Joi.string()
    .valid('aws', 'oci', 'gcp', 'azure')
    .default('aws')
    .description('Cloud provider to use'),

  // Database
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL connection string'),

  // AWS Configuration (required when CLOUD_PROVIDER=aws)
  AWS_REGION: Joi.string().when('CLOUD_PROVIDER', {
    is: 'aws',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  AWS_ACCESS_KEY_ID: Joi.string().when('CLOUD_PROVIDER', {
    is: 'aws',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('CLOUD_PROVIDER', {
    is: 'aws',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  AWS_BUCKET: Joi.string().when('CLOUD_PROVIDER', {
    is: 'aws',
    then: Joi.optional(),
    otherwise: Joi.optional()
  }),
  AWS_LOG_GROUP: Joi.string().optional(),

  // Security
  JWT_SECRET: Joi.string()
    .min(32)
    .default('default-jwt-secret-change-in-production'),
  API_RATE_LIMIT: Joi.number().default(100),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:5173')
}).unknown(); // Allow unknown env variables

// Validate environment variables
const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`❌ Config validation error: ${error.message}`);
}

// Export validated config
module.exports = {
  // Application
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // Cloud
  cloudProvider: env.CLOUD_PROVIDER,

  // Database
  databaseUrl: env.DATABASE_URL,

  // AWS
  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    bucket: env.AWS_BUCKET,
    logGroup: env.AWS_LOG_GROUP
  },

  // Security
  jwt: {
    secret: env.JWT_SECRET
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.API_RATE_LIMIT // requests per window
  },

  // Logging
  logLevel: env.LOG_LEVEL,

  // CORS
  corsOrigin: env.CORS_ORIGIN
};
