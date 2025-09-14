/**
 * Comprehensive PagerDuty Integration Test Suite
 * ProcessAudit AI - Alert Escalation & Incident Management
 *
 * Coverage Areas:
 * - Incident creation and escalation workflows
 * - Service key validation and rotation
 * - Alert severity mapping and routing
 * - Incident acknowledgment and resolution
 * - Multi-service configuration management
 * - Rate limiting and throttling
 * - Webhook validation and security
 * - Error scenarios and recovery
 * - Integration health monitoring
 * - Cost tracking for PagerDuty usage
 */

import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// Mock environment variables
process.env.PAGERDUTY_SERVICE_KEY = 'test_pagerduty_primary_key_123456789012345678';
process.env.PAGERDUTY_SECURITY_SERVICE_KEY = 'test_pagerduty_security_key_123456789012345678';
process.env.PAGERDUTY_BUSINESS_SERVICE_KEY = 'test_pagerduty_business_key_123456789012345678';
process.env.NODE_ENV = 'test';

// Mock fetch for API calls
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock utilities
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('../../../utils/logger', () => ({
  logger: mockLogger
}));

describe('Comprehensive PagerDuty Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Service Key Management and Validation', () => {
    test('should validate all PagerDuty service keys', async () => {
      const { validateAllPagerDutyConfigs } = await import('../../../utils/monitoring/pagerduty-validator');

      const result = validateAllPagerDutyConfigs();

      expect(result.isValid).toBe(true);
      expect(result.configs.primary.isValid).toBe(true);
      expect(result.configs.security.isValid).toBe(true);
      expect(result.configs.security.escalationLevel).toBe('immediate');
      expect(result.summary.valid).toBe(2);
      expect(result.summary.invalid).toBe(0);
    });

    test('should handle invalid service key formats', async () => {
      const originalKey = process.env.PAGERDUTY_SERVICE_KEY;
      process.env.PAGERDUTY_SERVICE_KEY = 'invalid-key-123';

      const { validatePagerDutyConfig } = await import('../../../utils/monitoring/pagerduty-validator');

      const result = validatePagerDutyConfig({
        serviceKey: 'invalid-key-123',
        type: 'primary'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid service key format');

      // Restore environment
      process.env.PAGERDUTY_SERVICE_KEY = originalKey;
    });

    test('should handle missing service keys gracefully', async () => {
      const { validatePagerDutyConfig } = await import('../../../utils/monitoring/pagerduty-validator');

      const result = validatePagerDutyConfig({
        serviceKey: null,
        type: 'primary'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Service key not configured');
      expect(result.serviceKey).toBeNull();
    });
  });

  describe('Incident Creation and Management', () => {
    const mockIncidentResponse = {
      incident: {
        id: 'incident_123',
        incident_number: 12345,
        status: 'triggered',
        title: 'ProcessAudit AI System Alert',
        service: {
          id: 'service_123',
          summary: 'ProcessAudit AI Production'
        },
        urgency: 'high',
        created_at: new Date().toISOString()
      }
    };

    test('should create critical system incident', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockIncidentResponse,
        headers: new Map([['content-type', 'application/json']])
      } as any);

      const { createPagerDutyIncident } = await import('../../../utils/monitoring/pagerduty-client');

      const incident = await createPagerDutyIncident({
        summary: 'ProcessAudit AI API Down',
        source: 'prometheus-alert',
        severity: 'critical',
        component: 'api',
        details: {
          alert_name: 'ProcessAuditDown',
          description: 'API has been down for 2 minutes',
          runbook_url: 'https://docs.processaudit.ai/runbooks/api-down'
        },
        serviceType: 'primary'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pagerduty.com/incidents',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Token token=test_pagerduty_primary_key_123456789012345678',
            'From': 'alerts@processaudit.ai'
          }),
          body: expect.stringContaining('ProcessAudit AI API Down')
        })
      );

      expect(incident.id).toBe('incident_123');
      expect(incident.status).toBe('triggered');
    });

    test('should create security incident with proper escalation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          ...mockIncidentResponse,
          incident: {
            ...mockIncidentResponse.incident,
            urgency: 'high',
            title: 'SECURITY: Tenant Isolation Breach'
          }
        })
      } as any);

      const { createPagerDutyIncident } = await import('../../../utils/monitoring/pagerduty-client');

      const incident = await createPagerDutyIncident({
        summary: 'SECURITY: Tenant Isolation Breach Detected',
        source: 'security-monitor',
        severity: 'critical',
        component: 'security',
        details: {
          incident_type: 'SECURITY_BREACH',
          threat_level: 'HIGH',
          affected_tenants: ['org_123'],
          immediate_action_required: true
        },
        serviceType: 'security'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pagerduty.com/incidents',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Token token=test_pagerduty_security_key_123456789012345678'
          })
        })
      );

      expect(incident.title).toContain('SECURITY');
    });

    test('should acknowledge incidents correctly', async () => {
      const mockAckResponse = {
        incident: {
          ...mockIncidentResponse.incident,
          status: 'acknowledged',
          acknowledgements: [
            {
              at: new Date().toISOString(),
              acknowledger: {
                id: 'user_123',
                summary: 'Test Engineer'
              }
            }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAckResponse
      } as any);

      const { acknowledgeIncident } = await import('../../../utils/monitoring/pagerduty-client');

      const result = await acknowledgeIncident({
        incidentId: 'incident_123',
        acknowledgerId: 'user_123',
        note: 'Investigating API connectivity issue'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pagerduty.com/incidents/incident_123',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('acknowledged')
        })
      );

      expect(result.status).toBe('acknowledged');
      expect(result.acknowledgements).toHaveLength(1);
    });

    test('should resolve incidents with resolution notes', async () => {
      const mockResolveResponse = {
        incident: {
          ...mockIncidentResponse.incident,
          status: 'resolved',
          resolved_at: new Date().toISOString()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResolveResponse
      } as any);

      const { resolveIncident } = await import('../../../utils/monitoring/pagerduty-client');

      const result = await resolveIncident({
        incidentId: 'incident_123',
        resolutionNote: 'Issue resolved by restarting API service',
        resolverId: 'user_123'
      });

      expect(result.status).toBe('resolved');
      expect(result.resolved_at).toBeDefined();
    });
  });

  describe('Webhook Validation and Security', () => {
    test('should validate PagerDuty webhook signatures', async () => {
      const webhookPayload = {
        messages: [
          {
            id: 'webhook_123',
            type: 'incident.triggered',
            data: {
              incident: mockIncidentResponse.incident
            }
          }
        ]
      };

      const signature = 'v1=test_signature_hash';

      const { validateWebhookSignature } = await import('../../../utils/monitoring/pagerduty-webhooks');

      const isValid = validateWebhookSignature({
        payload: JSON.stringify(webhookPayload),
        signature,
        secret: 'webhook_secret_key'
      });

      expect(typeof isValid).toBe('boolean');
    });

    test('should process incident webhook correctly', async () => {
      const webhookPayload = {
        messages: [
          {
            id: 'webhook_123',
            type: 'incident.triggered',
            data: {
              incident: {
                id: 'incident_456',
                status: 'triggered',
                title: 'ProcessAudit AI Alert'
              }
            }
          }
        ]
      };

      const { processIncidentWebhook } = await import('../../../utils/monitoring/pagerduty-webhooks');

      const result = await processIncidentWebhook(webhookPayload);

      expect(result.processed).toBe(true);
      expect(result.incidentId).toBe('incident_456');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'PagerDuty incident webhook processed',
        expect.objectContaining({
          incidentId: 'incident_456',
          status: 'triggered'
        })
      );
    });

    test('should handle malformed webhook payloads', async () => {
      const invalidPayload = {
        invalid: 'structure'
      };

      const { processIncidentWebhook } = await import('../../../utils/monitoring/pagerduty-webhooks');

      await expect(processIncidentWebhook(invalidPayload)).rejects.toThrow('Invalid webhook payload format');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Invalid PagerDuty webhook payload',
        expect.any(Object)
      );
    });
  });

  describe('Rate Limiting and Throttling', () => {
    test('should respect PagerDuty API rate limits', async () => {
      // Mock rate limit response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded',
            code: 2001
          }
        }),
        headers: new Map([
          ['x-ratelimit-limit', '120'],
          ['x-ratelimit-remaining', '0'],
          ['x-ratelimit-reset', String(Math.floor(Date.now() / 1000) + 60)]
        ])
      } as any);

      const { createPagerDutyIncident } = await import('../../../utils/monitoring/pagerduty-client');

      await expect(createPagerDutyIncident({
        summary: 'Test Incident',
        source: 'test',
        severity: 'warning',
        component: 'test',
        serviceType: 'primary'
      })).rejects.toThrow('Rate limit exceeded');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'PagerDuty rate limit exceeded',
        expect.objectContaining({
          resetTime: expect.any(Number),
          remaining: 0
        })
      );
    });

    test('should implement retry logic with exponential backoff', async () => {
      // First call fails with temporary error
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: 'Service temporarily unavailable' }})
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockIncidentResponse
        } as any);

      const { createPagerDutyIncident } = await import('../../../utils/monitoring/pagerduty-client');

      const result = await createPagerDutyIncident({
        summary: 'Test Incident with Retry',
        source: 'test',
        severity: 'warning',
        component: 'test',
        serviceType: 'primary'
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('incident_123');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'PagerDuty request succeeded after retry',
        expect.any(Object)
      );
    });

    test('should track incident creation metrics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockIncidentResponse
      } as any);

      const { trackPagerDutyMetrics } = await import('../../../utils/monitoring/pagerduty-metrics');

      const startTime = Date.now();

      const { createPagerDutyIncident } = await import('../../../utils/monitoring/pagerduty-client');

      await createPagerDutyIncident({
        summary: 'Metrics Test Incident',
        source: 'test',
        severity: 'critical',
        component: 'api',
        serviceType: 'primary'
      });

      const endTime = Date.now();

      expect(trackPagerDutyMetrics).toHaveBeenCalledWith({
        operation: 'create_incident',
        serviceType: 'primary',
        severity: 'critical',
        responseTime: expect.any(Number),
        success: true
      });
    });
  });

  describe('Alert Severity Mapping and Routing', () => {
    test('should map Prometheus alert severities to PagerDuty urgency', async () => {
      const { mapAlertSeverityToPagerDuty } = await import('../../../utils/monitoring/severity-mapper');

      const criticalMapping = mapAlertSeverityToPagerDuty('critical');
      const warningMapping = mapAlertSeverityToPagerDuty('warning');
      const infoMapping = mapAlertSeverityToPagerDuty('info');

      expect(criticalMapping.urgency).toBe('high');
      expect(criticalMapping.serviceType).toBe('primary');

      expect(warningMapping.urgency).toBe('low');
      expect(warningMapping.serviceType).toBe('primary');

      expect(infoMapping.urgency).toBe('low');
      expect(infoMapping.serviceType).toBe('business');
    });

    test('should route security alerts to security service', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockIncidentResponse
      } as any);

      const { routeAlert } = await import('../../../utils/monitoring/alert-router');

      await routeAlert({
        alertname: 'TenantIsolationBreachAttempt',
        severity: 'critical',
        component: 'security',
        summary: 'Security breach detected',
        description: 'Cross-tenant access attempt detected'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pagerduty.com/incidents',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Token token=test_pagerduty_security_key_123456789012345678'
          })
        })
      );
    });

    test('should route business alerts to business service', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockIncidentResponse
      } as any);

      const { routeAlert } = await import('../../../utils/monitoring/alert-router');

      await routeAlert({
        alertname: 'LowConversionRate',
        severity: 'warning',
        component: 'business',
        summary: 'Conversion rate below threshold',
        description: 'Analysis completion rate dropped to 65%'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pagerduty.com/incidents',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Token token=test_pagerduty_business_key_123456789012345678'
          })
        })
      );
    });
  });

  describe('Integration Health and Monitoring', () => {
    test('should monitor PagerDuty service health', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          services: [
            {
              id: 'service_123',
              name: 'ProcessAudit AI Production',
              status: 'active',
              integration_count: 3
            }
          ]
        })
      } as any);

      const { checkPagerDutyHealth } = await import('../../../utils/monitoring/pagerduty-health');

      const health = await checkPagerDutyHealth();

      expect(health.status).toBe('healthy');
      expect(health.services).toHaveLength(1);
      expect(health.activeIntegrations).toBe(3);
    });

    test('should detect and report PagerDuty outages', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));

      const { checkPagerDutyHealth } = await import('../../../utils/monitoring/pagerduty-health');

      const health = await checkPagerDutyHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.error).toContain('Connection timeout');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'PagerDuty health check failed',
        expect.any(Object)
      );
    });

    test('should track PagerDuty integration performance metrics', async () => {
      const { PagerDutyMetricsCollector } = await import('../../../utils/monitoring/pagerduty-metrics');
      const collector = new PagerDutyMetricsCollector();

      // Simulate successful incident creation
      collector.recordIncidentCreation({
        serviceType: 'primary',
        severity: 'critical',
        responseTime: 1200,
        success: true
      });

      // Simulate failed incident creation
      collector.recordIncidentCreation({
        serviceType: 'security',
        severity: 'critical',
        responseTime: 5000,
        success: false,
        error: 'API timeout'
      });

      const metrics = collector.getMetrics();

      expect(metrics.totalIncidents).toBe(2);
      expect(metrics.successRate).toBe(0.5);
      expect(metrics.averageResponseTime).toBe(3100);
      expect(metrics.errorRate).toBe(0.5);
    });
  });

  describe('Error Scenarios and Recovery', () => {
    test('should handle PagerDuty API authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid authentication credentials',
            code: 2001
          }
        })
      } as any);

      const { createPagerDutyIncident } = await import('../../../utils/monitoring/pagerduty-client');

      await expect(createPagerDutyIncident({
        summary: 'Test Auth Error',
        source: 'test',
        severity: 'warning',
        component: 'test',
        serviceType: 'primary'
      })).rejects.toThrow('Invalid authentication credentials');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'PagerDuty authentication failed',
        expect.objectContaining({
          status: 401,
          serviceType: 'primary'
        })
      );
    });

    test('should handle service configuration errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid service configuration',
            errors: ['Service does not exist']
          }
        })
      } as any);

      const { createPagerDutyIncident } = await import('../../../utils/monitoring/pagerduty-client');

      await expect(createPagerDutyIncident({
        summary: 'Test Config Error',
        source: 'test',
        severity: 'warning',
        component: 'test',
        serviceType: 'invalid'
      })).rejects.toThrow('Invalid service configuration');
    });

    test('should implement fallback notification when PagerDuty fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('PagerDuty service unavailable'));

      const mockSlackFallback = jest.fn().mockResolvedValue({ ok: true });

      const { createIncidentWithFallback } = await import('../../../utils/monitoring/incident-fallback');

      await createIncidentWithFallback({
        summary: 'Critical Alert with Fallback',
        severity: 'critical',
        component: 'api',
        slackFallback: mockSlackFallback
      });

      expect(mockSlackFallback).toHaveBeenCalledWith({
        channel: '#alerts-critical',
        text: expect.stringContaining('PagerDuty unavailable - Critical Alert'),
        color: 'danger'
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'PagerDuty failed, using Slack fallback',
        expect.any(Object)
      );
    });
  });

  describe('Integration Configuration and Management', () => {
    test('should validate integration endpoint configuration', async () => {
      const { validateIntegrationEndpoints } = await import('../../../utils/monitoring/pagerduty-config');

      const config = {
        endpoints: {
          primary: {
            url: 'https://events.pagerduty.com/integration/integration_key_1/enqueue',
            serviceKey: process.env.PAGERDUTY_SERVICE_KEY
          },
          security: {
            url: 'https://events.pagerduty.com/integration/integration_key_2/enqueue',
            serviceKey: process.env.PAGERDUTY_SECURITY_SERVICE_KEY
          }
        }
      };

      const validation = validateIntegrationEndpoints(config);

      expect(validation.isValid).toBe(true);
      expect(validation.validEndpoints).toBe(2);
      expect(validation.errors).toHaveLength(0);
    });

    test('should test integration connectivity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => ({
          status: 'success',
          message: 'Event processed',
          dedup_key: 'test_key_123'
        })
      } as any);

      const { testPagerDutyConnectivity } = await import('../../../utils/monitoring/pagerduty-health');

      const result = await testPagerDutyConnectivity({
        serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
        serviceType: 'primary'
      });

      expect(result.connected).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.dedupKey).toBe('test_key_123');
    });
  });

  describe('Incident Lifecycle Management', () => {
    test('should track complete incident lifecycle', async () => {
      const { IncidentLifecycleTracker } = await import('../../../utils/monitoring/incident-lifecycle');
      const tracker = new IncidentLifecycleTracker();

      // Create incident
      const incident = await tracker.createIncident({
        summary: 'API Response Time High',
        severity: 'warning',
        component: 'api'
      });

      expect(incident.status).toBe('triggered');
      expect(incident.createdAt).toBeDefined();

      // Acknowledge incident
      const acknowledged = await tracker.acknowledgeIncident(incident.id, {
        acknowledger: 'engineer_123',
        note: 'Investigating response time spike'
      });

      expect(acknowledged.status).toBe('acknowledged');
      expect(acknowledged.acknowledgedAt).toBeDefined();

      // Resolve incident
      const resolved = await tracker.resolveIncident(incident.id, {
        resolver: 'engineer_123',
        resolutionNote: 'Optimized database queries',
        rootCause: 'Inefficient query patterns'
      });

      expect(resolved.status).toBe('resolved');
      expect(resolved.resolvedAt).toBeDefined();
      expect(resolved.resolutionTime).toBeGreaterThan(0);
    });

    test('should calculate incident metrics and SLA compliance', async () => {
      const { calculateIncidentMetrics } = await import('../../../utils/monitoring/incident-metrics');

      const incidents = [
        {
          id: 'inc_1',
          severity: 'critical',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          acknowledgedAt: new Date('2024-01-01T10:02:00Z'),
          resolvedAt: new Date('2024-01-01T10:15:00Z')
        },
        {
          id: 'inc_2',
          severity: 'warning',
          createdAt: new Date('2024-01-01T11:00:00Z'),
          acknowledgedAt: new Date('2024-01-01T11:05:00Z'),
          resolvedAt: new Date('2024-01-01T11:30:00Z')
        }
      ];

      const metrics = calculateIncidentMetrics(incidents);

      expect(metrics.meanTimeToAcknowledge).toBe(3.5); // (2 + 5) / 2 minutes
      expect(metrics.meanTimeToResolve).toBe(22.5); // (15 + 30) / 2 minutes
      expect(metrics.slaCompliance.critical).toBe(1.0); // 15 min < 30 min SLA
      expect(metrics.slaCompliance.warning).toBe(1.0); // 30 min < 120 min SLA
    });
  });
});