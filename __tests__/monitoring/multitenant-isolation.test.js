/**
 * Multi-Tenant Monitoring Isolation Tests
 * ProcessAudit AI - Comprehensive Multi-Tenant Functionality Testing
 *
 * Tests complete data isolation verification, organization-specific feature access,
 * plan-based restrictions enforcement, and cross-tenant security validation.
 */

import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { mockOrganizations, mockUsers } from '../multitenant/fixtures/organizations.js';

// Mock environment variables
process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
process.env.CLERK_SECRET_KEY = 'sk_test_123';
process.env.SUPABASE_SERVICE_KEY = 'test_service_key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NODE_ENV = 'test';

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
};

const mockGetAuth = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: mockGetAuth,
  clerkClient: mockClerkClient
}));

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
};

const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseQuery),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

global.fetch = jest.fn();

describe('Multi-Tenant Monitoring Isolation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();

    // Reset Supabase mocks
    mockSupabaseQuery.then.mockImplementation((callback) => {
      return callback({ data: [], error: null });
    });
  });

  describe('Complete Data Isolation Verification', () => {
    test('should isolate monitoring data by organization in metrics collection', async () => {
      // Given: Professional organization admin accessing metrics
      mockGetAuth.mockReturnValue({
        userId: 'user_pro_admin',
        orgSlug: 'acme-corp'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_pro_admin',
          organization: mockOrganizations.professionalOrg,
          role: 'admin',
          publicUserData: { userId: 'user_pro_admin' }
        });

      // Mock metrics query with organization isolation
      mockSupabaseQuery.then.mockImplementation((callback) => {
        return callback({
          data: [
            {
              id: 'metric_pro_001',
              organization_id: 'org_pro_456',
              metric_name: 'api_response_time',
              value: '1.2s',
              timestamp: new Date().toISOString(),
              component: 'api-server'
            },
            {
              id: 'metric_pro_002',
              organization_id: 'org_pro_456',
              metric_name: 'error_rate',
              value: '0.5%',
              timestamp: new Date().toISOString(),
              component: 'api-server'
            }
          ],
          error: null
        });
      });

      // When: Accessing organization metrics
      const metricsHandler = require('../../pages/api/monitoring/metrics/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_pro_456' },
        headers: {
          'x-organization-id': 'org_pro_456'
        }
      });

      await metricsHandler.default(req, res);

      // Then: Should only return metrics for the specific organization
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.data).toHaveLength(2);
      responseData.data.forEach(metric => {
        expect(metric.organization_id).toBe('org_pro_456');
      });

      // Verify RLS policy enforcement
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('organization_id', 'org_pro_456');
    });

    test('should prevent cross-organization access to health check data', async () => {
      // Given: Free plan user attempting to access enterprise org health data
      mockGetAuth.mockReturnValue({
        userId: 'user_free_123',
        orgSlug: 'startup-inc'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_free',
          organization: mockOrganizations.freeOrg,
          publicUserData: { userId: 'user_free_123' }
        });

      // When: Attempting to access enterprise org health data
      const healthHandler = require('../../pages/api/monitoring/health/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_ent_789' }, // Enterprise org
        headers: {
          'x-organization-id': 'org_free_123' // Free org user
        }
      });

      await healthHandler.default(req, res);

      // Then: Should block access with organization mismatch
      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('ORGANIZATION_ACCESS_DENIED');
      expect(responseData.reason).toBe('organization_id_mismatch');
    });

    test('should isolate alert configurations by organization', async () => {
      // Given: Enterprise organization with custom alert settings
      mockGetAuth.mockReturnValue({
        userId: 'user_ent_admin',
        orgSlug: 'global-enterprises'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          id: 'membership_ent_admin',
          organization: mockOrganizations.enterpriseOrg,
          role: 'admin'
        });

      // Mock alert configuration query
      mockSupabaseQuery.then.mockImplementation((callback) => {
        return callback({
          data: [
            {
              id: 'alert_config_ent_001',
              organization_id: 'org_ent_789',
              alert_type: 'critical_response_time',
              threshold: '2000ms',
              enabled: true,
              notification_channels: ['pagerduty', 'slack', 'email'],
              escalation_policy: 'immediate'
            }
          ],
          error: null
        });
      });

      // When: Retrieving alert configurations
      const alertConfigHandler = require('../../pages/api/monitoring/alerts/config/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_ent_789' },
        headers: {
          'x-organization-id': 'org_ent_789'
        }
      });

      await alertConfigHandler.default(req, res);

      // Then: Should return organization-specific alert configurations
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].organization_id).toBe('org_ent_789');
      expect(responseData.data[0].notification_channels).toContain('email'); // Enterprise feature
    });

    test('should enforce tenant isolation in worker monitoring context', async () => {
      // Given: Worker processing job with organization context
      const workerRequest = {
        jobId: 'worker_job_456',
        organizationId: 'org_pro_456',
        organizationPlan: 'professional',
        userId: 'user_pro_admin',
        processTitle: 'Multi-tenant Process Analysis'
      };

      // Mock worker monitoring endpoint
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          jobId: 'worker_job_456',
          organizationContext: {
            id: 'org_pro_456',
            plan: 'professional',
            isolationVerified: true
          },
          metrics: {
            processingTimeMs: 5000,
            memoryUsageMB: 128,
            organizationQuotaUsed: 0.75
          }
        })
      });

      // When: Monitoring worker execution with tenant context
      const workerMonitorHandler = require('../../pages/api/monitoring/worker/[jobId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { jobId: 'worker_job_456' },
        headers: {
          'x-organization-id': 'org_pro_456',
          'x-user-id': 'user_pro_admin'
        }
      });

      await workerMonitorHandler.default(req, res);

      // Then: Worker monitoring should respect tenant isolation
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.organizationContext.id).toBe('org_pro_456');
      expect(responseData.organizationContext.isolationVerified).toBe(true);
      expect(responseData.metrics.organizationQuotaUsed).toBeDefined();

      // Verify worker was called with proper isolation headers
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/worker/monitor'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Organization-Id': 'org_pro_456',
            'X-User-Id': 'user_pro_admin'
          })
        })
      );
    });
  });

  describe('Organization-Specific Feature Access', () => {
    test('should allow enterprise organizations access to advanced monitoring features', async () => {
      // Given: Enterprise organization admin
      mockGetAuth.mockReturnValue({
        userId: 'user_ent_admin',
        orgSlug: 'global-enterprises'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.enterpriseOrg,
          role: 'admin'
        });

      // When: Accessing advanced monitoring features
      const advancedMonitoringHandler = require('../../pages/api/monitoring/advanced/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_ent_789' },
        body: {
          features: [
            'custom_dashboards',
            'advanced_analytics',
            'custom_alert_rules',
            'sla_monitoring',
            'compliance_reports'
          ]
        }
      });

      await advancedMonitoringHandler.default(req, res);

      // Then: Enterprise features should be available
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.features.custom_dashboards.available).toBe(true);
      expect(responseData.features.advanced_analytics.available).toBe(true);
      expect(responseData.features.sla_monitoring.available).toBe(true);
      expect(responseData.features.compliance_reports.available).toBe(true);
    });

    test('should restrict free plan access to basic monitoring only', async () => {
      // Given: Free plan organization member
      mockGetAuth.mockReturnValue({
        userId: 'user_free_123',
        orgSlug: 'startup-inc'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.freeOrg,
          role: 'member'
        });

      // When: Attempting to access advanced monitoring features
      const advancedMonitoringHandler = require('../../pages/api/monitoring/advanced/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_free_123' },
        body: {
          features: [
            'custom_dashboards',
            'advanced_analytics',
            'custom_alert_rules'
          ]
        }
      });

      await advancedMonitoringHandler.default(req, res);

      // Then: Advanced features should be restricted
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.features.custom_dashboards.available).toBe(false);
      expect(responseData.features.custom_dashboards.reason).toBe('upgrade_required');
      expect(responseData.features.advanced_analytics.available).toBe(false);
      expect(responseData.plan_limits.basic_monitoring).toBe(true);
      expect(responseData.upgrade_url).toBeDefined();
    });

    test('should provide plan-specific monitoring quotas', async () => {
      // Given: Professional plan organization
      mockGetAuth.mockReturnValue({
        userId: 'user_pro_admin',
        orgSlug: 'acme-corp'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.professionalOrg,
          role: 'admin'
        });

      // When: Checking monitoring quotas
      const quotaHandler = require('../../pages/api/monitoring/quotas/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_pro_456' }
      });

      await quotaHandler.default(req, res);

      // Then: Should return professional plan quotas
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.quotas).toMatchObject({
        metric_retention_days: 90, // Professional gets 90 days
        alert_rules_limit: 50,
        dashboard_count_limit: 10,
        api_calls_per_hour: 1000,
        data_export_allowed: true
      });

      expect(responseData.plan).toBe('professional');
      expect(responseData.quotas.metric_retention_days).toBeGreaterThan(30); // More than free plan
    });

    test('should enforce organization-specific alert channel configurations', async () => {
      // Given: Organization with specific notification preferences
      mockGetAuth.mockReturnValue({
        userId: 'user_pro_admin',
        orgSlug: 'acme-corp'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: {
            ...mockOrganizations.professionalOrg,
            metadata: {
              notification_preferences: {
                slack_webhook: 'https://hooks.slack.com/acme',
                pagerduty_key: 'acme_pd_key',
                email_alerts: ['admin@acme.com', 'ops@acme.com'],
                escalation_policy: 'business_hours'
              }
            }
          },
          role: 'admin'
        });

      // When: Retrieving notification configurations
      const notificationHandler = require('../../pages/api/monitoring/notifications/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_pro_456' }
      });

      await notificationHandler.default(req, res);

      // Then: Should return organization-specific notification settings
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.notifications).toMatchObject({
        slack_configured: true,
        slack_webhook: expect.stringContaining('hooks.slack.com/acme'),
        pagerduty_configured: true,
        email_recipients: ['admin@acme.com', 'ops@acme.com'],
        escalation_policy: 'business_hours'
      });
    });
  });

  describe('Plan-Based Restrictions Enforcement', () => {
    test('should enforce metric retention limits based on plan', async () => {
      // Given: Free plan attempting to access old metrics
      mockGetAuth.mockReturnValue({
        userId: 'user_free_123',
        orgSlug: 'startup-inc'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.freeOrg,
          role: 'admin'
        });

      // When: Requesting metrics older than free plan retention (30 days)
      const historicalMetricsHandler = require('../../pages/api/monitoring/metrics/historical/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          orgId: 'org_free_123',
          start_date: sixtyDaysAgo.toISOString(),
          end_date: new Date().toISOString()
        }
      });

      await historicalMetricsHandler.default(req, res);

      // Then: Should restrict access to old metrics
      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());

      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('RETENTION_LIMIT_EXCEEDED');
      expect(responseData.details.plan_retention_days).toBe(30);
      expect(responseData.details.requested_days).toBeGreaterThan(30);
    });

    test('should limit concurrent alert rules based on plan', async () => {
      // Given: Free plan at alert rule limit
      mockGetAuth.mockReturnValue({
        userId: 'user_free_123',
        orgSlug: 'startup-inc'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.freeOrg,
          role: 'admin'
        });

      // Mock existing alert rules at limit (5 for free plan)
      mockSupabaseQuery.then.mockImplementation((callback) => {
        return callback({
          data: Array.from({ length: 5 }, (_, i) => ({
            id: `alert_rule_${i}`,
            organization_id: 'org_free_123',
            rule_name: `Alert Rule ${i}`,
            enabled: true
          })),
          error: null
        });
      });

      // When: Attempting to create additional alert rule
      const createAlertHandler = require('../../pages/api/monitoring/alerts/rules/create.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_free_123'
        },
        body: {
          rule_name: 'New Alert Rule',
          conditions: { metric: 'response_time', threshold: '2000ms' },
          actions: { slack: true }
        }
      });

      await createAlertHandler.default(req, res);

      // Then: Should reject due to plan limits
      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());

      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('ALERT_RULE_LIMIT_EXCEEDED');
      expect(responseData.details.current_count).toBe(5);
      expect(responseData.details.plan_limit).toBe(5);
      expect(responseData.upgrade_required).toBe(true);
    });

    test('should restrict custom dashboard creation for free plans', async () => {
      // Given: Free plan user attempting to create custom dashboard
      mockGetAuth.mockReturnValue({
        userId: 'user_free_123',
        orgSlug: 'startup-inc'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.freeOrg,
          role: 'admin'
        });

      // When: Attempting to create custom dashboard
      const dashboardHandler = require('../../pages/api/monitoring/dashboards/create.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_free_123'
        },
        body: {
          dashboard_name: 'Custom Performance Dashboard',
          widgets: [
            { type: 'metric_chart', metric: 'response_time' },
            { type: 'alert_status', alert: 'high_error_rate' }
          ]
        }
      });

      await dashboardHandler.default(req, res);

      // Then: Should restrict custom dashboard creation
      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());

      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('FEATURE_NOT_AVAILABLE');
      expect(responseData.feature).toBe('custom_dashboards');
      expect(responseData.required_plan).toBe('professional');
    });

    test('should allow professional plan access to API integrations', async () => {
      // Given: Professional plan with API integration enabled
      mockGetAuth.mockReturnValue({
        userId: 'user_pro_admin',
        orgSlug: 'acme-corp'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.professionalOrg,
          role: 'admin'
        });

      // When: Accessing monitoring API integration
      const apiIntegrationHandler = require('../../pages/api/monitoring/integrations/api/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        query: { orgId: 'org_pro_456' },
        body: {
          integration_type: 'webhook',
          endpoint_url: 'https://api.acme.com/monitoring/webhook',
          events: ['alert_triggered', 'alert_resolved'],
          authentication: {
            type: 'api_key',
            value: 'acme_api_key_123'
          }
        }
      });

      await apiIntegrationHandler.default(req, res);

      // Then: Professional plan should allow API integrations
      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());

      expect(responseData.success).toBe(true);
      expect(responseData.integration.id).toBeDefined();
      expect(responseData.integration.organization_id).toBe('org_pro_456');
      expect(responseData.webhook_configured).toBe(true);
    });
  });

  describe('Cross-Tenant Security Validation', () => {
    test('should prevent monitoring data leakage between organizations', async () => {
      // Given: User with memberships in multiple organizations
      const multiOrgUser = 'user_multi_org';

      mockGetAuth.mockReturnValue({
        userId: multiOrgUser,
        orgSlug: 'acme-corp' // Currently in professional org
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.professionalOrg,
          role: 'member'
        });

      // Mock metrics query that should only return current org data
      mockSupabaseQuery.then.mockImplementation((callback) => {
        return callback({
          data: [
            {
              id: 'metric_pro_001',
              organization_id: 'org_pro_456', // Only professional org data
              user_id: multiOrgUser,
              metric_name: 'api_calls',
              value: 150
            }
          ],
          error: null
        });
      });

      // When: Accessing monitoring metrics
      const metricsHandler = require('../../pages/api/monitoring/metrics/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_pro_456' },
        headers: {
          'x-organization-id': 'org_pro_456'
        }
      });

      await metricsHandler.default(req, res);

      // Then: Should only return metrics for current organization context
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      responseData.data.forEach(metric => {
        expect(metric.organization_id).toBe('org_pro_456');
      });

      // Verify no data leakage from other organizations
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('organization_id', 'org_pro_456');
      expect(responseData.data.length).toBe(1);
    });

    test('should validate organization context in monitoring webhooks', async () => {
      // Given: External webhook with organization context
      const webhookPayload = {
        alert: {
          alertname: 'ProcessAuditHighCPU',
          labels: {
            organization_id: 'org_pro_456',
            service: 'processaudit-api'
          }
        },
        organization_context: {
          id: 'org_pro_456',
          plan: 'professional'
        }
      };

      // When: Processing webhook with organization validation
      const webhookHandler = require('../../pages/api/monitoring/webhooks/alerts.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-organization-id': 'org_pro_456',
          'x-webhook-signature': 'valid_signature'
        },
        body: webhookPayload
      });

      await webhookHandler.default(req, res);

      // Then: Should validate and process webhook with proper isolation
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.processed).toBe(true);
      expect(responseData.organization_validated).toBe(true);
      expect(responseData.alert.organization_id).toBe('org_pro_456');
    });

    test('should reject monitoring requests with invalid organization tokens', async () => {
      // Given: Invalid organization access attempt
      mockGetAuth.mockReturnValue({
        userId: 'user_invalid',
        orgSlug: null
      });

      // Mock membership check failure
      mockClerkClient.organizations.getOrganizationMembership
        .mockRejectedValue(new Error('Organization membership not found'));

      // When: Attempting to access monitoring with invalid token
      const secureMetricsHandler = require('../../pages/api/monitoring/metrics/secure/[orgId].js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: { orgId: 'org_pro_456' },
        headers: {
          'x-organization-id': 'org_pro_456',
          'authorization': 'Bearer invalid_token'
        }
      });

      await secureMetricsHandler.default(req, res);

      // Then: Should reject with security error
      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());

      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('INVALID_ORGANIZATION_TOKEN');
      expect(responseData.security_violation_logged).toBe(true);
    });

    test('should audit cross-tenant access attempts', async () => {
      // Given: User attempting to access different organization data
      mockGetAuth.mockReturnValue({
        userId: 'user_free_123',
        orgSlug: 'startup-inc'
      });

      mockClerkClient.organizations.getOrganizationMembership
        .mockResolvedValue({
          organization: mockOrganizations.freeOrg,
          role: 'admin'
        });

      // When: Attempting unauthorized cross-tenant access
      const crossTenantHandler = require('../../pages/api/monitoring/audit/cross-tenant.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-organization-id': 'org_free_123',
          'x-requested-org-data': 'org_ent_789' // Attempting to access enterprise data
        },
        body: {
          requested_organization: 'org_ent_789',
          data_type: 'monitoring_metrics'
        }
      });

      await crossTenantHandler.default(req, res);

      // Then: Should log security audit and reject access
      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());

      expect(responseData.access_denied).toBe(true);
      expect(responseData.audit_logged).toBe(true);
      expect(responseData.violation_type).toBe('cross_tenant_access_attempt');
      expect(responseData.audit_details).toMatchObject({
        user_id: 'user_free_123',
        user_organization: 'org_free_123',
        requested_organization: 'org_ent_789',
        timestamp: expect.any(String)
      });
    });

    test('should enforce secure metric aggregation across tenant boundaries', async () => {
      // Given: Service-level aggregation request (admin only)
      mockGetAuth.mockReturnValue({
        userId: 'admin_service',
        orgSlug: null // Service account
      });

      // Mock service role validation
      const serviceRoleToken = 'service_role_token_123';

      // When: Requesting cross-tenant aggregated metrics (admin operation)
      const aggregationHandler = require('../../pages/api/monitoring/admin/aggregate-metrics.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'authorization': `Bearer ${serviceRoleToken}`,
          'x-admin-operation': 'true'
        },
        body: {
          aggregation_type: 'system_health',
          organizations: ['org_free_123', 'org_pro_456', 'org_ent_789'],
          metrics: ['api_response_time', 'error_rate'],
          anonymized: true
        }
      });

      await aggregationHandler.default(req, res);

      // Then: Should allow secure aggregation with proper authorization
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.aggregation_completed).toBe(true);
      expect(responseData.anonymized_data).toBe(true);
      expect(responseData.organizations_included).toBe(3);
      expect(responseData.individual_org_data_excluded).toBe(true);

      // Verify no individual organization data is exposed
      expect(responseData.aggregated_metrics).toMatchObject({
        avg_response_time: expect.any(Number),
        avg_error_rate: expect.any(Number),
        total_requests: expect.any(Number)
      });

      // Should not contain organization-specific details
      expect(responseData.organization_breakdown).toBeUndefined();
    });
  });
});