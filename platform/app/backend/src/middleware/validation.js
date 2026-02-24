/**
 * Request Validation Middleware
 * Validates incoming requests using Joi schemas
 */

const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Schema for migration plan requests
 */
const migrationPlanSchema = Joi.object({
  from: Joi.string()
    .valid('aws', 'oci', 'gcp', 'azure')
    .required()
    .messages({
      'any.required': 'Source cloud provider is required',
      'any.only': 'Source provider must be one of: aws, oci, gcp, azure'
    }),
  to: Joi.string()
    .valid('aws', 'oci', 'gcp', 'azure')
    .required()
    .invalid(Joi.ref('from'))
    .messages({
      'any.required': 'Target cloud provider is required',
      'any.only': 'Target provider must be one of: aws, oci, gcp, azure',
      'any.invalid': 'Source and target providers cannot be the same'
    }),
  options: Joi.object({
    includeEstimates: Joi.boolean().default(true),
    detailedSteps: Joi.boolean().default(true)
  }).optional()
});

/**
 * Validate migration plan request
 */
const validateMigrationPlan = (req, res, next) => {
  const { error, value } = migrationPlanSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    logger.warn('Migration plan validation failed', {
      errors,
      body: req.body
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  // Replace req.body with validated and sanitized values
  req.body = value;
  next();
};

/**
 * Schema for resource scan requests (optional parameters)
 */
const resourceScanSchema = Joi.object({
  resourceTypes: Joi.array()
    .items(Joi.string().valid('ec2', 'rds', 's3', 'eks', 'lambda', 'vpc', 'loadbalancer', 'cloudwatch'))
    .optional()
    .messages({
      'array.includes': 'Invalid resource type'
    }),
  region: Joi.string().optional()
});

/**
 * Validate resource scan request
 */
const validateResourceScan = (req, res, next) => {
  const { error, value } = resourceScanSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    logger.warn('Resource scan validation failed', {
      errors,
      body: req.body
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  req.body = value;
  next();
};

/**
 * Generic validation middleware factory
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation failed', {
        errors,
        body: req.body,
        path: req.path
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validateMigrationPlan,
  validateResourceScan,
  validate,
  // Export schemas for reuse
  schemas: {
    migrationPlanSchema,
    resourceScanSchema
  }
};
