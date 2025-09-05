/**
 * Multi-Tenant Authentication Flow Security Tests
 * ProcessAudit AI - Phase 4 Testing & Quality Assurance
 */

import { jest } from '@jest/globals'

// Mock environment variables
process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
process.env.CLERK_SECRET_KEY = 'sk_test_123'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test_service_key'

// Mock Clerk authentication
const mockClerkClient = {
  organizations: {
    getOrganization: jest.fn(),
    getOrganizationList: jest.fn(),
    getOrganizationMembership: jest.fn(),
    getOrganizationMembershipList: jest.fn()
  },
  users: {
    getUser: jest.fn(),
    updateUser: jest.fn()
  }
}

const mockGetAuth = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: mockGetAuth,
  clerkClient: mockClerkClient
}))

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn()
  })),
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn()
  }
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    asPath: '/dashboard',
    pathname: '/dashboard',
    query: {}
  })
}))

global.fetch = jest.fn()

describe('Multi-Tenant Authentication Security', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  describe('Dual Authentication System', () => {
    test('validates Clerk + Supabase authentication synchronization', async () => {
      // Mock successful Clerk authentication
      mockGetAuth.mockReturnValue({
        userId: 'clerk_user_123',
        orgId: 'org_pro_456',
        orgSlug: 'acme-corp'
      })

      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'clerk_user_123',
        emailAddresses: [{ emailAddress: 'user@acme.com' }],
        firstName: 'John',
        lastName: 'Doe'
      })

      // Mock Supabase user sync
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'supabase_user_123',
            email: 'user@acme.com',
            app_metadata: {
              clerk_user_id: 'clerk_user_123'
            }
          }
        },
        error: null
      })

      const syncHandler = require('../../../pages/api/auth/sync.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'authorization': 'Bearer clerk_session_token'
        }
      })

      await syncHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(true)
      expect(responseData.data.clerkUserId).toBe('clerk_user_123')
      expect(responseData.data.supabaseUserId).toBe('supabase_user_123')
      expect(responseData.data.synchronized).toBe(true)
    })

    test('handles authentication system fallback gracefully', async () => {
      // Mock Clerk unavailable
      mockGetAuth.mockImplementation(() => {
        throw new Error('Clerk service unavailable')
      })

      // Should fall back to Supabase-only mode
      const authHandler = require('../../../pages/api/auth/fallback.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'user@example.com',
          password: 'secure_password'
        }
      })

      await authHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      expect(responseData.authMode).toBe('supabase_only')
      expect(responseData.features.organizations).toBe(false)
      expect(responseData.features.multiTenant).toBe(false)
    })

    test('prevents authentication bypass attempts', async () => {
      // Mock attempt to bypass authentication
      mockGetAuth.mockReturnValue(null)

      const protectedHandler = require('../../../pages/api/audit-reports/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          // Attempt to spoof organization header without authentication
          'x-organization-id': 'org_pro_456'
        }
      })

      await protectedHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('AUTHENTICATION_REQUIRED')
    })
  })

  describe('Organization Membership Security', () => {
    test('validates organization membership before data access', async () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        orgSlug: 'acme-corp'
      })

      // Mock membership verification
      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_123',
          role: 'member',
          publicUserData: { userId: 'user_123' }
        })

      const dataHandler = require('../../../pages/api/audit-reports/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-organization-id': 'org_pro_456'
        }
      })

      await dataHandler(req, res)

      // Should verify membership before allowing access
      expect(mockClerkClient.organizations.getOrganizationMembership)
        .toHaveBeenCalledWith('user_123', 'org_pro_456')
    })

    test('prevents privilege escalation within organizations', async () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_member',
        orgSlug: 'acme-corp'
      })

      // Mock member role (not admin)
      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          role: 'member',
          publicUserData: { userId: 'user_member' }
        })

      // Attempt admin-only operation
      const adminHandler = require('../../../pages/api/organizations/[orgId]/settings.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { orgId: 'org_pro_456' },
        body: {
          features: {
            maxMembers: 100 // Admin-only setting
          }
        }
      })

      await adminHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('INSUFFICIENT_PERMISSIONS')
    })

    test('validates session timeout enforcement', async () => {
      // Mock expired session
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionId: 'expired_session',
        orgSlug: 'acme-corp'
      })

      mockClerkClient.organizations.getOrganization.mockResolvedValue({
        id: 'org_pro_456',
        privateMetadata: {
          security: {
            sessionTimeout: 4 // 4 hour timeout
          }
        }
      })

      // Mock session created 5 hours ago
      const fiveHoursAgo = Date.now() - (5 * 60 * 60 * 1000)
      
      const sessionHandler = require('../../../pages/api/auth/validate-session.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-session-created': fiveHoursAgo.toString()
        }
      })

      await sessionHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('SESSION_EXPIRED')
    })
  })

  describe('Cross-Organization Access Prevention', () => {
    test('prevents organization context spoofing', async () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        orgSlug: 'startup-inc' // User belongs to free org
      })

      mockClerkClient.organizations.getOrganizationMembership
        .mockRejectedValue({ status: 404 }) // Not a member of requested org

      const protectedHandler = require('../../../pages/api/audit-reports/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-organization-id': 'org_pro_456', // Attempting to access different org
          'x-org-spoofing': 'true' // Malicious header
        }
      })

      await protectedHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      const responseData = JSON.parse(res._getData())
      expect(responseData.code).toBe('ORGANIZATION_ACCESS_DENIED')
      expect(responseData.details.requestedOrg).toBe('org_pro_456')
      expect(responseData.details.userOrg).toBe('startup-inc')
    })

    test('validates subdomain organization matching', async () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        orgSlug: 'acme-corp'
      })

      const middlewareTest = require('../../../middleware.js')
      
      // Mock request from different subdomain than user's organization
      const mockRequest = {
        nextUrl: new URL('https://wrong-org.processaudit.ai/dashboard'),
        headers: new Map([
          ['host', 'wrong-org.processaudit.ai'],
          ['x-forwarded-host', 'wrong-org.processaudit.ai']
        ])
      }

      const mockAuth = {
        userId: 'user_123',
        orgSlug: 'acme-corp' // Different from subdomain
      }

      const result = await middlewareTest.default.afterAuth(mockAuth, mockRequest)

      expect(result.headers.get('x-org-mismatch')).toBe('true')
      expect(result.headers.get('x-security-violation')).toBe('subdomain_org_mismatch')
    })
  })

  describe('API Security Validation', () => {
    test('validates request origin and CORS policies', async () => {
      const corsHandler = require('../../../pages/api/audit-reports/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'origin': 'https://malicious.com', // Unauthorized origin
          'referer': 'https://malicious.com/attack'
        },
        body: {
          processTitle: 'Test Process'
        }
      })

      await corsHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      const responseData = JSON.parse(res._getData())
      expect(responseData.code).toBe('CORS_VIOLATION')
      expect(responseData.details.origin).toBe('https://malicious.com')
    })

    test('prevents CSRF attacks on state-changing operations', async () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        orgSlug: 'acme-corp'
      })

      const csrfHandler = require('../../../pages/api/organizations/[orgId]/settings.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'origin': 'https://malicious.com',
          // Missing CSRF token
        },
        query: { orgId: 'org_pro_456' },
        body: {
          features: {
            enableAPIAccess: false // Malicious setting change
          }
        }
      })

      await csrfHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      const responseData = JSON.parse(res._getData())
      expect(responseData.code).toBe('CSRF_TOKEN_MISSING')
    })

    test('validates input sanitization across all endpoints', async () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        orgSlug: 'acme-corp'
      })

      const inputHandler = require('../../../pages/api/audit-reports/create.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_pro_456'
        },
        body: {
          processTitle: '<script>alert("xss")</script>',
          processDescription: 'DROP TABLE audit_reports;--',
          questions: [
            {
              question: '../../etc/passwd',
              answer: 'javascript:alert("xss")'
            }
          ]
        }
      })

      await inputHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.code).toBe('INVALID_INPUT')
      expect(responseData.details.violations).toContain('XSS_ATTEMPT')
      expect(responseData.details.violations).toContain('SQL_INJECTION_ATTEMPT')
      expect(responseData.details.violations).toContain('PATH_TRAVERSAL_ATTEMPT')
    })
  })

  describe('Worker Security Integration', () => {
    test('validates secure worker communication', async () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        orgSlug: 'acme-corp'
      })

      // Mock worker endpoint with security headers
      fetch.mockResolvedValue({
        ok: true,
        headers: new Map([
          ['x-worker-signature', 'valid_signature'],
          ['x-organization-validated', 'true']
        ]),
        json: () => Promise.resolve({
          success: true,
          jobId: 'secure_job_123'
        })
      })

      const workerHandler = require('../../../pages/api/automations/create.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_pro_456'
        },
        body: {
          processTitle: 'Secure Process'
        }
      })

      await workerHandler(req, res)

      // Verify secure communication
      const workerCall = fetch.mock.calls[0]
      expect(workerCall[1].headers['X-Security-Token']).toBeDefined()
      expect(workerCall[1].headers['X-Organization-Id']).toBe('org_pro_456')
      expect(workerCall[1].headers['X-User-Id']).toBe('user_123')
    })

    test('prevents worker response tampering', async () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        orgSlug: 'acme-corp'
      })

      // Mock tampered worker response
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          jobId: 'tampered_job',
          organizationId: 'different_org_123', // Tampered organization
          result: {
            maliciousPayload: 'exploit_data'
          }
        })
      })

      const workerHandler = require('../../../pages/api/automations/create.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_pro_456'
        },
        body: {
          processTitle: 'Test Process'
        }
      })

      await workerHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.code).toBe('WORKER_RESPONSE_INVALID')
      expect(responseData.details.reason).toBe('Organization mismatch in worker response')
    })
  })

  describe('Rate Limiting and DoS Protection', () => {
    test('enforces per-organization rate limits', async () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        orgSlug: 'acme-corp'
      })

      const rateLimitHandler = require('../../../pages/api/automations/create.js').default
      const { createMocks } = require('node-mocks-http')

      // Simulate rapid requests
      const requests = Array.from({ length: 25 }, (_, i) => 
        createMocks({
          method: 'POST',
          headers: {
            'x-organization-id': 'org_pro_456',
            'x-forwarded-for': '192.168.1.100'
          },
          body: { processTitle: `Process ${i}` }
        })
      )

      const responses = await Promise.all(
        requests.map(({ req, res }) => rateLimitHandler(req, res))
      )

      // Should rate limit after threshold
      const lastResponse = responses[responses.length - 1]
      expect(lastResponse.res._getStatusCode()).toBe(429)
      
      const responseData = JSON.parse(lastResponse.res._getData())
      expect(responseData.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(responseData.details.organization).toBe('org_pro_456')
    })

    test('implements progressive delays for suspicious activity', async () => {
      const suspiciousHandler = require('../../../pages/api/auth/validate.js').default
      const { createMocks } = require('node-mocks-http')

      // Multiple failed authentication attempts
      const failedAttempts = Array.from({ length: 5 }, () =>
        createMocks({
          method: 'POST',
          headers: {
            'x-forwarded-for': '192.168.1.100'
          },
          body: {
            email: 'user@example.com',
            password: 'wrong_password'
          }
        })
      )

      const startTime = Date.now()
      await Promise.all(
        failedAttempts.map(({ req, res }) => suspiciousHandler(req, res))
      )
      const endTime = Date.now()

      // Should implement progressive delays
      expect(endTime - startTime).toBeGreaterThan(5000) // >5 seconds total delay
    })
  })
})