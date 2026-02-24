import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health endpoints
export const getHealth = () => api.get('/api/health');
export const getDatabaseHealth = () => api.get('/api/health/database');
export const getCloudHealth = () => api.get('/api/health/cloud');

// Info endpoints
export const getPlatformInfo = () => api.get('/api/info');
export const getProviderInfo = () => api.get('/api/info/provider');
export const getArchitectureInfo = () => api.get('/api/info/architecture');

// Migration endpoints
export const scanInfrastructure = () => api.post('/api/migration/scan');
export const createMigrationPlan = (from, to) =>
  api.post('/api/migration/plan', { from, to });
export const getProviders = () => api.get('/api/migration/providers');

// Demo endpoints
export const getDemoCloudInfrastructure = (provider = 'aws') =>
  api.get(`/api/demo/cloud-infrastructure?provider=${provider}`);
export const getDemoOnPremiseInfrastructure = () =>
  api.get('/api/demo/on-premise-infrastructure');
export const getDemoMigrationWaves = () =>
  api.get('/api/demo/migration-waves');
export const getDemoDependencyGraph = () =>
  api.get('/api/demo/dependency-graph');
export const simulateMigration = (wave, serverIds) =>
  api.post('/api/demo/simulate-migration', { wave, serverIds });

export default api;
