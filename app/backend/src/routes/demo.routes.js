const express = require('express');
const router = express.Router();

// Helper function to calculate migration metrics
function calculateMigrationMetrics(dataSize, serverCount, workloadType, compliance) {
  // Base cost calculation (per GB per month)
  const baseGBCost = 0.023; // $0.023 per GB for storage
  const baseCost = (dataSize * baseGBCost) + (serverCount * 45); // $45 per server/month

  // Workload multiplier
  const workloadMultipliers = {
    'web-application': 1.0,
    'database': 1.3,
    'microservices': 1.2,
    'big-data': 1.8,
    'ml-ai': 2.0,
    'legacy': 1.4
  };

  // Compliance multiplier
  const complianceMultipliers = {
    'none': 1.0,
    'hipaa': 1.25,
    'pci-dss': 1.3,
    'gdpr': 1.15,
    'sox': 1.2,
    'fedramp': 1.4
  };

  const workloadMult = workloadMultipliers[workloadType] || 1.0;
  const complianceMult = complianceMultipliers[compliance] || 1.0;

  const estimatedCost = Math.round(baseCost * workloadMult * complianceMult);

  // Migration duration calculation (hours)
  const hoursPerServer = 2;
  const dataTransferRate = 100; // GB per hour
  const serverTime = serverCount * hoursPerServer;
  const dataTime = dataSize / dataTransferRate;
  const totalHours = Math.ceil(serverTime + dataTime);

  return {
    cost: estimatedCost,
    duration: totalHours,
    dataTransferTime: Math.ceil(dataTime),
    serverSetupTime: Math.ceil(serverTime)
  };
}

// Demo: Simular migración on-premise to AWS
router.post('/migrate/aws', async (req, res) => {
  const {
    appName,
    sourceProvider = 'on-premise',
    targetRegion = 'us-east-1',
    dataSize = 500,
    serverCount = 12,
    workloadType = 'web-application',
    compliance = 'none'
  } = req.body;

  const metrics = calculateMigrationMetrics(dataSize, serverCount, workloadType, compliance);

  // Simular proceso de migración
  const steps = [
    { step: 1, name: 'Análisis de aplicación y dependencias', status: 'completed', duration: '3m 24s' },
    { step: 2, name: 'Creación de VPC y subnets en AWS', status: 'completed', duration: '8m 12s' },
    { step: 3, name: 'Configuración de EKS cluster', status: 'completed', duration: '15m 45s' },
    { step: 4, name: `Migración de ${dataSize}GB a RDS`, status: 'completed', duration: `${metrics.dataTransferTime}h` },
    { step: 5, name: `Despliegue de ${serverCount} aplicaciones`, status: 'completed', duration: `${metrics.serverSetupTime}h` },
    { step: 6, name: 'Configuración de ALB y seguridad', status: 'completed', duration: '12m 30s' },
    { step: 7, name: 'Validación y testing', status: 'completed', duration: '25m 15s' }
  ];

  const complianceMessage = compliance !== 'none'
    ? `Certificación ${compliance.toUpperCase()} aplicada`
    : null;

  res.json({
    success: true,
    migrationId: `mig-aws-${Date.now()}`,
    provider: 'AWS',
    sourceProvider,
    appName,
    targetRegion,
    specs: {
      dataSize: `${dataSize >= 1024 ? (dataSize/1024).toFixed(1) + ' TB' : dataSize + ' GB'}`,
      serverCount: serverCount,
      workloadType: workloadType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      region: targetRegion
    },
    steps,
    totalDuration: `${metrics.duration}h`,
    estimatedCost: `$${metrics.cost}/mes`,
    compliance: complianceMessage,
    resources: {
      vpc: 'vpc-0a1b2c3d4e5f6g7h8',
      subnets: '6 subnets (3 public, 3 private)',
      eks: 'govtech-prod-cluster',
      nodeGroup: `${serverCount} nodes (t3.medium)`,
      rds: 'govtech-prod-db.us-east-1.rds.amazonaws.com',
      rdsSize: `db.r5.xlarge (${dataSize}GB storage)`,
      alb: 'govtech-prod-alb-1234567890.us-east-1.elb.amazonaws.com',
      securityGroups: '4 security groups configured'
    }
  });
});

// Demo: Simular migración on-premise to OCI
router.post('/migrate/oci', async (req, res) => {
  const {
    appName,
    sourceProvider = 'on-premise',
    targetRegion = 'us-ashburn-1',
    dataSize = 500,
    serverCount = 12,
    workloadType = 'web-application',
    compliance = 'none'
  } = req.body;

  const metrics = calculateMigrationMetrics(dataSize, serverCount, workloadType, compliance);
  const ociDiscount = 0.9; // OCI is 10% cheaper
  const adjustedCost = Math.round(metrics.cost * ociDiscount);

  const steps = [
    { step: 1, name: 'Análisis de aplicación y dependencias', status: 'completed', duration: '3m 10s' },
    { step: 2, name: 'Creación de VCN y subnets en OCI', status: 'completed', duration: '6m 45s' },
    { step: 3, name: 'Configuración de OKE cluster', status: 'completed', duration: '18m 20s' },
    { step: 4, name: `Migración de ${dataSize}GB a Autonomous DB`, status: 'completed', duration: `${metrics.dataTransferTime}h` },
    { step: 5, name: `Despliegue de ${serverCount} aplicaciones`, status: 'completed', duration: `${metrics.serverSetupTime}h` },
    { step: 6, name: 'Configuración de Load Balancer', status: 'completed', duration: '9m 15s' },
    { step: 7, name: 'Validación y testing', status: 'completed', duration: '22m 40s' }
  ];

  const complianceMessage = compliance !== 'none'
    ? `Certificación ${compliance.toUpperCase()} aplicada`
    : null;

  res.json({
    success: true,
    migrationId: `mig-oci-${Date.now()}`,
    provider: 'OCI',
    sourceProvider,
    appName,
    targetRegion,
    specs: {
      dataSize: `${dataSize >= 1024 ? (dataSize/1024).toFixed(1) + ' TB' : dataSize + ' GB'}`,
      serverCount: serverCount,
      workloadType: workloadType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      region: targetRegion
    },
    steps,
    totalDuration: `${metrics.duration}h`,
    estimatedCost: `$${adjustedCost}/mes`,
    compliance: complianceMessage,
    resources: {
      vcn: 'ocid1.vcn.oc1.iad.aaa...xyz',
      subnets: '6 subnets (3 public, 3 private)',
      oke: 'govtech-prod-cluster',
      nodePool: `${serverCount} nodes (VM.Standard.E4.Flex)`,
      adb: 'govtech-prod-adb.adb.us-ashburn-1.oraclecloud.com',
      adbOCPUs: `${Math.ceil(dataSize/100)} OCPUs (${dataSize}GB storage)`,
      lb: 'govtech-prod-lb.us-ashburn-1.oci.oraclecloud.com',
      nsg: '4 network security groups configured'
    }
  });
});

// Demo: Simular migración on-premise to GCP
router.post('/migrate/gcp', async (req, res) => {
  const {
    appName,
    sourceProvider = 'on-premise',
    targetRegion = 'us-central1',
    dataSize = 500,
    serverCount = 12,
    workloadType = 'web-application',
    compliance = 'none'
  } = req.body;

  const metrics = calculateMigrationMetrics(dataSize, serverCount, workloadType, compliance);
  const gcpPremium = 1.05; // GCP is 5% more expensive
  const adjustedCost = Math.round(metrics.cost * gcpPremium);

  const steps = [
    { step: 1, name: 'Análisis de aplicación y dependencias', status: 'completed', duration: '2m 55s' },
    { step: 2, name: 'Creación de VPC y subnets en GCP', status: 'completed', duration: '5m 30s' },
    { step: 3, name: 'Configuración de GKE Autopilot', status: 'completed', duration: '14m 10s' },
    { step: 4, name: `Migración de ${dataSize}GB a Cloud SQL`, status: 'completed', duration: `${metrics.dataTransferTime}h` },
    { step: 5, name: `Despliegue de ${serverCount} aplicaciones`, status: 'completed', duration: `${metrics.serverSetupTime}h` },
    { step: 6, name: 'Configuración de Cloud Load Balancing', status: 'completed', duration: '10m 45s' },
    { step: 7, name: 'Validación y testing', status: 'completed', duration: '20m 30s' }
  ];

  const complianceMessage = compliance !== 'none'
    ? `Certificación ${compliance.toUpperCase()} aplicada`
    : null;

  res.json({
    success: true,
    migrationId: `mig-gcp-${Date.now()}`,
    provider: 'GCP',
    sourceProvider,
    appName,
    targetRegion,
    specs: {
      dataSize: `${dataSize >= 1024 ? (dataSize/1024).toFixed(1) + ' TB' : dataSize + ' GB'}`,
      serverCount: serverCount,
      workloadType: workloadType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      region: targetRegion
    },
    steps,
    totalDuration: `${metrics.duration}h`,
    estimatedCost: `$${adjustedCost}/mes`,
    compliance: complianceMessage,
    resources: {
      vpc: 'projects/govtech-prod/global/networks/vpc-prod',
      subnets: '6 subnets (auto-mode)',
      gke: 'govtech-prod-cluster (Autopilot)',
      nodePool: `${serverCount} nodes (e2-medium)`,
      cloudsql: 'govtech-prod-db.us-central1.sql.gcp.cloud.google.com',
      sqlTier: `db-n1-standard-4 (${dataSize}GB SSD)`,
      lb: 'Cloud Load Balancer (35.202.123.45)',
      firewall: '5 firewall rules configured'
    }
  });
});

// Demo: Simular migración on-premise to Azure
router.post('/migrate/azure', async (req, res) => {
  const {
    appName,
    sourceProvider = 'on-premise',
    targetRegion = 'eastus',
    dataSize = 500,
    serverCount = 12,
    workloadType = 'web-application',
    compliance = 'none'
  } = req.body;

  const metrics = calculateMigrationMetrics(dataSize, serverCount, workloadType, compliance);
  const azurePremium = 1.08; // Azure is 8% more expensive
  const adjustedCost = Math.round(metrics.cost * azurePremium);

  const steps = [
    { step: 1, name: 'Análisis de aplicación y dependencias', status: 'completed', duration: '3m 35s' },
    { step: 2, name: 'Creación de VNet y subnets en Azure', status: 'completed', duration: '7m 20s' },
    { step: 3, name: 'Configuración de AKS cluster', status: 'completed', duration: '19m 50s' },
    { step: 4, name: `Migración de ${dataSize}GB a Azure SQL`, status: 'completed', duration: `${metrics.dataTransferTime}h` },
    { step: 5, name: `Despliegue de ${serverCount} aplicaciones`, status: 'completed', duration: `${metrics.serverSetupTime}h` },
    { step: 6, name: 'Configuración de Application Gateway', status: 'completed', duration: '13m 25s' },
    { step: 7, name: 'Validación y testing', status: 'completed', duration: '24m 10s' }
  ];

  const complianceMessage = compliance !== 'none'
    ? `Certificación ${compliance.toUpperCase()} aplicada`
    : null;

  res.json({
    success: true,
    migrationId: `mig-azure-${Date.now()}`,
    provider: 'Azure',
    sourceProvider,
    appName,
    targetRegion,
    specs: {
      dataSize: `${dataSize >= 1024 ? (dataSize/1024).toFixed(1) + ' TB' : dataSize + ' GB'}`,
      serverCount: serverCount,
      workloadType: workloadType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      region: targetRegion
    },
    steps,
    totalDuration: `${metrics.duration}h`,
    estimatedCost: `$${adjustedCost}/mes`,
    compliance: complianceMessage,
    resources: {
      vnet: '/subscriptions/xxx/resourceGroups/govtech-prod/providers/Microsoft.Network/virtualNetworks/vnet-prod',
      subnets: '6 subnets (3 public, 3 private)',
      aks: 'govtech-prod-cluster',
      nodePool: `${serverCount} nodes (Standard_D2s_v3)`,
      sqldb: 'govtech-prod-db.database.windows.net',
      sqlTier: `Standard S3 (${dataSize}GB storage)`,
      appgw: 'govtech-prod-appgw.eastus.cloudapp.azure.com',
      nsg: '4 network security groups configured'
    }
  });
});

// Demo: Comparar costos entre providers
router.post('/compare', async (req, res) => {
  const {
    dataSize = 500,
    serverCount = 12,
    workloadType = 'web-application',
    compliance = 'none'
  } = req.body;

  const baseMetrics = calculateMigrationMetrics(dataSize, serverCount, workloadType, compliance);

  const awsCost = baseMetrics.cost;
  const ociCost = Math.round(awsCost * 0.9);
  const gcpCost = Math.round(awsCost * 1.05);
  const azureCost = Math.round(awsCost * 1.08);

  // Determine recommendation based on cost
  const costs = [
    { provider: 'AWS', cost: awsCost },
    { provider: 'OCI', cost: ociCost },
    { provider: 'GCP', cost: gcpCost },
    { provider: 'Azure', cost: azureCost }
  ];
  const cheapest = costs.reduce((min, p) => p.cost < min.cost ? p : min);

  res.json({
    success: true,
    specs: {
      dataSize: `${dataSize >= 1024 ? (dataSize/1024).toFixed(1) + ' TB' : dataSize + ' GB'}`,
      serverCount,
      workloadType: workloadType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      compliance: compliance !== 'none' ? compliance.toUpperCase() : 'None'
    },
    comparison: {
      aws: {
        monthly: awsCost,
        yearly: awsCost * 12,
        reliability: '99.95%',
        performanceScore: 92,
        migrationTime: `${baseMetrics.duration}h`
      },
      oci: {
        monthly: ociCost,
        yearly: ociCost * 12,
        reliability: '99.95%',
        performanceScore: 90,
        migrationTime: `${baseMetrics.duration}h`
      },
      gcp: {
        monthly: gcpCost,
        yearly: gcpCost * 12,
        reliability: '99.95%',
        performanceScore: 94,
        migrationTime: `${Math.ceil(baseMetrics.duration * 0.95)}h`
      },
      azure: {
        monthly: azureCost,
        yearly: azureCost * 12,
        reliability: '99.95%',
        performanceScore: 91,
        migrationTime: `${Math.ceil(baseMetrics.duration * 1.05)}h`
      }
    },
    recommendation: cheapest.provider,
    reason: `Mejor relación costo-beneficio: $${cheapest.cost}/mes para ${serverCount} servidores y ${dataSize}GB de datos`,
    savings: {
      vsExpensive: `Ahorro de $${azureCost - ociCost}/mes vs opción más cara`,
      yearlyDifference: `$${(azureCost - ociCost) * 12}/año de diferencia entre proveedores`
    }
  });
});

// Demo: Health status de servicio simulado
router.get('/status/:migrationId', async (req, res) => {
  const { migrationId } = req.params;

  res.json({
    success: true,
    migrationId,
    status: 'running',
    uptime: '99.98%',
    responseTime: '45ms',
    activeConnections: 127,
    requestsPerMinute: 1542
  });
});

module.exports = router;
