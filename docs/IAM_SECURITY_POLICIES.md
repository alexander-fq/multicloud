# IAM Security Policies - Mínimo Privilegio

**Proyecto**: GovTech Cloud Migration Platform
**Versión**: 1.0
**Fecha**: 2026-02-10
**Principio**: Least Privilege (Mínimo Privilegio)

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Roles del Proyecto](#roles-del-proyecto)
3. [Estructura de Grupos IAM](#estructura-de-grupos-iam)
4. [Políticas por Colaborador](#políticas-por-colaborador)
5. [Matriz de Permisos](#matriz-de-permisos)
6. [Políticas JSON Detalladas](#políticas-json-detalladas)
7. [Boundary Policies](#boundary-policies)
8. [Auditoría y Compliance](#auditoría-y-compliance)
9. [Procedimientos de Implementación](#procedimientos-de-implementación)

---

## Introducción

### Principio de Mínimo Privilegio

**Definición**: Cada usuario debe tener SOLO los permisos necesarios para realizar su trabajo, nada más.

**Objetivos**:
- Reducir superficie de ataque
- Limitar daño en caso de credenciales comprometidas
- Cumplir con mejores prácticas de seguridad
- Facilitar auditoría y compliance

**Estrategia**:
```
1. Identificar tareas de cada colaborador
2. Mapear tareas a permisos AWS específicos
3. Crear políticas custom restrictivas
4. Agrupar usuarios por función
5. Implementar boundaries (límites no superables)
6. Auditar accesos regularmente
```

---

## Roles del Proyecto

### 1. Root Account (Administrador Principal)

**Función**: Administrador máximo del proyecto AWS

**Responsabilidades**:
- Gestión de usuarios IAM (crear, modificar, eliminar)
- Gestión de grupos y políticas
- Configuración de billing y costos
- Gestión de recursos críticos de producción
- Auditoría de seguridad
- Respuesta a incidentes
- Backup y disaster recovery

**Permisos**: AdministratorAccess (acceso total)

**Restricciones**:
- NO usar para trabajo diario
- Solo usar para tareas administrativas
- MFA obligatorio
- CloudTrail habilitado para auditoría

---

### 2. Colaborador A: Infrastructure Team

**Función**: Docker + Terraform (Infraestructura como Código)

**Tareas** (según INFRASTRUCTURE_TASKS.md):
- Semana 1: Dockerizar backend y frontend, crear docker-compose, configurar ECR
- Semana 2-3: Crear módulos Terraform (networking, EKS, database, storage)
- Semana 4: Configurar ambientes (dev, staging, prod) con Terraform

**Necesita acceso a**:
- Amazon ECR (crear repositorios, subir imágenes)
- Amazon VPC (crear VPCs, subnets, gateways, security groups)
- Amazon EKS (crear clusters, node groups)
- Amazon RDS (crear instancias PostgreSQL)
- Amazon S3 (crear buckets, gestionar Terraform state)
- IAM (crear roles para EKS, EC2, pero NO gestionar usuarios)
- CloudWatch (logs de Terraform)

**NO necesita**:
- Acceso a secretos de producción
- Modificar usuarios IAM
- Eliminar recursos de producción sin aprobación
- Acceso a billing

---

### 3. Colaborador B: Deployment Team

**Función**: Kubernetes + Deployment (Orquestación)

**Tareas** (según INFRASTRUCTURE_TASKS.md):
- Semana 1: Crear manifiestos base (namespace, configmap, secrets, PVC)
- Semana 2: Crear deployments de backend/frontend, services
- Semana 3: Configurar database en K8s, auto-scaling (HPA)
- Semana 4: Configurar ingress, testing en EKS

**Necesita acceso a**:
- Amazon EKS (acceso kubectl, aplicar manifests)
- Amazon ECR (descargar imágenes, read-only)
- Amazon EBS/EFS (crear volumes para PVCs)
- AWS Secrets Manager (leer secrets, NO modificar prod)
- CloudWatch (ver logs de pods)

**NO necesita**:
- Crear infraestructura base (VPC, subnets)
- Modificar configuración de EKS cluster
- Eliminar recursos de producción
- Acceso a Terraform state

---

### 4. Colaborador C: DevOps Team

**Función**: CI/CD + Monitoring (Automatización y Observabilidad)

**Tareas** (según INFRASTRUCTURE_TASKS.md):
- Semana 1: Crear pipelines CI (GitHub Actions, build, test, push)
- Semana 2: Crear pipelines CD (deployment automation, blue-green)
- Semana 3: Configurar monitoring (CloudWatch, Prometheus, Grafana)
- Semana 4: Documentación, tests end-to-end

**Necesita acceso a**:
- Amazon ECR (push/pull images desde CI/CD)
- Amazon EKS (deploy desde CI/CD)
- CloudWatch (crear dashboards, alarmas, log groups)
- AWS Secrets Manager (gestionar secrets para CI/CD)
- IAM (crear roles para GitHub Actions, NO usuarios)
- S3 (artifacts de build)

**NO necesita**:
- Crear infraestructura base
- Acceso SSH a nodes
- Modificar VPC/networking
- Eliminar recursos de producción manualmente

---

## Estructura de Grupos IAM

```
AWS Account: 835960996869
│
├── Group: GovTech-Infrastructure
│   ├── Members: [Colaborador A]
│   └── Policies:
│       ├── AWS Managed: AmazonEC2FullAccess
│       ├── AWS Managed: AmazonVPCFullAccess
│       ├── AWS Managed: AmazonEKSClusterPolicy
│       ├── Custom: GovTech-ECR-Admin
│       ├── Custom: GovTech-Terraform-State
│       └── Custom: GovTech-RDS-Admin
│
├── Group: GovTech-Deployment
│   ├── Members: [Colaborador B]
│   └── Policies:
│       ├── AWS Managed: AmazonEKSWorkerNodePolicy
│       ├── AWS Managed: AmazonEKS_CNI_Policy
│       ├── Custom: GovTech-EKS-Deploy
│       ├── Custom: GovTech-ECR-ReadOnly
│       └── Custom: GovTech-Secrets-Read
│
├── Group: GovTech-DevOps
│   ├── Members: [Colaborador C]
│   └── Policies:
│       ├── AWS Managed: CloudWatchFullAccess
│       ├── Custom: GovTech-CICD-Access
│       ├── Custom: GovTech-ECR-Push
│       └── Custom: GovTech-Monitoring
│
└── User: root-admin
    └── Policy: AdministratorAccess
```

---

## Políticas por Colaborador

### Colaborador A: Infrastructure Team

#### AWS Managed Policies

| Política | Propósito | Recursos |
|----------|-----------|----------|
| AmazonEC2FullAccess | Crear instancias, security groups | EC2, VPC |
| AmazonVPCFullAccess | Crear VPCs, subnets, gateways | VPC |
| AmazonEKSClusterPolicy | Crear y gestionar clusters EKS | EKS |

#### Custom Policies

**1. GovTech-ECR-Admin**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRFullAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DeleteRepository",
        "ecr:DescribeRepositories",
        "ecr:PutImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    }
  ]
}
```
**Qué permite**: Crear repositorios ECR, subir imágenes Docker
**Qué NO permite**: Eliminar imágenes de producción (requiere approval)

---

**2. GovTech-Terraform-State**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformStateAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::govtech-terraform-state",
        "arn:aws:s3:::govtech-terraform-state/*"
      ]
    },
    {
      "Sid": "TerraformStateLocking",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/terraform-locks"
    }
  ]
}
```
**Qué permite**: Leer/escribir Terraform state, usar locking
**Qué NO permite**: Eliminar bucket de state, modificar otros buckets

---

**3. GovTech-RDS-Admin**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RDSManagement",
      "Effect": "Allow",
      "Action": [
        "rds:CreateDBInstance",
        "rds:ModifyDBInstance",
        "rds:DescribeDBInstances",
        "rds:CreateDBSubnetGroup",
        "rds:ModifyDBSubnetGroup"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    },
    {
      "Sid": "RDSDeletePrevention",
      "Effect": "Deny",
      "Action": [
        "rds:DeleteDBInstance"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "rds:db-tag/Environment": "production"
        }
      }
    }
  ]
}
```
**Qué permite**: Crear/modificar instancias RDS en us-east-1
**Qué NO permite**: Eliminar bases de datos de producción (protegidas por tag)

---

### Colaborador B: Deployment Team

#### Custom Policies

**1. GovTech-EKS-Deploy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EKSClusterAccess",
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters",
        "eks:AccessKubernetesApi"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EKSNodeGroupRead",
      "Effect": "Allow",
      "Action": [
        "eks:DescribeNodegroup",
        "eks:ListNodegroups"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EBSVolumeManagement",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVolume",
        "ec2:AttachVolume",
        "ec2:DetachVolume",
        "ec2:DescribeVolumes"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/Kubernetes": "owned"
        }
      }
    }
  ]
}
```
**Qué permite**: Acceder a EKS con kubectl, crear volumes para PVCs
**Qué NO permite**: Modificar configuración del cluster, crear node groups

---

**2. GovTech-ECR-ReadOnly**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRPullOnly",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:DescribeRepositories",
        "ecr:ListImages"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DenyECRPush",
      "Effect": "Deny",
      "Action": [
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    }
  ]
}
```
**Qué permite**: Descargar imágenes Docker desde ECR (pull)
**Qué NO permite**: Subir imágenes (push), eliminar imágenes

---

**3. GovTech-Secrets-Read**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecretsReadDev",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:govtech/dev/*"
    },
    {
      "Sid": "SecretsReadStaging",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:govtech/staging/*"
    },
    {
      "Sid": "DenyProdSecrets",
      "Effect": "Deny",
      "Action": [
        "secretsmanager:*"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:govtech/prod/*"
    }
  ]
}
```
**Qué permite**: Leer secrets de dev y staging
**Qué NO permite**: Leer secrets de producción, modificar secrets

---

### Colaborador C: DevOps Team

#### Custom Policies

**1. GovTech-CICD-Access**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GitHubActionsRole",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::*:role/GovTech-GitHubActions-*",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "ecs-tasks.amazonaws.com"
        }
      }
    },
    {
      "Sid": "SecretsManagerCICD",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:CreateSecret",
        "secretsmanager:UpdateSecret",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:govtech/cicd/*"
    },
    {
      "Sid": "S3ArtifactsAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::govtech-build-artifacts",
        "arn:aws:s3:::govtech-build-artifacts/*"
      ]
    }
  ]
}
```
**Qué permite**: Crear roles para GitHub Actions, gestionar secrets de CI/CD, almacenar artifacts
**Qué NO permite**: Crear usuarios IAM, modificar políticas existentes

---

**2. GovTech-Monitoring**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchFullAccess",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:*",
        "logs:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2ReadForMonitoring",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EKSReadForMonitoring",
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    }
  ]
}
```
**Qué permite**: Crear dashboards, alarmas, log groups en CloudWatch
**Qué NO permite**: Modificar recursos EC2/EKS (solo lectura)

---

## Matriz de Permisos

| Servicio AWS | Root | Colab A (Infra) | Colab B (Deploy) | Colab C (DevOps) |
|--------------|------|-----------------|------------------|------------------|
| **IAM Users** | Full | - | - | - |
| **IAM Roles** | Full | Create (EKS) | - | Create (CICD) |
| **EC2** | Full | Full | Read-only | Read-only |
| **VPC** | Full | Full | - | - |
| **EKS** | Full | Create/Modify | kubectl access | Read-only |
| **ECR** | Full | Push/Pull | Pull-only | Push/Pull (CI) |
| **RDS** | Full | Create/Modify | - | - |
| **S3** | Full | Terraform state | - | Artifacts |
| **Secrets Manager** | Full | - | Read (dev/stg) | Full (CICD secrets) |
| **CloudWatch** | Full | Logs | Logs | Full |
| **Billing** | Full | - | - | - |

**Leyenda**:
- **Full**: Acceso completo (create, read, update, delete)
- **Create/Modify**: Crear y modificar, NO eliminar
- **Read-only**: Solo lectura
- **-**: Sin acceso

---

## Boundary Policies

### ¿Qué son?

**Permission Boundaries** son límites MÁXIMOS que un usuario NO puede sobrepasar, incluso si tiene políticas que lo permiten.

**Uso**: Prevenir escalación de privilegios.

### Boundary Policy para Todos los Colaboradores

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowedServices",
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "eks:*",
        "ecr:*",
        "rds:*",
        "s3:*",
        "vpc:*",
        "cloudwatch:*",
        "logs:*",
        "secretsmanager:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DenyDangerousActions",
      "Effect": "Deny",
      "Action": [
        "iam:CreateUser",
        "iam:DeleteUser",
        "iam:CreateAccessKey",
        "iam:DeleteAccessKey",
        "iam:UpdateUser",
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "organizations:*",
        "account:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DenyRegionOutsideUSEast1",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    },
    {
      "Sid": "DenyRootAccountChanges",
      "Effect": "Deny",
      "Action": [
        "iam:DeleteAccountPasswordPolicy",
        "iam:UpdateAccountPasswordPolicy",
        "iam:DeleteAccountAlias"
      ],
      "Resource": "*"
    }
  ]
}
```

**Qué previene**:
- Crear/eliminar usuarios IAM (solo root puede)
- Trabajar fuera de us-east-1 (control de costos)
- Modificar configuración de la cuenta root
- Modificar AWS Organizations

---

## Auditoría y Compliance

### CloudTrail (Logging)

**Configuración obligatoria**:
```
CloudTrail habilitado para TODAS las acciones:
- Management events: SI
- Data events: SI (S3, Lambda)
- Retention: 90 días mínimo
- Log file validation: HABILITADO
- Multi-region: HABILITADO
```

**Qué se registra**:
- Quién (usuario IAM)
- Qué (acción ejecutada)
- Cuándo (timestamp)
- Desde dónde (IP address)
- Resultado (exitoso o fallido)

**Alertas automáticas** (CloudWatch Events):
```
- Usuario crea otro usuario → Alerta a root
- Eliminación de recursos de producción → Alerta a root
- Acceso denegado repetido (5+ veces) → Posible ataque
- Cambios en políticas IAM → Alerta a root
```

---

### Revisión de Accesos

**Frecuencia**: Mensual

**Checklist**:
- [ ] Revisar usuarios activos vs inactivos (eliminar no usados)
- [ ] Revisar Access Keys (rotar cada 90 días)
- [ ] Revisar políticas adjuntas a grupos
- [ ] Verificar que MFA esté habilitado
- [ ] Revisar logs de CloudTrail para actividad anómala
- [ ] Verificar que boundary policies estén aplicadas
- [ ] Revisar permisos de recursos (S3 buckets públicos)

**Herramienta**: AWS IAM Access Analyzer

---

### Compliance

**Estándares aplicados**:
- **Least Privilege**: Solo permisos necesarios
- **Separation of Duties**: Funciones separadas por colaborador
- **Defense in Depth**: Múltiples capas (policies + boundaries + MFA)
- **Audit Trail**: CloudTrail registra todo
- **Encryption**: Secrets encriptados (Secrets Manager, KMS)

---

## Procedimientos de Implementación

### Paso 1: Crear Grupos IAM

```bash
# Como root account en AWS Console

1. IAM → Groups → Create group
   Name: GovTech-Infrastructure

2. IAM → Groups → Create group
   Name: GovTech-Deployment

3. IAM → Groups → Create group
   Name: GovTech-DevOps
```

---

### Paso 2: Crear Políticas Custom

```bash
# Como root account

1. IAM → Policies → Create policy
   Name: GovTech-ECR-Admin
   JSON: [copiar JSON de arriba]

2. Repeat para todas las custom policies:
   - GovTech-Terraform-State
   - GovTech-RDS-Admin
   - GovTech-EKS-Deploy
   - GovTech-ECR-ReadOnly
   - GovTech-Secrets-Read
   - GovTech-CICD-Access
   - GovTech-Monitoring
```

---

### Paso 3: Adjuntar Políticas a Grupos

```bash
# Grupo: GovTech-Infrastructure
Attach policies:
  - AmazonEC2FullAccess (AWS Managed)
  - AmazonVPCFullAccess (AWS Managed)
  - AmazonEKSClusterPolicy (AWS Managed)
  - GovTech-ECR-Admin (Custom)
  - GovTech-Terraform-State (Custom)
  - GovTech-RDS-Admin (Custom)

# Grupo: GovTech-Deployment
Attach policies:
  - AmazonEKSWorkerNodePolicy (AWS Managed)
  - AmazonEKS_CNI_Policy (AWS Managed)
  - GovTech-EKS-Deploy (Custom)
  - GovTech-ECR-ReadOnly (Custom)
  - GovTech-Secrets-Read (Custom)

# Grupo: GovTech-DevOps
Attach policies:
  - CloudWatchFullAccess (AWS Managed)
  - GovTech-CICD-Access (Custom)
  - GovTech-Monitoring (Custom)
```

---

### Paso 4: Crear Usuarios y Asignar a Grupos

```bash
# Crear usuarios
1. IAM → Users → Add users
   Username: collab-infrastructure
   Access: Programmatic + Console
   Group: GovTech-Infrastructure

2. Repeat:
   Username: collab-deployment
   Group: GovTech-Deployment

3. Repeat:
   Username: collab-devops
   Group: GovTech-DevOps
```

---

### Paso 5: Aplicar Boundary Policy

```bash
# Para cada usuario creado
1. IAM → Users → [username]
2. Permissions tab → Set permissions boundary
3. Select: GovTech-PermissionBoundary
4. Save
```

---

### Paso 6: Habilitar MFA

```bash
# Para cada usuario
1. IAM → Users → [username]
2. Security credentials tab
3. Assigned MFA device → Manage
4. Virtual MFA device (Google Authenticator)
5. Scan QR code
6. Enter two consecutive codes
```

---

### Paso 7: Configurar CloudTrail

```bash
1. CloudTrail → Create trail
   Name: govtech-audit-trail
   Apply to all regions: YES
   Management events: Read/Write
   Data events: S3 (all buckets)
   S3 bucket: govtech-cloudtrail-logs
   Log file validation: ENABLED

2. CloudWatch Events → Create rule
   Event pattern: IAM changes
   Target: SNS topic → Email to root admin
```

---

### Paso 8: Distribuir Credenciales

```bash
# Generar credenciales para cada colaborador
1. IAM → Users → [username] → Security credentials
2. Create access key
3. Download .csv
4. Enviar de forma segura (encrypted email, 1Password, etc.)

# Instruir a cada colaborador:
aws configure
AWS Access Key ID: [su key]
AWS Secret Access Key: [su secret]
Default region: us-east-1
```

---

## Testing de Permisos

### Test 1: Colaborador A (Infrastructure)

```bash
# Debe funcionar
aws ecr create-repository --repository-name test-repo
aws vpc create-vpc --cidr-block 10.0.0.0/16
terraform init
terraform plan

# Debe fallar
aws iam create-user --user-name hacker
# Output: AccessDenied (boundary policy lo previene)

aws rds delete-db-instance --db-instance-identifier govtech-prod
# Output: AccessDenied (producción protegida)
```

---

### Test 2: Colaborador B (Deployment)

```bash
# Debe funcionar
aws eks update-kubeconfig --name govtech-dev
kubectl get pods -n govtech-dev
kubectl apply -f deployment.yaml

# Debe fallar
aws ecr create-repository --repository-name hack-repo
# Output: AccessDenied (no tiene permisos de ECR admin)

aws secretsmanager get-secret-value --secret-id govtech/prod/db-password
# Output: AccessDenied (producción bloqueada)
```

---

### Test 3: Colaborador C (DevOps)

```bash
# Debe funcionar
aws cloudwatch put-metric-alarm --alarm-name test-alarm
aws logs create-log-group --log-group-name /aws/eks/govtech
aws secretsmanager create-secret --name govtech/cicd/test

# Debe fallar
aws ec2 create-vpc --cidr-block 10.0.0.0/16
# Output: AccessDenied (no puede crear infraestructura)

aws iam create-user --user-name hacker
# Output: AccessDenied (boundary policy)
```

---

## Resumen Ejecutivo

### Principios Implementados

| Principio | Implementación |
|-----------|----------------|
| **Least Privilege** | Cada colaborador solo tiene permisos para SU trabajo |
| **Separation of Duties** | Infraestructura, Deployment y DevOps separados |
| **Defense in Depth** | Políticas + Boundaries + MFA + CloudTrail |
| **Fail Secure** | Deny por defecto, Allow explícito |
| **Auditability** | CloudTrail registra todas las acciones |

---

### Costos de Seguridad

| Servicio | Costo/mes | Propósito |
|----------|-----------|-----------|
| CloudTrail | $2-5 | Logging de auditoría |
| AWS Secrets Manager | $1-3 | Almacenar secrets |
| CloudWatch Logs | $3-10 | Logs de aplicación |
| IAM | GRATIS | Gestión de permisos |
| **Total** | **~$6-18/mes** | Seguridad completa |

---

### Beneficios

1. **Reducción de riesgo**: Credenciales comprometidas causan daño limitado
2. **Compliance**: Cumple con estándares de seguridad
3. **Auditoría**: Saber quién hizo qué y cuándo
4. **Escalabilidad**: Fácil agregar nuevos colaboradores
5. **Reversibilidad**: Fácil revocar permisos si es necesario

---

## Apéndices

### Apéndice A: Comandos Útiles

```bash
# Ver políticas de un grupo
aws iam list-attached-group-policies --group-name GovTech-Infrastructure

# Ver usuarios en un grupo
aws iam get-group --group-name GovTech-Infrastructure

# Simular política (ver si una acción está permitida)
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:user/collab-deployment \
  --action-names eks:DescribeCluster

# Ver access keys de un usuario
aws iam list-access-keys --user-name collab-infrastructure

# Ver eventos de CloudTrail (últimas acciones)
aws cloudtrail lookup-events --max-results 10
```

---

### Apéndice B: Escalación de Permisos

Si un colaborador necesita permisos temporales adicionales:

```bash
# Opción 1: Crear rol temporal (recomendado)
aws iam create-role --role-name TempAdminAccess
aws iam attach-role-policy --role-name TempAdminAccess --policy-arn ...
aws sts assume-role --role-arn arn:aws:iam::...:role/TempAdminAccess

# Opción 2: Agregar a grupo temporal (menos recomendado)
aws iam add-user-to-group --user-name collab-infrastructure --group-name TempAdmins
# Remover después: aws iam remove-user-from-group ...
```

**Proceso**:
1. Colaborador solicita permisos adicionales (ticket/email)
2. Root aprueba y crea rol temporal
3. Colaborador asume rol con `aws sts assume-role`
4. Permisos expiran automáticamente después de 1 hora
5. Root revoca rol cuando ya no es necesario

---

### Apéndice C: Incident Response

**Si un usuario es comprometido**:

```bash
# 1. Deshabilitar access keys inmediatamente
aws iam update-access-key --access-key-id AKIA... --status Inactive --user-name collab-infrastructure

# 2. Revisar CloudTrail para acciones sospechosas
aws cloudtrail lookup-events --lookup-attributes AttributeKey=Username,AttributeValue=collab-infrastructure

# 3. Revocar sesiones activas
aws iam delete-login-profile --user-name collab-infrastructure

# 4. Crear nuevas access keys
aws iam create-access-key --user-name collab-infrastructure

# 5. Notificar al colaborador y cambiar credenciales
```

---

**Documento creado por**: GovTech Security Team
**Revisado por**: Root Administrator
**Próxima revisión**: 2026-05-10 (cada 90 días)

---

**FIN DEL DOCUMENTO**
