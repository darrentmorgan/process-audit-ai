/**
 * PagerDuty Configuration Validator
 * ProcessAudit AI - Monitoring Infrastructure
 */

/**
 * Validates PagerDuty service key configuration
 * @param {Object} config - PagerDuty configuration
 * @param {string} config.serviceKey - PagerDuty service key
 * @param {string} config.type - Service type (primary, security, etc.)
 * @returns {Object} Validation result
 */
export function validatePagerDutyConfig({ serviceKey, type = 'primary' }) {
  const errors = [];

  // Check if service key exists
  if (!serviceKey) {
    errors.push('Service key not configured');
    return {
      isValid: false,
      errors,
      serviceKey: null,
      type
    };
  }

  // Validate service key format (PagerDuty integration keys are typically 32 characters)
  const serviceKeyRegex = /^[a-zA-Z0-9]{20,}$/;
  if (!serviceKeyRegex.test(serviceKey)) {
    errors.push('Invalid service key format');
  }

  // Validate type
  const validTypes = ['primary', 'security', 'business'];
  if (!validTypes.includes(type)) {
    errors.push(`Invalid service type. Must be one of: ${validTypes.join(', ')}`);
  }

  const result = {
    isValid: errors.length === 0,
    errors,
    serviceKey,
    type
  };

  // Add type-specific configuration
  if (type === 'security') {
    result.escalationLevel = 'immediate';
    result.priority = 'high';
  }

  return result;
}

/**
 * Validates all PagerDuty service configurations
 * @returns {Object} Complete validation result
 */
export function validateAllPagerDutyConfigs() {
  const configs = [
    {
      name: 'primary',
      serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
      type: 'primary'
    },
    {
      name: 'security',
      serviceKey: process.env.PAGERDUTY_SECURITY_SERVICE_KEY,
      type: 'security'
    }
  ];

  const results = {};
  let overallValid = true;

  configs.forEach(config => {
    const result = validatePagerDutyConfig(config);
    results[config.name] = result;

    if (!result.isValid) {
      overallValid = false;
    }
  });

  return {
    isValid: overallValid,
    configs: results,
    summary: {
      total: configs.length,
      valid: Object.values(results).filter(r => r.isValid).length,
      invalid: Object.values(results).filter(r => !r.isValid).length
    }
  };
}

export default {
  validatePagerDutyConfig,
  validateAllPagerDutyConfigs
};