/**
 * Demo Data Generator
 * Genera datos simulados para demostraciones sin necesidad de conectarse a clouds reales
 */

class DemoDataGenerator {
  /**
   * Genera datos simulados de infraestructura cloud (AWS-like)
   */
  generateCloudInfrastructure(provider = 'aws') {
    return {
      currentProvider: provider,
      region: provider === 'aws' ? 'us-east-1' : 'us-ashburn-1',
      timestamp: new Date().toISOString(),
      services: {
        compute: {
          provider: provider === 'aws' ? 'EC2' : 'OCI Compute',
          count: 12,
          instances: this.generateComputeInstances(provider, 12)
        },
        database: {
          provider: provider === 'aws' ? 'RDS' : 'OCI Database',
          count: 3,
          databases: this.generateDatabases(provider, 3)
        },
        storage: {
          provider: provider === 'aws' ? 'S3' : 'Object Storage',
          count: 8,
          buckets: this.generateBuckets(provider, 8)
        },
        kubernetes: {
          provider: provider === 'aws' ? 'EKS' : 'OKE',
          count: 2,
          clusters: this.generateKubernetesClusters(provider, 2)
        }
      },
      resourceCounts: {
        ec2: 12,
        rds: 3,
        s3: 8,
        eks: 2,
        lambda: 24,
        vpcs: 3,
        loadBalancers: 4,
        cloudWatchAlarms: 18
      },
      migrationReadiness: '87%',
      estimatedMigrationTime: '2-3 weeks',
      readinessDetails: {
        issues: [
          'Legacy OS detected on 2 instances (Windows Server 2008)',
          '1 database using deprecated engine version',
          'High CPU usage detected on production instances (optimization recommended)'
        ],
        recommendations: [
          'Upgrade legacy instances to modern OS versions',
          'Implement auto-scaling for web tier',
          'Enable multi-AZ deployment for databases',
          'Set up automated backups before migration'
        ]
      },
      terraform: {
        resourcesFound: 45,
        filesProcessed: 8
      },
      kubernetes: {
        resourcesFound: 23,
        filesProcessed: 12,
        resourceRequirements: {
          totalPods: 48,
          totalCPU: '24 cores',
          totalMemory: '96 GB'
        }
      }
    };
  }

  generateComputeInstances(provider, count) {
    const instanceTypes = provider === 'aws'
      ? ['t3.micro', 't3.small', 't3.medium', 'm5.large', 'm5.xlarge', 'c5.large']
      : ['VM.Standard.E4.Flex', 'VM.Standard.E3.Flex', 'VM.Optimized3.Flex'];

    const environments = ['production', 'staging', 'development'];
    const apps = ['web-server', 'api-server', 'worker', 'cache', 'monitoring'];

    return Array.from({ length: count }, (_, i) => ({
      id: `${provider}-instance-${i + 1}`,
      name: `${apps[i % apps.length]}-${environments[i % environments.length]}-${i + 1}`,
      type: instanceTypes[i % instanceTypes.length],
      state: i % 10 === 0 ? 'stopped' : 'running',
      availabilityZone: `${provider === 'aws' ? 'us-east-1' : 'us-ashburn-1'}${['a', 'b', 'c'][i % 3]}`,
      privateIp: `10.0.${Math.floor(i / 255)}.${(i % 255) + 1}`,
      publicIp: i % 3 === 0 ? `54.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : null,
      cpuUsage: Math.floor(Math.random() * 80) + 10,
      memoryUsage: Math.floor(Math.random() * 70) + 20,
      diskUsage: Math.floor(Math.random() * 60) + 30,
      launchTime: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      tags: {
        Environment: environments[i % environments.length],
        Application: apps[i % apps.length],
        ManagedBy: 'Terraform'
      }
    }));
  }

  generateDatabases(provider, count) {
    const engines = ['PostgreSQL', 'MySQL', 'Oracle'];
    const environments = ['production', 'staging', 'development'];

    return Array.from({ length: count }, (_, i) => ({
      id: `${provider}-db-${i + 1}`,
      name: `database-${environments[i % environments.length]}`,
      engine: engines[i % engines.length],
      version: engines[i % engines.length] === 'PostgreSQL' ? '14.5' : engines[i % engines.length] === 'MySQL' ? '8.0' : '19c',
      status: 'available',
      instanceClass: provider === 'aws' ? 'db.r5.large' : 'VM.Standard.E4',
      storage: Math.floor(Math.random() * 500) + 100,
      multiAZ: i === 0, // Solo producción
      encrypted: true,
      backupRetention: i === 0 ? 30 : 7,
      connections: Math.floor(Math.random() * 100) + 10,
      cpuUsage: Math.floor(Math.random() * 60) + 20,
      environment: environments[i % environments.length]
    }));
  }

  generateBuckets(provider, count) {
    const purposes = ['backups', 'logs', 'media', 'static-assets', 'data-lake', 'archives'];

    return Array.from({ length: count }, (_, i) => ({
      name: `${provider}-${purposes[i % purposes.length]}-bucket-${i + 1}`,
      region: provider === 'aws' ? 'us-east-1' : 'us-ashburn-1',
      creationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      sizeGB: Math.floor(Math.random() * 5000) + 100,
      objectCount: Math.floor(Math.random() * 100000) + 1000,
      versioning: i % 2 === 0,
      encryption: true,
      publicAccess: false,
      purpose: purposes[i % purposes.length]
    }));
  }

  generateKubernetesClusters(provider, count) {
    const environments = ['production', 'staging'];

    return Array.from({ length: count }, (_, i) => ({
      id: `${provider}-k8s-${i + 1}`,
      name: `k8s-cluster-${environments[i % environments.length]}`,
      version: '1.27',
      status: 'active',
      nodeCount: i === 0 ? 8 : 4,
      totalCPU: i === 0 ? '32 cores' : '16 cores',
      totalMemory: i === 0 ? '128 GB' : '64 GB',
      runningPods: i === 0 ? 45 : 18,
      services: i === 0 ? 12 : 6,
      environment: environments[i % environments.length]
    }));
  }

  /**
   * Genera datos simulados de infraestructura on-premise
   */
  generateOnPremiseInfrastructure() {
    return {
      discoveryAgent: {
        id: 'agent-gov-datacenter-001',
        version: '1.0.0',
        status: 'connected',
        lastHeartbeat: new Date().toISOString(),
        location: 'Government Data Center - Building A',
        installedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      environment: 'on-premise',
      datacenter: {
        name: 'Gov DataCenter Principal',
        location: 'Ciudad de México, México',
        totalRackSpace: 42,
        usedRackSpace: 38,
        powerCapacity: '500 kW',
        powerUsage: '387 kW',
        cooling: 'Active',
        redundancy: 'N+1'
      },
      vmware: {
        vcenterVersion: '7.0.3',
        totalHosts: 12,
        totalVMs: 89,
        hosts: this.generateESXiHosts(12),
        vms: this.generateVMwareVMs(89),
        datastores: this.generateDatastores(8),
        networks: this.generateNetworks(6)
      },
      hyperv: {
        scvmmVersion: '2022',
        totalHosts: 4,
        totalVMs: 23,
        hosts: this.generateHyperVHosts(4),
        vms: this.generateHyperVVMs(23)
      },
      physical: {
        totalServers: 15,
        servers: this.generatePhysicalServers(15)
      },
      dependencies: this.generateDependencyGraph(),
      applications: this.generateApplications(),
      totalResources: 127, // 89 VMware + 23 Hyper-V + 15 Physical
      migrationReadiness: '78%',
      estimatedMigrationTime: '4-6 months',
      readinessDetails: {
        issues: [
          '12 VMs running legacy OS (Windows Server 2008 R2)',
          '3 physical servers with proprietary hardware',
          '5 applications with hard-coded IP addresses',
          'No automated backups on 8 VMs',
          '2 databases exceeding 2TB (require special migration strategy)'
        ],
        recommendations: [
          'Upgrade legacy VMs to modern OS before migration',
          'Plan P2V (Physical-to-Virtual) conversion for proprietary hardware',
          'Refactor applications to use DNS instead of IPs',
          'Implement backup solution before starting migration',
          'Use AWS DataSync or Azure Data Box for large databases'
        ]
      }
    };
  }

  generateESXiHosts(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: `esxi-host-${i + 1}`,
      name: `esxi-prod-${String(i + 1).padStart(2, '0')}.gov.local`,
      version: '7.0.3',
      manufacturer: 'Dell',
      model: 'PowerEdge R740',
      cpuCores: 48,
      cpuMhz: 2400,
      memoryGB: 512,
      status: 'connected',
      vmCount: Math.floor(89 / count) + (i === 0 ? 89 % count : 0),
      cpuUsage: Math.floor(Math.random() * 60) + 20,
      memoryUsage: Math.floor(Math.random() * 70) + 25,
      uptime: Math.floor(Math.random() * 365) + 30
    }));
  }

  generateVMwareVMs(count) {
    const osTypes = ['Windows Server 2019', 'Windows Server 2016', 'Windows Server 2012 R2',
                     'RHEL 8', 'RHEL 7', 'Ubuntu 20.04', 'CentOS 7'];
    const apps = ['AD-Controller', 'SQL-Server', 'Web-IIS', 'App-Server', 'File-Server',
                  'Mail-Server', 'Monitoring', 'Backup', 'Database', 'API-Gateway'];
    const criticality = ['critical', 'high', 'medium', 'low'];

    return Array.from({ length: count }, (_, i) => ({
      id: `vm-${String(i + 1).padStart(3, '0')}`,
      name: `${apps[i % apps.length]}-${String(Math.floor(i / apps.length) + 1).padStart(2, '0')}`,
      powerState: i % 15 === 0 ? 'poweredOff' : 'poweredOn',
      guestOS: osTypes[i % osTypes.length],
      cpus: [2, 4, 8, 16][i % 4],
      memoryMB: [4096, 8192, 16384, 32768][i % 4],
      diskGB: Math.floor(Math.random() * 500) + 100,
      ipAddress: `10.10.${Math.floor(i / 255)}.${(i % 255) + 1}`,
      hostname: `${apps[i % apps.length]}-${String(Math.floor(i / apps.length) + 1).padStart(2, '0')}.gov.local`,
      criticality: criticality[i % criticality.length],
      application: apps[i % apps.length],
      environment: i % 3 === 0 ? 'production' : i % 3 === 1 ? 'staging' : 'development',
      avgCpuUsage: Math.floor(Math.random() * 70) + 10,
      avgMemoryUsage: Math.floor(Math.random() * 80) + 15,
      peakCpuUsage: Math.floor(Math.random() * 30) + 70,
      networkTrafficMbps: Math.floor(Math.random() * 100) + 10,
      uptime: Math.floor(Math.random() * 180) + 7
    }));
  }

  generateDatastores(count) {
    const types = ['VMFS', 'NFS', 'vSAN'];

    return Array.from({ length: count }, (_, i) => ({
      name: `datastore-${String(i + 1).padStart(2, '0')}`,
      type: types[i % types.length],
      capacityGB: [2000, 4000, 8000, 10000][i % 4],
      freeSpaceGB: Math.floor(Math.random() * 3000) + 500,
      vmCount: Math.floor(89 / count),
      status: 'healthy'
    }));
  }

  generateNetworks(count) {
    const purposes = ['Management', 'Production', 'Storage', 'vMotion', 'DMZ', 'Backup'];

    return Array.from({ length: count }, (_, i) => ({
      name: purposes[i],
      vlanId: 100 + i * 10,
      subnet: `10.${10 + i}.0.0/24`,
      gateway: `10.${10 + i}.0.1`,
      vmCount: Math.floor(Math.random() * 30) + 5
    }));
  }

  generateHyperVHosts(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: `hyperv-host-${i + 1}`,
      name: `HV-PROD-${String(i + 1).padStart(2, '0')}`,
      cpuCores: 32,
      memoryGB: 256,
      status: 'online',
      vmCount: Math.floor(23 / count),
      cpuUsage: Math.floor(Math.random() * 50) + 20,
      memoryUsage: Math.floor(Math.random() * 60) + 25
    }));
  }

  generateHyperVVMs(count) {
    const apps = ['Exchange', 'SharePoint', 'SCCM', 'WSUS', 'DFS'];

    return Array.from({ length: count }, (_, i) => ({
      id: `hyperv-vm-${i + 1}`,
      name: `${apps[i % apps.length]}-${String(Math.floor(i / apps.length) + 1).padStart(2, '0')}`,
      state: 'Running',
      cpus: [2, 4, 8][i % 3],
      memoryMB: [8192, 16384, 32768][i % 3],
      diskGB: Math.floor(Math.random() * 300) + 100,
      application: apps[i % apps.length]
    }));
  }

  generatePhysicalServers(count) {
    const purposes = ['Database-Primary', 'Database-Replica', 'SAP-ERP', 'Oracle-DB',
                      'Legacy-App', 'Mainframe-Gateway', 'Firewall', 'Load-Balancer'];

    return Array.from({ length: count }, (_, i) => ({
      id: `physical-${i + 1}`,
      hostname: `${purposes[i % purposes.length]}.gov.local`,
      manufacturer: ['Dell', 'HP', 'IBM', 'Cisco'][i % 4],
      model: 'Rack Server',
      cpuCores: [16, 24, 32, 48][i % 4],
      memoryGB: [128, 256, 512][i % 3],
      diskTB: [1, 2, 4, 8][i % 4],
      os: i % 2 === 0 ? 'Windows Server 2016' : 'RHEL 7',
      purpose: purposes[i % purposes.length],
      criticality: i % 3 === 0 ? 'critical' : 'high',
      conversionStrategy: i % 3 === 0 ? 'P2V-Complex' : 'P2V-Standard'
    }));
  }

  generateDependencyGraph() {
    // Simula un grafo de dependencias entre aplicaciones
    const nodes = [
      { id: 'web-tier', name: 'Web Servers (IIS)', type: 'web', count: 12 },
      { id: 'app-tier', name: 'Application Servers', type: 'application', count: 8 },
      { id: 'db-tier', name: 'Database Servers', type: 'database', count: 4 },
      { id: 'cache', name: 'Redis Cache', type: 'cache', count: 2 },
      { id: 'queue', name: 'Message Queue', type: 'queue', count: 2 },
      { id: 'storage', name: 'File Storage', type: 'storage', count: 1 },
      { id: 'ad', name: 'Active Directory', type: 'auth', count: 2 },
      { id: 'monitoring', name: 'Monitoring Stack', type: 'monitoring', count: 3 }
    ];

    const edges = [
      { source: 'web-tier', target: 'app-tier', type: 'http', port: 8080 },
      { source: 'app-tier', target: 'db-tier', type: 'sql', port: 1433 },
      { source: 'app-tier', target: 'cache', type: 'redis', port: 6379 },
      { source: 'app-tier', target: 'queue', type: 'amqp', port: 5672 },
      { source: 'app-tier', target: 'storage', type: 'smb', port: 445 },
      { source: 'app-tier', target: 'ad', type: 'ldap', port: 389 },
      { source: 'monitoring', target: 'web-tier', type: 'metrics', port: 9090 },
      { source: 'monitoring', target: 'app-tier', type: 'metrics', port: 9090 },
      { source: 'monitoring', target: 'db-tier', type: 'metrics', port: 9090 }
    ];

    return { nodes, edges };
  }

  generateApplications() {
    return [
      {
        name: 'Portal Ciudadano',
        type: 'Web Application',
        criticality: 'critical',
        users: 50000,
        servers: 12,
        dependencies: ['web-tier', 'app-tier', 'db-tier', 'cache'],
        migrationWave: 4, // Alta criticidad - última onda
        estimatedDowntime: '4 hours'
      },
      {
        name: 'Sistema de Gestión Documental',
        type: 'Document Management',
        criticality: 'high',
        users: 2000,
        servers: 6,
        dependencies: ['app-tier', 'db-tier', 'storage'],
        migrationWave: 3,
        estimatedDowntime: '2 hours'
      },
      {
        name: 'Intranet Gubernamental',
        type: 'SharePoint',
        criticality: 'medium',
        users: 1500,
        servers: 4,
        dependencies: ['app-tier', 'db-tier', 'ad'],
        migrationWave: 2,
        estimatedDowntime: '1 hour'
      },
      {
        name: 'Sistema de Monitoreo',
        type: 'Monitoring',
        criticality: 'low',
        users: 50,
        servers: 3,
        dependencies: ['monitoring'],
        migrationWave: 1, // Baja criticidad - primera onda (piloto)
        estimatedDowntime: '30 minutes'
      }
    ];
  }

  /**
   * Genera un plan de migración por ondas (waves)
   */
  generateMigrationWaves(infrastructure) {
    return [
      {
        number: 1,
        name: 'Piloto - Servicios No Críticos',
        criticality: 'low',
        serverCount: 8,
        estimatedTime: '1 week',
        startDate: this.addDays(new Date(), 7).toISOString().split('T')[0],
        endDate: this.addDays(new Date(), 14).toISOString().split('T')[0],
        servers: infrastructure.vmware.vms.filter(vm => vm.criticality === 'low').slice(0, 8),
        applications: infrastructure.applications.filter(app => app.migrationWave === 1),
        status: 'planned',
        risks: ['Minimal impact', 'Good for testing process'],
        successCriteria: ['All services operational', 'No data loss', 'Performance baseline met']
      },
      {
        number: 2,
        name: 'Servicios de Soporte',
        criticality: 'medium',
        serverCount: 25,
        estimatedTime: '2-3 weeks',
        startDate: this.addDays(new Date(), 21).toISOString().split('T')[0],
        endDate: this.addDays(new Date(), 42).toISOString().split('T')[0],
        servers: infrastructure.vmware.vms.filter(vm => vm.criticality === 'medium').slice(0, 25),
        applications: infrastructure.applications.filter(app => app.migrationWave === 2),
        status: 'planned',
        risks: ['Internal user impact', 'Some service dependencies'],
        successCriteria: ['User acceptance', 'Integration tests pass', 'Backup/restore verified']
      },
      {
        number: 3,
        name: 'Aplicaciones de Negocio',
        criticality: 'high',
        serverCount: 42,
        estimatedTime: '4-6 weeks',
        startDate: this.addDays(new Date(), 49).toISOString().split('T')[0],
        endDate: this.addDays(new Date(), 91).toISOString().split('T')[0],
        servers: infrastructure.vmware.vms.filter(vm => vm.criticality === 'high').slice(0, 42),
        applications: infrastructure.applications.filter(app => app.migrationWave === 3),
        status: 'planned',
        risks: ['Business impact', 'Complex dependencies', 'Large data volumes'],
        successCriteria: ['Business continuity maintained', 'Performance SLAs met', 'Compliance verified']
      },
      {
        number: 4,
        name: 'Sistemas Críticos',
        criticality: 'critical',
        serverCount: 52,
        estimatedTime: '6-8 weeks',
        startDate: this.addDays(new Date(), 98).toISOString().split('T')[0],
        endDate: this.addDays(new Date(), 154).toISOString().split('T')[0],
        servers: infrastructure.vmware.vms.filter(vm => vm.criticality === 'critical'),
        applications: infrastructure.applications.filter(app => app.migrationWave === 4),
        status: 'planned',
        risks: ['High business impact', 'Citizen-facing services', 'Regulatory compliance'],
        successCriteria: ['Zero data loss', '99.9% uptime', 'Citizen satisfaction', 'Rollback plan tested']
      }
    ];
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

module.exports = new DemoDataGenerator();
