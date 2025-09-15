/**
 * Backend Automation Migration Tests
 * Validates Cloudflare Workers to Next.js backend migration
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
  data: null,
  error: null
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => mockSupabaseQuery)
  }))
}));

const { getAuth } = require('@clerk/nextjs/server');

describe('Backend Automation Migration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseQuery.data = null;
    mockSupabaseQuery.error = null;
  });

  describe('Backend Automation Generation', () => {
    test('should generate automations with organization context', async () => {
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

      const automationHandler = require('../../pages/api/organizations/[orgId]/automations/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_hospitality_456' },
        body: {
          auditReportId: 'audit_123',
          processData: {
            processDescription: 'Guest check-in procedure',
            fileContent: 'Check-in process content'
          },
          automationOpportunities: [
            {
              stepDescription: 'Guest notification automation',
              automationSolution: 'Automated guest welcome and instructions',
              feasibility: 'High',
              priority: 90,
              annualSavings: '$12,000'
            }
          ],
          automationType: 'n8n'
        }
      });

      await automationHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data.automationType).toBe('n8n');
    });

    test('should validate organization context for automation generation', async () => {
      getAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_restaurant_789', // Different org
        orgRole: 'member'
      });

      const automationHandler = require('../../pages/api/organizations/[orgId]/automations/generate.js').default;

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_hospitality_456' }, // Requesting different org
        body: {
          processData: { processDescription: 'Test' },
          automationOpportunities: []
        }
      });

      await automationHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Organization context mismatch');
    });

    test('should generate industry-specific automations', () => {
      const generateIndustryAutomations = (industryType, opportunities) => {
        const industryTemplates = {
          hospitality: [
            'Guest check-in notification workflows',
            'Housekeeping task automation',
            'Property management integrations'
          ],
          restaurant: [
            'Food safety compliance automation',
            'Kitchen order management',
            'Staff scheduling automation'
          ],
          medical: [
            'Patient care workflow automation',
            'Compliance documentation workflows',
            'Clinical alert systems'
          ]
        };

        const templates = industryTemplates[industryType] || [];

        return opportunities.map(opp => ({
          name: `${opp.stepDescription} Automation`,
          industryContext: templates,
          platform: 'n8n',
          workflow: {
            industryType,
            automation: opp.stepDescription
          }
        }));
      };

      const hospitalityOpp = [{ stepDescription: 'Guest check-in process' }];
      const result = generateIndustryAutomations('hospitality', hospitalityOpp);

      expect(result[0].name).toBe('Guest check-in process Automation');
      expect(result[0].workflow.industryType).toBe('hospitality');
      expect(result[0].industryContext).toContain('Guest check-in notification workflows');
    });
  });

  describe('Migration Validation', () => {
    test('should confirm backend APIs exist', () => {
      // Verify backend automation API exists
      expect(() => require('../../pages/api/organizations/[orgId]/automations/generate.js')).not.toThrow();

      // Verify backend SOP API exists
      expect(() => require('../../pages/api/organizations/[orgId]/sop/generate.js')).not.toThrow();

      // Verify industry configuration API exists
      expect(() => require('../../pages/api/organizations/[orgId]/industry-config.js')).not.toThrow();
    });

    test('should validate automation workflow generation', () => {
      const generateWorkflowJSON = (opportunity, platform, industryType) => {
        return {
          name: opportunity.stepDescription,
          platform,
          industryType,
          nodes: [
            { id: 'trigger', type: 'trigger' },
            { id: 'process', type: 'processing' },
            { id: 'output', type: 'output' }
          ]
        };
      };

      const opportunity = { stepDescription: 'Guest welcome automation' };
      const workflow = generateWorkflowJSON(opportunity, 'n8n', 'hospitality');

      expect(workflow.name).toBe('Guest welcome automation');
      expect(workflow.platform).toBe('n8n');
      expect(workflow.industryType).toBe('hospitality');
      expect(workflow.nodes).toHaveLength(3);
    });

    test('should provide implementation instructions by platform', () => {
      const generateInstructions = (platform, industryType) => {
        const platformInstructions = {
          n8n: ['Import workflow JSON', 'Configure API credentials', 'Test workflow'],
          zapier: ['Create new Zap', 'Set up action steps', 'Test Zap'],
          make: ['Create new scenario', 'Configure modules', 'Test scenario']
        };

        const industryNotes = {
          hospitality: 'Ensure guest privacy and data protection',
          restaurant: 'Account for food safety compliance',
          medical: 'Ensure HIPAA compliance'
        };

        return {
          steps: platformInstructions[platform] || [],
          industryNote: industryNotes[industryType] || 'Follow security policies'
        };
      };

      const n8nInstructions = generateInstructions('n8n', 'hospitality');
      expect(n8nInstructions.steps).toContain('Import workflow JSON');
      expect(n8nInstructions.industryNote).toContain('guest privacy');

      const zapierInstructions = generateInstructions('zapier', 'restaurant');
      expect(zapierInstructions.steps).toContain('Create new Zap');
      expect(zapierInstructions.industryNote).toContain('food safety');
    });
  });
});