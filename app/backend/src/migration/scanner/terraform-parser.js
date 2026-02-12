/**
 * Terraform Parser
 * Parses Terraform (.tf) files to understand Infrastructure as Code
 * Extracts resource definitions for migration analysis
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

class TerraformParser {
  constructor() {
    this.supportedResources = [
      'aws_instance',
      'aws_db_instance',
      'aws_s3_bucket',
      'aws_eks_cluster',
      'aws_lambda_function',
      'aws_vpc',
      'aws_lb',
      'aws_cloudwatch_log_group'
    ];
  }

  /**
   * Parse all Terraform files in a directory
   * @param {string} dirPath - Path to terraform directory
   * @returns {Promise<Object>} Parsed resources
   */
  async parseDirectory(dirPath) {
    logger.info(`Parsing Terraform directory: ${dirPath}`);

    try {
      // Check if directory exists
      const exists = await this._directoryExists(dirPath);
      if (!exists) {
        logger.warn(`Terraform directory not found: ${dirPath}`);
        return this._getEmptyResults();
      }

      // Find all .tf files
      const tfFiles = await this._findTerraformFiles(dirPath);

      if (tfFiles.length === 0) {
        logger.info('No Terraform files found');
        return this._getEmptyResults();
      }

      logger.info(`Found ${tfFiles.length} Terraform files`);

      // Parse each file
      const allResources = [];
      for (const filePath of tfFiles) {
        const resources = await this._parseFile(filePath);
        allResources.push(...resources);
      }

      // Organize by resource type
      const organized = this._organizeResources(allResources);

      logger.info('Terraform parsing completed', {
        filesProcessed: tfFiles.length,
        resourcesFound: allResources.length
      });

      return {
        success: true,
        filesProcessed: tfFiles.length,
        resourcesFound: allResources.length,
        resources: organized,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Terraform parsing failed', {
        error: error.message,
        dirPath
      });

      return {
        success: false,
        error: error.message,
        resources: {},
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse a single Terraform file
   * @private
   */
  async _parseFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const resources = this._extractResources(content, filePath);

      logger.debug(`Parsed ${path.basename(filePath)}: found ${resources.length} resources`);

      return resources;
    } catch (error) {
      logger.warn(`Failed to parse ${filePath}`, { error: error.message });
      return [];
    }
  }

  /**
   * Extract resources from Terraform content
   * @private
   */
  _extractResources(content, filePath) {
    const resources = [];

    // Simple regex-based parsing (not a full HCL parser)
    // Matches: resource "aws_instance" "name" { ... }
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;

    let match;
    while ((match = resourceRegex.exec(content)) !== null) {
      const [, resourceType, resourceName, resourceBody] = match;

      // Only process supported AWS resources
      if (this.supportedResources.includes(resourceType)) {
        const resource = {
          type: resourceType,
          name: resourceName,
          file: path.basename(filePath),
          properties: this._parseResourceBody(resourceBody)
        };

        resources.push(resource);
      }
    }

    return resources;
  }

  /**
   * Parse resource body to extract key properties
   * @private
   */
  _parseResourceBody(body) {
    const properties = {};

    // Extract simple key-value pairs
    // Matches: key = "value" or key = value
    const propertyRegex = /(\w+)\s*=\s*"?([^"\n]+)"?/g;

    let match;
    while ((match = propertyRegex.exec(body)) !== null) {
      const [, key, value] = match;
      properties[key] = value.trim();
    }

    return properties;
  }

  /**
   * Organize resources by type
   * @private
   */
  _organizeResources(resources) {
    const organized = {
      ec2: [],
      rds: [],
      s3: [],
      eks: [],
      lambda: [],
      vpc: [],
      loadBalancer: [],
      cloudwatch: []
    };

    resources.forEach(resource => {
      switch (resource.type) {
        case 'aws_instance':
          organized.ec2.push({
            name: resource.name,
            instanceType: resource.properties.instance_type || 'unknown',
            ami: resource.properties.ami,
            file: resource.file
          });
          break;

        case 'aws_db_instance':
          organized.rds.push({
            name: resource.name,
            engine: resource.properties.engine || 'unknown',
            instanceClass: resource.properties.instance_class || 'unknown',
            allocatedStorage: resource.properties.allocated_storage,
            file: resource.file
          });
          break;

        case 'aws_s3_bucket':
          organized.s3.push({
            name: resource.name,
            bucket: resource.properties.bucket || resource.name,
            file: resource.file
          });
          break;

        case 'aws_eks_cluster':
          organized.eks.push({
            name: resource.name,
            version: resource.properties.version,
            file: resource.file
          });
          break;

        case 'aws_lambda_function':
          organized.lambda.push({
            name: resource.name,
            runtime: resource.properties.runtime,
            handler: resource.properties.handler,
            file: resource.file
          });
          break;

        case 'aws_vpc':
          organized.vpc.push({
            name: resource.name,
            cidrBlock: resource.properties.cidr_block,
            file: resource.file
          });
          break;

        case 'aws_lb':
          organized.loadBalancer.push({
            name: resource.name,
            loadBalancerType: resource.properties.load_balancer_type,
            file: resource.file
          });
          break;

        case 'aws_cloudwatch_log_group':
          organized.cloudwatch.push({
            name: resource.name,
            retentionDays: resource.properties.retention_in_days,
            file: resource.file
          });
          break;
      }
    });

    return organized;
  }

  /**
   * Compare Terraform resources with live infrastructure
   * @param {Object} tfResources - Resources from Terraform
   * @param {Object} liveResources - Resources from AWS scan
   * @returns {Object} Comparison results
   */
  compareWithLiveInfra(tfResources, liveResources) {
    const comparison = {
      inSync: [],
      onlyInTerraform: [],
      onlyInAWS: [],
      summary: {}
    };

    // Compare EC2 instances
    const tfEC2Names = new Set(tfResources.ec2.map(r => r.name));
    const liveEC2Ids = new Set(liveResources.ec2.map(r => r.id));

    comparison.summary.ec2 = {
      terraform: tfResources.ec2.length,
      live: liveResources.ec2.length,
      note: 'Comparing by count (name/id matching requires tags)'
    };

    // Compare S3 buckets
    const tfS3Names = new Set(tfResources.s3.map(r => r.bucket));
    const liveS3Names = new Set(liveResources.s3.map(r => r.name));

    tfS3Names.forEach(name => {
      if (liveS3Names.has(name)) {
        comparison.inSync.push({ type: 's3', name });
      } else {
        comparison.onlyInTerraform.push({ type: 's3', name });
      }
    });

    liveS3Names.forEach(name => {
      if (!tfS3Names.has(name)) {
        comparison.onlyInAWS.push({ type: 's3', name });
      }
    });

    comparison.summary.s3 = {
      terraform: tfResources.s3.length,
      live: liveResources.s3.length,
      inSync: comparison.inSync.filter(r => r.type === 's3').length
    };

    // Compare RDS
    comparison.summary.rds = {
      terraform: tfResources.rds.length,
      live: liveResources.rds.length
    };

    // Overall sync status
    const totalTerraform = Object.values(tfResources).reduce((sum, arr) => sum + arr.length, 0);
    const totalLive = Object.values(liveResources).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

    comparison.overallStatus = {
      totalResourcesInTerraform: totalTerraform,
      totalResourcesLive: totalLive,
      percentageMatch: totalTerraform > 0 ? Math.round((comparison.inSync.length / totalTerraform) * 100) : 0
    };

    return comparison;
  }

  /**
   * Extract resource definitions for documentation
   * @param {Object} resources - Parsed resources
   * @returns {Array} Resource definitions
   */
  extractResources(resources) {
    const extracted = [];

    Object.entries(resources).forEach(([type, items]) => {
      items.forEach(item => {
        extracted.push({
          type,
          name: item.name,
          file: item.file,
          properties: item
        });
      });
    });

    return extracted;
  }

  /**
   * Check if directory exists
   * @private
   */
  async _directoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Find all .tf files in directory
   * @private
   */
  async _findTerraformFiles(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      const tfFiles = entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.tf'))
        .map(entry => path.join(dirPath, entry.name));

      return tfFiles;
    } catch (error) {
      logger.error('Failed to read Terraform directory', { error: error.message, dirPath });
      return [];
    }
  }

  /**
   * Get empty results structure
   * @private
   */
  _getEmptyResults() {
    return {
      success: true,
      filesProcessed: 0,
      resourcesFound: 0,
      resources: {
        ec2: [],
        rds: [],
        s3: [],
        eks: [],
        lambda: [],
        vpc: [],
        loadBalancer: [],
        cloudwatch: []
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = TerraformParser;
