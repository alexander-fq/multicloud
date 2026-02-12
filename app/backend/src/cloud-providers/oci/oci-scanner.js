/**
 * OCI Scanner Service
 * Scans OCI resources for migration planning
 * Equivalent to AWS Scanner
 */

const core = require('oci-core');
const database = require('oci-database');
const objectstorage = require('oci-objectstorage');
const containerengine = require('oci-containerengine');
const logger = require('../../utils/logger');

class OCIScanner {
  constructor(authService) {
    this.authService = authService;
    this.computeClient = null;
    this.dbClient = null;
    this.storageClient = null;
    this.okeClient = null;
    this.networkClient = null;
    this.initialized = false;
  }

  /**
   * Initialize all OCI clients
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await this.authService.initialize();
      const provider = this.authService.getProvider();

      this.computeClient = new core.ComputeClient({
        authenticationDetailsProvider: provider
      });

      this.dbClient = new database.DatabaseClient({
        authenticationDetailsProvider: provider
      });

      this.storageClient = new objectstorage.ObjectStorageClient({
        authenticationDetailsProvider: provider
      });

      this.okeClient = new containerengine.ContainerEngineClient({
        authenticationDetailsProvider: provider
      });

      this.networkClient = new core.VirtualNetworkClient({
        authenticationDetailsProvider: provider
      });

      this.initialized = true;
      logger.info('OCI Scanner initialized successfully');
    } catch (error) {
      logger.error('OCI Scanner initialization failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Scan all OCI resources
   * @returns {Promise<Object>} Complete scan results
   */
  async scan() {
    try {
      await this.initialize();

      const compartmentId = process.env.OCI_COMPARTMENT_ID || this.authService.getTenancyId();

      logger.info('Starting OCI infrastructure scan', { compartmentId });

      // Scan all resource types in parallel
      const [
        computeInstances,
        buckets,
        databases,
        okeClusters,
        vcns,
        loadBalancers
      ] = await Promise.all([
        this.scanComputeInstances(compartmentId),
        this.scanBuckets(compartmentId),
        this.scanDatabases(compartmentId),
        this.scanOKEClusters(compartmentId),
        this.scanVCNs(compartmentId),
        this.scanLoadBalancers(compartmentId)
      ]);

      // Calculate readiness and complexity
      const readinessDetails = this._calculateReadiness({
        computeInstances,
        buckets,
        databases,
        okeClusters,
        vcns,
        loadBalancers
      });

      const result = {
        currentProvider: 'oci',
        region: this.authService.getRegion(),
        compartmentId,
        services: {
          compute: {
            count: computeInstances.length,
            instances: computeInstances
          },
          storage: {
            count: buckets.length,
            buckets
          },
          database: {
            count: databases.length,
            databases
          },
          oke: {
            count: okeClusters.length,
            clusters: okeClusters
          },
          networking: {
            vcns: vcns.length,
            loadBalancers: loadBalancers.length
          }
        },
        resourceCounts: {
          compute: computeInstances.length,
          database: databases.length,
          storage: buckets.length,
          oke: okeClusters.length,
          vcns: vcns.length,
          loadBalancers: loadBalancers.length
        },
        migrationReadiness: readinessDetails.percentage,
        estimatedMigrationTime: readinessDetails.estimatedTime,
        readinessDetails,
        scannedAt: new Date().toISOString()
      };

      logger.info('OCI infrastructure scan completed', {
        totalResources: Object.values(result.resourceCounts).reduce((a, b) => a + b, 0),
        readiness: result.migrationReadiness
      });

      return result;
    } catch (error) {
      logger.error('OCI infrastructure scan failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Scan OCI Compute Instances
   * @param {string} compartmentId - Compartment OCID
   * @returns {Promise<Array>} List of compute instances
   */
  async scanComputeInstances(compartmentId) {
    try {
      const response = await this.computeClient.listInstances({ compartmentId });

      const instances = response.items.map(instance => ({
        id: instance.id,
        name: instance.displayName,
        shape: instance.shape,
        state: instance.lifecycleState,
        availabilityDomain: instance.availabilityDomain,
        faultDomain: instance.faultDomain,
        region: instance.region,
        timeCreated: instance.timeCreated
      }));

      logger.debug('Scanned OCI compute instances', { count: instances.length });
      return instances;
    } catch (error) {
      logger.error('Failed to scan OCI compute instances', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Scan OCI Object Storage Buckets
   * @param {string} compartmentId - Compartment OCID
   * @returns {Promise<Array>} List of buckets
   */
  async scanBuckets(compartmentId) {
    try {
      // Get namespace first
      const namespaceResponse = await this.storageClient.getNamespace({
        compartmentId
      });
      const namespace = namespaceResponse.value;

      const response = await this.storageClient.listBuckets({
        namespaceName: namespace,
        compartmentId
      });

      const buckets = response.items.map(bucket => ({
        name: bucket.name,
        compartmentId: bucket.compartmentId,
        namespace,
        createdTime: bucket.timeCreated,
        publicAccessType: bucket.publicAccessType || 'NoPublicAccess',
        storageTier: bucket.storageTier || 'Standard'
      }));

      logger.debug('Scanned OCI buckets', { count: buckets.length });
      return buckets;
    } catch (error) {
      logger.error('Failed to scan OCI buckets', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Scan OCI Database Systems
   * @param {string} compartmentId - Compartment OCID
   * @returns {Promise<Array>} List of database systems
   */
  async scanDatabases(compartmentId) {
    try {
      const response = await this.dbClient.listDbSystems({ compartmentId });

      const databases = response.items.map(db => ({
        id: db.id,
        name: db.displayName,
        shape: db.shape,
        version: db.version,
        edition: db.databaseEdition,
        state: db.lifecycleState,
        nodeCount: db.nodeCount,
        availabilityDomain: db.availabilityDomain,
        timeCreated: db.timeCreated
      }));

      logger.debug('Scanned OCI databases', { count: databases.length });
      return databases;
    } catch (error) {
      logger.error('Failed to scan OCI databases', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Scan OCI Container Engine for Kubernetes (OKE) Clusters
   * @param {string} compartmentId - Compartment OCID
   * @returns {Promise<Array>} List of OKE clusters
   */
  async scanOKEClusters(compartmentId) {
    try {
      const response = await this.okeClient.listClusters({ compartmentId });

      const clusters = response.items.map(cluster => ({
        id: cluster.id,
        name: cluster.name,
        kubernetesVersion: cluster.kubernetesVersion,
        state: cluster.lifecycleState,
        type: cluster.type || 'BASIC_CLUSTER',
        vcnId: cluster.vcnId,
        endpointConfig: cluster.endpointConfig
      }));

      logger.debug('Scanned OKE clusters', { count: clusters.length });
      return clusters;
    } catch (error) {
      logger.error('Failed to scan OKE clusters', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Scan Virtual Cloud Networks (VCNs)
   * @param {string} compartmentId - Compartment OCID
   * @returns {Promise<Array>} List of VCNs
   */
  async scanVCNs(compartmentId) {
    try {
      const response = await this.networkClient.listVcns({ compartmentId });

      const vcns = response.items.map(vcn => ({
        id: vcn.id,
        name: vcn.displayName,
        cidrBlock: vcn.cidrBlock,
        cidrBlocks: vcn.cidrBlocks,
        state: vcn.lifecycleState,
        dnsLabel: vcn.dnsLabel,
        timeCreated: vcn.timeCreated
      }));

      logger.debug('Scanned VCNs', { count: vcns.length });
      return vcns;
    } catch (error) {
      logger.error('Failed to scan VCNs', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Scan Load Balancers
   * @param {string} compartmentId - Compartment OCID
   * @returns {Promise<Array>} List of load balancers
   */
  async scanLoadBalancers(compartmentId) {
    try {
      // OCI has Load Balancer service - would need oci-loadbalancer package
      // For now, return empty array to avoid errors
      // TODO: Implement when oci-loadbalancer is available
      logger.debug('Load balancer scanning not yet implemented');
      return [];
    } catch (error) {
      logger.error('Failed to scan load balancers', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Calculate migration readiness based on scanned resources
   * @private
   * @param {Object} resources - Scanned resources
   * @returns {Object} Readiness details
   */
  _calculateReadiness(resources) {
    const totalResources =
      resources.computeInstances.length +
      resources.buckets.length +
      resources.databases.length +
      resources.okeClusters.length +
      resources.vcns.length;

    // Simple readiness calculation
    let readinessScore = 100;
    const issues = [];
    const recommendations = [];

    // Check for common migration blockers
    if (resources.databases.length === 0) {
      recommendations.push('No databases found - migration will be straightforward');
    } else {
      recommendations.push(`${resources.databases.length} database(s) require data migration planning`);
    }

    if (resources.okeClusters.length > 0) {
      recommendations.push(`${resources.okeClusters.length} Kubernetes cluster(s) found - container migration supported`);
    }

    if (resources.computeInstances.length > 10) {
      readinessScore -= 10;
      issues.push('Large number of compute instances may require staged migration');
    }

    // Estimate migration time
    let estimatedTime = '1-2 weeks';
    if (totalResources < 10) {
      estimatedTime = '1-2 weeks';
    } else if (totalResources < 30) {
      estimatedTime = '2-3 weeks';
    } else if (totalResources < 50) {
      estimatedTime = '3-5 weeks';
    } else {
      estimatedTime = '5-8 weeks';
    }

    // Determine complexity
    let complexity = 'Low';
    if (totalResources > 30 || resources.okeClusters.length > 2) {
      complexity = 'High';
    } else if (totalResources > 15 || resources.databases.length > 3) {
      complexity = 'Medium';
    }

    return {
      percentage: `${readinessScore}%`,
      estimatedTime,
      complexity,
      totalResources,
      issues,
      recommendations
    };
  }
}

module.exports = OCIScanner;
