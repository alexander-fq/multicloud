const AuthService = require('../../interfaces/auth.interface');
const AWS = require('aws-sdk');

class AWSAuth extends AuthService {
  constructor() {
    super();
    this.sts = new AWS.STS({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.iam = new AWS.IAM();
  }

  async verifyCredentials() {
    try {
      await this.sts.getCallerIdentity().promise();
      return true;
    } catch (error) {
      console.error('AWS Credentials verification failed:', error.message);
      return false;
    }
  }

  async getCurrentIdentity() {
    try {
      const identity = await this.sts.getCallerIdentity().promise();
      return {
        account: identity.Account,
        userId: identity.UserId,
        arn: identity.Arn,
        provider: 'aws'
      };
    } catch (error) {
      throw new Error(`AWS Get Identity Error: ${error.message}`);
    }
  }

  async assumeRole(roleArn) {
    try {
      const params = {
        RoleArn: roleArn,
        RoleSessionName: `govtech-session-${Date.now()}`,
        DurationSeconds: 3600
      };

      const result = await this.sts.assumeRole(params).promise();
      return {
        accessKeyId: result.Credentials.AccessKeyId,
        secretAccessKey: result.Credentials.SecretAccessKey,
        sessionToken: result.Credentials.SessionToken,
        expiration: result.Credentials.Expiration
      };
    } catch (error) {
      throw new Error(`AWS Assume Role Error: ${error.message}`);
    }
  }
}

module.exports = AWSAuth;
