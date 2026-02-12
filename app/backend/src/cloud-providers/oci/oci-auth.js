/**
 * OCI Authentication Service
 * Handles authentication and identity operations for Oracle Cloud Infrastructure
 */

const common = require('oci-common');
const identity = require('oci-identity');
const logger = require('../../utils/logger');

class OCIAuthService {
  constructor() {
    this.provider = null;
    this.identityClient = null;
    this.initialized = false;
  }

  /**
   * Initialize OCI authentication provider
   * Uses config file method (~/.oci/config)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load configuration from file
      const configProfile = process.env.OCI_CONFIG_PROFILE || 'DEFAULT';
      this.provider = new common.ConfigFileAuthenticationDetailsProvider(
        undefined,
        configProfile
      );

      // Initialize Identity client
      this.identityClient = new identity.IdentityClient({
        authenticationDetailsProvider: this.provider
      });

      this.initialized = true;
      logger.info('OCI authentication initialized successfully');
    } catch (error) {
      logger.error('OCI authentication initialization failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verify OCI credentials are valid
   * @returns {Promise<boolean>} True if credentials are valid
   */
  async verifyCredentials() {
    try {
      await this.initialize();

      // Try to get tenancy information as a test
      const tenancyId = this.provider.getTenantId();
      const request = { tenancyId };

      await this.identityClient.getTenancy(request);

      logger.info('OCI credentials verified successfully');
      return true;
    } catch (error) {
      logger.error('OCI credentials verification failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get current user/tenancy identity information
   * @returns {Promise<Object>} Identity information
   */
  async getCurrentIdentity() {
    try {
      await this.initialize();

      const tenancyId = this.provider.getTenantId();
      const userId = this.provider.getUser();

      // Get tenancy details
      const tenancyResponse = await this.identityClient.getTenancy({
        tenancyId
      });

      // Get user details
      let userDetails = null;
      try {
        const userResponse = await this.identityClient.getUser({ userId });
        userDetails = userResponse.user;
      } catch (error) {
        logger.debug('Could not fetch user details', { error: error.message });
      }

      return {
        userId,
        tenancyId,
        tenancyName: tenancyResponse.tenancy.name,
        homeRegion: tenancyResponse.tenancy.homeRegionKey,
        userName: userDetails?.name || 'Unknown',
        userEmail: userDetails?.email || 'Unknown',
        // For compatibility with AWS format
        account: tenancyId,
        arn: userId
      };
    } catch (error) {
      logger.error('Failed to get OCI identity', { error: error.message });
      throw error;
    }
  }

  /**
   * List available compartments
   * @returns {Promise<Array>} List of compartments
   */
  async listCompartments() {
    try {
      await this.initialize();

      const tenancyId = this.provider.getTenantId();

      // List compartments in the tenancy
      const request = {
        compartmentId: tenancyId,
        compartmentIdInSubtree: true,
        accessLevel: 'ACCESSIBLE'
      };

      const response = await this.identityClient.listCompartments(request);

      const compartments = response.items.map(comp => ({
        id: comp.id,
        name: comp.name,
        description: comp.description,
        lifecycleState: comp.lifecycleState,
        timeCreated: comp.timeCreated
      }));

      logger.info(`Found ${compartments.length} OCI compartments`);
      return compartments;
    } catch (error) {
      logger.error('Failed to list OCI compartments', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List available regions
   * @returns {Promise<Array>} List of regions
   */
  async listRegions() {
    try {
      await this.initialize();

      const tenancyId = this.provider.getTenantId();

      // List region subscriptions
      const response = await this.identityClient.listRegionSubscriptions({
        tenancyId
      });

      const regions = response.items.map(region => ({
        name: region.regionName,
        key: region.regionKey,
        isHomeRegion: region.isHomeRegion,
        status: region.status
      }));

      logger.info(`Found ${regions.length} OCI regions`);
      return regions;
    } catch (error) {
      logger.error('Failed to list OCI regions', { error: error.message });
      throw error;
    }
  }

  /**
   * Get authentication provider (for use by other services)
   * @returns {Object} OCI authentication provider
   */
  getProvider() {
    if (!this.initialized) {
      throw new Error('OCI Auth not initialized. Call initialize() first.');
    }
    return this.provider;
  }

  /**
   * Get tenancy OCID
   * @returns {string} Tenancy OCID
   */
  getTenancyId() {
    if (!this.initialized) {
      throw new Error('OCI Auth not initialized. Call initialize() first.');
    }
    return this.provider.getTenantId();
  }

  /**
   * Get region
   * @returns {string} Current region
   */
  getRegion() {
    if (!this.initialized) {
      throw new Error('OCI Auth not initialized. Call initialize() first.');
    }
    return this.provider.getRegion() || process.env.OCI_REGION || 'us-ashburn-1';
  }
}

module.exports = OCIAuthService;
