# Migration Tools

This directory contains tools to automate cloud-to-cloud migration.

## Purpose
Enable governments to migrate their infrastructure from one cloud to another in weeks instead of months/years.

## Components

### 1. Scanner (`scanner/`)
**Purpose:** Detect current cloud configuration

**Files:**
- `config-scanner.js` - Read Terraform files, .env, k8s manifests
- `service-detector.js` - Identify services in use (RDS, EKS, S3, etc.)
- `dependency-analyzer.js` - Find code that depends on cloud SDKs

**Example Output:**
```json
{
  "currentProvider": "aws",
  "region": "us-east-1",
  "services": {
    "database": "RDS PostgreSQL db.t3.medium",
    "compute": "EKS cluster (2 nodes t3.medium)",
    "storage": "S3 bucket (500GB)",
    "monitoring": "CloudWatch"
  },
  "dependencies": [
    "backend/services/storage.js:12 - uses aws-sdk",
    "backend/services/auth.js:5 - uses AWS IAM"
  ]
}
```

---

### 2. Mapper (`mapper/`)
**Purpose:** Map services from source cloud to target cloud

**Files:**
- `service-mapper.js` - AWS RDS → OCI Database System
- `cost-estimator.js` - Calculate costs in target cloud
- `equivalence-finder.js` - Find equivalent instance types

**Example:**
```javascript
Input:  AWS RDS db.t3.medium ($100/month)
Output: OCI VM.Standard2.1 ($85/month) - 15% savings
```

**Mapping Table:**
| AWS Service | OCI Equivalent | GCP Equivalent | Azure Equivalent |
|-------------|----------------|----------------|------------------|
| RDS PostgreSQL | OCI Database System | Cloud SQL | Azure Database |
| EKS | OKE | GKE | AKS |
| S3 | Object Storage | GCS | Blob Storage |
| CloudWatch | Monitoring | Operations | Azure Monitor |

---

### 3. Generator (`generator/`)
**Purpose:** Generate new configuration for target cloud

**Files:**
- `terraform-generator.js` - Create Terraform files for target cloud
- `env-generator.js` - Generate .env.[provider] files
- `manifest-generator.js` - Update Kubernetes manifests

**Example:**
```javascript
Input:  Current AWS configuration
Output: terraform/oci/main.tf (ready to deploy)
```

---

### 4. Validator (`validator/`)
**Purpose:** Verify migration success

**Files:**
- `pre-migration-checks.js` - Verify prerequisites (credentials, quotas)
- `post-migration-validator.js` - Verify services are working
- `smoke-tests.js` - Run basic functionality tests
- `rollback-planner.js` - Create rollback strategy

**Validation Flow:**
```
1. Pre-checks: ✅ OCI credentials valid
2. Pre-checks: ✅ Quota sufficient for resources
3. Migration: 🔄 Creating infrastructure...
4. Post-checks: ✅ Database accessible
5. Post-checks: ✅ API responding
6. Smoke tests: ✅ CRUD operations work
7. Migration: ✅ SUCCESS
```

---

## Migration Flow

```
┌──────────┐    ┌────────┐    ┌───────────┐    ┌───────────┐
│ Scanner  │───►│ Mapper │───►│ Generator │───►│ Validator │
└──────────┘    └────────┘    └───────────┘    └───────────┘
     │               │              │                │
     │               │              │                │
  Detect          Map to        Generate          Verify
  current      target cloud   new config        everything
  setup         services        files            works
```

## CLI Usage (Future)

```bash
# Scan current setup
$ npx migrate-gov scan
> Detected: AWS (us-east-1)
> Services: RDS, EKS, S3, CloudWatch
> Estimated migration time: 2 weeks

# Plan migration
$ npx migrate-gov plan --from aws --to oci
> Mapped services:
>   RDS → OCI Database System
>   EKS → OKE
>   S3  → Object Storage
> Cost comparison: $1,500/mo → $1,200/mo (20% savings)
> Generate plan? (y/n)

# Execute migration
$ npx migrate-gov migrate --plan migration-plan.json
> Step 1/5: Creating OCI infrastructure...
> Step 2/5: Migrating database (pg_dump)...
> Step 3/5: Deploying application to OKE...
> Step 4/5: Updating DNS records...
> Step 5/5: Running smoke tests...
> Migration complete! ✅

# Rollback if needed
$ npx migrate-gov rollback
> Rolling back to AWS...
> DNS updated, database restored
> Rollback complete
```

## API Endpoints (Future)

For web UI:
- `POST /api/migration/scan` - Scan current setup
- `POST /api/migration/plan` - Create migration plan
- `POST /api/migration/execute` - Execute migration
- `GET /api/migration/status` - Check progress
- `POST /api/migration/rollback` - Rollback migration

---

## Current Status

- 📋 **Scanner** - Structure created, implementation pending
- 📋 **Mapper** - Structure created, implementation pending
- 📋 **Generator** - Structure created, implementation pending
- 📋 **Validator** - Structure created, implementation pending

## Next Steps

1. Implement scanner (read Terraform files)
2. Create service mapping database
3. Build Terraform generator
4. Add validation tests
5. Create CLI interface
6. Build web UI for non-technical users
