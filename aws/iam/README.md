# IAM Setup - GovTech Cloud Migration Platform

Este directorio contiene scripts y políticas para configurar IAM con el principio de **mínimo privilegio** basado en el documento [IAM_SECURITY_POLICIES.md](../../docs/IAM_SECURITY_POLICIES.md).

## Estructura

```
aws/iam/
├── README.md                           # Este archivo
├── setup-iam.sh                        # Script principal de configuración
├── cleanup-iam.sh                      # Script para limpiar/eliminar recursos
├── test-permissions.sh                 # Script para testear permisos
└── policies/                           # Políticas custom JSON
    ├── govtech-ecr-admin.json
    ├── govtech-terraform-state.json
    ├── govtech-rds-admin.json
    ├── govtech-eks-deploy.json
    ├── govtech-ecr-readonly.json
    ├── govtech-secrets-read.json
    ├── govtech-cicd-access.json
    ├── govtech-monitoring.json
    └── govtech-permission-boundary.json
```

## Requisitos Previos

1. **AWS CLI instalado y configurado**
   ```bash
   # Instalar AWS CLI (si no está instalado)
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Configurar credenciales de root
   aws configure
   ```

2. **Credenciales de root/admin con AdministratorAccess**
   - Access Key ID
   - Secret Access Key
   - Default region: `us-east-1`

3. **Permisos necesarios**:
   - IAM: Full Access (crear usuarios, grupos, políticas)
   - Account ID: 835960996869 (verificar con `aws sts get-caller-identity`)

## Uso Rápido

### 1. Configurar todo automáticamente

```bash
cd aws/iam
chmod +x setup-iam.sh
./setup-iam.sh
```

El script ejecutará:
1. Creará 9 políticas custom en IAM
2. Creará 3 grupos (Infrastructure, Deployment, DevOps)
3. Adjuntará políticas a grupos
4. Creará 3 usuarios (collab-infrastructure, collab-deployment, collab-devops)
5. Asignará usuarios a grupos
6. Aplicará permission boundaries
7. (Opcional) Creará access keys programáticos
8. (Opcional) Creará console login passwords

### 2. Verificar la configuración

```bash
# Ver grupos creados
aws iam list-groups

# Ver usuarios creados
aws iam list-users

# Ver políticas de un grupo
aws iam list-attached-group-policies --group-name GovTech-Infrastructure

# Ver usuarios en un grupo
aws iam get-group --group-name GovTech-Infrastructure
```

### 3. Distribuir credenciales

Después de ejecutar el script, encontrarás:
- `credentials-collab-infrastructure.json`
- `credentials-collab-deployment.json`
- `credentials-collab-devops.json`

**IMPORTANTE**:
- Distribuir estos archivos de forma **segura** (encrypted email, 1Password, etc.)
- **NO** compartir por Slack, email sin cifrar, o GitHub
- **ELIMINAR** los archivos locales después de distribuir

### 4. Configuración de colaboradores

Cada colaborador debe ejecutar:

```bash
# Configurar AWS CLI con sus credenciales
aws configure

# Ingresar:
# - AWS Access Key ID: [del archivo credentials-*.json]
# - AWS Secret Access Key: [del archivo credentials-*.json]
# - Default region: us-east-1
# - Default output format: json

# Verificar configuración
aws sts get-caller-identity
```

## Grupos y Permisos

### GovTech-Infrastructure (Colaborador A)
**Usuario**: `collab-infrastructure`

**Responsabilidades**: Docker + Terraform + Infraestructura base

**Tiene acceso a**:
- EC2 (Full Access)
- VPC (Full Access)
- EKS Cluster (crear, modificar)
- ECR (crear repos, push images)
- RDS (crear instancias)
- S3 (Terraform state)

**NO tiene acceso a**:
- Crear usuarios IAM
- Eliminar bases de datos de producción
- Trabajar fuera de us-east-1

### GovTech-Deployment (Colaborador B)
**Usuario**: `collab-deployment`

**Responsabilidades**: Kubernetes + Deployments

**Tiene acceso a**:
- EKS (kubectl access, deployments)
- ECR (pull images, NO push)
- EBS/EFS (crear volumes)
- Secrets Manager (leer dev/staging, NO prod)
- CloudWatch Logs (leer)

**NO tiene acceso a**:
- Crear infraestructura base
- Push a ECR
- Leer secrets de producción

### GovTech-DevOps (Colaborador C)
**Usuario**: `collab-devops`

**Responsabilidades**: CI/CD + Monitoring

**Tiene acceso a**:
- CloudWatch (Full Access)
- ECR (push desde CI/CD)
- EKS (deploy desde CI/CD)
- Secrets Manager (CICD secrets)
- S3 (build artifacts)
- IAM (crear roles para GitHub Actions)

**NO tiene acceso a**:
- Crear infraestructura base
- Modificar VPC/networking
- Crear usuarios IAM

## Testing de Permisos

Ejecutar tests para verificar que los permisos funcionan correctamente:

```bash
chmod +x test-permissions.sh
./test-permissions.sh
```

O manualmente:

```bash
# Como collab-infrastructure (debe funcionar)
aws ecr create-repository --repository-name test-repo
aws vpc create-vpc --cidr-block 10.0.0.0/16

# Como collab-infrastructure (debe FALLAR)
aws iam create-user --user-name hacker
# Output esperado: AccessDenied

# Como collab-deployment (debe funcionar)
aws eks list-clusters
aws ecr describe-repositories

# Como collab-deployment (debe FALLAR)
aws ecr create-repository --repository-name hack
aws secretsmanager get-secret-value --secret-id govtech/prod/db-password
```

## Configuración de MFA (Recomendado)

Para habilitar MFA en cada usuario:

1. Login a AWS Console: https://835960996869.signin.aws.amazon.com/console
2. IAM → Users → [username]
3. Security credentials tab
4. Assigned MFA device → Manage
5. Virtual MFA device (Google Authenticator, Authy, etc.)
6. Escanear QR code con la app
7. Ingresar dos códigos consecutivos

## Auditoría y Logs

### CloudTrail

Todas las acciones quedan registradas en CloudTrail. Para ver logs:

```bash
# Ver últimas 10 acciones
aws cloudtrail lookup-events --max-results 10

# Ver acciones de un usuario específico
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=collab-infrastructure \
  --max-results 20
```

### IAM Access Analyzer

Revisar accesos con IAM Access Analyzer:

```bash
# Listar analyzers
aws accessanalyzer list-analyzers

# Listar findings
aws accessanalyzer list-findings --analyzer-arn <arn>
```

## Rotación de Access Keys

**Frecuencia recomendada**: Cada 90 días

```bash
# 1. Crear nueva access key
aws iam create-access-key --user-name collab-infrastructure

# 2. Actualizar AWS CLI con nueva key
aws configure

# 3. Eliminar access key antigua
aws iam delete-access-key --user-name collab-infrastructure --access-key-id AKIA...
```

## Limpieza (Eliminar todo)

Para eliminar todos los recursos creados:

```bash
chmod +x cleanup-iam.sh
./cleanup-iam.sh
```

**ADVERTENCIA**: Esto eliminará:
- Todos los usuarios creados (collab-*)
- Todos los grupos creados (GovTech-*)
- Todas las políticas custom (GovTech-*)
- Access keys asociados

## Troubleshooting

### Error: "User already exists"

Si el script falla porque los usuarios ya existen, puedes:
1. Eliminar todo con `./cleanup-iam.sh`
2. O continuar - el script saltará recursos existentes

### Error: "Access Denied"

Verifica que:
1. AWS CLI está configurado con credenciales de root/admin
2. Las credenciales tienen AdministratorAccess
3. La región es us-east-1

```bash
aws sts get-caller-identity
aws iam get-user
```

### Error: "Policy already exists"

Normal si ejecutas el script múltiples veces. El script saltará políticas existentes.

## Costos

La gestión de IAM es **GRATUITA**. No hay costos por:
- Usuarios IAM
- Grupos IAM
- Políticas IAM
- Access keys

Costos asociados solo de servicios complementarios:
- CloudTrail: ~$2-5/mes
- AWS Secrets Manager: ~$1-3/mes

## Seguridad Best Practices

1. **Nunca uses root account para trabajo diario**
2. **Habilita MFA en todos los usuarios**
3. **Rota access keys cada 90 días**
4. **Revisa permisos mensualmente**
5. **Audita CloudTrail regularmente**
6. **No compartas credenciales**
7. **Usa HTTPS/TLS siempre**
8. **Elimina usuarios inactivos**

## Referencias

- [IAM Security Policies - Documento completo](../../docs/IAM_SECURITY_POLICIES.md)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Least Privilege Principle](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege)
- [Permission Boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)

## Soporte

Para issues o preguntas:
- Revisar [IAM_SECURITY_POLICIES.md](../../docs/IAM_SECURITY_POLICIES.md)
- Contactar al administrador root
- Abrir un ticket en el proyecto

---

**Última actualización**: 2026-02-11
**Versión**: 1.0.0
**Mantenedor**: Root Administrator
