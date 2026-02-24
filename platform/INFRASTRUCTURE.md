# Infraestructura - GovTech Cloud Migration Platform

## Overview

GovTech utiliza infraestructura como codigo (Terraform) y orquestacion con Kubernetes para despliegue en AWS. La arquitectura sigue el principio de **defense in depth**: multiples capas de seguridad en cada nivel de la infraestructura.

## Diagrama de Arquitectura

```
Internet
    |
    v
[Route53 DNS] → govtech.example.com
    |
    v
[WAF] ← Bloquea: SQL injection, XSS, bots, rate limit (5 reglas AWS Managed)
    |
    v
[AWS ALB] ← AWS Load Balancer Controller (EKS) | HTTPS obligatorio (ACM)
    |
    ├── /api/* → Backend Service (ClusterIP :3000)
    └── /*     → Frontend Service (ClusterIP :80)
                        |
         [NetworkPolicies: Zero-Trust]
              ┌─────────v──────────┐
              │    EKS Cluster      │
              │  (Private Subnets)  │
              │                    │
              │  ┌──────────────┐  │
              │  │   frontend   │  │ ← React/Nginx, SA: govtech-frontend
              │  │  (2-8 pods)  │  │   (sin permisos de secrets/DB)
              │  └──────┬───────┘  │
              │         │ :3000    │
              │  ┌──────v───────┐  │
              │  │   backend    │  │ ← Node.js, SA: govtech-backend (IRSA)
              │  │  (2-10 pods) │  │   (accede Secrets Manager via IAM Role)
              │  └──────┬───────┘  │
              │         │ :5432    │
              │  ┌──────v───────┐  │
              │  │   postgres   │  │ ← StatefulSet, SA: govtech-database
              │  │  (1 pod)     │  │   (solo recibe, no inicia conexiones)
              │  └──────────────┘  │
              └────────────────────┘
                        |
              ┌─────────v──────────┐
              │  AWS Services       │
              │  - RDS PostgreSQL   │ ← Produccion: Multi-AZ, encriptado KMS
              │  - S3 Bucket        │ ← Archivos, versionado, lifecycle rules
              │  - Secrets Manager  │ ← Credenciales DB + JWT, rotacion automatica
              │  - ECR              │ ← Imagenes Docker, scan automatico
              └────────────────────┘
                        |
              ┌─────────v──────────┐
              │  Seguridad & Audit  │
              │  - CloudTrail       │ ← Auditoria de TODAS las acciones AWS
              │  - GuardDuty        │ ← IDS automatico con ML
              │  - Security Hub     │ ← Panel CIS Benchmark + Best Practices
              │  - KMS              │ ← Encriptacion centralizada
              │  - Cost Anomaly     │ ← Alertas de gasto inusual
              └────────────────────┘
```

## Capas de Seguridad (Defense in Depth)

| Capa | Tecnologia | Que protege |
|------|-----------|-------------|
| 1. Red perimetral | WAF (5 reglas) | Ataques web antes de llegar a la app |
| 2. Red interna | NetworkPolicies | Comunicacion entre pods (zero-trust) |
| 3. Identidad | RBAC + IRSA | Permisos minimos por componente |
| 4. Secretos | Secrets Manager + KMS | Credenciales encriptadas, sin hardcode |
| 5. Contenedores | Trivy + Pod Security | Sin vulnerabilidades CRITICAL/HIGH |
| 6. Codigo | Semgrep + Gitleaks | Sin secretos ni vulnerabilidades en git |
| 7. Auditoria | CloudTrail + GuardDuty | Deteccion de anomalias y forensics |
| 8. Costos | Cost Anomaly Detection | Alertas si el gasto es inusual |

## Componentes

### Docker

| Imagen | Base | Puerto | Descripcion |
|---|---|---|---|
| govtech-backend | node:20-alpine | 3000 | API REST Node.js/Express |
| govtech-frontend | nginx:alpine | 80 | React SPA + proxy /api |
| postgres | postgres:15-alpine | 5432 | Solo para desarrollo local |

Las imagenes se almacenan en **AWS ECR** (encriptadas con KMS, scan en cada push):
- `835960996869.dkr.ecr.us-east-1.amazonaws.com/govtech-backend`
- `835960996869.dkr.ecr.us-east-1.amazonaws.com/govtech-frontend`

### Terraform Modules

| Modulo | Recursos AWS | Proposito |
|---|---|---|
| networking | VPC, Subnets, IGW, NAT GW, SG | Red base aislada multi-AZ |
| kubernetes-cluster | EKS, Node Group, IAM, OIDC | Orquestador de contenedores |
| database | RDS PostgreSQL, Subnet Group | BD relacional gestionada, Multi-AZ en prod |
| storage | S3, Lifecycle Rules, IRSA | Almacenamiento de archivos |
| **security** | KMS, CloudTrail, GuardDuty, Security Hub, WAF, Secrets Manager, Cost Anomaly | Seguridad y cumplimiento |

### Kubernetes Resources

| Recurso | Tipo | Descripcion |
|---|---|---|
| govtech | Namespace | Aislamiento con Pod Security Standards (baseline) |
| govtech-config | ConfigMap | Variables de entorno no sensibles |
| govtech-secrets | Secret | Credenciales (reemplazar por Secrets Manager en prod) |
| backend | Deployment | Backend con rolling updates, SA: govtech-backend |
| frontend | Deployment | Frontend con rolling updates, SA: govtech-frontend |
| postgres | StatefulSet | BD con almacenamiento persistente, SA: govtech-database |
| backend-hpa | HPA | Auto-scaling 2-10 pods |
| frontend-hpa | HPA | Auto-scaling 2-8 pods |
| govtech-ingress | Ingress | ALB con SSL y routing |
| **network-policies** | NetworkPolicy | Zero-trust: deny-all + allow explicito por componente |
| **rbac** | Role/RoleBinding | Least privilege: cada pod solo tiene los permisos necesarios |
| **pdb** | PodDisruptionBudget | Disponibilidad garantizada durante mantenimiento |

### CI/CD (GitHub Actions)

| Workflow | Trigger | Que hace |
|---|---|---|
| **security-scan.yml** | PR/push a main/staging | Gitleaks + Semgrep SAST + npm audit + Checkov IaC |
| backend-ci.yml | Push a main/staging (backend/**) | Lint, test, build, scan (Trivy), push ECR, SBOM |
| frontend-ci.yml | Push a main/staging (frontend/**) | Lint, build, scan (Trivy), push ECR, SBOM |
| deploy-dev.yml | Push a staging | Terraform apply + kubectl apply en govtech-dev |
| deploy-prod.yml | Manual (workflow_dispatch) | Blue-green deploy en govtech-prod con aprobacion |

**Autenticacion**: OIDC (sin access keys de larga duracion almacenadas en GitHub)

### Monitoring

| Componente | Descripcion |
|---|---|
| CloudWatch Container Insights | Metricas del cluster y logs de pods |
| GuardDuty | Deteccion de amenazas con ML (IDS automatico) |
| Security Hub | Dashboard CIS Benchmark y alertas centralizadas |
| CloudTrail | Auditoria de todas las acciones en la cuenta AWS |
| Cost Anomaly Detection | Alertas si el gasto sube de forma inusual |

## Ambientes

| Ambiente | Cluster EKS | Nodos | RDS | Multi-AZ | Costo ~|
|---|---|---|---|---|---|
| dev | govtech-dev | 2-4 x t3.medium | db.t3.micro | No | $180/mes |
| staging | govtech-staging | 2-6 x t3.small | db.t3.small | No | $200/mes |
| prod | govtech-prod | 3-10 x t3.medium | db.t3.small | **Si** | $335/mes |

## Red (VPC Architecture)

```
VPC 10.0.0.0/16 (dev) / 10.1.0.0/16 (staging) / 10.2.0.0/16 (prod)
│
├── Subnets PUBLICAS (ALB, NAT Gateway)
│   ├── us-east-1a: 10.x.1.0/24
│   ├── us-east-1b: 10.x.2.0/24
│   └── us-east-1c: 10.x.3.0/24 (solo staging/prod)
│
└── Subnets PRIVADAS (EKS nodes, RDS)
    ├── us-east-1a: 10.x.10.0/24
    ├── us-east-1b: 10.x.11.0/24
    └── us-east-1c: 10.x.12.0/24 (solo staging/prod)
```

**Principio clave**: los pods y la base de datos NUNCA son accesibles desde internet directamente. Todo entra por el ALB.

## Flujo de Despliegue

```
Developer
    │
    ▼ git push → feature/*
[GitHub] → PR a staging
    │
    ├── [security-scan] ← BLOQUEA el merge si hay secretos, vulnerabilidades OWASP
    │       ├── Gitleaks (secretos en git)
    │       ├── Semgrep (codigo vulnerable)
    │       ├── npm audit (dependencias con CVEs)
    │       └── Checkov (Terraform/K8s inseguro)
    │
    ├── merge → backend-ci / frontend-ci
    │       ├── Lint + Test
    │       ├── docker build
    │       ├── Trivy scan (BLOQUEA si CRITICAL/HIGH) ← antes del push
    │       ├── docker push a ECR
    │       └── SBOM generado (90 dias retencion)
    │
    ├── push a staging → deploy-dev.yml
    │       ├── terraform apply (infraestructura)
    │       └── kubectl apply (pods + network-policies + rbac + pdb)
    │
    └── PR a main → deploy-prod.yml (manual)
            ├── Confirmacion: escribir "DEPLOY"
            ├── Aprobacion en GitHub Environments
            ├── Blue-green deployment
            ├── Health checks (2+ replicas listas)
            └── Rollback automatico si falla
```

## Estado Terraform

```
s3://govtech-terraform-state-835960996869/
├── terraform.tfstate          # Global (ECR repos, OIDC provider)
├── dev/terraform.tfstate      # Ambiente dev
├── staging/terraform.tfstate  # Ambiente staging
└── prod/terraform.tfstate     # Ambiente produccion
```

- Versionado habilitado (recuperar estados anteriores)
- Encryption con KMS
- Acceso publico bloqueado

## Tests de Infraestructura

```bash
# Validar Terraform (sintaxis, formato, seguridad estatica)
./tests/infrastructure/validate-terraform.sh

# Verificar seguridad en Kubernetes (NetworkPolicies, RBAC, PDB, PSS)
./tests/security/test-network-policies.sh govtech

# Tests end-to-end de la aplicacion
./tests/e2e/test-deployment.sh https://govtech.example.com
```
