# Networking Module

Creates cloud-agnostic network infrastructure.

## What This Module Creates

- VPC / Virtual Network
- Public and Private Subnets
- Internet Gateway / NAT Gateway
- Route Tables
- Security Groups / Firewall Rules
- Network ACLs

## Files (To Be Created)

```
networking/
├── variables.tf      # Common input variables
├── outputs.tf        # Common outputs (vpc_id, subnet_ids, etc.)
├── aws.tf           # AWS VPC implementation
├── gcp.tf           # GCP VPC implementation (planned)
└── azure.tf         # Azure VNet implementation (planned)
```

## Usage

```hcl
module "networking" {
  source = "./modules/networking"

  cloud_provider = "aws"      # aws, gcp, azure
  region         = "us-east-1"
  environment    = "prod"
  cidr_block     = "10.0.0.0/16"
}
```

## Outputs

- `vpc_id` - VPC/VNet identifier
- `public_subnet_ids` - List of public subnet IDs
- `private_subnet_ids` - List of private subnet IDs
- `security_group_id` - Default security group
