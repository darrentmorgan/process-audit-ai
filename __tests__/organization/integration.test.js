/**
 * Integration tests for multi-tenant organization system
 * ProcessAudit AI - Phase 2 Multi-Tenancy Implementation
 */

import { jest } from '@jest/globals'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    asPath: '/dashboard',
    pathname: '/dashboard',
    query: {}
  })
}))

// Mock environment variables
process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
process.env.CLERK_SECRET_KEY = 'sk_test_123'
process.env.NEXT_PUBLIC_APP_URL = 'https://processaudit.ai'

// Mock Clerk client
const mockClerkClient = {
  organizations: {
    createOrganization: jest.fn(),
    getOrganization: jest.fn(),
    updateOrganization: jest.fn(),
    deleteOrganization: jest.fn(),
    getOrganizationList: jest.fn(),
    getOrganizationMembershipList: jest.fn(),
    getOrganizationMembership: jest.fn(),
    updateOrganizationMembership: jest.fn(),
    deleteOrganizationMembership: jest.fn(),
    createOrganizationInvitation: jest.fn(),
  },
  users: {
    getOrganizationMembershipList: jest.fn(),
    getUser: jest.fn(),
  }
}

const mockGetAuth = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: mockGetAuth,
  clerkClient: mockClerkClient
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('Organization System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
    
    // Reset all Clerk mocks
    Object.values(mockClerkClient.organizations).forEach(mock => mock.mockClear())
    Object.values(mockClerkClient.users).forEach(mock => mock.mockClear())
    mockGetAuth.mockClear()
  })

  describe('Organization Creation Workflow', () => {
    test('complete organization creation flow', async () => {
      // Mock authenticated user
      mockGetAuth.mockReturnValue({ userId: 'user123' })
      
      // Mock successful organization creation
      const newOrg = {
        id: 'org_new123',
        slug: 'acme-corp',
        name: 'Acme Corporation',
        imageUrl: '',
        publicMetadata: {
          description: 'A test corporation',
          website: 'https://acme.com',
          industry: 'technology'
        },
        privateMetadata: {
          plan: 'professional',
          features: {
            enableAutomations: true,
            enableReporting: true,
            enableIntegrations: true,
            enableAnalytics: true,
            maxProjects: 50,
            maxMembers: 25
          },
          security: {
            requireTwoFactor: false,
            allowGuestAccess: true,
            sessionTimeout: 24
          },
          notifications: {
            emailNotifications: true
          }
        },
        createdAt: 1640995200000,
        updatedAt: 1640995200000,
        maxAllowedMemberships: 25
      }
      
      mockClerkClient.organizations.createOrganization.mockResolvedValue(newOrg)

      // Import and test the API handler
      const organizationsHandler = require('../../../pages/api/organizations/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Acme Corporation',
          slug: 'acme-corp',
          description: 'A test corporation',
          publicMetadata: {
            website: 'https://acme.com',
            industry: 'technology'
          },
          plan: 'professional'
        }
      })

      await organizationsHandler(req, res)

      // Verify response
      expect(res._getStatusCode()).toBe(201)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(true)
      expect(responseData.data.name).toBe('Acme Corporation')
      expect(responseData.data.slug).toBe('acme-corp')
      expect(responseData.data.plan).toBe('professional')

      // Verify Clerk was called correctly
      expect(mockClerkClient.organizations.createOrganization).toHaveBeenCalledWith({
        name: 'Acme Corporation',
        slug: 'acme-corp',
        createdBy: 'user123',
        publicMetadata: {
          description: 'A test corporation',
          website: 'https://acme.com',
          industry: 'technology'
        },
        privateMetadata: {
          plan: 'professional',
          features: {
            enableAutomations: true,
            enableReporting: true,
            enableIntegrations: true,
            enableAnalytics: true,
            maxProjects: 50,
            maxMembers: 25
          },
          security: {
            requireTwoFactor: false,
            allowGuestAccess: true,
            sessionTimeout: 24
          },
          notifications: {
            emailNotifications: true
          }
        }
      })
    })

    test('organization creation with plan-based feature restrictions', async () => {
      mockGetAuth.mockReturnValue({ userId: 'user123' })
      
      const freeOrg = {
        id: 'org_free123',
        slug: 'startup',
        name: 'Startup Inc',
        privateMetadata: {
          plan: 'free',
          features: {
            enableAutomations: true,
            enableReporting: true,
            enableIntegrations: false, // Restricted for free plan
            enableAnalytics: false,    // Restricted for free plan
            maxProjects: 5,            // Limited for free plan
            maxMembers: 5              // Limited for free plan
          }
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        maxAllowedMemberships: 5
      }
      
      mockClerkClient.organizations.createOrganization.mockResolvedValue(freeOrg)

      const organizationsHandler = require('../../../pages/api/organizations/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Startup Inc',
          plan: 'free'
        }
      })

      await organizationsHandler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const responseData = JSON.parse(res._getData())
      expect(responseData.data.plan).toBe('free')

      // Verify free plan restrictions were applied
      const createCall = mockClerkClient.organizations.createOrganization.mock.calls[0][0]
      expect(createCall.privateMetadata.features.enableIntegrations).toBe(false)
      expect(createCall.privateMetadata.features.enableAnalytics).toBe(false)
      expect(createCall.privateMetadata.features.maxProjects).toBe(5)
      expect(createCall.privateMetadata.features.maxMembers).toBe(5)
    })
  })

  describe('Member Invitation Workflow', () => {
    test('complete member invitation flow', async () => {
      mockGetAuth.mockReturnValue({ userId: 'admin123' })
      
      // Mock admin membership check
      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValueOnce({
          id: 'membership_admin',
          role: 'admin',
          publicUserData: { userId: 'admin123' }
        })
        .mockRejectedValueOnce({ status: 404 }) // User to invite not a member
      
      // Mock organization details
      mockClerkClient.organizations.getOrganization.mockResolvedValue({
        id: 'org123',
        slug: 'acme',
        name: 'Acme Corp',
        maxAllowedMemberships: 25
      })
      
      // Mock current member count
      mockClerkClient.organizations.getOrganizationMembershipList.mockResolvedValue({
        totalCount: 5
      })
      
      // Mock invitation creation
      const invitation = {
        id: 'inv_123',
        emailAddress: 'newmember@example.com',
        role: 'member',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      mockClerkClient.organizations.createOrganizationInvitation.mockResolvedValue(invitation)
      
      // Mock inviter details
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'admin123',
        firstName: 'John',
        lastName: 'Admin',
        emailAddresses: [{ emailAddress: 'admin@acme.com' }]
      })

      const invitationsHandler = require('../../../pages/api/organizations/[orgId]/invitations.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org123' },
        body: {
          emailAddress: 'newmember@example.com',
          role: 'member',
          message: 'Welcome to the team!',
          redirectUrl: 'https://processaudit.ai/org/acme'
        }
      })

      await invitationsHandler(req, res)

      // Verify response
      expect(res._getStatusCode()).toBe(201)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(true)
      expect(responseData.data.emailAddress).toBe('newmember@example.com')
      expect(responseData.data.role).toBe('member')
      expect(responseData.message).toBe('Invitation sent to newmember@example.com')

      // Verify invitation was created with correct parameters
      expect(mockClerkClient.organizations.createOrganizationInvitation).toHaveBeenCalledWith(
        'org123',
        {
          emailAddress: 'newmember@example.com',
          role: 'member',
          redirectUrl: 'https://processaudit.ai/org/acme',
          publicMetadata: {
            inviterMessage: 'Welcome to the team!',
            inviterUserId: 'admin123'
          }
        }
      )
    })

    test('member invitation with role restrictions', async () => {
      mockGetAuth.mockReturnValue({ userId: 'member123' })
      
      // Mock member (non-admin) trying to invite admin
      mockClerkClient.organizations.getOrganizationMembership.mockResolvedValue({
        id: 'membership_member',
        role: 'member', // Not admin
        publicUserData: { userId: 'member123' }
      })

      const invitationsHandler = require('../../../pages/api/organizations/[orgId]/invitations.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org123' },
        body: {
          emailAddress: 'admin@example.com',
          role: 'admin' // Member trying to invite admin
        }
      })

      await invitationsHandler(req, res)

      // Should be rejected
      expect(res._getStatusCode()).toBe(403)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('INSUFFICIENT_PERMISSIONS')
      expect(responseData.error).toContain('Only organization administrators can invite other administrators')
    })
  })

  describe('Organization Resolution Workflow', () => {
    test('resolves organization by slug', async () => {
      const organizations = [
        {
          id: 'org_acme',
          slug: 'acme',
          name: 'Acme Corporation',
          imageUrl: '',
          publicMetadata: {
            description: 'Leading technology company'
          },
          privateMetadata: {
            branding: {
              customDomain: null
            }
          },
          createdAt: 1640995200000
        },
        {
          id: 'org_techco',
          slug: 'techco',
          name: 'Tech Co',
          imageUrl: '',
          publicMetadata: {},
          privateMetadata: {},
          createdAt: 1640995200000
        }
      ]
      
      mockClerkClient.organizations.getOrganizationList.mockResolvedValue({
        data: organizations
      })

      const resolveHandler = require('../../../pages/api/organizations/resolve.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'acme' }
      })

      await resolveHandler(req, res)

      // Verify response
      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(true)
      expect(responseData.data.slug).toBe('acme')
      expect(responseData.data.name).toBe('Acme Corporation')
      expect(responseData.data.context.resolvedBy).toBe('slug')
      expect(responseData.data.context.identifier).toBe('acme')
      expect(responseData.data.context.hasCustomDomain).toBe(false)
    })

    test('resolves organization by custom domain', async () => {
      const organizations = [
        {
          id: 'org_company',
          slug: 'company',
          name: 'Company Inc',
          imageUrl: '',
          publicMetadata: {},
          privateMetadata: {
            branding: {
              customDomain: 'company.example.com'
            }
          },
          createdAt: 1640995200000
        }
      ]
      
      mockClerkClient.organizations.getOrganizationList.mockResolvedValue({
        data: organizations
      })

      const resolveHandler = require('../../../pages/api/organizations/resolve.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { domain: 'company.example.com' }
      })

      await resolveHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(true)
      expect(responseData.data.slug).toBe('company')
      expect(responseData.data.context.resolvedBy).toBe('domain')
      expect(responseData.data.context.hasCustomDomain).toBe(true)
      expect(responseData.data.context.customDomain).toBe('company.example.com')
    })

    test('returns 404 for non-existent organization', async () => {
      mockClerkClient.organizations.getOrganizationList.mockResolvedValue({
        data: []
      })

      const resolveHandler = require('../../../pages/api/organizations/resolve.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'nonexistent' }
      })

      await resolveHandler(req, res)

      expect(res._getStatusCode()).toBe(404)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('ORG_NOT_FOUND')
      expect(responseData.identifier).toEqual({ 
        domain: undefined, 
        subdomain: undefined, 
        slug: 'nonexistent', 
        id: undefined 
      })
    })
  })

  describe('Organization Settings Management', () => {
    test('updates organization settings with plan validation', async () => {
      mockGetAuth.mockReturnValue({ userId: 'admin123' })
      
      // Mock admin membership
      mockClerkClient.organizations.getOrganizationMembership.mockResolvedValue({
        id: 'membership_admin',
        role: 'admin',
        publicUserData: { userId: 'admin123' }
      })
      
      // Mock current organization
      const currentOrg = {
        id: 'org123',
        name: 'Acme Corp',
        publicMetadata: {
          description: 'Old description',
          website: 'https://old-site.com'
        },
        privateMetadata: {
          plan: 'free',
          features: {
            enableAutomations: true,
            enableReporting: true,
            enableIntegrations: false,
            maxProjects: 5,
            maxMembers: 5
          },
          branding: {
            primaryColor: '#3b82f6'
          }
        }
      }
      mockClerkClient.organizations.getOrganization.mockResolvedValue(currentOrg)
      
      // Mock successful update
      const updatedOrg = {
        ...currentOrg,
        publicMetadata: {
          description: 'Updated description',
          website: 'https://new-site.com',
          industry: 'technology'
        },
        privateMetadata: {
          ...currentOrg.privateMetadata,
          branding: {
            primaryColor: '#ff6b35',
            secondaryColor: '#6b7280'
          },
          features: {
            ...currentOrg.privateMetadata.features,
            maxProjects: 3 // Should be limited to 5 for free plan
          }
        },
        updatedAt: Date.now()
      }
      mockClerkClient.organizations.updateOrganization.mockResolvedValue(updatedOrg)

      const settingsHandler = require('../../../pages/api/organizations/[orgId]/settings.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { orgId: 'org123' },
        body: {
          general: {
            description: 'Updated description',
            website: 'https://new-site.com',
            industry: 'technology'
          },
          branding: {
            primaryColor: '#ff6b35',
            secondaryColor: '#6b7280'
          },
          features: {
            maxProjects: 10 // Should be validated against plan limits
          }
        }
      })

      await settingsHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(true)
      
      // Verify update was called with plan validation
      const updateCall = mockClerkClient.organizations.updateOrganization.mock.calls[0][1]
      
      // General settings should be updated
      expect(updateCall.publicMetadata.description).toBe('Updated description')
      expect(updateCall.publicMetadata.website).toBe('https://new-site.com')
      expect(updateCall.publicMetadata.industry).toBe('technology')
      
      // Branding should be updated
      expect(updateCall.privateMetadata.branding.primaryColor).toBe('#ff6b35')
      expect(updateCall.privateMetadata.branding.secondaryColor).toBe('#6b7280')
      
      // Features should be validated against plan (free plan max projects = 5)
      expect(updateCall.privateMetadata.features.maxProjects).toBe(5) // Should be limited
    })

    test('validates webhook URLs in notification settings', async () => {
      mockGetAuth.mockReturnValue({ userId: 'admin123' })
      mockClerkClient.organizations.getOrganizationMembership.mockResolvedValue({
        id: 'membership_admin',
        role: 'admin'
      })

      const settingsHandler = require('../../../pages/api/organizations/[orgId]/settings.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { orgId: 'org123' },
        body: {
          notifications: {
            slackWebhook: 'invalid-url' // Invalid URL format
          }
        }
      })

      await settingsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('INVALID_SLACK_WEBHOOK')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('handles Clerk service unavailable', async () => {
      mockGetAuth.mockReturnValue({ userId: 'user123' })
      mockClerkClient.organizations.createOrganization.mockRejectedValue(
        new Error('Service temporarily unavailable')
      )

      const organizationsHandler = require('../../../pages/api/organizations/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        body: { name: 'Test Org' }
      })

      await organizationsHandler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('CREATE_ERROR')
    })

    test('handles organization membership limits', async () => {
      mockGetAuth.mockReturnValue({ userId: 'admin123' })
      
      mockClerkClient.organizations.getOrganizationMembership.mockResolvedValue({
        role: 'admin'
      })
      
      // Mock organization at member limit
      mockClerkClient.organizations.getOrganization.mockResolvedValue({
        id: 'org123',
        maxAllowedMemberships: 5
      })
      
      mockClerkClient.organizations.getOrganizationMembershipList.mockResolvedValue({
        totalCount: 5 // At limit
      })

      const invitationsHandler = require('../../../pages/api/organizations/[orgId]/invitations.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org123' },
        body: {
          emailAddress: 'user@example.com',
          role: 'member'
        }
      })

      await invitationsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('MEMBER_LIMIT_REACHED')
    })

    test('prevents removing last admin', async () => {
      mockGetAuth.mockReturnValue({ userId: 'admin123' })
      
      // Mock admin membership check
      mockClerkClient.organizations.getOrganizationMembership.mockResolvedValue({
        id: 'membership_admin',
        role: 'admin',
        publicUserData: { userId: 'admin123' }
      })
      
      // Mock target membership (also admin)
      mockClerkClient.organizations.getOrganizationMembership.mockResolvedValue({
        id: 'membership_target',
        role: 'admin',
        publicUserData: { userId: 'target456' }
      })
      
      // Mock membership list showing only one admin
      mockClerkClient.organizations.getOrganizationMembershipList.mockResolvedValue({
        data: [
          { id: 'membership_target', role: 'admin' }
        ]
      })

      const membershipHandler = require('../../../pages/api/organizations/[orgId]/memberships/[membershipId].js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { orgId: 'org123', membershipId: 'target456' }
      })

      await membershipHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe('LAST_ADMIN')
    })
  })

  describe('Performance and Caching', () => {
    test('organization resolution includes cache headers', async () => {
      mockClerkClient.organizations.getOrganizationList.mockResolvedValue({
        data: [{
          id: 'org1',
          slug: 'test',
          name: 'Test Org',
          createdAt: Date.now()
        }]
      })

      const resolveHandler = require('../../../pages/api/organizations/resolve.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'test' }
      })

      await resolveHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      // Check cache headers
      const cacheControl = res.getHeaders()['cache-control'] || res._headers['cache-control']
      expect(cacheControl).toContain('max-age=300')
      expect(cacheControl).toContain('s-maxage=300')
    })
  })

  describe('Security Validation', () => {
    test('validates organization slug format', async () => {
      mockGetAuth.mockReturnValue({ userId: 'user123' })

      const organizationsHandler = require('../../../pages/api/organizations/index.js').default
      const { createMocks } = require('node-mocks-http')
      
      const maliciousSlug = '../../../etc/passwd'
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Org',
          slug: maliciousSlug
        }
      })

      await organizationsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.code).toBe('INVALID_SLUG')
    })

    test('sanitizes user input in organization settings', async () => {
      mockGetAuth.mockReturnValue({ userId: 'admin123' })
      mockClerkClient.organizations.getOrganizationMembership.mockResolvedValue({
        role: 'admin'
      })
      mockClerkClient.organizations.getOrganization.mockResolvedValue({
        id: 'org123',
        publicMetadata: {},
        privateMetadata: {}
      })

      const settingsHandler = require('../../../pages/api/organizations/[orgId]/settings.js').default
      const { createMocks } = require('node-mocks-http')
      
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { orgId: 'org123' },
        body: {
          notifications: {
            webhookUrl: 'javascript:alert("xss")' // Malicious URL
          }
        }
      })

      await settingsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.code).toBe('INVALID_WEBHOOK_URL')
    })
  })
})