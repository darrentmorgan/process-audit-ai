/**
 * Slack Configuration Validator
 * ProcessAudit AI - Monitoring Infrastructure
 */

/**
 * Validates Slack webhook URL format
 * @param {string} webhookUrl - Slack webhook URL
 * @returns {boolean} True if valid
 */
function isValidWebhookUrl(webhookUrl) {
  if (!webhookUrl) return false;

  const webhookRegex = /^https:\/\/hooks\.slack\.com\/[A-Z0-9\/]+$/i;
  return webhookRegex.test(webhookUrl);
}

/**
 * Validates Slack configuration for monitoring alerts
 * @param {Object} config - Slack configuration
 * @returns {Object} Validation result
 */
export function validateSlackConfig(config) {
  const {
    criticalWebhook,
    warningWebhook,
    businessWebhook,
    securityWebhook
  } = config;

  const errors = [];
  const validChannels = [];
  const configuredChannels = [];

  // Define channel configurations
  const channels = [
    { name: 'critical', webhook: criticalWebhook, required: true },
    { name: 'warning', webhook: warningWebhook, required: true },
    { name: 'business', webhook: businessWebhook, required: false },
    { name: 'security', webhook: securityWebhook, required: false }
  ];

  channels.forEach(channel => {
    if (channel.webhook) {
      configuredChannels.push(channel.name);

      if (isValidWebhookUrl(channel.webhook)) {
        validChannels.push(channel.name);
      } else {
        errors.push(`Invalid webhook URL format: ${channel.name}`);
      }
    } else if (channel.required) {
      errors.push(`Missing required webhook: ${channel.name}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validChannels,
    configuredChannels,
    summary: {
      total: channels.length,
      configured: configuredChannels.length,
      valid: validChannels.length,
      invalid: configuredChannels.length - validChannels.length
    }
  };
}

/**
 * Validates Slack message size limits
 * @param {Object} message - Slack message object
 * @returns {Object} Validation result
 */
export function validateMessageSize(message) {
  const messageJson = JSON.stringify(message);
  const sizeKB = Buffer.byteLength(messageJson, 'utf8') / 1024;

  // Slack limits: 40KB total, 10 fields per attachment, 3000 chars per field
  const limits = {
    totalSize: 40, // KB
    fieldsPerAttachment: 10,
    charsPerField: 3000
  };

  const issues = [];

  if (sizeKB > limits.totalSize) {
    issues.push(`Message size ${sizeKB.toFixed(1)}KB exceeds ${limits.totalSize}KB limit`);
  }

  if (message.attachments) {
    message.attachments.forEach((attachment, index) => {
      if (attachment.fields && attachment.fields.length > limits.fieldsPerAttachment) {
        issues.push(`Attachment ${index} has ${attachment.fields.length} fields, limit is ${limits.fieldsPerAttachment}`);
      }

      if (attachment.fields) {
        attachment.fields.forEach((field, fieldIndex) => {
          if (field.value && field.value.length > limits.charsPerField) {
            issues.push(`Attachment ${index} field ${fieldIndex} exceeds ${limits.charsPerField} character limit`);
          }
        });
      }
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    sizeKB,
    limits
  };
}

export default {
  validateSlackConfig,
  validateMessageSize,
  isValidWebhookUrl
};