# Guía de Configuración AWS - No Usar Root Account

## Resumen Ejecutivo

NUNCA uses la cuenta root de AWS para trabajo diario. Esta guía te ayuda a crear un IAM User con permisos adecuados.

---

## Paso 1: Crear IAM User (Consola AWS)

### 1.1 Acceder a IAM
1. Login en AWS Console como root
2. Buscar "IAM" en el buscador superior
3. Click en "IAM"

### 1.2 Crear Usuario
1. Menu izquierdo → Users
2. Click "Add users" o "Create user"
3. Configuración:

```
User name: govtech-admin

Access type:
✅ Programmatic access (AWS CLI, Terraform, kubectl)
✅ AWS Management Console access (Acceso web)

Console password: [Tu password seguro]
✅ Require password reset
```

---

## Paso 2: Permisos Necesarios para el Proyecto

### Para Desarrollo (Permisos Amplios)

Adjuntar estas AWS Managed Policies:

| Política | Para qué sirve |
|----------|----------------|
| AmazonEC2FullAccess | Crear/gestionar instancias EC2, Security Groups |
| AmazonEKSClusterPolicy | Crear/gestionar clusters EKS (Kubernetes) |
| AmazonEKSWorkerNodePolicy | Gestionar nodes del cluster |
| AmazonEKS_CNI_Policy | Networking dentro de EKS |
| AmazonEC2ContainerRegistryFullAccess | ECR (Docker Registry) |
| AmazonRDSFullAccess | Base de datos PostgreSQL |
| AmazonS3FullAccess | Almacenamiento de objetos |
| AmazonVPCFullAccess | Redes (VPC, Subnets, Gateways) |
| CloudWatchFullAccess | Logs y métricas |
| IAMFullAccess | Gestionar permisos (usar con cuidado) |

### Cómo Adjuntarlas
1. En "Set permissions" → "Attach existing policies directly"
2. Buscar cada política
3. Marcar checkbox
4. Next → Review → Create

---

## Paso 3: Guardar Credenciales

Después de crear el usuario verás:

```
Access key ID: AKIAIOSFODNN7EXAMPLE
Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

⚠️ GUARDA ESTAS CREDENCIALES AHORA ⚠️
```

**Download .csv** y guárdalo en lugar seguro.

---

## Paso 4: Habilitar MFA (RECOMENDADO)

### ¿Por qué?
- Capa extra de seguridad
- Si roban tu password, no pueden entrar sin tu teléfono

### Pasos:
1. IAM → Users → [tu usuario] → Security credentials
2. Multi-factor authentication (MFA)
3. Assign MFA device
4. Virtual MFA device (Google Authenticator - GRATIS)
5. Escanear QR
6. Ingresar 2 códigos
7. Done!

---

## Paso 5: Cerrar Root y Login como IAM User

1. Cerrar sesión root
2. Login URL: `https://[ACCOUNT_ID].signin.aws.amazon.com/console`
3. Account ID: [tu número de 12 dígitos]
4. Username: govtech-admin
5. Password: [tu password]
6. MFA code (si lo configuraste)

---

## Paso 6: Configurar AWS CLI

### 6.1 Instalar AWS CLI

**Linux/WSL:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

**Windows:**
- Descargar: https://awscli.amazonaws.com/AWSCLIV2.msi
- Ejecutar instalador
- Abrir PowerShell: `aws --version`

### 6.2 Configurar Credenciales

```bash
aws configure

# Ingresar:
AWS Access Key ID: [tu access key]
AWS Secret Access Key: [tu secret key]
Default region name: us-east-1
Default output format: json
```

Esto crea el archivo `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Y `~/.aws/config`:
```ini
[default]
region = us-east-1
output = json
```

### 6.3 Verificar Configuración

```bash
# Ver tu identidad
aws sts get-caller-identity

# Output esperado:
{
    "UserId": "AIDAI23EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/govtech-admin"
}

# Listar regiones disponibles
aws ec2 describe-regions --output table

# Listar tus S3 buckets (debería estar vacío)
aws s3 ls
```

---

## Paso 7: Configurar Perfiles (Opcional)

Si trabajas con múltiples cuentas/proyectos:

```bash
# Configurar perfil adicional
aws configure --profile proyecto2

# Usar perfil específico
aws s3 ls --profile proyecto2

# O exportar variable de entorno
export AWS_PROFILE=proyecto2
```

---

## Buenas Prácticas de Seguridad

### ✅ HACER:
- Usar IAM User para trabajo diario
- Habilitar MFA en root account
- Habilitar MFA en IAM users
- Rotar Access Keys cada 90 días
- Usar permisos mínimos necesarios (least privilege)
- Usar IAM Roles en EC2/EKS en vez de hardcodear keys
- Guardar credenciales en AWS Secrets Manager (no en código)

### ❌ NO HACER:
- Usar root account para trabajo diario
- Compartir credenciales
- Commitear access keys a Git
- Dejar access keys en código
- Dar permisos administrativos innecesarios
- Usar access keys sin MFA

---

## Troubleshooting

### "The security token included in the request is invalid"
- Access Key inválida o expirada
- Regenerar en IAM → Users → Security credentials → Create access key

### "Access Denied" al crear recursos
- Tu IAM User no tiene permisos suficientes
- Verificar políticas adjuntas en IAM Console

### "MFA device not found"
- No configuraste MFA pero la política lo requiere
- Configurar MFA o quitar requisito

### Region incorrecta
```bash
# Ver región actual
aws configure get region

# Cambiar región
aws configure set region us-east-1
```

---

## Siguiente Paso

Una vez configurado:
1. ✅ IAM User creado con permisos
2. ✅ AWS CLI configurado
3. ✅ Credenciales funcionando

**Ahora puedes crear:**
- ECR repositories (para Docker images)
- VPC y networking
- EKS cluster
- RDS database
- S3 buckets

Continuar con: `INFRASTRUCTURE_TASKS.md`

---

## Comandos Útiles

```bash
# Ver tu identidad
aws sts get-caller-identity

# Listar regiones
aws ec2 describe-regions --query "Regions[].RegionName" --output table

# Listar availability zones
aws ec2 describe-availability-zones --region us-east-1

# Listar VPCs
aws ec2 describe-vpcs

# Listar ECR repos
aws ecr describe-repositories

# Listar EKS clusters
aws eks list-clusters

# Verificar acceso a S3
aws s3 ls

# Ver costos actuales (requiere permisos de billing)
aws ce get-cost-and-usage --time-period Start=2025-02-01,End=2025-02-10 --granularity MONTHLY --metrics BlendedCost
```

---

## Costos Estimados

Con los permisos configurados, estos son los costos aproximados:

| Servicio | Tipo | Costo/mes (Dev) | Costo/mes (Prod) |
|----------|------|-----------------|------------------|
| EKS Cluster | Obligatorio | $73 | $73 |
| EC2 Nodes | Obligatorio | $30 (2x t3.micro) | $150 (3x t3.medium) |
| RDS PostgreSQL | Opcional | $15 (t3.micro) | $60 (t3.small Multi-AZ) |
| ALB | Obligatorio | $16 | $16 |
| EBS Volumes | Obligatorio | $5 (50GB) | $10 (100GB) |
| ECR | Obligatorio | $1-2 | $5 |
| CloudWatch | Opcional | $5 | $20 |
| **TOTAL** | | **~$145/mes** | **~$334/mes** |

**Free Tier (primeros 12 meses):**
- 750 horas EC2 t2.micro/t3.micro (GRATIS)
- 750 horas RDS t3.micro (GRATIS)
- 5GB S3 storage (GRATIS)

---

## Recursos Adicionales

- AWS IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- AWS CLI Reference: https://docs.aws.amazon.com/cli/
- AWS Free Tier: https://aws.amazon.com/free/
- AWS Pricing Calculator: https://calculator.aws/

---

Creado por: GovTech Multi-Cloud Platform Team
Última actualización: 2026-02-10
