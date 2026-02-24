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

  backend "s3" {
    bucket  = "govtech-terraform-state-835960996869"
    key     = "prod/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "govtech"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

variable "db_password" {
  description = "Password de RDS PostgreSQL (usar AWS Secrets Manager en produccion)"
  type        = string
  sensitive   = true
}

# ----------------------------------------
# NETWORKING
# Prod: 3 AZs, CIDR separado (10.2.0.0/16)
# ----------------------------------------
module "networking" {
  source = "../../modules/networking"

  environment  = "prod"
  region       = "us-east-1"
  project_name = "govtech"
  vpc_cidr     = "10.2.0.0/16"

  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
  private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
}

# ----------------------------------------
# EKS
# Prod: t3.medium, mas nodos, min 3 (1 por AZ)
# ----------------------------------------
module "eks" {
  source = "../../modules/kubernetes-cluster"

  cluster_name  = "govtech-prod"
  environment   = "prod"
  project_name  = "govtech"
  vpc_id        = module.networking.vpc_id
  subnet_ids    = module.networking.private_subnet_ids

  # t3.medium: balance entre costo y rendimiento para produccion
  node_instance_type = "t3.medium"
  node_min_size      = 3   # Minimo 1 nodo por AZ
  node_max_size      = 10
  node_desired_size  = 3
}

# ----------------------------------------
# DATABASE
# Prod: db.t3.small, Multi-AZ HABILITADO
# Multi-AZ = alta disponibilidad (failover automatico)
# ----------------------------------------
module "database" {
  source = "../../modules/database"

  project_name = "govtech"
  environment  = "prod"

  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.rds_security_group_id

  db_instance_class        = "db.t3.small"
  db_allocated_storage     = 50
  db_max_allocated_storage = 200
  db_name                  = "govtech"
  db_username              = "govtech_admin"
  db_password              = var.db_password

  # CRITICO: Multi-AZ habilitado en produccion
  # Si us-east-1a falla, failover automatico a us-east-1b en ~1-2 min
  multi_az              = true
  backup_retention_days = 30  # 30 dias de backups para compliance GovTech
}

# ----------------------------------------
# STORAGE S3
# ----------------------------------------
module "storage" {
  source = "../../modules/storage"

  project_name   = "govtech"
  environment    = "prod"
  aws_account_id = "835960996869"

  cors_allowed_origins = ["https://govtech.example.com"]

  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url
}

# ----------------------------------------
# SECURITY: WAF, GuardDuty, KMS, CloudTrail, Security Hub
# Prod: configuracion identica a staging/dev pero con retention de logs mas largo
# CloudTrail retiene 1 año en prod (compliance gubernamental)
# ----------------------------------------
module "security" {
  source = "../../modules/security"

  project_name = "govtech"
  environment  = "prod"
  account_id   = "835960996869"
  aws_region   = "us-east-1"
  logs_bucket  = module.storage.bucket_id

  depends_on = [module.storage]
}

output "waf_arn" {
  description = "ARN del WAF - asociar al ALB con: aws wafv2 associate-web-acl"
  value       = module.security.waf_web_acl_arn
}

output "kms_key_id" {
  description = "ID de la clave KMS para encriptacion de datos"
  value       = module.security.kms_key_id
}

# ----------------------------------------
# OUTPUTS
# ----------------------------------------
output "vpc_id" {
  value = module.networking.vpc_id
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "kubeconfig_command" {
  description = "Comando para conectar kubectl al cluster de PRODUCCION"
  value       = "aws eks update-kubeconfig --name govtech-prod --region us-east-1"
}

output "db_endpoint" {
  value     = module.database.db_instance_endpoint
  sensitive = true
}

output "app_bucket" {
  value = module.storage.bucket_id
}

output "s3_role_arn" {
  value = module.storage.s3_access_role_arn
}
