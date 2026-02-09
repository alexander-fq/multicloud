/**
 * Auth Service Interface
 * All cloud providers must implement these methods
 */
class AuthService {
  /**
   * Verify credentials
   * @returns {Promise<boolean>} - Verification status
   */
  async verifyCredentials() {
    throw new Error('Method verifyCredentials() must be implemented');
  }

  /**
   * Get current identity
   * @returns {Promise<Object>} - Identity information
   */
  async getCurrentIdentity() {
    throw new Error('Method getCurrentIdentity() must be implemented');
  }

  /**
   * Assume a role (for cross-account access)
   * @param {string} roleArn - Role ARN/OCID
   * @returns {Promise<Object>} - Temporary credentials
   */
  async assumeRole(roleArn) {
    throw new Error('Method assumeRole() must be implemented');
  }
}

module.exports = AuthService;
