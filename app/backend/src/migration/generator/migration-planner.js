/**
 * Migration Planner
 * Generates detailed migration plans from one cloud provider to another
 * Includes steps, timelines, risks, and recommendations
 */

const { ServiceMapper } = require('../mapper/service-equivalence');
const logger = require('../../utils/logger');

class MigrationPlanner {
  constructor() {
    this.serviceMapper = new ServiceMapper();
  }

  /**
   * Generate comprehensive migration plan
   * @param {Object} scanResults - Results from infrastructure scan
   * @param {string} fromProvider - Source cloud provider
   * @param {string} toProvider - Target cloud provider
   * @returns {Promise<Object>} Detailed migration plan
   */
  async generatePlan(scanResults, fromProvider, toProvider) {
    logger.info(`Generating migration plan: ${fromProvider} → ${toProvider}`);

    try {
      // 1. Analyze resource mappings
      const serviceMappings = this._buildServiceMappings(scanResults.resources, fromProvider, toProvider);

      // 2. Calculate complexity
      const complexity = this.serviceMapper.calculateMigrationComplexity(
        scanResults.resources,
        toProvider
      );

      // 3. Generate migration steps
      const steps = this._generateMigrationSteps(
        scanResults.resources,
        fromProvider,
        toProvider,
        complexity
      );

      // 4. Calculate timeline
      const timeline = this._calculateTimeline(scanResults.resources, complexity);

      // 5. Identify risks
      const risks = this._identifyRisks(scanResults.resources, fromProvider, toProvider, complexity);

      // 6. Generate recommendations
      const recommendations = this._generateRecommendations(
        scanResults.resources,
        fromProvider,
        toProvider,
        complexity
      );

      // 7. Estimate costs
      const costEstimate = this._estimateCosts(scanResults.resources, toProvider, complexity);

      // 8. Build rollback strategy
      const rollbackStrategy = this._buildRollbackStrategy(fromProvider, toProvider, timeline);

      const plan = {
        timestamp: new Date().toISOString(),
        from: fromProvider,
        to: toProvider,

        // Service mappings
        serviceMappings,

        // Migration steps
        steps,
        totalEstimatedTime: timeline.total,

        // Analysis
        complexity,
        risks,
        recommendations,

        // Costs and strategy
        estimatedCost: costEstimate,
        rollbackStrategy,

        // Metadata
        generated: new Date().toISOString(),
        version: '1.0.0'
      };

      logger.info('Migration plan generated successfully', {
        from: fromProvider,
        to: toProvider,
        totalSteps: steps.length,
        estimatedTime: timeline.total,
        complexityLevel: complexity.level
      });

      return plan;
    } catch (error) {
      logger.error('Failed to generate migration plan', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Build service mappings between providers
   * @private
   */
  _buildServiceMappings(resources, fromProvider, toProvider) {
    const mappings = {};

    // Map databases
    if (resources.rds && resources.rds.length > 0) {
      const dbType = resources.rds[0].engine || 'postgresql';
      mappings.database = this.serviceMapper.mapService(
        fromProvider,
        toProvider,
        `rds-${dbType}`
      );
    }

    // Map storage
    if (resources.s3 && resources.s3.length > 0) {
      mappings.storage = this.serviceMapper.mapService(fromProvider, toProvider, 's3');
    }

    // Map compute
    if (resources.eks && resources.eks.length > 0) {
      mappings.compute = this.serviceMapper.mapService(fromProvider, toProvider, 'eks');
    } else if (resources.ec2 && resources.ec2.length > 0) {
      mappings.compute = this.serviceMapper.mapService(fromProvider, toProvider, 'ec2');
    }

    // Map serverless
    if (resources.lambda && resources.lambda.length > 0) {
      mappings.serverless = this.serviceMapper.mapService(fromProvider, toProvider, 'lambda');
    }

    // Map monitoring
    if (resources.cloudWatch && resources.cloudWatch.length > 0) {
      mappings.monitoring = this.serviceMapper.mapService(fromProvider, toProvider, 'cloudwatch');
    }

    // Map networking
    if (resources.vpcs && resources.vpcs.length > 0) {
      mappings.networking = this.serviceMapper.mapService(fromProvider, toProvider, 'vpc');
    }

    return mappings;
  }

  /**
   * Generate detailed migration steps
   * @private
   */
  _generateMigrationSteps(resources, fromProvider, toProvider, complexity) {
    const steps = [];
    const providerName = this._getProviderDisplayName(toProvider);

    // Step 1: Preparation
    steps.push({
      step: 1,
      name: 'Preparation & Assessment',
      description: 'Complete infrastructure assessment, create backups, and document dependencies',
      tasks: [
        'Complete comprehensive infrastructure scan',
        'Create full backup of all databases and storage',
        'Document current architecture and dependencies',
        'Identify and resolve migration blockers',
        'Set up target cloud account and IAM policies',
        'Review security and compliance requirements'
      ],
      estimatedTime: '1-2 days',
      automated: true,
      tools: [`${fromProvider}-cli`, 'backup-tools', 'documentation-tools'],
      prerequisites: [],
      risks: ['Incomplete backup', 'Missing dependencies']
    });

    // Step 2: Provisioning
    steps.push({
      step: 2,
      name: 'Target Infrastructure Provisioning',
      description: `Setup and configure infrastructure in ${providerName}`,
      tasks: [
        `Create ${providerName} account and configure IAM/RBAC`,
        'Provision equivalent compute resources',
        'Setup networking (VPC/VCN, subnets, security groups)',
        'Configure load balancers and ingress',
        'Setup monitoring and logging services',
        'Create storage buckets and volumes'
      ],
      estimatedTime: this._calculateProvisioningTime(resources),
      automated: true,
      tools: ['terraform', `${toProvider}-cli`, 'infrastructure-as-code'],
      prerequisites: ['Step 1 completed'],
      risks: ['Resource quota limits', 'Network configuration errors']
    });

    // Step 3: Data Migration
    if (resources.rds && resources.rds.length > 0 || resources.s3 && resources.s3.length > 0) {
      steps.push({
        step: 3,
        name: 'Data Migration',
        description: 'Migrate databases and storage data to target cloud',
        tasks: [
          ...this._getDataMigrationTasks(resources, toProvider)
        ],
        estimatedTime: this._calculateDataMigrationTime(resources),
        automated: false,
        tools: ['pg_dump', 'rclone', 'aws-cli', `${toProvider}-cli`, 'data-validator'],
        prerequisites: ['Step 2 completed', 'Target databases provisioned'],
        risks: ['Data loss', 'Downtime during migration', 'Data integrity issues']
      });
    }

    // Step 4: Application Migration
    if (resources.eks && resources.eks.length > 0) {
      steps.push({
        step: steps.length + 1,
        name: 'Kubernetes Application Deployment',
        description: `Deploy containerized applications to ${providerName} Kubernetes`,
        tasks: [
          `Deploy Kubernetes workloads to ${providerName} K8s (OKE/GKE/AKS)`,
          `Migrate container images to ${providerName} Container Registry`,
          'Update ConfigMaps and Secrets with new cloud provider values',
          'Configure persistent volumes and storage classes',
          'Setup ingress controllers and load balancers',
          'Update environment variables (CLOUD_PROVIDER, endpoints, etc.)'
        ],
        estimatedTime: '2-4 days',
        automated: true,
        tools: ['kubectl', 'docker', 'helm', `${toProvider}-container-registry`],
        prerequisites: ['Step 3 completed', 'Container images available'],
        risks: ['Pod scheduling issues', 'Storage mounting failures', 'Network connectivity']
      });
    } else if (resources.ec2 && resources.ec2.length > 0) {
      steps.push({
        step: steps.length + 1,
        name: 'Application Deployment',
        description: `Deploy applications to ${providerName} compute instances`,
        tasks: [
          'Create VM images or use existing ones',
          'Deploy applications to compute instances',
          'Configure application dependencies',
          'Update environment variables and configurations',
          'Setup application monitoring'
        ],
        estimatedTime: '3-5 days',
        automated: true,
        tools: ['packer', 'ansible', `${toProvider}-cli`],
        prerequisites: ['Step 3 completed'],
        risks: ['Dependency mismatches', 'Configuration errors']
      });
    }

    // Step 5: Testing & Validation
    steps.push({
      step: steps.length + 1,
      name: 'Testing & Validation',
      description: 'Comprehensive testing of migrated environment',
      tasks: [
        'Run smoke tests on all services',
        'Performance testing and benchmarking',
        'Security audit and vulnerability scanning',
        'Load testing to verify scalability',
        'User acceptance testing (UAT)',
        'Validate data integrity and consistency',
        'Test disaster recovery procedures'
      ],
      estimatedTime: '2-3 days',
      automated: true,
      tools: ['jest', 'k6', 'artillery', 'owasp-zap', 'postman'],
      prerequisites: ['All previous steps completed'],
      risks: ['Performance degradation', 'Security vulnerabilities', 'Failed tests']
    });

    // Step 6: Cutover
    steps.push({
      step: steps.length + 1,
      name: 'Production Cutover',
      description: 'Switch production traffic to new environment',
      tasks: [
        'Final data synchronization',
        'Update DNS records to point to new environment',
        'Monitor traffic switch in real-time',
        'Verify all services operational',
        'Monitor error rates and performance metrics',
        'Maintain rollback capability for 24-48 hours'
      ],
      estimatedTime: '4-8 hours',
      automated: false,
      tools: ['dns-manager', 'monitoring-dashboard', 'alerting-system'],
      prerequisites: ['Step 5 passed', 'Stakeholder approval'],
      risks: ['DNS propagation delays', 'Traffic routing issues', 'Service disruptions']
    });

    // Step 7: Post-Migration
    steps.push({
      step: steps.length + 1,
      name: 'Post-Migration Monitoring',
      description: 'Monitor new environment and decommission old infrastructure',
      tasks: [
        'Monitor new environment for 7-30 days',
        'Optimize resource usage and costs',
        'Address any issues or performance problems',
        'Update documentation and runbooks',
        `Schedule decommissioning of ${fromProvider} resources`,
        'Archive backups and migration artifacts'
      ],
      estimatedTime: '1-4 weeks',
      automated: false,
      tools: ['monitoring-tools', 'cost-management-tools'],
      prerequisites: ['Successful cutover', 'Stability period'],
      risks: ['Unexpected issues', 'Cost overruns']
    });

    return steps;
  }

  /**
   * Get data migration tasks based on resources
   * @private
   */
  _getDataMigrationTasks(resources, toProvider) {
    const tasks = [];

    if (resources.rds && resources.rds.length > 0) {
      const dbEngine = resources.rds[0].engine || 'PostgreSQL';
      tasks.push(
        `Export ${dbEngine} database using pg_dump/mysqldump`,
        `Import database to ${toProvider} managed database service`,
        'Validate data integrity and row counts',
        'Setup replication for minimal downtime (if applicable)'
      );
    }

    if (resources.s3 && resources.s3.length > 0) {
      tasks.push(
        `Transfer S3 data to ${toProvider} object storage using rclone`,
        'Verify file counts and checksums',
        'Update application code to use new storage endpoints',
        'Test read/write operations'
      );
    }

    if (tasks.length === 0) {
      tasks.push('No data migration required');
    }

    return tasks;
  }

  /**
   * Calculate overall timeline
   * @private
   */
  _calculateTimeline(resources, complexity) {
    const resourceCount = Object.values(resources).reduce((total, list) => {
      return total + (Array.isArray(list) ? list.length : 0);
    }, 0);

    // Base time in days
    let baseDays = 14; // 2 weeks base

    // Adjust for resource count
    if (resourceCount > 20) baseDays += 7;
    if (resourceCount > 50) baseDays += 7;

    // Adjust for complexity
    if (complexity.level === 'High') baseDays += 7;
    if (complexity.level === 'Very High') baseDays += 14;

    // Convert to weeks
    const weeks = Math.ceil(baseDays / 7);

    return {
      total: `${weeks}-${weeks + 1} weeks`,
      days: baseDays,
      weeks
    };
  }

  /**
   * Calculate provisioning time
   * @private
   */
  _calculateProvisioningTime(resources) {
    const hasK8s = resources.eks && resources.eks.length > 0;
    const hasDB = resources.rds && resources.rds.length > 0;

    if (hasK8s && hasDB) return '3-5 days';
    if (hasK8s || hasDB) return '2-4 days';
    return '1-3 days';
  }

  /**
   * Calculate data migration time
   * @private
   */
  _calculateDataMigrationTime(resources) {
    const dbCount = resources.rds ? resources.rds.length : 0;
    const s3Count = resources.s3 ? resources.s3.length : 0;

    if (dbCount > 2 || s3Count > 5) return '5-7 days';
    if (dbCount > 0 || s3Count > 0) return '3-5 days';
    return '1-2 days';
  }

  /**
   * Identify migration risks
   * @private
   */
  _identifyRisks(resources, fromProvider, toProvider, complexity) {
    const risks = [];

    // General risks
    risks.push({
      risk: 'Data loss during migration',
      severity: 'High',
      mitigation: 'Multiple backups, dry runs, data validation checks'
    });

    risks.push({
      risk: 'Service downtime exceeds planned window',
      severity: 'Medium',
      mitigation: 'Blue-green deployment, phased migration'
    });

    // Complexity-based risks
    if (complexity.level === 'High' || complexity.level === 'Very High') {
      risks.push({
        risk: 'Service incompatibilities discovered late',
        severity: 'High',
        mitigation: 'Thorough testing phase, proof of concept for complex services'
      });
    }

    // Resource-specific risks
    if (resources.rds && resources.rds.length > 0) {
      risks.push({
        risk: 'Database performance degradation',
        severity: 'Medium',
        mitigation: 'Performance testing, query optimization, resource sizing'
      });
    }

    if (resources.eks && resources.eks.length > 0) {
      risks.push({
        risk: 'Kubernetes configuration incompatibilities',
        severity: 'Low',
        mitigation: 'Kubernetes is standard across clouds, minimal changes needed'
      });
    }

    risks.push({
      risk: 'DNS propagation delays',
      severity: 'Low',
      mitigation: 'Lower TTL values before migration, staged DNS update'
    });

    risks.push({
      risk: 'Unexpected cost overruns',
      severity: 'Medium',
      mitigation: 'Cost monitoring, resource optimization, budget alerts'
    });

    return risks;
  }

  /**
   * Generate migration recommendations
   * @private
   */
  _generateRecommendations(resources, fromProvider, toProvider, complexity) {
    const recommendations = [];

    recommendations.push('Schedule migration during low-traffic period (weekends/holidays)');
    recommendations.push('Notify all stakeholders at least 1 week in advance');

    if (complexity.level === 'High' || complexity.level === 'Very High') {
      recommendations.push('Consider phased migration approach - migrate non-critical services first');
      recommendations.push('Conduct proof of concept for complex services');
    }

    recommendations.push(`Run parallel environments for 1-2 weeks before full cutover`);
    recommendations.push(`Keep ${fromProvider} infrastructure active for 30 days as backup`);

    if (resources.rds && resources.rds.length > 0) {
      recommendations.push('Setup database replication for minimal downtime migration');
    }

    if (resources.eks && resources.eks.length > 0) {
      recommendations.push('Leverage Kubernetes portability - containers can be reused without changes');
    }

    recommendations.push('Document all configuration changes and new endpoints');
    recommendations.push('Train team on new cloud platform before migration');
    recommendations.push('Setup comprehensive monitoring before cutover');

    return recommendations;
  }

  /**
   * Estimate migration costs
   * @private
   */
  _estimateCosts(resources, toProvider, complexity) {
    // Simplified cost estimation
    // In production, this would integrate with cloud pricing APIs

    const resourceCount = Object.values(resources).reduce((total, list) => {
      return total + (Array.isArray(list) ? list.length : 0);
    }, 0);

    let baseCost = 3000;
    if (resourceCount > 20) baseCost += 2000;
    if (resourceCount > 50) baseCost += 3000;

    if (complexity.level === 'High') baseCost += 2000;
    if (complexity.level === 'Very High') baseCost += 5000;

    return {
      migrationCost: `$${baseCost.toLocaleString()} - $${(baseCost * 1.5).toLocaleString()}`,
      breakdown: {
        planning: '$1,000 - $2,000',
        execution: `$${(baseCost * 0.6).toLocaleString()} - $${(baseCost * 0.8).toLocaleString()}`,
        testing: '$1,000 - $2,000',
        contingency: '20% buffer'
      },
      monthlySavings: this._estimateMonthlySavings(toProvider),
      roi: this._calculateROI(baseCost, toProvider),
      note: 'Estimates based on typical migration projects. Actual costs may vary.'
    };
  }

  /**
   * Estimate monthly savings
   * @private
   */
  _estimateMonthlySavings(toProvider) {
    const savings = {
      oci: '$800 - $1,500 (20-30% savings vs AWS)',
      gcp: '$500 - $1,000 (10-20% savings vs AWS)',
      azure: '$300 - $800 (5-15% savings vs AWS)',
      aws: '$0 (no change)'
    };

    return savings[toProvider] || '$0';
  }

  /**
   * Calculate ROI
   * @private
   */
  _calculateROI(migrationCost, toProvider) {
    const monthlySavingsMap = {
      oci: 1200,
      gcp: 750,
      azure: 550,
      aws: 0
    };

    const monthlySavings = monthlySavingsMap[toProvider] || 0;
    if (monthlySavings === 0) return 'N/A';

    const months = Math.ceil(migrationCost / monthlySavings);
    return `${months} months to break even`;
  }

  /**
   * Build rollback strategy
   * @private
   */
  _buildRollbackStrategy(fromProvider, toProvider, timeline) {
    return {
      method: 'Blue-Green Deployment',
      timeToRollback: '< 1 hour via DNS switch',
      steps: [
        `Keep ${fromProvider} environment running for 30 days post-migration`,
        'Maintain ability to switch DNS back to original environment',
        'Keep recent backups of all data',
        'Document rollback procedures and test them',
        'Assign rollback decision authority to senior stakeholders'
      ],
      criteria: [
        'Service unavailability > 30 minutes',
        'Data integrity issues detected',
        'Performance degradation > 50%',
        'Critical security vulnerability discovered'
      ],
      dataSync: 'If rollback needed, sync data from new environment back to old (if applicable)'
    };
  }

  /**
   * Get provider display name
   * @private
   */
  _getProviderDisplayName(provider) {
    const names = {
      aws: 'AWS',
      oci: 'OCI',
      gcp: 'GCP',
      azure: 'Azure'
    };
    return names[provider] || provider.toUpperCase();
  }
}

module.exports = MigrationPlanner;
