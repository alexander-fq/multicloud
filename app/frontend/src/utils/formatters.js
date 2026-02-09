import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { DATE_FORMATS } from './constants';

/**
 * Format date to display format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, DATE_FORMATS.DISPLAY, { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date with time
 */
export function formatDateTime(date) {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, DATE_FORMATS.DISPLAY_WITH_TIME, { locale: es });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '-';
  }
}

/**
 * Format date to relative time (e.g., "hace 2 días")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time
 */
export function formatRelativeTime(date) {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { locale: es, addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '-';
  }
}

/**
 * Format date for input fields (yyyy-MM-dd)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date for input
 */
export function formatInputDate(date) {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, DATE_FORMATS.INPUT);
  } catch (error) {
    console.error('Error formatting input date:', error);
    return '';
  }
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format DNI with dashes (12345678 -> 12.345.678)
 * @param {string} dni - DNI number
 * @returns {string} Formatted DNI
 */
export function formatDNI(dni) {
  if (!dni) return '';
  const cleaned = dni.toString().replace(/\D/g, '');
  if (cleaned.length !== 8) return dni;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
}

/**
 * Format number with thousands separator
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(number) {
  if (number === null || number === undefined) return '0';
  return new Intl.NumberFormat('es-ES').format(number);
}

/**
 * Calculate progress percentage based on status
 * @param {string} estado - Tramite status
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(estado) {
  const progressMap = {
    PENDIENTE: 20,
    EN_PROCESO: 60,
    COMPLETADO: 100,
    RECHAZADO: 0,
    CANCELADO: 0,
  };
  return progressMap[estado] || 0;
}
