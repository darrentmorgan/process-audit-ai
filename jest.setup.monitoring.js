/**
 * Jest Setup for Monitoring Infrastructure Tests
 * ProcessAudit AI - Test Environment Configuration
 */

import { jest } from '@jest/globals';

// Extend Jest matchers for monitoring tests
expect.extend({
  toBeValidResponseTime(received, expected) {
    const pass = received < expected;
    if (pass) {
      return {
        message: () => `Expected response time ${received}ms not to be less than ${expected}ms`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected response time ${received}ms to be less than ${expected}ms`,
        pass: false
      };
    }
  },

  toHaveValidPagerDutyIncident(received) {
    const hasId = received.incident && received.incident.id;
    const hasStatus = received.incident && received.incident.status;
    const hasUrgency = received.incident && received.incident.urgency;

    const pass = hasId && hasStatus && hasUrgency;
    if (pass) {
      return {
        message: () => `Expected PagerDuty response not to be valid incident`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected PagerDuty response to be valid incident with id, status, and urgency`,
        pass: false
      };
    }
  },

  toHaveValidSlackMessage(received) {
    const hasChannel = received.channel;
    const hasText = received.text || (received.attachments && received.attachments.length > 0);
    const hasUsername = received.username;

    const pass = hasChannel && hasText && hasUsername;
    if (pass) {
      return {
        message: () => `Expected Slack message not to be valid`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected Slack message to have channel, text/attachments, and username`,
        pass: false
      };
    }
  },

  toBeIsolatedByOrganization(received, organizationId) {
    if (Array.isArray(received)) {
      const allBelongToOrg = received.every(item =>
        item.organization_id === organizationId
      );

      if (allBelongToOrg) {
        return {
          message: () => `Expected data not to be isolated to organization ${organizationId}`,
          pass: true
        };
      } else {
        const wrongOrgItems = received.filter(item =>
          item.organization_id !== organizationId
        );
        return {
          message: () => `Expected all data to belong to organization ${organizationId}, but found items from other organizations: ${wrongOrgItems.map(i => i.organization_id).join(', ')}`,
          pass: false
        };
      }
    } else {
      const pass = received.organization_id === organizationId;
      return {
        message: () => pass
          ? `Expected data not to belong to organization ${organizationId}`
          : `Expected data to belong to organization ${organizationId}, but got ${received.organization_id}`,
        pass
      };
    }
  },

  toMeetPerformanceThreshold(received, threshold) {
    const { metric, value, thresholdValue, comparison = 'less' } = threshold;
    let pass = false;

    switch (comparison) {
      case 'less':
        pass = received[metric] < thresholdValue;
        break;
      case 'greater':
        pass = received[metric] > thresholdValue;
        break;
      case 'equal':
        pass = received[metric] === thresholdValue;
        break;
    }

    return {
      message: () => pass
        ? `Expected ${metric} ${received[metric]} not to meet ${comparison} ${thresholdValue}`
        : `Expected ${metric} ${received[metric]} to be ${comparison} than ${thresholdValue}`,
      pass
    };
  }
});

// Global test helpers for monitoring tests
global.testHelpers = {
  ...global.testHelpers,

  // Performance measurement helper
  measurePerformance: async (fn) => {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    const result = await fn();

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    return {
      result,
      metrics: {
        executionTimeMs: Number(endTime - startTime) / 1000000,
        memoryDelta: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          rss: endMemory.rss - startMemory.rss
        }
      }
    };
  },

  // Mock PagerDuty incident
  createMockPagerDutyIncident: (overrides = {}) => ({
    incident: {
      id: `PD_${Date.now()}`,
      incident_number: Math.floor(Math.random() * 10000),
      status: 'triggered',
      urgency: 'high',
      priority: {
        id: 'priority_high',
        summary: 'High'
      },
      escalation_policy: {
        id: 'escalation_policy_123',
        summary: 'ProcessAudit AI Escalation'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides.incident
    },
    ...overrides
  }),

  // Mock Slack message
  createMockSlackMessage: (overrides = {}) => ({
    channel: '#alerts-critical',
    username: 'ProcessAudit AI Alerts',
    icon_emoji: ':rotating_light:',
    attachments: [{
      color: 'danger',
      title: 'System Alert',
      text: 'Alert description',
      fields: [
        { title: 'Service', value: 'processaudit-api', short: true },
        { title: 'Severity', value: 'critical', short: true }
      ],
      ts: Math.floor(Date.now() / 1000)
    }],
    ...overrides
  }),

  // Mock performance metrics
  createMockMetrics: (overrides = {}) => ({
    timestamp: new Date().toISOString(),
    cpu_usage: 45.2,
    memory_usage: 67.8,
    response_time: 234,
    error_rate: 0.5,
    throughput: 150.3,
    active_connections: 23,
    queue_depth: 7,
    ...overrides
  }),

  // Wait helper for async operations
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkCondition = async () => {
        try {
          if (await condition()) {
            resolve();
          } else if (Date.now() - startTime > timeout) {
            reject(new Error(`Condition not met within ${timeout}ms`));
          } else {
            setTimeout(checkCondition, 100);
          }
        } catch (error) {
          reject(error);
        }
      };
      checkCondition();
    });
  },

  // Generate load test data
  generateLoadTestData: (count = 100) => {
    return Array.from({ length: count }, (_, index) => ({
      requestId: index,
      timestamp: new Date(Date.now() + index * 1000).toISOString(),
      responseTime: Math.random() * 1000 + 100, // 100-1100ms
      statusCode: Math.random() > 0.05 ? 200 : 500, // 95% success rate
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      organizationId: `org_${Math.floor(Math.random() * 10)}`,
      endpoint: `/api/endpoint_${Math.floor(Math.random() * 5)}`
    }));
  }
};

// Console logging for test debugging
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress specific test-related console errors
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('Warning: ReactDOM.render is no longer supported') ||
    message.includes('Warning: An invalid form control') ||
    message.includes('Text content did not match')
  )) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Mock Next.js router for tests
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  }))
}));

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true';
process.env.PERFORMANCE_MONITORING_ENABLED = 'true';

// Global timeout for monitoring tests
jest.setTimeout(30000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllTimers();

  // Clear any pending setTimeout/setInterval
  if (global.gc) {
    global.gc();
  }
});

// Setup before all tests
beforeAll(() => {
  // Set timezone for consistent date testing
  process.env.TZ = 'UTC';
});

// Cleanup after all tests
afterAll(() => {
  // Restore original console.error
  console.error = originalConsoleError;
});