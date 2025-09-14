/**
 * PagerDuty Integration Tests
 * ProcessAudit AI - Monitoring Infrastructure Testing
 *
 * Tests alert escalation workflows, critical incident handling,
 * service key validation, and incident acknowledgment flows.
 */

import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

// Mock environment variables
process.env.PAGERDUTY_SERVICE_KEY = 'test_pagerduty_key';
process.env.PAGERDUTY_SECURITY_SERVICE_KEY = 'test_security_key';
process.env.NODE_ENV = 'test';

// Mock PagerDuty API responses
const mockPagerDutyAPI = {
  createIncident: jest.fn(),
  acknowledgeIncident: jest.fn(),
  resolveIncident: jest.fn(),
  listIncidents: jest.fn(),
  escalateIncident: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('PagerDuty Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Alert Escalation Workflows', () => {
    test('should escalate critical system down alert to PagerDuty', async () => {
      // Given: System health check failure
      const criticalAlert = {
        alertname: 'ProcessAuditSystemDown',
        severity: 'critical',
        service: 'processaudit-api',
        component: 'health-check',
        summary: 'ProcessAudit AI system is not responding',
        description: 'Health check endpoint returning 503 for >2 minutes',
        runbook_url: 'https://docs.processaudit.ai/runbooks/system-down',
        startsAt: new Date().toISOString()
      };

      // Mock successful PagerDuty incident creation
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          incident: {
            id: 'PD_incident_123',
            incident_number: 456,
            status: 'triggered',
            urgency: 'high',
            escalation_policy: {
              id: 'escalation_policy_123'
            }
          }
        })
      });

      // When: Alert is sent to PagerDuty webhook
      const alertmanagerWebhook = require('../../monitoring/webhooks/alertmanager.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: {
          version: '4',
          groupKey: 'critical-system-down',
          status: 'firing',
          receiver: 'critical-alerts',
          alerts: [criticalAlert]
        }
      });

      await alertmanagerWebhook.handler(req, res);

      // Then: PagerDuty incident should be created
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.pagerduty.com/incidents'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Token token=${process.env.PAGERDUTY_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.pagerduty+json;version=2'
          }),
          body: expect.stringContaining('ProcessAuditSystemDown')
        })
      );

      expect(res._getStatusCode()).toBe(200);
    });

    test('should escalate API performance degradation after threshold', async () => {
      // Given: Performance degradation alert
      const performanceAlert = {
        alertname: 'ProcessAuditAPISlowResponse',
        severity: 'critical',
        service: 'processaudit-api',
        component: 'performance',
        summary: 'API response time >2s for 5+ minutes',
        description: 'Average response time: 3.2s, P95: 5.8s',
        runbook_url: 'https://docs.processaudit.ai/runbooks/performance',
        startsAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 minutes ago
        labels: {
          avg_response_time: '3200ms',
          p95_response_time: '5800ms',
          endpoint: '/api/process-analysis'
        }
      };

      // Mock PagerDuty incident creation with performance context
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          incident: {
            id: 'PD_perf_789',
            status: 'triggered',
            urgency: 'high'
          }
        })
      });

      // When: Performance alert exceeds threshold
      const alertHandler = require('../../pages/api/monitoring/alerts/performance.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          alert: performanceAlert,
          threshold_exceeded: true,
          duration_minutes: 6
        }
      });

      await alertHandler.default(req, res);

      // Then: Critical escalation should occur
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.pagerduty.com'),
        expect.objectContaining({
          body: expect.stringContaining('ProcessAuditAPISlowResponse')
        })
      );

      expect(res._getStatusCode()).toBe(201);
      const response = JSON.parse(res._getData());
      expect(response.escalated_to_pagerduty).toBe(true);
    });

    test('should handle error rate spike with immediate PagerDuty escalation', async () => {
      // Given: High error rate alert
      const errorRateAlert = {
        alertname: 'ProcessAuditHighErrorRate',
        severity: 'critical',
        service: 'processaudit-api',
        component: 'api-errors',
        summary: 'Error rate >5% for 3+ minutes',
        description: 'Current error rate: 8.5% (17/200 requests in last 5min)',
        runbook_url: 'https://docs.processaudit.ai/runbooks/high-error-rate',
        labels: {
          error_rate: '8.5%',
          error_count: '17',
          total_requests: '200',
          primary_error: 'database_timeout'
        }
      };

      // Mock PagerDuty incident with high urgency
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          incident: {
            id: 'PD_error_456',
            status: 'triggered',
            urgency: 'high',
            escalation_policy: { id: 'immediate_escalation' }
          }
        })
      });

      // When: Error rate spike occurs
      const errorHandler = require('../../pages/api/monitoring/alerts/errors.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          alert: errorRateAlert,
          immediate_escalation: true
        }
      });

      await errorHandler.default(req, res);

      // Then: Immediate PagerDuty escalation
      const pagerdutyCall = fetch.mock.calls.find(call =>
        call[0].includes('api.pagerduty.com')
      );
      expect(pagerdutyCall).toBeDefined();

      const requestBody = JSON.parse(pagerdutyCall[1].body);
      expect(requestBody.incident.urgency).toBe('high');
      expect(requestBody.incident.escalation_policy).toBeDefined();
    });
  });

  describe('Service Key Validation', () => {
    test('should validate primary service key configuration', () => {
      // Given: Service key validation function
      const { validatePagerDutyConfig } = require('../../utils/monitoring/pagerduty-validator.js');

      // When: Validating primary service key
      const result = validatePagerDutyConfig({
        serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
        type: 'primary'
      });

      // Then: Configuration should be valid
      expect(result.isValid).toBe(true);
      expect(result.serviceKey).toBe('test_pagerduty_key');
      expect(result.type).toBe('primary');
    });

    test('should validate security service key configuration', () => {
      // Given: Security service key
      const { validatePagerDutyConfig } = require('../../utils/monitoring/pagerduty-validator.js');

      // When: Validating security service key
      const result = validatePagerDutyConfig({
        serviceKey: process.env.PAGERDUTY_SECURITY_SERVICE_KEY,
        type: 'security'
      });

      // Then: Security configuration should be valid
      expect(result.isValid).toBe(true);
      expect(result.serviceKey).toBe('test_security_key');
      expect(result.type).toBe('security');
      expect(result.escalationLevel).toBe('immediate');
    });

    test('should detect invalid service key format', () => {
      // Given: Invalid service key
      const { validatePagerDutyConfig } = require('../../utils/monitoring/pagerduty-validator.js');

      // When: Validating invalid key
      const result = validatePagerDutyConfig({
        serviceKey: 'invalid_key_format',
        type: 'primary'
      });

      // Then: Validation should fail
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid service key format');
    });

    test('should detect missing service key configuration', () => {
      // Given: Missing service key environment
      const originalKey = process.env.PAGERDUTY_SERVICE_KEY;
      delete process.env.PAGERDUTY_SERVICE_KEY;

      const { validatePagerDutyConfig } = require('../../utils/monitoring/pagerduty-validator.js');

      // When: Validating missing key
      const result = validatePagerDutyConfig({
        serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
        type: 'primary'
      });

      // Then: Configuration should be invalid
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Service key not configured');

      // Cleanup
      process.env.PAGERDUTY_SERVICE_KEY = originalKey;
    });
  });

  describe('Incident Acknowledgment and Resolution', () => {
    test('should acknowledge incident when engineer responds', async () => {
      // Given: Triggered PagerDuty incident
      const incidentId = 'PD_incident_123';

      // Mock successful acknowledgment
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          incident: {
            id: incidentId,
            status: 'acknowledged',
            acknowledgements: [{
              acknowledger: {
                id: 'engineer_456',
                summary: 'On-call Engineer'
              },
              at: new Date().toISOString()
            }]
          }
        })
      });

      // When: Engineer acknowledges via webhook
      const ackHandler = require('../../pages/api/monitoring/pagerduty/acknowledge.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-pagerduty-signature': 'valid_signature'
        },
        body: {
          messages: [{
            type: 'incident.acknowledge',
            data: {
              incident: {
                id: incidentId,
                status: 'acknowledged'
              }
            }
          }]
        }
      });

      await ackHandler.default(req, res);

      // Then: Acknowledgment should be processed
      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.acknowledged).toBe(true);
      expect(response.incident_id).toBe(incidentId);
    });

    test('should resolve incident when issue is fixed', async () => {
      // Given: Acknowledged incident that needs resolution
      const incidentId = 'PD_incident_456';

      // Mock successful resolution
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          incident: {
            id: incidentId,
            status: 'resolved',
            resolved_at: new Date().toISOString()
          }
        })
      });

      // When: System health check passes, triggering auto-resolution
      const resolutionHandler = require('../../pages/api/monitoring/pagerduty/resolve.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          incident_id: incidentId,
          resolution_reason: 'system_health_restored',
          health_check_status: 'healthy',
          resolved_by: 'automated_system'
        }
      });

      await resolutionHandler.default(req, res);

      // Then: Incident should be resolved
      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.resolved).toBe(true);
      expect(response.incident_id).toBe(incidentId);
      expect(response.resolution_method).toBe('automatic');
    });

    test('should handle escalation to next level after timeout', async () => {
      // Given: Unacknowledged incident past escalation timeout
      const incidentId = 'PD_incident_789';
      const createdAt = new Date(Date.now() - 16 * 60 * 1000); // 16 minutes ago

      // Mock escalation API call
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          incident: {
            id: incidentId,
            status: 'triggered',
            escalation_level: 2,
            escalated_at: new Date().toISOString()
          }
        })
      });

      // When: Escalation timeout is reached
      const escalationHandler = require('../../pages/api/monitoring/pagerduty/escalate.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          incident_id: incidentId,
          created_at: createdAt.toISOString(),
          current_level: 1,
          escalation_reason: 'no_acknowledgment_timeout',
          timeout_minutes: 15
        }
      });

      await escalationHandler.default(req, res);

      // Then: Incident should escalate
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`incidents/${incidentId}/escalate`),
        expect.objectContaining({
          method: 'PUT'
        })
      );

      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.escalated).toBe(true);
      expect(response.new_escalation_level).toBe(2);
    });
  });

  describe('Critical Incident Handling', () => {
    test('should handle security incident with immediate escalation', async () => {
      // Given: Security incident alert
      const securityIncident = {
        alertname: 'ProcessAuditSecurityBreach',
        severity: 'critical',
        component: 'security',
        summary: 'Potential security breach detected',
        description: 'Multiple failed authentication attempts from suspicious IP',
        labels: {
          attack_type: 'brute_force',
          source_ip: '192.168.1.100',
          failed_attempts: '50'
        }
      };

      // Mock security service incident creation
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          incident: {
            id: 'PD_security_123',
            status: 'triggered',
            urgency: 'high',
            escalation_policy: { id: 'security_immediate' }
          }
        })
      });

      // When: Security alert is processed
      const securityHandler = require('../../pages/api/monitoring/alerts/security.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          alert: securityIncident,
          priority: 'P0',
          requires_immediate_response: true
        }
      });

      await securityHandler.default(req, res);

      // Then: Security incident created with proper escalation
      const securityCall = fetch.mock.calls.find(call =>
        call[1].headers['Authorization'].includes(process.env.PAGERDUTY_SECURITY_SERVICE_KEY)
      );

      expect(securityCall).toBeDefined();

      const requestBody = JSON.parse(securityCall[1].body);
      expect(requestBody.incident.title).toContain('SECURITY');
      expect(requestBody.incident.urgency).toBe('high');
      expect(requestBody.incident.escalation_policy).toBeDefined();
    });

    test('should handle database connection failure incident', async () => {
      // Given: Database connectivity failure
      const dbIncident = {
        alertname: 'ProcessAuditDatabaseDown',
        severity: 'critical',
        service: 'processaudit-api',
        component: 'database',
        summary: 'Database connection pool exhausted',
        description: 'Supabase connection failing, 0/10 connections available',
        labels: {
          connection_pool_size: '10',
          active_connections: '0',
          queue_length: '25'
        }
      };

      // Mock database incident creation
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          incident: {
            id: 'PD_db_456',
            status: 'triggered',
            urgency: 'high'
          }
        })
      });

      // When: Database alert is escalated
      const dbHandler = require('../../pages/api/monitoring/alerts/database.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          alert: dbIncident,
          impact: 'service_unavailable',
          affected_endpoints: ['/api/process-analysis', '/api/audit-reports']
        }
      });

      await dbHandler.default(req, res);

      // Then: High priority incident should be created
      expect(res._getStatusCode()).toBe(201);
      const response = JSON.parse(res._getData());
      expect(response.pagerduty_incident_created).toBe(true);
      expect(response.urgency).toBe('high');
      expect(response.affected_services).toContain('processaudit-api');
    });

    test('should handle AI service degradation with contextual escalation', async () => {
      // Given: AI service performance degradation
      const aiIncident = {
        alertname: 'ProcessAuditAIServiceDegraded',
        severity: 'warning', // Initially warning, may escalate
        service: 'processaudit-ai',
        component: 'ai-processing',
        summary: 'Claude API response time >10s',
        description: 'AI processing requests experiencing high latency',
        labels: {
          provider: 'anthropic',
          avg_response_time: '12000ms',
          success_rate: '85%',
          queue_depth: '15'
        }
      };

      // Mock conditional escalation based on duration
      fetch
        .mockResolvedValueOnce({ // First call - check existing incidents
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            incidents: [] // No existing incidents
          })
        })
        .mockResolvedValueOnce({ // Second call - create incident
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            incident: {
              id: 'PD_ai_789',
              status: 'triggered',
              urgency: 'low' // Starts as low, may escalate
            }
          })
        });

      // When: AI degradation persists beyond threshold
      const aiHandler = require('../../pages/api/monitoring/alerts/ai-services.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          alert: aiIncident,
          duration_minutes: 8, // Beyond 5-minute threshold
          escalate_to_critical: true
        }
      });

      await aiHandler.default(req, res);

      // Then: Incident should be created and potentially escalated
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(res._getStatusCode()).toBe(201);

      const response = JSON.parse(res._getData());
      expect(response.incident_created).toBe(true);
      expect(response.may_require_escalation).toBe(true);
    });
  });

  describe('Integration Error Handling', () => {
    test('should handle PagerDuty API failure gracefully', async () => {
      // Given: PagerDuty API is unreachable
      fetch.mockRejectedValueOnce(new Error('Network timeout'));

      const alert = {
        alertname: 'TestAlert',
        severity: 'critical',
        summary: 'Test alert for PagerDuty failure'
      };

      // When: Attempting to create incident
      const alertHandler = require('../../pages/api/monitoring/alerts/critical.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: { alert }
      });

      await alertHandler.default(req, res);

      // Then: Should gracefully handle failure and attempt fallback
      expect(res._getStatusCode()).toBe(503);
      const response = JSON.parse(res._getData());
      expect(response.pagerduty_failed).toBe(true);
      expect(response.fallback_attempted).toBe(true);
      expect(response.error_logged).toBe(true);
    });

    test('should retry failed PagerDuty requests with backoff', async () => {
      // Given: PagerDuty API returns 429 (rate limited)
      fetch
        .mockResolvedValueOnce({ // First attempt
          ok: false,
          status: 429,
          json: () => Promise.resolve({
            error: 'Rate limit exceeded',
            retry_after: 30
          })
        })
        .mockResolvedValueOnce({ // Retry attempt
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            incident: { id: 'PD_retry_123' }
          })
        });

      const alert = {
        alertname: 'ProcessAuditCritical',
        severity: 'critical'
      };

      // When: Processing alert with retry logic
      const retryHandler = require('../../pages/api/monitoring/alerts/with-retry.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: { alert, retry_config: { max_attempts: 3, backoff_ms: 100 } }
      });

      await retryHandler.default(req, res);

      // Then: Should retry and succeed
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(res._getStatusCode()).toBe(201);

      const response = JSON.parse(res._getData());
      expect(response.retry_attempted).toBe(true);
      expect(response.success_on_retry).toBe(true);
      expect(response.incident_id).toBe('PD_retry_123');
    });

    test('should validate webhook signatures for security', async () => {
      // Given: PagerDuty webhook with invalid signature
      const invalidWebhook = {
        messages: [{
          type: 'incident.acknowledge',
          data: { incident: { id: 'PD_test_123' } }
        }]
      };

      // When: Processing webhook with invalid signature
      const webhookHandler = require('../../pages/api/monitoring/pagerduty/webhook.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-pagerduty-signature': 'invalid_signature'
        },
        body: invalidWebhook
      });

      await webhookHandler.default(req, res);

      // Then: Should reject with security error
      expect(res._getStatusCode()).toBe(401);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Invalid webhook signature');
      expect(response.security_violation_logged).toBe(true);
    });
  });
});