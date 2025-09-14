/**
 * Slack Integration Tests
 * ProcessAudit AI - Monitoring Infrastructure Testing
 *
 * Tests webhook delivery validation, message formatting verification,
 * channel routing accuracy, and rich attachment rendering.
 */

import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

// Mock environment variables
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test/webhook';
process.env.SLACK_ALERTS_CRITICAL = 'https://hooks.slack.com/alerts/critical';
process.env.SLACK_ALERTS_WARNINGS = 'https://hooks.slack.com/alerts/warnings';
process.env.SLACK_BUSINESS_METRICS = 'https://hooks.slack.com/business/metrics';
process.env.SLACK_SECURITY_INCIDENTS = 'https://hooks.slack.com/security/incidents';
process.env.NODE_ENV = 'test';

// Mock Slack API responses
const mockSlackAPI = {
  postMessage: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  addReaction: jest.fn()
};

// Mock fetch for webhook calls
global.fetch = jest.fn();

describe('Slack Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Webhook Delivery Validation', () => {
    test('should successfully deliver critical alert to Slack webhook', async () => {
      // Given: Critical system alert
      const criticalAlert = {
        alertname: 'ProcessAuditSystemDown',
        severity: 'critical',
        service: 'processaudit-api',
        component: 'health-check',
        summary: 'ProcessAudit AI system is not responding',
        description: 'Health check endpoint returning 503 for >2 minutes',
        status: 'firing',
        startsAt: new Date().toISOString(),
        annotations: {
          runbook_url: 'https://docs.processaudit.ai/runbooks/system-down'
        }
      };

      // Mock successful Slack webhook delivery
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      // When: Sending alert to Slack
      const slackHandler = require('../../utils/monitoring/slack-notifications.js');
      const result = await slackHandler.sendCriticalAlert(criticalAlert);

      // Then: Webhook should be called with correct payload
      expect(fetch).toHaveBeenCalledWith(
        process.env.SLACK_ALERTS_CRITICAL,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('ProcessAuditSystemDown')
        })
      );

      expect(result.delivered).toBe(true);
      expect(result.channel).toBe('#alerts-critical');
    });

    test('should handle webhook delivery failure with retry logic', async () => {
      // Given: Warning alert
      const warningAlert = {
        alertname: 'ProcessAuditHighLatency',
        severity: 'warning',
        service: 'processaudit-api',
        summary: 'API response time elevated',
        description: 'Average response time >1s for 5 minutes'
      };

      // Mock failed delivery followed by successful retry
      fetch
        .mockResolvedValueOnce({ // First attempt fails
          ok: false,
          status: 429,
          text: () => Promise.resolve('rate_limited')
        })
        .mockResolvedValueOnce({ // Retry succeeds
          ok: true,
          status: 200,
          text: () => Promise.resolve('ok')
        });

      // When: Sending alert with retry enabled
      const slackHandler = require('../../utils/monitoring/slack-notifications.js');
      const result = await slackHandler.sendWarningAlert(warningAlert, { enableRetry: true });

      // Then: Should retry and succeed
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.delivered).toBe(true);
      expect(result.retryAttempted).toBe(true);
      expect(result.deliveryAttempts).toBe(2);
    });

    test('should validate webhook URL configuration', () => {
      // Given: Webhook URL validator
      const { validateSlackConfig } = require('../../utils/monitoring/slack-validator.js');

      // When: Validating webhook URLs
      const result = validateSlackConfig({
        criticalWebhook: process.env.SLACK_ALERTS_CRITICAL,
        warningWebhook: process.env.SLACK_ALERTS_WARNINGS,
        businessWebhook: process.env.SLACK_BUSINESS_METRICS,
        securityWebhook: process.env.SLACK_SECURITY_INCIDENTS
      });

      // Then: All webhooks should be valid
      expect(result.isValid).toBe(true);
      expect(result.configuredChannels).toHaveLength(4);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid webhook URL formats', () => {
      // Given: Invalid webhook URL
      const { validateSlackConfig } = require('../../utils/monitoring/slack-validator.js');

      // When: Validating invalid URL
      const result = validateSlackConfig({
        criticalWebhook: 'invalid-url-format',
        warningWebhook: process.env.SLACK_ALERTS_WARNINGS
      });

      // Then: Validation should fail
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid webhook URL format: critical');
      expect(result.validChannels).toHaveLength(1); // Only warning is valid
    });
  });

  describe('Message Formatting Verification', () => {
    test('should format critical alert message with proper structure', () => {
      // Given: Critical alert data
      const alert = {
        alertname: 'ProcessAuditDatabaseDown',
        severity: 'critical',
        service: 'processaudit-api',
        component: 'database',
        summary: 'Database connection failed',
        description: 'Supabase connection pool exhausted, 0/10 connections available',
        annotations: {
          runbook_url: 'https://docs.processaudit.ai/runbooks/database-down'
        },
        labels: {
          environment: 'production',
          region: 'us-east-1'
        }
      };

      // When: Formatting critical alert message
      const { formatCriticalAlert } = require('../../utils/monitoring/slack-formatters.js');
      const message = formatCriticalAlert(alert);

      // Then: Message should have proper critical alert structure
      expect(message).toMatchObject({
        channel: '#alerts-critical',
        username: 'ProcessAudit AI Alerts',
        icon_emoji: ':rotating_light:',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            color: 'danger',
            title: expect.stringContaining('🚨 CRITICAL: ProcessAuditDatabaseDown'),
            text: expect.stringContaining('Database connection failed'),
            fields: expect.arrayContaining([
              { title: 'Service', value: 'processaudit-api', short: true },
              { title: 'Component', value: 'database', short: true },
              { title: 'Environment', value: 'production', short: true }
            ])
          })
        ])
      });

      expect(message.attachments[0].actions).toContainEqual({
        type: 'button',
        text: 'View Runbook',
        url: 'https://docs.processaudit.ai/runbooks/database-down',
        style: 'danger'
      });
    });

    test('should format warning alert with appropriate styling', () => {
      // Given: Warning level alert
      const alert = {
        alertname: 'ProcessAuditHighMemoryUsage',
        severity: 'warning',
        service: 'processaudit-api',
        summary: 'Memory usage above threshold',
        description: 'Container memory usage: 85% (850MB/1GB)',
        labels: {
          container: 'api-server',
          memory_threshold: '80%',
          current_usage: '85%'
        }
      };

      // When: Formatting warning message
      const { formatWarningAlert } = require('../../utils/monitoring/slack-formatters.js');
      const message = formatWarningAlert(alert);

      // Then: Warning message should have appropriate styling
      expect(message).toMatchObject({
        channel: '#alerts-warnings',
        username: 'ProcessAudit AI Alerts',
        icon_emoji: ':warning:',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            color: 'warning',
            title: expect.stringContaining('⚠️ WARNING: ProcessAuditHighMemoryUsage'),
            fields: expect.arrayContaining([
              { title: 'Current Usage', value: '85%', short: true },
              { title: 'Threshold', value: '80%', short: true }
            ])
          })
        ])
      });
    });

    test('should format business metric alert with charts and context', () => {
      // Given: Business metrics alert
      const businessAlert = {
        alertname: 'ProcessAuditLowUserEngagement',
        severity: 'info',
        component: 'business',
        summary: 'Daily active users below target',
        description: 'DAU: 450 (target: 500), 10% below threshold',
        labels: {
          metric_type: 'user_engagement',
          current_dau: '450',
          target_dau: '500',
          variance: '-10%'
        },
        annotations: {
          dashboard_url: 'https://dashboards.processaudit.ai/business/engagement',
          action_plan: 'Review user onboarding flow and recent feature releases'
        }
      };

      // When: Formatting business alert
      const { formatBusinessAlert } = require('../../utils/monitoring/slack-formatters.js');
      const message = formatBusinessAlert(businessAlert);

      // Then: Business alert should include metrics and actions
      expect(message).toMatchObject({
        channel: '#business-metrics',
        username: 'ProcessAudit AI Business Alerts',
        icon_emoji: ':chart_with_upwards_trend:',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            color: 'good',
            title: expect.stringContaining('📊 BUSINESS: ProcessAuditLowUserEngagement'),
            text: expect.stringContaining('Daily active users below target'),
            fields: expect.arrayContaining([
              { title: 'Current DAU', value: '450', short: true },
              { title: 'Target DAU', value: '500', short: true },
              { title: 'Variance', value: '-10%', short: true }
            ])
          })
        ])
      });

      expect(message.attachments[0].actions).toContainEqual({
        type: 'button',
        text: 'View Dashboard',
        url: 'https://dashboards.processaudit.ai/business/engagement',
        style: 'primary'
      });
    });

    test('should format security alert with enhanced urgency indicators', () => {
      // Given: Security incident
      const securityAlert = {
        alertname: 'ProcessAuditSuspiciousActivity',
        severity: 'critical',
        component: 'security',
        summary: 'Multiple failed login attempts detected',
        description: 'IP 192.168.1.100 attempted 50 failed logins in 5 minutes',
        labels: {
          attack_type: 'brute_force',
          source_ip: '192.168.1.100',
          failed_attempts: '50',
          time_window: '5_minutes',
          affected_accounts: '3'
        },
        annotations: {
          incident_response_url: 'https://security.processaudit.ai/incidents/IR-2024-001',
          immediate_actions: 'Block IP, reset affected passwords, review access logs'
        }
      };

      // When: Formatting security alert
      const { formatSecurityAlert } = require('../../utils/monitoring/slack-formatters.js');
      const message = formatSecurityAlert(securityAlert);

      // Then: Security alert should have maximum urgency formatting
      expect(message).toMatchObject({
        channel: '#security-incidents',
        username: 'ProcessAudit AI Security',
        icon_emoji: ':lock:',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            color: 'danger',
            title: expect.stringContaining('🔒 SECURITY INCIDENT: ProcessAuditSuspiciousActivity'),
            text: expect.stringContaining('IMMEDIATE ACTION REQUIRED'),
            fields: expect.arrayContaining([
              { title: 'Attack Type', value: 'brute_force', short: true },
              { title: 'Source IP', value: '192.168.1.100', short: true },
              { title: 'Failed Attempts', value: '50', short: true },
              { title: 'Affected Accounts', value: '3', short: true }
            ])
          })
        ])
      });

      expect(message.attachments[0].actions).toContainEqual({
        type: 'button',
        text: 'Incident Response',
        url: 'https://security.processaudit.ai/incidents/IR-2024-001',
        style: 'danger'
      });
    });
  });

  describe('Channel Routing Accuracy', () => {
    test('should route alerts to correct channels based on severity', async () => {
      // Given: Multiple alert types
      const alerts = [
        { severity: 'critical', component: 'system', alertname: 'SystemDown' },
        { severity: 'warning', component: 'performance', alertname: 'HighLatency' },
        { severity: 'info', component: 'business', alertname: 'LowEngagement' },
        { severity: 'critical', component: 'security', alertname: 'SecurityBreach' }
      ];

      // Mock successful webhook deliveries
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      // When: Routing alerts through channel router
      const { routeAlertToChannel } = require('../../utils/monitoring/slack-router.js');
      const results = await Promise.all(
        alerts.map(alert => routeAlertToChannel(alert))
      );

      // Then: Each alert should route to correct channel
      expect(fetch).toHaveBeenCalledTimes(4);

      const calls = fetch.mock.calls;

      // Critical system alert -> #alerts-critical
      expect(calls[0][0]).toBe(process.env.SLACK_ALERTS_CRITICAL);

      // Warning performance alert -> #alerts-warnings
      expect(calls[1][0]).toBe(process.env.SLACK_ALERTS_WARNINGS);

      // Business info alert -> #business-metrics
      expect(calls[2][0]).toBe(process.env.SLACK_BUSINESS_METRICS);

      // Security critical alert -> #security-incidents
      expect(calls[3][0]).toBe(process.env.SLACK_SECURITY_INCIDENTS);

      results.forEach((result, index) => {
        expect(result.routed).toBe(true);
        expect(result.channel).toBeDefined();
      });
    });

    test('should handle unknown alert types with default routing', async () => {
      // Given: Alert with unknown component
      const unknownAlert = {
        alertname: 'UnknownAlert',
        severity: 'warning',
        component: 'unknown_component',
        summary: 'Unknown alert type'
      };

      // Mock webhook delivery
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      // When: Routing unknown alert type
      const { routeAlertToChannel } = require('../../utils/monitoring/slack-router.js');
      const result = await routeAlertToChannel(unknownAlert);

      // Then: Should route to default warning channel
      expect(fetch).toHaveBeenCalledWith(
        process.env.SLACK_ALERTS_WARNINGS,
        expect.any(Object)
      );
      expect(result.routed).toBe(true);
      expect(result.channel).toBe('#alerts-warnings');
      expect(result.routingReason).toBe('default_warning_fallback');
    });

    test('should prevent duplicate alerts using deduplication', async () => {
      // Given: Duplicate alerts within timeframe
      const duplicateAlert = {
        alertname: 'ProcessAuditHighCPU',
        severity: 'warning',
        service: 'processaudit-api',
        fingerprint: 'alert_fingerprint_123'
      };

      // Mock successful first delivery
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      // When: Sending same alert twice within dedup window
      const { routeAlertWithDeduplication } = require('../../utils/monitoring/slack-router.js');

      const firstResult = await routeAlertWithDeduplication(duplicateAlert);
      const secondResult = await routeAlertWithDeduplication(duplicateAlert);

      // Then: First alert delivered, second deduplicated
      expect(fetch).toHaveBeenCalledTimes(1); // Only one webhook call
      expect(firstResult.delivered).toBe(true);
      expect(secondResult.delivered).toBe(false);
      expect(secondResult.deduplicated).toBe(true);
      expect(secondResult.originalAlertTime).toBeDefined();
    });

    test('should handle channel-specific webhook failures with fallbacks', async () => {
      // Given: Primary channel webhook failure
      const alert = {
        alertname: 'TestAlert',
        severity: 'critical',
        component: 'system'
      };

      // Mock primary webhook failure, fallback success
      fetch
        .mockResolvedValueOnce({ // Primary channel fails
          ok: false,
          status: 404,
          text: () => Promise.resolve('webhook_not_found')
        })
        .mockResolvedValueOnce({ // Fallback succeeds
          ok: true,
          status: 200,
          text: () => Promise.resolve('ok')
        });

      // When: Routing with fallback enabled
      const { routeAlertWithFallback } = require('../../utils/monitoring/slack-router.js');
      const result = await routeAlertWithFallback(alert);

      // Then: Should attempt primary then fallback
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.delivered).toBe(true);
      expect(result.usedFallback).toBe(true);
      expect(result.primaryFailed).toBe(true);
      expect(result.fallbackChannel).toBe('#alerts-general'); // Default fallback
    });
  });

  describe('Rich Attachment Rendering', () => {
    test('should render performance metrics with visual indicators', () => {
      // Given: Performance alert with metrics
      const performanceAlert = {
        alertname: 'ProcessAuditSlowAPI',
        severity: 'warning',
        service: 'processaudit-api',
        summary: 'API response time degraded',
        labels: {
          avg_response_time: '2.5s',
          p95_response_time: '4.2s',
          p99_response_time: '8.1s',
          requests_per_minute: '45',
          error_rate: '2.3%'
        },
        annotations: {
          graph_url: 'https://grafana.processaudit.ai/d/api-performance'
        }
      };

      // When: Rendering rich attachment
      const { renderPerformanceAttachment } = require('../../utils/monitoring/slack-attachments.js');
      const attachment = renderPerformanceAttachment(performanceAlert);

      // Then: Should include visual performance indicators
      expect(attachment).toMatchObject({
        color: 'warning',
        title: expect.stringContaining('API Performance Alert'),
        fields: [
          { title: 'Avg Response', value: '2.5s ⚠️', short: true },
          { title: 'P95 Response', value: '4.2s ⚠️', short: true },
          { title: 'P99 Response', value: '8.1s 🔴', short: true },
          { title: 'Error Rate', value: '2.3% 📈', short: true },
          { title: 'Throughput', value: '45 req/min', short: true }
        ],
        image_url: expect.stringContaining('grafana.processaudit.ai'),
        footer: 'ProcessAudit AI Monitoring',
        ts: expect.any(Number)
      });
    });

    test('should render system health status with progress bars', () => {
      // Given: System health alert
      const healthAlert = {
        alertname: 'ProcessAuditResourceUsage',
        severity: 'info',
        summary: 'System resource status update',
        labels: {
          cpu_usage: '65%',
          memory_usage: '78%',
          disk_usage: '45%',
          active_connections: '23',
          queue_depth: '7'
        }
      };

      // When: Rendering health attachment
      const { renderHealthAttachment } = require('../../utils/monitoring/slack-attachments.js');
      const attachment = renderHealthAttachment(healthAlert);

      // Then: Should include visual progress indicators
      expect(attachment).toMatchObject({
        color: 'good',
        title: 'System Health Status',
        fields: [
          { title: 'CPU Usage', value: '65% ████████▓▓ 65%', short: true },
          { title: 'Memory Usage', value: '78% ████████▓▓ 78%', short: true },
          { title: 'Disk Usage', value: '45% █████▓▓▓▓▓ 45%', short: true },
          { title: 'Active Connections', value: '23 🔗', short: true },
          { title: 'Queue Depth', value: '7 📋', short: true }
        ]
      });
    });

    test('should render error details with stack traces and context', () => {
      // Given: Error alert with detailed context
      const errorAlert = {
        alertname: 'ProcessAuditApplicationError',
        severity: 'critical',
        summary: 'Application error in process analysis',
        description: 'TypeError: Cannot read property of undefined',
        labels: {
          error_type: 'TypeError',
          endpoint: '/api/process-analysis',
          user_id: 'user_123',
          organization_id: 'org_456',
          correlation_id: 'corr_789'
        },
        annotations: {
          stack_trace: 'at processAnalysis (line 45)\n  at handler (line 12)',
          request_context: '{"method": "POST", "body_size": "2.3KB"}',
          sentry_url: 'https://sentry.io/processaudit/issue/123'
        }
      };

      // When: Rendering error attachment
      const { renderErrorAttachment } = require('../../utils/monitoring/slack-attachments.js');
      const attachment = renderErrorAttachment(errorAlert);

      // Then: Should include detailed error context
      expect(attachment).toMatchObject({
        color: 'danger',
        title: '💥 Application Error',
        text: 'TypeError: Cannot read property of undefined',
        fields: [
          { title: 'Error Type', value: 'TypeError', short: true },
          { title: 'Endpoint', value: '/api/process-analysis', short: true },
          { title: 'User ID', value: 'user_123', short: true },
          { title: 'Organization', value: 'org_456', short: true },
          { title: 'Correlation ID', value: 'corr_789', short: false }
        ],
        actions: [
          {
            type: 'button',
            text: 'View in Sentry',
            url: 'https://sentry.io/processaudit/issue/123',
            style: 'primary'
          }
        ]
      });

      // Should include stack trace in attachment
      expect(attachment.fields).toContainEqual({
        title: 'Stack Trace',
        value: '```\nat processAnalysis (line 45)\n  at handler (line 12)\n```',
        short: false
      });
    });

    test('should render multi-tenant context with organization details', () => {
      // Given: Multi-tenant alert
      const tenantAlert = {
        alertname: 'ProcessAuditTenantQuotaExceeded',
        severity: 'warning',
        component: 'business',
        summary: 'Organization quota exceeded',
        labels: {
          organization_id: 'org_acme_123',
          organization_name: 'ACME Corp',
          plan_type: 'professional',
          quota_type: 'api_requests',
          current_usage: '9500',
          quota_limit: '10000',
          usage_percentage: '95%'
        },
        annotations: {
          admin_email: 'admin@acme.com',
          billing_url: 'https://processaudit.ai/billing/org_acme_123',
          usage_dashboard: 'https://dashboard.processaudit.ai/org_acme_123/usage'
        }
      };

      // When: Rendering tenant attachment
      const { renderTenantAttachment } = require('../../utils/monitoring/slack-attachments.js');
      const attachment = renderTenantAttachment(tenantAlert);

      // Then: Should include tenant-specific context
      expect(attachment).toMatchObject({
        color: 'warning',
        title: '🏢 Tenant Alert: ACME Corp',
        fields: [
          { title: 'Organization', value: 'ACME Corp (org_acme_123)', short: false },
          { title: 'Plan Type', value: 'Professional 💼', short: true },
          { title: 'Quota Type', value: 'API Requests', short: true },
          { title: 'Usage', value: '9,500 / 10,000 (95%) ⚠️', short: true },
          { title: 'Admin Contact', value: 'admin@acme.com', short: true }
        ],
        actions: [
          {
            type: 'button',
            text: 'View Usage',
            url: 'https://dashboard.processaudit.ai/org_acme_123/usage',
            style: 'primary'
          },
          {
            type: 'button',
            text: 'Billing',
            url: 'https://processaudit.ai/billing/org_acme_123',
            style: 'default'
          }
        ]
      });
    });
  });

  describe('Integration Error Handling', () => {
    test('should handle Slack webhook timeout gracefully', async () => {
      // Given: Webhook timeout scenario
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'TIMEOUT';
      fetch.mockRejectedValueOnce(timeoutError);

      const alert = {
        alertname: 'TestAlert',
        severity: 'warning',
        summary: 'Test alert for timeout handling'
      };

      // When: Attempting webhook delivery with timeout
      const { sendSlackAlert } = require('../../utils/monitoring/slack-notifications.js');
      const result = await sendSlackAlert(alert, { timeout: 5000 });

      // Then: Should handle timeout gracefully
      expect(result.delivered).toBe(false);
      expect(result.error).toBe('webhook_timeout');
      expect(result.fallbackLogged).toBe(true);
      expect(result.retryScheduled).toBe(true);
    });

    test('should validate message size limits', () => {
      // Given: Alert with very large content
      const largeAlert = {
        alertname: 'ProcessAuditLargePayload',
        severity: 'info',
        description: 'A'.repeat(8000), // 8KB description
        labels: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`label_${i}`, `value_${i}`])
        )
      };

      // When: Formatting large alert
      const { formatAlert } = require('../../utils/monitoring/slack-formatters.js');
      const message = formatAlert(largeAlert);

      // Then: Message should be truncated to Slack limits
      const messageSize = JSON.stringify(message).length;
      expect(messageSize).toBeLessThan(40000); // Slack's 40KB limit

      expect(message.attachments[0].text).toContain('... [truncated]');
      expect(message.attachments[0].fields.length).toBeLessThanOrEqual(10); // Slack's field limit
    });

    test('should handle malformed webhook responses', async () => {
      // Given: Malformed Slack webhook response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('invalid_payload')
      });

      const alert = {
        alertname: 'TestAlert',
        severity: 'critical'
      };

      // When: Sending alert with malformed response
      const { sendSlackAlert } = require('../../utils/monitoring/slack-notifications.js');
      const result = await sendSlackAlert(alert);

      // Then: Should handle malformed response
      expect(result.delivered).toBe(false);
      expect(result.error).toBe('invalid_webhook_response');
      expect(result.httpStatus).toBe(400);
      expect(result.errorLogged).toBe(true);
    });

    test('should batch multiple alerts to prevent rate limiting', async () => {
      // Given: Multiple simultaneous alerts
      const alerts = Array.from({ length: 10 }, (_, i) => ({
        alertname: `TestAlert${i}`,
        severity: 'warning',
        summary: `Test alert ${i}`
      }));

      // Mock successful batch delivery
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      // When: Sending alerts in batch
      const { sendSlackAlertBatch } = require('../../utils/monitoring/slack-notifications.js');
      const result = await sendSlackAlertBatch(alerts, { batchSize: 3 });

      // Then: Should batch alerts to prevent rate limiting
      expect(result.batchCount).toBe(4); // 10 alerts in batches of 3 = 4 batches
      expect(result.totalAlerts).toBe(10);
      expect(result.deliveredAlerts).toBe(10);
      expect(result.rateLimit.respected).toBe(true);

      // Verify staggered delivery timing
      expect(result.deliveryTimeMs).toBeGreaterThan(0);
      expect(result.averageBatchDelay).toBeGreaterThan(0);
    });
  });
});