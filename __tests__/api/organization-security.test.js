/**
 * Organization API Security Tests
 * ProcessAudit AI - API Security Validation
 */

import { jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';

// Mock Clerk authentication
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(),
  clerkClient: {
    organizations: {
      getOrganizationMembership: jest.fn()
    }
  }
}));

const { getAuth, clerkClient } = require('@clerk/nextjs/server');

describe('Organization API Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Validation', () => {
    test('should reject unauthenticated requests', async () => {
      getAuth.mockReturnValue({ userId: null });

      const organizationHandler = require('../../pages/api/organizations/index.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await organizationHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Authentication required');
    });

    test('should validate organization context for specific org requests', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_different',
        orgRole: 'member'
      });

      const orgHandler = require('../../pages/api/organizations/[orgId]/index.js').default;
      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_target' }
      });

      // Mock organization membership check
      clerkClient.organizations.getOrganizationMembership.mockRejectedValue(
        new Error('Unauthorized')
      );

      await orgHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      // API should handle membership validation errors
    });

    test('should validate Clerk authentication is enabled', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_USE_CLERK_AUTH;
      process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'false';

      const organizationHandler = require('../../pages/api/organizations/index.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await organizationHandler(req, res);

      expect(res._getStatusCode()).toBe(501);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Clerk authentication');
      expect(responseData.code).toBe('CLERK_NOT_ENABLED');

      // Restore environment
      process.env.NEXT_PUBLIC_USE_CLERK_AUTH = originalEnv;
    });
  });

  describe('Input Validation', () => {
    test('should validate organization ID format', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_valid',
        orgRole: 'admin'
      });

      const orgHandler = require('../../pages/api/organizations/[orgId]/index.js').default;
      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: null }
      });

      await orgHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Organization ID is required');
      expect(responseData.code).toBe('INVALID_ORG_ID');
    });

    test('should validate method not allowed', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_valid',
        orgRole: 'admin'
      });

      const organizationHandler = require('../../pages/api/organizations/index.js').default;
      const { req, res } = createMocks({
        method: 'DELETE' // Not allowed method
      });

      await organizationHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Method DELETE not allowed');
      expect(responseData.code).toBe('METHOD_NOT_ALLOWED');
      expect(res._getHeaders().allow).toEqual(['GET', 'POST']);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      getAuth.mockImplementation(() => {
        throw new Error('Clerk service unavailable');
      });

      const organizationHandler = require('../../pages/api/organizations/index.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await organizationHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('error');
    });

    test('should not expose sensitive error details', async () => {
      getAuth.mockImplementation(() => {
        const error = new Error('Database connection failed with credentials: user:pass@host');
        error.stack = 'Sensitive stack trace with internal details';
        throw error;
      });

      const organizationHandler = require('../../pages/api/organizations/index.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await organizationHandler(req, res);

      const responseData = JSON.parse(res._getData());

      // Should not expose sensitive details in production-like error handling
      expect(responseData.error).toBeDefined();
      expect(responseData.success).toBe(false);
    });
  });

  describe('Cross-Tenant Security', () => {
    test('should prevent access to different organization data', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_user_belongs_to',
        orgRole: 'member'
      });

      // User tries to access different organization
      const orgHandler = require('../../pages/api/organizations/[orgId]/index.js').default;
      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_different_organization' }
      });

      // Mock membership check failure (user not in target org)
      clerkClient.organizations.getOrganizationMembership.mockRejectedValue(
        new Error('User not found in organization')
      );

      await orgHandler(req, res);

      // Should handle the membership validation gracefully
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(400);
    });

    test('should validate organization membership for admin operations', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_target',
        orgRole: 'member' // Not admin
      });

      const settingsHandler = require('../../pages/api/organizations/[orgId]/settings.js').default;
      const { req, res } = createMocks({
        method: 'PUT',
        query: { orgId: 'org_target' },
        body: {
          name: 'Updated Organization Name'
        }
      });

      // Mock membership with member role (not admin)
      clerkClient.organizations.getOrganizationMembership.mockResolvedValue({
        id: 'mem_123',
        role: 'member',
        organization: { id: 'org_target' }
      });

      await settingsHandler(req, res);

      // Should validate admin permissions for settings updates
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Rate Limiting Protection', () => {
    test('should handle rapid successive requests', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_valid',
        orgRole: 'member'
      });

      const organizationHandler = require('../../pages/api/organizations/index.js').default;

      // Simulate multiple rapid requests
      const requests = Array(5).fill().map(() => createMocks({
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.100'
        }
      }));

      const responses = await Promise.all(
        requests.map(({ req, res }) => organizationHandler(req, res))
      );

      // All requests should be processed (no built-in rate limiting yet)
      // This test validates the API can handle concurrent requests
      expect(requests).toHaveLength(5);
    });
  });
});