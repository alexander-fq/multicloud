/**
 * Storage Service Interface
 * All cloud providers must implement these methods
 */
class StorageService {
  /**
   * Upload a file to cloud storage
   * @param {Buffer|Stream} file - File content
   * @param {string} destination - Destination path (e.g., "documents/file.pdf")
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  async uploadFile(file, destination) {
    throw new Error('Method uploadFile() must be implemented');
  }

  /**
   * Download a file from cloud storage
   * @param {string} path - File path
   * @returns {Promise<Buffer>} - File content
   */
  async downloadFile(path) {
    throw new Error('Method downloadFile() must be implemented');
  }

  /**
   * Delete a file from cloud storage
   * @param {string} path - File path
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(path) {
    throw new Error('Method deleteFile() must be implemented');
  }

  /**
   * List files in a directory
   * @param {string} prefix - Directory prefix
   * @returns {Promise<Array<string>>} - Array of file paths
   */
  async listFiles(prefix) {
    throw new Error('Method listFiles() must be implemented');
  }

  /**
   * Get a signed URL for temporary access
   * @param {string} path - File path
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(path, expiresIn = 3600) {
    throw new Error('Method getSignedUrl() must be implemented');
  }

  /**
   * Check if a file exists
   * @param {string} path - File path
   * @returns {Promise<boolean>} - Existence status
   */
  async fileExists(path) {
    throw new Error('Method fileExists() must be implemented');
  }
}

module.exports = StorageService;
