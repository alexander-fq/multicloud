# IAM Setup - GovTech Cloud Migration Platform

## Principio de diseno

Cada grupo tiene acceso a **un solo dominio de responsabilidad**. Un usuario puede pertenecer a multiples grupos segun la tarea que realice. Si una cuenta es comprometida, el impacto queda limitado al dominio del grupo afectado.

## Estructura de grupos (10 grupos funcionales)

```
GovTech-Network-Admin
GovTech-EKS-Admin
GovTech-Database-Admin
GovTech-Terraform-Operator
GovTech-Container-Deploy
GovTech-ALB-Operator
GovTech-Secrets-ReadOnly
GovTech-CICD-Operator
GovTech-Monitor-ReadOnly
GovTech-Security-Auditor
```

## Que puede hacer cada grupo

| Grupo | Servicios permitidos | Cuando asignarlo |
|-------|---------------------|-----------------|
| GovTech-Network-Admin | VPC, Subnets, Security Groups, Internet Gateway, NAT | Cambios de red o firewall |
| GovTech-EKS-Admin | EKS Cluster, Node Groups, versiones Kubernetes | Administracion del cluster |
| GovTech-Database-Admin | RDS: create, modify, restore, snapshots | Mantenimiento de base de datos |
| GovTech-Terraform-Operator | S3 state bucket, lectura/escritura de estado | Ejecucion de Terraform apply |
| GovTech-Container-Deploy | ECR push/pull, kubectl apply/rollout | Despliegue de nuevas versiones |
| GovTech-ALB-Operator | Application Load Balancer, Target Groups, ACM | Cambios en balanceador o certificados |
| GovTech-Secrets-ReadOnly | Secrets Manager (solo lectura) | Acceso a credenciales para scripts |
| GovTech-CICD-Operator | GitHub Actions OIDC, CodePipeline | Configuracion de pipelines |
| GovTech-Monitor-ReadOnly | CloudWatch, GuardDuty, alertas (solo lectura) | Monitoreo y revision de metricas |
| GovTech-Security-Auditor | CloudTrail, Security Hub, IAM Access Analyzer (solo lectura) | Auditorias de seguridad y compliance |

## Politicas custom (13 archivos)

| Archivo | Politica creada | Usada por grupo |
|---------|----------------|-----------------|
| govtech-ecr-admin.json | GovTech-ECR-Admin | GovTech-Container-Deploy |
| govtech-ecr-readonly.json | GovTech-ECR-ReadOnly | GovTech-CICD-Operator |
| govtech-terraform-state.json | GovTech-Terraform-State | GovTech-Terraform-Operator |
| govtech-rds-admin.json | GovTech-RDS-Admin | GovTech-Database-Admin |
| govtech-eks-deploy.json | GovTech-EKS-Deploy | GovTech-Container-Deploy |
| govtech-secrets-read.json | GovTech-Secrets-Read | GovTech-Secrets-ReadOnly |
| govtech-cicd-access.json | GovTech-CICD-Access | GovTech-CICD-Operator |
| govtech-monitoring.json | GovTech-Monitoring | GovTech-Monitor-ReadOnly |
| govtech-alb-controller.json | GovTech-ALB-Controller | GovTech-ALB-Operator |
| govtech-autoscaling.json | GovTech-AutoScaling | GovTech-ALB-Operator |
| govtech-iam-eks-roles.json | GovTech-IAM-EKS-Roles | GovTech-EKS-Admin |
| govtech-s3-admin.json | GovTech-S3-Admin | GovTech-Terraform-Operator |
| govtech-security-auditor.json | GovTech-Security-Auditor | GovTech-Security-Auditor |

## Scripts disponibles

| Script | Descripcion |
|--------|-------------|
| `setup-iam-v2.sh` | Setup completo: crea 13 politicas, 10 grupos, usuario govtech-admin |
| `cleanup-iam.sh` | Elimina todos los recursos IAM del proyecto |
| `add-missing-permissions.sh` | Agrega permisos faltantes detectados en auditoria |

## Instalacion

```bash
cd aws/iam
./setup-iam-v2.sh
```

El script realiza los siguientes pasos interactivos:
1. Verifica credenciales AWS
2. Pregunta si eliminar la estructura anterior (opcional)
3. Crea las 13 politicas custom
4. Crea los 10 grupos funcionales
5. Asigna politicas a cada grupo
6. Crea el usuario `govtech-admin`
7. Pregunta si crear acceso a consola y/o access key

## Agregar un nuevo miembro al equipo

```bash
# Crear usuario
aws iam create-user --user-name nombre-apellido

# Asignar solo el grupo necesario para su funcion
aws iam add-user-to-group \
  --user-name nombre-apellido \
  --group-name GovTech-Monitor-ReadOnly

# Crear acceso a consola con password temporal
aws iam create-login-profile \
  --user-name nombre-apellido \
  --password "TempPass2026!" \
  --password-reset-required

# Si necesita acceso temporal a otro dominio:
aws iam add-user-to-group \
  --user-name nombre-apellido \
  --group-name GovTech-Database-Admin

# Al terminar la tarea, revocar el acceso temporal:
aws iam remove-user-from-group \
  --user-name nombre-apellido \
  --group-name GovTech-Database-Admin
```

## Reglas de acceso

- Nunca usar la cuenta root para tareas del dia a dia
- Activar MFA en todos los usuarios con acceso a consola
- Rotar access keys cada 90 dias
- Un usuario nuevo recibe solo el grupo minimo necesario
- Los grupos de acceso amplio se asignan temporalmente para tareas especificas
- Revisar accesos activos en CloudTrail mensualmente

## Verificar configuracion

```bash
# Ver todos los grupos del proyecto
aws iam list-groups \
  --query 'Groups[?starts_with(GroupName, `GovTech`)].GroupName' \
  --output table

# Ver politicas de un grupo
aws iam list-attached-group-policies \
  --group-name GovTech-EKS-Admin \
  --query 'AttachedPolicies[].PolicyName' \
  --output table

# Ver grupos de un usuario
aws iam list-groups-for-user \
  --user-name govtech-admin \
  --query 'Groups[].GroupName' \
  --output table

# Ver todos los usuarios del proyecto
aws iam list-users \
  --query 'Users[?starts_with(UserName, `govtech`)].{User:UserName,Creado:CreateDate}' \
  --output table
```
