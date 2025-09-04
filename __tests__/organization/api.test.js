/**
 * Tests for organization API endpoints
 * ProcessAudit AI - Phase 2 Multi-Tenancy Implementation
 */

import { createMocks } from 'node-mocks-http'

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(),
  clerkClient: {
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
}))

const { getAuth, clerkClient } = require('@clerk/nextjs/server')

// Import handlers after mocking
const organizationsHandler = require('../../pages/api/organizations/index.js').default
const organizationHandler = require('../../pages/api/organizations/[orgId]/index.js').default
const invitationsHandler = require('../../pages/api/organizations/[orgId]/invitations.js').default
const membershipHandler = require('../../pages/api/organizations/[orgId]/memberships/[membershipId].js').default
const settingsHandler = require('../../pages/api/organizations/[orgId]/settings.js').default
const resolveHandler = require('../../pages/api/organizations/resolve.js').default

describe('Organizations API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true'
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
    process.env.CLERK_SECRET_KEY = 'sk_test_123'
  })

  describe('/api/organizations', () => {
    describe('GET - List Organizations', () => {
      test('returns user organizations successfully', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.users.getOrganizationMembershipList.mockResolvedValue([
          {
            id: 'membership1',
            organization: {
              id: 'org1',
              slug: 'acme',
              name: 'Acme Corp',
              imageUrl: 'https://example.com/logo.png',
              publicMetadata: { description: 'Test org' },
              privateMetadata: { plan: 'professional' },
              createdAt: 1640995200000,
              updatedAt: 1640995200000,
              membersCount: 5,
              maxAllowedMemberships: 25
            },
            role: 'admin',
            permissions: ['manage:members'],
            createdAt: 1640995200000,
            updatedAt: 1640995200000
          }
        ])

        const { req, res } = createMocks({ method: 'GET' })
        await organizationsHandler(req, res)

        expect(res._getStatusCode()).toBe(200)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(true)
        expect(data.data).toHaveLength(1)
        expect(data.data[0].name).toBe('Acme Corp')
        expect(data.data[0].userMembership.role).toBe('admin')
      })

      test('returns empty array when user has no organizations', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.users.getOrganizationMembershipList.mockResolvedValue([])

        const { req, res } = createMocks({ method: 'GET' })
        await organizationsHandler(req, res)

        expect(res._getStatusCode()).toBe(200)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(true)
        expect(data.data).toHaveLength(0)
      })

      test('returns 401 when not authenticated', async () => {
        getAuth.mockReturnValue({ userId: null })

        const { req, res } = createMocks({ method: 'GET' })
        await organizationsHandler(req, res)

        expect(res._getStatusCode()).toBe(401)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('UNAUTHORIZED')
      })
    })

    describe('POST - Create Organization', () => {
      test('creates organization successfully', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.organizations.createOrganization.mockResolvedValue({
          id: 'org1',
          slug: 'acme',
          name: 'Acme Corp',
          imageUrl: 'https://example.com/logo.png',
          publicMetadata: { description: 'Test organization' },
          privateMetadata: { plan: 'free' },
          createdAt: 1640995200000,
          updatedAt: 1640995200000,
          maxAllowedMemberships: 5
        })

        const { req, res } = createMocks({
          method: 'POST',
          body: {
            name: 'Acme Corp',
            slug: 'acme',
            description: 'Test organization',
            plan: 'free'
          }
        })

        await organizationsHandler(req, res)

        expect(res._getStatusCode()).toBe(201)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(true)
        expect(data.data.name).toBe('Acme Corp')
        expect(data.data.plan).toBe('free')
        
        // Verify Clerk was called with correct data
        expect(clerkClient.organizations.createOrganization).toHaveBeenCalledWith({
          name: 'Acme Corp',
          slug: 'acme',
          createdBy: 'user123',
          publicMetadata: {
            description: 'Test organization'
          },
          privateMetadata: {
            plan: 'free',
            features: expect.any(Object),
            security: expect.any(Object),
            notifications: expect.any(Object)
          }
        })
      })

      test('validates required organization name', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })

        const { req, res } = createMocks({
          method: 'POST',
          body: { name: '' }
        })

        await organizationsHandler(req, res)

        expect(res._getStatusCode()).toBe(400)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('INVALID_NAME')
      })

      test('validates organization slug format', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })

        const { req, res } = createMocks({
          method: 'POST',
          body: {
            name: 'Acme Corp',
            slug: 'Acme Corp!' // Invalid characters
          }
        })

        await organizationsHandler(req, res)

        expect(res._getStatusCode()).toBe(400)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('INVALID_SLUG')
      })

      test('validates organization plan', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })

        const { req, res } = createMocks({
          method: 'POST',
          body: {
            name: 'Acme Corp',
            plan: 'premium' // Invalid plan
          }
        })

        await organizationsHandler(req, res)

        expect(res._getStatusCode()).toBe(400)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('INVALID_PLAN')
      })

      test('handles Clerk organization exists error', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.organizations.createOrganization.mockRejectedValue({
          status: 422,
          errors: [{
            code: 'form_identifier_exists',
            longMessage: 'Organization with this name already exists'
          }]
        })

        const { req, res } = createMocks({
          method: 'POST',
          body: { name: 'Existing Org' }
        })

        await organizationsHandler(req, res)

        expect(res._getStatusCode()).toBe(409)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('ORGANIZATION_EXISTS')
      })
    })
  })

  describe('/api/organizations/[orgId]', () => {
    describe('GET - Get Organization', () => {
      test('returns organization details for member', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        
        // Mock membership check
        clerkClient.organizations.getOrganizationMembership.mockResolvedValue({
          id: 'membership1',
          role: 'admin',
          permissions: ['manage:members'],
          createdAt: 1640995200000,
          updatedAt: 1640995200000
        })
        
        // Mock organization details
        clerkClient.organizations.getOrganization.mockResolvedValue({
          id: 'org1',
          slug: 'acme',
          name: 'Acme Corp',
          imageUrl: 'https://example.com/logo.png',
          publicMetadata: { description: 'Test org' },
          privateMetadata: { plan: 'professional' },
          createdAt: 1640995200000,
          updatedAt: 1640995200000,
          maxAllowedMemberships: 25
        })
        
        // Mock member count
        clerkClient.organizations.getOrganizationMembershipList.mockResolvedValue({
          totalCount: 5
        })

        const { req, res } = createMocks({
          method: 'GET',
          query: { orgId: 'org1' }
        })

        await organizationHandler(req, res)

        expect(res._getStatusCode()).toBe(200)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(true)
        expect(data.data.name).toBe('Acme Corp')
        expect(data.data.membersCount).toBe(5)
        expect(data.data.userMembership.role).toBe('admin')
      })

      test('returns 403 for non-members', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.organizations.getOrganizationMembership.mockRejectedValue({
          status: 404
        })

        const { req, res } = createMocks({
          method: 'GET',
          query: { orgId: 'org1' }
        })

        await organizationHandler(req, res)

        expect(res._getStatusCode()).toBe(403)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('NOT_MEMBER')
      })
    })

    describe('PATCH - Update Organization', () => {
      test('updates organization successfully as admin', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        
        // Mock admin membership
        clerkClient.organizations.getOrganizationMembership.mockResolvedValue({
          id: 'membership1',
          role: 'admin'
        })
        
        // Mock current organization
        clerkClient.organizations.getOrganization.mockResolvedValue({
          id: 'org1',
          name: 'Old Name',
          publicMetadata: { description: 'Old description' },
          privateMetadata: { plan: 'free' }
        })
        
        // Mock update
        clerkClient.organizations.updateOrganization.mockResolvedValue({
          id: 'org1',
          name: 'New Name',
          slug: 'acme',
          imageUrl: 'https://example.com/logo.png',
          publicMetadata: { description: 'New description' },
          privateMetadata: { plan: 'free' },
          createdAt: 1640995200000,
          updatedAt: 1640995200000,
          maxAllowedMemberships: 5
        })

        const { req, res } = createMocks({
          method: 'PATCH',
          query: { orgId: 'org1' },
          body: {
            name: 'New Name',
            description: 'New description'
          }
        })

        await organizationHandler(req, res)

        expect(res._getStatusCode()).toBe(200)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(true)
        expect(data.data.name).toBe('New Name')
      })

      test('returns 403 for non-admin users', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.organizations.getOrganizationMembership.mockResolvedValue({
          id: 'membership1',
          role: 'member' // Not admin
        })

        const { req, res } = createMocks({
          method: 'PATCH',
          query: { orgId: 'org1' },
          body: { name: 'New Name' }
        })

        await organizationHandler(req, res)

        expect(res._getStatusCode()).toBe(403)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('INSUFFICIENT_PERMISSIONS')
      })
    })

    describe('DELETE - Delete Organization', () => {
      test('deletes organization successfully as admin', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.organizations.getOrganizationMembership.mockResolvedValue({
          id: 'membership1',
          role: 'admin'
        })
        clerkClient.organizations.deleteOrganization.mockResolvedValue()

        const { req, res } = createMocks({
          method: 'DELETE',
          query: { orgId: 'org1' },
          body: { confirm: true }
        })

        await organizationHandler(req, res)

        expect(res._getStatusCode()).toBe(200)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(true)
        expect(clerkClient.organizations.deleteOrganization).toHaveBeenCalledWith('org1')
      })

      test('requires explicit confirmation', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.organizations.getOrganizationMembership.mockResolvedValue({
          id: 'membership1',
          role: 'admin'
        })

        const { req, res } = createMocks({
          method: 'DELETE',
          query: { orgId: 'org1' },
          body: {} // No confirmation
        })

        await organizationHandler(req, res)

        expect(res._getStatusCode()).toBe(400)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('CONFIRMATION_REQUIRED')
      })
    })
  })

  describe('/api/organizations/[orgId]/invitations', () => {
    describe('POST - Create Invitation', () => {
      test('creates invitation successfully', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        
        // Mock membership check
        clerkClient.organizations.getOrganizationMembership
          .mockResolvedValueOnce({
            id: 'membership1',
            role: 'admin'
          })
          .mockRejectedValueOnce({ status: 404 }) // User to invite not a member
        
        // Mock organization details
        clerkClient.organizations.getOrganization.mockResolvedValue({
          id: 'org1',
          slug: 'acme',
          name: 'Acme Corp',
          maxAllowedMemberships: 25
        })
        
        // Mock member count
        clerkClient.organizations.getOrganizationMembershipList.mockResolvedValue({
          totalCount: 5
        })
        
        // Mock invitation creation
        clerkClient.organizations.createOrganizationInvitation.mockResolvedValue({
          id: 'inv1',
          emailAddress: 'john@example.com',
          role: 'member',
          status: 'pending',
          createdAt: 1640995200000,
          updatedAt: 1640995200000
        })
        
        // Mock inviter details
        clerkClient.users.getUser.mockResolvedValue({
          id: 'user123',
          firstName: 'John',
          lastName: 'Admin',
          emailAddresses: [{ emailAddress: 'admin@example.com' }]
        })

        const { req, res } = createMocks({
          method: 'POST',
          query: { orgId: 'org1' },
          body: {
            emailAddress: 'john@example.com',
            role: 'member',
            message: 'Welcome to the team!'
          }
        })

        await invitationsHandler(req, res)

        expect(res._getStatusCode()).toBe(201)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(true)
        expect(data.data.emailAddress).toBe('john@example.com')
        expect(data.data.role).toBe('member')
      })

      test('validates email address format', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })

        const { req, res } = createMocks({
          method: 'POST',
          query: { orgId: 'org1' },
          body: {
            emailAddress: 'invalid-email',
            role: 'member'
          }
        })

        await invitationsHandler(req, res)

        expect(res._getStatusCode()).toBe(400)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('INVALID_EMAIL_FORMAT')
      })

      test('prevents guests from inviting members', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.organizations.getOrganizationMembership.mockResolvedValue({
          id: 'membership1',
          role: 'guest' // Guest role
        })

        const { req, res } = createMocks({
          method: 'POST',
          query: { orgId: 'org1' },
          body: {
            emailAddress: 'john@example.com',
            role: 'member'
          }
        })

        await invitationsHandler(req, res)

        expect(res._getStatusCode()).toBe(403)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('INSUFFICIENT_PERMISSIONS')
      })

      test('prevents non-admins from inviting admins', async () => {
        getAuth.mockReturnValue({ userId: 'user123' })
        clerkClient.organizations.getOrganizationMembership.mockResolvedValue({
          id: 'membership1',
          role: 'member' // Member trying to invite admin
        })

        const { req, res } = createMocks({
          method: 'POST',
          query: { orgId: 'org1' },
          body: {
            emailAddress: 'john@example.com',
            role: 'admin' // Trying to invite as admin
          }
        })

        await invitationsHandler(req, res)

        expect(res._getStatusCode()).toBe(403)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(false)
        expect(data.code).toBe('INSUFFICIENT_PERMISSIONS')
      })
    })
  })

  describe('/api/organizations/resolve', () => {
    test('resolves organization by slug', async () => {
      clerkClient.organizations.getOrganizationList.mockResolvedValue({
        data: [{
          id: 'org1',
          slug: 'acme',
          name: 'Acme Corp',
          imageUrl: 'https://example.com/logo.png',
          publicMetadata: { description: 'Test org' },
          createdAt: 1640995200000
        }]
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'acme' }
      })

      await resolveHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data.slug).toBe('acme')
      expect(data.data.context.resolvedBy).toBe('slug')
    })

    test('resolves organization by custom domain', async () => {
      clerkClient.organizations.getOrganizationList.mockResolvedValue({
        data: [{
          id: 'org1',
          slug: 'acme',
          name: 'Acme Corp',
          imageUrl: 'https://example.com/logo.png',
          publicMetadata: {},
          privateMetadata: {
            branding: {
              customDomain: 'company.example.com'
            }
          },
          createdAt: 1640995200000
        }]
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { domain: 'company.example.com' }
      })

      await resolveHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data.slug).toBe('acme')
      expect(data.data.context.resolvedBy).toBe('domain')
      expect(data.data.context.hasCustomDomain).toBe(true)
    })

    test('returns 404 when organization not found', async () => {
      clerkClient.organizations.getOrganizationList.mockResolvedValue({
        data: []
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'nonexistent' }
      })

      await resolveHandler(req, res)

      expect(res._getStatusCode()).toBe(404)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.code).toBe('ORG_NOT_FOUND')
    })

    test('requires at least one identifier', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {} // No identifiers
      })

      await resolveHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.code).toBe('MISSING_IDENTIFIER')
    })
  })

  describe('Error Handling', () => {
    test('returns 501 when Clerk is disabled', async () => {
      process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'false'

      const { req, res } = createMocks({ method: 'GET' })
      await organizationsHandler(req, res)

      expect(res._getStatusCode()).toBe(501)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.code).toBe('CLERK_NOT_ENABLED')
    })

    test('handles unexpected errors gracefully', async () => {
      getAuth.mockReturnValue({ userId: 'user123' })
      clerkClient.users.getOrganizationMembershipList.mockRejectedValue(
        new Error('Unexpected error')
      )

      const { req, res } = createMocks({ method: 'GET' })
      await organizationsHandler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.code).toBe('INTERNAL_ERROR')
    })
  })
})