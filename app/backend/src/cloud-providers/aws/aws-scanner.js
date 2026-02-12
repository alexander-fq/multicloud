/**
 * AWS Scanner
 * Wrapper class that implements ScannerInterface for AWS
 * Coordinates resource scanning, IaC parsing, and result consolidation
 */

const ScannerInterface = require('../../interfaces/scanner.interface');
const AWSResourceScanner = require('../../migration/scanner/aws-resource-scanner');
const TerraformParser = require('../../migration/scanner/terraform-parser');
const KubernetesParser = require('../../migration/scanner/kubernetes-parser');
const logger = require('../../utils/logger');
const path = require('path');

class AWSScanner extends ScannerInterface {
  constructor() {
    super();
    this.resourceScanner = new AWSResourceScanner();
    this.tfParser = new TerraformParser();
    this.k8sParser = new KubernetesParser();
    this.provider = 'aws';
    this.region = process.env.AWS_REGION || 'us-east-1';
  }

  /**
   * Perform complete AWS infrastructure scan
   * Includes AWS resource scanning + optional Terraform/Kubernetes parsing
   * @returns {Promise<Object>} Consolidated scan results
   */
  async scan() {
    logger.info('Starting AWS infrastructure scan', {
      provider: this.provider,
      region: this.region
    });

    try {
      // 1. Scan AWS resources using AWS SDK
      const awsResources = await this.resourceScanner.scanAll();

      // 2. Parse Terraform files (if directory exists)
      const terraformPath = path.join(process.cwd(), 'terraform');
      const terraformResults = await this.tfParser.parseDirectory(terraformPath);

      // 3. Parse Kubernetes manifests (if directory exists)
      const kubernetesPath = path.join(process.cwd(), 'kubernetes');
      const kubernetesResults = await this.k8sParser.parseManifests(kubernetesPath);

      // 4. Calculate readiness score
      const readiness = this.resourceScanner.calculateReadiness(awsResources);

      // 5. Estimate costs
      const costs = await this.resourceScanner.estimateCosts();

      // 6. Consolidate all results
      const scanResults = this._consolidateResults(
        awsResources,
        readiness,
        costs,
        terraformResults,
        kubernetesResults
      );

      logger.info('AWS infrastructure scan completed successfully', {
        totalResources: this._countTotalResources(awsResources),
        readinessScore: readiness.score,
        terraformFiles: terraformResults.filesProcessed || 0,
        kubernetesFiles: kubernetesResults.filesProcessed || 0
      });

      return scanResults;
    } catch (error) {
      logger.error('AWS infrastructure scan failed', {
        error: error.message,
        stack: error.stack
      });

      // Return error-safe results
      return this._getErrorResults(error);
    }
  }

  /**
   * Scan specific resource type
   * @param {string} resourceType - Type of resource (ec2, rds, s3, etc.)
   * @returns {Promise<Array>} Resources of specified type
   */
  async scanByType(resourceType) {
    logger.info(`Scanning AWS resources by type: ${resourceType}`);

    const methodMap = {
      'ec2': 'scanEC2Instances',
      'rds': 'scanRDSInstances',
      's3': 'scanS3Buckets',
      'eks': 'scanEKSClusters',
      'lambda': 'scanLambdaFunctions',
      'vpc': 'scanVPCs',
      'loadbalancer': 'scanLoadBalancers',
      'cloudwatch': 'scanCloudWatch'
    };

    const method = methodMap[resourceType.toLowerCase()];
    if (!method) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }

    return await this.resourceScanner[method]();
  }

  /**
   * Calculate migration readiness
   * @param {Object} scanResults - Scan results
   * @returns {Promise<Object>} Readiness analysis
   */
  async calculateReadiness(scanResults) {
    return this.resourceScanner.calculateReadiness(scanResults);
  }

  /**
   * Consolidate scan results into frontend-expected format
   * @private
   */
  _consolidateResults(awsResources, readiness, costs, terraformResults, kubernetesResults) {
    // Calculate resource counts
    const resourceCounts = {
      ec2: awsResources.ec2.length,
      rds: awsResources.rds.length,
      s3: awsResources.s3.length,
      eks: awsResources.eks.length,
      lambda: awsResources.lambda.length,
      vpcs: awsResources.vpcs.length,
      loadBalancers: awsResources.loadBalancers.length,
      cloudWatchAlarms: awsResources.cloudWatch.length
    };

    // Build services summary for frontend
    const services = this._buildServicesSummary(awsResources);

    // Calculate estimated migration time based on complexity
    const estimatedTime = this._estimateMigrationTime(resourceCounts, readiness.score);

    return {
      timestamp: new Date().toISOString(),
      currentProvider: this.provider,
      region: this.region,

      // Resource details
      resources: awsResources,
      resourceCounts,

      // Services summary (for frontend display)
      services,

      // Migration readiness
      migrationReadiness: `${readiness.score}% - ${readiness.level}`,
      readinessDetails: {
        score: readiness.score,
        level: readiness.level,
        issues: readiness.issues,
        recommendations: readiness.recommendations
      },

      // Time and cost estimates
      estimatedMigrationTime: estimatedTime,
      estimatedCosts: costs,

      // Infrastructure as Code analysis
      terraform: terraformResults || null,
      kubernetes: kubernetesResults || null,

      // Metadata
      scanDate: new Date().toISOString(),
      scanVersion: '1.1.0' // Updated with IaC support
    };
  }

  /**
   * Build services summary for frontend
   * @private
   */
  _buildServicesSummary(awsResources) {
    const services = {};

    // Database services
    if (awsResources.rds.length > 0) {
      const engines = [...new Set(awsResources.rds.map(db => db.engine))];
      services.database = {
        type: engines.join(', '),
        provider: 'RDS',
        count: awsResources.rds.length,
        instances: awsResources.rds.map(db => ({
          id: db.id,
          engine: db.engine,
          class: db.instanceClass,
          status: db.status
        }))
      };
    }

    // Storage services
    if (awsResources.s3.length > 0) {
      services.storage = {
        provider: 'S3',
        count: awsResources.s3.length,
        buckets: awsResources.s3.map(b => b.name),
        totalObjects: awsResources.s3.reduce((sum, b) => sum + (b.objectCount || 0), 0)
      };
    }

    // Compute services
    if (awsResources.ec2.length > 0 || awsResources.eks.length > 0) {
      const computeProviders = [];
      if (awsResources.ec2.length > 0) computeProviders.push(`EC2 (${awsResources.ec2.length})`);
      if (awsResources.eks.length > 0) computeProviders.push(`EKS (${awsResources.eks.length})`);

      services.compute = {
        provider: computeProviders.join(', '),
        ec2Count: awsResources.ec2.length,
        eksCount: awsResources.eks.length,
        instances: awsResources.ec2.map(i => ({
          id: i.id,
          type: i.type,
          state: i.state
        })),
        clusters: awsResources.eks.map(c => ({
          name: c.name,
          status: c.status,
          version: c.version
        }))
      };
    }

    // Monitoring services
    if (awsResources.cloudWatch.length > 0) {
      services.monitoring = {
        provider: 'CloudWatch',
        configured: true,
        alarmCount: awsResources.cloudWatch.length
      };
    }

    // Serverless services
    if (awsResources.lambda.length > 0) {
      services.serverless = {
        provider: 'Lambda',
        functionCount: awsResources.lambda.length,
        functions: awsResources.lambda.map(f => ({
          name: f.name,
          runtime: f.runtime,
          memory: f.memory
        }))
      };
    }

    // Networking services
    if (awsResources.vpcs.length > 0 || awsResources.loadBalancers.length > 0) {
      services.networking = {
        vpcCount: awsResources.vpcs.length,
        loadBalancerCount: awsResources.loadBalancers.length,
        vpcs: awsResources.vpcs.map(v => ({
          id: v.id,
          cidr: v.cidrBlock,
          isDefault: v.isDefault
        }))
      };
    }

    return services;
  }

  /**
   * Estimate migration time based on infrastructure complexity
   * @private
   */
  _estimateMigrationTime(resourceCounts, readinessScore) {
    // Calculate complexity score
    const complexity =
      resourceCounts.ec2 * 2 +
      resourceCounts.rds * 3 +
      resourceCounts.s3 * 1 +
      resourceCounts.eks * 5 +
      resourceCounts.lambda * 1 +
      resourceCounts.loadBalancers * 2;

    // Adjust based on readiness
    const readinessMultiplier = readinessScore >= 80 ? 1 : readinessScore >= 60 ? 1.3 : 1.5;

    const adjustedComplexity = complexity * readinessMultiplier;

    // Estimate time ranges
    if (adjustedComplexity < 20) {
      return '1-2 weeks';
    } else if (adjustedComplexity < 50) {
      return '2-3 weeks';
    } else if (adjustedComplexity < 100) {
      return '3-4 weeks';
    } else {
      return '4-6 weeks';
    }
  }

  /**
   * Count total resources
   * @private
   */
  _countTotalResources(awsResources) {
    return Object.values(awsResources).reduce((total, resourceList) => {
      return total + (Array.isArray(resourceList) ? resourceList.length : 0);
    }, 0);
  }

  /**
   * Return safe error results
   * @private
   */
  _getErrorResults(error) {
    return {
      timestamp: new Date().toISOString(),
      currentProvider: this.provider,
      region: this.region,
      error: true,
      errorMessage: error.message,
      services: {
        error: {
          message: 'Unable to scan AWS resources',
          details: error.message
        }
      },
      migrationReadiness: 'Unknown - Scan Failed',
      estimatedMigrationTime: 'Unable to estimate',
      resources: {
        ec2: [],
        rds: [],
        s3: [],
        eks: [],
        lambda: [],
        vpcs: [],
        loadBalancers: [],
        cloudWatch: []
      }
    };
  }
}

module.exports = AWSScanner;
