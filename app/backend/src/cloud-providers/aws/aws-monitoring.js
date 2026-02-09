const MonitoringService = require('../../interfaces/monitoring.interface');
const AWS = require('aws-sdk');

class AWSMonitoring extends MonitoringService {
  constructor() {
    super();
    this.cloudwatch = new AWS.CloudWatch({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.logs = new AWS.CloudWatchLogs({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.logGroupName = process.env.AWS_LOG_GROUP || '/aws/govtech/api';
    this.logStreamName = `${new Date().toISOString().split('T')[0]}-${process.pid}`;
  }

  async log(level, message, metadata = {}) {
    try {
      const logEvent = {
        message: JSON.stringify({
          timestamp: new Date().toISOString(),
          level,
          message,
          ...metadata
        }),
        timestamp: Date.now()
      };

      await this.ensureLogStream();

      const params = {
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent]
      };

      await this.logs.putLogEvents(params).promise();
    } catch (error) {
      console.error(`CloudWatch Log Error: ${error.message}`);
      // Fallback to console
      console[level] || console.log(`[${level.toUpperCase()}]`, message, metadata);
    }
  }

  async sendMetric(metricName, value, unit = 'Count') {
    try {
      const params = {
        Namespace: 'GovTech/API',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date()
          }
        ]
      };

      await this.cloudwatch.putMetricData(params).promise();
    } catch (error) {
      console.error(`CloudWatch Metric Error: ${error.message}`);
    }
  }

  async createAlarm(alarmName, config) {
    try {
      const params = {
        AlarmName: alarmName,
        ComparisonOperator: config.comparisonOperator || 'GreaterThanThreshold',
        EvaluationPeriods: config.evaluationPeriods || 1,
        MetricName: config.metricName,
        Namespace: 'GovTech/API',
        Period: config.period || 300,
        Statistic: config.statistic || 'Average',
        Threshold: config.threshold,
        ActionsEnabled: true,
        AlarmDescription: config.description || '',
        AlarmActions: config.alarmActions || []
      };

      const result = await this.cloudwatch.putMetricAlarm(params).promise();
      return alarmName;
    } catch (error) {
      throw new Error(`CloudWatch Alarm Error: ${error.message}`);
    }
  }

  async ensureLogStream() {
    try {
      await this.logs.createLogStream({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName
      }).promise();
    } catch (error) {
      if (error.code !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }
  }
}

module.exports = AWSMonitoring;
