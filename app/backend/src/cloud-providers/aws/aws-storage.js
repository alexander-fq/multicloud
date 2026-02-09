const StorageService = require('../../interfaces/storage.interface');
const AWS = require('aws-sdk');

class AWSStorage extends StorageService {
  constructor() {
    super();
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    this.bucket = process.env.AWS_BUCKET || 'govtech-documents';
  }

  async uploadFile(file, destination) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: destination,
        Body: file,
        ServerSideEncryption: 'AES256'
      };

      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      throw new Error(`AWS S3 Upload Error: ${error.message}`);
    }
  }

  async downloadFile(path) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: path
      };

      const result = await this.s3.getObject(params).promise();
      return result.Body;
    } catch (error) {
      throw new Error(`AWS S3 Download Error: ${error.message}`);
    }
  }

  async deleteFile(path) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: path
      };

      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      throw new Error(`AWS S3 Delete Error: ${error.message}`);
    }
  }

  async listFiles(prefix) {
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: prefix
      };

      const result = await this.s3.listObjectsV2(params).promise();
      return result.Contents.map(obj => obj.Key);
    } catch (error) {
      throw new Error(`AWS S3 List Error: ${error.message}`);
    }
  }

  async getSignedUrl(path, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: path,
        Expires: expiresIn
      };

      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      throw new Error(`AWS S3 Signed URL Error: ${error.message}`);
    }
  }

  async fileExists(path) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: path
      };

      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw new Error(`AWS S3 Head Error: ${error.message}`);
    }
  }
}

module.exports = AWSStorage;
