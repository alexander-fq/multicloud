/**
 * Kubernetes Parser
 * Parses Kubernetes manifest files (YAML)
 * Extracts Deployments, Services, ConfigMaps, etc.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

class KubernetesParser {
  constructor() {
    this.supportedKinds = [
      'Deployment',
      'Service',
      'ConfigMap',
      'Secret',
      'Ingress',
      'PersistentVolumeClaim',
      'StatefulSet',
      'DaemonSet'
    ];
  }

  /**
   * Parse all Kubernetes manifests in a directory
   * @param {string} dirPath - Path to kubernetes directory
   * @returns {Promise<Object>} Parsed resources
   */
  async parseManifests(dirPath) {
    logger.info(`Parsing Kubernetes manifests: ${dirPath}`);

    try {
      // Check if directory exists
      const exists = await this._directoryExists(dirPath);
      if (!exists) {
        logger.warn(`Kubernetes directory not found: ${dirPath}`);
        return this._getEmptyResults();
      }

      // Find all YAML files
      const yamlFiles = await this._findYamlFiles(dirPath);

      if (yamlFiles.length === 0) {
        logger.info('No Kubernetes manifest files found');
        return this._getEmptyResults();
      }

      logger.info(`Found ${yamlFiles.length} Kubernetes manifest files`);

      // Parse each file
      const allResources = [];
      for (const filePath of yamlFiles) {
        const resources = await this._parseFile(filePath);
        allResources.push(...resources);
      }

      // Organize by kind
      const organized = this._organizeResources(allResources);

      // Calculate resource requirements
      const resourceRequirements = this._calculateResourceRequirements(organized);

      logger.info('Kubernetes parsing completed', {
        filesProcessed: yamlFiles.length,
        resourcesFound: allResources.length
      });

      return {
        success: true,
        filesProcessed: yamlFiles.length,
        resourcesFound: allResources.length,
        resources: organized,
        resourceRequirements,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Kubernetes parsing failed', {
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
   * Parse a single YAML file
   * @private
   */
  async _parseFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Split by document separator (---)
      const documents = content.split(/^---$/m).filter(doc => doc.trim());

      const resources = [];
      for (const doc of documents) {
        const resource = this._parseYamlDocument(doc, filePath);
        if (resource) {
          resources.push(resource);
        }
      }

      logger.debug(`Parsed ${path.basename(filePath)}: found ${resources.length} resources`);

      return resources;
    } catch (error) {
      logger.warn(`Failed to parse ${filePath}`, { error: error.message });
      return [];
    }
  }

  /**
   * Parse a single YAML document (simple YAML parser)
   * @private
   */
  _parseYamlDocument(content, filePath) {
    try {
      // Extract kind
      const kindMatch = content.match(/^kind:\s*(.+)$/m);
      if (!kindMatch) return null;

      const kind = kindMatch[1].trim();

      // Only process supported kinds
      if (!this.supportedKinds.includes(kind)) {
        return null;
      }

      // Extract metadata name
      const nameMatch = content.match(/^\s+name:\s*(.+)$/m);
      const name = nameMatch ? nameMatch[1].trim() : 'unknown';

      // Extract namespace
      const namespaceMatch = content.match(/^\s+namespace:\s*(.+)$/m);
      const namespace = namespaceMatch ? namespaceMatch[1].trim() : 'default';

      const resource = {
        kind,
        name,
        namespace,
        file: path.basename(filePath)
      };

      // Extract kind-specific details
      if (kind === 'Deployment' || kind === 'StatefulSet') {
        resource.replicas = this._extractReplicas(content);
        resource.containers = this._extractContainers(content);
        resource.resources = this._extractResourceRequests(content);
      } else if (kind === 'Service') {
        resource.type = this._extractServiceType(content);
        resource.ports = this._extractServicePorts(content);
      } else if (kind === 'Ingress') {
        resource.hosts = this._extractIngressHosts(content);
      } else if (kind === 'PersistentVolumeClaim') {
        resource.storageClass = this._extractStorageClass(content);
        resource.storage = this._extractStorage(content);
      }

      return resource;
    } catch (error) {
      logger.debug('Failed to parse YAML document', { error: error.message });
      return null;
    }
  }

  /**
   * Extract replicas from deployment/statefulset
   * @private
   */
  _extractReplicas(content) {
    const match = content.match(/^\s+replicas:\s*(\d+)$/m);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Extract container names
   * @private
   */
  _extractContainers(content) {
    const containers = [];
    const containerMatches = content.matchAll(/^\s+- name:\s*(.+)$/gm);

    for (const match of containerMatches) {
      const name = match[1].trim();
      // Simple heuristic: if it looks like a container name (not a service/configmap name)
      if (!name.includes('/')) {
        containers.push(name);
      }
    }

    return containers;
  }

  /**
   * Extract resource requests (CPU, memory)
   * @private
   */
  _extractResourceRequests(content) {
    const resources = {
      requests: {},
      limits: {}
    };

    // Extract requests
    const cpuRequestMatch = content.match(/requests:\s*[\s\S]*?cpu:\s*"?([^"\n]+)"?/);
    const memRequestMatch = content.match(/requests:\s*[\s\S]*?memory:\s*"?([^"\n]+)"?/);

    if (cpuRequestMatch) resources.requests.cpu = cpuRequestMatch[1].trim();
    if (memRequestMatch) resources.requests.memory = memRequestMatch[1].trim();

    // Extract limits
    const cpuLimitMatch = content.match(/limits:\s*[\s\S]*?cpu:\s*"?([^"\n]+)"?/);
    const memLimitMatch = content.match(/limits:\s*[\s\S]*?memory:\s*"?([^"\n]+)"?/);

    if (cpuLimitMatch) resources.limits.cpu = cpuLimitMatch[1].trim();
    if (memLimitMatch) resources.limits.memory = memLimitMatch[1].trim();

    return resources;
  }

  /**
   * Extract service type
   * @private
   */
  _extractServiceType(content) {
    const match = content.match(/^\s+type:\s*(.+)$/m);
    return match ? match[1].trim() : 'ClusterIP';
  }

  /**
   * Extract service ports
   * @private
   */
  _extractServicePorts(content) {
    const ports = [];
    const portMatches = content.matchAll(/^\s+- port:\s*(\d+)$/gm);

    for (const match of portMatches) {
      ports.push(parseInt(match[1]));
    }

    return ports;
  }

  /**
   * Extract ingress hosts
   * @private
   */
  _extractIngressHosts(content) {
    const hosts = [];
    const hostMatches = content.matchAll(/^\s+- host:\s*(.+)$/gm);

    for (const match of hostMatches) {
      hosts.push(match[1].trim());
    }

    return hosts;
  }

  /**
   * Extract storage class
   * @private
   */
  _extractStorageClass(content) {
    const match = content.match(/^\s+storageClassName:\s*(.+)$/m);
    return match ? match[1].trim() : 'default';
  }

  /**
   * Extract storage size
   * @private
   */
  _extractStorage(content) {
    const match = content.match(/^\s+storage:\s*(.+)$/m);
    return match ? match[1].trim() : 'unknown';
  }

  /**
   * Organize resources by kind
   * @private
   */
  _organizeResources(resources) {
    const organized = {
      deployments: [],
      services: [],
      configMaps: [],
      secrets: [],
      ingresses: [],
      pvcs: [],
      statefulSets: [],
      daemonSets: []
    };

    resources.forEach(resource => {
      switch (resource.kind) {
        case 'Deployment':
          organized.deployments.push(resource);
          break;
        case 'Service':
          organized.services.push(resource);
          break;
        case 'ConfigMap':
          organized.configMaps.push(resource);
          break;
        case 'Secret':
          organized.secrets.push(resource);
          break;
        case 'Ingress':
          organized.ingresses.push(resource);
          break;
        case 'PersistentVolumeClaim':
          organized.pvcs.push(resource);
          break;
        case 'StatefulSet':
          organized.statefulSets.push(resource);
          break;
        case 'DaemonSet':
          organized.daemonSets.push(resource);
          break;
      }
    });

    return organized;
  }

  /**
   * Calculate total resource requirements
   * @private
   */
  _calculateResourceRequirements(organized) {
    let totalCPU = 0;
    let totalMemory = 0;
    let totalReplicas = 0;
    let totalStorage = 0;

    // Sum up deployments
    organized.deployments.forEach(deployment => {
      const replicas = deployment.replicas || 1;
      totalReplicas += replicas;

      // Parse CPU (e.g., "500m" = 0.5 cores)
      if (deployment.resources?.requests?.cpu) {
        const cpu = this._parseCPU(deployment.resources.requests.cpu);
        totalCPU += cpu * replicas;
      }

      // Parse memory (e.g., "512Mi" = 512 MB)
      if (deployment.resources?.requests?.memory) {
        const memory = this._parseMemory(deployment.resources.requests.memory);
        totalMemory += memory * replicas;
      }
    });

    // Sum up PVCs
    organized.pvcs.forEach(pvc => {
      const storage = this._parseStorage(pvc.storage);
      totalStorage += storage;
    });

    return {
      totalPods: totalReplicas,
      totalCPU: `${totalCPU.toFixed(2)} cores`,
      totalMemory: `${(totalMemory / 1024).toFixed(2)} GB`,
      totalStorage: `${(totalStorage / 1024).toFixed(2)} GB`,
      workloadCount: {
        deployments: organized.deployments.length,
        statefulSets: organized.statefulSets.length,
        services: organized.services.length
      }
    };
  }

  /**
   * Parse CPU value to numeric
   * @private
   */
  _parseCPU(cpuString) {
    if (cpuString.endsWith('m')) {
      return parseFloat(cpuString) / 1000; // millicores to cores
    }
    return parseFloat(cpuString);
  }

  /**
   * Parse memory value to MB
   * @private
   */
  _parseMemory(memString) {
    if (memString.endsWith('Mi')) {
      return parseFloat(memString);
    } else if (memString.endsWith('Gi')) {
      return parseFloat(memString) * 1024;
    } else if (memString.endsWith('Ki')) {
      return parseFloat(memString) / 1024;
    }
    return parseFloat(memString);
  }

  /**
   * Parse storage value to GB
   * @private
   */
  _parseStorage(storageString) {
    if (storageString.endsWith('Gi')) {
      return parseFloat(storageString);
    } else if (storageString.endsWith('Mi')) {
      return parseFloat(storageString) / 1024;
    } else if (storageString.endsWith('Ti')) {
      return parseFloat(storageString) * 1024;
    }
    return parseFloat(storageString);
  }

  /**
   * Extract resource definitions
   * @param {Object} resources - Parsed resources
   * @returns {Array} Resource list
   */
  extractResources(resources) {
    const extracted = [];

    Object.entries(resources).forEach(([type, items]) => {
      items.forEach(item => {
        extracted.push({
          type,
          name: item.name,
          namespace: item.namespace,
          file: item.file,
          details: item
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
   * Find all YAML files in directory
   * @private
   */
  async _findYamlFiles(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      const yamlFiles = entries
        .filter(entry =>
          entry.isFile() &&
          (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
        )
        .map(entry => path.join(dirPath, entry.name));

      return yamlFiles;
    } catch (error) {
      logger.error('Failed to read Kubernetes directory', { error: error.message, dirPath });
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
        deployments: [],
        services: [],
        configMaps: [],
        secrets: [],
        ingresses: [],
        pvcs: [],
        statefulSets: [],
        daemonSets: []
      },
      resourceRequirements: {
        totalPods: 0,
        totalCPU: '0 cores',
        totalMemory: '0 GB',
        totalStorage: '0 GB',
        workloadCount: {
          deployments: 0,
          statefulSets: 0,
          services: 0
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = KubernetesParser;
