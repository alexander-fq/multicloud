# GitHub Actions Workflows

## Workflows disponibles

| Workflow | Archivo | Trigger | Descripcion |
|----------|---------|---------|-------------|
| Security Scan | `security-scan.yml` | PR a main/staging, push | Gitleaks + Semgrep SAST + npm audit + Checkov IaC |
| Backend CI | `backend-ci.yml` | Push/PR a main, staging | Lint, audit, test, build, **scan**, push ECR, SBOM |
| Frontend CI | `frontend-ci.yml` | Push/PR a main, staging | Lint, audit, build Vite, build, **scan**, push ECR, SBOM |
| Deploy Dev | `deploy-dev.yml` | Push a staging | Terraform apply + kubectl apply en govtech-dev |
| Deploy Prod | `deploy-prod.yml` | Manual (workflow_dispatch) | Blue-green deploy en govtech-prod con aprobacion |

## Flujo de seguridad DevSecOps

```
PR a main/staging
      |
      v
[security-scan.yml] ← DEBE pasar para hacer merge
  ├── Gitleaks: detecta secretos/credenciales en el codigo
  ├── Semgrep: SAST (OWASP Top 10, JWT, Node.js patterns)
  ├── npm audit: vulnerabilidades en dependencias (bloquea en HIGH/CRITICAL)
  └── Checkov: seguridad de Terraform y Kubernetes

      |
      v (merge)
[backend-ci / frontend-ci]
  ├── Lint + Test
  ├── npm audit --audit-level=high  (bloqueante)
  ├── docker build
  ├── Trivy scan (exit-code: 1 = bloquea si CRITICAL/HIGH)  ← ANTES del push
  ├── docker push a ECR (solo si el scan paso)
  └── SBOM generado (CycloneDX, retencion 90 dias)

      |
      v (push a staging)
[deploy-dev.yml]
  ├── Terraform apply (infraestructura)
  └── kubectl apply (Kubernetes)

      |
      v (manual approval)
[deploy-prod.yml]
  ├── Aprobacion manual en GitHub Environments
  ├── Blue-green deployment
  ├── Health checks (minimo 2 replicas listas)
  └── Rollback automatico si falla
```

## Secrets requeridos en GitHub

Configurar en: GitHub → Settings → Secrets and variables → Actions

| Secret | Descripcion |
|--------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | ARN del IAM Role para OIDC (reemplaza access keys) |
| `DB_PASSWORD` | Password de la base de datos (usado en Terraform) |

**Nota:** Ya no se usan `AWS_ACCESS_KEY_ID` ni `AWS_SECRET_ACCESS_KEY`.
El pipeline usa OIDC para obtener credenciales temporales de AWS (expiran en 1 hora).

## Como configurar OIDC (una sola vez)

1. Ejecutar Terraform en el ambiente root (crea el OIDC provider y el IAM Role):
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```

2. Copiar el output `github_actions_role_arn` a GitHub Secrets como `AWS_DEPLOY_ROLE_ARN`

3. Los workflows ya estan configurados para usar ese rol via OIDC

## Repositorios ECR

- Backend: `835960996869.dkr.ecr.us-east-1.amazonaws.com/govtech-backend`
- Frontend: `835960996869.dkr.ecr.us-east-1.amazonaws.com/govtech-frontend`

Los repositorios ECR se crean con Terraform (encriptados con KMS, escaneo en cada push, retención de 10 imagenes maxima).

## Branches y comportamiento

| Branch | Security Scan | CI ejecuta | Push a ECR |
|--------|--------------|-----------|-----------|
| `feature/*` | En PR | Solo en PR | No |
| `staging` | Si | Si | Si |
| `main` | Si | Si | Si |

## SBOM (Software Bill of Materials)

Cada build genera un SBOM en formato CycloneDX listando todas las dependencias
de la imagen Docker. Se guarda como artifact en GitHub Actions por 90 dias.
Requerido por muchos marcos de compliance gubernamental (NIST, FedRAMP).
