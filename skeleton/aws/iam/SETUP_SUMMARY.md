# Resumen de Configuracion IAM - GovTech Cloud Migration Platform

**Cuenta AWS**: 835960996869
**Region**: us-east-1
**Script de setup**: `setup-iam-v2.sh`
**Principio**: Minimo privilegio con jerarquia funcional de 3 niveles

---

## Estructura Actual

```
IAM Resources
|
+-- Custom Policies (13)
|   |
|   +-- Nivel 1 - Critico
|   |   +-- GovTech-IAM-EKS-Roles      (crear roles para EKS)
|   |   +-- GovTech-S3-Admin           (gestion completa S3)
|   |   +-- GovTech-Terraform-State    (acceso a estado Terraform)
|   |   +-- GovTech-RDS-Admin          (administracion base de datos)
|   |
|   +-- Nivel 2 - Operacional
|   |   +-- GovTech-ECR-Admin          (push/pull imagenes Docker)
|   |   +-- GovTech-ECR-ReadOnly       (solo pull imagenes)
|   |   +-- GovTech-EKS-Deploy         (aplicar manifests Kubernetes)
|   |   +-- GovTech-ALB-Controller     (balanceador de carga)
|   |   +-- GovTech-AutoScaling        (escalado automatico)
|   |   +-- GovTech-CICD-Access        (pipelines CI/CD)
|   |
|   +-- Nivel 3 - Solo Lectura
|       +-- GovTech-Secrets-Read       (leer credenciales)
|       +-- GovTech-Monitoring         (metricas y alertas)
|       +-- GovTech-Security-Auditor   (auditoria y compliance)
|
+-- Groups (10 grupos funcionales)
|   |
|   +-- NIVEL 1 CRITICO
|   |   +-- GovTech-Network-Admin      (VPC, subnets, security groups)
|   |   +-- GovTech-EKS-Admin          (cluster EKS, node groups)
|   |   +-- GovTech-Database-Admin     (RDS: crear, modificar, snapshots)
|   |   +-- GovTech-Terraform-Operator (estado Terraform, S3 admin)
|   |
|   +-- NIVEL 2 OPERACIONAL
|   |   +-- GovTech-Container-Deploy   (ECR push, kubectl apply)
|   |   +-- GovTech-ALB-Operator       (load balancer, certificados)
|   |   +-- GovTech-CICD-Operator      (GitHub Actions OIDC, pipelines)
|   |
|   +-- NIVEL 3 SOLO LECTURA
|       +-- GovTech-Secrets-ReadOnly   (leer Secrets Manager)
|       +-- GovTech-Monitor-ReadOnly   (CloudWatch, GuardDuty)
|       +-- GovTech-Security-Auditor   (CloudTrail, Security Hub)
|
+-- Users
    +-- govtech-admin
        +-- Grupos: los 10 grupos funcionales
        +-- Nota: operador principal con acceso completo
        |          Los grupos estan disenados para escalar:
        |          cada nuevo usuario se incorpora asignandolo
        |          unicamente a los grupos de su funcion.
```

---

## Politicas por Grupo

| Grupo | Politicas AWS Managed | Politicas Custom |
|-------|-----------------------|-----------------|
| GovTech-Network-Admin | AmazonEC2FullAccess, AmazonVPCFullAccess | - |
| GovTech-EKS-Admin | AmazonEKSClusterPolicy | GovTech-IAM-EKS-Roles |
| GovTech-Database-Admin | - | GovTech-RDS-Admin |
| GovTech-Terraform-Operator | - | GovTech-Terraform-State, GovTech-S3-Admin |
| GovTech-Container-Deploy | - | GovTech-ECR-Admin, GovTech-EKS-Deploy |
| GovTech-ALB-Operator | - | GovTech-ALB-Controller, GovTech-AutoScaling |
| GovTech-CICD-Operator | - | GovTech-CICD-Access, GovTech-ECR-ReadOnly |
| GovTech-Secrets-ReadOnly | - | GovTech-Secrets-Read |
| GovTech-Monitor-ReadOnly | CloudWatchReadOnlyAccess | GovTech-Monitoring |
| GovTech-Security-Auditor | SecurityAudit | GovTech-Security-Auditor |

---

## Jerarquia de Acceso

La estructura sigue tres niveles de riesgo:

**Nivel 1 - Critico**: un actor malicioso puede destruir infraestructura completa.
Requiere MFA obligatorio, acceso temporal (max 8 horas), y registro inmediato en CloudTrail.

**Nivel 2 - Operacional**: un actor malicioso puede comprometer la aplicacion pero no destruir infraestructura.
Requiere MFA obligatorio, revision mensual de accesos.

**Nivel 3 - Solo lectura**: un actor malicioso solo puede exfiltrar informacion, no modificar ni eliminar.
Requiere MFA recomendado, revision trimestral.

---

## Ejecutar Setup

```bash
cd aws/iam
./setup-iam-v2.sh
```

El script realiza los siguientes pasos:
1. Verifica credenciales AWS (STS get-caller-identity)
2. Opcionalmente elimina grupos anteriores (GovTech-Infrastructure, GovTech-Deployment, GovTech-DevOps)
3. Crea 13 politicas custom desde los archivos JSON en `/policies/`
4. Crea 10 grupos funcionales
5. Asigna politicas a cada grupo
6. Crea el usuario `govtech-admin`
7. Asocia `govtech-admin` a los 10 grupos

---

## Verificacion

```bash
# Ver todos los grupos del proyecto
aws iam list-groups \
  --query 'Groups[?starts_with(GroupName, `GovTech`)].GroupName' \
  --output table

# Ver politicas de un grupo especifico
aws iam list-attached-group-policies \
  --group-name GovTech-EKS-Admin \
  --query 'AttachedPolicies[].PolicyName' \
  --output table

# Ver grupos del usuario operador
aws iam list-groups-for-user \
  --user-name govtech-admin \
  --query 'Groups[].GroupName' \
  --output table

# Contar cuantas politicas custom existen
aws iam list-policies --scope Local \
  --query 'Policies[?starts_with(PolicyName, `GovTech`)].PolicyName' \
  --output table
```

---

## Tests de Seguridad

### Test 1: El usuario puede listar repositorios ECR

```bash
aws ecr describe-repositories
# Debe funcionar (grupo GovTech-Container-Deploy)
```

### Test 2: El usuario puede leer secrets

```bash
aws secretsmanager list-secrets
# Debe funcionar (grupo GovTech-Secrets-ReadOnly)
```

### Test 3: El usuario puede ver logs de CloudWatch

```bash
aws logs describe-log-groups
# Debe funcionar (grupo GovTech-Monitor-ReadOnly)
```

### Test 4: El usuario NO puede modificar usuarios IAM

```bash
aws iam create-user --user-name test-user
# Debe fallar con AccessDenied (ningun grupo tiene este permiso)
```

### Test 5: El usuario NO puede acceder a Billing

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
# Debe fallar con AccessDenied
```

---

## Onboarding de un Nuevo Usuario

### Paso 1: Crear el usuario

```bash
aws iam create-user --user-name nombre.apellido
```

### Paso 2: Asignar solo el grupo necesario para su funcion

```bash
# Ejemplo: un SRE solo necesita monitoreo
aws iam add-user-to-group \
  --user-name nombre.apellido \
  --group-name GovTech-Monitor-ReadOnly

# Si tambien necesita ver secrets para diagnostico
aws iam add-user-to-group \
  --user-name nombre.apellido \
  --group-name GovTech-Secrets-ReadOnly
```

### Paso 3: Crear acceso a consola con password temporal

```bash
aws iam create-login-profile \
  --user-name nombre.apellido \
  --password "TempPass2026!" \
  --password-reset-required
```

### Paso 4: Al terminar una tarea temporal, revocar acceso

```bash
# Ejemplo: acceso temporal a base de datos para mantenimiento
aws iam remove-user-from-group \
  --user-name nombre.apellido \
  --group-name GovTech-Database-Admin
```

---

## Limpieza

Para eliminar TODA la configuracion IAM del proyecto:

```bash
cd aws/iam
./cleanup-iam.sh
# Confirmar escribiendo: DELETE
```

Esto eliminara:
- Usuario govtech-admin y sus access keys
- Los 10 grupos funcionales
- Las 13 politicas custom

---

## Proximos Pasos Recomendados

1. [x] Ejecutar setup-iam-v2.sh y verificar 10 grupos creados
2. [ ] Activar MFA en el usuario govtech-admin
3. [ ] Configurar CloudTrail con alertas para grupos de Nivel 1
4. [ ] Rotar access keys cada 90 dias (crear recordatorio)
5. [ ] Revisar accesos activos mensualmente en CloudTrail
6. [ ] Para equipos: asignar a cada persona solo los grupos de su funcion

---

## Recursos

- [README.md](README.md) - Descripcion completa de grupos y politicas
- [IAM_HIERARCHY.md](IAM_HIERARCHY.md) - Jerarquia funcional y escenarios de equipo
- [setup-iam-v2.sh](setup-iam-v2.sh) - Script de configuracion actual
- [cleanup-iam.sh](cleanup-iam.sh) - Script de limpieza
- [../../docs/IAM_SECURITY_POLICIES.md](../../docs/IAM_SECURITY_POLICIES.md) - Politicas detalladas en JSON

---

**Creado**: 2026-02-12
**Actualizado**: 2026-02-23
**Version**: 2.0.0
**Estado**: Configuracion activa en cuenta 835960996869
