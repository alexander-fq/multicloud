# Guia de Rollback - GovTech Cloud Migration Platform

Esta guia cubre los procedimientos de recuperacion ante fallos en el despliegue.

## Rollback Rapido de Kubernetes (< 2 minutos)

Cuando el ultimo deploy rompio algo:

```bash
# Ver historial de deployments
kubectl rollout history deployment/backend -n govtech
kubectl rollout history deployment/frontend -n govtech

# Rollback al deployment anterior
kubectl rollout undo deployment/backend -n govtech
kubectl rollout undo deployment/frontend -n govtech

# Verificar que el rollback fue exitoso
kubectl rollout status deployment/backend -n govtech
kubectl rollout status deployment/frontend -n govtech
kubectl get pods -n govtech
```

Rollback a una version especifica:
```bash
# Ver las revisiones disponibles con detalle
kubectl rollout history deployment/backend -n govtech --revision=2

# Rollback a una revision especifica
kubectl rollout undo deployment/backend -n govtech --to-revision=2
```

## Rollback de Imagen Docker

Cuando el problema es la imagen Docker (no la configuracion):

```bash
# Ver la imagen actual del deployment
kubectl get deployment backend -n govtech -o jsonpath='{.spec.template.spec.containers[0].image}'

# Cambiar a una version anterior de ECR
ECR_REGISTRY="835960996869.dkr.ecr.us-east-1.amazonaws.com"

kubectl set image deployment/backend \
  backend=$ECR_REGISTRY/govtech-backend:<VERSION_ANTERIOR> \
  -n govtech

kubectl set image deployment/frontend \
  frontend=$ECR_REGISTRY/govtech-frontend:<VERSION_ANTERIOR> \
  -n govtech

# Verificar
kubectl rollout status deployment/backend -n govtech
```

Ver versiones disponibles en ECR:
```bash
aws ecr list-images \
  --repository-name govtech-backend \
  --region us-east-1 \
  --query 'imageIds[*].imageTag' \
  --output table
```

## Rollback de Base de Datos (RDS)

### Restaurar desde snapshot automatico

```bash
# Listar snapshots disponibles
aws rds describe-db-snapshots \
  --db-instance-identifier govtech-dev-postgres \
  --region us-east-1 \
  --query 'DBSnapshots[*].{Fecha:SnapshotCreateTime, ID:DBSnapshotIdentifier, Estado:Status}' \
  --output table

# Restaurar a un nuevo identificador (NO sobreescribe el existente)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier govtech-dev-postgres-restored \
  --db-snapshot-identifier <SNAPSHOT_ID> \
  --db-instance-class db.t3.micro \
  --region us-east-1

# Esperar a que este disponible (puede tardar 10-15 minutos)
aws rds wait db-instance-available \
  --db-instance-identifier govtech-dev-postgres-restored

# Obtener el nuevo endpoint
aws rds describe-db-instances \
  --db-instance-identifier govtech-dev-postgres-restored \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Actualizar los pods para usar la nueva BD

```bash
# Actualizar el ConfigMap con el nuevo host de RDS
kubectl edit configmap govtech-config -n govtech
# Cambiar DB_HOST al nuevo endpoint

# Reiniciar el backend para que tome la nueva configuracion
kubectl rollout restart deployment/backend -n govtech
kubectl rollout status deployment/backend -n govtech
```

## Rollback de Terraform

Cuando los cambios de infraestructura causaron problemas:

```bash
cd terraform/environments/dev

# Ver el estado actual
terraform show

# Ver el historial de cambios (si usas Terraform Cloud)
# terraform show <ID_DE_RUN_ANTERIOR>

# Revertir al estado anterior manualmente:
# 1. Descargar el state file anterior de S3
aws s3 cp s3://govtech-terraform-state-835960996869/dev/terraform.tfstate terraform.tfstate.backup

# 2. Inspeccionar el state anterior
# 3. Aplicar la infraestructura del state anterior (proceso manual)

# Si lo que fallo fue un modulo especifico:
terraform apply -target=module.networking
terraform apply -target=module.eks
```

## Recuperacion de Desastre Completo

Si el cluster EKS o la region completa esta caida:

### Fase 1: Infraestructura (15-30 minutos)
```bash
cd terraform/environments/prod

# El state esta en S3 (sobrevive a la caida del cluster)
terraform init
terraform plan
terraform apply
```

### Fase 2: Configuracion del cluster (5 minutos)
```bash
# Conectar kubectl al nuevo cluster
aws eks update-kubeconfig --name govtech-prod --region us-east-1

# Re-instalar componentes
helm install aws-load-balancer-controller ...  # (ver DEPLOYMENT_GUIDE.md)
helm install prometheus ...
```

### Fase 3: Secrets (5 minutos)
```bash
# Los secrets NO estan en git ni en el state de Terraform
# Recrear manualmente (o desde AWS Secrets Manager si se configuro)
kubectl create secret generic govtech-secrets \
  --from-literal=DB_PASSWORD=<password> \
  --from-literal=DB_USER=govtech_admin \
  --from-literal=DB_NAME=govtech \
  --from-literal=JWT_SECRET=<jwt-secret> \
  -n govtech
```

### Fase 4: Despliegue (10 minutos)
```bash
./kubernetes/deploy.sh prod
```

### Fase 5: Restaurar base de datos
```bash
# Si la BD se perdio (la VPC se destruyo, el PVC se borro):
# Restaurar desde el ultimo snapshot de RDS (ver seccion anterior)
```

## Checklist de Rollback

Ante cualquier incidente:

- [ ] Identificar si el problema es: codigo, infraestructura o base de datos
- [ ] Si es codigo: rollback de Kubernetes (< 2 min)
- [ ] Si es imagen: kubectl set image con version anterior
- [ ] Verificar health check: `curl <URL>/api/health`
- [ ] Verificar base de datos: `curl <URL>/api/health/database`
- [ ] Ver logs: `kubectl logs -f deploy/backend -n govtech`
- [ ] Notificar al equipo del incidente y la accion tomada
- [ ] Documentar la causa raiz despues de estabilizar

## Contactos de Emergencia

| Rol | Responsabilidad |
|---|---|
| Infraestructura | VPC, EKS, Terraform |
| Deployment | Kubernetes, Docker |
| DevOps | CI/CD, Monitoring |
