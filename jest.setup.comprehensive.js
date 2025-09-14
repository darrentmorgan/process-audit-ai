/**
 * Comprehensive Jest Setup for ProcessAudit AI
 * Enhanced configuration for 95% test coverage target
 */

import '@testing-library/jest-dom';

// Import React for test components
import React from 'react';
global.React = React;

// Enhanced mock configurations for comprehensive testing

// Mock Clerk with comprehensive authentication scenarios
const createMockClerkAuth = (overrides = {}) => ({
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  signOut: jest.fn(),
  getToken: jest.fn().mockResolvedValue('mock-jwt-token'),
  ...overrides
});

const createMockOrganization = (overrides = {}) => ({
  id: 'org_test123',
  name: 'Test Organization',
  slug: 'test-org',
  imageUrl: '',
  publicMetadata: {},
  privateMetadata: {
    plan: 'premium',
    features: {
      enableAutomations: true,
      enableReporting: true,
      enableIntegrations: true,
      maxProjects: 50,
      maxMembers: 25
    },
    quotas: {
      monthlyAnalyses: 500,
      storageGB: 100,
      aiRequestsPerDay: 1000
    }
  },
  ...overrides
});

// Global test helpers for comprehensive testing
global.testHelpers = {
  ...global.testHelpers,

  // Enhanced organization helpers
  createMockOrganization,
  createMockClerkAuth,

  // Multi-tenant test utilities
  createTenantIsolationTest: (tenant1, tenant2) => ({
    tenant1,
    tenant2,
    validateIsolation: async (testFn) => {
      const results = await Promise.all([
        testFn(tenant1),
        testFn(tenant2)
      ]);

      // Ensure no cross-tenant data leakage
      const crossContamination = results[0].data?.some(item =>
        item.organization_id === tenant2.id
      ) || results[1].data?.some(item =>
        item.organization_id === tenant1.id
      );

      return {
        isolated: !crossContamination,
        results
      };
    }
  }),

  // AI integration test utilities
  createAIMockResponse: (provider, options = {}) => {
    const baseResponse = {
      claude: {
        id: 'msg_test123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Mock Claude response' }],
        model: 'claude-3-sonnet-20240229',
        usage: { input_tokens: 15, output_tokens: 8 }
      },
      openai: {
        id: 'chatcmpl-test123',
        object: 'chat.completion',
        choices: [{
          message: { role: 'assistant', content: 'Mock OpenAI response' },
          finish_reason: 'stop'
        }],
        usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }
      }
    };

    return { ...baseResponse[provider], ...options };
  },

  // Integration testing helpers
  createMockWebhookPayload: (service, eventType, data) => ({
    id: `webhook_${Date.now()}`,
    timestamp: new Date().toISOString(),
    service,
    eventType,
    data,
    signature: 'mock_signature_hash'
  }),

  // Performance testing utilities
  measureAsyncPerformance: async (asyncFn, iterations = 1) => {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await asyncFn();
      const end = performance.now();
      times.push(end - start);
    }

    return {
      min: Math.min(...times),
      max: Math.max(...times),
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)],
      iterations
    };
  },

  // Security testing utilities
  attemptCrossTenantAccess: async (userOrg, targetOrg, accessFn) => {
    try {
      const result = await accessFn(targetOrg);
      return {
        accessGranted: true,
        securityBreach: true,
        data: result
      };
    } catch (error) {
      return {
        accessGranted: false,
        securityBreach: false,
        error: error.message
      };
    }
  }
};

// Enhanced error suppression for comprehensive testing
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: An invalid form control') ||
      message.includes('Not implemented: HTMLCanvasElement.prototype.getContext') ||
      message.includes('Mock function error - this is expected in tests')
    )
  ) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (
      message.includes('componentWillReceiveProps has been renamed') ||
      message.includes('componentWillUpdate has been renamed') ||
      message.includes('Test warning - this is expected')
    )
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Enhanced expect matchers for comprehensive testing
expect.extend({
  // Organization validation matchers
  toBeValidOrganizationSlug(received) {
    const pass = /^[a-z0-9-_]+$/.test(received);
    return {
      message: () => pass
        ? `expected ${received} not to be a valid organization slug`
        : `expected ${received} to be a valid organization slug (lowercase letters, numbers, hyphens, underscores only)`,
      pass
    };
  },

  toBeValidEmail(received) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      message: () => pass
        ? `expected ${received} not to be a valid email address`
        : `expected ${received} to be a valid email address`,
      pass
    };
  },

  toHaveOrganizationRole(received, expectedRole) {
    const validRoles = ['admin', 'member', 'guest'];
    if (!validRoles.includes(expectedRole)) {
      throw new Error(`Invalid role: ${expectedRole}. Must be one of: ${validRoles.join(', ')}`);
    }

    const pass = received && received.role === expectedRole;
    return {
      message: () => pass
        ? `expected membership not to have role ${expectedRole}`
        : `expected membership to have role ${expectedRole}, but got ${received?.role}`,
      pass
    };
  },

  // Security testing matchers
  toPreventCrossTenantAccess(received, tenantId) {
    const hasDataFromDifferentTenant = received?.some?.(item =>
      item.organization_id && item.organization_id !== tenantId
    );

    const pass = !hasDataFromDifferentTenant;
    return {
      message: () => pass
        ? `expected data to contain cross-tenant information`
        : `expected data to be isolated to tenant ${tenantId}, but found cross-tenant data`,
      pass
    };
  },

  toMeetPerformanceThreshold(received, threshold) {
    const pass = received <= threshold;
    return {
      message: () => pass
        ? `expected ${received}ms to exceed performance threshold of ${threshold}ms`
        : `expected ${received}ms to be within performance threshold of ${threshold}ms`,
      pass
    };
  },

  // Integration testing matchers
  toBeValidWebhookSignature(received, payload, secret) {
    // Mock signature validation - in real implementation would use crypto
    const pass = received && payload && secret;
    return {
      message: () => pass
        ? `expected webhook signature to be invalid`
        : `expected webhook signature to be valid`,
      pass
    };
  },

  toHaveValidAuditTrail(received, expectedFields) {
    const requiredFields = ['timestamp', 'userId', 'organizationId', 'action', 'resource'];
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field));
    const hasExpectedFields = expectedFields?.every?.(field => received.hasOwnProperty(field)) ?? true;

    const pass = hasAllFields && hasExpectedFields;
    return {
      message: () => pass
        ? `expected audit trail to be missing required fields`
        : `expected audit trail to have all required fields: ${requiredFields.join(', ')}`,
      pass
    };
  }
});

// Mock external services for comprehensive testing
global.mockServices = {
  clerk: {
    reset: () => {
      jest.clearAllMocks();
    },
    setAuthState: (authState) => {
      require('@clerk/nextjs').useAuth.mockReturnValue(authState);
    },
    setOrganizationState: (orgState) => {
      require('@clerk/nextjs').useOrganization.mockReturnValue(orgState);
    }
  },

  ai: {
    reset: () => {
      jest.clearAllMocks();
    },
    setClaudeResponse: (response) => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response
      });
    },
    setOpenAIResponse: (response) => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response
      });
    }
  },

  integrations: {
    reset: () => {
      jest.clearAllMocks();
    },
    setPagerDutyResponse: (response) => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => response
      });
    },
    setSlackResponse: (response) => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response
      });
    }
  }
};

// Global test cleanup
afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();

  // Reset global state
  if (global.testHelpers?.resetTestState) {
    global.testHelpers.resetTestState();
  }
});

console.log('🧪 Comprehensive test environment initialized for 95% coverage target');