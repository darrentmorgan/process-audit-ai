/**
 * Webhook Signature Validation
 * ProcessAudit AI - Integration Security
 *
 * Provides secure webhook validation for PagerDuty, Slack, and other integrations
 */

import crypto from 'crypto';
import { logger } from '../logger';

/**
 * Validates PagerDuty webhook signature
 * @param {Object} params - Validation parameters
 * @param {string} params.payload - Raw webhook payload
 * @param {string} params.signature - Signature from PagerDuty
 * @param {string} params.secret - Webhook secret key
 * @returns {boolean} Whether signature is valid
 */
export function validatePagerDutyWebhook({ payload, signature, secret }) {
  const correlationId = `pd_webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    if (!payload || !signature || !secret) {
      logger.audit('PagerDuty webhook validation failed - missing parameters', {
        correlationId,
        hasPayload: !!payload,
        hasSignature: !!signature,
        hasSecret: !!secret,
        blocked: true
      });

      return false;
    }

    // PagerDuty uses HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('v1=', '');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );

    if (!isValid) {
      logger.audit('PagerDuty webhook signature validation failed', {
        correlationId,
        payloadLength: payload.length,
        providedSignature: providedSignature.substring(0, 10) + '...',
        expectedSignature: expectedSignature.substring(0, 10) + '...',
        blocked: true,
        securityViolation: true
      });
    } else {
      logger.info('PagerDuty webhook validated successfully', {
        correlationId,
        payloadLength: payload.length
      });
    }

    return isValid;

  } catch (error) {
    logger.error('PagerDuty webhook validation error', {
      correlationId,
      error: error.message,
      blocked: true
    });

    return false;
  }
}

/**
 * Validates Slack webhook signature
 * @param {Object} params - Validation parameters
 * @param {string} params.payload - Raw webhook payload
 * @param {string} params.timestamp - Slack timestamp header
 * @param {string} params.signature - Slack signature header
 * @param {string} params.signingSecret - Slack signing secret
 * @returns {boolean} Whether signature is valid
 */
export function validateSlackWebhook({ payload, timestamp, signature, signingSecret }) {
  const correlationId = `slack_webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    if (!payload || !timestamp || !signature || !signingSecret) {
      logger.audit('Slack webhook validation failed - missing parameters', {
        correlationId,
        hasPayload: !!payload,
        hasTimestamp: !!timestamp,
        hasSignature: !!signature,
        hasSigningSecret: !!signingSecret,
        blocked: true
      });

      return false;
    }

    // Check timestamp to prevent replay attacks (5 minutes tolerance)
    const now = Math.floor(Date.now() / 1000);
    const webhookTimestamp = parseInt(timestamp);

    if (Math.abs(now - webhookTimestamp) > 300) {
      logger.audit('Slack webhook timestamp validation failed - potential replay attack', {
        correlationId,
        currentTimestamp: now,
        webhookTimestamp,
        timeDifference: Math.abs(now - webhookTimestamp),
        blocked: true,
        securityViolation: true
      });

      return false;
    }

    // Slack signature validation
    const baseString = `v0:${timestamp}:${payload}`;
    const expectedSignature = 'v0=' + crypto
      .createHmac('sha256', signingSecret)
      .update(baseString)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );

    if (!isValid) {
      logger.audit('Slack webhook signature validation failed', {
        correlationId,
        timestamp,
        payloadLength: payload.length,
        providedSignature: signature.substring(0, 15) + '...',
        expectedSignature: expectedSignature.substring(0, 15) + '...',
        blocked: true,
        securityViolation: true
      });
    } else {
      logger.info('Slack webhook validated successfully', {
        correlationId,
        timestamp,
        payloadLength: payload.length
      });
    }

    return isValid;

  } catch (error) {
    logger.error('Slack webhook validation error', {
      correlationId,
      error: error.message,
      blocked: true
    });

    return false;
  }
}

/**
 * Generic webhook signature validator
 * @param {Object} params - Validation parameters
 * @param {string} params.payload - Raw webhook payload
 * @param {string} params.signature - Webhook signature
 * @param {string} params.secret - Webhook secret
 * @param {string} params.algorithm - Hash algorithm (default: sha256)
 * @param {string} params.encoding - Signature encoding (default: hex)
 * @returns {boolean} Whether signature is valid
 */
export function validateGenericWebhook({ payload, signature, secret, algorithm = 'sha256', encoding = 'hex' }) {
  const correlationId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    if (!payload || !signature || !secret) {
      logger.audit('Generic webhook validation failed - missing parameters', {
        correlationId,
        hasPayload: !!payload,
        hasSignature: !!signature,
        hasSecret: !!secret,
        blocked: true
      });

      return false;
    }

    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest(encoding);

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, encoding),
      Buffer.from(signature, encoding)
    );

    if (!isValid) {
      logger.audit('Generic webhook signature validation failed', {
        correlationId,
        algorithm,
        encoding,
        payloadLength: payload.length,
        blocked: true,
        securityViolation: true
      });
    }

    return isValid;

  } catch (error) {
    logger.error('Generic webhook validation error', {
      correlationId,
      error: error.message,
      algorithm,
      encoding,
      blocked: true
    });

    return false;
  }
}

/**
 * Rate limiting for API endpoints
 * @param {Object} req - Next.js request object
 * @param {Object} options - Rate limiting options
 * @returns {Object} Rate limit check result
 */
export function checkRateLimit(req, options = {}) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    keyGenerator = (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress
  } = options;

  const correlationId = req.headers['x-correlation-id'] || `rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const key = keyGenerator(req);
  const now = Date.now();

  // Simple in-memory rate limiting (use Redis in production)
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const windowStart = now - windowMs;
  const requests = global.rateLimitStore.get(key) || [];

  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);

  // Check if limit exceeded
  if (validRequests.length >= maxRequests) {
    logger.audit('Rate limit exceeded', {
      correlationId,
      key: key.substring(0, 10) + '...', // Partial IP for privacy
      requestCount: validRequests.length,
      maxRequests,
      windowMs,
      path: req.url,
      method: req.method,
      blocked: true
    });

    return {
      allowed: false,
      reason: 'rate_limit_exceeded',
      retryAfter: Math.ceil(windowMs / 1000),
      requestCount: validRequests.length,
      maxRequests
    };
  }

  // Add current request
  validRequests.push(now);
  global.rateLimitStore.set(key, validRequests);

  return {
    allowed: true,
    requestCount: validRequests.length,
    maxRequests,
    remaining: maxRequests - validRequests.length,
    resetTime: now + windowMs
  };
}

/**
 * Sanitizes error messages to prevent information disclosure
 * @param {Error} error - Error object
 * @param {Object} context - Request context
 * @returns {Object} Sanitized error response
 */
export function sanitizeErrorMessage(error, context = {}) {
  const { correlationId, userId, organizationId, isProduction = process.env.NODE_ENV === 'production' } = context;

  // Log full error details for debugging
  logger.error('API error occurred', {
    correlationId,
    userId,
    organizationId,
    error: error.message,
    stack: error.stack,
    path: context.path
  });

  // Return sanitized error in production
  if (isProduction) {
    const sanitizedMessage = getSanitizedErrorMessage(error.message);

    return {
      success: false,
      error: sanitizedMessage,
      correlationId,
      timestamp: new Date().toISOString()
    };
  }

  // Return detailed error in development
  return {
    success: false,
    error: error.message,
    correlationId,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
}

/**
 * Maps error messages to safe, user-friendly versions
 * @param {string} errorMessage - Original error message
 * @returns {string} Sanitized error message
 */
function getSanitizedErrorMessage(errorMessage) {
  const errorMap = {
    // Database errors
    'connection refused': 'Service temporarily unavailable',
    'timeout': 'Request timeout - please try again',
    'duplicate key': 'Resource already exists',
    'foreign key': 'Invalid reference - resource not found',

    // Authentication errors
    'invalid token': 'Authentication expired - please sign in again',
    'token expired': 'Session expired - please sign in again',
    'unauthorized': 'Access denied - insufficient permissions',

    // Validation errors
    'validation failed': 'Invalid input provided',
    'required field': 'Required information missing',
    'invalid format': 'Invalid data format provided',

    // External service errors
    'api error': 'External service temporarily unavailable',
    'rate limit': 'Too many requests - please try again later',
    'service unavailable': 'Service temporarily unavailable'
  };

  const errorLower = errorMessage.toLowerCase();

  for (const [pattern, sanitized] of Object.entries(errorMap)) {
    if (errorLower.includes(pattern)) {
      return sanitized;
    }
  }

  // Default sanitized message
  return 'An error occurred - please try again or contact support';
}

export default {
  validatePagerDutyWebhook,
  validateSlackWebhook,
  validateGenericWebhook,
  checkRateLimit,
  sanitizeErrorMessage
};