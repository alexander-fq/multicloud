# IAM Security Policies - GovTech Cloud Migration Platform

**Proyecto**: GovTech Cloud Migration Platform
**Version**: 3.0
**Fecha**: 2026-02-23
**Principio**: Minimo Privilegio con Jerarquia Funcional de 3 Niveles

---

## Tabla de Contenidos

1. [Principio de Minimo Privilegio](#principio-de-minimo-privilegio)
2. [Jerarquia Funcional](#jerarquia-funcional)
3. [Estructura de Grupos IAM](#estructura-de-grupos-iam)
4. [Politicas por Grupo](#politicas-por-grupo)
5. [Politicas JSON Detalladas](#politicas-json-detalladas)
6. [Auditoria y Compliance](#auditoria-y-compliance)
7. [Procedimientos de Implementacion](#procedimientos-de-implementacion)

---

## Principio de Minimo Privilegio

**Definicion**: Cada usuario recibe SOLO los permisos necesarios para su funcion actual, nada mas.

**Por que es critico en Cloud**:
En una infraestructura on-premise, el acceso fisico es la barrera de seguridad principal. En AWS, cualquier credencial comprometida (access key, session token) puede ejecutar operaciones destructivas desde cualquier lugar del mundo en segundos. El minimo privilegio limita el radio de dano a un solo dominio funcional.

**Estrategia aplicada**:
```
1. Identificar dominios funcionales (red, contenedores, base de datos, etc.)
2. Crear un grupo IAM por dominio
3. Asignar solo los permisos necesarios para ese dominio
4. Organizar grupos por nivel de riesgo (3 niveles)
5. Un usuario pertenece a los grupos que corresponden a su funcion
6. Auditar accesos regularmente via CloudTrail
```

---

## Jerarquia Funcional

AWS IAM no tiene jerarquia nativa entre grupos. La jerarquia descrita aqui es **funcional y de riesgo**: define quien tiene acceso a que, con que nivel de supervision, y que proceso de aprobacion requiere.

```
                   [ govtech-admin ]
                   Operador principal
                   Pertenece a todos los grupos
                           |
       +-------------------+-------------------+
       |                   |                   |
  NIVEL 1             NIVEL 2             NIVEL 3
  Critico            Operacional          Solo lectura
       |                   |                   |
  Network-Admin       Container-Deploy    Secrets-ReadOnly
  EKS-Admin           ALB-Operator        Monitor-ReadOnly
  Database-Admin      CICD-Operator       Security-Auditor
  Terraform-Operator
```

### Nivel 1 - Critico

**Grupos**: GovTech-Network-Admin, GovTech-EKS-Admin, GovTech-Database-Admin, GovTech-Terraform-Operator

**Por que es critico**:
Un actor malicioso con acceso a cualquiera de estos grupos puede destruir infraestructura completa:
- Eliminar la VPC y dejar toda la plataforma sin red
- Borrar el cluster EKS y todos sus workloads
- Eliminar o corromper la base de datos de produccion
- Ejecutar `terraform destroy` y borrar todo en minutos

**Reglas de acceso**:
- MFA obligatorio (preferiblemente hardware: YubiKey)
- Acceso temporal recomendado (maximo 8 horas por sesion)
- Requiere aprobacion de un segundo responsable en equipos
- Toda accion registrada en CloudTrail con alerta inmediata
- Revision semanal de quien tiene acceso activo

### Nivel 2 - Operacional

**Grupos**: GovTech-Container-Deploy, GovTech-ALB-Operator, GovTech-CICD-Operator

**Por que es operacional**:
Un actor malicioso puede comprometer la aplicacion pero no destruir infraestructura directamente:
- Desplegar una imagen Docker maliciosa en produccion
- Modificar reglas del ALB para redirigir trafico
- Alterar pipelines de CI/CD para ejecutar codigo arbitrario

**Reglas de acceso**:
- MFA obligatorio
- Acceso permanente para operaciones diarias
- Revision mensual de accesos activos

### Nivel 3 - Solo Lectura

**Grupos**: GovTech-Secrets-ReadOnly, GovTech-Monitor-ReadOnly, GovTech-Security-Auditor

**Por que es el menos riesgoso**:
Un actor malicioso solo puede exfiltrar informacion, no modificar ni eliminar:
- Leer credenciales en Secrets Manager
- Ver metricas, logs y alertas de CloudWatch
- Leer reportes de CloudTrail y GuardDuty

**Reglas de acceso**:
- MFA recomendado
- Acceso permanente para roles de monitoreo
- Revision trimestral de accesos activos

---

## Estructura de Grupos IAM

```
Cuenta AWS: 835960996869
Region: us-east-1

--- NIVEL 1 CRITICO ---

Grupo: GovTech-Network-Admin
Politicas AWS Managed:
  - AmazonEC2FullAccess
  - AmazonVPCFullAccess
Politicas Custom:
  (ninguna - los managed policies cubren el dominio)

Grupo: GovTech-EKS-Admin
Politicas AWS Managed:
  - AmazonEKSClusterPolicy
Politicas Custom:
  - GovTech-IAM-EKS-Roles

Grupo: GovTech-Database-Admin
Politicas Custom:
  - GovTech-RDS-Admin

Grupo: GovTech-Terraform-Operator
Politicas Custom:
  - GovTech-Terraform-State
  - GovTech-S3-Admin

--- NIVEL 2 OPERACIONAL ---

Grupo: GovTech-Container-Deploy
Politicas Custom:
  - GovTech-ECR-Admin
  - GovTech-EKS-Deploy

Grupo: GovTech-ALB-Operator
Politicas Custom:
  - GovTech-ALB-Controller
  - GovTech-AutoScaling

Grupo: GovTech-CICD-Operator
Politicas Custom:
  - GovTech-CICD-Access
  - GovTech-ECR-ReadOnly

--- NIVEL 3 SOLO LECTURA ---

Grupo: GovTech-Secrets-ReadOnly
Politicas Custom:
  - GovTech-Secrets-Read

Grupo: GovTech-Monitor-ReadOnly
Politicas AWS Managed:
  - CloudWatchReadOnlyAccess
Politicas Custom:
  - GovTech-Monitoring

Grupo: GovTech-Security-Auditor
Politicas AWS Managed:
  - SecurityAudit
Politicas Custom:
  - GovTech-Security-Auditor

--- USUARIOS ---

Usuario: govtech-admin
  Grupos: todos los grupos funcionales (operador principal)

Nota sobre escalabilidad:
  La estructura de grupos esta disenada para escalar sin modificaciones.
  Incorporar un nuevo usuario es tan simple como crearlo y asignarlo
  a los grupos que correspondan a su funcion. No se requiere crear
  nuevas politicas ni modificar las existentes.
```

---

## Politicas por Grupo

### GovTech-Network-Admin

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| AmazonEC2FullAccess | EC2 | Crear, modificar, eliminar instancias y security groups |
| AmazonVPCFullAccess | VPC | Crear VPCs, subnets, Internet Gateways, NAT Gateways, Route Tables |

**Cuando asignarlo**: Cambios de arquitectura de red, nuevas subnets, modificacion de firewall (security groups).

---

### GovTech-EKS-Admin

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| AmazonEKSClusterPolicy | EKS | Crear y gestionar clusters, node groups, versiones de Kubernetes |
| GovTech-IAM-EKS-Roles | IAM | Crear roles para EKS (prefijo eks-* y govtech-*) |

**Cuando asignarlo**: Creacion o actualizacion del cluster EKS, cambios en node groups, actualizaciones de version de Kubernetes.

---

### GovTech-Database-Admin

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| GovTech-RDS-Admin | RDS | Crear instancias, modificar parametros, crear snapshots, restaurar |

**Nota de seguridad**: La politica bloquea eliminacion de instancias con tag `Environment: production`.

**Cuando asignarlo**: Mantenimiento de base de datos, migraciones, backups, ajustes de parametros.

---

### GovTech-Terraform-Operator

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| GovTech-Terraform-State | S3, DynamoDB | Leer/escribir state de Terraform, usar locking de estado |
| GovTech-S3-Admin | S3 | Crear y gestionar buckets con prefijo govtech-* |

**Cuando asignarlo**: Ejecucion de `terraform apply` o `terraform destroy`, creacion de buckets de la aplicacion.

---

### GovTech-Container-Deploy

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| GovTech-ECR-Admin | ECR | Push y pull de imagenes Docker, crear repositorios |
| GovTech-EKS-Deploy | EKS, EC2 | kubectl apply, crear volumes para PVCs |

**Cuando asignarlo**: Despliegue de nuevas versiones de la aplicacion, actualizacion de imagenes Docker.

---

### GovTech-ALB-Operator

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| GovTech-ALB-Controller | ELB, ACM | Crear y modificar Application Load Balancers, gestionar certificados TLS |
| GovTech-AutoScaling | AutoScaling | Configurar HPA, grupos de auto escalado |

**Cuando asignarlo**: Configuracion de Ingress de Kubernetes, gestion de certificados SSL, configuracion de auto escalado.

---

### GovTech-CICD-Operator

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| GovTech-CICD-Access | IAM (OIDC), CodePipeline | Configurar GitHub Actions OIDC, gestionar pipelines |
| GovTech-ECR-ReadOnly | ECR | Pull de imagenes (sin push) para pipelines |

**Cuando asignarlo**: Configuracion de pipelines de CI/CD, integracion con GitHub Actions.

---

### GovTech-Secrets-ReadOnly

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| GovTech-Secrets-Read | Secrets Manager | Leer secrets de dev y staging (NO produccion) |

**Cuando asignarlo**: Scripts de deployment que necesitan credenciales, diagnostico de problemas de configuracion.

---

### GovTech-Monitor-ReadOnly

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| CloudWatchReadOnlyAccess | CloudWatch | Ver metricas, logs, alarmas (sin modificar) |
| GovTech-Monitoring | CloudWatch, GuardDuty | Ver dashboards, findings de seguridad |

**Cuando asignarlo**: Rol de SRE (Site Reliability Engineer), on-call, monitoreo de produccion.

---

### GovTech-Security-Auditor

| Permiso | Servicio | Accion permitida |
|---------|----------|-----------------|
| SecurityAudit | Multiple | Lectura de configuracion de seguridad en todos los servicios |
| GovTech-Security-Auditor | CloudTrail, Security Hub, GuardDuty, IAM Analyzer | Leer reportes de auditoria y compliance |

**Cuando asignarlo**: Auditorias de seguridad periodicas, revision de compliance, investigacion de incidentes.

---

## Politicas JSON Detalladas

### GovTech-ECR-Admin

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

**Que permite**: Crear repositorios ECR, subir y descargar imagenes Docker.
**Que NO permite**: Eliminar imagenes de produccion sin proceso de aprobacion.

---

### GovTech-ECR-ReadOnly

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

**Que permite**: Descargar imagenes Docker desde ECR (pull).
**Que NO permite**: Subir imagenes (push), crear o eliminar repositorios.

---

### GovTech-Terraform-State

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

**Que permite**: Leer y escribir el estado de Terraform, usar el sistema de locking para evitar conflictos.
**Que NO permite**: Eliminar el bucket de state, acceder a otros buckets S3.

---

### GovTech-S3-Admin

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketManagement",
      "Effect": "Allow",
      "Action": ["s3:*"],
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

**Que permite**: Crear y gestionar buckets con prefijo `govtech-*`, configurar versionado, encriptacion, CORS.
**Que NO permite**: Acceder a buckets de otras aplicaciones o sin prefijo `govtech-`.

---

### GovTech-RDS-Admin

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
        "rds:ModifyDBSubnetGroup",
        "rds:CreateDBSnapshot",
        "rds:RestoreDBInstanceFromDBSnapshot",
        "rds:DescribeDBSnapshots"
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
      "Action": ["rds:DeleteDBInstance"],
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

**Que permite**: Crear y modificar instancias RDS en us-east-1, crear y restaurar snapshots.
**Que NO permite**: Eliminar bases de datos de produccion (protegidas por tag `Environment: production`).

---

### GovTech-IAM-EKS-Roles

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

**Que permite**: Crear roles IAM necesarios para EKS (node groups, worker nodes, IRSA), crear OIDC providers para GitHub Actions.
**Que NO permite**: Crear o modificar usuarios IAM, crear roles fuera del prefijo `eks-*` y `govtech-*`.

---

### GovTech-EKS-Deploy

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

**Que permite**: Acceder a EKS con kubectl (`eks:AccessKubernetesApi`), crear volumes EBS para PersistentVolumeClaims de Kubernetes.
**Que NO permite**: Modificar configuracion del cluster, crear o eliminar node groups.

---

### GovTech-Secrets-Read

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
      "Action": ["secretsmanager:*"],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:govtech/prod/*"
    }
  ]
}
```

**Que permite**: Leer credenciales de los ambientes de desarrollo y staging.
**Que NO permite**: Leer ni modificar secrets de produccion, crear o eliminar secrets.

---

### GovTech-CICD-Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GitHubActionsOIDC",
      "Effect": "Allow",
      "Action": [
        "iam:CreateOpenIDConnectProvider",
        "iam:GetOpenIDConnectProvider",
        "iam:TagOpenIDConnectProvider"
      ],
      "Resource": "arn:aws:iam::835960996869:oidc-provider/token.actions.githubusercontent.com"
    },
    {
      "Sid": "CICDRoleAssumption",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::835960996869:role/govtech-cicd-*"
    },
    {
      "Sid": "SecretsForCICD",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:CreateSecret",
        "secretsmanager:UpdateSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:govtech/cicd/*"
    }
  ]
}
```

**Que permite**: Configurar el proveedor OIDC de GitHub Actions, crear roles para pipelines, gestionar secrets de CI/CD.
**Que NO permite**: Modificar roles de produccion, acceder a secrets de la aplicacion.

---

### GovTech-ALB-Controller

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

**Que permite**: Crear Application Load Balancers para exponer servicios de Kubernetes, gestionar Target Groups y Listeners, consultar certificados TLS de ACM.
**Que NO permite**: Modificar certificados TLS, eliminar load balancers de produccion sin proceso de aprobacion.

---

### GovTech-AutoScaling

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AutoScalingGroupManagement",
      "Effect": "Allow",
      "Action": [
        "autoscaling:CreateAutoScalingGroup",
        "autoscaling:UpdateAutoScalingGroup",
        "autoscaling:DeleteAutoScalingGroup",
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2ForScaling",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeLaunchTemplates"
      ],
      "Resource": "*"
    }
  ]
}
```

**Que permite**: Crear y gestionar grupos de auto escalado, configurar HPA (Horizontal Pod Autoscaler) en Kubernetes.
**Que NO permite**: Modificar instancias EC2 directamente, cambiar configuracion de red.

---

### GovTech-Monitoring

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchReadAccess",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:DescribeAlarms",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "logs:FilterLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Sid": "GuardDutyReadAccess",
      "Effect": "Allow",
      "Action": [
        "guardduty:GetDetector",
        "guardduty:GetFindings",
        "guardduty:ListDetectors",
        "guardduty:ListFindings",
        "guardduty:GetFindingsStatistics"
      ],
      "Resource": "*"
    }
  ]
}
```

**Que permite**: Ver metricas de CloudWatch, leer logs de aplicacion, ver findings de GuardDuty.
**Que NO permite**: Crear o eliminar alarmas, modificar dashboards, silenciar alertas de seguridad.

---

### GovTech-Security-Auditor

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudTrailReadOnly",
      "Effect": "Allow",
      "Action": [
        "cloudtrail:GetTrail",
        "cloudtrail:GetTrailStatus",
        "cloudtrail:ListTrails",
        "cloudtrail:LookupEvents",
        "cloudtrail:GetEventSelectors",
        "cloudtrail:DescribeTrails"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SecurityHubReadOnly",
      "Effect": "Allow",
      "Action": [
        "securityhub:GetFindings",
        "securityhub:ListFindings",
        "securityhub:GetInsights",
        "securityhub:GetEnabledStandards",
        "securityhub:DescribeHub",
        "securityhub:DescribeStandards",
        "securityhub:DescribeStandardsControls"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMAccessAnalyzerReadOnly",
      "Effect": "Allow",
      "Action": [
        "access-analyzer:ListAnalyzers",
        "access-analyzer:GetAnalyzer",
        "access-analyzer:ListFindings",
        "access-analyzer:GetFinding"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ConfigReadOnly",
      "Effect": "Allow",
      "Action": [
        "config:GetComplianceSummaryByConfigRule",
        "config:GetComplianceDetailsByConfigRule",
        "config:DescribeConfigRules",
        "config:ListDiscoveredResources"
      ],
      "Resource": "*"
    }
  ]
}
```

**Que permite**: Leer el historial completo de acciones en CloudTrail, ver findings de Security Hub, revisar IAM Access Analyzer, consultar reglas de AWS Config.
**Que NO permite**: Modificar nada; es acceso estrictamente de solo lectura.

---

## Auditoria y Compliance

### Alertas por nivel

| Nivel | Alerta configurada |
|-------|--------------------|
| Nivel 1 Critico | Alerta INMEDIATA en CloudWatch + notificacion por email |
| Nivel 2 Operacional | Registro en CloudTrail + alerta si patron inusual (GuardDuty) |
| Nivel 3 Solo lectura | Solo registro en CloudTrail |

### Comandos de auditoria

```bash
# Ver todas las acciones recientes de un usuario
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=govtech-admin \
  --start-time 2026-02-01 \
  --end-time 2026-02-28 \
  --output table

# Ver acciones de tipo "delete" en los ultimos 7 dias
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteDBInstance \
  --output table

# Ver todos los grupos de un usuario
aws iam list-groups-for-user \
  --user-name govtech-admin \
  --query 'Groups[].GroupName' \
  --output table

# Ver todas las politicas adjuntas a un grupo
aws iam list-attached-group-policies \
  --group-name GovTech-EKS-Admin \
  --query 'AttachedPolicies[].{Nombre:PolicyName,ARN:PolicyArn}' \
  --output table

# Ver access keys activas y su antiguedad
aws iam list-access-keys \
  --user-name govtech-admin \
  --query 'AccessKeyMetadata[].{ID:AccessKeyId,Estado:Status,Creado:CreateDate}' \
  --output table
```

### Checklist de revision mensual

- [ ] Revisar CloudTrail: buscar acciones inusuales o fuera de horario
- [ ] Verificar que no existen access keys con mas de 90 dias sin rotar
- [ ] Confirmar que MFA esta activo en el usuario operador
- [ ] Revisar findings activos en Security Hub y GuardDuty
- [ ] Validar que no hay usuarios sin asignar a grupos o con permisos directos
- [ ] Confirmar que no existen roles IAM con permisos excesivos creados fuera del scope

---

## Procedimientos de Implementacion

### Setup inicial

```bash
cd aws/iam
./setup-iam-v2.sh
```

### Agregar un nuevo miembro al equipo

```bash
# 1. Crear el usuario
aws iam create-user --user-name nombre.apellido

# 2. Asignar solo los grupos necesarios para su funcion
aws iam add-user-to-group \
  --user-name nombre.apellido \
  --group-name GovTech-Monitor-ReadOnly

# 3. Crear acceso a consola con password temporal
aws iam create-login-profile \
  --user-name nombre.apellido \
  --password "TempPass2026!" \
  --password-reset-required

# 4. Si necesita acceso temporal a un dominio adicional:
aws iam add-user-to-group \
  --user-name nombre.apellido \
  --group-name GovTech-Database-Admin

# 5. Al terminar la tarea temporal, revocar el acceso:
aws iam remove-user-from-group \
  --user-name nombre.apellido \
  --group-name GovTech-Database-Admin
```

### Asignacion recomendada por rol

| Rol | Grupos recomendados |
|-----|---------------------|
| Arquitecto cloud | GovTech-Network-Admin, GovTech-EKS-Admin, GovTech-Terraform-Operator (acceso temporal) |
| DevOps engineer | GovTech-Container-Deploy, GovTech-CICD-Operator |
| SRE / On-call | GovTech-Monitor-ReadOnly, GovTech-Secrets-ReadOnly |
| DBA | GovTech-Database-Admin (acceso temporal para mantenimiento) |
| Analista de seguridad | GovTech-Security-Auditor |
| Developer (deploy propio) | GovTech-Container-Deploy |

### Rotar access keys

```bash
# Crear nueva key
aws iam create-access-key --user-name govtech-admin

# Desactivar la anterior (no eliminar todavia)
aws iam update-access-key \
  --user-name govtech-admin \
  --access-key-id AKIA_KEY_ANTIGUA \
  --status Inactive

# Despues de confirmar que la nueva key funciona, eliminar la anterior
aws iam delete-access-key \
  --user-name govtech-admin \
  --access-key-id AKIA_KEY_ANTIGUA
```

---

**Creado**: 2026-02-12
**Actualizado**: 2026-02-23
**Version**: 3.0
**Mantenido por**: Equipo de infraestructura GovTech
