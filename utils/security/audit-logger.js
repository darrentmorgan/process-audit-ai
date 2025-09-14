/**
 * Enhanced Audit Logging System
 * ProcessAudit AI - Compliance & Security Audit
 *
 * Provides comprehensive audit logging for compliance and security monitoring
 */

import { logger } from '../logger';

/**
 * Audit event types for compliance tracking
 */
export const AUDIT_EVENTS = {
  // Authentication events
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_LOGIN_FAILED: 'user_login_failed',
  SESSION_EXPIRED: 'session_expired',

  // Organization events
  ORG_CREATED: 'organization_created',
  ORG_UPDATED: 'organization_updated',
  ORG_DELETED: 'organization_deleted',
  ORG_SWITCHED: 'organization_switched',

  // Data access events
  DATA_ACCESSED: 'data_accessed',
  DATA_CREATED: 'data_created',
  DATA_UPDATED: 'data_updated',
  DATA_DELETED: 'data_deleted',
  DATA_EXPORTED: 'data_exported',

  // Security events
  SECURITY_VIOLATION: 'security_violation',
  CROSS_TENANT_ATTEMPT: 'cross_tenant_access_attempt',
  PRIVILEGE_ESCALATION: 'privilege_escalation_attempt',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  WEBHOOK_VALIDATION_FAILED: 'webhook_validation_failed',

  // Compliance events
  GDPR_REQUEST: 'gdpr_request',
  DATA_RETENTION_POLICY: 'data_retention_policy_applied',
  PRIVACY_SETTING_CHANGED: 'privacy_setting_changed',

  // Business events
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  PDF_GENERATED: 'pdf_generated',
  AUTOMATION_CREATED: 'automation_created'
};

/**
 * Enhanced audit logger with compliance features
 */
class AuditLogger {
  constructor() {
    this.auditTrail = [];
    this.complianceMode = process.env.NODE_ENV === 'production';
  }

  /**
   * Logs an audit event with comprehensive context
   * @param {string} eventType - Type of event (use AUDIT_EVENTS constants)
   * @param {Object} context - Event context
   */
  logEvent(eventType, context = {}) {
    const auditRecord = {
      timestamp: new Date().toISOString(),
      eventType,
      correlationId: context.correlationId || this.generateCorrelationId(),
      userId: context.userId,
      organizationId: context.organizationId,
      sessionId: context.sessionId,
      ipAddress: this.sanitizeIP(context.ipAddress),
      userAgent: context.userAgent,
      path: context.path,
      method: context.method,
      resource: context.resource,
      action: context.action,
      result: context.result || 'success',
      riskLevel: context.riskLevel || 'LOW',
      complianceRelevant: this.isComplianceRelevant(eventType),
      ...context.customFields
    };

    // Remove sensitive data in compliance mode
    if (this.complianceMode) {
      auditRecord.ipAddress = this.hashSensitiveData(auditRecord.ipAddress);
      auditRecord.userAgent = this.sanitizeUserAgent(auditRecord.userAgent);
    }

    // Log to application logger
    logger.audit(`Audit Event: ${eventType}`, auditRecord);

    // Store in audit trail for compliance reporting
    this.auditTrail.push(auditRecord);

    // Cleanup old audit records (keep last 10000 in memory)
    if (this.auditTrail.length > 10000) {
      this.auditTrail = this.auditTrail.slice(-10000);
    }

    return auditRecord;
  }

  /**
   * Logs user authentication events
   * @param {Object} authEvent - Authentication event details
   */
  logAuthEvent(authEvent) {
    const { type, userId, organizationId, success, reason, correlationId } = authEvent;

    this.logEvent(type, {
      userId,
      organizationId,
      result: success ? 'success' : 'failed',
      reason,
      correlationId,
      riskLevel: success ? 'LOW' : 'MEDIUM',
      complianceCategory: 'authentication'
    });
  }

  /**
   * Logs data access events for compliance
   * @param {Object} dataEvent - Data access event details
   */
  logDataAccess(dataEvent) {
    const {
      userId,
      organizationId,
      resource,
      action,
      recordCount,
      dataTypes,
      correlationId
    } = dataEvent;

    this.logEvent(AUDIT_EVENTS.DATA_ACCESSED, {
      userId,
      organizationId,
      resource,
      action,
      recordCount,
      dataTypes: Array.isArray(dataTypes) ? dataTypes.join(',') : dataTypes,
      correlationId,
      complianceCategory: 'data_access',
      gdprRelevant: true
    });
  }

  /**
   * Logs security violations
   * @param {Object} securityEvent - Security violation details
   */
  logSecurityViolation(securityEvent) {
    const {
      userId,
      organizationId,
      violationType,
      severity,
      details,
      blocked,
      correlationId
    } = securityEvent;

    this.logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, {
      userId,
      organizationId,
      violationType,
      severity: severity || 'HIGH',
      details,
      blocked: blocked !== false, // Default to blocked
      correlationId,
      riskLevel: 'CRITICAL',
      complianceCategory: 'security',
      immediateReview: true
    });

    // Trigger security incident if critical
    if (severity === 'CRITICAL') {
      this.triggerSecurityIncident(securityEvent);
    }
  }

  /**
   * Logs GDPR-related events
   * @param {Object} gdprEvent - GDPR event details
   */
  logGDPREvent(gdprEvent) {
    const {
      userId,
      organizationId,
      requestType,
      dataSubject,
      processingBasis,
      dataTypes,
      correlationId
    } = gdprEvent;

    this.logEvent(AUDIT_EVENTS.GDPR_REQUEST, {
      userId,
      organizationId,
      requestType,
      dataSubject,
      processingBasis,
      dataTypes,
      correlationId,
      complianceCategory: 'gdpr',
      gdprRelevant: true,
      retentionRequired: true
    });
  }

  /**
   * Gets audit trail for compliance reporting
   * @param {Object} filters - Filters for audit trail
   * @returns {Array} Filtered audit records
   */
  getAuditTrail(filters = {}) {
    const {
      organizationId,
      userId,
      eventTypes,
      startDate,
      endDate,
      complianceOnly = false
    } = filters;

    let filteredTrail = [...this.auditTrail];

    if (organizationId) {
      filteredTrail = filteredTrail.filter(record => record.organizationId === organizationId);
    }

    if (userId) {
      filteredTrail = filteredTrail.filter(record => record.userId === userId);
    }

    if (eventTypes && Array.isArray(eventTypes)) {
      filteredTrail = filteredTrail.filter(record => eventTypes.includes(record.eventType));
    }

    if (startDate) {
      filteredTrail = filteredTrail.filter(record =>
        new Date(record.timestamp) >= new Date(startDate)
      );
    }

    if (endDate) {
      filteredTrail = filteredTrail.filter(record =>
        new Date(record.timestamp) <= new Date(endDate)
      );
    }

    if (complianceOnly) {
      filteredTrail = filteredTrail.filter(record => record.complianceRelevant);
    }

    return {
      records: filteredTrail,
      totalCount: filteredTrail.length,
      filters,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generates correlation ID for request tracking
   * @returns {string} Unique correlation ID
   */
  generateCorrelationId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determines if event type is compliance-relevant
   * @param {string} eventType - Event type
   * @returns {boolean} Whether event is compliance-relevant
   */
  isComplianceRelevant(eventType) {
    const complianceEvents = [
      AUDIT_EVENTS.DATA_ACCESSED,
      AUDIT_EVENTS.DATA_CREATED,
      AUDIT_EVENTS.DATA_UPDATED,
      AUDIT_EVENTS.DATA_DELETED,
      AUDIT_EVENTS.DATA_EXPORTED,
      AUDIT_EVENTS.GDPR_REQUEST,
      AUDIT_EVENTS.PRIVACY_SETTING_CHANGED,
      AUDIT_EVENTS.SECURITY_VIOLATION
    ];

    return complianceEvents.includes(eventType);
  }

  /**
   * Sanitizes IP address for privacy compliance
   * @param {string} ip - IP address
   * @returns {string} Sanitized IP address
   */
  sanitizeIP(ip) {
    if (!ip) return null;

    // For IPv4, zero out last octet for privacy
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }

    // For IPv6, zero out last 64 bits
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return parts.slice(0, 4).join(':') + '::0';
      }
    }

    return ip;
  }

  /**
   * Hashes sensitive data for compliance
   * @param {string} data - Data to hash
   * @returns {string} Hashed data
   */
  hashSensitiveData(data) {
    if (!data) return null;

    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Sanitizes user agent for privacy
   * @param {string} userAgent - User agent string
   * @returns {string} Sanitized user agent
   */
  sanitizeUserAgent(userAgent) {
    if (!userAgent) return null;

    // Remove version numbers and detailed system info
    return userAgent
      .replace(/\d+\.\d+\.\d+/g, 'X.X.X')
      .replace(/\([^)]*\)/g, '(sanitized)');
  }

  /**
   * Triggers security incident workflow
   * @param {Object} incident - Security incident details
   */
  triggerSecurityIncident(incident) {
    logger.audit('Security incident triggered', {
      incidentId: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: incident.violationType,
      severity: incident.severity,
      userId: incident.userId,
      organizationId: incident.organizationId,
      correlationId: incident.correlationId,
      triggerTime: new Date().toISOString(),
      automaticEscalation: true
    });

    // TODO: Integrate with PagerDuty security incident creation
    // TODO: Trigger Slack security team notification
    // TODO: Create security incident tracking
  }
}

// Global audit logger instance
const auditLogger = new AuditLogger();

/**
 * Convenience function to log audit events
 * @param {string} eventType - Event type
 * @param {Object} context - Event context
 */
export function logAuditEvent(eventType, context) {
  return auditLogger.logEvent(eventType, context);
}

/**
 * Gets audit trail for compliance reporting
 * @param {Object} filters - Audit trail filters
 * @returns {Object} Audit trail data
 */
export function getComplianceAuditTrail(filters) {
  return auditLogger.getAuditTrail({ ...filters, complianceOnly: true });
}

export { auditLogger };
export default auditLogger;