import axios from 'axios';
import { API_CONFIG } from '../utils/constants';

/**
 * Axios Client Configuration
 * Centralized HTTP client with interceptors
 */

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Add custom headers, tokens, etc.
 */
apiClient.interceptors.request.use(
  config => {
    // You can add auth tokens here in the future
    // config.headers.Authorization = `Bearer ${token}`;

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params);
    }

    return config;
  },
  error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle responses and errors globally
 */
apiClient.interceptors.response.use(
  response => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }

    // Return only the data part of the response
    return response.data;
  },
  error => {
    // Extract error message
    let message = 'Error de conexión con el servidor';

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      message = data?.message || `Error del servidor (${status})`;

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(
          `[API Error] ${status} - ${error.config?.url}`,
          data
        );
      }

      // Handle specific error codes
      switch (status) {
        case 400:
          message = data?.message || 'Datos inválidos';
          break;
        case 404:
          message = data?.message || 'Recurso no encontrado';
          break;
        case 409:
          message = data?.message || 'Conflicto: el recurso ya existe';
          break;
        case 429:
          message = 'Demasiadas solicitudes. Por favor, intenta más tarde.';
          break;
        case 500:
          message = 'Error interno del servidor';
          break;
        case 503:
          message = 'Servicio no disponible';
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API Error] No response received', error.request);
      message = 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else {
      // Something else happened
      console.error('[API Error] Request setup error', error.message);
      message = error.message || 'Error al procesar la solicitud';
    }

    // Create enhanced error object
    const enhancedError = new Error(message);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;

    return Promise.reject(enhancedError);
  }
);

export default apiClient;
