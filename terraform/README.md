# Terraform - GovTech Infrastructure

Infraestructura como Codigo (IaC) para el proyecto GovTech Cloud Migration Platform.

## Estructura

```
terraform/
├── main.tf                    # Configuracion raiz (proveedor, backend)
├── variables.tf               # Variables globales
├── terraform.tfvars.example   # Template de variables (NO commitear .tfvars real)
├── modules/
│   ├── networking/            # VPC, Subnets, Internet Gateway, NAT Gateway
│   ├── kubernetes-cluster/    # EKS Cluster + Node Groups
│   ├── database/              # RDS PostgreSQL
│   └── storage/               # S3 buckets + IAM roles (IRSA)
└── environments/
    ├── dev/                   # Ambiente de desarrollo
    ├── staging/               # Ambiente de staging (similar a prod)
    └── prod/                  # Produccion (Multi-AZ, mas recursos)
```

## Pre-requisitos

- Terraform >= 1.5.0
- AWS CLI configurado (`aws configure`)
- Permisos IAM necesarios (ver `aws/iam/policies/`)
- Bucket S3 para estado remoto (ya creado: `govtech-terraform-state-835960996869`)

## Primer Uso

```bash
# 1. Ir al ambiente deseado
cd environments/dev

# 2. Inicializar (descarga providers y configura backend S3)
terraform init

# 3. Ver que va a crear/cambiar
terraform plan

# 4. Aplicar cambios
terraform apply
```

## Ambientes

| Ambiente | EKS Cluster | Nodos | RDS | Multi-AZ |
|---|---|---|---|---|
| dev | govtech-dev | 2-4 x t3.medium | db.t3.micro | No |
| staging | govtech-staging | 2-6 x t3.small | db.t3.small | No |
| prod | govtech-prod | 3-10 x t3.medium | db.t3.small | Si |

## Modulos

### networking
Crea la red de AWS donde viven todos los recursos:
- **VPC**: red virtual aislada
- **Subnets publicas**: donde viven los Load Balancers (accesibles desde internet)
- **Subnets privadas**: donde viven EKS, RDS (NO accesibles desde internet)
- **Internet Gateway**: permite que las subnets publicas accedan a internet
- **NAT Gateways**: permite que las subnets privadas accedan a internet
- **Security Groups**: firewall a nivel de recursos

### kubernetes-cluster
Crea el cluster de Kubernetes en AWS (EKS):
- **EKS Control Plane**: el cerebro de Kubernetes (gestionado por AWS)
- **Node Group**: los servidores donde corren los pods (EC2)
- **IAM Roles**: permisos para el cluster y los nodos
- **OIDC Provider**: permite que los pods asuman roles IAM sin credenciales (IRSA)

### database
Crea la base de datos PostgreSQL en RDS:
- **DB Instance**: el servidor de PostgreSQL
- **Subnet Group**: en que subnets privadas puede vivir
- **Parameter Group**: configuracion de PostgreSQL (logging, timezone)
- **IAM Role**: para Enhanced Monitoring (metricas del OS)

### storage
Crea buckets S3 para la aplicacion:
- **S3 Bucket**: almacenamiento de archivos
- **Lifecycle Rules**: mueve archivos viejos a storage mas barato automaticamente
- **IAM Role (IRSA)**: los pods acceden a S3 sin credenciales en el codigo

## Variables Importantes

**NUNCA commitear `.tfvars` con valores reales.**

Usar variable de entorno para el password:
```bash
export TF_VAR_db_password="tu-password-seguro"
terraform apply
```

## Comandos Utiles

```bash
# Ver estado actual
terraform show

# Ver outputs (endpoint RDS, nombre cluster, etc.)
terraform output

# Formatear archivos .tf
terraform fmt -recursive

# Validar sintaxis
terraform validate

# Planear destruccion (ver que se borraria)
terraform plan -destroy

# DESTRUIR el ambiente (CUIDADO en prod)
terraform destroy
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

El estado se guarda en S3 para que todo el equipo comparta el mismo estado:

- Dev: `s3://govtech-terraform-state-835960996869/dev/terraform.tfstate`
- Staging: `s3://govtech-terraform-state-835960996869/staging/terraform.tfstate`
- Prod: `s3://govtech-terraform-state-835960996869/prod/terraform.tfstate`

## Troubleshooting

**Error: "Error acquiring the state lock"**
```bash
# Otro proceso tiene el lock (verificar que no hay otro apply corriendo)
terraform force-unlock <LOCK_ID>
```

**Error: "No valid credential sources found"**
```bash
aws configure
# O exportar variables de entorno
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
```

**Pods no pueden conectarse a RDS**
Verificar que el Security Group de RDS permite trafico en puerto 5432 desde el Security Group de EKS.
