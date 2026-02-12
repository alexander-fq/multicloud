/**
 * OCI Monitoring Service
 * Handles logging, metrics, and monitoring for Oracle Cloud Infrastructure
 * Equivalent to AWS CloudWatch
 */

const logging = require('oci-logging');
const monitoring = require('oci-monitoring');
const logger = require('../../utils/logger');

class OCIMonitoringService {
  constructor(authService) {
    this.authService = authService;
    this.loggingClient = null;
    this.monitoringClient = null;
    this.initialized = false;
  }

  /**
   * Initialize OCI Logging and Monitoring clients
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await this.authService.initialize();
      const provider = this.authService.getProvider();

      this.loggingClient = new logging.LoggingManagementClient({
        authenticationDetailsProvider: provider
      });

      this.monitoringClient = new monitoring.MonitoringClient({
        authenticationDetailsProvider: provider
      });

      this.initialized = true;
      logger.info('OCI Monitoring and Logging initialized successfully');
    } catch (error) {
      logger.error('OCI Monitoring initialization failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Log an event to OCI Logging
   * @param {string} logGroupId - Log group OCID
   * @param {string} logId - Log OCID
   * @param {string} message - Log message
   * @param {string} level - Log level (INFO, WARN, ERROR)
   * @returns {Promise<Object>} Log result
   */
  async logEvent(logGroupId, logId, message, level = 'INFO') {
    try {
      await this.initialize();

      // Create log entry
      const logEntry = {
        data: message,
        id: `log-${Date.now()}`,
        time: new Date().toISOString()
      };

      // Post log to OCI Logging
      const putRequest = {
        logId,
        putLogsDetails: {
          specversion: '1.0',
          logEntryBatches: [
            {
              entries: [logEntry],
              source: 'migration-platform',
              type: level,
              defaultlogentrytime: new Date()
            }
          ]
        }
      };

      await this.loggingClient.putLogs(putRequest);

      logger.debug('Event logged to OCI', {
        logId,
        level,
        message: message.substring(0, 100)
      });

      return {
        success: true,
        logId,
        level,
        timestamp: logEntry.time
      };
    } catch (error) {
      logger.error('Failed to log event to OCI', {
        error: error.message,
        logId
      });
      throw error;
    }
  }

  /**
   * Get metrics from OCI Monitoring
   * @param {string} query - MQL (Monitoring Query Language) query
   * @param {Date} startTime - Start time for metrics
   * @param {Date} endTime - End time for metrics
   * @returns {Promise<Array>} Metrics data
   */
  async getMetrics(query, startTime, endTime) {
    try {
      await this.initialize();

      const tenancyId = this.authService.getTenancyId();

      const request = {
        compartmentId: tenancyId,
        summarizeMetricsDataDetails: {
          namespace: 'migration_metrics',
          query,
          startTime,
          endTime,
          resolution: '1m'
        }
      };

      const response = await this.monitoringClient.summarizeMetricsData(request);

      const metrics = response.items.map(item => ({
        timestamp: item.timestamp,
        value: item.aggregatedDatapoints?.[0]?.value || 0,
        dimensions: item.dimensions,
        metadata: item.metadata
      }));

      logger.debug('Retrieved metrics from OCI', {
        query,
        count: metrics.length
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to get metrics from OCI', {
        error: error.message,
        query
      });
      throw error;
    }
  }

  /**
   * Create an alarm in OCI Monitoring
   * @param {string} compartmentId - Compartment OCID
   * @param {string} alarmName - Alarm name
   * @param {string} query - MQL query for the alarm
   * @param {number} threshold - Alarm threshold
   * @param {Array} destinations - Notification destination OCIDs
   * @returns {Promise<Object>} Created alarm details
   */
  async createAlarm(compartmentId, alarmName, query, threshold, destinations = []) {
    try {
      await this.initialize();

      const createRequest = {
        createAlarmDetails: {
          displayName: alarmName,
          compartmentId,
          metricCompartmentId: compartmentId,
          namespace: 'migration_metrics',
          query,
          severity: 'CRITICAL',
          destinations,
          isEnabled: true,
          body: `Alarm triggered: ${alarmName}`,
          pendingDuration: 'PT5M', // 5 minutes
          resolution: '1m',
          resourceGroup: 'migration-platform',
          supressUntil: null
        }
      };

      const response = await this.monitoringClient.createAlarm(createRequest);

      logger.info('Created OCI alarm', {
        alarmId: response.alarm.id,
        alarmName: response.alarm.displayName
      });

      return {
        alarmId: response.alarm.id,
        alarmName: response.alarm.displayName,
        state: response.alarm.lifecycleState,
        severity: response.alarm.severity,
        isEnabled: response.alarm.isEnabled
      };
    } catch (error) {
      logger.error('Failed to create OCI alarm', {
        error: error.message,
        alarmName
      });
      throw error;
    }
  }

  /**
   * List all alarms in a compartment
   * @param {string} compartmentId - Compartment OCID
   * @returns {Promise<Array>} List of alarms
   */
  async listAlarms(compartmentId) {
    try {
      await this.initialize();

      const request = {
        compartmentId
      };

      const response = await this.monitoringClient.listAlarms(request);

      const alarms = response.items.map(alarm => ({
        id: alarm.id,
        displayName: alarm.displayName,
        severity: alarm.severity,
        lifecycleState: alarm.lifecycleState,
        isEnabled: alarm.isEnabled,
        namespace: alarm.namespace
      }));

      logger.debug('Listed OCI alarms', {
        compartmentId,
        count: alarms.length
      });

      return alarms;
    } catch (error) {
      logger.error('Failed to list OCI alarms', {
        error: error.message,
        compartmentId
      });
      throw error;
    }
  }

  /**
   * Get alarm history/status
   * @param {string} alarmId - Alarm OCID
   * @returns {Promise<Object>} Alarm status and history
   */
  async getAlarmStatus(alarmId) {
    try {
      await this.initialize();

      const request = {
        alarmId
      };

      const response = await this.monitoringClient.getAlarmHistory(request);

      logger.debug('Retrieved OCI alarm status', { alarmId });

      return {
        alarmId,
        history: response.alarmHistoryCollection.entries.map(entry => ({
          summary: entry.summary,
          timestamp: entry.timestamp,
          timestampTriggered: entry.timestampTriggered
        }))
      };
    } catch (error) {
      logger.error('Failed to get OCI alarm status', {
        error: error.message,
        alarmId
      });
      throw error;
    }
  }

  /**
   * Post metric data to OCI Monitoring
   * @param {string} namespace - Metric namespace
   * @param {Object} metricData - Metric data
   * @returns {Promise<Object>} Post result
   */
  async postMetric(namespace, metricData) {
    try {
      await this.initialize();

      const tenancyId = this.authService.getTenancyId();

      const request = {
        postMetricDataDetails: {
          metricData: [
            {
              namespace,
              compartmentId: tenancyId,
              name: metricData.name,
              dimensions: metricData.dimensions || {},
              datapoints: [
                {
                  timestamp: new Date(),
                  value: metricData.value,
                  count: metricData.count || 1
                }
              ],
              metadata: metricData.metadata || {}
            }
          ]
        }
      };

      const response = await this.monitoringClient.postMetricData(request);

      logger.debug('Posted metric to OCI', {
        namespace,
        metricName: metricData.name,
        value: metricData.value
      });

      return {
        success: true,
        namespace,
        metricName: metricData.name,
        failedMetricsCount: response.postMetricDataResponseDetails.failedMetricsCount
      };
    } catch (error) {
      logger.error('Failed to post metric to OCI', {
        error: error.message,
        namespace
      });
      throw error;
    }
  }
}

module.exports = OCIMonitoringService;
