# Guia de Inicio - GovTech Cloud Migration Platform

Esta es la plantilla base de la plataforma. Contiene toda la infraestructura lista para produccion. Solo necesitas reemplazar la aplicacion demo con tu propia aplicacion.

---

## Paso 1 - Elegir tu proveedor cloud

La plataforma soporta AWS, OCI, GCP y Azure. Define tu proveedor editando la variable `CLOUD_PROVIDER` en tu archivo `.env`.

| Proveedor | Variable | Documentacion |
|---|---|---|
| AWS | `CLOUD_PROVIDER=aws` | Ver `docs/architecture/MULTI_CLOUD_SERVICES.md` |
| OCI | `CLOUD_PROVIDER=oci` | Ver `docs/architecture/MULTI_CLOUD_SERVICES.md` |
| GCP | `CLOUD_PROVIDER=gcp` | Ver `docs/architecture/MULTI_CLOUD_SERVICES.md` |
| Azure | `CLOUD_PROVIDER=azure` | Ver `docs/architecture/MULTI_CLOUD_SERVICES.md` |

Para el proveedor que elijas, deberas implementar 4 servicios en `app/backend/src/services/providers/<proveedor>/`. Ver `docs/architecture/MULTI_CLOUD_SERVICES.md` para el contrato de interfaces y el esqueleto de cada servicio.

---

## Paso 2 - Reemplazar la aplicacion demo

### Backend (`app/backend/`)

El archivo `app/backend/src/app.js` contiene un servidor Express minimal. Reemplazalo con tu aplicacion:

1. Agrega tus rutas en `app/backend/src/routes/`
2. Agrega tu logica de negocio en `app/backend/src/services/`
3. Mantener los endpoints `/api/health`, `/api/health/database`, `/api/health/cloud` — los usa Kubernetes para verificar que el servicio esta vivo
4. Actualiza `app/backend/package.json` con tus dependencias

### Frontend (`app/frontend/`)

El archivo `app/frontend/src/App.jsx` es un placeholder. Reemplazalo:

1. Copia el codigo de tu frontend a `app/frontend/src/`
2. Actualiza `app/frontend/package.json` con tus dependencias
3. Si no usas React/Vite, reemplaza el `Dockerfile` con el proceso de build de tu framework

---

## Paso 3 - Configurar variables de entorno

Copia el archivo de ejemplo y completa tus valores:

```bash
cp .env.example .env
# Edita .env con tus credenciales y configuracion
```

Variables minimas requeridas:

```env
# Proveedor cloud elegido
CLOUD_PROVIDER=aws

# Base de datos
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db

# AWS (si usas AWS)
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=tu-account-id

# OCI (si usas OCI)
# OCI_REGION=us-ashburn-1
# OCI_NAMESPACE=tu-namespace
# OCI_TENANCY_ID=ocid1.tenancy...

# GCP (si usas GCP)
# GCP_PROJECT_ID=tu-proyecto
# GCP_REGION=us-central1

# Azure (si usas Azure)
# AZURE_TENANT_ID=tu-tenant
# AZURE_SUBSCRIPTION_ID=tu-subscription
```

---

## Paso 4 - Probar localmente

```bash
# Levantar todo con Docker Compose
docker-compose up -d

# Verificar que el backend responde
curl http://localhost:3000/api/health

# Ver logs
docker-compose logs -f backend
```

---

## Paso 5 - Desplegar la infraestructura

```bash
# 1. Inicializar Terraform
cd terraform/environments/dev
terraform init

# 2. Revisar el plan (que recursos se van a crear)
terraform plan

# 3. Crear la infraestructura (VPC, EKS, RDS, seguridad)
terraform apply
```

Ver `docs/deployment/DEPLOYMENT_GUIDE.md` para el proceso completo de despliegue a produccion.

---

## Paso 6 - Configurar IAM

```bash
# Crear grupos y politicas IAM
cd aws/iam
bash setup-iam-v2.sh

# Verificar que los grupos se crearon
aws iam list-groups --query 'Groups[].GroupName'
```

Ver `docs/IAM_SECURITY_POLICIES.md` para la descripcion de cada grupo y sus permisos.

---

## Paso 7 - Desplegar en Kubernetes

```bash
# Construir y subir imagenes al registry
docker build -t tu-registry/backend:v1.0 app/backend/
docker push tu-registry/backend:v1.0

# REEMPLAZAR en kubernetes/ los valores de imagen:
# Busca "REEMPLAZAR" en los archivos yaml

# Desplegar
bash kubernetes/deploy.sh
```

---

## Estructura del repositorio

```
skeleton/
  app/
    backend/          Reemplaza con tu backend
    frontend/         Reemplaza con tu frontend
  aws/iam/            Politicas IAM (no modificar, agregar grupos segun necesidad)
  docs/
    architecture/     Diagramas y guia multi-cloud
    deployment/       Guia de despliegue y rollback
  kubernetes/         Manifiestos K8s (actualizar nombres de imagen)
  security/           Politicas de seguridad
  terraform/          Infraestructura como codigo (VPC, EKS, RDS, seguridad)
  disaster-recovery/  Plan DR con RTO 4h / RPO 24h
  docker-compose.yml  Entorno local de desarrollo
```

---

## Documentacion importante

| Documento | Descripcion |
|---|---|
| `docs/architecture/MULTI_CLOUD_SERVICES.md` | Como implementar tu proveedor cloud |
| `docs/deployment/DEPLOYMENT_GUIDE.md` | Despliegue completo a produccion |
| `docs/deployment/ROLLBACK_GUIDE.md` | Procedimiento de rollback de emergencia |
| `docs/IAM_SECURITY_POLICIES.md` | Politicas IAM y grupos de acceso |
| `disaster-recovery/runbooks/DR_PLAN.md` | Plan de recuperacion ante desastres |
| `terraform/README.md` | Uso de los modulos Terraform |
| `kubernetes/README.md` | Manifiestos Kubernetes |

---

**Tiempo estimado para adaptar la plataforma a tu aplicacion:** 2-3 dias para un equipo con experiencia en Cloud. La infraestructura esta lista; solo se reemplaza la capa de aplicacion.
