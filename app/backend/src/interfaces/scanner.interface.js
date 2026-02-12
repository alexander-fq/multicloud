/**
 * Scanner Interface
 * Abstract base class for cloud resource scanners
 * All cloud providers must implement these methods
 */

class ScannerInterface {
  /**
   * Scan all resources in the cloud provider
   * @returns {Promise<Object>} Scan results with resources, readiness, etc.
   */
  async scan() {
    throw new Error('scan() must be implemented by subclass');
  }

  /**
   * Scan resources by specific type
   * @param {string} resourceType - Type of resource to scan (ec2, rds, s3, etc.)
   * @returns {Promise<Array>} Array of resources of the specified type
   */
  async scanByType(resourceType) {
    throw new Error('scanByType() must be implemented by subclass');
  }

  /**
   * Calculate migration readiness score
   * @param {Object} scanResults - Results from scan()
   * @returns {Promise<Object>} Readiness score and details
   */
  async calculateReadiness(scanResults) {
    throw new Error('calculateReadiness() must be implemented by subclass');
  }
}

module.exports = ScannerInterface;
