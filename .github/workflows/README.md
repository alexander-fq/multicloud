# GitHub Actions Workflows

## Workflows disponibles

| Workflow | Archivo | Trigger | Descripcion |
|----------|---------|---------|-------------|
| Backend CI | `backend-ci.yml` | Push/PR a main, staging | Lint, audit, test, build Docker, push a ECR |
| Frontend CI | `frontend-ci.yml` | Push/PR a main, staging | Lint, audit, build Vite, build Docker, push a ECR |

## Secrets requeridos

Configurar en GitHub → Settings → Secrets and variables → Actions:

| Secret | Descripcion | Donde obtenerlo |
|--------|-------------|-----------------|
| `AWS_ACCESS_KEY_ID` | Access Key del usuario IAM | AWS IAM → Users → collab-deployment → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | Secret Key del usuario IAM | Se muestra solo al crear la Access Key |

## Como configurar los Secrets

1. Ir al repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. New repository secret
4. Agregar `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`

## Flujo de los pipelines

```
Push a feature/* branch
       ↓
  Pull Request a staging
       ↓
  CI ejecuta (lint + test + build)
       ↓
  Si pasa → Merge a staging
       ↓
  CI + Push a ECR (solo staging/main)
       ↓
  Pull Request a main
       ↓
  Review + Merge
```

## Branches y comportamiento

| Branch | CI ejecuta | Push a ECR |
|--------|-----------|-----------|
| `feature/*` | Solo en PR | No |
| `staging` | Si | Si |
| `main` | Si | Si |

## Repositorios ECR

- Backend: `835960996869.dkr.ecr.us-east-1.amazonaws.com/govtech-backend`
- Frontend: `835960996869.dkr.ecr.us-east-1.amazonaws.com/govtech-frontend`

## Security Scanning

Trivy escanea cada imagen Docker en busca de vulnerabilidades CRITICAL y HIGH.
El pipeline NO falla por vulnerabilidades (exit-code: 0) pero si las reporta.
Para hacer que falle cambiar `exit-code: '0'` a `exit-code: '1'`.
