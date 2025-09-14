/**
 * Comprehensive Slack Integration Test Suite
 * ProcessAudit AI - Notification & Communication Testing
 *
 * Coverage Areas:
 * - Slack webhook configuration and validation
 * - Message formatting and templating
 * - Alert notification workflows
 * - Channel routing logic
 * - Interactive message components
 * - Rate limiting and throttling
 * - Error handling and retry mechanisms
 * - Security validation for webhooks
 * - Message threading and grouping
 * - Custom notification rules
 * - Business metrics notifications
 * - User mention and escalation
 */

import { jest } from '@jest/globals';
import fetch from 'node-fetch';

// Mock environment variables
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test/webhook/url';
process.env.SLACK_BOT_TOKEN = 'xoxb-test-slack-bot-token';
process.env.SLACK_SIGNING_SECRET = 'test_slack_signing_secret';
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

describe('Comprehensive Slack Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Webhook Configuration and Validation', () => {
    test('should validate Slack webhook URL format', async () => {
      const { validateSlackConfig } = await import('../../../utils/monitoring/slack-validator');

      const validConfig = {
        webhookUrl: 'https://hooks.slack.com/services/T123/B456/ABC123',
        botToken: 'xoxb-123-456-abc',
        signingSecret: 'secret123'
      };

      const result = validateSlackConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.capabilities).toContain('webhooks');
      expect(result.capabilities).toContain('bot_api');
    });

    test('should reject invalid webhook URLs', async () => {
      const { validateSlackConfig } = await import('../../../utils/monitoring/slack-validator');

      const invalidConfig = {
        webhookUrl: 'https://invalid-webhook-url.com',
        botToken: '',
        signingSecret: ''
      };

      const result = validateSlackConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid Slack webhook URL format');
      expect(result.errors).toContain('Bot token not configured');
    });

    test('should validate webhook signature for security', async () => {
      const payload = JSON.stringify({
        text: 'Test message',
        timestamp: Date.now()
      });

      const timestamp = Math.floor(Date.now() / 1000);
      const signature = 'v0=test_signature_hash';

      const { validateSlackWebhookSignature } = await import('../../../utils/monitoring/slack-security');

      const isValid = validateSlackWebhookSignature({
        payload,
        timestamp: timestamp.toString(),
        signature,
        signingSecret: process.env.SLACK_SIGNING_SECRET
      });

      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Alert Notification Workflows', () => {
    const mockSlackResponse = {
      ok: true,
      ts: '1699123456.123456',
      channel: 'C1234567890',
      message: {
        text: 'Alert notification sent',
        ts: '1699123456.123456'
      }
    };

    test('should send critical system alerts to appropriate channels', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSlackResponse
      } as any);

      const { sendSlackAlert } = await import('../../../utils/monitoring/slack-notifications');

      const result = await sendSlackAlert({
        alert: {
          alertname: 'ProcessAuditDown',
          severity: 'critical',
          component: 'api',
          summary: 'ProcessAudit AI API is down',
          description: 'API has been unreachable for 2 minutes',
          runbook_url: 'https://docs.processaudit.ai/runbooks/api-down'
        },
        channel: '#alerts-critical'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        process.env.SLACK_WEBHOOK_URL,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('🚨 Critical Alert: ProcessAuditDown')
        })
      );

      expect(result.sent).toBe(true);
      expect(result.messageId).toBe('1699123456.123456');
    });

    test('should format business metric alerts appropriately', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSlackResponse
      } as any);

      const { sendBusinessAlert } = await import('../../../utils/monitoring/slack-notifications');

      await sendBusinessAlert({
        metric: 'conversion_rate',
        value: 0.65,
        threshold: 0.80,
        timeframe: '1h',
        impact: 'Revenue at risk due to low conversion',
        recommendedAction: 'Review user experience and technical barriers'
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);

      expect(body.text).toContain('📊 Business Metric Alert');
      expect(body.text).toContain('Conversion Rate: 65%');
      expect(body.text).toContain('Threshold: 80%');
      expect(body.color).toBe('warning');
    });

    test('should handle multi-tenant alert context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSlackResponse
      } as any);

      const { sendTenantAlert } = await import('../../../utils/monitoring/slack-notifications');

      await sendTenantAlert({
        organizationId: 'org_premium_123',
        organizationName: 'Acme Corporation',
        plan: 'premium',
        alert: {
          type: 'quota_exceeded',
          usage: 1.2,
          limit: 1.0,
          recommendation: 'Upgrade to enterprise plan'
        }
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);

      expect(body.text).toContain('🏢 Tenant Alert: Acme Corporation');
      expect(body.text).toContain('Premium Plan');
      expect(body.text).toContain('120% of quota');
      expect(body.channel).toBe('#customer-success');
    });

    test('should send AI cost optimization alerts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSlackResponse
      } as any);

      const { sendCostAlert } = await import('../../../utils/monitoring/slack-notifications');

      await sendCostAlert({
        provider: 'claude',
        dailyCost: 45.50,
        threshold: 50.00,
        trend: 'increasing',
        projectedMonthlyCost: 1365.00,
        optimizationTips: [
          'Consider using GPT-3.5 for simple tasks',
          'Implement response caching',
          'Optimize prompt efficiency'
        ]
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);

      expect(body.text).toContain('💰 AI Cost Alert');
      expect(body.text).toContain('Claude: $45.50');
      expect(body.text).toContain('Projected Monthly: $1,365.00');
      expect(body.attachments[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Optimization Tips',
            value: expect.stringContaining('GPT-3.5 for simple tasks')
          })
        ])
      );
    });
  });

  describe('Interactive Message Components', () => {
    test('should create interactive incident response buttons', async () => {
      const { createIncidentResponseMessage } = await import('../../../utils/monitoring/slack-interactive');

      const message = createIncidentResponseMessage({
        incidentId: 'incident_123',
        summary: 'Database Connection Lost',
        severity: 'critical',
        component: 'database',
        runbookUrl: 'https://docs.processaudit.ai/runbooks/db-connection'
      });

      expect(message.attachments[0].actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'acknowledge',
            text: 'Acknowledge',
            type: 'button',
            value: 'incident_123',
            style: 'primary'
          }),
          expect.objectContaining({
            name: 'escalate',
            text: 'Escalate',
            type: 'button',
            value: 'incident_123',
            style: 'danger'
          }),
          expect.objectContaining({
            name: 'runbook',
            text: 'View Runbook',
            type: 'button',
            url: 'https://docs.processaudit.ai/runbooks/db-connection'
          })
        ])
      );
    });

    test('should handle interactive button callbacks', async () => {
      const callbackPayload = {
        payload: JSON.stringify({
          type: 'interactive_message',
          actions: [
            {
              name: 'acknowledge',
              value: 'incident_123'
            }
          ],
          user: {
            id: 'U123456',
            name: 'engineer.jane'
          },
          channel: {
            id: 'C123456',
            name: 'alerts-critical'
          },
          response_url: 'https://hooks.slack.com/actions/response'
        })
      };

      const { handleSlackInteraction } = await import('../../../utils/monitoring/slack-interactive');

      const result = await handleSlackInteraction(callbackPayload);

      expect(result.action).toBe('acknowledge');
      expect(result.incidentId).toBe('incident_123');
      expect(result.user).toBe('engineer.jane');
    });

    test('should create escalation workflows with user mentions', async () => {
      const { createEscalationMessage } = await import('../../../utils/monitoring/slack-escalation');

      const message = createEscalationMessage({
        incidentId: 'incident_123',
        severity: 'critical',
        summary: 'Complete System Outage',
        escalationLevel: 2,
        oncallEngineers: ['@john.doe', '@jane.smith'],
        managerOverride: '@engineering.manager'
      });

      expect(message.text).toContain('🚨 ESCALATION LEVEL 2');
      expect(message.text).toContain('@john.doe');
      expect(message.text).toContain('@jane.smith');
      expect(message.text).toContain('@engineering.manager');
      expect(message.channel).toBe('#alerts-critical');
    });
  });

  describe('Message Threading and Grouping', () => {
    test('should thread related alert messages', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockSlackResponse, ts: '1699123456.123456' })
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockSlackResponse, ts: '1699123456.123457' })
        } as any);

      const { sendThreadedAlert } = await import('../../../utils/monitoring/slack-threading');

      // Send initial alert
      const parentMessage = await sendThreadedAlert({
        alert: {
          alertname: 'HighErrorRate',
          severity: 'warning',
          summary: 'Error rate elevated to 3%'
        },
        channel: '#alerts-warnings'
      });

      // Send follow-up in thread
      const threadMessage = await sendThreadedAlert({
        alert: {
          alertname: 'HighErrorRate',
          severity: 'critical',
          summary: 'Error rate escalated to 8%'
        },
        channel: '#alerts-warnings',
        threadTs: parentMessage.ts
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);

      const secondCall = mockFetch.mock.calls[1][1];
      const body = JSON.parse(secondCall.body as string);

      expect(body.thread_ts).toBe('1699123456.123456');
      expect(body.text).toContain('🔄 Alert Update');
    });

    test('should group similar alerts to prevent spam', async () => {
      const { AlertGroupingManager } = await import('../../../utils/monitoring/slack-grouping');
      const groupManager = new AlertGroupingManager();

      const alerts = [
        { alertname: 'HighMemoryUsage', instance: 'server1', value: 85 },
        { alertname: 'HighMemoryUsage', instance: 'server2', value: 87 },
        { alertname: 'HighMemoryUsage', instance: 'server3', value: 89 }
      ];

      const groupedMessage = groupManager.groupAlerts(alerts, {
        groupBy: ['alertname'],
        timeWindow: 300, // 5 minutes
        maxGroupSize: 5
      });

      expect(groupedMessage.title).toBe('🔄 Grouped Alert: HighMemoryUsage');
      expect(groupedMessage.summary).toContain('3 instances affected');
      expect(groupedMessage.details).toContain('server1: 85%');
      expect(groupedMessage.details).toContain('server2: 87%');
      expect(groupedMessage.details).toContain('server3: 89%');
    });

    test('should handle message threading limits', async () => {
      const { ThreadManager } = await import('../../../utils/monitoring/slack-threading');
      const threadManager = new ThreadManager();

      // Simulate max thread depth reached
      const result = await threadManager.addToThread({
        parentTs: '1699123456.123456',
        message: 'Update message',
        maxDepth: 5,
        currentDepth: 6
      });

      expect(result.startedNewThread).toBe(true);
      expect(result.reason).toBe('max_depth_exceeded');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Thread depth limit reached, starting new thread',
        expect.any(Object)
      );
    });
  });

  describe('Channel Routing and Smart Delivery', () => {
    test('should route alerts to correct channels based on severity', async () => {
      const { getChannelForAlert } = await import('../../../utils/monitoring/slack-routing');

      const criticalChannel = getChannelForAlert({
        severity: 'critical',
        component: 'api',
        alertname: 'ProcessAuditDown'
      });

      const warningChannel = getChannelForAlert({
        severity: 'warning',
        component: 'business',
        alertname: 'LowConversionRate'
      });

      const securityChannel = getChannelForAlert({
        severity: 'critical',
        component: 'security',
        alertname: 'TenantIsolationBreach'
      });

      expect(criticalChannel).toBe('#alerts-critical');
      expect(warningChannel).toBe('#business-metrics');
      expect(securityChannel).toBe('#security-incidents');
    });

    test('should handle channel-specific message formatting', async () => {
      const { formatMessageForChannel } = await import('../../../utils/monitoring/slack-formatting');

      const execMessage = formatMessageForChannel({
        alert: {
          alertname: 'HighAICost',
          value: 75.50,
          threshold: 50.00
        },
        channel: '#executive-alerts'
      });

      const techMessage = formatMessageForChannel({
        alert: {
          alertname: 'HighResponseTime',
          value: 3.2,
          threshold: 2.0
        },
        channel: '#engineering-alerts'
      });

      expect(execMessage.text).toContain('💰 Cost Impact');
      expect(execMessage.text).not.toContain('Technical Details');

      expect(techMessage.text).toContain('⚙️ Technical Issue');
      expect(techMessage.text).toContain('Response Time: 3.2s');
    });

    test('should implement time-based channel routing', async () => {
      const { getChannelForTime } = await import('../../../utils/monitoring/slack-routing');

      // Business hours
      const businessHoursChannel = getChannelForTime({
        severity: 'warning',
        component: 'business',
        timestamp: new Date('2024-01-01T14:00:00Z') // 2 PM UTC
      });

      // After hours
      const afterHoursChannel = getChannelForTime({
        severity: 'warning',
        component: 'business',
        timestamp: new Date('2024-01-01T02:00:00Z') // 2 AM UTC
      });

      expect(businessHoursChannel).toBe('#business-metrics');
      expect(afterHoursChannel).toBe('#business-metrics-after-hours');
    });
  });

  describe('Custom Notification Rules and Filters', () => {
    test('should apply organization-specific notification rules', async () => {
      const { applyNotificationRules } = await import('../../../utils/monitoring/slack-rules');

      const rules = {
        'org_enterprise_123': {
          channels: {
            critical: '#acme-critical-alerts',
            warning: '#acme-alerts'
          },
          mentions: ['@acme-oncall'],
          customFields: ['account_manager', 'contract_value']
        }
      };

      const result = applyNotificationRules({
        organizationId: 'org_enterprise_123',
        alert: {
          alertname: 'OrganizationQuotaExceeded',
          severity: 'warning'
        },
        rules
      });

      expect(result.channel).toBe('#acme-alerts');
      expect(result.mentions).toContain('@acme-oncall');
      expect(result.includeFields).toContain('account_manager');
    });

    test('should filter noisy alerts based on configuration', async () => {
      const { AlertFilter } = await import('../../../utils/monitoring/slack-filters');
      const filter = new AlertFilter({
        suppressDuplicates: true,
        duplicateWindow: 3600, // 1 hour
        noisyAlertPatterns: ['HighMemoryUsage'],
        maxAlertsPerHour: 10
      });

      // Send same alert multiple times
      const alert = {
        alertname: 'HighMemoryUsage',
        instance: 'server1',
        severity: 'warning'
      };

      const firstResult = filter.shouldSendAlert(alert);
      const secondResult = filter.shouldSendAlert(alert); // Duplicate within window

      expect(firstResult.send).toBe(true);
      expect(secondResult.send).toBe(false);
      expect(secondResult.reason).toBe('duplicate_suppressed');
    });

    test('should implement smart alert suppression during maintenance', async () => {
      const { MaintenanceManager } = await import('../../../utils/monitoring/maintenance-manager');
      const maintenance = new MaintenanceManager();

      // Start maintenance window
      maintenance.startMaintenance({
        component: 'database',
        duration: 3600, // 1 hour
        reason: 'Scheduled database maintenance',
        suppressAlerts: ['DatabaseConnectionFailed', 'HighResponseTime']
      });

      const { shouldSuppressAlert } = maintenance;

      const dbAlert = shouldSuppressAlert({
        alertname: 'DatabaseConnectionFailed',
        component: 'database'
      });

      const unrelatedAlert = shouldSuppressAlert({
        alertname: 'HighAICost',
        component: 'ai'
      });

      expect(dbAlert.suppress).toBe(true);
      expect(dbAlert.reason).toBe('maintenance_window');

      expect(unrelatedAlert.suppress).toBe(false);
    });
  });

  describe('Rate Limiting and Performance', () => {
    test('should respect Slack API rate limits', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          ok: false,
          error: 'rate_limited'
        }),
        headers: new Map([
          ['retry-after', '30']
        ])
      } as any);

      const { sendSlackMessage } = await import('../../../utils/monitoring/slack-client');

      await expect(sendSlackMessage({
        channel: '#test',
        text: 'Test message'
      })).rejects.toThrow('Rate limited');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Slack API rate limit exceeded',
        expect.objectContaining({
          retryAfter: 30
        })
      );
    });

    test('should implement message queuing for high-volume alerts', async () => {
      const { SlackMessageQueue } = await import('../../../utils/monitoring/slack-queue');
      const queue = new SlackMessageQueue({
        maxQueueSize: 100,
        processInterval: 1000,
        rateLimitPerMinute: 60
      });

      // Add multiple messages to queue
      for (let i = 0; i < 10; i++) {
        queue.enqueue({
          channel: '#test',
          text: `Test message ${i}`,
          priority: i < 5 ? 'high' : 'normal'
        });
      }

      expect(queue.size()).toBe(10);
      expect(queue.highPriorityCount()).toBe(5);

      // Process queue
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSlackResponse
      } as any);

      await queue.process();

      expect(mockFetch).toHaveBeenCalledTimes(10);
      expect(queue.size()).toBe(0);
    });

    test('should track Slack integration performance metrics', async () => {
      const { SlackMetricsCollector } = await import('../../../utils/monitoring/slack-metrics');
      const collector = new SlackMetricsCollector();

      collector.recordMessageSent({
        channel: '#alerts-critical',
        messageType: 'alert',
        responseTime: 250,
        success: true
      });

      collector.recordMessageSent({
        channel: '#business-metrics',
        messageType: 'business',
        responseTime: 1500,
        success: false,
        error: 'Channel not found'
      });

      const metrics = collector.getMetrics();

      expect(metrics.totalMessages).toBe(2);
      expect(metrics.successRate).toBe(0.5);
      expect(metrics.averageResponseTime).toBe(875);
      expect(metrics.channelDistribution['#alerts-critical']).toBe(1);
      expect(metrics.errorTypes['Channel not found']).toBe(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle webhook delivery failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));

      const { sendSlackAlert } = await import('../../../utils/monitoring/slack-notifications');

      await expect(sendSlackAlert({
        alert: {
          alertname: 'TestAlert',
          severity: 'warning',
          summary: 'Test alert message'
        },
        channel: '#test'
      })).rejects.toThrow('Connection timeout');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Slack webhook delivery failed',
        expect.objectContaining({
          error: 'Connection timeout',
          channel: '#test'
        })
      );
    });

    test('should implement retry logic for transient failures', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSlackResponse
        } as any);

      const { sendSlackMessageWithRetry } = await import('../../../utils/monitoring/slack-retry');

      const result = await sendSlackMessageWithRetry({
        channel: '#test',
        text: 'Test message with retry',
        maxRetries: 3,
        backoffMultiplier: 1.5
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.sent).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test('should fallback to alternative notification methods', async () => {
      mockFetch.mockRejectedValue(new Error('Slack service unavailable'));

      const mockEmailFallback = jest.fn().mockResolvedValue({ sent: true });

      const { sendNotificationWithFallback } = await import('../../../utils/monitoring/notification-fallback');

      const result = await sendNotificationWithFallback({
        primary: {
          type: 'slack',
          config: { channel: '#alerts-critical', text: 'Critical alert' }
        },
        fallback: {
          type: 'email',
          config: { to: 'alerts@processaudit.ai', subject: 'Critical Alert' },
          handler: mockEmailFallback
        }
      });

      expect(result.method).toBe('email');
      expect(result.fallbackUsed).toBe(true);
      expect(mockEmailFallback).toHaveBeenCalled();
    });
  });

  describe('Compliance and Audit Trails', () => {
    test('should log all notification activities for audit', async () => {
      const { SlackAuditLogger } = await import('../../../utils/monitoring/slack-audit');
      const auditLogger = new SlackAuditLogger();

      await auditLogger.logNotification({
        messageId: 'msg_123',
        channel: '#alerts-critical',
        severity: 'critical',
        timestamp: new Date(),
        recipient: 'engineering-team',
        alertname: 'ProcessAuditDown',
        organizationId: 'org_123',
        userId: 'user_456'
      });

      const auditTrail = auditLogger.getAuditTrail({
        organizationId: 'org_123',
        timeRange: { start: new Date(Date.now() - 86400000), end: new Date() }
      });

      expect(auditTrail.entries).toHaveLength(1);
      expect(auditTrail.entries[0]).toMatchObject({
        messageId: 'msg_123',
        severity: 'critical',
        organizationId: 'org_123'
      });
    });

    test('should maintain data privacy in Slack notifications', async () => {
      const { sanitizeAlertForSlack } = await import('../../../utils/monitoring/slack-privacy');

      const alertWithPII = {
        alertname: 'UserActivityAnomaly',
        summary: 'Unusual activity detected',
        description: 'User john.doe@company.com accessed data at unusual time',
        userId: 'user_123',
        userEmail: 'john.doe@company.com',
        organizationId: 'org_456'
      };

      const sanitized = sanitizeAlertForSlack(alertWithPII);

      expect(sanitized.summary).toBe('Unusual activity detected');
      expect(sanitized.description).toContain('User ***@company.com');
      expect(sanitized.userId).toBe('user_***');
      expect(sanitized.userEmail).toBeUndefined();
      expect(sanitized.organizationId).toBe('org_456'); // Preserved for context
    });

    test('should validate message content for compliance', async () => {
      const { validateMessageCompliance } = await import('../../../utils/monitoring/slack-compliance');

      const message = {
        text: 'Alert: High error rate detected in API endpoint /api/users/sensitive-data',
        channel: '#public-alerts',
        attachments: [
          {
            title: 'Error Details',
            text: 'Database query failed: SELECT * FROM users WHERE email = john.doe@company.com'
          }
        ]
      };

      const validation = validateMessageCompliance(message);

      expect(validation.compliant).toBe(false);
      expect(validation.issues).toContain('potential_pii_exposure');
      expect(validation.recommendations).toContain('Sanitize database queries in error messages');
    });
  });

  describe('Business Intelligence Notifications', () => {
    test('should send formatted business metric updates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSlackResponse
      } as any);

      const { sendBusinessMetricUpdate } = await import('../../../utils/monitoring/slack-business');

      await sendBusinessMetricUpdate({
        metric: 'monthly_recurring_revenue',
        value: 125000,
        previousValue: 118000,
        changePercent: 5.93,
        trend: 'increasing',
        timeframe: 'monthly',
        organizationBreakdown: {
          'enterprise': 85000,
          'premium': 32000,
          'free': 8000
        }
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);

      expect(body.text).toContain('📈 Business Metric Update');
      expect(body.text).toContain('Monthly Recurring Revenue: $125,000');
      expect(body.text).toContain('Growth: +5.93%');
      expect(body.attachments[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Enterprise',
            value: '$85,000',
            short: true
          })
        ])
      );
    });

    test('should send customer success alerts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSlackResponse
      } as any);

      const { sendCustomerSuccessAlert } = await import('../../../utils/monitoring/slack-customer-success');

      await sendCustomerSuccessAlert({
        organizationId: 'org_premium_456',
        organizationName: 'Beta Corporation',
        plan: 'premium',
        alertType: 'churn_risk',
        riskScore: 0.75,
        factors: [
          'Low usage last 7 days',
          'No PDF exports in 14 days',
          'Support ticket volume increased'
        ],
        recommendedActions: [
          'Schedule customer check-in call',
          'Provide usage optimization guide',
          'Offer additional training'
        ]
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);

      expect(body.channel).toBe('#customer-success');
      expect(body.text).toContain('🚨 Customer Risk Alert');
      expect(body.text).toContain('Beta Corporation');
      expect(body.text).toContain('Risk Score: 75%');
    });
  });

  describe('Integration Health Monitoring', () => {
    test('should monitor Slack integration health', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          team: {
            id: 'T123456',
            name: 'ProcessAudit AI Team'
          }
        })
      } as any);

      const { checkSlackIntegrationHealth } = await import('../../../utils/monitoring/slack-health');

      const health = await checkSlackIntegrationHealth();

      expect(health.status).toBe('healthy');
      expect(health.teamId).toBe('T123456');
      expect(health.responseTime).toBeGreaterThan(0);
    });

    test('should detect and report Slack outages', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Slack API unreachable'));

      const { checkSlackIntegrationHealth } = await import('../../../utils/monitoring/slack-health');

      const health = await checkSlackIntegrationHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.error).toContain('Slack API unreachable');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Slack integration health check failed',
        expect.any(Object)
      );
    });

    test('should track notification delivery success rates', async () => {
      const { SlackDeliveryTracker } = await import('../../../utils/monitoring/slack-delivery');
      const tracker = new SlackDeliveryTracker();

      // Simulate successful deliveries
      tracker.recordDelivery({ channel: '#alerts-critical', success: true, responseTime: 200 });
      tracker.recordDelivery({ channel: '#alerts-critical', success: true, responseTime: 180 });

      // Simulate failed delivery
      tracker.recordDelivery({
        channel: '#alerts-critical',
        success: false,
        responseTime: 5000,
        error: 'Channel not found'
      });

      const stats = tracker.getDeliveryStats('#alerts-critical');

      expect(stats.totalDeliveries).toBe(3);
      expect(stats.successRate).toBe(0.67); // 2/3
      expect(stats.averageResponseTime).toBe(1793); // (200 + 180 + 5000) / 3
      expect(stats.errorTypes['Channel not found']).toBe(1);
    });
  });
});