# Cloud Providers

This directory contains concrete implementations for each cloud provider.

## Structure
```
cloud-providers/
├── aws/
│   ├── aws-storage.js        # S3 implementation
│   ├── aws-compute.js        # EKS implementation
│   ├── aws-database.js       # RDS implementation
│   ├── aws-monitoring.js     # CloudWatch implementation
│   ├── aws-auth.js           # IAM implementation
│   └── config.js             # AWS SDK configuration
├── oci/
│   ├── oci-storage.js        # Object Storage implementation
│   ├── oci-compute.js        # OKE implementation
│   ├── oci-database.js       # OCI Database implementation
│   ├── oci-monitoring.js     # OCI Monitoring implementation
│   ├── oci-auth.js           # OCI IAM implementation
│   └── config.js             # OCI SDK configuration
├── gcp/
│   └── (Similar structure for Google Cloud)
└── azure/
    └── (Similar structure for Microsoft Azure)
```

## Implementation Status
- ✅ **AWS** - Fully implemented (default provider)
- 📋 **OCI** - Structure created, implementation pending
- 📋 **GCP** - Structure created, implementation pending
- 📋 **Azure** - Structure created, implementation pending

## How to Add a New Provider

1. Create directory: `cloud-providers/[provider-name]/`
2. Implement each service using the interfaces in `interfaces/`
3. Create `config.js` with SDK initialization
4. Add provider to factory in `services/factory.js`
5. Update environment variables in `.env.[provider]`
6. Test with: `CLOUD_PROVIDER=[provider-name] npm start`

## Example Implementation

```javascript
// aws/aws-storage.js
const { StorageService } = require('../../interfaces/storage.interface');
const AWS = require('aws-sdk');

class AWSStorage extends StorageService {
  constructor() {
    super();
    this.s3 = new AWS.S3();
  }

  async uploadFile(file, destination) {
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: destination,
      Body: file
    };
    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  // ... other methods
}

module.exports = AWSStorage;
```

The beauty is: **Change `CLOUD_PROVIDER=oci` and the same code works with Oracle Cloud.**
