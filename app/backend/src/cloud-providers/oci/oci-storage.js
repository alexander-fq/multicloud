/**
 * OCI Object Storage Service
 * Handles Object Storage operations for Oracle Cloud Infrastructure
 * Equivalent to AWS S3
 */

const objectstorage = require('oci-objectstorage');
const logger = require('../../utils/logger');

class OCIStorageService {
  constructor(authService) {
    this.authService = authService;
    this.client = null;
    this.namespace = null;
    this.initialized = false;
  }

  /**
   * Initialize OCI Object Storage client
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await this.authService.initialize();
      const provider = this.authService.getProvider();

      this.client = new objectstorage.ObjectStorageClient({
        authenticationDetailsProvider: provider
      });

      // Get namespace (required for all OCI Object Storage operations)
      const tenancyId = this.authService.getTenancyId();
      const request = { compartmentId: tenancyId };
      const response = await this.client.getNamespace(request);
      this.namespace = response.value;

      this.initialized = true;
      logger.info('OCI Object Storage initialized successfully', {
        namespace: this.namespace
      });
    } catch (error) {
      logger.error('OCI Object Storage initialization failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Upload a file to Object Storage
   * @param {string} bucketName - Bucket name
   * @param {string} key - Object key/name
   * @param {Buffer|Stream} body - File content
   * @param {string} contentType - MIME type
   * @returns {Promise<Object>} Upload result
   */
  async upload(bucketName, key, body, contentType = 'application/octet-stream') {
    try {
      await this.initialize();

      const putRequest = {
        namespaceName: this.namespace,
        bucketName,
        objectName: key,
        putObjectBody: body,
        contentType
      };

      await this.client.putObject(putRequest);

      const region = this.authService.getRegion();
      const location = `https://objectstorage.${region}.oraclecloud.com/n/${this.namespace}/b/${bucketName}/o/${key}`;

      logger.info('Object uploaded successfully to OCI', {
        bucket: bucketName,
        key,
        location
      });

      return {
        success: true,
        bucket: bucketName,
        key,
        location
      };
    } catch (error) {
      logger.error('Failed to upload object to OCI', {
        error: error.message,
        bucket: bucketName,
        key
      });
      throw error;
    }
  }

  /**
   * Download a file from Object Storage
   * @param {string} bucketName - Bucket name
   * @param {string} key - Object key/name
   * @returns {Promise<Stream>} File stream
   */
  async download(bucketName, key) {
    try {
      await this.initialize();

      const getRequest = {
        namespaceName: this.namespace,
        bucketName,
        objectName: key
      };

      const response = await this.client.getObject(getRequest);

      logger.info('Object downloaded successfully from OCI', {
        bucket: bucketName,
        key
      });

      return response.value; // ReadableStream
    } catch (error) {
      logger.error('Failed to download object from OCI', {
        error: error.message,
        bucket: bucketName,
        key
      });
      throw error;
    }
  }

  /**
   * List objects in a bucket
   * @param {string} bucketName - Bucket name
   * @param {string} prefix - Prefix filter (optional)
   * @returns {Promise<Array>} List of objects
   */
  async list(bucketName, prefix = '') {
    try {
      await this.initialize();

      const listRequest = {
        namespaceName: this.namespace,
        bucketName,
        prefix
      };

      const response = await this.client.listObjects(listRequest);

      const objects = response.listObjects.objects.map(obj => ({
        key: obj.name,
        size: obj.size,
        lastModified: obj.timeModified,
        etag: obj.etag,
        storageClass: obj.storageTier || 'Standard'
      }));

      logger.info('Listed objects from OCI bucket', {
        bucket: bucketName,
        count: objects.length,
        prefix
      });

      return objects;
    } catch (error) {
      logger.error('Failed to list objects from OCI', {
        error: error.message,
        bucket: bucketName
      });
      throw error;
    }
  }

  /**
   * Delete an object from Object Storage
   * @param {string} bucketName - Bucket name
   * @param {string} key - Object key/name
   * @returns {Promise<Object>} Delete result
   */
  async delete(bucketName, key) {
    try {
      await this.initialize();

      const deleteRequest = {
        namespaceName: this.namespace,
        bucketName,
        objectName: key
      };

      await this.client.deleteObject(deleteRequest);

      logger.info('Object deleted successfully from OCI', {
        bucket: bucketName,
        key
      });

      return {
        success: true,
        deleted: key
      };
    } catch (error) {
      logger.error('Failed to delete object from OCI', {
        error: error.message,
        bucket: bucketName,
        key
      });
      throw error;
    }
  }

  /**
   * Get a presigned URL for temporary access
   * OCI uses Pre-Authenticated Requests (PARs)
   * @param {string} bucketName - Bucket name
   * @param {string} key - Object key/name
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} Presigned URL
   */
  async getPresignedUrl(bucketName, key, expiresIn = 3600) {
    try {
      await this.initialize();

      // Create Pre-Authenticated Request (PAR)
      const parRequest = {
        namespaceName: this.namespace,
        bucketName,
        createPreauthenticatedRequestDetails: {
          name: `par-${Date.now()}`,
          objectName: key,
          accessType: 'ObjectRead',
          timeExpires: new Date(Date.now() + expiresIn * 1000)
        }
      };

      const response = await this.client.createPreauthenticatedRequest(parRequest);

      const region = this.authService.getRegion();
      const baseUrl = `https://objectstorage.${region}.oraclecloud.com`;
      const presignedUrl = `${baseUrl}${response.preauthenticatedRequest.accessUri}`;

      logger.info('Created OCI Pre-Authenticated Request', {
        bucket: bucketName,
        key,
        expiresIn
      });

      return presignedUrl;
    } catch (error) {
      logger.error('Failed to create OCI Pre-Authenticated Request', {
        error: error.message,
        bucket: bucketName,
        key
      });
      throw error;
    }
  }

  /**
   * List all buckets in the tenancy
   * @returns {Promise<Array>} List of buckets
   */
  async listBuckets() {
    try {
      await this.initialize();

      const tenancyId = this.authService.getTenancyId();

      const response = await this.client.listBuckets({
        namespaceName: this.namespace,
        compartmentId: tenancyId
      });

      const buckets = response.items.map(bucket => ({
        name: bucket.name,
        compartmentId: bucket.compartmentId,
        createdTime: bucket.timeCreated,
        publicAccessType: bucket.publicAccessType || 'NoPublicAccess'
      }));

      logger.info('Listed OCI buckets', { count: buckets.length });

      return buckets;
    } catch (error) {
      logger.error('Failed to list OCI buckets', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = OCIStorageService;
