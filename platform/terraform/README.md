# Terraform - GovTech Infrastructure

Infraestructura como Codigo (IaC) para el proyecto GovTech Cloud Migration Platform.

## Estructura

```
terraform/
├── main.tf                    # Punto de entrada: llama todos los modulos + ECR + OIDC
├── variables.tf               # Variables globales
├── terraform.tfvars.example   # Template de variables (NO commitear .tfvars real)
├── modules/
│   ├── networking/            # VPC, Subnets, Internet Gateway, NAT Gateway, Security Groups
│   ├── kubernetes-cluster/    # EKS Cluster + Node Groups + OIDC Provider
│   ├── database/              # RDS PostgreSQL Multi-AZ
│   ├── storage/               # S3 buckets + Lifecycle Rules + IRSA
│   └── security/              # WAF, GuardDuty, KMS, CloudTrail, Security Hub,
│                              # Secrets Manager, Cost Anomaly Detection
└── environments/
    ├── dev/                   # Desarrollo: instancias pequeñas, 1 NAT GW, backups 3 dias
    ├── staging/               # Staging: 3 AZs igual que prod, sin Multi-AZ
    └── prod/                  # Produccion: Multi-AZ, backups 30 dias, mas nodos
```

## Pre-requisitos

- Terraform >= 1.5.0
- AWS CLI configurado (`aws configure`)
- Permisos IAM necesarios (ver `aws/iam/policies/`)
- Bucket S3 para estado remoto (ya creado: `govtech-terraform-state-835960996869`)

## Primer Uso

```bash
# 1. Ir al ambiente deseado
cd terraform/environments/dev

# 2. Inicializar (descarga providers y configura backend S3)
terraform init

# 3. Ver que va a crear/cambiar
terraform plan

# 4. Aplicar cambios
export TF_VAR_db_password="tu-password-seguro"
terraform apply
```

## Ambientes

| Ambiente | Cluster EKS | Nodos | RDS | Multi-AZ | Costo ~|
|---|---|---|---|---|---|
| dev | govtech-dev | 2-4 x t3.medium | db.t3.micro | No | $180/mes |
| staging | govtech-staging | 2-6 x t3.small | db.t3.small | No | $200/mes |
| prod | govtech-prod | 3-10 x t3.medium | db.t3.small | **Si** | $335/mes |

## Modulos

### networking
Red base de AWS donde viven todos los recursos:
- **VPC**: red virtual aislada (10.0/10.1/10.2.0.0/16 por ambiente)
- **Subnets publicas**: Load Balancers y NAT Gateways (acceso desde internet)
- **Subnets privadas**: EKS nodes y RDS (NO accesibles desde internet)
- **Internet Gateway**: conecta subnets publicas con internet
- **NAT Gateways**: permiten salida a internet desde subnets privadas
- **Security Groups**: firewall por recurso (EKS, RDS)

### kubernetes-cluster
Cluster Kubernetes gestionado en AWS (EKS):
- **EKS Control Plane**: API server, scheduler, etcd (gestionado por AWS)
- **Node Group**: EC2 instances donde corren los pods (en subnets privadas)
- **IAM Roles**: permisos minimos para cluster y nodos
- **OIDC Provider**: permite que pods tengan roles IAM individuales (IRSA)

### database
Base de datos PostgreSQL gestionada (RDS):
- **DB Instance**: PostgreSQL 14, encriptado con KMS
- **Subnet Group**: en subnets privadas, sin acceso desde internet
- **Multi-AZ** (solo prod): failover automatico en ~1-2 min si hay fallo

### storage
Almacenamiento de archivos S3:
- **S3 Bucket**: con versionado, encriptacion AES-256, acceso publico bloqueado
- **Lifecycle Rules**: mueve archivos viejos a Glacier (ahorro de costos)
- **IRSA**: los pods acceden a S3 sin credenciales en el codigo

### security (nuevo)
Proteccion de la infraestructura:
- **KMS**: clave de encriptacion centralizada para DB, S3, Secrets Manager, logs
- **CloudTrail**: auditoria de TODAS las acciones AWS (retencion 1 año en prod)
- **GuardDuty**: IDS automatico (detecta mineria de crypto, C2, exfiltracion)
- **Security Hub**: panel centralizado con CIS Benchmark y AWS Best Practices
- **WAF**: firewall web con 5 reglas (reputacion IPs, OWASP, SQLi, rate limit)
- **Secrets Manager**: credenciales de DB y JWT encriptadas con KMS, con rotacion
- **Cost Anomaly Detection**: alerta si el gasto sube de forma inusual (ML)

## ECR Repositories (root terraform)

Los repositorios de imagenes Docker se crean en el `terraform/main.tf` raiz (son globales):
- `govtech-backend`: encriptado con KMS, scan en cada push, retiene 10 imagenes
- `govtech-frontend`: misma configuracion

```bash
# Para crear los repositorios ECR (una sola vez)
cd terraform
terraform init
terraform apply
# Output: ecr_backend_url, ecr_frontend_url
```

## OIDC para GitHub Actions

El root `terraform/main.tf` crea el OIDC provider que permite a GitHub Actions
obtener credenciales AWS temporales sin usar access keys de larga duracion.

```bash
# Despues de terraform apply, copiar el output a GitHub Secrets:
terraform output github_actions_role_arn
# → Agregar como AWS_DEPLOY_ROLE_ARN en GitHub Secrets
```

## Secrets Manager - Despues del apply

Despues de crear la infraestructura, actualizar los secrets con valores reales:

```bash
# Credenciales de la base de datos
aws secretsmanager put-secret-value \
  --secret-id govtech/dev/db-credentials \
  --secret-string '{
    "username": "govtech_admin",
    "password": "TU_PASSWORD_REAL",
    "host": "$(terraform output -raw db_endpoint | cut -d: -f1)",
    "port": "5432",
    "dbname": "govtech"
  }'

# JWT Secret
aws secretsmanager put-secret-value \
  --secret-id govtech/dev/jwt-secret \
  --secret-string '{"jwt_secret": "TU_JWT_SECRET_MIN_32_CARACTERES"}'
```

## Comandos Utiles

```bash
# Ver estado actual
terraform show

# Ver outputs (endpoint RDS, nombre cluster, ARN del WAF, etc.)
terraform output

# Formatear codigo
terraform fmt -recursive

# Validar sintaxis
terraform validate

# Test de validacion completo
./tests/infrastructure/validate-terraform.sh
```

## Conectar kubectl al Cluster

```bash
# Dev
aws eks update-kubeconfig --name govtech-dev --region us-east-1

# Staging
aws eks update-kubeconfig --name govtech-staging --region us-east-1

# Prod
aws eks update-kubeconfig --name govtech-prod --region us-east-1

# Verificar conexion
kubectl get nodes
kubectl get pods -n govtech
```

## Estado Remoto (S3 Backend)

El estado se guarda en S3 con encriptacion, compartido por todos los colaboradores:

```
s3://govtech-terraform-state-835960996869/
├── terraform.tfstate          # Root (ECR, OIDC - global)
├── dev/terraform.tfstate      # Ambiente dev
├── staging/terraform.tfstate  # Ambiente staging
└── prod/terraform.tfstate     # Ambiente produccion
```

## Troubleshooting

**Error: "Error acquiring the state lock"**
```bash
terraform force-unlock <LOCK_ID>
```

**Error: "No valid credential sources found"**
```bash
aws configure  # O configurar via OIDC en el pipeline
```

**GuardDuty encontro una amenaza**: ver en Security Hub console o:
```bash
aws guardduty list-findings --detector-id $(terraform output guardduty_detector_id)
```
