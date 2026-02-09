/**
 * Validation Utilities
 * Client-side validation functions matching backend rules
 */

/**
 * Validate DNI (exactly 8 digits)
 * @param {string} dni - DNI to validate
 * @returns {{valid: boolean, message: string}} Validation result
 */
export function validateDNI(dni) {
  if (!dni) {
    return { valid: false, message: 'DNI es requerido' };
  }

  const cleaned = dni.toString().replace(/\D/g, '');

  if (cleaned.length !== 8) {
    return { valid: false, message: 'DNI debe tener exactamente 8 dígitos' };
  }

  if (!/^\d{8}$/.test(cleaned)) {
    return { valid: false, message: 'DNI debe contener solo números' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate citizen name
 * @param {string} name - Name to validate
 * @returns {{valid: boolean, message: string}} Validation result
 */
export function validateNombreCiudadano(name) {
  if (!name) {
    return { valid: false, message: 'Nombre es requerido' };
  }

  if (name.length < 3) {
    return { valid: false, message: 'Nombre debe tener al menos 3 caracteres' };
  }

  if (name.length > 200) {
    return { valid: false, message: 'Nombre no puede exceder 200 caracteres' };
  }

  // Only letters, spaces, and some special characters
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(name)) {
    return { valid: false, message: 'Nombre solo puede contener letras y espacios' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate tramite type
 * @param {string} tipo - Tramite type
 * @returns {{valid: boolean, message: string}} Validation result
 */
export function validateTipoTramite(tipo) {
  const validTypes = [
    'DNI',
    'PASAPORTE',
    'LICENCIA_CONDUCIR',
    'PARTIDA_NACIMIENTO',
    'CERTIFICADO_ANTECEDENTES',
    'OTROS',
  ];

  if (!tipo) {
    return { valid: false, message: 'Tipo de trámite es requerido' };
  }

  if (!validTypes.includes(tipo)) {
    return { valid: false, message: 'Tipo de trámite inválido' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate observaciones
 * @param {string} observaciones - Observations text
 * @returns {{valid: boolean, message: string}} Validation result
 */
export function validateObservaciones(observaciones) {
  if (!observaciones) {
    return { valid: true, message: '' }; // Optional field
  }

  if (observaciones.length > 500) {
    return { valid: false, message: 'Observaciones no puede exceder 500 caracteres' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate estimated completion date
 * @param {string} fecha - Date in ISO format or yyyy-MM-dd
 * @returns {{valid: boolean, message: string}} Validation result
 */
export function validateFechaEstimada(fecha) {
  if (!fecha) {
    return { valid: true, message: '' }; // Optional field
  }

  const fechaObj = new Date(fecha);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day

  if (isNaN(fechaObj.getTime())) {
    return { valid: false, message: 'Fecha inválida' };
  }

  if (fechaObj < now) {
    return { valid: false, message: 'Fecha debe ser en el futuro' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate documentos pendientes array
 * @param {Array<string>} documentos - Array of pending documents
 * @returns {{valid: boolean, message: string}} Validation result
 */
export function validateDocumentosPendientes(documentos) {
  if (!documentos || !Array.isArray(documentos)) {
    return { valid: true, message: '' }; // Optional field
  }

  if (documentos.length > 20) {
    return { valid: false, message: 'No puede haber más de 20 documentos pendientes' };
  }

  // Check each document is a non-empty string
  const hasInvalid = documentos.some(doc => !doc || typeof doc !== 'string' || doc.trim() === '');
  if (hasInvalid) {
    return { valid: false, message: 'Cada documento debe ser un texto válido' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate entire tramite form
 * @param {Object} formData - Form data object
 * @returns {{valid: boolean, errors: Object}} Validation result with errors
 */
export function validateTramiteForm(formData) {
  const errors = {};

  const dniValidation = validateDNI(formData.dni);
  if (!dniValidation.valid) errors.dni = dniValidation.message;

  const nameValidation = validateNombreCiudadano(formData.nombreCiudadano);
  if (!nameValidation.valid) errors.nombreCiudadano = nameValidation.message;

  const tipoValidation = validateTipoTramite(formData.tipoTramite);
  if (!tipoValidation.valid) errors.tipoTramite = tipoValidation.message;

  if (formData.observaciones) {
    const obsValidation = validateObservaciones(formData.observaciones);
    if (!obsValidation.valid) errors.observaciones = obsValidation.message;
  }

  if (formData.fechaEstimadaFinalizacion) {
    const fechaValidation = validateFechaEstimada(formData.fechaEstimadaFinalizacion);
    if (!fechaValidation.valid) errors.fechaEstimadaFinalizacion = fechaValidation.message;
  }

  if (formData.documentosPendientes) {
    const docsValidation = validateDocumentosPendientes(formData.documentosPendientes);
    if (!docsValidation.valid) errors.documentosPendientes = docsValidation.message;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
