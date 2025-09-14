/**
 * Organization Context Validator
 * ProcessAudit AI - Multi-Tenant Security
 *
 * Provides comprehensive organization context validation and security boundary enforcement
 */

import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { logger } from '../logger';

/**
 * Validates organization context for API requests
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {Object} Validation result with organization context
 */
export async function validateOrganizationContext(req, res) {
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Get authentication from Clerk
    const { userId, orgId, orgRole } = getAuth(req);

    if (!userId) {
      logger.audit('Unauthorized API access attempt', {
        correlationId,
        path: req.url,
        method: req.method,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return {
        valid: false,
        error: 'Authentication required',
        statusCode: 401,
        correlationId
      };
    }

    // Extract organization ID from request (body, query, or path)
    const requestedOrgId = req.body?.organizationId || req.query?.organizationId || req.query?.orgId;

    // Validate organization context match
    if (requestedOrgId && requestedOrgId !== orgId) {
      logger.audit('Cross-tenant access attempt detected', {
        correlationId,
        userId,
        userOrgId: orgId,
        requestedOrgId,
        path: req.url,
        method: req.method,
        blocked: true,
        riskLevel: 'HIGH'
      });

      return {
        valid: false,
        error: 'Unauthorized: Organization context mismatch',
        statusCode: 403,
        correlationId,
        securityViolation: true
      };
    }

    // Validate organization membership if organization ID is provided
    if (orgId) {
      try {
        const membership = await clerkClient.organizations.getOrganizationMembership({
          organizationId: orgId,
          userId: userId
        });

        if (!membership) {
          logger.audit('Invalid organization membership detected', {
            correlationId,
            userId,
            organizationId: orgId,
            path: req.url,
            blocked: true
          });

          return {
            valid: false,
            error: 'Invalid organization membership',
            statusCode: 403,
            correlationId
          };
        }

        const validationTime = Date.now() - startTime;

        logger.info('Organization context validated', {
          correlationId,
          userId,
          organizationId: orgId,
          userRole: orgRole,
          membershipRole: membership.role,
          validationTime,
          path: req.url
        });

        return {
          valid: true,
          organizationId: orgId,
          userId,
          userRole: orgRole,
          membership,
          correlationId,
          validationTime
        };

      } catch (error) {
        logger.error('Organization membership validation failed', {
          correlationId,
          userId,
          organizationId: orgId,
          error: error.message,
          path: req.url
        });

        return {
          valid: false,
          error: 'Organization validation failed',
          statusCode: 500,
          correlationId
        };
      }
    }

    // No organization context required for this request
    return {
      valid: true,
      userId,
      correlationId,
      validationTime: Date.now() - startTime
    };

  } catch (error) {
    logger.error('Organization context validation error', {
      correlationId,
      error: error.message,
      stack: error.stack,
      path: req.url,
      method: req.method
    });

    return {
      valid: false,
      error: 'Internal validation error',
      statusCode: 500,
      correlationId
    };
  }
}

/**
 * Middleware wrapper for organization context validation
 * @param {Function} handler - API route handler
 * @returns {Function} Enhanced handler with organization validation
 */
export function withOrganizationValidation(handler) {
  return async function validatedHandler(req, res) {
    const validation = await validateOrganizationContext(req, res);

    if (!validation.valid) {
      return res.status(validation.statusCode || 500).json({
        success: false,
        error: validation.error,
        correlationId: validation.correlationId,
        securityViolation: validation.securityViolation || false
      });
    }

    // Add validation context to request for use in handler
    req.organizationContext = validation;

    return handler(req, res);
  };
}

/**
 * Validates organization permissions for specific operations
 * @param {Object} context - Organization context from validation
 * @param {string} operation - Operation being performed
 * @param {string} resource - Resource being accessed
 * @returns {Object} Permission validation result
 */
export function validateOrganizationPermissions(context, operation, resource) {
  const { membership, userRole, organizationId, correlationId } = context;

  // Define operation permissions
  const permissionMatrix = {
    'read': ['admin', 'member', 'guest'],
    'write': ['admin', 'member'],
    'delete': ['admin'],
    'invite': ['admin'],
    'billing': ['admin']
  };

  const allowedRoles = permissionMatrix[operation];

  if (!allowedRoles) {
    logger.warn('Unknown operation requested', {
      correlationId,
      operation,
      resource,
      organizationId
    });

    return {
      allowed: false,
      reason: 'unknown_operation',
      requiredRoles: []
    };
  }

  const userHasPermission = allowedRoles.includes(userRole) ||
                           allowedRoles.includes(membership?.role);

  if (!userHasPermission) {
    logger.audit('Insufficient permissions for operation', {
      correlationId,
      userId: context.userId,
      organizationId,
      userRole,
      membershipRole: membership?.role,
      operation,
      resource,
      requiredRoles: allowedRoles,
      denied: true
    });
  }

  return {
    allowed: userHasPermission,
    reason: userHasPermission ? 'authorized' : 'insufficient_permissions',
    requiredRoles: allowedRoles,
    userRole,
    membershipRole: membership?.role
  };
}

export default {
  validateOrganizationContext,
  withOrganizationValidation,
  validateOrganizationPermissions
};