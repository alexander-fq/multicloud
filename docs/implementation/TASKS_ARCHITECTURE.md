# Tareas de Arquitectura - División para 3 Colaboradores

Enfoque: **Construcción de arquitectura multi-cloud** (implementación técnica)

---

## �� COLABORADOR 1: Multi-Cloud Provider Implementation

**Objetivo:** Implementar providers adicionales (OCI, GCP) para demostrar arquitectura multi-cloud real

### Tareas Prioritarias

#### 1. Implementar OCI Provider (6-8 horas)

**Archivos a crear:**
```
app/backend/src/cloud-providers/oci/
├── oci-storage.js       # OCI Object Storage
├── oci-database.js      # OCI Database Service (PostgreSQL)
├── oci-monitoring.js    # OCI Monitoring & Logging
└── oci-auth.js          # OCI IAM
```

**Implementación:**

**a) OCI Storage (`oci-storage.js`)**
```javascript
const oci = require('oci-sdk');
const StorageService = require('../../interfaces/storage.interface');

class OCIStorage extends StorageService {
  constructor() {
    super();
    // OCI Object Storage configuration
    const provider = new oci.common.ConfigFileAuthenticationDetailsProvider();
    this.objectStorageClient = new oci.objectstorage.ObjectStorageClient({
      authenticationDetailsProvider: provider
    });
    this.namespace = process.env.OCI_NAMESPACE;
    this.bucket = process.env.OCI_BUCKET || 'govtech-documents';
  }

  async uploadFile(file, destination) {
    const uploadRequest = {
      namespaceName: this.namespace,
      bucketName: this.bucket,
      objectName: destination,
      putObjectBody: file
    };
    await this.objectStorageClient.putObject(uploadRequest);
    return `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${this.namespace}/b/${this.bucket}/o/${destination}`;
  }

  async downloadFile(path) {
    const request = {
      namespaceName: this.namespace,
      bucketName: this.bucket,
      objectName: path
    };
    const response = await this.objectStorageClient.getObject(request);
    return response.value;
  }

  async deleteFile(path) {
    const request = {
      namespaceName: this.namespace,
      bucketName: this.bucket,
      objectName: path
    };
    await this.objectStorageClient.deleteObject(request);
    return true;
  }

  async listFiles(prefix = '') {
    const request = {
      namespaceName: this.namespace,
      bucketName: this.bucket,
      prefix: prefix
    };
    const response = await this.objectStorageClient.listObjects(request);
    return response.listObjects.objects.map(obj => obj.name);
  }

  async getSignedUrl(path, expiresIn = 3600) {
    // OCI Pre-Authenticated Request (PAR)
    const request = {
      namespaceName: this.namespace,
      bucketName: this.bucket,
      createPreauthenticatedRequestDetails: {
        name: `temp-access-${Date.now()}`,
        objectName: path,
        accessType: 'ObjectRead',
        timeExpires: new Date(Date.now() + expiresIn * 1000)
      }
    };
    const response = await this.objectStorageClient.createPreauthenticatedRequest(request);
    return `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com${response.preauthenticatedRequest.accessUri}`;
  }

  async fileExists(path) {
    try {
      await this.objectStorageClient.headObject({
        namespaceName: this.namespace,
        bucketName: this.bucket,
        objectName: path
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = OCIStorage;
```

**b) OCI Database (`oci-database.js`)**
```javascript
const { Pool } = require('pg');
const DatabaseService = require('../../interfaces/database.interface');

class OCIDatabase extends DatabaseService {
  constructor() {
    super();
    // OCI Database Service usa PostgreSQL estándar
    // Solo cambia el connection string
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query(text, params) {
    const result = await this.pool.query(text, params);
    return result.rows;
  }

  async getPoolStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount
    };
  }

  async testConnection() {
    try {
      const result = await this.pool.query('SELECT NOW() as now, version() as version');
      return {
        connected: true,
        timestamp: result.rows[0].now,
        version: result.rows[0].version
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = OCIDatabase;
```

**c) OCI Monitoring (`oci-monitoring.js`)**
```javascript
const oci = require('oci-sdk');
const MonitoringService = require('../../interfaces/monitoring.interface');

class OCIMonitoring extends MonitoringService {
  constructor() {
    super();
    const provider = new oci.common.ConfigFileAuthenticationDetailsProvider();

    this.loggingClient = new oci.logging.LoggingManagementClient({
      authenticationDetailsProvider: provider
    });

    this.monitoringClient = new oci.monitoring.MonitoringClient({
      authenticationDetailsProvider: provider
    });

    this.logGroupId = process.env.OCI_LOG_GROUP_ID;
    this.compartmentId = process.env.OCI_COMPARTMENT_ID;
  }

  async log(level, message, metadata = {}) {
    // OCI Logging API
    const logEntry = {
      data: JSON.stringify({
        level,
        message,
        metadata,
        timestamp: new Date().toISOString()
      }),
      id: `log-${Date.now()}`,
      time: new Date()
    };

    try {
      // En producción, usar OCI Logging API
      // En desarrollo, usar console
      console.log(`[${level.toUpperCase()}] ${message}`, metadata);
      return true;
    } catch (error) {
      console.error('OCI Logging error:', error.message);
      return false;
    }
  }

  async recordMetric(metricName, value, unit = 'Count', dimensions = {}) {
    try {
      const metricData = {
        namespace: 'govtech_app',
        compartmentId: this.compartmentId,
        name: metricName,
        dimensions: dimensions,
        datapoints: [{
          timestamp: new Date(),
          value: value
        }]
      };

      await this.monitoringClient.postMetricData({
        postMetricDataDetails: {
          metricData: [metricData]
        }
      });

      return true;
    } catch (error) {
      console.error('OCI Metric error:', error.message);
      return false;
    }
  }

  async createAlarm(alarmName, query, threshold) {
    try {
      const createAlarmRequest = {
        createAlarmDetails: {
          displayName: alarmName,
          compartmentId: this.compartmentId,
          metricCompartmentId: this.compartmentId,
          namespace: 'govtech_app',
          query: query,
          severity: 'CRITICAL',
          isEnabled: true
        }
      };

      await this.monitoringClient.createAlarm(createAlarmRequest);
      return { success: true, alarmName };
    } catch (error) {
      console.error('OCI Alarm creation error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = OCIMonitoring;
```

**d) OCI Auth (`oci-auth.js`)**
```javascript
const oci = require('oci-sdk');
const AuthService = require('../../interfaces/auth.interface');

class OCIAuth extends AuthService {
  constructor() {
    super();
    const provider = new oci.common.ConfigFileAuthenticationDetailsProvider();
    this.identityClient = new oci.identity.IdentityClient({
      authenticationDetailsProvider: provider
    });
    this.provider = provider;
  }

  async verifyCredentials() {
    try {
      const tenancy = await this.provider.getTenantId();
      const region = await this.provider.getRegion();

      return {
        valid: true,
        tenancy: tenancy,
        region: region.regionId
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async getIdentity() {
    try {
      const user = await this.provider.getUser();
      const tenancy = await this.provider.getTenantId();

      return {
        user: user.id,
        tenancy: tenancy,
        region: (await this.provider.getRegion()).regionId
      };
    } catch (error) {
      throw new Error(`Failed to get OCI identity: ${error.message}`);
    }
  }

  async assumeRole(roleArn) {
    // OCI no usa AssumeRole como AWS
    // En su lugar usa Instance Principals o Resource Principals
    throw new Error('OCI uses Instance Principals instead of AssumeRole');
  }
}

module.exports = OCIAuth;
```

**e) Actualizar Factory (`app/backend/src/services/factory.js`)**
```javascript
// Descomentar estas líneas:
case 'oci':
  const OCIStorage = require('../cloud-providers/oci/oci-storage');
  storageInstance = new OCIStorage();
  break;
```

**f) Actualizar .env.example**
```env
# OCI Configuration (When CLOUD_PROVIDER=oci)
OCI_REGION=us-ashburn-1
OCI_NAMESPACE=your-namespace
OCI_BUCKET=govtech-documents
OCI_LOG_GROUP_ID=ocid1.loggroup...
OCI_COMPARTMENT_ID=ocid1.compartment...
```

**g) Instalar OCI SDK**
```bash
cd app/backend
npm install oci-sdk
```

**Resultado esperado:**
- OCI provider 100% funcional
- Cambiar `CLOUD_PROVIDER=oci` en .env hace que la app use OCI
- Misma API, diferente cloud

---

#### 2. Implementar GCP Provider (6-8 horas)

**Similar a OCI, pero usando Google Cloud SDK:**

```bash
npm install @google-cloud/storage @google-cloud/logging @google-cloud/monitoring
```

**Archivos:**
```
app/backend/src/cloud-providers/gcp/
├── gcp-storage.js       # Google Cloud Storage
├── gcp-database.js      # Cloud SQL (PostgreSQL)
├── gcp-monitoring.js    # Cloud Operations (Stackdriver)
└── gcp-auth.js          # Cloud IAM
```

**Estructura similar a AWS y OCI, solo cambian las APIs.**

---

### Tareas Secundarias

#### 3. Testing de Providers (2 horas)
- Crear tests unitarios para cada provider
- Verificar que todos implementan las interfaces correctamente
- Probar switching entre providers

---

## �� COLABORADOR 2: Compute & Networking Services

**Objetivo:** Expandir interfaces más allá de storage/database/monitoring

### Tareas Prioritarias

#### 1. Crear Interface de Compute (2 horas)

**Archivo: `app/backend/src/interfaces/compute.interface.js`**
```javascript
/**
 * ComputeService Interface
 * Cloud-agnostic container/VM management
 */
class ComputeService {
  /**
   * List running instances
   */
  async listInstances() {
    throw new Error('Method listInstances() must be implemented');
  }

  /**
   * Get instance details
   */
  async getInstance(instanceId) {
    throw new Error('Method getInstance() must be implemented');
  }

  /**
   * Start an instance
   */
  async startInstance(instanceId) {
    throw new Error('Method startInstance() must be implemented');
  }

  /**
   * Stop an instance
   */
  async stopInstance(instanceId) {
    throw new Error('Method stopInstance() must be implemented');
  }

  /**
   * Get instance metrics (CPU, memory, etc.)
   */
  async getInstanceMetrics(instanceId) {
    throw new Error('Method getInstanceMetrics() must be implemented');
  }
}

module.exports = ComputeService;
```

#### 2. Implementar AWS Compute (3 horas)

**Archivo: `app/backend/src/cloud-providers/aws/aws-compute.js`**
```javascript
const AWS = require('aws-sdk');
const ComputeService = require('../../interfaces/compute.interface');

class AWSCompute extends ComputeService {
  constructor() {
    super();
    this.ec2 = new AWS.EC2({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.ecs = new AWS.ECS({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async listInstances() {
    // List EC2 instances
    const params = {
      Filters: [
        {
          Name: 'tag:Project',
          Values: ['govtech']
        }
      ]
    };

    const data = await this.ec2.describeInstances(params).promise();

    const instances = [];
    data.Reservations.forEach(reservation => {
      reservation.Instances.forEach(instance => {
        instances.push({
          id: instance.InstanceId,
          type: instance.InstanceType,
          state: instance.State.Name,
          ip: instance.PublicIpAddress || instance.PrivateIpAddress,
          launchTime: instance.LaunchTime
        });
      });
    });

    return instances;
  }

  async getInstance(instanceId) {
    const params = { InstanceIds: [instanceId] };
    const data = await this.ec2.describeInstances(params).promise();

    const instance = data.Reservations[0]?.Instances[0];
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return {
      id: instance.InstanceId,
      type: instance.InstanceType,
      state: instance.State.Name,
      ip: instance.PublicIpAddress || instance.PrivateIpAddress,
      launchTime: instance.LaunchTime,
      availabilityZone: instance.Placement.AvailabilityZone
    };
  }

  async startInstance(instanceId) {
    const params = { InstanceIds: [instanceId] };
    await this.ec2.startInstances(params).promise();
    return { success: true, message: `Starting instance ${instanceId}` };
  }

  async stopInstance(instanceId) {
    const params = { InstanceIds: [instanceId] };
    await this.ec2.stopInstances(params).promise();
    return { success: true, message: `Stopping instance ${instanceId}` };
  }

  async getInstanceMetrics(instanceId) {
    const cloudwatch = new AWS.CloudWatch({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const endTime = new Date();
    const startTime = new Date(endTime - 60 * 60 * 1000); // Last hour

    const cpuParams = {
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: ['Average']
    };

    const cpuData = await cloudwatch.getMetricStatistics(cpuParams).promise();

    return {
      instanceId,
      metrics: {
        cpu: cpuData.Datapoints.map(dp => ({
          timestamp: dp.Timestamp,
          value: dp.Average
        }))
      }
    };
  }
}

module.exports = AWSCompute;
```

#### 3. Crear Interface de Networking (2 horas)

**Archivo: `app/backend/src/interfaces/networking.interface.js`**
```javascript
/**
 * NetworkingService Interface
 * Cloud-agnostic networking operations
 */
class NetworkingService {
  /**
   * List VPCs/VCNs
   */
  async listNetworks() {
    throw new Error('Method listNetworks() must be implemented');
  }

  /**
   * Get network details
   */
  async getNetwork(networkId) {
    throw new Error('Method getNetwork() must be implemented');
  }

  /**
   * List subnets in a network
   */
  async listSubnets(networkId) {
    throw new Error('Method listSubnets() must be implemented');
  }

  /**
   * List security groups/NSGs
   */
  async listSecurityGroups(networkId) {
    throw new Error('Method listSecurityGroups() must be implemented');
  }

  /**
   * Get load balancers
   */
  async listLoadBalancers() {
    throw new Error('Method listLoadBalancers() must be implemented');
  }
}

module.exports = NetworkingService;
```

#### 4. Implementar AWS Networking (3 horas)

**Similar al Compute, implementar NetworkingService para AWS VPC.**

#### 5. Agregar a Factory (1 hora)

Actualizar `factory.js` para incluir:
```javascript
function getComputeService() { ... }
function getNetworkingService() { ... }
```

#### 6. Crear Endpoints (2 horas)

**Archivo: `app/backend/src/routes/infrastructure.js`**
```javascript
const express = require('express');
const router = express.Router();
const { getComputeService, getNetworkingService } = require('../services/factory');

// Compute endpoints
router.get('/instances', async (req, res) => {
  try {
    const compute = getComputeService();
    const instances = await compute.listInstances();
    res.json({ success: true, instances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/instances/:id', async (req, res) => {
  try {
    const compute = getComputeService();
    const instance = await compute.getInstance(req.params.id);
    res.json({ success: true, instance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Networking endpoints
router.get('/networks', async (req, res) => {
  try {
    const networking = getNetworkingService();
    const networks = await networking.listNetworks();
    res.json({ success: true, networks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

Agregar ruta en `app.js`:
```javascript
const infrastructureRoutes = require('./routes/infrastructure');
app.use('/api/infrastructure', infrastructureRoutes);
```

---

## �� COLABORADOR 3: Migration Tools & Scanner

**Objetivo:** Crear herramientas reales de escaneo y migración

### Tareas Prioritarias

#### 1. Infrastructure Scanner Real (4 horas)

**Archivo: `app/backend/src/migration/scanner/infrastructure-scanner.js`**
```javascript
const {
  getStorageService,
  getDatabaseService,
  getComputeService,
  getNetworkingService,
  getProvider
} = require('../../services/factory');

class InfrastructureScanner {
  async scanAll() {
    const provider = getProvider();

    const results = {
      provider: provider,
      timestamp: new Date().toISOString(),
      storage: await this.scanStorage(),
      database: await this.scanDatabase(),
      compute: await this.scanCompute(),
      networking: await this.scanNetworking()
    };

    return results;
  }

  async scanStorage() {
    try {
      const storage = getStorageService();
      const files = await storage.listFiles();

      return {
        status: 'detected',
        fileCount: files.length,
        files: files.slice(0, 10), // First 10 files
        bucketName: process.env.AWS_BUCKET || process.env.OCI_BUCKET
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async scanDatabase() {
    try {
      const db = getDatabaseService();
      const stats = await db.getPoolStats();
      const connection = await db.testConnection();

      return {
        status: 'connected',
        type: 'PostgreSQL',
        stats: stats,
        version: connection.version
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async scanCompute() {
    try {
      const compute = getComputeService();
      const instances = await compute.listInstances();

      return {
        status: 'detected',
        instanceCount: instances.length,
        instances: instances
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async scanNetworking() {
    try {
      const networking = getNetworkingService();
      const networks = await networking.listNetworks();

      return {
        status: 'detected',
        networkCount: networks.length,
        networks: networks
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = InfrastructureScanner;
```

#### 2. Service Mapper (3 horas)

**Archivo: `app/backend/src/migration/mapper/service-mapper.js`**
```javascript
/**
 * Maps services from one cloud provider to another
 */
class ServiceMapper {
  constructor() {
    this.serviceMap = {
      storage: {
        aws: { service: 'S3', api: 's3' },
        oci: { service: 'Object Storage', api: 'objectstorage' },
        gcp: { service: 'Cloud Storage', api: 'storage' },
        azure: { service: 'Blob Storage', api: 'blob' }
      },
      database: {
        aws: { service: 'RDS PostgreSQL', api: 'rds' },
        oci: { service: 'Database Service', api: 'database' },
        gcp: { service: 'Cloud SQL', api: 'sqladmin' },
        azure: { service: 'Database for PostgreSQL', api: 'postgresql' }
      },
      compute: {
        aws: { service: 'EKS', api: 'eks' },
        oci: { service: 'OKE', api: 'containerengine' },
        gcp: { service: 'GKE', api: 'container' },
        azure: { service: 'AKS', api: 'aks' }
      },
      monitoring: {
        aws: { service: 'CloudWatch', api: 'cloudwatch' },
        oci: { service: 'Monitoring', api: 'monitoring' },
        gcp: { service: 'Cloud Operations', api: 'monitoring' },
        azure: { service: 'Monitor', api: 'monitor' }
      }
    };
  }

  mapServices(fromProvider, toProvider) {
    const mapping = {};

    for (const [serviceType, providers] of Object.entries(this.serviceMap)) {
      mapping[serviceType] = {
        from: providers[fromProvider],
        to: providers[toProvider],
        compatibility: this.getCompatibility(serviceType, fromProvider, toProvider)
      };
    }

    return mapping;
  }

  getCompatibility(serviceType, fromProvider, toProvider) {
    // All PostgreSQL databases are 100% compatible
    if (serviceType === 'database') {
      return { level: 'high', percentage: 100, notes: 'PostgreSQL is standard across all clouds' };
    }

    // Storage APIs vary but data is portable
    if (serviceType === 'storage') {
      return { level: 'medium', percentage: 90, notes: 'API differs but data can be migrated' };
    }

    // Compute requires configuration changes
    if (serviceType === 'compute') {
      return { level: 'medium', percentage: 80, notes: 'Container images portable, config needs adjustment' };
    }

    return { level: 'medium', percentage: 75, notes: 'Requires configuration changes' };
  }

  generateMigrationSteps(fromProvider, toProvider, scanResults) {
    const steps = [
      {
        step: 1,
        name: 'Backup Current Environment',
        description: `Create full backup of ${fromProvider.toUpperCase()} infrastructure`,
        estimatedTime: '2 days',
        automated: true,
        commands: [
          'Snapshot all databases',
          'Copy all storage buckets',
          'Export configuration files'
        ]
      },
      {
        step: 2,
        name: `Provision ${toProvider.toUpperCase()} Infrastructure`,
        description: `Set up equivalent infrastructure in ${toProvider.toUpperCase()}`,
        estimatedTime: '3 days',
        automated: true,
        commands: [
          `Create ${this.serviceMap.storage[toProvider].service}`,
          `Create ${this.serviceMap.database[toProvider].service}`,
          `Create ${this.serviceMap.compute[toProvider].service}`
        ]
      },
      {
        step: 3,
        name: 'Implement Provider Code',
        description: `Implement ${toProvider.toUpperCase()} provider classes`,
        estimatedTime: '3-4 days',
        automated: false,
        commands: [
          `Implement ${toProvider}-storage.js`,
          `Implement ${toProvider}-database.js`,
          `Implement ${toProvider}-monitoring.js`,
          `Update factory.js`
        ]
      },
      {
        step: 4,
        name: 'Migrate Data',
        description: `Transfer data from ${fromProvider.toUpperCase()} to ${toProvider.toUpperCase()}`,
        estimatedTime: '2-3 days',
        automated: true,
        commands: [
          'Sync storage buckets',
          'Migrate database with pg_dump/pg_restore',
          'Validate data integrity'
        ]
      },
      {
        step: 5,
        name: 'Deploy Application',
        description: `Deploy application to ${toProvider.toUpperCase()}`,
        estimatedTime: '1 day',
        automated: true,
        commands: [
          `Set CLOUD_PROVIDER=${toProvider}`,
          'Deploy to new infrastructure',
          'Run smoke tests'
        ]
      },
      {
        step: 6,
        name: 'Switch Traffic',
        description: 'Blue-Green deployment with traffic switch',
        estimatedTime: '1 day',
        automated: true,
        commands: [
          'Update DNS to point to new infrastructure',
          'Monitor for errors',
          'Gradual rollout (10% → 50% → 100%)'
        ]
      }
    ];

    return {
      from: fromProvider,
      to: toProvider,
      totalEstimatedTime: '2-3 weeks',
      steps: steps,
      rollbackStrategy: {
        method: 'Blue-Green Deployment',
        timeToRollback: '5 minutes',
        description: 'Keep old infrastructure running until validation complete'
      },
      costEstimate: this.estimateCost(scanResults, toProvider)
    };
  }

  estimateCost(scanResults, toProvider) {
    // Simplified cost estimation
    const baseCosts = {
      aws: { storage: 0.023, compute: 0.10, database: 0.12 },
      oci: { storage: 0.0255, compute: 0.085, database: 0.10 },
      gcp: { storage: 0.020, compute: 0.095, database: 0.11 },
      azure: { storage: 0.018, compute: 0.096, database: 0.115 }
    };

    const costs = baseCosts[toProvider];
    const fileCount = scanResults.storage?.fileCount || 0;
    const instanceCount = scanResults.compute?.instanceCount || 1;

    const monthlyCost =
      (fileCount / 1000 * costs.storage) +
      (instanceCount * costs.compute * 730) +
      (costs.database * 730);

    return {
      monthly: `$${monthlyCost.toFixed(2)}`,
      yearly: `$${(monthlyCost * 12).toFixed(2)}`,
      breakdown: {
        storage: `$${(fileCount / 1000 * costs.storage).toFixed(2)}/mo`,
        compute: `$${(instanceCount * costs.compute * 730).toFixed(2)}/mo`,
        database: `$${(costs.database * 730).toFixed(2)}/mo`
      }
    };
  }
}

module.exports = ServiceMapper;
```

#### 3. Actualizar Migration Routes (2 horas)

**Archivo: `app/backend/src/routes/migration.js`**

Actualizar para usar el scanner y mapper reales:

```javascript
const InfrastructureScanner = require('../migration/scanner/infrastructure-scanner');
const ServiceMapper = require('../migration/mapper/service-mapper');

router.post('/scan', async (req, res) => {
  try {
    const scanner = new InfrastructureScanner();
    const results = await scanner.scanAll();

    res.json({
      success: true,
      ...results,
      migrationReadiness: 'Ready',
      estimatedMigrationTime: '2-3 weeks'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/plan', async (req, res) => {
  try {
    const { from, to } = req.body;

    // Scan current infrastructure
    const scanner = new InfrastructureScanner();
    const scanResults = await scanner.scanAll();

    // Generate migration plan
    const mapper = new ServiceMapper();
    const plan = mapper.generateMigrationSteps(from, to, scanResults);

    res.json({
      success: true,
      ...plan
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cost-estimate', async (req, res) => {
  try {
    const { provider } = req.query;

    const scanner = new InfrastructureScanner();
    const scanResults = await scanner.scanAll();

    const mapper = new ServiceMapper();
    const cost = mapper.estimateCost(scanResults, provider);

    res.json({
      success: true,
      provider,
      cost
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## � Resumen de Entregables

### Colaborador 1 (Multi-Cloud)
-  OCI Provider completo (4 archivos)
-  GCP Provider completo (4 archivos)
-  Factory actualizado
-  Tests de providers

### Colaborador 2 (Compute & Networking)
-  Compute interface + AWS implementation
-  Networking interface + AWS implementation
-  Infrastructure endpoints (/api/infrastructure/*)
-  Factory actualizado

### Colaborador 3 (Migration Tools)
-  Infrastructure scanner real
-  Service mapper con cost estimation
-  Migration routes mejoradas
-  Cost estimation endpoint

---

## � Prioridades

### Alta Prioridad (Hacer PRIMERO):
1. **Colaborador 1**: OCI Provider (para demo de multi-cloud)
2. **Colaborador 3**: Infrastructure scanner real
3. **Colaborador 2**: Compute interface + AWS implementation

### Media Prioridad:
4. **Colaborador 1**: GCP Provider
5. **Colaborador 2**: Networking interface
6. **Colaborador 3**: Cost estimation

### Baja Prioridad:
7. Testing exhaustivo
8. Documentación técnica de cada provider
9. Azure provider (si hay tiempo)

---

##  Timeline Estimado

| Día | Colaborador 1 | Colaborador 2 | Colaborador 3 |
|-----|--------------|--------------|--------------|
| **Día 1** | OCI Storage + Database | Compute interface | Infrastructure Scanner |
| **Día 2** | OCI Monitoring + Auth | AWS Compute impl | Service Mapper |
| **Día 3** | GCP Storage + Database | Networking interface | Cost Estimation |
| **Día 4** | GCP Monitoring + Auth | AWS Networking impl | Integration testing |
| **Día 5** | Testing + Integration | Infrastructure endpoints | Documentation |

**Resultado final:**
- 2 providers adicionales funcionando (OCI, GCP)
- 2 servicios nuevos (Compute, Networking)
- Scanner y mapper reales con cost estimation
- Backend completamente multi-cloud con 3 providers

---

## � Objetivo Final

**Demo impactante:**
```bash
# Terminal 1 - AWS
CLOUD_PROVIDER=aws npm start
# App funciona con AWS

# Terminal 2 - OCI
CLOUD_PROVIDER=oci npm start
# Mismo código, ahora usa OCI

# Terminal 3 - GCP
CLOUD_PROVIDER=gcp npm start
# Mismo código, ahora usa GCP
```

**Mostrar a los jueces:**
"Cambiar de cloud es cambiar una línea. No hay reescritura. Esto es arquitectura multi-cloud real."
