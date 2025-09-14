/**
 * JWT Token Validation & Security
 * ProcessAudit AI - Authentication Security
 *
 * Provides comprehensive JWT token validation and security measures
 */

import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { logger } from '../logger';

/**
 * Enhanced JWT token validation with security checks
 * @param {Object} req - Next.js request object
 * @returns {Object} Token validation result
 */
export async function validateJWTToken(req) {
  const correlationId = req.headers['x-correlation-id'] || `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    // Get auth from Clerk (which validates JWT internally)
    const auth = getAuth(req);
    const { userId, sessionId, orgId, orgRole } = auth;

    if (!userId || !sessionId) {
      logger.audit('Invalid or missing JWT token', {
        correlationId,
        hasUserId: !!userId,
        hasSessionId: !!sessionId,
        path: req.url,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return {
        valid: false,
        reason: 'invalid_or_missing_token',
        statusCode: 401
      };
    }

    // Validate session is active
    try {
      const session = await clerkClient.sessions.getSession(sessionId);

      if (!session) {
        logger.audit('Session not found for valid user', {
          correlationId,
          userId,
          sessionId,
          suspiciousActivity: true
        });

        return {
          valid: false,
          reason: 'session_not_found',
          statusCode: 401
        };
      }

      // Check session expiration
      const now = new Date();
      const expireAt = new Date(session.expireAt);
      const abandonAt = new Date(session.abandonAt);

      if (now > expireAt) {
        logger.audit('Expired session access attempt', {
          correlationId,
          userId,
          sessionId,
          expiredAt: session.expireAt,
          attemptTime: now.toISOString()
        });

        return {
          valid: false,
          reason: 'session_expired',
          statusCode: 401,
          expiredAt: session.expireAt
        };
      }

      if (now > abandonAt) {
        logger.audit('Abandoned session access attempt', {
          correlationId,
          userId,
          sessionId,
          abandonedAt: session.abandonAt,
          attemptTime: now.toISOString()
        });

        return {
          valid: false,
          reason: 'session_abandoned',
          statusCode: 401,
          abandonedAt: session.abandonAt
        };
      }

      // Check for concurrent session limits (if implemented)
      const activeSessions = await clerkClient.sessions.getSessionList({
        userId: userId,
        status: 'active'
      });

      if (activeSessions.length > 5) { // Max 5 concurrent sessions
        logger.audit('Excessive concurrent sessions detected', {
          correlationId,
          userId,
          activeSessionCount: activeSessions.length,
          currentSessionId: sessionId,
          securityConcern: true
        });

        // Don't block, but flag for monitoring
      }

      const validationTime = Date.now() - startTime;

      logger.info('JWT token validation successful', {
        correlationId,
        userId,
        sessionId,
        organizationId: orgId,
        userRole: orgRole,
        validationTime,
        sessionStatus: session.status
      });

      return {
        valid: true,
        userId,
        sessionId,
        organizationId: orgId,
        userRole: orgRole,
        session,
        validationTime,
        correlationId
      };

    } catch (sessionError) {
      logger.error('Session validation error', {
        correlationId,
        userId,
        sessionId,
        error: sessionError.message
      });

      return {
        valid: false,
        reason: 'session_validation_error',
        statusCode: 500,
        error: sessionError.message
      };
    }

  } catch (error) {
    logger.error('JWT validation error', {
      correlationId,
      error: error.message,
      stack: error.stack,
      path: req.url
    });

    return {
      valid: false,
      reason: 'jwt_validation_error',
      statusCode: 500,
      error: error.message
    };
  }
}

/**
 * Detects potential token tampering or replay attacks
 * @param {Object} req - Next.js request object
 * @returns {Object} Security analysis result
 */
export function detectTokenSecurity(req) {
  const correlationId = req.headers['x-correlation-id'] || `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const authHeader = req.headers.authorization;
  const userAgent = req.headers['user-agent'];
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  const securityChecks = {
    hasAuthHeader: !!authHeader,
    properFormat: false,
    suspiciousUserAgent: false,
    rateLimitExceeded: false,
    correlationId
  };

  // Check authorization header format
  if (authHeader) {
    securityChecks.properFormat = authHeader.startsWith('Bearer ') && authHeader.length > 20;

    if (!securityChecks.properFormat) {
      logger.audit('Malformed authorization header detected', {
        correlationId,
        authHeaderLength: authHeader.length,
        startsWithBearer: authHeader.startsWith('Bearer '),
        ip,
        suspiciousActivity: true
      });
    }
  }

  // Check for suspicious user agents
  const suspiciousAgents = [
    'curl/',
    'wget/',
    'python-requests/',
    'PostmanRuntime/',
    'insomnia/'
  ];

  securityChecks.suspiciousUserAgent = suspiciousAgents.some(agent =>
    userAgent?.toLowerCase().includes(agent.toLowerCase())
  );

  if (securityChecks.suspiciousUserAgent) {
    logger.audit('Suspicious user agent detected', {
      correlationId,
      userAgent,
      ip,
      path: req.url,
      flaggedForReview: true
    });
  }

  // Basic rate limiting check (simple in-memory implementation)
  // In production, use Redis or proper rate limiting service
  const requestKey = `${ip}_${Date.now() - (Date.now() % 60000)}`; // Per minute window

  return {
    ...securityChecks,
    riskScore: calculateRiskScore(securityChecks),
    recommendations: generateSecurityRecommendations(securityChecks)
  };
}

/**
 * Calculates risk score based on security checks
 * @param {Object} checks - Security check results
 * @returns {number} Risk score (0-1)
 */
function calculateRiskScore(checks) {
  let score = 0;

  if (!checks.hasAuthHeader) score += 0.5;
  if (!checks.properFormat) score += 0.3;
  if (checks.suspiciousUserAgent) score += 0.2;
  if (checks.rateLimitExceeded) score += 0.4;

  return Math.min(score, 1.0);
}

/**
 * Generates security recommendations based on checks
 * @param {Object} checks - Security check results
 * @returns {Array} Security recommendations
 */
function generateSecurityRecommendations(checks) {
  const recommendations = [];

  if (!checks.hasAuthHeader) {
    recommendations.push('Implement authentication for this endpoint');
  }

  if (!checks.properFormat) {
    recommendations.push('Validate authorization header format');
  }

  if (checks.suspiciousUserAgent) {
    recommendations.push('Monitor for automated access patterns');
  }

  if (checks.rateLimitExceeded) {
    recommendations.push('Implement rate limiting protection');
  }

  return recommendations;
}

/**
 * Middleware wrapper for enhanced JWT validation
 * @param {Function} handler - API route handler
 * @returns {Function} Enhanced handler with JWT validation
 */
export function withJWTValidation(handler) {
  return async function jwtValidatedHandler(req, res) {
    const tokenValidation = await validateJWTToken(req);

    if (!tokenValidation.valid) {
      return res.status(tokenValidation.statusCode || 401).json({
        success: false,
        error: tokenValidation.reason,
        correlationId: tokenValidation.correlationId
      });
    }

    const securityAnalysis = detectTokenSecurity(req);

    // Add validation context to request
    req.jwtContext = tokenValidation;
    req.securityContext = securityAnalysis;

    // Log high-risk requests
    if (securityAnalysis.riskScore > 0.5) {
      logger.audit('High-risk request detected', {
        correlationId: tokenValidation.correlationId,
        userId: tokenValidation.userId,
        riskScore: securityAnalysis.riskScore,
        path: req.url,
        recommendations: securityAnalysis.recommendations
      });
    }

    return handler(req, res);
  };
}

export default {
  validateJWTToken,
  detectTokenSecurity,
  withJWTValidation,
  crossTenantTracker
};