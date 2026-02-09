# Services

This directory contains service factories and business logic.

## Purpose
Provide a single entry point to access cloud services without knowing which provider is active.

## Structure
```
services/
├── factory.js              # Main factory - returns correct provider
├── storage/
│   └── storage-factory.js  # Storage service factory
├── compute/
│   └── compute-factory.js  # Compute service factory
├── database/
│   └── database-factory.js # Database service factory
├── monitoring/
│   └── monitoring-factory.js
└── auth/
    └── auth-factory.js
```

## How It Works

### Without Abstraction (Bad):
```javascript
// routes/upload.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

app.post('/upload', async (req, res) => {
  await s3.upload({
    Bucket: 'my-bucket',
    Key: req.file.name,
    Body: req.file.data
  }).promise();
});

// Problem: If you switch to OCI, you must rewrite this code
```

### With Abstraction (Good):
```javascript
// routes/upload.js
const { getStorageService } = require('../services/storage/storage-factory');
const storage = getStorageService();

app.post('/upload', async (req, res) => {
  await storage.uploadFile(req.file, req.file.name);
});

// Benefit: Works with AWS, OCI, GCP, Azure - no code changes!
// Just change CLOUD_PROVIDER environment variable
```

## Factory Pattern

```javascript
// services/factory.js
const AWSStorage = require('../cloud-providers/aws/aws-storage');
const OCIStorage = require('../cloud-providers/oci/oci-storage');
const GCPStorage = require('../cloud-providers/gcp/gcp-storage');

function getStorageService() {
  const provider = process.env.CLOUD_PROVIDER || 'aws';

  switch(provider) {
    case 'aws':
      return new AWSStorage();
    case 'oci':
      return new OCIStorage();
    case 'gcp':
      return new GCPStorage();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

module.exports = { getStorageService };
```

## Usage in Application

```javascript
// In your routes/controllers
const { getStorageService } = require('./services/storage/storage-factory');
const { getDatabaseService } = require('./services/database/database-factory');
const { getMonitoringService } = require('./services/monitoring/monitoring-factory');

const storage = getStorageService();
const database = getDatabaseService();
const monitoring = getMonitoringService();

// Use them without knowing which cloud you're on
app.post('/api/documents', async (req, res) => {
  const url = await storage.uploadFile(req.file);
  const record = await database.insert('documents', { url });
  await monitoring.log('Document uploaded', { id: record.id });
  res.json({ success: true, url });
});
```

## Benefits

1. **Cloud Agnostic Code** - Write once, run anywhere
2. **Easy Testing** - Mock the factory for unit tests
3. **Easy Migration** - Change env variable, deploy
4. **Clear Separation** - Business logic separated from cloud specifics
5. **Maintainable** - Each provider in its own file

## Environment Configuration

```bash
# .env.aws
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
AWS_BUCKET=my-bucket

# .env.oci
CLOUD_PROVIDER=oci
OCI_REGION=us-ashburn-1
OCI_BUCKET=my-bucket

# .env.gcp
CLOUD_PROVIDER=gcp
GCP_PROJECT=my-project
GCP_BUCKET=my-bucket
```

## Current Status

- 📋 **Factories** - Structure created, implementation pending
- ✅ **Pattern** - Documented and ready to implement
