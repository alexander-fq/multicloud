/**
 * Service Equivalence Mapper
 * Maps cloud services between AWS, OCI, GCP, and Azure
 * Provides compatibility scores and migration recommendations
 */

const logger = require('../../utils/logger');

/**
 * Service mapping database
 * Maps AWS services to their equivalents in other clouds
 */
const SERVICE_MAPPING = {
  // Database Services
  'rds-postgresql': {
    aws: { name: 'RDS PostgreSQL', compatibility: 100 },
    oci: { name: 'OCI Database - PostgreSQL', compatibility: 95 },
    gcp: { name: 'Cloud SQL - PostgreSQL', compatibility: 95 },
    azure: { name: 'Azure Database for PostgreSQL', compatibility: 95 }
  },
  'rds-mysql': {
    aws: { name: 'RDS MySQL', compatibility: 100 },
    oci: { name: 'OCI Database - MySQL', compatibility: 95 },
    gcp: { name: 'Cloud SQL - MySQL', compatibility: 95 },
    azure: { name: 'Azure Database for MySQL', compatibility: 95 }
  },
  'dynamodb': {
    aws: { name: 'DynamoDB', compatibility: 100 },
    oci: { name: 'NoSQL Database', compatibility: 85 },
    gcp: { name: 'Cloud Firestore', compatibility: 80 },
    azure: { name: 'Cosmos DB', compatibility: 85 }
  },

  // Storage Services
  's3': {
    aws: { name: 'S3', compatibility: 100 },
    oci: { name: 'Object Storage', compatibility: 95 },
    gcp: { name: 'Cloud Storage', compatibility: 95 },
    azure: { name: 'Blob Storage', compatibility: 95 }
  },
  'ebs': {
    aws: { name: 'EBS', compatibility: 100 },
    oci: { name: 'Block Volume', compatibility: 95 },
    gcp: { name: 'Persistent Disk', compatibility: 95 },
    azure: { name: 'Managed Disks', compatibility: 95 }
  },
  'efs': {
    aws: { name: 'EFS', compatibility: 100 },
    oci: { name: 'File Storage', compatibility: 90 },
    gcp: { name: 'Filestore', compatibility: 90 },
    azure: { name: 'Azure Files', compatibility: 90 }
  },

  // Compute Services
  'ec2': {
    aws: { name: 'EC2', compatibility: 100 },
    oci: { name: 'Compute Instance', compatibility: 95 },
    gcp: { name: 'Compute Engine', compatibility: 95 },
    azure: { name: 'Virtual Machines', compatibility: 95 }
  },
  'eks': {
    aws: { name: 'EKS (Elastic Kubernetes Service)', compatibility: 100 },
    oci: { name: 'OKE (Container Engine for Kubernetes)', compatibility: 98 },
    gcp: { name: 'GKE (Google Kubernetes Engine)', compatibility: 98 },
    azure: { name: 'AKS (Azure Kubernetes Service)', compatibility: 98 }
  },
  'ecs': {
    aws: { name: 'ECS (Elastic Container Service)', compatibility: 100 },
    oci: { name: 'Container Instances', compatibility: 85 },
    gcp: { name: 'Cloud Run', compatibility: 80 },
    azure: { name: 'Container Instances', compatibility: 85 }
  },
  'lambda': {
    aws: { name: 'Lambda', compatibility: 100 },
    oci: { name: 'Functions', compatibility: 90 },
    gcp: { name: 'Cloud Functions', compatibility: 90 },
    azure: { name: 'Azure Functions', compatibility: 90 }
  },

  // Networking Services
  'vpc': {
    aws: { name: 'VPC', compatibility: 100 },
    oci: { name: 'VCN (Virtual Cloud Network)', compatibility: 95 },
    gcp: { name: 'VPC Network', compatibility: 95 },
    azure: { name: 'Virtual Network', compatibility: 95 }
  },
  'elb': {
    aws: { name: 'Elastic Load Balancer', compatibility: 100 },
    oci: { name: 'Load Balancer', compatibility: 95 },
    gcp: { name: 'Cloud Load Balancing', compatibility: 95 },
    azure: { name: 'Load Balancer', compatibility: 95 }
  },
  'route53': {
    aws: { name: 'Route 53', compatibility: 100 },
    oci: { name: 'DNS', compatibility: 90 },
    gcp: { name: 'Cloud DNS', compatibility: 90 },
    azure: { name: 'Azure DNS', compatibility: 90 }
  },
  'cloudfront': {
    aws: { name: 'CloudFront', compatibility: 100 },
    oci: { name: 'Content Delivery', compatibility: 85 },
    gcp: { name: 'Cloud CDN', compatibility: 90 },
    azure: { name: 'Azure CDN', compatibility: 90 }
  },

  // Monitoring & Logging
  'cloudwatch': {
    aws: { name: 'CloudWatch', compatibility: 100 },
    oci: { name: 'Logging + Monitoring', compatibility: 90 },
    gcp: { name: 'Cloud Monitoring + Cloud Logging', compatibility: 90 },
    azure: { name: 'Azure Monitor', compatibility: 90 }
  },
  'cloudtrail': {
    aws: { name: 'CloudTrail', compatibility: 100 },
    oci: { name: 'Audit', compatibility: 90 },
    gcp: { name: 'Cloud Audit Logs', compatibility: 90 },
    azure: { name: 'Activity Log', compatibility: 90 }
  },

  // Security & Identity
  'iam': {
    aws: { name: 'IAM', compatibility: 100 },
    oci: { name: 'IAM', compatibility: 95 },
    gcp: { name: 'Cloud IAM', compatibility: 95 },
    azure: { name: 'Azure AD + RBAC', compatibility: 90 }
  },
  'kms': {
    aws: { name: 'KMS (Key Management Service)', compatibility: 100 },
    oci: { name: 'Vault', compatibility: 95 },
    gcp: { name: 'Cloud KMS', compatibility: 95 },
    azure: { name: 'Key Vault', compatibility: 95 }
  },
  'secrets-manager': {
    aws: { name: 'Secrets Manager', compatibility: 100 },
    oci: { name: 'Vault Secrets', compatibility: 95 },
    gcp: { name: 'Secret Manager', compatibility: 95 },
    azure: { name: 'Key Vault Secrets', compatibility: 95 }
  }
};

/**
 * Instance type mappings (approximate equivalents)
 */
const INSTANCE_TYPE_MAPPING = {
  // General Purpose
  't3.micro': { oci: 'VM.Standard.E4.Flex (1 OCPU)', gcp: 'e2-micro', azure: 'B1s' },
  't3.small': { oci: 'VM.Standard.E4.Flex (1 OCPU)', gcp: 'e2-small', azure: 'B1ms' },
  't3.medium': { oci: 'VM.Standard.E4.Flex (1 OCPU)', gcp: 'e2-medium', azure: 'B2s' },
  'm5.large': { oci: 'VM.Standard3.Flex (2 OCPU)', gcp: 'n2-standard-2', azure: 'D2s_v3' },
  'm5.xlarge': { oci: 'VM.Standard3.Flex (4 OCPU)', gcp: 'n2-standard-4', azure: 'D4s_v3' },
  'm5.2xlarge': { oci: 'VM.Standard3.Flex (8 OCPU)', gcp: 'n2-standard-8', azure: 'D8s_v3' },

  // Compute Optimized
  'c5.large': { oci: 'VM.Standard3.Flex (2 OCPU)', gcp: 'c2-standard-4', azure: 'F2s_v2' },
  'c5.xlarge': { oci: 'VM.Standard3.Flex (4 OCPU)', gcp: 'c2-standard-8', azure: 'F4s_v2' },
  'c5.2xlarge': { oci: 'VM.Standard3.Flex (8 OCPU)', gcp: 'c2-standard-16', azure: 'F8s_v2' },

  // Memory Optimized
  'r5.large': { oci: 'VM.Standard.E4.Flex (2 OCPU, 32GB)', gcp: 'n2-highmem-2', azure: 'E2s_v3' },
  'r5.xlarge': { oci: 'VM.Standard.E4.Flex (4 OCPU, 64GB)', gcp: 'n2-highmem-4', azure: 'E4s_v3' },
  'r5.2xlarge': { oci: 'VM.Standard.E4.Flex (8 OCPU, 128GB)', gcp: 'n2-highmem-8', azure: 'E8s_v3' }
};

class ServiceMapper {
  /**
   * Map a service from one provider to another
   * @param {string} fromProvider - Source cloud provider
   * @param {string} toProvider - Target cloud provider
   * @param {string} serviceType - Type of service (e.g., 's3', 'rds-postgresql')
   * @returns {Object} Mapping information
   */
  mapService(fromProvider, toProvider, serviceType) {
    const serviceKey = serviceType.toLowerCase();

    if (!SERVICE_MAPPING[serviceKey]) {
      logger.warn(`No mapping found for service type: ${serviceType}`);
      return {
        from: { name: serviceType, compatibility: 100 },
        to: { name: 'Manual mapping required', compatibility: 0 },
        notes: 'This service requires manual migration planning'
      };
    }

    const mapping = SERVICE_MAPPING[serviceKey];
    const fromService = mapping[fromProvider] || mapping.aws;
    const toService = mapping[toProvider];

    return {
      from: fromService,
      to: toService,
      compatibilityScore: toService.compatibility,
      notes: this._getMigrationNotes(serviceKey, fromProvider, toProvider, toService.compatibility)
    };
  }

  /**
   * Find equivalent service in target provider
   * @param {string} sourceService - Source service identifier
   * @param {string} targetProvider - Target cloud provider
   * @returns {Object} Equivalent service information
   */
  findEquivalent(sourceService, targetProvider) {
    const serviceKey = sourceService.toLowerCase();
    const mapping = SERVICE_MAPPING[serviceKey];

    if (!mapping || !mapping[targetProvider]) {
      return null;
    }

    return mapping[targetProvider];
  }

  /**
   * Get compatibility score between two services
   * @param {string} fromService - Source service type
   * @param {string} toProvider - Target provider
   * @returns {number} Compatibility score (0-100)
   */
  getCompatibilityScore(fromService, toProvider) {
    const serviceKey = fromService.toLowerCase();
    const mapping = SERVICE_MAPPING[serviceKey];

    if (!mapping || !mapping[toProvider]) {
      return 0;
    }

    return mapping[toProvider].compatibility;
  }

  /**
   * Map instance type from AWS to target provider
   * @param {string} awsInstanceType - AWS instance type (e.g., 't3.medium')
   * @param {string} targetProvider - Target provider ('oci', 'gcp', 'azure')
   * @returns {string} Equivalent instance type
   */
  mapInstanceType(awsInstanceType, targetProvider) {
    const mapping = INSTANCE_TYPE_MAPPING[awsInstanceType];

    if (!mapping) {
      logger.warn(`No instance type mapping for: ${awsInstanceType}`);
      return 'Custom sizing required';
    }

    return mapping[targetProvider] || 'Manual sizing required';
  }

  /**
   * Get all service mappings for a provider pair
   * @param {string} fromProvider - Source provider
   * @param {string} toProvider - Target provider
   * @returns {Object} All service mappings
   */
  getAllMappings(fromProvider, toProvider) {
    const mappings = {};

    Object.keys(SERVICE_MAPPING).forEach(serviceKey => {
      const mapping = SERVICE_MAPPING[serviceKey];
      if (mapping[fromProvider] && mapping[toProvider]) {
        mappings[serviceKey] = {
          from: mapping[fromProvider],
          to: mapping[toProvider],
          compatibility: mapping[toProvider].compatibility
        };
      }
    });

    return mappings;
  }

  /**
   * Get migration notes based on compatibility
   * @private
   */
  _getMigrationNotes(serviceType, fromProvider, toProvider, compatibility) {
    const notes = [];

    if (compatibility === 100) {
      notes.push('Direct equivalent available');
    } else if (compatibility >= 90) {
      notes.push('High compatibility - Minor configuration changes needed');
    } else if (compatibility >= 80) {
      notes.push('Good compatibility - Some feature differences exist');
    } else if (compatibility >= 70) {
      notes.push('Moderate compatibility - Significant changes required');
    } else {
      notes.push('Low compatibility - Extensive refactoring needed');
    }

    // Service-specific notes
    if (serviceType === 'eks' || serviceType === 'oke' || serviceType === 'gke' || serviceType === 'aks') {
      notes.push('Kubernetes workloads are highly portable');
      notes.push('Container images can be reused');
    }

    if (serviceType === 's3' && toProvider === 'oci') {
      notes.push('OCI Object Storage is S3-compatible');
      notes.push('Use rclone or AWS CLI with S3 compatibility mode');
    }

    if (serviceType === 'lambda') {
      notes.push('Code may need adjustments for different runtime environments');
      notes.push('Event triggers will need to be reconfigured');
    }

    return notes;
  }

  /**
   * Calculate overall migration complexity
   * @param {Object} resources - Scanned resources
   * @param {string} toProvider - Target provider
   * @returns {Object} Complexity analysis
   */
  calculateMigrationComplexity(resources, toProvider) {
    let totalComplexity = 0;
    let serviceCount = 0;
    const complexServices = [];

    // Analyze each resource type
    Object.keys(resources).forEach(resourceType => {
      if (Array.isArray(resources[resourceType]) && resources[resourceType].length > 0) {
        const compatibility = this.getCompatibilityScore(resourceType, toProvider);

        if (compatibility > 0) {
          serviceCount++;
          totalComplexity += (100 - compatibility);

          if (compatibility < 85) {
            complexServices.push({
              service: resourceType,
              compatibility,
              count: resources[resourceType].length
            });
          }
        }
      }
    });

    const averageComplexity = serviceCount > 0 ? totalComplexity / serviceCount : 0;

    return {
      overallScore: Math.max(0, 100 - averageComplexity),
      level: this._getComplexityLevel(averageComplexity),
      serviceCount,
      complexServices,
      recommendation: this._getComplexityRecommendation(averageComplexity)
    };
  }

  /**
   * Get complexity level description
   * @private
   */
  _getComplexityLevel(complexity) {
    if (complexity < 10) return 'Low';
    if (complexity < 20) return 'Moderate';
    if (complexity < 30) return 'High';
    return 'Very High';
  }

  /**
   * Get recommendation based on complexity
   * @private
   */
  _getComplexityRecommendation(complexity) {
    if (complexity < 10) {
      return 'Migration should be straightforward with minimal changes';
    } else if (complexity < 20) {
      return 'Migration is feasible with moderate effort';
    } else if (complexity < 30) {
      return 'Complex migration requiring significant planning and testing';
    } else {
      return 'Highly complex migration - consider phased approach';
    }
  }
}

module.exports = { ServiceMapper, SERVICE_MAPPING, INSTANCE_TYPE_MAPPING };
