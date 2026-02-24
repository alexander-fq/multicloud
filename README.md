# GovTech Cloud Migration Platform

Plataforma de infraestructura cloud-agnostica para la transformacion digital del gobierno. Disenada para que el cliente pueda elegir su proveedor cloud (AWS, OCI, GCP o Azure) sin reescribir codigo.

---

## Estructura del repositorio

```
/
  platform/     Plataforma completa con app demo funcionando
  skeleton/     Plantilla base para nuevos proyectos
```

### `platform/` — Demo completa

Contiene la plataforma funcional con una aplicacion demo que demuestra la arquitectura. Incluye:

- App web (React + Node.js) con documentacion navegable
- Infraestructura completa en AWS (Terraform, EKS, RDS, S3, IAM)
- Kubernetes con NetworkPolicies zero-trust, RBAC, HPA, PDB
- Pipelines CI/CD con seguridad integrada (Trivy, Semgrep, Gitleaks, SBOM)
- Plan de Disaster Recovery (RTO 4h / RPO 24h)
- Documentacion multi-cloud con guias de migracion

**Usar para:** demostraciones, referencia tecnica, aprendizaje.

### `skeleton/` — Plantilla para nuevos proyectos

Contiene la misma infraestructura pero con una aplicacion placeholder minimal. El cliente reemplaza `app/backend/` y `app/frontend/` con su propia aplicacion.

**Usar para:** iniciar un nuevo proyecto sobre esta infraestructura.

Ver [`skeleton/GETTING_STARTED.md`](skeleton/GETTING_STARTED.md) para el proceso paso a paso.

---

## Proveedores cloud soportados

| Proveedor | Estado | Tiempo de implementacion |
|---|---|---|
| AWS | Implementado al 100% | Listo para produccion |
| OCI | Estructura lista | 3-4 dias para implementar |
| GCP | Estructura lista | 3-4 dias para implementar |
| Azure | Estructura lista | 3-4 dias para implementar |

Para implementar un proveedor distinto a AWS, ver [`platform/docs/architecture/MULTI_CLOUD_SERVICES.md`](platform/docs/architecture/MULTI_CLOUD_SERVICES.md).

---

## Arquitectura

```
Aplicacion (Node.js / React)
    |
ServiceFactory (lee CLOUD_PROVIDER del .env)
    |
    +-- AWS   --> S3, RDS, CloudWatch, IAM     (implementado)
    +-- OCI   --> Object Storage, DB, Monitor  (estructura lista)
    +-- GCP   --> Cloud Storage, Cloud SQL     (estructura lista)
    +-- Azure --> Blob, PostgreSQL, Monitor    (estructura lista)
    |
Kubernetes (EKS / OKE / GKE / AKS)
    |
Terraform (infraestructura como codigo)
```

**Cambiar de proveedor cloud:** modificar `CLOUD_PROVIDER` en `.env` e implementar los 4 servicios del proveedor en `app/backend/src/services/providers/<proveedor>/`.

---

## Stack tecnologico

| Capa | Tecnologia |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL 15 |
| Contenedores | Docker + Kubernetes (EKS) |
| Infraestructura | Terraform |
| CI/CD | GitHub Actions + OIDC |
| Seguridad | IAM, KMS, WAF, GuardDuty, Security Hub |
| Monitoreo | CloudWatch + Prometheus + Grafana |

---

## Documentacion

| Documento | Descripcion |
|---|---|
| [`platform/docs/architecture/MULTI_CLOUD_SERVICES.md`](platform/docs/architecture/MULTI_CLOUD_SERVICES.md) | Guia completa para implementar cada proveedor cloud |
| [`platform/docs/deployment/DEPLOYMENT_GUIDE.md`](platform/docs/deployment/DEPLOYMENT_GUIDE.md) | Despliegue a produccion en AWS |
| [`platform/docs/IAM_SECURITY_POLICIES.md`](platform/docs/IAM_SECURITY_POLICIES.md) | Politicas IAM y grupos de acceso |
| [`platform/disaster-recovery/runbooks/DR_PLAN.md`](platform/disaster-recovery/runbooks/DR_PLAN.md) | Plan de recuperacion ante desastres |
| [`skeleton/GETTING_STARTED.md`](skeleton/GETTING_STARTED.md) | Como adaptar el skeleton a tu proyecto |
