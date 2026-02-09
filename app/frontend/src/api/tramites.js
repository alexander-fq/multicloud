import apiClient from './client';

/**
 * Tramites API Service
 * All API calls related to tramites
 */

export const tramitesAPI = {
  /**
   * Get all tramites with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.estado - Filter by status
   * @param {string} params.tipoTramite - Filter by type
   * @param {string} params.dni - Filter by DNI
   * @returns {Promise} API response with tramites and pagination
   */
  getAll: params => {
    return apiClient.get('/tramites', { params });
  },

  /**
   * Get tramite by numero
   * @param {string} numeroTramite - Tramite number (e.g., TRAM-20260208-00001)
   * @returns {Promise} API response with tramite data
   */
  getByNumero: numeroTramite => {
    return apiClient.get(`/tramites/numero/${numeroTramite}`);
  },

  /**
   * Get all tramites for a specific DNI
   * @param {string} dni - Citizen DNI (8 digits)
   * @returns {Promise} API response with array of tramites
   */
  getByDNI: dni => {
    return apiClient.get(`/tramites/dni/${dni}`);
  },

  /**
   * Create a new tramite
   * @param {Object} data - Tramite data
   * @param {string} data.dni - Citizen DNI
   * @param {string} data.nombreCiudadano - Citizen full name
   * @param {string} data.tipoTramite - Tramite type
   * @param {Array<string>} data.documentosPendientes - Pending documents
   * @param {string} data.observaciones - Optional observations
   * @param {string} data.fechaEstimadaFinalizacion - Optional estimated completion date
   * @returns {Promise} API response with created tramite
   */
  create: data => {
    return apiClient.post('/tramites', data);
  },

  /**
   * Update an existing tramite
   * @param {string} numeroTramite - Tramite number
   * @param {Object} data - Updated tramite data
   * @param {string} data.estado - Updated status
   * @param {Array<string>} data.documentosPendientes - Updated pending documents
   * @param {string} data.observaciones - Updated observations
   * @param {string} data.fechaEstimadaFinalizacion - Updated completion date
   * @returns {Promise} API response with updated tramite
   */
  update: (numeroTramite, data) => {
    return apiClient.put(`/tramites/${numeroTramite}`, data);
  },

  /**
   * Get tramites statistics
   * @returns {Promise} API response with statistics
   */
  getEstadisticas: () => {
    return apiClient.get('/tramites/estadisticas');
  },

  /**
   * Get API health status
   * @returns {Promise} API response with health status
   */
  health: () => {
    return apiClient.get('/health');
  },
};

export default tramitesAPI;
