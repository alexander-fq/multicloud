/**
 * Application Constants
 * Contains enums and constant values used across the app
 */

// Tramite Types
export const TipoTramite = {
  DNI: 'DNI',
  PASAPORTE: 'PASAPORTE',
  LICENCIA_CONDUCIR: 'LICENCIA_CONDUCIR',
  PARTIDA_NACIMIENTO: 'PARTIDA_NACIMIENTO',
  CERTIFICADO_ANTECEDENTES: 'CERTIFICADO_ANTECEDENTES',
  OTROS: 'OTROS',
};

export const TipoTramiteLabels = {
  [TipoTramite.DNI]: 'DNI',
  [TipoTramite.PASAPORTE]: 'Pasaporte',
  [TipoTramite.LICENCIA_CONDUCIR]: 'Licencia de Conducir',
  [TipoTramite.PARTIDA_NACIMIENTO]: 'Partida de Nacimiento',
  [TipoTramite.CERTIFICADO_ANTECEDENTES]: 'Certificado de Antecedentes',
  [TipoTramite.OTROS]: 'Otros',
};

// Tramite Estados
export const EstadoTramite = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADO: 'COMPLETADO',
  RECHAZADO: 'RECHAZADO',
  CANCELADO: 'CANCELADO',
};

export const EstadoTramiteLabels = {
  [EstadoTramite.PENDIENTE]: 'Pendiente',
  [EstadoTramite.EN_PROCESO]: 'En Proceso',
  [EstadoTramite.COMPLETADO]: 'Completado',
  [EstadoTramite.RECHAZADO]: 'Rechazado',
  [EstadoTramite.CANCELADO]: 'Cancelado',
};

// Status Colors (TailwindCSS classes)
export const EstadoColors = {
  [EstadoTramite.PENDIENTE]: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
  },
  [EstadoTramite.EN_PROCESO]: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
  },
  [EstadoTramite.COMPLETADO]: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
  },
  [EstadoTramite.RECHAZADO]: {
    bg: 'bg-error/10',
    text: 'text-error',
    border: 'border-error/20',
  },
  [EstadoTramite.CANCELADO]: {
    bg: 'bg-neutral/10',
    text: 'text-neutral',
    border: 'border-neutral/20',
  },
};

// Icons for each tramite type
export const TipoTramiteIcons = {
  [TipoTramite.DNI]: 'badge',
  [TipoTramite.PASAPORTE]: 'airplane_ticket',
  [TipoTramite.LICENCIA_CONDUCIR]: 'drive_eta',
  [TipoTramite.PARTIDA_NACIMIENTO]: 'description',
  [TipoTramite.CERTIFICADO_ANTECEDENTES]: 'verified_user',
  [TipoTramite.OTROS]: 'folder',
};

// Icons for each status
export const EstadoIcons = {
  [EstadoTramite.PENDIENTE]: 'schedule',
  [EstadoTramite.EN_PROCESO]: 'autorenew',
  [EstadoTramite.COMPLETADO]: 'check_circle',
  [EstadoTramite.RECHAZADO]: 'cancel',
  [EstadoTramite.CANCELADO]: 'block',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// API configuration
export const API_CONFIG = {
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
};

// Feature flags
export const FEATURES = {
  STATISTICS: import.meta.env.VITE_ENABLE_STATISTICS === 'true',
  EXPORT: import.meta.env.VITE_ENABLE_EXPORT === 'true',
  PRINT: import.meta.env.VITE_ENABLE_PRINT === 'true',
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
};
