/**
 * AWS Resource Scanner
 * Scans AWS infrastructure using AWS SDK
 * Detects EC2, RDS, S3, EKS, Lambda, VPC, Load Balancers, CloudWatch
 */

const AWS = require('aws-sdk');
const logger = require('../../utils/logger');

class AWSResourceScanner {
  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';

    // Initialize AWS SDK clients (with fallback for older SDK versions)
    try {
      this.ec2 = new AWS.EC2({ region });
    } catch (e) {
      logger.warn('EC2 service not available in AWS SDK');
      this.ec2 = null;
    }

    try {
      this.rds = new AWS.RDS({ region });
    } catch (e) {
      logger.warn('RDS service not available in AWS SDK');
      this.rds = null;
    }

    try {
      this.s3 = new AWS.S3({ region });
    } catch (e) {
      logger.warn('S3 service not available in AWS SDK');
      this.s3 = null;
    }

    try {
      this.eks = AWS.EKS ? new AWS.EKS({ region }) : null;
    } catch (e) {
      logger.warn('EKS service not available in AWS SDK (older version)');
      this.eks = null;
    }

    try {
      this.lambda = new AWS.Lambda({ region });
    } catch (e) {
      logger.warn('Lambda service not available in AWS SDK');
      this.lambda = null;
    }

    try {
      this.elbv2 = AWS.ELBv2 ? new AWS.ELBv2({ region }) : null;
    } catch (e) {
      logger.warn('ELBv2 service not available in AWS SDK');
      this.elbv2 = null;
    }

    try {
      this.cloudwatch = new AWS.CloudWatch({ region });
    } catch (e) {
      logger.warn('CloudWatch service not available in AWS SDK');
      this.cloudwatch = null;
    }

    this.region = region;
  }

  /**
   * Scan all AWS resources
   * @returns {Promise<Object>} Complete scan results
   */
  async scanAll() {
    logger.info('Starting comprehensive AWS resource scan', { region: this.region });

    try {
      // Scan all resource types in parallel for better performance
      const [
        ec2Instances,
        rdsInstances,
        s3Buckets,
        eksClusters,
        lambdaFunctions,
        vpcs,
        loadBalancers,
        cloudWatchAlarms
      ] = await Promise.allSettled([
        this.scanEC2Instances(),
        this.scanRDSInstances(),
        this.scanS3Buckets(),
        this.scanEKSClusters(),
        this.scanLambdaFunctions(),
        this.scanVPCs(),
        this.scanLoadBalancers(),
        this.scanCloudWatch()
      ]);

      const results = {
        ec2: this._getResultValue(ec2Instances, []),
        rds: this._getResultValue(rdsInstances, []),
        s3: this._getResultValue(s3Buckets, []),
        eks: this._getResultValue(eksClusters, []),
        lambda: this._getResultValue(lambdaFunctions, []),
        vpcs: this._getResultValue(vpcs, []),
        loadBalancers: this._getResultValue(loadBalancers, []),
        cloudWatch: this._getResultValue(cloudWatchAlarms, [])
      };

      logger.info('AWS resource scan completed', {
        ec2Count: results.ec2.length,
        rdsCount: results.rds.length,
        s3Count: results.s3.length,
        eksCount: results.eks.length,
        lambdaCount: results.lambda.length,
        vpcCount: results.vpcs.length,
        lbCount: results.loadBalancers.length,
        alarmCount: results.cloudWatch.length
      });

      return results;
    } catch (error) {
      logger.error('AWS resource scan failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Helper to extract value from Promise.allSettled results
   */
  _getResultValue(result, defaultValue) {
    return result.status === 'fulfilled' ? result.value : defaultValue;
  }

  /**
   * Scan EC2 Instances
   * @returns {Promise<Array>} List of EC2 instances
   */
  async scanEC2Instances() {
    if (!this.ec2) {
      logger.debug('EC2 service not available, skipping');
      return [];
    }

    try {
      logger.info('Scanning EC2 instances...');
      const data = await this.ec2.describeInstances().promise();

      const instances = [];
      data.Reservations.forEach(reservation => {
        reservation.Instances.forEach(instance => {
          instances.push({
            id: instance.InstanceId,
            type: instance.InstanceType,
            state: instance.State.Name,
            launchTime: instance.LaunchTime,
            availabilityZone: instance.Placement.AvailabilityZone,
            vpcId: instance.VpcId,
            privateIp: instance.PrivateIpAddress,
            publicIp: instance.PublicIpAddress,
            tags: this._extractTags(instance.Tags)
          });
        });
      });

      logger.info(`Found ${instances.length} EC2 instances`);
      return instances;
    } catch (error) {
      logger.warn('EC2 scan failed', { error: error.message });
      return [];
    }
  }

  /**
   * Scan RDS Instances
   * @returns {Promise<Array>} List of RDS instances
   */
  async scanRDSInstances() {
    if (!this.rds) {
      logger.debug('RDS service not available, skipping');
      return [];
    }

    try {
      logger.info('Scanning RDS instances...');
      const data = await this.rds.describeDBInstances().promise();

      const instances = data.DBInstances.map(db => ({
        id: db.DBInstanceIdentifier,
        engine: db.Engine,
        engineVersion: db.EngineVersion,
        instanceClass: db.DBInstanceClass,
        status: db.DBInstanceStatus,
        allocatedStorage: db.AllocatedStorage,
        storageType: db.StorageType,
        multiAZ: db.MultiAZ,
        endpoint: db.Endpoint ? db.Endpoint.Address : null,
        port: db.Endpoint ? db.Endpoint.Port : null,
        availabilityZone: db.AvailabilityZone
      }));

      logger.info(`Found ${instances.length} RDS instances`);
      return instances;
    } catch (error) {
      logger.warn('RDS scan failed', { error: error.message });
      return [];
    }
  }

  /**
   * Scan S3 Buckets
   * @returns {Promise<Array>} List of S3 buckets
   */
  async scanS3Buckets() {
    if (!this.s3) {
      logger.debug('S3 service not available, skipping');
      return [];
    }

    try {
      logger.info('Scanning S3 buckets...');
      const data = await this.s3.listBuckets().promise();

      const buckets = await Promise.all(
        data.Buckets.map(async (bucket) => {
          try {
            // Get bucket location
            const locationData = await this.s3.getBucketLocation({
              Bucket: bucket.Name
            }).promise();

            // Get bucket size (approximate via listing objects)
            let objectCount = 0;
            try {
              const objectsData = await this.s3.listObjectsV2({
                Bucket: bucket.Name,
                MaxKeys: 1000
              }).promise();
              objectCount = objectsData.KeyCount || 0;
            } catch (err) {
              // Ignore if we can't list objects (permissions)
            }

            return {
              name: bucket.Name,
              creationDate: bucket.CreationDate,
              region: locationData.LocationConstraint || 'us-east-1',
              objectCount
            };
          } catch (err) {
            return {
              name: bucket.Name,
              creationDate: bucket.CreationDate,
              region: 'unknown',
              objectCount: 0,
              error: err.message
            };
          }
        })
      );

      logger.info(`Found ${buckets.length} S3 buckets`);
      return buckets;
    } catch (error) {
      logger.warn('S3 scan failed', { error: error.message });
      return [];
    }
  }

  /**
   * Scan EKS Clusters
   * @returns {Promise<Array>} List of EKS clusters
   */
  async scanEKSClusters() {
    if (!this.eks) {
      logger.debug('EKS service not available, skipping');
      return [];
    }

    try {
      logger.info('Scanning EKS clusters...');
      const data = await this.eks.listClusters().promise();

      const clusters = await Promise.all(
        data.clusters.map(async (clusterName) => {
          try {
            const details = await this.eks.describeCluster({
              name: clusterName
            }).promise();

            return {
              name: details.cluster.name,
              status: details.cluster.status,
              version: details.cluster.version,
              endpoint: details.cluster.endpoint,
              roleArn: details.cluster.roleArn,
              vpcId: details.cluster.resourcesVpcConfig.vpcId,
              createdAt: details.cluster.createdAt
            };
          } catch (err) {
            return {
              name: clusterName,
              error: err.message
            };
          }
        })
      );

      logger.info(`Found ${clusters.length} EKS clusters`);
      return clusters;
    } catch (error) {
      logger.warn('EKS scan failed', { error: error.message });
      return [];
    }
  }

  /**
   * Scan Lambda Functions
   * @returns {Promise<Array>} List of Lambda functions
   */
  async scanLambdaFunctions() {
    if (!this.lambda) {
      logger.debug('Lambda service not available, skipping');
      return [];
    }

    try {
      logger.info('Scanning Lambda functions...');
      const data = await this.lambda.listFunctions().promise();

      const functions = data.Functions.map(func => ({
        name: func.FunctionName,
        runtime: func.Runtime,
        handler: func.Handler,
        codeSize: func.CodeSize,
        memory: func.MemorySize,
        timeout: func.Timeout,
        lastModified: func.LastModified,
        role: func.Role
      }));

      logger.info(`Found ${functions.length} Lambda functions`);
      return functions;
    } catch (error) {
      logger.warn('Lambda scan failed', { error: error.message });
      return [];
    }
  }

  /**
   * Scan VPCs
   * @returns {Promise<Array>} List of VPCs
   */
  async scanVPCs() {
    if (!this.ec2) {
      logger.debug('EC2 service not available, skipping VPC scan');
      return [];
    }

    try {
      logger.info('Scanning VPCs...');
      const data = await this.ec2.describeVpcs().promise();

      const vpcs = data.Vpcs.map(vpc => ({
        id: vpc.VpcId,
        cidrBlock: vpc.CidrBlock,
        isDefault: vpc.IsDefault,
        state: vpc.State,
        tags: this._extractTags(vpc.Tags)
      }));

      logger.info(`Found ${vpcs.length} VPCs`);
      return vpcs;
    } catch (error) {
      logger.warn('VPC scan failed', { error: error.message });
      return [];
    }
  }

  /**
   * Scan Load Balancers
   * @returns {Promise<Array>} List of load balancers
   */
  async scanLoadBalancers() {
    if (!this.elbv2) {
      logger.debug('ELBv2 service not available, skipping');
      return [];
    }

    try {
      logger.info('Scanning Load Balancers...');
      const data = await this.elbv2.describeLoadBalancers().promise();

      const loadBalancers = data.LoadBalancers.map(lb => ({
        name: lb.LoadBalancerName,
        arn: lb.LoadBalancerArn,
        dnsName: lb.DNSName,
        scheme: lb.Scheme,
        type: lb.Type,
        state: lb.State.Code,
        vpcId: lb.VpcId,
        availabilityZones: lb.AvailabilityZones.map(az => az.ZoneName)
      }));

      logger.info(`Found ${loadBalancers.length} Load Balancers`);
      return loadBalancers;
    } catch (error) {
      logger.warn('Load Balancer scan failed', { error: error.message });
      return [];
    }
  }

  /**
   * Scan CloudWatch Alarms
   * @returns {Promise<Array>} List of CloudWatch alarms
   */
  async scanCloudWatch() {
    if (!this.cloudwatch) {
      logger.debug('CloudWatch service not available, skipping');
      return [];
    }

    try {
      logger.info('Scanning CloudWatch alarms...');
      const data = await this.cloudwatch.describeAlarms().promise();

      const alarms = data.MetricAlarms.map(alarm => ({
        name: alarm.AlarmName,
        description: alarm.AlarmDescription,
        state: alarm.StateValue,
        metricName: alarm.MetricName,
        namespace: alarm.Namespace,
        threshold: alarm.Threshold,
        comparisonOperator: alarm.ComparisonOperator
      }));

      logger.info(`Found ${alarms.length} CloudWatch alarms`);
      return alarms;
    } catch (error) {
      logger.warn('CloudWatch scan failed', { error: error.message });
      return [];
    }
  }

  /**
   * Extract tags as key-value object
   */
  _extractTags(tags) {
    if (!tags || !Array.isArray(tags)) return {};
    return tags.reduce((acc, tag) => {
      acc[tag.Key] = tag.Value;
      return acc;
    }, {});
  }

  /**
   * Calculate estimated monthly costs (simplified)
   * @returns {Promise<Object>} Cost estimation
   */
  async estimateCosts() {
    // Simplified cost estimation
    // In production, use AWS Pricing API
    return {
      estimated: true,
      note: 'Detailed pricing requires AWS Cost Explorer API',
      approximateMonthly: '$500-2000'
    };
  }

  /**
   * Calculate migration readiness score
   * @param {Object} resources - Scanned resources
   * @returns {Object} Readiness score and analysis
   */
  calculateReadiness(resources) {
    let score = 100;
    const issues = [];

    // Check for old instance types
    const oldInstanceTypes = resources.ec2.filter(i =>
      i.type && (i.type.startsWith('t1') || i.type.startsWith('m1'))
    );
    if (oldInstanceTypes.length > 0) {
      score -= 10;
      issues.push(`${oldInstanceTypes.length} EC2 instances using deprecated instance types`);
    }

    // Check for single-AZ RDS
    const singleAZDatabases = resources.rds.filter(db => !db.multiAZ);
    if (singleAZDatabases.length > 0) {
      score -= 15;
      issues.push(`${singleAZDatabases.length} RDS instances without Multi-AZ (availability risk)`);
    }

    // Check for EKS clusters
    if (resources.eks.length > 0) {
      score += 10; // Bonus for already using containers
      issues.push(`${resources.eks.length} EKS clusters detected (container-ready)`);
    }

    // Check for Lambda functions
    if (resources.lambda.length > 0) {
      score += 5; // Bonus for serverless
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      level: score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low',
      issues,
      recommendations: this._generateRecommendations(resources, issues)
    };
  }

  /**
   * Generate recommendations based on scan results
   */
  _generateRecommendations(resources, issues) {
    const recommendations = [];

    if (issues.some(i => i.includes('deprecated'))) {
      recommendations.push('Upgrade to modern instance types (t3, t4g, m5, m6i)');
    }

    if (issues.some(i => i.includes('Multi-AZ'))) {
      recommendations.push('Enable Multi-AZ for production databases');
    }

    if (resources.s3.length === 0) {
      recommendations.push('Consider using object storage (S3) for scalability');
    }

    if (resources.eks.length === 0 && resources.ec2.length > 5) {
      recommendations.push('Consider containerization with EKS for better portability');
    }

    return recommendations;
  }
}

module.exports = AWSResourceScanner;
