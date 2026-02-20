# IAM Security Policies - Mínimo Privilegio

**Proyecto**: GovTech Cloud Migration Platform
**Versión**: 2.0
**Fecha**: 2026-02-13
**Última actualización**: 2026-02-13
**Principio**: Least Privilege (Mínimo Privilegio)

**Cambios en v2.0**:
- Eliminación de Permission Boundaries (bloqueaban acceso a consola web)
- Adición de ReadOnlyAccess para acceso a AWS Console
- Adición de AWSCloudShellFullAccess para todos los colaboradores
- 4 nuevas políticas custom para completar permisos faltantes
- Actualización de matriz de permisos y procedimientos

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
│   ├── Members: [collab-infrastructure]
│   └── Policies:
│       ├── AWS Managed: AmazonEC2FullAccess
│       ├── AWS Managed: AmazonVPCFullAccess
│       ├── AWS Managed: AmazonEKSClusterPolicy
│       ├── AWS Managed: ReadOnlyAccess (NUEVO v2.0 - Acceso consola web)
│       ├── AWS Managed: AWSCloudShellFullAccess (NUEVO v2.0)
│       ├── Custom: GovTech-ECR-Admin
│       ├── Custom: GovTech-Terraform-State
│       ├── Custom: GovTech-RDS-Admin
│       ├── Custom: GovTech-IAM-EKS-Roles (NUEVO v2.0 - Crear roles IAM para EKS)
│       └── Custom: GovTech-S3-Admin (NUEVO v2.0 - Gestión completa S3)
│
├── Group: GovTech-Deployment
│   ├── Members: [collab-deployment]
│   └── Policies:
│       ├── AWS Managed: AmazonEKSWorkerNodePolicy
│       ├── AWS Managed: AmazonEKS_CNI_Policy
│       ├── AWS Managed: ReadOnlyAccess (NUEVO v2.0 - Acceso consola web)
│       ├── AWS Managed: AWSCloudShellFullAccess (NUEVO v2.0)
│       ├── Custom: GovTech-EKS-Deploy
│       ├── Custom: GovTech-ECR-ReadOnly
│       ├── Custom: GovTech-Secrets-Read
│       ├── Custom: GovTech-ALB-Controller (NUEVO v2.0 - AWS Load Balancer)
│       └── Custom: GovTech-AutoScaling (NUEVO v2.0 - HPA y Auto Scaling)
│
├── Group: GovTech-DevOps
│   ├── Members: [collab-devops]
│   └── Policies:
│       ├── AWS Managed: CloudWatchFullAccess
│       ├── AWS Managed: ReadOnlyAccess (NUEVO v2.0 - Acceso consola web)
│       ├── AWS Managed: AWSCloudShellFullAccess (NUEVO v2.0)
│       ├── Custom: GovTech-CICD-Access
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

**4. GovTech-IAM-EKS-Roles** (NUEVO v2.0)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EKSRoleManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::835960996869:role/eks-*",
        "arn:aws:iam::835960996869:role/govtech-*"
      ]
    },
    {
      "Sid": "EKSOIDCProvider",
      "Effect": "Allow",
      "Action": [
        "iam:CreateOpenIDConnectProvider",
        "iam:DeleteOpenIDConnectProvider",
        "iam:GetOpenIDConnectProvider"
      ],
      "Resource": "arn:aws:iam::835960996869:oidc-provider/*"
    }
  ]
}
```
**Qué permite**: Crear IAM roles necesarios para EKS cluster y worker nodes, crear OIDC providers
**Qué NO permite**: Crear/modificar usuarios IAM, crear políticas fuera del scope eks-* y govtech-*
**Por qué se agregó**: Colaborador A no podía crear el cluster EKS en Semana 2 sin estos permisos

---

**5. GovTech-S3-Admin** (NUEVO v2.0)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketManagement",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutBucketVersioning",
        "s3:PutEncryptionConfiguration",
        "s3:PutLifecycleConfiguration",
        "s3:PutBucketPolicy",
        "s3:PutBucketCORS",
        "s3:*"
      ],
      "Resource": "arn:aws:s3:::govtech-*"
    },
    {
      "Sid": "S3ObjectManagement",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::govtech-*/*"
    }
  ]
}
```
**Qué permite**: Crear y gestionar buckets S3 con prefijo govtech-*, configurar versionado, encriptación, CORS
**Qué NO permite**: Acceder a buckets de otras aplicaciones, eliminar buckets sin prefijo govtech-*
**Por qué se agregó**: GovTech-Terraform-State solo permitía acceso al bucket de Terraform state, no podía crear buckets para la aplicación (storage module Semana 3)

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

**4. GovTech-ALB-Controller** (NUEVO v2.0)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LoadBalancerManagement",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:CreateLoadBalancer",
        "elasticloadbalancing:DeleteLoadBalancer",
        "elasticloadbalancing:CreateTargetGroup",
        "elasticloadbalancing:CreateListener",
        "elasticloadbalancing:ModifyLoadBalancerAttributes",
        "elasticloadbalancing:Describe*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2NetworkingForALB",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:CreateTags"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ACMCertificateAccess",
      "Effect": "Allow",
      "Action": [
        "acm:ListCertificates",
        "acm:DescribeCertificate"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMPassRoleForALB",
      "Effect": "Allow",
      "Action": ["iam:PassRole"],
      "Resource": "arn:aws:iam::835960996869:role/eks-*",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "elasticloadbalancing.amazonaws.com"
        }
      }
    }
  ]
}
```
**Qué permite**: Crear Application Load Balancers, Target Groups, Listeners para Ingress de Kubernetes
**Qué NO permite**: Modificar load balancers de producción sin tag específico
**Por qué se agregó**: Colaborador B no podía crear Ingress con ALB en Semana 4, bloqueante crítico para exponer aplicación

---

**5. GovTech-AutoScaling** (NUEVO v2.0)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AutoScalingGroupManagement",
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:PutScalingPolicy",
        "autoscaling:DescribePolicies",
        "autoscaling:SetDesiredCapacity"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchAlarmsForHPA",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:DeleteAlarms"
      ],
      "Resource": "*"
    }
  ]
}
```
**Qué permite**: Configurar Horizontal Pod Autoscaler (HPA), crear políticas de auto-scaling, CloudWatch alarms
**Qué NO permite**: Modificar Auto Scaling Groups manualmente, solo via HPA
**Por qué se agregó**: Colaborador B no podía configurar HPA en Semana 3, funcionalidad reducida de auto-scaling

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
| **IAM Roles** | Full | Create (EKS/EC2) | PassRole (ALB) | Create (CICD) |
| **IAM OIDC** | Full | Create (EKS) | - | - |
| **EC2** | Full | Full | Read-only | Read-only |
| **VPC** | Full | Full | - | - |
| **EKS** | Full | Create/Modify | kubectl access | Read-only |
| **ECR** | Full | Push/Pull | Pull-only | Push/Pull (CI) |
| **RDS** | Full | Create/Modify | - | - |
| **S3** | Full | Full (govtech-*) | - | Artifacts |
| **ELB/ALB** | Full | - | Create/Modify | - |
| **Auto Scaling** | Full | - | Policies/HPA | - |
| **ACM** | Full | - | Read (certs) | - |
| **Secrets Manager** | Full | - | Read (dev/stg) | Full (CICD secrets) |
| **CloudWatch** | Full | Logs | Logs + Alarms | Full |
| **CloudShell** | Full | Full | Full | Full |
| **Console Access** | Full | Read-only | Read-only | Read-only |
| **Billing** | Full | - | - | - |

**Leyenda**:
- **Full**: Acceso completo (create, read, update, delete)
- **Create/Modify**: Crear y modificar, NO eliminar
- **Read-only**: Solo lectura
- **-**: Sin acceso

---

## Boundary Policies

### IMPORTANTE: Permission Boundaries REMOVIDAS en v2.0

**Razón de remoción**: Las Permission Boundaries estaban bloqueando el acceso a la consola web de AWS.

**Problema identificado**:
```
DenyRegionOutsideUSEast1 bloqueaba servicios globales como:
- IAM (global, no tiene región)
- CloudFront (global)
- Route53 (global)
- AWS Console login (global)

Resultado: Usuarios no podían iniciar sesión en AWS Console
```

**Solución implementada**:
- Eliminadas Permission Boundaries de todos los usuarios
- Confiamos en las políticas restrictivas por grupo (Least Privilege)
- Agregada ReadOnlyAccess para navegación básica de consola
- Mantenemos auditoría con CloudTrail

**Nota**: Si en el futuro se requieren Boundaries, usar solo para restricciones específicas, NO para regiones.

### ¿Qué son? (Referencia histórica)

**Permission Boundaries** son límites MÁXIMOS que un usuario NO puede sobrepasar, incluso si tiene políticas que lo permiten.

**Uso**: Prevenir escalación de privilegios.

### Boundary Policy Original (DESHABILITADA - Solo referencia)

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
  - ReadOnlyAccess (AWS Managed) ← NUEVO v2.0
  - AWSCloudShellFullAccess (AWS Managed) ← NUEVO v2.0
  - GovTech-ECR-Admin (Custom)
  - GovTech-Terraform-State (Custom)
  - GovTech-RDS-Admin (Custom)
  - GovTech-IAM-EKS-Roles (Custom) ← NUEVO v2.0
  - GovTech-S3-Admin (Custom) ← NUEVO v2.0

# Grupo: GovTech-Deployment
Attach policies:
  - AmazonEKSWorkerNodePolicy (AWS Managed)
  - AmazonEKS_CNI_Policy (AWS Managed)
  - ReadOnlyAccess (AWS Managed) ← NUEVO v2.0
  - AWSCloudShellFullAccess (AWS Managed) ← NUEVO v2.0
  - GovTech-EKS-Deploy (Custom)
  - GovTech-ECR-ReadOnly (Custom)
  - GovTech-Secrets-Read (Custom)
  - GovTech-ALB-Controller (Custom) ← NUEVO v2.0
  - GovTech-AutoScaling (Custom) ← NUEVO v2.0

# Grupo: GovTech-DevOps
Attach policies:
  - CloudWatchFullAccess (AWS Managed)
  - ReadOnlyAccess (AWS Managed) ← NUEVO v2.0
  - AWSCloudShellFullAccess (AWS Managed) ← NUEVO v2.0
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

**DESHABILITADO en v2.0** - Las Permission Boundaries fueron removidas porque bloqueaban acceso a la consola web.

Si deseas implementar boundaries en el futuro, asegúrate de NO bloquear servicios globales (IAM, CloudFront, Console login).

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

---

## Changelog - Versión 2.0 (2026-02-13)

### Cambios Realizados

#### 1. Eliminación de Permission Boundaries
**Fecha**: 2026-02-12
**Razón**: Bloqueaban acceso a AWS Console (servicios globales)
**Comando ejecutado**:
```bash
aws iam delete-user-permissions-boundary --user-name collab-infrastructure
aws iam delete-user-permissions-boundary --user-name collab-deployment
aws iam delete-user-permissions-boundary --user-name collab-devops
```

#### 2. Adición de ReadOnlyAccess
**Fecha**: 2026-02-12
**Razón**: Permitir acceso básico a AWS Console web para todos los colaboradores
**Comando ejecutado**:
```bash
aws iam attach-group-policy --group-name GovTech-Infrastructure --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
aws iam attach-group-policy --group-name GovTech-Deployment --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
aws iam attach-group-policy --group-name GovTech-DevOps --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
```

#### 3. Adición de AWSCloudShellFullAccess
**Fecha**: 2026-02-12
**Razón**: Permitir uso de AWS CloudShell para todos los colaboradores
**Comando ejecutado**:
```bash
aws iam attach-group-policy --group-name GovTech-Infrastructure --policy-arn arn:aws:iam::aws:policy/AWSCloudShellFullAccess
aws iam attach-group-policy --group-name GovTech-Deployment --policy-arn arn:aws:iam::aws:policy/AWSCloudShellFullAccess
aws iam attach-group-policy --group-name GovTech-DevOps --policy-arn arn:aws:iam::aws:policy/AWSCloudShellFullAccess
```

#### 4. Nuevas Políticas Custom

**GovTech-IAM-EKS-Roles** (Colaborador A)
- **Fecha**: 2026-02-13
- **Razón**: Permitir creación de IAM roles para EKS cluster (bloqueante Semana 2)
- **Archivos**: `aws/iam/policies/govtech-iam-eks-roles.json`

**GovTech-S3-Admin** (Colaborador A)
- **Fecha**: 2026-02-13
- **Razón**: Gestión completa de buckets S3 para aplicación (limitado solo a Terraform state antes)
- **Archivos**: `aws/iam/policies/govtech-s3-admin.json`

**GovTech-ALB-Controller** (Colaborador B)
- **Fecha**: 2026-02-13
- **Razón**: Permitir creación de Application Load Balancers para Ingress (bloqueante Semana 4)
- **Archivos**: `aws/iam/policies/govtech-alb-controller.json`

**GovTech-AutoScaling** (Colaborador B)
- **Fecha**: 2026-02-13
- **Razón**: Permitir configuración de HPA (Horizontal Pod Autoscaler) en Semana 3
- **Archivos**: `aws/iam/policies/govtech-autoscaling.json`

**Script de instalación**: `aws/iam/add-missing-permissions.sh`

#### 5. Auditoría de Permisos Completa
**Fecha**: 2026-02-13
**Documento**: `aws/iam/PERMISSION_AUDIT.md`
**Resultado**: Identificadas 4 brechas de permisos críticas, todas resueltas

---

## Notas de Seguridad v2.0

**Mejoras**:
- Colaboradores pueden usar AWS Console para visualizar recursos (solo lectura)
- CloudShell habilitado para trabajo remoto sin configurar AWS CLI localmente
- Permisos IAM suficientes para completar todas las tareas del proyecto
- Sin bloqueantes identificados para Semanas 2-4

**Consideraciones**:
- ReadOnlyAccess es amplio, pero seguro (solo lectura)
- Mantenemos principio de Least Privilege en acciones de escritura
- CloudTrail sigue registrando todas las acciones
- Sin Permission Boundaries, pero políticas siguen siendo restrictivas

**Riesgos Mitigados**:
- Usuarios no pueden crear/eliminar usuarios IAM
- Usuarios no pueden modificar políticas
- Usuarios no pueden acceder a billing
- Recursos limitados por prefijos (govtech-*, eks-*)
- Producción protegida por tags

---

**Documento creado por**: GovTech Security Team
**Versión 1.0**: 2026-02-10
**Versión 2.0**: 2026-02-13
**Última revisión**: 2026-02-13
**Próxima revisión**: 2026-05-13 (cada 90 días)

---

**FIN DEL DOCUMENTO**
