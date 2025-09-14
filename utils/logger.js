import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/nextjs';

/**
 * Structured Logger for ProcessAudit AI
 * Provides consistent logging with correlation IDs and multi-tenant context
 */
export class Logger {
  constructor(service = 'processaudit-api') {
    this.service = service;
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Create a structured log entry
   */
  createLogEntry(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const correlationId = metadata.correlationId || uuidv4();

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.service,
      environment: this.environment,
      correlationId,
      message,
      ...metadata
    };

    // Add organization context if available
    if (metadata.organizationId) {
      logEntry.organization = {
        id: metadata.organizationId,
        plan: metadata.organizationPlan || 'unknown'
      };
    }

    // Add user context if available
    if (metadata.userId) {
      logEntry.user = {
        id: metadata.userId,
        role: metadata.userRole || 'unknown'
      };
    }

    // Add performance metrics if available
    if (metadata.duration) {
      logEntry.performance = {
        duration: `${metadata.duration}ms`,
        ...(metadata.performanceMetrics || {})
      };
    }

    // Add API context if available
    if (metadata.request) {
      logEntry.request = {
        method: metadata.request.method,
        url: metadata.request.url,
        userAgent: metadata.request.headers?.['user-agent'],
        ip: metadata.request.ip || metadata.request.headers?.['x-forwarded-for'],
        ...(metadata.requestContext || {})
      };
    }

    return logEntry;
  }

  /**
   * Log info message
   */
  info(message, metadata = {}) {
    const logEntry = this.createLogEntry('info', message, metadata);
    console.log(JSON.stringify(logEntry));

    // Send to Sentry as breadcrumb for context
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: metadata,
      timestamp: new Date().getTime() / 1000
    });

    return logEntry.correlationId;
  }

  /**
   * Log warning message
   */
  warn(message, metadata = {}) {
    const logEntry = this.createLogEntry('warn', message, metadata);
    console.warn(JSON.stringify(logEntry));

    // Send to Sentry as warning
    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: metadata,
      timestamp: new Date().getTime() / 1000
    });

    return logEntry.correlationId;
  }

  /**
   * Log error message
   */
  error(message, error = null, metadata = {}) {
    const logEntry = this.createLogEntry('error', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null
    });

    console.error(JSON.stringify(logEntry));

    // Send error to Sentry
    if (error) {
      Sentry.withScope(scope => {
        // Add organization context to Sentry
        if (metadata.organizationId) {
          scope.setTag('organizationId', metadata.organizationId);
          scope.setContext('organization', {
            id: metadata.organizationId,
            plan: metadata.organizationPlan
          });
        }

        // Add user context to Sentry
        if (metadata.userId) {
          scope.setUser({
            id: metadata.userId,
            role: metadata.userRole
          });
        }

        // Add correlation ID
        scope.setTag('correlationId', logEntry.correlationId);

        // Add custom context
        scope.setContext('logMetadata', metadata);

        Sentry.captureException(error);
      });
    } else {
      // Log error message without exception
      Sentry.captureMessage(message, 'error');
    }

    return logEntry.correlationId;
  }

  /**
   * Log debug message (only in development)
   */
  debug(message, metadata = {}) {
    if (this.environment === 'development') {
      const logEntry = this.createLogEntry('debug', message, metadata);
      console.debug(JSON.stringify(logEntry));
      return logEntry.correlationId;
    }
  }

  /**
   * Start a performance timer
   */
  startTimer(operationName, metadata = {}) {
    const correlationId = metadata.correlationId || uuidv4();
    const startTime = Date.now();

    return {
      correlationId,
      end: (additionalMetadata = {}) => {
        const duration = Date.now() - startTime;

        this.info(`Operation completed: ${operationName}`, {
          ...metadata,
          ...additionalMetadata,
          correlationId,
          duration,
          operation: operationName
        });

        return { correlationId, duration };
      }
    };
  }

  /**
   * Log API request start
   */
  apiRequestStart(req, metadata = {}) {
    const correlationId = uuidv4();

    // Add correlation ID to request object for use in subsequent logs
    req.correlationId = correlationId;

    const logMetadata = {
      correlationId,
      request: {
        method: req.method,
        url: req.url,
        userAgent: req.headers?.['user-agent'],
        ip: req.ip || req.headers?.['x-forwarded-for']
      },
      ...metadata
    };

    this.info(`API request started: ${req.method} ${req.url}`, logMetadata);

    return {
      correlationId,
      startTime: Date.now(),
      end: (statusCode, additionalMetadata = {}) => {
        const duration = Date.now() - Date.now();

        this.info(`API request completed: ${req.method} ${req.url}`, {
          ...logMetadata,
          ...additionalMetadata,
          response: {
            statusCode,
            duration: `${duration}ms`
          }
        });

        return correlationId;
      }
    };
  }

  /**
   * Log AI operation
   */
  logAIOperation(provider, operation, metadata = {}) {
    const correlationId = metadata.correlationId || uuidv4();

    const aiMetadata = {
      ...metadata,
      correlationId,
      ai: {
        provider,
        operation,
        model: metadata.model,
        inputTokens: metadata.inputTokens,
        outputTokens: metadata.outputTokens,
        cost: metadata.cost
      }
    };

    if (metadata.error) {
      this.error(`AI operation failed: ${provider} ${operation}`, metadata.error, aiMetadata);
    } else {
      this.info(`AI operation completed: ${provider} ${operation}`, aiMetadata);
    }

    return correlationId;
  }

  /**
   * Log multi-tenant operation
   */
  logTenantOperation(operation, organizationId, metadata = {}) {
    const correlationId = metadata.correlationId || uuidv4();

    const tenantMetadata = {
      ...metadata,
      correlationId,
      organizationId,
      tenant: {
        operation,
        organizationId,
        organizationPlan: metadata.organizationPlan
      }
    };

    this.info(`Tenant operation: ${operation}`, tenantMetadata);

    return correlationId;
  }

  /**
   * Log audit event for compliance and security
   */
  audit(message, metadata = {}) {
    const logEntry = this.createLogEntry('audit', message, {
      ...metadata,
      auditEvent: true,
      complianceRelevant: true,
      securityRelevant: metadata.securityViolation || metadata.riskLevel === 'CRITICAL'
    });

    console.log(JSON.stringify(logEntry));

    // Send critical security audits to Sentry with high priority
    if (metadata.securityViolation || metadata.riskLevel === 'CRITICAL') {
      Sentry.withScope(scope => {
        scope.setLevel('warning');
        scope.setTag('auditEvent', true);
        scope.setTag('securityAudit', true);
        scope.setTag('correlationId', logEntry.correlationId);

        if (metadata.organizationId) {
          scope.setTag('organizationId', metadata.organizationId);
        }

        if (metadata.userId) {
          scope.setTag('userId', metadata.userId);
        }

        scope.setContext('auditMetadata', metadata);

        Sentry.captureMessage(`Security Audit: ${message}`, 'warning');
      });
    }

    return logEntry.correlationId;
  }
}

// Create singleton logger instances
export const logger = new Logger('processaudit-api');
export const workerLogger = new Logger('processaudit-worker');
export const aiLogger = new Logger('processaudit-ai');

// Export utility functions for easy use
export const logInfo = (message, metadata) => logger.info(message, metadata);
export const logWarn = (message, metadata) => logger.warn(message, metadata);
export const logError = (message, error, metadata) => logger.error(message, error, metadata);
export const logDebug = (message, metadata) => logger.debug(message, metadata);
export const logAudit = (message, metadata) => logger.audit(message, metadata);

// Export specialized logging functions
export const logAPIRequest = (req, metadata) => logger.apiRequestStart(req, metadata);
export const logAIOperation = (provider, operation, metadata) => logger.logAIOperation(provider, operation, metadata);
export const logTenantOperation = (operation, organizationId, metadata) => logger.logTenantOperation(operation, organizationId, metadata);

export default logger;