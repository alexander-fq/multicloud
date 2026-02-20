# Infraestructura - GovTech Cloud Migration Platform

## Overview

GovTech utiliza infraestructura como codigo (Terraform) y orquestacion con Kubernetes para despliegue en AWS. La arquitectura sigue el principio de **defense in depth**: multiples capas de seguridad y alta disponibilidad en cada nivel.

## Diagrama de Arquitectura

```
Internet
    |
    ▼
[Route53 DNS] → govtech.example.com
    |
    ▼
[AWS ALB] ← AWS Load Balancer Controller (EKS)
    |
    ├── /api/* → Backend Service (ClusterIP)
    └── /*     → Frontend Service (ClusterIP)
                        |
              ┌─────────▼──────────┐
              │    EKS Cluster      │
              │  (Private Subnets)  │
              │                    │
              │  ┌──────────────┐  │
              │  │   backend    │  │ ← Node.js/Express
              │  │  (2-10 pods) │  │
              │  └──────┬───────┘  │
              │         │          │
              │  ┌──────▼───────┐  │
              │  │   postgres   │  │ ← StatefulSet
              │  │  (1 pod)     │  │
              │  └──────────────┘  │
              └────────────────────┘
                        |
              ┌─────────▼──────────┐
              │  AWS Services       │
              │  - RDS PostgreSQL   │ ← Produccion: Multi-AZ
              │  - S3 Bucket        │ ← Archivos de la app
              └────────────────────┘
```

## Componentes

### Docker

| Imagen | Base | Puerto | Descripcion |
|---|---|---|---|
| govtech-backend | node:20-alpine | 3000 | API REST Node.js/Express |
| govtech-frontend | nginx:alpine | 80 | React SPA + proxy /api |
| postgres | postgres:15-alpine | 5432 | Solo para desarrollo local |

Las imagenes se almacenan en **AWS ECR**:
- `835960996869.dkr.ecr.us-east-1.amazonaws.com/govtech-backend`
- `835960996869.dkr.ecr.us-east-1.amazonaws.com/govtech-frontend`

### Terraform Modules

| Modulo | Recursos AWS | Proposito |
|---|---|---|
| networking | VPC, Subnets, IGW, NAT GW, SG | Red base aislada |
| kubernetes-cluster | EKS, Node Group, IAM, OIDC | Orquestador de contenedores |
| database | RDS PostgreSQL, Subnet Group | BD relacional gestionada |
| storage | S3, Lifecycle Rules, IRSA | Almacenamiento de archivos |

### Kubernetes Resources

| Recurso | Tipo | Descripcion |
|---|---|---|
| govtech | Namespace | Aislamiento de recursos |
| govtech-config | ConfigMap | Variables de entorno no sensibles |
| govtech-secrets | Secret | Credenciales (NO en git) |
| backend | Deployment | Backend con rolling updates |
| frontend | Deployment | Frontend con rolling updates |
| postgres | StatefulSet | BD con almacenamiento persistente |
| backend-hpa | HPA | Auto-scaling 2-10 pods |
| frontend-hpa | HPA | Auto-scaling 2-8 pods |
| govtech-ingress | Ingress | ALB con SSL y routing |

### CI/CD (GitHub Actions)

| Workflow | Trigger | Que hace |
|---|---|---|
| backend-ci.yml | Push a main/staging (backend/**) | Lint, test, build, push ECR, Trivy scan |
| frontend-ci.yml | Push a main/staging (frontend/**) | Lint, build Vite, push ECR |
| deploy-dev.yml | Push a staging | Terraform apply + kubectl apply en govtech-dev |
| deploy-prod.yml | Manual (workflow_dispatch) | Blue-green deploy en govtech-prod con aprobacion |

### Monitoring

| Componente | Descripcion | Acceso |
|---|---|---|
| CloudWatch Container Insights | Metricas del cluster y logs | Consola AWS |
| Prometheus | Metricas de aplicacion (scraping) | `kubectl port-forward` |
| Grafana | Dashboards de visualizacion | `kubectl port-forward :3000` |
| Alertmanager | Enrutamiento de alertas | Configurar Slack/PagerDuty |

## Ambientes

| Ambiente | Cluster EKS | Nodos | RDS | Multi-AZ | Costo ~|
|---|---|---|---|---|---|
| dev | govtech-dev | 2-4 x t3.medium | db.t3.micro | No | $180/mes |
| staging | govtech-staging | 2-6 x t3.small | db.t3.small | No | $200/mes |
| prod | govtech-prod | 3-10 x t3.medium | db.t3.small | Si | $335/mes |

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

Principio clave: **los pods y la base de datos NUNCA son accesibles desde internet directamente**. Todo el trafico entra por el ALB.

## Seguridad

- **Encryption at rest**: RDS y S3 con AES-256
- **Encryption in transit**: HTTPS obligatorio (redireccion HTTP → HTTPS)
- **No credenciales en codigo**: IRSA para acceso de pods a AWS, Secrets de Kubernetes para credenciales de BD
- **Least privilege**: cada IAM role tiene solo los permisos minimos necesarios
- **Security Groups**: el RDS solo acepta conexiones desde el Security Group de EKS en puerto 5432
- **Block Public Access**: todos los buckets S3 tienen acceso publico bloqueado

## Flujo de Despliegue

```
Developer
    │
    ▼ git push → feature/*
[GitHub]
    │
    ├── PR a staging
    │       │
    │       ▼ merge
    │   backend-ci / frontend-ci (build, test, push ECR)
    │       │
    │       ▼ push a staging
    │   deploy-dev.yml
    │   - terraform apply (dev)
    │   - kubectl apply (govtech-dev)
    │
    └── PR a main (revision requerida)
            │
            ▼ merge + trigger manual
        deploy-prod.yml
        - Aprobacion manual en GitHub
        - Blue-green deployment
        - Health checks
        - Rollback automatico si falla
```

## Estado Terraform

El estado de Terraform se almacena de forma segura en S3:

```
s3://govtech-terraform-state-835960996869/
├── dev/terraform.tfstate
├── staging/terraform.tfstate
└── prod/terraform.tfstate
```

Caracteristicas del bucket de estado:
- Versionado habilitado (recuperar estados anteriores)
- Encryption habilitada
- Acceso publico bloqueado
- Region: us-east-1
