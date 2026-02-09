const express = require('express');
const { getProvider } = require('../services/factory');

const router = express.Router();

/**
 * GET /api/info
 * Get platform information
 */
router.get('/', (req, res) => {
  const provider = getProvider();

  const info = {
    platform: {
      name: 'GovTech Cloud Migration Platform',
      version: '1.0.0',
      description: 'Multi-cloud backend architecture for government digital transformation'
    },
    cloud: {
      currentProvider: provider,
      supportedProviders: ['aws', 'oci', 'gcp', 'azure'],
      implementedProviders: ['aws'],
      pendingProviders: ['oci', 'gcp', 'azure']
    },
    features: {
      cloudAgnostic: true,
      migrationTools: true,
      multiCloud: true,
      containerized: true,
      infrastructureAsCode: true
    },
    architecture: {
      pattern: 'Strategy + Factory',
      abstraction: 'Interface-based',
      portability: 'High - Change provider in 1 environment variable',
      maintainability: 'High - Each provider isolated in its own module'
    },
    services: {
      storage: {
        aws: 'S3',
        oci: 'Object Storage',
        gcp: 'Cloud Storage',
        azure: 'Blob Storage'
      },
      database: {
        aws: 'RDS PostgreSQL',
        oci: 'OCI Database System',
        gcp: 'Cloud SQL',
        azure: 'Azure Database'
      },
      compute: {
        aws: 'EKS',
        oci: 'OKE',
        gcp: 'GKE',
        azure: 'AKS'
      },
      monitoring: {
        aws: 'CloudWatch',
        oci: 'OCI Monitoring',
        gcp: 'Cloud Operations',
        azure: 'Azure Monitor'
      }
    },
    migration: {
      estimatedTime: {
        awsToOci: '2-3 weeks',
        awsToGcp: '2-3 weeks',
        awsToAzure: '2-3 weeks'
      },
      process: [
        '1. Scan current configuration',
        '2. Map services to target cloud',
        '3. Generate new infrastructure code',
        '4. Execute migration with validation',
        '5. Rollback if needed'
      ]
    },
    documentation: {
      github: 'https://github.com/alexander-fq/multicloud',
      architecture: '/docs/architecture/',
      scalability: '/docs/SCALABILITY_SUMMARY.md',
      migration: '/docs/migration/'
    }
  };

  res.json(info);
});

/**
 * GET /api/info/provider
 * Get current provider details
 */
router.get('/provider', (req, res) => {
  const provider = getProvider();

  const providerInfo = {
    current: provider,
    services: {
      storage: provider === 'aws' ? 'S3' : `${provider.toUpperCase()} Object Storage`,
      database: provider === 'aws' ? 'RDS PostgreSQL' : `${provider.toUpperCase()} Database`,
      compute: provider === 'aws' ? 'EKS' : `${provider.toUpperCase()}KE`,
      monitoring: provider === 'aws' ? 'CloudWatch' : `${provider.toUpperCase()} Monitoring`
    },
    status: provider === 'aws' ? 'implemented' : 'pending',
    region: process.env[`${provider.toUpperCase()}_REGION`] || 'not configured'
  };

  res.json(providerInfo);
});

/**
 * GET /api/info/architecture
 * Get architecture details
 */
router.get('/architecture', (req, res) => {
  res.json({
    layers: {
      1: 'Application Layer (Routes, Controllers)',
      2: 'Service Factory Layer (Provider selection)',
      3: 'Interface Layer (Contracts)',
      4: 'Provider Layer (AWS, OCI, GCP, Azure implementations)'
    },
    benefits: [
      'Cloud agnostic code',
      'Easy testing with mocks',
      'Simple migration (change env variable)',
      'Clear separation of concerns',
      'Maintainable and extensible'
    ],
    designPatterns: [
      'Strategy Pattern (multiple implementations)',
      'Factory Pattern (provider selection)',
      'Dependency Injection (services injected)',
      'Interface Segregation (focused interfaces)'
    ],
    codeExample: {
      usage: `
// In your route:
const { getStorageService } = require('./services/factory');
const storage = getStorageService();

// Works with ANY cloud provider
await storage.uploadFile(file, 'path/to/file.pdf');
      `,
      migration: `
// To migrate from AWS to OCI:
// 1. Update environment variable:
CLOUD_PROVIDER=oci

// 2. Deploy
// That's it! No code changes needed.
      `
    }
  });
});

module.exports = router;
