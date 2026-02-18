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
    key     = "dev/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "db_password" {
  description = "Password de RDS PostgreSQL (pasar via TF_VAR_db_password o GitHub Secret)"
  type        = string
  sensitive   = true
}

# ----------------------------------------
# NETWORKING: VPC, Subnets, Gateways
# ----------------------------------------
module "networking" {
  source = "../../modules/networking"

  environment = "dev"
  region      = "us-east-1"
  vpc_cidr    = "10.0.0.0/16"

  availability_zones   = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ----------------------------------------
# KUBERNETES: EKS Cluster + Node Group
# ----------------------------------------
module "eks" {
  source = "../../modules/kubernetes-cluster"

  cluster_name  = "govtech-dev"
  environment   = "dev"
  vpc_id        = module.networking.vpc_id
  subnet_ids    = module.networking.private_subnet_ids

  # t3.medium para dev (2 vCPUs, 4GB) - mas barato que prod
  node_instance_type = "t3.medium"
  node_min_size      = 2
  node_max_size      = 4
  node_desired_size  = 2
}

# ----------------------------------------
# DATABASE: RDS PostgreSQL
# ----------------------------------------
module "database" {
  source = "../../modules/database"

  project_name = "govtech"
  environment  = "dev"

  # Red: subnets privadas y security group de RDS
  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.rds_security_group_id

  # En dev: instancia pequeña, sin multi-AZ, pocos dias de backup
  db_instance_class        = "db.t3.micro"
  db_allocated_storage     = 20
  db_max_allocated_storage = 50
  db_name                  = "govtech"
  db_username              = "govtech_admin"
  db_password              = var.db_password
  multi_az                 = false
  backup_retention_days    = 3
}

# ----------------------------------------
# STORAGE: S3 para archivos de la aplicacion
# ----------------------------------------
module "storage" {
  source = "../../modules/storage"

  project_name   = "govtech"
  environment    = "dev"
  aws_account_id = "835960996869"

  cors_allowed_origins = ["http://localhost:5173", "http://localhost:3000"]

  # IRSA: conectar con el OIDC provider del cluster EKS
  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url
}

# ----------------------------------------
# OUTPUTS utiles para kubectl y CI/CD
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
  description = "Comando para conectar kubectl al cluster"
  value       = "aws eks update-kubeconfig --name govtech-dev --region us-east-1"
}

output "db_endpoint" {
  value     = module.database.db_instance_endpoint
  sensitive = true
}

output "app_bucket" {
  value = module.storage.bucket_id
}

output "s3_role_arn" {
  description = "ARN del IAM role para que los pods accedan a S3"
  value       = module.storage.s3_access_role_arn
}
