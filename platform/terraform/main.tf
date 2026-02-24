terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Backend S3 para estado compartido entre colaboradores
  # El estado de Terraform se guarda aqui para que todos trabajen sobre lo mismo
  backend "s3" {
    bucket  = "govtech-terraform-state-835960996869"
    key     = "terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
    # dynamodb_table = "govtech-terraform-locks"  # Descomentar para evitar conflictos concurrentes
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "govtech"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ============================================================
# LOCALS - Valores calculados reutilizados en todos los modulos
# ============================================================
locals {
  project_name = "govtech"
  account_id   = data.aws_caller_identity.current.account_id

  # Zonas de disponibilidad: usar 2 para dev (costo), 3 para prod (alta disponibilidad)
  availability_zones = var.environment == "prod" ? [
    "${var.aws_region}a",
    "${var.aws_region}b",
    "${var.aws_region}c"
  ] : [
    "${var.aws_region}a",
    "${var.aws_region}b"
  ]

  # Subnets publicas (para Load Balancers)
  public_subnet_cidrs = var.environment == "prod" ? [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ] : [
    "10.0.1.0/24",
    "10.0.2.0/24"
  ]

  # Subnets privadas (para EKS nodes y RDS)
  private_subnet_cidrs = var.environment == "prod" ? [
    "10.0.10.0/24",
    "10.0.11.0/24",
    "10.0.12.0/24"
  ] : [
    "10.0.10.0/24",
    "10.0.11.0/24"
  ]

  # Tipo de instancia segun ambiente
  node_instance_type = var.environment == "prod" ? "t3.large" : "t3.medium"
  # t3.medium = 2 vCPUs, 4GB RAM (~$30/mes)
  # t3.large  = 2 vCPUs, 8GB RAM (~$60/mes) - para produccion con mas carga

  # Numero de nodos segun ambiente
  node_min     = var.environment == "prod" ? 2 : 1
  node_max     = var.environment == "prod" ? 10 : 3
  node_desired = var.environment == "prod" ? 3 : 2
}

# Obtener informacion de la cuenta AWS actual
data "aws_caller_identity" "current" {}

# ============================================================
# MODULO 1: NETWORKING
# Crea: VPC, subnets publicas/privadas, Internet Gateway,
#        NAT Gateways, Route Tables, Security Groups
# ============================================================
module "networking" {
  source = "./modules/networking"

  project_name         = local.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = local.availability_zones
  public_subnet_cidrs  = local.public_subnet_cidrs
  private_subnet_cidrs = local.private_subnet_cidrs
}

# ============================================================
# MODULO 2: KUBERNETES CLUSTER (EKS)
# Crea: EKS Cluster, Node Group, IAM Roles, OIDC Provider
# Depende de: networking (necesita las subnets privadas)
# ============================================================
module "kubernetes" {
  source = "./modules/kubernetes-cluster"

  project_name       = local.project_name
  environment        = var.environment
  cluster_name       = "${local.project_name}-${var.environment}"
  vpc_id             = module.networking.vpc_id             # Requerido para configurar el cluster en la VPC
  subnet_ids         = module.networking.private_subnet_ids  # Nodos en subnets PRIVADAS
  node_instance_type = local.node_instance_type
  node_min_size      = local.node_min
  node_max_size      = local.node_max
  node_desired_size  = local.node_desired

  depends_on = [module.networking]
}

# ============================================================
# MODULO 3: DATABASE (RDS PostgreSQL)
# Crea: RDS instance, subnet group, parameter group
# Depende de: networking (necesita security group y subnets privadas)
# ============================================================
module "database" {
  source = "./modules/database"

  project_name      = local.project_name
  environment       = var.environment
  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.rds_security_group_id
  db_username       = var.db_username
  db_password       = var.db_password

  # RDS multi-AZ solo en produccion (costo vs disponibilidad)
  multi_az = var.environment == "prod" ? true : false

  depends_on = [module.networking]
}

# ============================================================
# MODULO 4: STORAGE (S3)
# Crea: Buckets S3 para backups, logs, artefactos
# ============================================================
module "storage" {
  source = "./modules/storage"

  project_name = local.project_name
  environment  = var.environment
  account_id   = local.account_id
}

# ============================================================
# MODULO 5: SECURITY
# Crea: WAF, GuardDuty, KMS, CloudTrail, Security Hub
# Este modulo protege toda la infraestructura
# Depende de: storage (usa el bucket de logs de S3)
# ============================================================
module "security" {
  source = "./modules/security"

  project_name = local.project_name
  environment  = var.environment
  account_id   = local.account_id
  aws_region   = var.aws_region
  logs_bucket  = module.storage.bucket_id

  depends_on = [module.storage]
}

# ============================================================
# OIDC PROVIDER para GitHub Actions
# Permite que GitHub Actions asuma un IAM Role sin necesitar
# AWS access keys almacenadas como secrets en GitHub.
# Como funciona:
# 1. GitHub genera un JWT token para el workflow
# 2. El workflow presenta ese token a AWS STS
# 3. AWS verifica el token con GitHub (OIDC)
# 4. AWS emite credenciales temporales (1 hora)
# ============================================================
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # Thumbprint del certificado raiz de GitHub OIDC
  # Este valor es estatico y publicado por GitHub
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = {
    Name    = "github-actions-oidc"
    Purpose = "CI/CD authentication without long-lived credentials"
  }
}

# IAM Role que GitHub Actions puede asumir
resource "aws_iam_role" "github_actions_deploy" {
  name = "govtech-github-actions-deploy"

  # Trust policy: solo GitHub Actions de este repositorio puede asumir este rol
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # IMPORTANTE: Reemplazar con la org/repo real de GitHub
            # Formato: "repo:ORGANIZACION/REPOSITORIO:*"
            "token.actions.githubusercontent.com:sub" = "repo:GovTechMX/cloud-migration-platform:*"
          }
        }
      }
    ]
  })

  tags = {
    Name    = "govtech-github-actions-deploy"
    Purpose = "Used by GitHub Actions CI/CD pipeline"
  }
}

# Permisos del rol de CI/CD: ECR (subir imagenes) + EKS (hacer deploys)
resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "govtech-github-actions-deploy-policy"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # ECR: subir y bajar imagenes Docker
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        # EKS: obtener kubeconfig para hacer deploys
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters"
        ]
        Resource = "arn:aws:eks:${var.aws_region}:${local.account_id}:cluster/${local.project_name}-*"
      }
    ]
  })
}

# ============================================================
# ECR REPOSITORIES - Registros de imagenes Docker
# Los repositorios ECR son recursos globales (compartidos entre ambientes).
# Se crean una sola vez aqui. El CI/CD hace push con tags por ambiente.
# Encriptados con KMS y con escaneo automatico de vulnerabilidades en cada push.
# ============================================================
resource "aws_ecr_repository" "backend" {
  name                 = "govtech-backend"
  image_tag_mutability = "MUTABLE"  # Permite sobrescribir el tag "latest"

  # Escaneo automatico de vulnerabilidades cada vez que se sube una imagen
  image_scanning_configuration {
    scan_on_push = true
  }

  # Encriptar las imagenes con KMS (en lugar del cifrado por defecto de ECR)
  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = module.security.kms_key_arn
  }

  tags = {
    Name    = "govtech-backend"
    Purpose = "Backend Node.js Docker images"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "govtech-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = module.security.kms_key_arn
  }

  tags = {
    Name    = "govtech-frontend"
    Purpose = "Frontend React/Nginx Docker images"
  }
}

# Politica de ciclo de vida: eliminar imagenes antiguas automaticamente
# Mantener las ultimas 10 imagenes con tag y eliminar las no etiquetadas despues de 7 dias
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Mantener las ultimas 10 imagenes con tag"
        selection = {
          tagStatus   = "tagged"
          tagPrefixList = ["v", "sha-"]
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Eliminar imagenes sin tag despues de 7 dias"
        selection = {
          tagStatus = "untagged"
          countType = "sinceImagePushed"
          countUnit = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Mantener las ultimas 10 imagenes con tag"
        selection = {
          tagStatus   = "tagged"
          tagPrefixList = ["v", "sha-"]
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Eliminar imagenes sin tag despues de 7 dias"
        selection = {
          tagStatus = "untagged"
          countType = "sinceImagePushed"
          countUnit = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      }
    ]
  })
}

# ============================================================
# OUTPUTS - Valores importantes que otros sistemas necesitan
# ============================================================
output "vpc_id" {
  description = "ID de la VPC creada"
  value       = module.networking.vpc_id
}

output "eks_cluster_name" {
  description = "Nombre del cluster EKS"
  value       = module.kubernetes.cluster_name
}

output "eks_cluster_endpoint" {
  description = "URL del API server de EKS"
  value       = module.kubernetes.cluster_endpoint
}

output "rds_endpoint" {
  description = "Endpoint de la base de datos RDS"
  value       = module.database.db_instance_endpoint
  sensitive   = true
}

output "github_actions_role_arn" {
  description = "ARN del rol IAM para GitHub Actions (usar como AWS_DEPLOY_ROLE_ARN en GitHub secrets)"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "ecr_backend_url" {
  description = "URL del repositorio ECR del backend (usar en Kubernetes deployments)"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "URL del repositorio ECR del frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "waf_arn" {
  description = "ARN del WAF Web ACL (para asociar al ALB despues de crearlo)"
  value       = module.security.waf_web_acl_arn
}
