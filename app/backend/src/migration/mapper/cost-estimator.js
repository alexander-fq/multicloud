/**
 * Cost Estimator
 * Estimates migration costs and compares cloud provider pricing
 * Simplified estimations based on typical pricing (not real-time API calls)
 */

const logger = require('../../utils/logger');

/**
 * Simplified pricing data (monthly costs in USD)
 * Based on typical on-demand pricing as of 2024
 */
const PRICING = {
  compute: {
    aws: {
      't3.micro': 7.5,
      't3.small': 15,
      't3.medium': 30,
      't3.large': 60,
      'm5.large': 70,
      'm5.xlarge': 140,
      'm5.2xlarge': 280
    },
    oci: {
      'VM.Standard.E4.Flex-1': 11, // 1 OCPU (cheaper than AWS)
      'VM.Standard.E4.Flex-2': 22,
      'VM.Standard3.Flex-2': 45,
      'VM.Standard3.Flex-4': 90,
      'VM.Standard3.Flex-8': 180
    },
    gcp: {
      'e2-micro': 6,
      'e2-small': 12,
      'e2-medium': 24,
      'n2-standard-2': 70,
      'n2-standard-4': 140,
      'n2-standard-8': 280
    },
    azure: {
      'B1s': 7,
      'B1ms': 15,
      'B2s': 30,
      'D2s_v3': 75,
      'D4s_v3': 150,
      'D8s_v3': 300
    }
  },

  database: {
    aws: {
      'db.t3.micro': 12,
      'db.t3.small': 25,
      'db.t3.medium': 50,
      'db.m5.large': 130
    },
    oci: {
      'small': 40, // OCI DB typically 20-30% cheaper
      'medium': 90,
      'large': 180
    },
    gcp: {
      'db-f1-micro': 9,
      'db-g1-small': 25,
      'db-n1-standard-1': 80
    },
    azure: {
      'Basic': 15,
      'GeneralPurpose-2vCore': 100,
      'GeneralPurpose-4vCore': 200
    }
  },

  storage: {
    aws: {
      's3_standard_gb': 0.023, // per GB/month
      'ebs_gp3_gb': 0.08
    },
    oci: {
      'object_storage_gb': 0.0255, // Actually cheaper than AWS
      'block_storage_gb': 0.0425
    },
    gcp: {
      'standard_storage_gb': 0.020,
      'persistent_disk_gb': 0.040
    },
    azure: {
      'blob_storage_gb': 0.018,
      'managed_disk_gb': 0.050
    }
  },

  networking: {
    aws: {
      'data_transfer_out_gb': 0.09,
      'load_balancer_hour': 0.0225
    },
    oci: {
      'data_transfer_out_gb': 0.0085, // 10x cheaper!
      'load_balancer_hour': 0.0125
    },
    gcp: {
      'data_transfer_out_gb': 0.12,
      'load_balancer_hour': 0.025
    },
    azure: {
      'data_transfer_out_gb': 0.087,
      'load_balancer_hour': 0.025
    }
  }
};

class CostEstimator {
  /**
   * Estimate migration cost
   * @param {Object} resources - Scanned resources
   * @param {string} targetProvider - Target cloud provider
   * @returns {Promise<Object>} Cost estimation
   */
  async estimateMigrationCost(resources, targetProvider) {
    logger.info(`Estimating migration cost to ${targetProvider}`);

    try {
      // Calculate service setup costs
      const setupCosts = this._calculateSetupCosts(resources, targetProvider);

      // Calculate data migration costs
      const dataMigrationCosts = this._calculateDataMigrationCosts(resources);

      // Calculate testing and validation costs
      const testingCosts = this._calculateTestingCosts(resources);

      // Calculate labor costs (estimated person-hours)
      const laborCosts = this._calculateLaborCosts(resources);

      const totalMigrationCost =
        setupCosts +
        dataMigrationCosts +
        testingCosts +
        laborCosts;

      return {
        totalMigrationCost: `$${totalMigrationCost.toLocaleString()}`,
        breakdown: {
          setup: `$${setupCosts.toLocaleString()}`,
          dataMigration: `$${dataMigrationCosts.toLocaleString()}`,
          testing: `$${testingCosts.toLocaleString()}`,
          labor: `$${laborCosts.toLocaleString()}`
        },
        estimatedDuration: this._estimateDuration(resources),
        note: 'One-time migration costs'
      };
    } catch (error) {
      logger.error('Cost estimation failed', { error: error.message });
      return {
        totalMigrationCost: 'Unable to estimate',
        error: error.message
      };
    }
  }

  /**
   * Compare costs between providers
   * @param {string} currentProvider - Current provider
   * @param {string} targetProvider - Target provider
   * @param {Object} resources - Scanned resources
   * @returns {Promise<Object>} Cost comparison
   */
  async compareCosts(currentProvider, targetProvider, resources) {
    logger.info(`Comparing costs: ${currentProvider} vs ${targetProvider}`);

    try {
      // Estimate monthly costs on current provider
      const currentCosts = await this._estimateMonthlyInfrastructureCost(
        resources,
        currentProvider
      );

      // Estimate monthly costs on target provider
      const targetCosts = await this._estimateMonthlyInfrastructureCost(
        resources,
        targetProvider
      );

      const savings = currentCosts - targetCosts;
      const savingsPercentage = ((savings / currentCosts) * 100).toFixed(1);

      return {
        currentProvider: {
          name: currentProvider.toUpperCase(),
          monthlyCost: `$${currentCosts.toLocaleString()}`
        },
        targetProvider: {
          name: targetProvider.toUpperCase(),
          monthlyCost: `$${targetCosts.toLocaleString()}`
        },
        monthlySavings: `$${savings.toLocaleString()}`,
        savingsPercentage: `${savingsPercentage}%`,
        annualSavings: `$${(savings * 12).toLocaleString()}`,
        recommendation: savings > 0
          ? `You could save $${savings.toLocaleString()}/month by migrating to ${targetProvider.toUpperCase()}`
          : `${currentProvider.toUpperCase()} is currently more cost-effective`
      };
    } catch (error) {
      logger.error('Cost comparison failed', { error: error.message });
      return {
        error: error.message,
        note: 'Unable to compare costs accurately'
      };
    }
  }

  /**
   * Calculate ROI
   * @param {number} migrationCost - One-time migration cost
   * @param {number} monthlySavings - Monthly savings
   * @returns {Object} ROI calculation
   */
  calculateROI(migrationCost, monthlySavings) {
    if (monthlySavings <= 0) {
      return {
        roi: 'Negative',
        breakEvenMonths: 'Never',
        note: 'Migration would not save money'
      };
    }

    const breakEvenMonths = Math.ceil(migrationCost / monthlySavings);
    const threeYearSavings = (monthlySavings * 36) - migrationCost;

    return {
      roi: `${((threeYearSavings / migrationCost) * 100).toFixed(1)}% over 3 years`,
      breakEvenMonths: `${breakEvenMonths} months`,
      breakEvenDate: new Date(Date.now() + breakEvenMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      threeYearSavings: `$${threeYearSavings.toLocaleString()}`,
      recommendation: breakEvenMonths <= 12
        ? 'Excellent ROI - Migration highly recommended'
        : breakEvenMonths <= 24
        ? 'Good ROI - Migration recommended'
        : 'Moderate ROI - Consider carefully'
    };
  }

  /**
   * Estimate monthly infrastructure cost
   * @private
   */
  async _estimateMonthlyInfrastructureCost(resources, provider) {
    let totalCost = 0;

    // EC2/Compute costs
    if (resources.ec2 && resources.ec2.length > 0) {
      resources.ec2.forEach(instance => {
        const instanceType = instance.type || 't3.medium';
        const cost = PRICING.compute[provider]?.[instanceType] || 50; // default estimate
        totalCost += cost;
      });
    }

    // RDS/Database costs
    if (resources.rds && resources.rds.length > 0) {
      resources.rds.forEach(db => {
        const instanceClass = db.instanceClass || 'db.t3.medium';
        const cost = PRICING.database[provider]?.['medium'] || 80; // default estimate
        totalCost += cost;
      });
    }

    // S3/Storage costs (estimate 100GB per bucket)
    if (resources.s3 && resources.s3.length > 0) {
      const avgStoragePerBucket = 100; // GB
      const totalStorage = resources.s3.length * avgStoragePerBucket;
      const costPerGB = PRICING.storage[provider]?.['standard_storage_gb'] || 0.023;
      totalCost += totalStorage * costPerGB;
    }

    // EKS/Kubernetes cluster cost
    if (resources.eks && resources.eks.length > 0) {
      // Cluster control plane + node costs
      const clusterCost = provider === 'aws' ? 73 : provider === 'oci' ? 0 : 73; // OCI OKE is free
      const nodeCost = 200; // Estimate for worker nodes
      totalCost += (clusterCost + nodeCost) * resources.eks.length;
    }

    // Load Balancer costs
    if (resources.loadBalancers && resources.loadBalancers.length > 0) {
      const hoursPerMonth = 730;
      const costPerHour = PRICING.networking[provider]?.['load_balancer_hour'] || 0.025;
      totalCost += resources.loadBalancers.length * hoursPerMonth * costPerHour;
    }

    // Data transfer estimate (100GB/month)
    const dataTransferGB = 100;
    const costPerGB = PRICING.networking[provider]?.['data_transfer_out_gb'] || 0.09;
    totalCost += dataTransferGB * costPerGB;

    return Math.round(totalCost);
  }

  /**
   * Calculate setup costs
   * @private
   */
  _calculateSetupCosts(resources, targetProvider) {
    // Base setup cost
    let cost = 500;

    // Add cost per resource type
    const resourceCount = Object.values(resources).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    cost += resourceCount * 50; // $50 per resource setup

    return cost;
  }

  /**
   * Calculate data migration costs
   * @private
   */
  _calculateDataMigrationCosts(resources) {
    let cost = 0;

    // Database migration
    if (resources.rds && resources.rds.length > 0) {
      cost += resources.rds.length * 500; // $500 per database
    }

    // Storage migration
    if (resources.s3 && resources.s3.length > 0) {
      cost += resources.s3.length * 200; // $200 per bucket
    }

    return cost;
  }

  /**
   * Calculate testing costs
   * @private
   */
  _calculateTestingCosts(resources) {
    const resourceCount = Object.values(resources).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    // Base testing cost + per-resource testing
    return 1000 + (resourceCount * 100);
  }

  /**
   * Calculate labor costs
   * @private
   */
  _calculateLaborCosts(resources) {
    const resourceCount = Object.values(resources).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    // Estimate person-hours at $100/hour
    const hours = 40 + (resourceCount * 8); // Base 40h + 8h per resource
    return hours * 100;
  }

  /**
   * Estimate migration duration
   * @private
   */
  _estimateDuration(resources) {
    const resourceCount = Object.values(resources).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    if (resourceCount < 10) return '2-3 weeks';
    if (resourceCount < 30) return '3-5 weeks';
    if (resourceCount < 50) return '5-8 weeks';
    return '8-12 weeks';
  }
}

module.exports = CostEstimator;
