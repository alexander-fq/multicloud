# Interfaces

This directory contains abstract interfaces (contracts) that all cloud providers must implement.

## Purpose
- Define common methods that work across all clouds
- Ensure consistent API regardless of provider
- Enable easy switching between AWS, OCI, GCP, Azure

## Files
- `storage.interface.js` - File storage operations (S3, Object Storage, GCS, Blob)
- `compute.interface.js` - Container orchestration (EKS, OKE, GKE, AKS)
- `database.interface.js` - Database operations (RDS, OCI DB, Cloud SQL)
- `monitoring.interface.js` - Logs and metrics (CloudWatch, OCI Monitoring)
- `auth.interface.js` - Authentication and authorization (IAM)

## Example Structure
```javascript
// storage.interface.js
class StorageService {
  async uploadFile(file, destination) { throw new Error('Not implemented'); }
  async downloadFile(path) { throw new Error('Not implemented'); }
  async deleteFile(path) { throw new Error('Not implemented'); }
  async listFiles(prefix) { throw new Error('Not implemented'); }
  async getSignedUrl(path, expiresIn) { throw new Error('Not implemented'); }
}
```

Each cloud provider implements this interface with their specific SDK.
