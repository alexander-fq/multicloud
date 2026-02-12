/**
 * Service Factory
 * Returns the correct cloud provider implementation based on CLOUD_PROVIDER env variable
 */

// AWS Providers
const AWSStorage = require('../cloud-providers/aws/aws-storage');
const AWSDatabase = require('../cloud-providers/aws/aws-database');
const AWSMonitoring = require('../cloud-providers/aws/aws-monitoring');
const AWSAuth = require('../cloud-providers/aws/aws-auth');
const AWSScanner = require('../cloud-providers/aws/aws-scanner');

// OCI Providers
const OCIStorage = require('../cloud-providers/oci/oci-storage');
const OCIDatabase = require('../cloud-providers/oci/oci-database');
const OCIMonitoring = require('../cloud-providers/oci/oci-monitoring');
const OCIAuth = require('../cloud-providers/oci/oci-auth');
const OCIScanner = require('../cloud-providers/oci/oci-scanner');

// GCP Providers (TODO: Implement)
// const GCPStorage = require('../cloud-providers/gcp/gcp-storage');
// ... etc

// Singleton instances
let storageInstance = null;
let databaseInstance = null;
let monitoringInstance = null;
let authInstance = null;
let scannerInstance = null;

function getProvider() {
  return (process.env.CLOUD_PROVIDER || 'aws').toLowerCase();
}

function getStorageService() {
  if (storageInstance) return storageInstance;

  const provider = getProvider();
  const auth = getAuthService();

  switch (provider) {
    case 'aws':
      storageInstance = new AWSStorage();
      break;
    case 'oci':
      storageInstance = new OCIStorage(auth);
      break;
    case 'gcp':
      // storageInstance = new GCPStorage();
      throw new Error('GCP provider not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    case 'azure':
      // storageInstance = new AzureStorage();
      throw new Error('Azure provider not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    default:
      throw new Error(`Unknown cloud provider: ${provider}. Supported: aws, oci, gcp, azure`);
  }

  return storageInstance;
}

function getDatabaseService() {
  if (databaseInstance) return databaseInstance;

  const provider = getProvider();

  switch (provider) {
    case 'aws':
      databaseInstance = new AWSDatabase();
      break;
    case 'oci':
      databaseInstance = new OCIDatabase();
      break;
    case 'gcp':
      throw new Error('GCP provider not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    case 'azure':
      throw new Error('Azure provider not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    default:
      throw new Error(`Unknown cloud provider: ${provider}`);
  }

  return databaseInstance;
}

function getMonitoringService() {
  if (monitoringInstance) return monitoringInstance;

  const provider = getProvider();
  const auth = getAuthService();

  switch (provider) {
    case 'aws':
      monitoringInstance = new AWSMonitoring();
      break;
    case 'oci':
      monitoringInstance = new OCIMonitoring(auth);
      break;
    case 'gcp':
      throw new Error('GCP provider not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    case 'azure':
      throw new Error('Azure provider not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    default:
      throw new Error(`Unknown cloud provider: ${provider}`);
  }

  return monitoringInstance;
}

function getAuthService() {
  if (authInstance) return authInstance;

  const provider = getProvider();

  switch (provider) {
    case 'aws':
      authInstance = new AWSAuth();
      break;
    case 'oci':
      authInstance = new OCIAuth();
      break;
    case 'gcp':
      throw new Error('GCP provider not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    case 'azure':
      throw new Error('Azure provider not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    default:
      throw new Error(`Unknown cloud provider: ${provider}`);
  }

  return authInstance;
}

function getScannerService() {
  if (scannerInstance) return scannerInstance;

  const provider = getProvider();
  const auth = getAuthService();

  switch (provider) {
    case 'aws':
      scannerInstance = new AWSScanner();
      break;
    case 'oci':
      scannerInstance = new OCIScanner(auth);
      break;
    case 'gcp':
      throw new Error('GCP scanner not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    case 'azure':
      throw new Error('Azure scanner not yet implemented. Set CLOUD_PROVIDER=aws or oci');
    default:
      throw new Error(`Unknown cloud provider: ${provider}`);
  }

  return scannerInstance;
}

function resetInstances() {
  storageInstance = null;
  databaseInstance = null;
  monitoringInstance = null;
  authInstance = null;
  scannerInstance = null;
}

module.exports = {
  getProvider,
  getStorageService,
  getDatabaseService,
  getMonitoringService,
  getAuthService,
  getScannerService,
  resetInstances
};
