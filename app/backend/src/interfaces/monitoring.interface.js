/**
 * Monitoring Service Interface
 * All cloud providers must implement these methods
 */
class MonitoringService {
  /**
   * Log a message
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async log(level, message, metadata = {}) {
    throw new Error('Method log() must be implemented');
  }

  /**
   * Send a metric
   * @param {string} metricName - Metric name
   * @param {number} value - Metric value
   * @param {string} unit - Unit (Count, Bytes, Seconds, etc.)
   * @returns {Promise<void>}
   */
  async sendMetric(metricName, value, unit = 'Count') {
    throw new Error('Method sendMetric() must be implemented');
  }

  /**
   * Create an alarm
   * @param {string} alarmName - Alarm name
   * @param {Object} config - Alarm configuration
   * @returns {Promise<string>} - Alarm ID
   */
  async createAlarm(alarmName, config) {
    throw new Error('Method createAlarm() must be implemented');
  }
}

module.exports = MonitoringService;
