/**
 * Multi-Tenant SOP Generation API Tests
 * Sprint 2 Story 1: Industry-Specific SOP Generation Testing
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

// Mock Supabase
const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  data: null,
  error: null
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => mockSupabaseQuery)
  }))
}));

const { getAuth } = require('@clerk/nextjs/server');

describe('Multi-Tenant SOP Generation API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseQuery.data = null;
    mockSupabaseQuery.error = null;
  });

  describe('Organization Context Validation', () => {
    test('should validate organization context for SOP generation', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_hospitality_456',
        orgRole: 'admin'
      });

      // Mock organization lookup
      mockSupabaseQuery.data = {
        id: 'org_hospitality_456',
        name: 'Hotel Paradise',
        industry_type: 'hospitality',
        plan: 'premium'
      };

      const sopGenerateHandler = require('../../pages/api/organizations/[orgId]/sop/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_hospitality_456' },
        body: {
          processDescription: 'Front desk check-in procedure',
          sopContent: null
        },
        headers: {
          'x-correlation-id': 'test_sop_123'
        }
      });

      await sopGenerateHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data.organizationId).toBe('org_hospitality_456');
    });

    test('should reject cross-tenant SOP generation attempts', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_restaurant_789', // User belongs to restaurant org
        orgRole: 'member'
      });

      const sopGenerateHandler = require('../../pages/api/organizations/[orgId]/sop/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_hospitality_456' }, // Trying to access hospitality org
        body: {
          processDescription: 'Unauthorized access attempt'
        }
      });

      await sopGenerateHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Organization context mismatch');
    });

    test('should require authentication for SOP generation', async () => {
      getAuth.mockReturnValue({
        userId: null,
        orgId: null,
        orgRole: null
      });

      const sopGenerateHandler = require('../../pages/api/organizations/[orgId]/sop/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_test_123' },
        body: {
          processDescription: 'Test process'
        }
      });

      await sopGenerateHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Authentication required');
    });
  });

  describe('Industry-Specific SOP Generation', () => {
    test('should generate hospitality-specific SOP with industry prompts', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_hospitality_456',
        orgRole: 'member'
      });

      // Mock organization with hospitality industry
      mockSupabaseQuery.data = {
        id: 'org_hospitality_456',
        name: 'Hotel Paradise',
        industry_type: 'hospitality',
        plan: 'premium'
      };

      // Mock industry configuration
      const industryConfigQuery = { ...mockSupabaseQuery };
      industryConfigQuery.data = {
        organization_id: 'org_hospitality_456',
        industry_type: 'hospitality',
        industry_subtype: 'luxury_hotel',
        compliance_requirements: ['fire_safety', 'accessibility_compliance'],
        custom_terminology: {
          'customer': 'guest',
          'service': 'hospitality service'
        }
      };

      // Mock SOP prompt template
      const templateQuery = { ...mockSupabaseQuery };
      templateQuery.data = {
        industry_type: 'hospitality',
        template_name: 'hotel_service_sop',
        prompt_content: 'Generate a hospitality SOP with guest service protocols...'
      };

      const sopGenerateHandler = require('../../pages/api/organizations/[orgId]/sop/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_hospitality_456' },
        body: {
          processDescription: 'Front desk check-in procedure for luxury hotel guests',
          sopContent: null
        }
      });

      await sopGenerateHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data.industryType).toBe('hospitality');
      expect(responseData.data.organizationId).toBe('org_hospitality_456');
    });

    test('should generate restaurant-specific SOP with food safety focus', async () => {
      getAuth.mockReturnValue({
        userId: 'user_456',
        orgId: 'org_restaurant_789',
        orgRole: 'admin'
      });

      // Mock restaurant organization
      mockSupabaseQuery.data = {
        id: 'org_restaurant_789',
        name: 'Fine Dining Restaurant',
        industry_type: 'restaurant',
        plan: 'premium'
      };

      const sopGenerateHandler = require('../../pages/api/organizations/[orgId]/sop/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_restaurant_789' },
        body: {
          processDescription: 'Kitchen food preparation and safety procedures',
          sopContent: null
        }
      });

      await sopGenerateHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data.industryType).toBe('restaurant');
    });

    test('should use default general prompt for organizations without industry config', async () => {
      getAuth.mockReturnValue({
        userId: 'user_789',
        orgId: 'org_general_123',
        orgRole: 'member'
      });

      // Mock organization without specific industry configuration
      mockSupabaseQuery.data = {
        id: 'org_general_123',
        name: 'General Business Corp',
        industry_type: 'general',
        plan: 'free'
      };

      const sopGenerateHandler = require('../../pages/api/organizations/[orgId]/sop/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_general_123' },
        body: {
          processDescription: 'Standard business process documentation'
        }
      });

      await sopGenerateHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data.industryType).toBe('general');
      expect(responseData.data.promptTemplate).toBe('default');
    });
  });

  describe('Industry Configuration Management', () => {
    test('should allow admin to update industry configuration', async () => {
      getAuth.mockReturnValue({
        userId: 'user_admin_123',
        orgId: 'org_hospitality_456',
        orgRole: 'admin'
      });

      // Mock successful configuration update
      mockSupabaseQuery.data = {
        id: 'config_123',
        organization_id: 'org_hospitality_456',
        industry_type: 'hospitality',
        industry_subtype: 'luxury_hotel',
        compliance_requirements: ['fire_safety', 'accessibility'],
        updated_by: 'user_admin_123'
      };

      const configHandler = require('../../pages/api/organizations/[orgId]/industry-config.js').default;

      const { req, res } = createMocks({
        method: 'PUT',
        query: { orgId: 'org_hospitality_456' },
        body: {
          industry_type: 'hospitality',
          industry_subtype: 'luxury_hotel',
          compliance_requirements: ['fire_safety', 'accessibility'],
          custom_terminology: {
            'customer': 'guest',
            'service': 'hospitality experience'
          }
        }
      });

      await configHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
    });

    test('should reject industry configuration changes from non-admin users', async () => {
      getAuth.mockReturnValue({
        userId: 'user_member_456',
        orgId: 'org_hospitality_456',
        orgRole: 'member' // Not admin
      });

      const configHandler = require('../../pages/api/organizations/[orgId]/industry-config.js').default;

      const { req, res } = createMocks({
        method: 'PUT',
        query: { orgId: 'org_hospitality_456' },
        body: {
          industry_type: 'restaurant' // Attempting to change industry
        }
      });

      await configHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Admin role required');
    });

    test('should validate industry type values', async () => {
      getAuth.mockReturnValue({
        userId: 'user_admin_123',
        orgId: 'org_test_456',
        orgRole: 'admin'
      });

      const configHandler = require('../../pages/api/organizations/[orgId]/industry-config.js').default;

      const { req, res } = createMocks({
        method: 'PUT',
        query: { orgId: 'org_test_456' },
        body: {
          industry_type: 'invalid_industry_type'
        }
      });

      await configHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid industry type');
      expect(responseData.validIndustries).toContain('hospitality');
      expect(responseData.validIndustries).toContain('restaurant');
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle missing SOP content gracefully', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_test_456',
        orgRole: 'member'
      });

      const sopGenerateHandler = require('../../pages/api/organizations/[orgId]/sop/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_test_456' },
        body: {} // No content provided
      });

      await sopGenerateHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('SOP content or process description required');
    });

    test('should handle database errors gracefully', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_test_456',
        orgRole: 'member'
      });

      // Mock database error
      mockSupabaseQuery.error = new Error('Database connection failed');

      const sopGenerateHandler = require('../../pages/api/organizations/[orgId]/sop/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_test_456' },
        body: {
          processDescription: 'Test process'
        }
      });

      await sopGenerateHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Organization not found');
    });

    test('should handle unsupported HTTP methods', async () => {
      const sopGenerateHandler = require('../../pages/api/organizations/[orgId]/sop/generate.js').default;

      const { req, res } = createMocks({
        method: 'GET', // Unsupported method
        query: { orgId: 'org_test_456' }
      });

      await sopGenerateHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Method not allowed');
      expect(responseData.allowedMethods).toEqual(['POST']);
    });
  });

  describe('Industry Template System', () => {
    test('should retrieve industry-specific templates', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_medical_789',
        orgRole: 'admin'
      });

      // Mock medical organization
      mockSupabaseQuery.data = {
        id: 'org_medical_789',
        name: 'Medical Clinic',
        industry_type: 'medical',
        plan: 'enterprise'
      };

      const configHandler = require('../../pages/api/organizations/[orgId]/industry-config.js').default;

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_medical_789' }
      });

      await configHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data.currentIndustryType).toBe('medical');
      expect(responseData.data.supportedIndustries).toContain('medical');
    });

    test('should support custom terminology in industry configuration', async () => {
      getAuth.mockReturnValue({
        userId: 'user_admin_456',
        orgId: 'org_hospitality_123',
        orgRole: 'admin'
      });

      const configHandler = require('../../pages/api/organizations/[orgId]/industry-config.js').default;

      const { req, res } = createMocks({
        method: 'PUT',
        query: { orgId: 'org_hospitality_123' },
        body: {
          industry_type: 'hospitality',
          industry_subtype: 'boutique_hotel',
          custom_terminology: {
            'customer': 'guest',
            'service': 'guest experience',
            'problem': 'guest concern'
          },
          compliance_requirements: ['fire_safety', 'ada_compliance', 'food_safety']
        }
      });

      // Mock successful update
      mockSupabaseQuery.data = {
        id: 'config_456',
        organization_id: 'org_hospitality_123',
        industry_type: 'hospitality',
        custom_terminology: {
          'customer': 'guest',
          'service': 'guest experience'
        }
      };

      await configHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
    });
  });
});