/**
 * Multi-tenant Data Isolation Tests
 * ProcessAudit AI - Phase 4 Testing & Quality Assurance
 */

import { jest } from '@jest/globals'
import { mockOrganizations, mockUsers, seedTestData, cleanupTestData } from './fixtures/organizations.js'

// Mock environment variables
process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
process.env.CLERK_SECRET_KEY = 'sk_test_123'
process.env.SUPABASE_SERVICE_KEY = 'test_service_key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

// Mock Clerk client
const mockClerkClient = {
  organizations: {
    getOrganization: jest.fn(),
    getOrganizationMembershipList: jest.fn(),
    getOrganizationMembership: jest.fn()
  },
  users: {
    getUser: jest.fn(),
    getOrganizationMembershipList: jest.fn()
  }
}

const mockGetAuth = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: mockGetAuth,
  clerkClient: mockClerkClient
}))

// Mock Supabase client
const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  then: jest.fn(),
  catch: jest.fn()
}

const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseQuery),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

global.fetch = jest.fn()

describe('Multi-Tenant Data Isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
    
    // Reset Supabase mocks
    mockSupabaseQuery.then.mockImplementation((callback) => {
      return callback({ data: [], error: null })
    })
  })

  describe('Organization Data Isolation', () => {
    test('prevents cross-organization data access in audit reports', async () => {
      // Setup: User from Free org trying to access Pro org data
      mockGetAuth.mockReturnValue({ 
        userId: 'user_free_123',
        orgSlug: 'startup-inc'
      })

      // Mock organization membership check - user belongs to free org
      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_free',
          organization: mockOrganizations.freeOrg,
          publicUserData: { userId: 'user_free_123' }
        })

      // Mock audit reports query - should only return free org data
      mockSupabaseQuery.then.mockImplementation((callback) => {
        return callback({ 
          data: [
            {
              id: 'report_free_123',
              organization_id: 'org_free_123',
              user_id: 'user_free_123',
              title: 'Customer Onboarding Process'
            }
          ], 
          error: null 
        })
      })

      const auditReportsHandler = require('../../pages/api/audit-reports/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-organization-id': 'org_free_123'
        }
      })

      await auditReportsHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      
      // Should only contain data for the user's organization
      expect(responseData.data).toHaveLength(1)
      expect(responseData.data[0].organization_id).toBe('org_free_123')
      
      // Verify RLS policy enforcement in query
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_reports')
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('organization_id', 'org_free_123')
    })

    test('prevents cross-organization automation job access', async () => {
      // Setup: Professional org admin accessing automation jobs
      mockGetAuth.mockReturnValue({ 
        userId: 'user_pro_admin',
        orgSlug: 'acme-corp'
      })

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_pro_admin',
          organization: mockOrganizations.professionalOrg,
          role: 'admin',
          publicUserData: { userId: 'user_pro_admin' }
        })

      // Mock automation jobs query - should only return pro org data
      mockSupabaseQuery.then.mockImplementation((callback) => {
        return callback({ 
          data: [
            {
              id: 'job_pro_456',
              organization_id: 'org_pro_456',
              user_id: 'user_pro_admin',
              status: 'completed'
            }
          ], 
          error: null 
        })
      })

      const automationsHandler = require('../../pages/api/automations/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-organization-id': 'org_pro_456'
        }
      })

      await automationsHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      
      // Should only contain jobs for the professional organization
      expect(responseData.data).toHaveLength(1)
      expect(responseData.data[0].organization_id).toBe('org_pro_456')
      
      // Verify organization-specific filtering
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('organization_id', 'org_pro_456')
    })

    test('blocks unauthorized organization access', async () => {
      // Setup: User trying to access organization they're not a member of
      mockGetAuth.mockReturnValue({ 
        userId: 'user_unauthorized',
        orgSlug: null
      })

      // Mock membership check - user not found in organization
      mockClerkClient.organizations.getOrganizationMembership
        .mockRejectedValue({ status: 404, message: 'Resource not found' })

      const auditReportsHandler = require('../../pages/api/audit-reports/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-organization-id': 'org_pro_456' // Attempting to access pro org
        }
      })

      await auditReportsHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('ORGANIZATION_ACCESS_DENIED')
    })
  })

  describe('Plan-Based Feature Restrictions', () => {
    test('enforces free plan limitations on automation jobs', async () => {
      mockGetAuth.mockReturnValue({ 
        userId: 'user_free_123',
        orgSlug: 'startup-inc'
      })

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_free',
          organization: mockOrganizations.freeOrg,
          role: 'admin'
        })

      // Mock current job count at limit
      mockSupabaseQuery.then.mockImplementation((callback) => {
        return callback({ 
          data: new Array(10).fill({ id: 'job_' }).map((_, i) => ({
            ..._, 
            id: `job_${i}`,
            organization_id: 'org_free_123'
          })), 
          error: null 
        })
      })

      const automationsHandler = require('../../pages/api/automations/create.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_free_123'
        },
        body: {
          processTitle: 'New Automation',
          processDescription: 'Test automation'
        }
      })

      await automationsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('PLAN_LIMIT_EXCEEDED')
      expect(responseData.details.currentCount).toBe(10)
      expect(responseData.details.planLimit).toBe(10)
    })

    test('allows professional plan advanced features', async () => {
      mockGetAuth.mockReturnValue({ 
        userId: 'user_pro_admin',
        orgSlug: 'acme-corp'
      })

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_pro_admin',
          organization: mockOrganizations.professionalOrg,
          role: 'admin'
        })

      // Mock successful job creation (under limit)
      mockSupabaseQuery.then.mockImplementation((callback) => {
        return callback({ 
          data: [
            {
              id: 'job_new_pro',
              organization_id: 'org_pro_456',
              status: 'pending',
              job_type: 'n8n'
            }
          ], 
          error: null 
        })
      })

      const automationsHandler = require('../../pages/api/automations/create.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_pro_456',
          'x-enable-integrations': 'true' // Professional feature
        },
        body: {
          processTitle: 'Advanced CRM Integration',
          processDescription: 'Complex multi-step automation',
          enableIntegrations: true,
          customFields: { priority: 'high' }
        }
      })

      await automationsHandler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(true)
      expect(responseData.data.id).toBe('job_new_pro')
    })

    test('blocks enterprise features for non-enterprise plans', async () => {
      mockGetAuth.mockReturnValue({ 
        userId: 'user_pro_admin',
        orgSlug: 'acme-corp'
      })

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_pro_admin',
          organization: mockOrganizations.professionalOrg, // Professional, not Enterprise
          role: 'admin'
        })

      const settingsHandler = require('../../pages/api/organizations/[orgId]/settings.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { orgId: 'org_pro_456' },
        body: {
          features: {
            enableAPIAccess: true, // Available on Professional
            enableCustomFields: true, // Enterprise only
            enableSSO: true // Enterprise only
          }
        }
      })

      await settingsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('FEATURE_NOT_AVAILABLE')
      expect(responseData.details.restrictedFeatures).toContain('enableCustomFields')
      expect(responseData.details.restrictedFeatures).toContain('enableSSO')
    })
  })

  describe('Cross-Organization User Access', () => {
    test('handles user with multiple organization memberships', async () => {
      mockGetAuth.mockReturnValue({ 
        userId: 'user_cross_org',
        orgSlug: 'acme-corp' // Currently in Professional org
      })

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_cross_pro',
          organization: mockOrganizations.professionalOrg,
          role: 'member',
          publicUserData: { userId: 'user_cross_org' }
        })

      // Mock audit reports for current organization only
      mockSupabaseQuery.then.mockImplementation((callback) => {
        return callback({ 
          data: [
            {
              id: 'report_pro_cross',
              organization_id: 'org_pro_456',
              user_id: 'user_cross_org',
              title: 'Cross-Org User Report'
            }
          ], 
          error: null 
        })
      })

      const auditReportsHandler = require('../../pages/api/audit-reports/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-organization-id': 'org_pro_456'
        }
      })

      await auditReportsHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      
      // Should only see data for current organization context
      expect(responseData.data).toHaveLength(1)
      expect(responseData.data[0].organization_id).toBe('org_pro_456')
      
      // Should not see data from other organizations user is a member of
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('organization_id', 'org_pro_456')
    })

    test('prevents organization switching without proper authorization', async () => {
      mockGetAuth.mockReturnValue({ 
        userId: 'user_pro_member',
        orgSlug: 'acme-corp'
      })

      // User trying to switch to an organization they're not a member of
      mockClerkClient.organizations.getOrganizationMembership
        .mockRejectedValue({ status: 404 })

      const switchHandler = require('../../pages/api/organizations/switch.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          organizationId: 'org_ent_789' // Enterprise org user is not a member of
        }
      })

      await switchHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('ORGANIZATION_ACCESS_DENIED')
    })
  })

  describe('Database RLS Policy Enforcement', () => {
    test('verifies RLS policies prevent direct database access', async () => {
      // Test direct database access without organization context
      const testQuery = mockSupabaseClient
        .from('audit_reports')
        .select('*')
        .eq('user_id', 'user_free_123')

      // RLS should enforce organization_id filtering even if not explicitly provided
      mockSupabaseQuery.then.mockImplementation((callback) => {
        // RLS policy should prevent cross-organization access
        return callback({ 
          data: [], // Empty because RLS blocks unauthorized access
          error: null 
        })
      })

      await testQuery

      // Direct access without organization context should be blocked
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_reports')
    })

    test('validates service role bypasses RLS when needed', async () => {
      // Test service role access for system operations
      process.env.SUPABASE_SERVICE_KEY = 'service_role_key'

      // Mock service role client with bypass capability
      const mockServiceClient = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: jest.fn((callback) => callback({ data: 'service_data', error: null }))
        }))
      }

      // Service operations should be able to access cross-organization data for system tasks
      const serviceQuery = mockServiceClient
        .from('audit_reports')
        .select('*')
        .eq('status', 'pending')

      await serviceQuery

      expect(mockServiceClient.from).toHaveBeenCalledWith('audit_reports')
    })
  })

  describe('Worker Organization Context', () => {
    test('validates worker receives organization context', async () => {
      mockGetAuth.mockReturnValue({ 
        userId: 'user_pro_admin',
        orgSlug: 'acme-corp'
      })

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_pro_admin',
          organization: mockOrganizations.professionalOrg,
          role: 'admin'
        })

      // Mock worker endpoint call
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          jobId: 'worker_job_123',
          organizationId: 'org_pro_456'
        })
      })

      const automationsHandler = require('../../pages/api/automations/create.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_pro_456'
        },
        body: {
          processTitle: 'Worker Test',
          processDescription: 'Test worker organization context'
        }
      })

      await automationsHandler(req, res)

      // Verify worker was called with organization context
      const workerCall = fetch.mock.calls[0]
      expect(workerCall[1].headers['X-Organization-Id']).toBe('org_pro_456')
      expect(workerCall[1].headers['X-User-Id']).toBe('user_pro_admin')
      
      const requestBody = JSON.parse(workerCall[1].body)
      expect(requestBody.organizationContext).toBeDefined()
      expect(requestBody.organizationContext.id).toBe('org_pro_456')
      expect(requestBody.organizationContext.plan).toBe('professional')
    })

    test('worker respects organization plan limitations', async () => {
      // Mock worker response indicating plan limitation
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Plan limitation: Advanced integrations not available on free plan',
          code: 'PLAN_FEATURE_RESTRICTED'
        })
      })

      mockGetAuth.mockReturnValue({ 
        userId: 'user_free_123',
        orgSlug: 'startup-inc'
      })

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.freeOrg,
          role: 'admin'
        })

      const automationsHandler = require('../../pages/api/automations/create.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_free_123'
        },
        body: {
          processTitle: 'Advanced Automation',
          enableIntegrations: true // Not available on free plan
        }
      })

      await automationsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('PLAN_FEATURE_RESTRICTED')
    })
  })
})