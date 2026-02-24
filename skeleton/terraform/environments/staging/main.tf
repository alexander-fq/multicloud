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
    key     = "staging/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "govtech"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

variable "db_password" {
  description = "Password de RDS PostgreSQL"
  type        = string
  sensitive   = true
}

# ----------------------------------------
# NETWORKING
# Staging: 3 AZs para simular produccion
# ----------------------------------------
module "networking" {
  source = "../../modules/networking"

  environment  = "staging"
  region       = "us-east-1"
  project_name = "govtech"
  vpc_cidr     = "10.1.0.0/16"  # CIDR diferente a dev (10.0.0.0/16) para evitar conflictos

  # 3 AZs (como prod) para detectar problemas de multi-AZ antes de produccion
  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24", "10.1.12.0/24"]
}

# ----------------------------------------
# EKS
# Staging: t3.small (entre dev y prod)
# ----------------------------------------
module "eks" {
  source = "../../modules/kubernetes-cluster"

  cluster_name  = "govtech-staging"
  environment   = "staging"
  project_name  = "govtech"
  vpc_id        = module.networking.vpc_id
  subnet_ids    = module.networking.private_subnet_ids

  node_instance_type = "t3.small"
  node_min_size      = 2
  node_max_size      = 6
  node_desired_size  = 3
}

# ----------------------------------------
# DATABASE
# Staging: db.t3.small, sin Multi-AZ
# (Multi-AZ solo en prod)
# ----------------------------------------
module "database" {
  source = "../../modules/database"

  project_name = "govtech"
  environment  = "staging"

  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.rds_security_group_id

  db_instance_class        = "db.t3.small"
  db_allocated_storage     = 30
  db_max_allocated_storage = 100
  db_name                  = "govtech"
  db_username              = "govtech_admin"
  db_password              = var.db_password
  multi_az                 = false
  backup_retention_days    = 7
}

# ----------------------------------------
# STORAGE S3
# ----------------------------------------
module "storage" {
  source = "../../modules/storage"

  project_name   = "govtech"
  environment    = "staging"
  aws_account_id = "835960996869"

  cors_allowed_origins = ["https://staging.govtech.example.com"]

  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url
}

# ----------------------------------------
# SECURITY: WAF, GuardDuty, KMS, CloudTrail, Security Hub
# ----------------------------------------
module "security" {
  source = "../../modules/security"

  project_name = "govtech"
  environment  = "staging"
  account_id   = "835960996869"
  aws_region   = "us-east-1"
  logs_bucket  = module.storage.bucket_id

  depends_on = [module.storage]
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
  value = "aws eks update-kubeconfig --name govtech-staging --region us-east-1"
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
