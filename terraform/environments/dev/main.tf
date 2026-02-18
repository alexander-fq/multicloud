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
