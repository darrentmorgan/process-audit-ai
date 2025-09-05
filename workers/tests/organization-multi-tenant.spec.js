/**
 * Organization Multi-Tenant Integration Tests
 * Tests organization context propagation and data isolation in Workers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processAutomationJob } from '../src/processor.js';
import { 
  getJobOrganizationContext,
  validateOrganizationAccess,
  checkOrganizationLimits,
  getOrganizationUsageStats,
  logOrganizationUsage
} from '../src/database.js';
import { callModel } from '../src/ai/model-router.js';
import { IntelligentPromptBuilder } from '../src/ai/intelligent-prompt-builder.js';

// Mock environment with database configuration
const mockEnv = {
  SUPABASE_URL: 'https://test-project.supabase.co',
  SUPABASE_SERVICE_KEY: 'test-service-key',
  CLAUDE_API_KEY: 'sk-ant-test-key',
  OPENAI_API_KEY: 'sk-test-key',
  N8N_MCP_SERVER_URL: 'https://test-mcp-server.com',
  N8N_MCP_AUTH_TOKEN: 'test-mcp-token'
};

// Mock organizations for testing
const mockOrganizations = {
  enterprise: {
    id: 'org-enterprise-001',
    clerk_org_id: 'org_enterprise_test',
    name: 'Enterprise Corp',
    slug: 'enterprise-corp',
    plan: 'enterprise'
  },
  professional: {
    id: 'org-professional-001', 
    clerk_org_id: 'org_professional_test',
    name: 'Professional LLC',
    slug: 'professional-llc',
    plan: 'professional'
  },
  starter: {
    id: 'org-starter-001',
    clerk_org_id: 'org_starter_test', 
    name: 'Startup Inc',
    slug: 'startup-inc',
    plan: 'starter'
  },
  free: {
    id: 'org-free-001',
    clerk_org_id: 'org_free_test',
    name: 'Free Org',
    slug: 'free-org',
    plan: 'free'
  }
};

const mockUsers = {
  enterpriseAdmin: 'user-enterprise-admin-001',
  professionalUser: 'user-professional-001',
  starterUser: 'user-starter-001',
  freeUser: 'user-free-001',
  personalUser: 'user-personal-001'
};

describe('Organization Multi-Tenant Integration Tests', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url, options) => {
      // Mock Supabase database responses
      if (url.includes('/rest/v1/automation_jobs')) {
        if (options?.method === 'POST') {
          // Job creation - return created job with organization context
          const body = JSON.parse(options.body);
          return Response.json([{
            id: `job-${Date.now()}`,
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        } else if (url.includes('select=*,organizations')) {
          // Job with organization context
          const jobId = url.match(/id=eq\.([^&]+)/)?.[1];
          const orgId = jobId?.includes('enterprise') ? mockOrganizations.enterprise.id :
                       jobId?.includes('professional') ? mockOrganizations.professional.id :
                       jobId?.includes('starter') ? mockOrganizations.starter.id :
                       jobId?.includes('free') ? mockOrganizations.free.id : null;
          
          return Response.json([{
            id: jobId,
            user_id: mockUsers.enterpriseAdmin,
            organization_id: orgId,
            status: 'processing',
            progress: 50,
            organizations: orgId ? Object.values(mockOrganizations).find(org => org.id === orgId) : null
          }]);
        }
      }
      
      if (url.includes('/rest/v1/organizations')) {
        // Organization lookup
        const orgId = url.match(/id=eq\.([^&]+)/)?.[1];
        const org = Object.values(mockOrganizations).find(o => o.id === orgId);
        return Response.json(org ? [org] : []);
      }

      if (url.includes('/rest/v1/organization_memberships')) {
        // Membership validation
        const userId = url.match(/user_id=eq\.([^&]+)/)?.[1];
        const orgId = url.match(/organization_id=eq\.([^&]+)/)?.[1];
        
        // Mock membership validation logic
        const isValidMembership = (
          (userId === mockUsers.enterpriseAdmin && orgId === mockOrganizations.enterprise.id) ||
          (userId === mockUsers.professionalUser && orgId === mockOrganizations.professional.id) ||
          (userId === mockUsers.starterUser && orgId === mockOrganizations.starter.id) ||
          (userId === mockUsers.freeUser && orgId === mockOrganizations.free.id)
        );
        
        return Response.json(isValidMembership ? [{
          id: `membership-${userId}-${orgId}`,
          user_id: userId,
          organization_id: orgId,
          role: 'admin',
          status: 'active'
        }] : []);
      }

      if (url.includes('/rest/v1/generated_automations')) {
        // Automation save
        return Response.json([]);
      }

      if (url.includes('/rest/v1/organization_usage_logs')) {
        // Usage logging
        return Response.json([]);
      }

      // Mock AI API responses
      if (url.includes('api.anthropic.com')) {
        return Response.json({
          content: [{ text: '{"workflowName": "Test Workflow", "triggers": [{"type": "webhook"}], "steps": [{"id": "1", "name": "Start", "type": "trigger"}]}' }]
        });
      }

      if (url.includes('api.openai.com')) {
        return Response.json({
          choices: [{ message: { content: '{"workflowName": "Test Workflow", "triggers": [{"type": "webhook"}], "steps": [{"id": "1", "name": "Start", "type": "trigger"}]}' }}],
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
        });
      }

      return Response.json({});
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('Organization Context Validation', () => {
    it('should validate organization access for valid memberships', async () => {
      const access = await validateOrganizationAccess(
        mockEnv, 
        mockUsers.enterpriseAdmin, 
        mockOrganizations.enterprise.id
      );
      
      expect(access).toBeTruthy();
      expect(access.role).toBe('admin');
      expect(access.status).toBe('active');
    });

    it('should reject access for invalid memberships', async () => {
      const access = await validateOrganizationAccess(
        mockEnv,
        mockUsers.personalUser, // User not in any organization
        mockOrganizations.enterprise.id
      );
      
      expect(access).toBeNull();
    });

    it('should get organization context for jobs', async () => {
      const context = await getJobOrganizationContext(
        mockEnv,
        'job-enterprise-test'
      );
      
      expect(context).toBeTruthy();
      expect(context.organizationId).toBe(mockOrganizations.enterprise.id);
      expect(context.organization.name).toBe('Enterprise Corp');
      expect(context.organization.plan).toBe('enterprise');
    });
  });

  describe('Plan-Based Limits and Features', () => {
    it('should enforce enterprise plan limits', async () => {
      const limits = await checkOrganizationLimits(
        mockEnv,
        mockOrganizations.enterprise.id
      );
      
      expect(limits.allowed).toBe(true);
      expect(limits.plan).toBe('enterprise');
      expect(limits.limit).toBe(Infinity);
    });

    it('should enforce free plan limits', async () => {
      // Mock high usage for free plan
      fetchSpy.mockImplementation(async (url, options) => {
        if (url.includes('automation_jobs') && url.includes('created_at=gte')) {
          // Return 5 existing jobs (at limit)
          return Response.json(Array.from({length: 5}, (_, i) => ({
            id: `job-${i}`,
            created_at: new Date().toISOString()
          })));
        }
        return fetchSpy.getMockImplementation()(url, options);
      });

      const limits = await checkOrganizationLimits(
        mockEnv,
        mockOrganizations.free.id
      );
      
      expect(limits.allowed).toBe(false);
      expect(limits.reason).toBe('monthly_limit_exceeded');
      expect(limits.plan).toBe('free');
      expect(limits.currentUsage).toBe(5);
      expect(limits.limit).toBe(5);
    });
  });

  describe('AI Model Router Organization Integration', () => {
    it('should apply organization-specific model preferences for enterprise', async () => {
      const organizationContext = {
        organizationId: mockOrganizations.enterprise.id,
        organizationName: 'Enterprise Corp',
        organizationPlan: 'enterprise'
      };

      const response = await callModel(mockEnv, 'Test prompt', {
        tier: 'orchestrator',
        organizationContext,
        jobId: 'test-job'
      });
      
      expect(response).toBeTruthy();
      // Verify Claude was preferred for enterprise plan
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('api.anthropic.com'),
        expect.any(Object)
      );
    });

    it('should apply organization-specific model preferences for free plan', async () => {
      const organizationContext = {
        organizationId: mockOrganizations.free.id,
        organizationName: 'Free Org', 
        organizationPlan: 'free'
      };

      const response = await callModel(mockEnv, 'Test prompt', {
        tier: 'agent',
        organizationContext,
        jobId: 'test-job'
      });
      
      expect(response).toBeTruthy();
      // Free plan should prefer OpenAI for cost-effectiveness
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('api.openai.com'),
        expect.any(Object)
      );
    });
  });

  describe('Intelligent Prompt Builder Organization Integration', () => {
    it('should generate organization-aware prompts for enterprise', async () => {
      const promptBuilder = new IntelligentPromptBuilder();
      const organizationContext = {
        organizationId: mockOrganizations.enterprise.id,
        organizationName: 'Enterprise Corp',
        organizationPlan: 'enterprise',
        workspaceType: 'organization'
      };

      const orchestrationPlan = {
        description: 'Test workflow',
        workflowName: 'Enterprise Test Workflow'
      };

      const prompt = await promptBuilder.buildIntelligentPrompt(
        orchestrationPlan,
        { industry: 'Technology' },
        organizationContext
      );

      expect(prompt).toContain('Enterprise Corp');
      expect(prompt).toContain('enterprise');
      expect(prompt).toContain('organization workspace');
      expect(prompt).toContain('50+ nodes'); // Enterprise node limit
      expect(prompt).toContain('Security'); // Enterprise focus area
      expect(prompt).toContain('[Enterprise Corp] Enterprise Test Workflow');
    });

    it('should generate organization-aware prompts for free plan', async () => {
      const promptBuilder = new IntelligentPromptBuilder();
      const organizationContext = {
        organizationId: mockOrganizations.free.id,
        organizationName: 'Free Org',
        organizationPlan: 'free',
        workspaceType: 'organization'
      };

      const orchestrationPlan = {
        description: 'Simple workflow',
        workflowName: 'Basic Automation'
      };

      const prompt = await promptBuilder.buildIntelligentPrompt(
        orchestrationPlan,
        {},
        organizationContext
      );

      expect(prompt).toContain('Free Org');
      expect(prompt).toContain('free');
      expect(prompt).toContain('5-10 nodes'); // Free plan node limit
      expect(prompt).toContain('Keep workflows simple to avoid timeouts');
      expect(prompt).toContain('Simplicity'); // Free plan focus area
    });
  });

  describe('End-to-End Organization Workflow Processing', () => {
    it('should process automation job with enterprise organization context', async () => {
      const job = {
        id: 'job-enterprise-e2e-test',
        jobId: 'job-enterprise-e2e-test',
        automationType: 'n8n',
        organizationContext: {
          organizationId: mockOrganizations.enterprise.id,
          organizationName: 'Enterprise Corp',
          organizationPlan: 'enterprise',
          workspaceType: 'organization'
        },
        processData: {
          processDescription: 'Enterprise email automation',
          businessContext: {
            industry: 'Technology',
            volume: '1000+ emails per day',
            complexity: 'High'
          }
        },
        automationOpportunities: [
          {
            stepDescription: 'AI-powered email classification',
            automationSolution: 'ai_email_processing',
            priority: 'high'
          }
        ]
      };

      const result = await processAutomationJob(mockEnv, job);

      expect(result).toBeTruthy();
      expect(result.name).toBeTruthy();
      expect(result.workflow_json).toBeTruthy();
      expect(result.metadata.organizationName).toBe('Enterprise Corp');
      expect(result.metadata.organizationPlan).toBe('enterprise');
      expect(result.metadata.workspaceType).toBe('organization');
      
      // Verify organization usage was logged
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('organization_usage_logs'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('automation_completed')
        })
      );
    });

    it('should process automation job for personal workspace', async () => {
      const job = {
        id: 'job-personal-test',
        jobId: 'job-personal-test',
        automationType: 'n8n',
        organizationContext: {
          workspaceType: 'personal'
        },
        processData: {
          processDescription: 'Personal task automation',
          businessContext: {
            volume: '10-20 tasks per day',
            complexity: 'Low'
          }
        },
        automationOpportunities: [
          {
            stepDescription: 'Simple task routing',
            automationSolution: 'basic_routing',
            priority: 'medium'
          }
        ]
      };

      const result = await processAutomationJob(mockEnv, job);

      expect(result).toBeTruthy();
      expect(result.metadata.organizationName).toBe('Personal');
      expect(result.metadata.workspaceType).toBe('personal');
      expect(result.metadata.organizationId).toBeNull();
    });
  });

  describe('Data Isolation and Security', () => {
    it('should prevent cross-organization data access', async () => {
      // Try to access enterprise organization data with free user
      const access = await validateOrganizationAccess(
        mockEnv,
        mockUsers.freeUser, // Free plan user
        mockOrganizations.enterprise.id // Enterprise organization
      );
      
      expect(access).toBeNull();
    });

    it('should log organization-specific usage data', async () => {
      await logOrganizationUsage(mockEnv, mockOrganizations.professional.id, {
        eventType: 'automation_generated',
        jobId: 'test-job',
        automationType: 'n8n',
        nodeCount: 15,
        processingTime: 5000,
        aiModel: 'claude-3.5-sonnet',
        success: true
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('organization_usage_logs'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(mockOrganizations.professional.id)
        })
      );
    });

    it('should get organization-specific usage statistics', async () => {
      const stats = await getOrganizationUsageStats(
        mockEnv,
        mockOrganizations.enterprise.id
      );

      expect(stats).toBeTruthy();
      expect(stats.organizationId).toBe(mockOrganizations.enterprise.id);
      expect(stats.totalJobs).toBeDefined();
      expect(stats.completedJobs).toBeDefined();
      expect(stats.failedJobs).toBeDefined();
      expect(stats.thisMonth).toBeDefined();
    });
  });

  describe('Plan-Based Feature Differentiation', () => {
    it('should provide enterprise-level features for enterprise plan', async () => {
      const promptBuilder = new IntelligentPromptBuilder();
      const settings = promptBuilder.getOrganizationSettings({
        organizationPlan: 'enterprise'
      });

      expect(settings.executionTimeout).toBe(7200); // 2 hours
      expect(settings.saveExecutionProgress).toBe(true);
    });

    it('should provide basic features for free plan', async () => {
      const promptBuilder = new IntelligentPromptBuilder();
      const settings = promptBuilder.getOrganizationSettings({
        organizationPlan: 'free'
      });

      expect(settings.executionTimeout).toBe(900); // 15 minutes
      expect(settings.saveExecutionProgress).toBeUndefined();
    });

    it('should apply plan-appropriate performance guidelines', async () => {
      const promptBuilder = new IntelligentPromptBuilder();
      
      const enterpriseGuidelines = promptBuilder.getPerformanceGuidelines({
        organizationPlan: 'enterprise'
      });
      expect(enterpriseGuidelines).toContain('high-performance execution modes');
      expect(enterpriseGuidelines).toContain('concurrent processing');

      const freeGuidelines = promptBuilder.getPerformanceGuidelines({
        organizationPlan: 'free'
      });
      expect(freeGuidelines).toContain('Keep workflows simple to avoid timeouts');
      expect(freeGuidelines).toContain('1-10 items');
    });
  });
});