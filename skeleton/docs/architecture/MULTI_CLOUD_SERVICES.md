# Servicios Multi-Cloud - Mapa de Implementacion

Este documento describe los servicios que deben implementarse en cada proveedor cloud para que la plataforma sea completamente portable. La arquitectura usa el **patron Factory + Interfaces**: el codigo de la aplicacion no cambia, solo se agrega la implementacion del proveedor.

---

## Como funciona la portabilidad

```
Aplicacion (routes, controllers)
    |
    v
ServiceFactory.getStorageService()   <-- lee CLOUD_PROVIDER del .env
    |
    +-- CLOUD_PROVIDER=aws   --> AwsStorageService   (por implementar)
    +-- CLOUD_PROVIDER=oci   --> OciStorageService   (por implementar)
    +-- CLOUD_PROVIDER=gcp   --> GcpStorageService   (por implementar)
    +-- CLOUD_PROVIDER=azure --> AzureStorageService (por implementar)
```

Para migrar de AWS a OCI: cambiar `CLOUD_PROVIDER=oci` en `.env` e implementar los 4 servicios de OCI. El resto de la aplicacion no requiere cambios.

---

## Comparacion de Servicios por Proveedor

| Interfaz | AWS | OCI | GCP | Azure |
|---|---|---|---|---|
| **StorageService** | S3 | Object Storage | Cloud Storage | Blob Storage |
| **DatabaseService** | RDS PostgreSQL | DB Service | Cloud SQL | DB for PostgreSQL |
| **MonitoringService** | CloudWatch | Monitoring | Cloud Operations | Azure Monitor |
| **AuthService** | IAM / Cognito | Identity Cloud Service | Firebase Auth / IAM | Azure Active Directory |
| **Container Registry** | ECR | OCIR | Artifact Registry | ACR |
| **Kubernetes** | EKS | OKE | GKE | AKS |
| **Load Balancer** | ALB / ELB | Load Balancer | Cloud Load Balancing | Azure Load Balancer |
| **DNS** | Route 53 | DNS | Cloud DNS | Azure DNS |
| **Secrets** | Secrets Manager | Vault Service | Secret Manager | Key Vault |
| **CI/CD Auth** | OIDC + IAM Role | OIDC + IAM | Workload Identity | Managed Identity |

---

## Estructura de archivos a crear en el backend

Todos los proveedores siguen la misma estructura dentro de `app/backend/src/services/`:

```
src/services/
  factory.js                          <-- selecciona el proveedor segun CLOUD_PROVIDER
  providers/
    aws/
      aws-storage.service.js
      aws-database.service.js
      aws-monitoring.service.js
      aws-auth.service.js
    oci/
      oci-storage.service.js
      oci-database.service.js
      oci-monitoring.service.js
      oci-auth.service.js
    gcp/
      gcp-storage.service.js
      gcp-database.service.js
      gcp-monitoring.service.js
      gcp-auth.service.js
    azure/
      azure-storage.service.js
      azure-database.service.js
      azure-monitoring.service.js
      azure-auth.service.js
```

---

## Contrato de interfaces (que metodos debe implementar cada servicio)

Cada proveedor DEBE implementar exactamente estos metodos con estos parametros. Si el metodo no esta implementado, lanzar un error explicativo.

### StorageService

```js
class StorageService {
  // Subir un archivo al bucket/container
  async uploadFile(bucketName, key, body, contentType) {}

  // Descargar un archivo
  async downloadFile(bucketName, key) {}  // retorna Buffer

  // Eliminar un archivo
  async deleteFile(bucketName, key) {}

  // Listar archivos con prefijo opcional
  async listFiles(bucketName, prefix = '') {}  // retorna [{ key, size, lastModified }]

  // Generar URL temporal de acceso (pre-signed URL)
  async getSignedUrl(bucketName, key, expiresInSeconds = 3600) {}  // retorna string URL
}
```

### DatabaseService

```js
class DatabaseService {
  // Ejecutar una query SQL
  async query(sql, params = []) {}  // retorna { rows: [], rowCount: number }

  // Iniciar una transaccion
  async beginTransaction() {}

  // Confirmar una transaccion
  async commitTransaction(client) {}

  // Revertir una transaccion
  async rollbackTransaction(client) {}

  // Verificar conexion (para health checks)
  async ping() {}  // retorna { status: 'healthy' | 'unhealthy', latencyMs: number }
}
```

### MonitoringService

```js
class MonitoringService {
  // Registrar una metrica numerica
  async putMetric(namespace, metricName, value, unit = 'Count') {}

  // Registrar un evento en los logs
  async logEvent(logGroup, message, level = 'INFO') {}

  // Crear o actualizar una alarma
  async createAlarm(alarmName, metricName, threshold, comparison) {}

  // Obtener metricas recientes (para el dashboard de health)
  async getMetrics(namespace, metricName, periodMinutes = 60) {}
  // retorna [{ timestamp, value }]
}
```

### AuthService

```js
class AuthService {
  // Verificar si un token es valido
  async verifyToken(token) {}  // retorna { userId, roles, valid: boolean }

  // Obtener los permisos de un usuario
  async getUserPermissions(userId) {}  // retorna ['read:documents', 'write:reports', ...]

  // Generar un token de sesion
  async generateToken(userId, roles = []) {}  // retorna string token

  // Revocar un token
  async revokeToken(token) {}
}
```

---

## La Factory (archivo central que une todo)

El archivo `src/services/factory.js` es el que lee `CLOUD_PROVIDER` y devuelve la implementacion correcta. Se crea UNA VEZ y no se modifica al agregar proveedores, solo se agregan los imports.

```js
// src/services/factory.js
const PROVIDER = process.env.CLOUD_PROVIDER || 'aws';

// Al agregar OCI: descomentar estas 4 lineas
// const { OciStorageService }     = require('./providers/oci/oci-storage.service');
// const { OciDatabaseService }    = require('./providers/oci/oci-database.service');
// const { OciMonitoringService }  = require('./providers/oci/oci-monitoring.service');
// const { OciAuthService }        = require('./providers/oci/oci-auth.service');

const PROVIDERS = {
  aws: {
    storage:    () => new (require('./providers/aws/aws-storage.service').AwsStorageService)(),
    database:   () => new (require('./providers/aws/aws-database.service').AwsDatabaseService)(),
    monitoring: () => new (require('./providers/aws/aws-monitoring.service').AwsMonitoringService)(),
    auth:       () => new (require('./providers/aws/aws-auth.service').AwsAuthService)(),
  },
  // oci: {
  //   storage:    () => new OciStorageService(),
  //   database:   () => new OciDatabaseService(),
  //   monitoring: () => new OciMonitoringService(),
  //   auth:       () => new OciAuthService(),
  // },
};

function getService(type) {
  const provider = PROVIDERS[PROVIDER];
  if (!provider) throw new Error(`Proveedor '${PROVIDER}' no esta implementado. Opciones: ${Object.keys(PROVIDERS).join(', ')}`);
  return provider[type]();
}

module.exports = {
  getStorageService:    () => getService('storage'),
  getDatabaseService:   () => getService('database'),
  getMonitoringService: () => getService('monitoring'),
  getAuthService:       () => getService('auth'),
};
```

---

## Ejemplo concreto: implementar OCI Storage

Este es el esqueleto completo de `oci-storage.service.js`. Las lineas marcadas con `// TODO` son las que requieren codigo real del SDK de OCI.

```js
// src/services/providers/oci/oci-storage.service.js
// SDK requerido: npm install oci-sdk
const oci = require('oci-sdk');

class OciStorageService {
  constructor() {
    // OCI usa un archivo de configuracion (~/.oci/config) o variables de entorno
    // OCI_TENANCY_ID, OCI_USER_ID, OCI_FINGERPRINT, OCI_PRIVATE_KEY, OCI_REGION
    this.provider = new oci.common.ConfigFileAuthenticationDetailsProvider();
    this.client = new oci.objectstorage.ObjectStorageClient({
      authenticationDetailsProvider: this.provider,
    });
    this.namespace = process.env.OCI_NAMESPACE; // namespace de Object Storage en OCI
  }

  async uploadFile(bucketName, key, body, contentType) {
    // TODO: usar this.client.putObject(...)
    // Equivale a: aws s3 cp archivo s3://bucket/key
    const request = {
      namespaceName: this.namespace,
      bucketName,
      objectName: key,
      putObjectBody: body,
      contentType,
    };
    return await this.client.putObject(request);
  }

  async downloadFile(bucketName, key) {
    // TODO: usar this.client.getObject(...)
    const request = {
      namespaceName: this.namespace,
      bucketName,
      objectName: key,
    };
    const response = await this.client.getObject(request);
    return response.value; // Buffer con el contenido del archivo
  }

  async deleteFile(bucketName, key) {
    // TODO: usar this.client.deleteObject(...)
    const request = {
      namespaceName: this.namespace,
      bucketName,
      objectName: key,
    };
    return await this.client.deleteObject(request);
  }

  async listFiles(bucketName, prefix = '') {
    // TODO: usar this.client.listObjects(...)
    const request = {
      namespaceName: this.namespace,
      bucketName,
      prefix,
    };
    const response = await this.client.listObjects(request);
    return response.listObjects.objects.map(obj => ({
      key: obj.name,
      size: obj.size,
      lastModified: obj.timeModified,
    }));
  }

  async getSignedUrl(bucketName, key, expiresInSeconds = 3600) {
    // TODO: usar this.client.createPreauthenticatedRequest(...)
    // En OCI se llaman "Pre-Authenticated Requests" (PAR)
    const request = {
      namespaceName: this.namespace,
      bucketName,
      createPreauthenticatedRequestDetails: {
        name: `temp-access-${key}`,
        objectName: key,
        accessType: 'ObjectRead',
        timeExpires: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      },
    };
    const response = await this.client.createPreauthenticatedRequest(request);
    return `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com${response.preauthenticatedRequest.accessUri}`;
  }
}

module.exports = { OciStorageService };
```

---

## Variables de entorno necesarias por proveedor

Cada proveedor necesita sus propias variables en el archivo `.env` del backend:

### AWS
```env
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=835960996869
# Las credenciales se inyectan via IRSA en Kubernetes (no se ponen aqui)
```

### OCI
```env
CLOUD_PROVIDER=oci
OCI_REGION=us-ashburn-1
OCI_TENANCY_ID=ocid1.tenancy.oc1..xxx
OCI_USER_ID=ocid1.user.oc1..xxx
OCI_FINGERPRINT=xx:xx:xx:xx
OCI_PRIVATE_KEY_PATH=/secrets/oci-private-key.pem
OCI_NAMESPACE=govtech-namespace
```

### GCP
```env
CLOUD_PROVIDER=gcp
GCP_PROJECT_ID=govtech-prod
GCP_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/secrets/gcp-sa-key.json
```

### Azure
```env
CLOUD_PROVIDER=azure
AZURE_TENANT_ID=xxx
AZURE_CLIENT_ID=xxx
AZURE_SUBSCRIPTION_ID=xxx
AZURE_STORAGE_ACCOUNT=govtechstorage
# DefaultAzureCredential toma las variables automaticamente
```

---

## Proceso de migracion entre clouds

### Paso 1 - Preparar infraestructura en el destino

```bash
# Ejemplo: migrar de AWS a OCI
cd terraform/environments/prod
# Crear nuevo archivo oci.tf con equivalentes de los modulos AWS
terraform init
terraform plan -var="cloud_provider=oci"
terraform apply
```

### Paso 2 - Migrar datos de almacenamiento

```bash
# S3 (AWS) --> OCI Object Storage
# Herramienta: rclone (soporta ambos providers)
rclone sync s3:govtech-documents oci:govtech-documents

# RDS PostgreSQL --> OCI Database Service (PostgreSQL compatible)
pg_dump -h <rds-endpoint> govtech_prod | \
  psql -h <oci-db-endpoint> govtech_prod
```

### Paso 3 - Implementar los 4 servicios del proveedor destino

Crear los 4 archivos en `src/services/providers/oci/` siguiendo el contrato de interfaces de esta seccion. El esqueleto de OCI Storage de arriba es la plantilla a seguir.

### Paso 4 - Activar el proveedor en la Factory

En `src/services/factory.js`, descomentar el bloque de OCI (4 lineas de import + el objeto `oci` en PROVIDERS).

### Paso 5 - Probar en staging

```bash
CLOUD_PROVIDER=oci docker-compose up backend
# Ejecutar suite de tests
npm test
```

### Paso 6 - Cambiar variable en produccion

```bash
# Rollout gradual con blue-green
kubectl set env deployment/govtech-backend CLOUD_PROVIDER=oci
kubectl rollout status deployment/govtech-backend
```

---

## Datos que NO cambian al migrar

- Codigo de la aplicacion (Node.js / React)
- Esquema de base de datos PostgreSQL
- Manifiestos Kubernetes (salvo los storage classes)
- Pipelines CI/CD (solo cambia el registry de destino)
- Politicas de seguridad y compliance

## Datos que SI cambian al migrar

- Variables de entorno (endpoint, region, credenciales)
- Politicas IAM (cada cloud tiene su modelo)
- Configuracion del Ingress (ALB en AWS, Cloud Load Balancing en GCP, etc.)
- Storage classes de Kubernetes (gp3 en AWS, pd-ssd en GCP, etc.)

---

**Estado actual**: La estructura del patron Factory + Interfaces esta disenada y documentada. AWS es el proveedor de referencia para implementar. OCI, GCP y Azure se implementan siguiendo el contrato de interfaces de este documento.
