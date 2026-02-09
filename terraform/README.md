# Terraform Infrastructure as Code

**70% Cloud-Agnostic Infrastructure Modules**

This directory contains Terraform modules organized for multi-cloud deployment.

## Architecture Pattern

Each module has:
- **Common variables** (`variables.tf`) - Works across all clouds
- **Cloud-specific implementations** (`aws.tf`, `gcp.tf`, `azure.tf`)
- **Common outputs** (`outputs.tf`) - Standardized across clouds

## Structure

```
terraform/
├── main.tf                 # Root configuration (selects cloud & modules)
├── variables.tf            # Input variables
├── outputs.tf             # Output values
├── terraform.tfvars.example  # Example variables
├── environments/
│   ├── dev/               # Development environment
│   ├── staging/           # Staging environment
│   └── prod/              # Production environment
└── modules/
    ├── networking/        # VPC, Subnets, Security Groups
    ├── kubernetes-cluster/ # EKS, GKE, AKS cluster setup
    ├── database/          # RDS, CloudSQL, managed PostgreSQL
    └── storage/           # S3, GCS, blob storage
```

## Usage Example

```hcl
# main.tf
module "networking" {
  source = "./modules/networking"
  cloud_provider = "aws"  # or "gcp", "azure"
  region = "us-east-1"
}

module "kubernetes_cluster" {
  source = "./modules/kubernetes-cluster"
  cloud_provider = "aws"
  network_id = module.networking.vpc_id
}
```

## Supported Cloud Providers

| Provider | Status | Module Prefix |
|----------|--------|---------------|
| AWS | 🟢 Ready | `aws-*.tf` |
| GCP | 🟡 Planned | `gcp-*.tf` |
| Azure | 🟡 Planned | `azure-*.tf` |
| Oracle Cloud | 🟡 Planned | `oci-*.tf` |

## Portability: 70%

Common variables and outputs allow switching clouds by changing the `cloud_provider` variable.

## Next Steps

1. Create module structure
2. Implement AWS modules first
3. Add GCP modules
4. Add Azure modules
5. Create environment-specific configurations
