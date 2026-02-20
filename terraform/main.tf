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
