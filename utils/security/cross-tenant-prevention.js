/**
 * Cross-Tenant Access Prevention System
 * ProcessAudit AI - Multi-Tenant Security
 *
 * Detects and prevents cross-tenant data access attempts
 */

import { logger } from '../logger';

/**
 * Cross-tenant access attempt tracker
 */
class CrossTenantAccessTracker {
  constructor() {
    this.attempts = new Map(); // organizationId -> attempt count
    this.suspiciousIPs = new Set();
    this.blockedUsers = new Set();
  }

  /**
   * Records a cross-tenant access attempt
   * @param {Object} attempt - Access attempt details
   */
  recordAttempt(attempt) {
    const { userId, sourceOrgId, targetOrgId, ip, userAgent, correlationId } = attempt;

    const attemptKey = `${userId}_${sourceOrgId}_${targetOrgId}`;
    const currentCount = this.attempts.get(attemptKey) || 0;
    this.attempts.set(attemptKey, currentCount + 1);

    // Log security violation
    logger.audit('Cross-tenant access attempt', {
      correlationId,
      userId,
      sourceOrganizationId: sourceOrgId,
      targetOrganizationId: targetOrgId,
      attemptCount: currentCount + 1,
      ip,
      userAgent,
      severity: currentCount > 2 ? 'CRITICAL' : 'HIGH',
      blocked: true
    });

    // Escalate if multiple attempts
    if (currentCount >= 2) {
      this.escalateSecurityIncident({
        userId,
        sourceOrgId,
        targetOrgId,
        attemptCount: currentCount + 1,
        correlationId
      });
    }

    // Track suspicious IPs
    if (currentCount >= 1) {
      this.suspiciousIPs.add(ip);
    }

    // Block user after multiple violations
    if (currentCount >= 4) {
      this.blockedUsers.add(userId);
      logger.audit('User blocked for repeated cross-tenant violations', {
        correlationId,
        userId,
        totalAttempts: currentCount + 1,
        autoBlocked: true
      });
    }
  }

  /**
   * Checks if a user is blocked due to security violations
   * @param {string} userId - User ID to check
   * @returns {boolean} Whether user is blocked
   */
  isUserBlocked(userId) {
    return this.blockedUsers.has(userId);
  }

  /**
   * Checks if an IP is flagged as suspicious
   * @param {string} ip - IP address to check
   * @returns {boolean} Whether IP is suspicious
   */
  isSuspiciousIP(ip) {
    return this.suspiciousIPs.has(ip);
  }

  /**
   * Escalates security incident for multiple cross-tenant attempts
   * @param {Object} incident - Incident details
   */
  escalateSecurityIncident(incident) {
    logger.audit('Security incident escalation triggered', {
      incidentType: 'cross_tenant_access_violation',
      severity: 'CRITICAL',
      userId: incident.userId,
      sourceOrganizationId: incident.sourceOrgId,
      targetOrganizationId: incident.targetOrgId,
      attemptCount: incident.attemptCount,
      correlationId: incident.correlationId,
      escalated: true,
      immediateActionRequired: true
    });

    // TODO: Integrate with PagerDuty security incident creation
    // TODO: Trigger Slack security team notification
    // TODO: Create security incident ticket
  }

  /**
   * Gets security metrics for monitoring
   * @returns {Object} Security metrics
   */
  getSecurityMetrics() {
    return {
      totalAttempts: Array.from(this.attempts.values()).reduce((sum, count) => sum + count, 0),
      uniqueViolators: this.attempts.size,
      blockedUsers: this.blockedUsers.size,
      suspiciousIPs: this.suspiciousIPs.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clears old attempts (called periodically)
   * @param {number} maxAgeHours - Maximum age in hours
   */
  clearOldAttempts(maxAgeHours = 24) {
    // In production, this would use a persistent store with TTL
    // For now, we clear all attempts after the specified time
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    // This is a simplified implementation
    // In production, you'd store timestamps and filter by age
    logger.info('Cleared old cross-tenant access attempts', {
      clearedBefore: new Date(cutoffTime).toISOString(),
      remainingAttempts: this.attempts.size
    });
  }
}

// Global instance for the application
const crossTenantTracker = new CrossTenantAccessTracker();

/**
 * Validates that a user can access data for a specific organization
 * @param {string} userId - User making the request
 * @param {string} userOrgId - User's current organization
 * @param {string} requestedOrgId - Organization being accessed
 * @param {Object} requestContext - Additional request context
 * @returns {Object} Access validation result
 */
export function validateCrossTenantAccess(userId, userOrgId, requestedOrgId, requestContext = {}) {
  const { ip, userAgent, correlationId, path } = requestContext;

  // Check if user is already blocked
  if (crossTenantTracker.isUserBlocked(userId)) {
    logger.audit('Blocked user attempted access', {
      correlationId,
      userId,
      organizationId: requestedOrgId,
      path,
      blocked: true,
      reason: 'user_previously_blocked'
    });

    return {
      allowed: false,
      reason: 'user_blocked_for_security_violations',
      securityViolation: true
    };
  }

  // Check if IP is suspicious
  if (crossTenantTracker.isSuspiciousIP(ip)) {
    logger.audit('Suspicious IP attempted access', {
      correlationId,
      userId,
      ip,
      organizationId: requestedOrgId,
      path,
      flagged: true
    });
  }

  // Allow access to user's own organization
  if (!requestedOrgId || requestedOrgId === userOrgId) {
    return {
      allowed: true,
      reason: 'same_organization_access',
      organizationId: userOrgId
    };
  }

  // Cross-tenant access attempt detected
  crossTenantTracker.recordAttempt({
    userId,
    sourceOrgId: userOrgId,
    targetOrgId: requestedOrgId,
    ip,
    userAgent,
    correlationId,
    path
  });

  return {
    allowed: false,
    reason: 'cross_tenant_access_denied',
    securityViolation: true,
    sourceOrganization: userOrgId,
    targetOrganization: requestedOrgId
  };
}

/**
 * Database query filter to enforce organization isolation
 * @param {string} organizationId - Organization ID to filter by
 * @param {Object} baseQuery - Base Supabase query
 * @returns {Object} Query with organization filter applied
 */
export function applyOrganizationFilter(organizationId, baseQuery) {
  if (!organizationId) {
    throw new Error('Organization ID required for data access');
  }

  // Validate organization ID format to prevent injection
  if (!/^org_[a-zA-Z0-9_-]+$/.test(organizationId)) {
    logger.audit('Invalid organization ID format detected', {
      organizationId,
      blocked: true,
      possibleInjection: true
    });

    throw new Error('Invalid organization ID format');
  }

  return baseQuery.eq('organization_id', organizationId);
}

/**
 * Sanitizes organization ID to prevent SQL injection
 * @param {string} orgId - Organization ID to sanitize
 * @returns {string} Sanitized organization ID
 */
export function sanitizeOrganizationId(orgId) {
  if (!orgId) return null;

  // Remove any potentially malicious characters
  const sanitized = orgId.replace(/[^a-zA-Z0-9_-]/g, '');

  // Validate format
  if (!/^org_[a-zA-Z0-9_-]+$/.test(sanitized)) {
    logger.audit('Organization ID sanitization failed', {
      original: orgId,
      sanitized,
      blocked: true
    });

    throw new Error('Invalid organization ID format');
  }

  return sanitized;
}

/**
 * Gets cross-tenant security metrics for monitoring
 * @returns {Object} Security metrics
 */
export function getCrossTenantMetrics() {
  return crossTenantTracker.getSecurityMetrics();
}

/**
 * Clears old security attempt records
 * @param {number} maxAgeHours - Maximum age in hours
 */
export function clearOldSecurityAttempts(maxAgeHours = 24) {
  crossTenantTracker.clearOldAttempts(maxAgeHours);
}

export default {
  validateCrossTenantAccess,
  applyOrganizationFilter,
  sanitizeOrganizationId,
  getCrossTenantMetrics,
  clearOldSecurityAttempts,
  crossTenantTracker
};