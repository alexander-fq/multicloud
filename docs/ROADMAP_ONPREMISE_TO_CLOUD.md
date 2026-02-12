# Roadmap de Implementación - Migración On-Premise a Cloud

## Información del Documento

- **Proyecto**: GovTech Cloud Migration Platform - On-Premise Module
- **Versión**: 1.0.0
- **Fecha**: 11 de Febrero 2026
- **Autor**: Equipo de Desarrollo
- **Estado**: Documento de Planificación
- **Prioridad**: Alta (Sector Gobierno)

---

## Resumen Ejecutivo

Este documento detalla la implementación completa del módulo de migración **On-Premise a Cloud** para la plataforma GovTech Cloud Migration. A diferencia de las migraciones cloud-to-cloud (que migran entre proveedores de nube), este módulo permite a gobiernos y organizaciones migrar sus **data centers físicos y servidores virtuales on-premise** hacia proveedores de nube pública (AWS, OCI, GCP, Azure).

### Contexto

Los gobiernos en LATAM tradicionalmente operan infraestructura IT en sus propios data centers:
- Servidores físicos (bare metal)
- Infraestructura virtualizada (VMware vSphere, Hyper-V)
- Aplicaciones legacy críticas
- Datos sensibles sujetos a regulaciones de soberanía

**El desafío**: Estos gobiernos buscan modernizar su infraestructura IT, reducir costos operativos, y mejorar la disponibilidad de sus servicios, pero enfrentan barreras técnicas, de seguridad y de cumplimiento normativo.

### Diferencias Clave: Cloud-to-Cloud vs On-Premise-to-Cloud

```
┌─────────────────────────────────────────────────────────────┐
│  CLOUD-TO-CLOUD (Ya Implementado)                           │
└─────────────────────────────────────────────────────────────┘
[OK] Origen: AWS, OCI, GCP, Azure
[OK] Destino: AWS, OCI, GCP, Azure
[OK] APIs disponibles para escaneo
[OK] Credenciales cloud-native
[OK] Networking ya en nube

┌─────────────────────────────────────────────────────────────┐
│  ON-PREMISE-TO-CLOUD (Este Documento)                       │
└─────────────────────────────────────────────────────────────┘
[NUEVO] Origen: VMware, Hyper-V, servidores físicos
[NUEVO] Destino: AWS, OCI, GCP, Azure
[NUEVO] Requiere agentes de descubrimiento
[NUEVO] Mapeo de dependencias entre aplicaciones
[NUEVO] Conversión de VMs (V2V, P2V)
[NUEVO] Networking híbrido (VPN, Direct Connect)
[NUEVO] Compliance gubernamental (soberanía de datos)
```

---

## Estado Actual y Objetivos

### Estado Actual (MVP Cloud-to-Cloud)

El proyecto ha completado la Fase 1 con funcionalidad cloud-to-cloud:
- Factory pattern multi-cloud
- Escaneo de recursos en AWS/OCI
- Generación de planes de migración
- Frontend React funcional

**Limitación**: Solo funciona para migraciones entre nubes públicas.

### Objetivo de Este Módulo

Implementar capacidad completa de migración **On-Premise → Cloud** que permita:

1. **Descubrir** infraestructura on-premise (VMware, Hyper-V, físicos)
2. **Analizar** aplicaciones, dependencias y requisitos
3. **Planificar** migraciones por ondas (waves)
4. **Ejecutar** conversiones V2V/P2V y migraciones de datos
5. **Validar** funcionamiento post-migración
6. **Cumplir** con regulaciones gubernamentales

---

## Arquitectura de Solución

### Componentes Principales

```
┌──────────────────────────────────────────────────────────────────┐
│  CLIENTE (On-Premise Government Data Center)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────┐             │
│  │  Discovery Agent (Instalado Localmente)       │             │
│  ├────────────────────────────────────────────────┤             │
│  │  - VMware vCenter Connector                   │             │
│  │  - Hyper-V System Center Connector            │             │
│  │  - Physical Server Agent                      │             │
│  │  - Application Dependency Mapper              │             │
│  │  - Performance Metrics Collector              │             │
│  └────────────────────────────────────────────────┘             │
│                      │                                           │
│                      │ (Metadata Only)                           │
│                      ▼                                           │
└──────────────────────────────────────────────────────────────────┘
                       │
                       │ HTTPS (Encrypted)
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│  NUESTRA PLATAFORMA (GovTech Cloud Migration SaaS)              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │  Inventory Manager │  │  Dependency Graph  │                │
│  └────────────────────┘  └────────────────────┘                │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │  Wave Planner      │  │  Cost Calculator   │                │
│  └────────────────────┘  └────────────────────┘                │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │  Conversion Engine │  │  Compliance Check  │                │
│  └────────────────────┘  └────────────────────┘                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                       │
                       │ (Orchestration)
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│  DESTINO (Cloud Provider)                                        │
├──────────────────────────────────────────────────────────────────┤
│  AWS / OCI / GCP / Azure                                         │
│                                                                  │
│  - VMs migradas                                                  │
│  - Storage migrado                                               │
│  - Networking configurado                                        │
└──────────────────────────────────────────────────────────────────┘
```

### Arquitectura de Privacidad de Datos

**CRÍTICO**: Para gobiernos, la privacidad de datos es fundamental.

```
┌─────────────────────────────────────────────────────────────┐
│  ESTRATEGIA: ARQUITECTURA DE AGENTE                         │
└─────────────────────────────────────────────────────────────┘

Principio: LOS DATOS NUNCA SALEN DEL CONTROL DEL CLIENTE

On-Premise Government DC:
  ┌──────────────────────────────────────────┐
  │  Migration Agent (Instalado Local)      │
  │                                          │
  │  ┌────────────┐        ┌──────────────┐ │
  │  │  Origen    │───────>│   Destino    │ │
  │  │  (VMware)  │  Data  │   (AWS/OCI)  │ │
  │  └────────────┘        └──────────────┘ │
  │         │                      │         │
  │         │ Metadata             │         │
  │         ▼                      ▼         │
  │  ┌──────────────────────────────────┐   │
  │  │  Local Orchestration Engine     │   │
  │  └──────────────────────────────────┘   │
  └──────────────────────────────────────────┘
            │
            │ (Solo metadata: qué migrar, cuándo, progreso)
            │ (NO datos sensibles)
            ▼
  Nuestra Plataforma (Control Plane)

Ventajas:
[+] Datos NUNCA pasan por nuestros servidores
[+] Cumple con regulaciones de soberanía de datos
[+] Apropiado para GDPR, HIPAA, LGPD
[+] Cliente mantiene control total
[+] Tráfico de datos va directo: On-Premise → Cloud Provider

Desventajas:
[-] Cliente debe instalar agente
[-] Requiere conectividad desde on-premise a cloud
[-] Más complejo de desarrollar
```

---

## Fases de Implementación

### Fase 1: Discovery y Inventory (4-6 semanas)

#### Objetivo
Construir agentes de descubrimiento que escaneen infraestructura on-premise y construyan un inventario completo.

#### 1.1 Discovery Agent Base

**Descripción**: Agente standalone que se instala en el data center del cliente.

**Tecnología**:
- Node.js (para compatibilidad con plataforma principal)
- Empaquetado como ejecutable (usando pkg o nexe)
- Soporta Windows Server y Linux

**Features**:
```javascript
// agent/discovery-agent/src/agent.js
class DiscoveryAgent {
  constructor(config) {
    this.platformUrl = config.platformUrl; // URL de nuestra plataforma
    this.apiKey = config.apiKey;          // API key para autenticación
    this.scanners = [];
  }

  async initialize() {
    // Cargar scanners disponibles
    this.scanners.push(new VMwareScanner());
    this.scanners.push(new HyperVScanner());
    this.scanners.push(new PhysicalServerScanner());
    this.scanners.push(new NetworkScanner());
  }

  async discover() {
    const inventory = {
      timestamp: new Date(),
      environment: 'on-premise',
      resources: []
    };

    // Ejecutar todos los scanners
    for (const scanner of this.scanners) {
      try {
        const resources = await scanner.scan();
        inventory.resources.push(...resources);
      } catch (error) {
        logger.error(`Scanner ${scanner.name} failed`, error);
      }
    }

    // Enviar inventory a plataforma (solo metadata)
    await this.sendInventory(inventory);
  }

  async sendInventory(inventory) {
    // Solo envía metadata, NO datos sensibles
    await axios.post(`${this.platformUrl}/api/on-premise/inventory`, {
      inventory: this.sanitizeInventory(inventory)
    }, {
      headers: { 'X-API-Key': this.apiKey }
    });
  }
}
```

**Instalación**:
```bash
# Windows
discovery-agent-setup.exe --platform-url https://migration.govtech.com --api-key ABC123

# Linux
sudo ./discovery-agent-installer.sh --platform-url https://migration.govtech.com --api-key ABC123
```

**Archivos a Crear**:
- `agent/discovery-agent/package.json`
- `agent/discovery-agent/src/agent.js`
- `agent/discovery-agent/src/config.js`
- `agent/discovery-agent/src/api-client.js`
- `agent/discovery-agent/installers/windows-setup.nsi` (NSIS installer)
- `agent/discovery-agent/installers/linux-install.sh`

---

#### 1.2 VMware vCenter Scanner

**Descripción**: Conecta a VMware vCenter y descubre VMs, ESXi hosts, datastores, redes.

**Tecnología**: VMware vSphere API (REST o SDK)

**Implementation**:
```javascript
// agent/discovery-agent/src/scanners/vmware-scanner.js
const { Client } = require('node-vsphere');

class VMwareScanner {
  constructor(config) {
    this.vcenterUrl = config.vcenterUrl;
    this.username = config.username;
    this.password = config.password;
  }

  async scan() {
    const client = new Client(this.vcenterUrl, this.username, this.password);
    await client.login();

    const resources = [];

    // 1. Escanear VMs
    const vms = await client.getVirtualMachines();
    for (const vm of vms) {
      resources.push({
        type: 'virtual-machine',
        source: 'vmware',
        id: vm.id,
        name: vm.name,
        powerState: vm.powerState,
        guestOS: vm.guestOS,
        cpus: vm.config.hardware.numCPU,
        memoryMB: vm.config.hardware.memoryMB,
        diskGB: this.calculateTotalDisk(vm.config.hardware.device),
        network: vm.guest.net.map(n => ({
          name: n.network,
          ipAddress: n.ipAddress
        })),
        performance: await this.getPerformanceStats(client, vm)
      });
    }

    // 2. Escanear ESXi Hosts
    const hosts = await client.getHosts();
    for (const host of hosts) {
      resources.push({
        type: 'esxi-host',
        source: 'vmware',
        name: host.name,
        cpuCores: host.hardware.cpuInfo.numCpuCores,
        cpuMhz: host.hardware.cpuInfo.hz / 1000000,
        memoryGB: host.hardware.memorySize / (1024 ** 3),
        model: host.hardware.systemInfo.model
      });
    }

    // 3. Escanear Datastores
    const datastores = await client.getDatastores();
    for (const ds of datastores) {
      resources.push({
        type: 'datastore',
        source: 'vmware',
        name: ds.name,
        capacityGB: ds.summary.capacity / (1024 ** 3),
        freeSpaceGB: ds.summary.freeSpace / (1024 ** 3),
        type: ds.summary.type
      });
    }

    await client.logout();
    return resources;
  }

  async getPerformanceStats(client, vm) {
    // Obtener métricas de los últimos 30 días
    const stats = await client.getPerformanceStats(vm.id, {
      metrics: ['cpu.usage.average', 'mem.usage.average', 'disk.usage.average'],
      days: 30
    });

    return {
      avgCpuUsage: this.average(stats['cpu.usage.average']),
      avgMemoryUsage: this.average(stats['mem.usage.average']),
      avgDiskUsage: this.average(stats['disk.usage.average']),
      peakCpuUsage: Math.max(...stats['cpu.usage.average']),
      peakMemoryUsage: Math.max(...stats['mem.usage.average'])
    };
  }
}
```

**Configuración**:
```json
{
  "vmware": {
    "vcenterUrl": "https://vcenter.gobierno.local",
    "username": "migration-agent@vsphere.local",
    "password": "<encrypted>",
    "validateSsl": false
  }
}
```

**Permisos Requeridos en vCenter**:
- Read-only access a VMs
- Read-only access a Hosts
- Read-only access a Datastores
- Access to performance metrics

---

#### 1.3 Hyper-V Scanner

**Descripción**: Escanea Hyper-V usando System Center Virtual Machine Manager (SCVMM) o PowerShell.

**Implementation**:
```javascript
// agent/discovery-agent/src/scanners/hyperv-scanner.js
const { PowerShell } = require('node-powershell');

class HyperVScanner {
  async scan() {
    const ps = new PowerShell();
    const resources = [];

    // 1. Obtener VMs via PowerShell
    const vmsScript = `
      Get-VM | Select-Object Name, State, ProcessorCount, MemoryStartup,
                              @{Name="DiskSize";Expression={(Get-VHD -VMId $_.Id).Size}}
      | ConvertTo-Json
    `;

    const vmsResult = await ps.invoke(vmsScript);
    const vms = JSON.parse(vmsResult);

    for (const vm of vms) {
      resources.push({
        type: 'virtual-machine',
        source: 'hyper-v',
        name: vm.Name,
        powerState: vm.State,
        cpus: vm.ProcessorCount,
        memoryMB: vm.MemoryStartup / (1024 ** 2),
        diskGB: vm.DiskSize / (1024 ** 3)
      });
    }

    // 2. Obtener Hyper-V Hosts
    const hostsScript = `
      Get-VMHost | Select-Object ComputerName, LogicalProcessorCount, MemoryCapacity
      | ConvertTo-Json
    `;

    const hostsResult = await ps.invoke(hostsScript);
    const hosts = JSON.parse(hostsResult);

    for (const host of hosts) {
      resources.push({
        type: 'hyper-v-host',
        source: 'hyper-v',
        name: host.ComputerName,
        cpuCores: host.LogicalProcessorCount,
        memoryGB: host.MemoryCapacity / (1024 ** 3)
      });
    }

    return resources;
  }
}
```

---

#### 1.4 Physical Server Scanner

**Descripción**: Para servidores físicos (bare metal), instalar agente ligero que reporte configuración.

**Implementation**:
```javascript
// agent/discovery-agent/src/scanners/physical-server-scanner.js
const os = require('os');
const si = require('systeminformation');

class PhysicalServerScanner {
  async scan() {
    const resources = [];

    // Detectar si estamos en servidor físico (no VM)
    const system = await si.system();
    if (system.virtual) {
      return []; // Skip, es una VM
    }

    const cpu = await si.cpu();
    const mem = await si.mem();
    const disk = await si.fsSize();
    const network = await si.networkInterfaces();

    resources.push({
      type: 'physical-server',
      source: 'bare-metal',
      hostname: os.hostname(),
      manufacturer: system.manufacturer,
      model: system.model,
      serialNumber: system.serial,
      os: {
        platform: os.platform(),
        release: os.release(),
        version: os.version()
      },
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speedGHz: cpu.speed
      },
      memory: {
        totalGB: mem.total / (1024 ** 3),
        usedGB: mem.used / (1024 ** 3)
      },
      disks: disk.map(d => ({
        mount: d.mount,
        type: d.type,
        sizeGB: d.size / (1024 ** 3),
        usedGB: d.used / (1024 ** 3)
      })),
      network: network.map(n => ({
        interface: n.iface,
        ip4: n.ip4,
        mac: n.mac,
        speed: n.speed
      }))
    });

    return resources;
  }
}
```

---

#### 1.5 Application Dependency Mapping

**Descripción**: Detectar qué aplicaciones dependen de qué servidores (ej: web server → app server → database).

**Tecnología**: Network traffic analysis + service discovery

**Implementation**:
```javascript
// agent/discovery-agent/src/scanners/dependency-mapper.js
class DependencyMapper {
  async mapDependencies(inventory) {
    const dependencies = [];

    // 1. Analizar conexiones de red activas
    for (const server of inventory.servers) {
      const connections = await this.getActiveConnections(server);

      for (const conn of connections) {
        dependencies.push({
          from: server.id,
          to: conn.remoteAddress,
          port: conn.remotePort,
          protocol: conn.protocol,
          frequency: conn.connectionCount
        });
      }
    }

    // 2. Analizar servicios instalados
    for (const server of inventory.servers) {
      const services = await this.getInstalledServices(server);
      server.services = services;
    }

    // 3. Construir grafo de dependencias
    const graph = this.buildDependencyGraph(inventory, dependencies);

    return graph;
  }

  buildDependencyGraph(inventory, dependencies) {
    const graph = {
      nodes: inventory.servers.map(s => ({
        id: s.id,
        name: s.name,
        type: this.detectServerRole(s)
      })),
      edges: dependencies.map(d => ({
        source: d.from,
        target: d.to,
        weight: d.frequency
      }))
    };

    return graph;
  }

  detectServerRole(server) {
    // Detectar rol basado en servicios instalados
    const services = server.services || [];

    if (services.includes('SQL Server') || services.includes('PostgreSQL')) {
      return 'database';
    } else if (services.includes('IIS') || services.includes('Apache')) {
      return 'web-server';
    } else if (services.includes('JBoss') || services.includes('Tomcat')) {
      return 'app-server';
    } else {
      return 'unknown';
    }
  }
}
```

---

### Fase 2: Wave Planning y Análisis (3-4 semanas)

#### Objetivo
Agrupar servidores en "ondas" de migración basadas en criticidad, dependencias y complejidad.

#### 2.1 Wave Planner

**Descripción**: Algoritmo que agrupa servidores en ondas de migración.

**Estrategia de Ondas**:
```
Onda 1 - PILOTO (1-2 semanas)
├─ Servidores no críticos
├─ Sin dependencias complejas
├─ Ambientes de desarrollo/test
└─ Objetivo: Validar proceso

Onda 2 - BAJA CRITICIDAD (2-3 semanas)
├─ Aplicaciones de bajo impacto
├─ Servicios internos
├─ Herramientas administrativas
└─ Dependencias mínimas

Onda 3 - MEDIA CRITICIDAD (3-4 semanas)
├─ Aplicaciones de negocio importantes
├─ Dependencias moderadas
├─ Requiere validación extensiva
└─ Backup disponible

Onda 4 - ALTA CRITICIDAD (4-6 semanas)
├─ Aplicaciones misión crítica
├─ Bases de datos principales
├─ Servicios ciudadanos
└─ Requiere plan de rollback completo
```

**Implementation**:
```javascript
// app/backend/src/services/wave-planner.js
class WavePlanner {
  async generateWaves(inventory, dependencyGraph) {
    // 1. Calcular score de criticidad para cada servidor
    const scores = this.calculateCriticalityScores(inventory, dependencyGraph);

    // 2. Identificar clusters de dependencias
    const clusters = this.identifyClusters(dependencyGraph);

    // 3. Asignar servidores a ondas
    const waves = [
      { number: 1, name: 'Piloto', servers: [], criticality: 'low' },
      { number: 2, name: 'Baja Criticidad', servers: [], criticality: 'low' },
      { number: 3, name: 'Media Criticidad', servers: [], criticality: 'medium' },
      { number: 4, name: 'Alta Criticidad', servers: [], criticality: 'high' }
    ];

    // Asignar servidores independientes primero
    const independentServers = inventory.servers.filter(s =>
      !this.hasDependencies(s, dependencyGraph)
    );

    // Onda 1: Piloto (5-10 servidores de menor criticidad)
    waves[0].servers = independentServers
      .sort((a, b) => scores[a.id] - scores[b.id])
      .slice(0, 10);

    // Onda 2-4: Asignar clusters completos
    for (const cluster of clusters) {
      const clusterCriticality = this.calculateClusterCriticality(cluster, scores);

      if (clusterCriticality < 3) {
        waves[1].servers.push(...cluster.servers);
      } else if (clusterCriticality < 7) {
        waves[2].servers.push(...cluster.servers);
      } else {
        waves[3].servers.push(...cluster.servers);
      }
    }

    return waves;
  }

  calculateCriticalityScores(inventory, dependencyGraph) {
    const scores = {};

    for (const server of inventory.servers) {
      let score = 0;

      // Factor 1: Número de dependencias (más dependencias = más crítico)
      const dependencies = this.getDependencies(server, dependencyGraph);
      score += dependencies.length * 2;

      // Factor 2: Rol del servidor
      if (server.type === 'database') score += 5;
      if (server.type === 'web-server') score += 2;

      // Factor 3: Tags de criticidad
      if (server.tags?.includes('production')) score += 5;
      if (server.tags?.includes('critical')) score += 10;

      // Factor 4: Uso de recursos (más uso = más crítico)
      if (server.performance?.avgCpuUsage > 70) score += 3;

      scores[server.id] = score;
    }

    return scores;
  }
}
```

---

#### 2.2 Compliance Checker

**Descripción**: Validar que la migración cumple con regulaciones gubernamentales.

**Regulaciones a Validar**:
- Soberanía de datos (datos deben quedarse en el país)
- LGPD (Brasil), GDPR (Europa)
- Certificaciones requeridas (ISO 27001, SOC 2)
- Encriptación en reposo y en tránsito

**Implementation**:
```javascript
// app/backend/src/services/compliance-checker.js
class ComplianceChecker {
  async checkCompliance(migrationPlan, requirements) {
    const issues = [];
    const warnings = [];

    // 1. Verificar soberanía de datos
    if (requirements.dataSovereignty) {
      const targetRegion = migrationPlan.targetProvider.region;
      if (!this.isInCountry(targetRegion, requirements.country)) {
        issues.push({
          severity: 'critical',
          rule: 'data-sovereignty',
          message: `Target region ${targetRegion} is not in ${requirements.country}`,
          remediation: `Choose a region within ${requirements.country}`
        });
      }
    }

    // 2. Verificar encriptación
    for (const resource of migrationPlan.resources) {
      if (resource.type === 'database' || resource.type === 'storage') {
        if (!resource.encryption?.enabled) {
          issues.push({
            severity: 'high',
            rule: 'encryption-at-rest',
            message: `${resource.name} does not have encryption at rest enabled`,
            remediation: 'Enable encryption for this resource'
          });
        }
      }
    }

    // 3. Verificar certificaciones del proveedor
    const providerCerts = this.getProviderCertifications(migrationPlan.targetProvider);
    for (const requiredCert of requirements.certifications) {
      if (!providerCerts.includes(requiredCert)) {
        warnings.push({
          severity: 'medium',
          rule: 'provider-certifications',
          message: `Provider does not have ${requiredCert} certification`,
          remediation: 'Verify with provider or choose different provider'
        });
      }
    }

    return {
      compliant: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      warnings
    };
  }
}
```

---

### Fase 3: Migración y Conversión (6-8 semanas)

#### 3.1 VM Conversion Engine

**Descripción**: Convertir VMs de VMware/Hyper-V a formato compatible con cloud.

**Conversiones Necesarias**:
- VMware VMDK → AWS EBS / OCI Block Volume
- Hyper-V VHDX → Azure VHD / AWS EBS
- Physical → Cloud VM (P2V)

**Herramientas Existentes a Integrar**:
- AWS Application Migration Service (CloudEndure)
- Azure Migrate
- OCI Cloud Migration
- GCP Migrate for Compute Engine

**Implementation**:
```javascript
// app/backend/src/services/vm-converter.js
class VMConverter {
  async convertVM(vm, targetProvider) {
    logger.info(`Converting VM ${vm.name} to ${targetProvider}`);

    // 1. Validar VM es compatible
    const compatibility = await this.checkCompatibility(vm, targetProvider);
    if (!compatibility.compatible) {
      throw new Error(`VM ${vm.name} is not compatible: ${compatibility.reason}`);
    }

    // 2. Seleccionar herramienta de conversión
    const tool = this.selectConversionTool(vm.source, targetProvider);

    // 3. Preparar VM para conversión
    await this.prepareVM(vm);

    // 4. Ejecutar conversión
    const conversionJob = await tool.startConversion({
      sourceVm: vm,
      targetProvider,
      targetRegion: this.config.targetRegion,
      targetVpc: this.config.targetVpc,
      targetSubnet: this.config.targetSubnet,
      instanceType: this.mapInstanceType(vm, targetProvider)
    });

    // 5. Monitorear progreso
    await this.monitorConversion(conversionJob);

    // 6. Validar VM migrada
    const migratedVM = await this.validateMigratedVM(conversionJob.targetVMId);

    return migratedVM;
  }

  selectConversionTool(source, target) {
    const matrix = {
      'vmware': {
        'aws': AWSApplicationMigrationService,
        'oci': OCICloudMigration,
        'gcp': GCPMigrateForComputeEngine,
        'azure': AzureMigrate
      },
      'hyper-v': {
        'aws': AWSApplicationMigrationService,
        'azure': AzureMigrate
      }
    };

    const Tool = matrix[source]?.[target];
    if (!Tool) {
      throw new Error(`No conversion tool available for ${source} → ${target}`);
    }

    return new Tool(this.config);
  }

  mapInstanceType(vm, targetProvider) {
    // Mapear specs de VM a instance type del proveedor
    const cpus = vm.cpus;
    const memoryGB = vm.memoryMB / 1024;

    const mappings = {
      'aws': [
        { min: { cpu: 1, mem: 1 }, max: { cpu: 2, mem: 4 }, type: 't3.small' },
        { min: { cpu: 2, mem: 4 }, max: { cpu: 4, mem: 8 }, type: 't3.medium' },
        { min: { cpu: 4, mem: 8 }, max: { cpu: 8, mem: 16 }, type: 't3.large' },
        { min: { cpu: 8, mem: 16 }, max: { cpu: 16, mem: 32 }, type: 'm5.2xlarge' }
      ],
      // Similar para OCI, GCP, Azure...
    };

    const providerMappings = mappings[targetProvider];
    for (const mapping of providerMappings) {
      if (cpus >= mapping.min.cpu && cpus <= mapping.max.cpu &&
          memoryGB >= mapping.min.mem && memoryGB <= mapping.max.mem) {
        return mapping.type;
      }
    }

    throw new Error(`No suitable instance type found for ${cpus} CPUs, ${memoryGB} GB RAM`);
  }
}
```

---

#### 3.2 Data Migration Engine

**Descripción**: Migrar datos (archivos, bases de datos) de on-premise a cloud.

**Estrategias**:
- **Archivos**: Rsync, AWS DataSync, Azure File Sync
- **Bases de datos**: Replicación nativa, dump/restore, AWS DMS

**Implementation**:
```javascript
// app/backend/src/services/data-migrator-onpremise.js
class OnPremiseDataMigrator {
  async migrateData(source, target, options) {
    const strategy = this.selectStrategy(source, target);

    // Iniciar transferencia
    const job = await strategy.startTransfer({
      source: source.path,
      target: target.path,
      bandwidth: options.bandwidthLimit || 'unlimited',
      compression: options.compression || true,
      encryption: options.encryption || true,
      verification: options.verification || 'checksum'
    });

    // Monitorear progreso
    await this.monitorTransfer(job);

    // Verificar integridad
    await this.verifyDataIntegrity(source, target);

    return job;
  }

  selectStrategy(source, target) {
    // Para archivos grandes: AWS DataSync
    if (source.type === 'filesystem' && target.provider === 'aws') {
      return new AWSDataSyncStrategy();
    }

    // Para bases de datos: AWS DMS
    if (source.type === 'database' && target.provider === 'aws') {
      return new AWSDMSStrategy();
    }

    // Fallback: Rsync genérico
    return new RsyncStrategy();
  }
}
```

---

### Fase 4: Testing y Validación (2-3 semanas)

#### 4.1 Post-Migration Validation

**Tests a Ejecutar**:
1. Connectivity tests
2. Application smoke tests
3. Performance benchmarks
4. Security scanning
5. Compliance verification

**Implementation**:
```javascript
// app/backend/src/services/post-migration-validator-onpremise.js
class OnPremisePostMigrationValidator {
  async validate(migrationId) {
    const results = {
      connectivity: await this.testConnectivity(migrationId),
      applications: await this.testApplications(migrationId),
      performance: await this.benchmarkPerformance(migrationId),
      security: await this.scanSecurity(migrationId),
      compliance: await this.verifyCompliance(migrationId)
    };

    const allPassed = Object.values(results).every(r => r.passed);

    return {
      success: allPassed,
      results,
      recommendations: this.generateRecommendations(results)
    };
  }

  async testConnectivity(migrationId) {
    const migration = await db.migrations.findById(migrationId);
    const tests = [];

    // Test conectividad a cada VM migrada
    for (const vm of migration.migratedVMs) {
      tests.push({
        vm: vm.name,
        ping: await this.pingHost(vm.ipAddress),
        ssh: await this.testSSH(vm.ipAddress, vm.sshKey),
        ports: await this.testOpenPorts(vm.ipAddress, vm.expectedPorts)
      });
    }

    return {
      passed: tests.every(t => t.ping && t.ssh),
      tests
    };
  }
}
```

---

## Timeline General

```
FASE 1: Discovery y Inventory (4-6 semanas)
├─ Semana 1-2: Discovery Agent Base + VMware Scanner
├─ Semana 3: Hyper-V Scanner + Physical Scanner
├─ Semana 4-5: Dependency Mapping
└─ Semana 6: Testing + Integration

FASE 2: Wave Planning (3-4 semanas)
├─ Semana 7-8: Wave Planner Algorithm
├─ Semana 9: Compliance Checker
└─ Semana 10: Cost Estimator

FASE 3: Migración y Conversión (6-8 semanas)
├─ Semana 11-13: VM Conversion Engine
├─ Semana 14-16: Data Migration Engine
├─ Semana 17-18: Orchestration + Monitoring

FASE 4: Testing y Validación (2-3 semanas)
├─ Semana 19-20: Post-Migration Validator
└─ Semana 21: Documentation + Training

TOTAL: 15-21 semanas (aproximadamente 4-5 meses)
```

---

## Estimación de Recursos y Costos

### Equipo Requerido

**Fase 1-2** (7-10 semanas):
- 2 Backend Developers (Node.js, PowerShell, VMware APIs)
- 1 Infrastructure Engineer (VMware, Hyper-V expertise)
- 1 DevOps Engineer (part-time)

**Fase 3-4** (8-11 semanas):
- 3 Backend Developers
- 1 Cloud Migration Specialist
- 1 QA Engineer
- 1 Security Engineer (part-time)

### Costos Estimados

```
Desarrollo (15-21 semanas):
├─ 3 Backend Devs @ $80-120k/año        = $69k - $104k
├─ 1 Infrastructure Engineer @ $90-130k = $25k - $36k
├─ 1 Cloud Migration Specialist @ $100-150k = $28k - $43k
├─ 1 DevOps @ $90-130k/año (50%)        = $13k - $19k
├─ 1 QA Engineer @ $60-90k/año (75%)    = $8k - $12k
└─ 1 Security Engineer @ $100-140k (25%)= $4k - $6k
                                   Total: $147k - $220k

Herramientas y Licencias:
├─ AWS Application Migration Service    = Gratis (pay per migrated server)
├─ Azure Migrate                         = Gratis
├─ Herramientas de testing               = $3k - $5k
└─ Entornos de desarrollo                = $5k - $10k
                                    Total: $8k - $15k

COSTO TOTAL ESTIMADO: $155k - $235k
```

---

## Métricas de Éxito

### KPIs Técnicos
- **Discovery Accuracy**: > 95% de recursos descubiertos
- **Migration Success Rate**: > 90% de VMs migradas exitosamente
- **Data Integrity**: 100% (checksums match)
- **Downtime per Server**: < 4 horas
- **Post-Migration Performance**: > 95% de performance original

### KPIs de Negocio
- **Tiempo Total de Proyecto**: 15-24 meses para data center completo
- **Costo vs Manual**: 40-50% menos que migración manual
- **ROI del Cliente**: < 18 meses
- **Customer Satisfaction**: > 4.5/5

---

## Riesgos y Mitigaciones

### Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| VMs incompatibles con cloud | Media | Alto | Pre-assessment detallado, conversión manual si necesario |
| Pérdida de datos durante migración | Baja | Crítico | Backups múltiples, validación rigurosa, dry runs |
| Performance degradation post-migración | Media | Alto | Benchmarking pre/post, right-sizing de instancias |
| Dependencias no detectadas | Media | Alto | Dependency mapping exhaustivo, testing extensivo |
| Networking issues (VPN, conectividad) | Alta | Medio | Networking híbrido, testing de conectividad temprano |

### Riesgos de Compliance

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Violación de soberanía de datos | Baja | Crítico | Compliance checker automatizado, auditorías |
| Falta de certificaciones requeridas | Media | Alto | Validar certificaciones de provider antes de migrar |
| No cumplimiento de encriptación | Baja | Alto | Encriptación forzada por defecto |

---

## Arquitectura de Agente Detallada

### Componentes del Agente

```
Discovery Agent
├─ Core
│  ├─ agent.js                  # Orchestrador principal
│  ├─ config.js                 # Configuración
│  ├─ api-client.js             # Cliente API para plataforma
│  └─ scheduler.js              # Scheduling de scans
├─ Scanners
│  ├─ vmware-scanner.js
│  ├─ hyperv-scanner.js
│  ├─ physical-scanner.js
│  ├─ network-scanner.js
│  └─ dependency-mapper.js
├─ Collectors
│  ├─ performance-collector.js  # Métricas de performance
│  ├─ config-collector.js       # Configuraciones del sistema
│  └─ log-collector.js          # Logs relevantes
└─ Security
   ├─ encryption.js             # Encriptación de datos sensibles
   └─ certificate-validator.js  # Validación de certificados SSL
```

### Comunicación Agente ↔ Plataforma

```
Protocolo: HTTPS
Autenticación: API Key + mTLS (mutual TLS)
Frecuencia: Cada 6 horas (configurable)

Payload enviado por agente:
{
  "agentId": "agent-gov-datacenter-001",
  "timestamp": "2026-02-11T19:00:00Z",
  "inventory": {
    "servers": [...],
    "networks": [...],
    "storage": [...]
  },
  "dependencies": {
    "nodes": [...],
    "edges": [...]
  },
  "performance": {
    "server-001": {
      "cpu": { "avg": 45, "peak": 78 },
      "memory": { "avg": 62, "peak": 89 }
    }
  }
}

Datos NO enviados:
- Datos de aplicaciones
- Contenido de archivos
- Credenciales
- Información PII
```

---

## Integración con Plataforma Existente

### Nuevos Endpoints de API

```javascript
// app/backend/src/routes/on-premise.js

// Recibir inventory de agente
POST /api/on-premise/inventory

// Generar plan de ondas
POST /api/on-premise/waves/generate

// Iniciar migración de onda
POST /api/on-premise/waves/:waveId/migrate

// Status de migración
GET /api/on-premise/migrations/:migrationId/status

// Validación post-migración
POST /api/on-premise/migrations/:migrationId/validate

// Compliance check
POST /api/on-premise/compliance/check
```

### Nuevas Tablas de Base de Datos

```sql
-- Inventory on-premise
CREATE TABLE onpremise_inventory (
  id UUID PRIMARY KEY,
  agent_id VARCHAR(255),
  organization_id UUID,
  timestamp TIMESTAMP,
  inventory JSONB,
  dependencies JSONB,
  performance JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Waves de migración
CREATE TABLE migration_waves (
  id UUID PRIMARY KEY,
  organization_id UUID,
  wave_number INTEGER,
  wave_name VARCHAR(255),
  criticality VARCHAR(50),
  servers JSONB,
  status VARCHAR(50), -- planned, in-progress, completed
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migraciones on-premise
CREATE TABLE onpremise_migrations (
  id UUID PRIMARY KEY,
  wave_id UUID REFERENCES migration_waves(id),
  server_id VARCHAR(255),
  server_name VARCHAR(255),
  source_type VARCHAR(50), -- vmware, hyper-v, physical
  target_provider VARCHAR(50), -- aws, oci, gcp, azure
  target_vm_id VARCHAR(255),
  status VARCHAR(50), -- pending, converting, migrating, validating, completed, failed
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Documentación de Usuario

### Para Administradores de IT Gubernamental

**Guía de Instalación del Agente**:

```markdown
# Instalación del Discovery Agent

## Requisitos Previos
- Windows Server 2016+ o Linux (Ubuntu 20.04+, RHEL 8+)
- Acceso de red a VMware vCenter (puerto 443)
- Acceso de red a Hyper-V hosts (puerto 5985 WinRM)
- Conectividad HTTPS a migration.govtech.com (puerto 443)

## Instalación en Windows

1. Descargar instalador:
   https://migration.govtech.com/downloads/discovery-agent-windows.exe

2. Ejecutar instalador como Administrador

3. Proveer configuración:
   - Platform URL: https://migration.govtech.com
   - API Key: (obtenido del portal web)
   - vCenter URL: https://vcenter.gobierno.local
   - vCenter Username: migration-agent@vsphere.local
   - vCenter Password: ********

4. El agente se instalará como servicio de Windows y comenzará a escanear

## Instalación en Linux

bash
sudo wget https://migration.govtech.com/downloads/discovery-agent-linux.sh
sudo chmod +x discovery-agent-linux.sh
sudo ./discovery-agent-linux.sh --platform-url https://migration.govtech.com \
                                 --api-key YOUR_API_KEY

## Verificación

# Windows
sc query GovTechDiscoveryAgent

# Linux
sudo systemctl status govtech-discovery-agent

## Logs

# Windows
C:\ProgramData\GovTech\Discovery-Agent\logs\agent.log

# Linux
/var/log/govtech/discovery-agent/agent.log
```

---

## Conclusión

Este roadmap detalla la implementación completa del módulo **On-Premise to Cloud** para la plataforma GovTech Cloud Migration. La implementación permitirá a gobiernos latinoamericanos migrar sus data centers a la nube de forma segura, cumpliendo con todas las regulaciones, y con transparencia total sobre dónde están sus datos.

**Diferenciadores Clave**:
1. **Arquitectura de Agente**: Datos nunca salen del control del cliente
2. **Compliance Built-in**: Validación automática de soberanía de datos
3. **Wave Planning**: Migración gradual por criticidad
4. **Multi-Platform**: Soporte para VMware, Hyper-V, y servidores físicos
5. **Multi-Cloud**: Migración a AWS, OCI, GCP, o Azure

**Próximos Pasos Inmediatos**:
1. Revisar y aprobar este roadmap
2. Asignar equipo y presupuesto ($155k-$235k)
3. Iniciar Fase 1: Discovery Agent Base
4. Establecer partnerships con VMware y Microsoft
5. Obtener certificaciones gubernamentales necesarias

---

**Fin del Documento**
