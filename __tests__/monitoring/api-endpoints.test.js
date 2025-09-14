/**
 * API Endpoints Comprehensive Coverage Tests
 * ProcessAudit AI - Monitoring Infrastructure Testing
 *
 * Tests all health check endpoints, metrics endpoint validation,
 * system status API testing, and error handling edge cases.
 */

import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.APP_VERSION = '1.4.0';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key';
process.env.ANTHROPIC_API_KEY = 'test_anthropic_key';
process.env.OPENAI_API_KEY = 'test_openai_key';
process.env.CLOUDFLARE_WORKER_URL = 'https://test.workers.dev';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: [{ count: 1 }], error: null }),
    insert: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
    eq: jest.fn().mockReturnThis()
  })),
  rpc: jest.fn()
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

global.fetch = jest.fn();

describe('API Endpoints Comprehensive Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Health Check Endpoints', () => {
    test('should return healthy status from basic health endpoint', async () => {
      // Given: Basic health check endpoint
      const healthHandler = require('../../pages/api/health.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET'
      });

      // When: Calling basic health endpoint
      await healthHandler.default(req, res);

      // Then: Should return healthy status
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: '1.4.0',
        environment: 'test',
        checks: {
          server: 'operational',
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            unit: 'MB'
          }
        }
      });
    });

    test('should return comprehensive system status from deep health endpoint', async () => {
      // Given: Deep health check with all systems healthy

      // Mock Supabase connection
      mockSupabaseClient.from().limit.mockResolvedValueOnce({
        data: [{ count: 1 }],
        error: null
      });

      // Mock Claude API
      fetch.mockImplementation((url) => {
        if (url.includes('anthropic.com')) {
          return Promise.resolve({
            ok: false,
            status: 400, // Expected for minimal request
            json: () => Promise.resolve({})
          });
        }
        if (url.includes('openai.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: [] })
          });
        }
        if (url.includes('workers.dev')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: () => Promise.resolve('ok')
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const deepHealthHandler = require('../../pages/api/health/deep.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET'
      });

      // When: Calling deep health endpoint
      await deepHealthHandler.default(req, res);

      // Then: Should return comprehensive health status
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        status: expect.stringMatching(/healthy|degraded/),
        correlationId: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: '1.4.0',
        environment: 'test',
        checks: {
          server: {
            status: 'healthy',
            memory: {
              used: expect.any(Number),
              total: expect.any(Number),
              unit: 'MB'
            },
            nodejs: expect.any(String)
          },
          database: {
            status: 'healthy',
            responseTime: expect.stringMatching(/\d+ms/),
            connection: 'active'
          },
          claude_api: {
            status: 'healthy',
            responseTime: expect.stringMatching(/\d+ms/)
          },
          openai_api: {
            status: 'healthy',
            responseTime: expect.stringMatching(/\d+ms/)
          },
          cloudflare_workers: {
            status: 'healthy',
            responseTime: expect.stringMatching(/\d+ms/)
          },
          authentication: {
            status: 'configured',
            provider: 'clerk'
          }
        },
        totalResponseTime: expect.stringMatching(/\d+ms/)
      });

      // Verify external service checks were made
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('anthropic.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test_anthropic_key'
          })
        })
      );
    });

    test('should handle database connection failure in health check', async () => {
      // Given: Database connection failure
      mockSupabaseClient.from().limit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection timeout' }
      });

      // Mock other services as healthy
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      });

      const deepHealthHandler = require('../../pages/api/health/deep.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET'
      });

      // When: Calling health check with database failure
      await deepHealthHandler.default(req, res);

      // Then: Should return degraded status
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.status).toBe('degraded');
      expect(responseData.checks.database).toMatchObject({
        status: 'unhealthy',
        error: 'Connection timeout'
      });
    });

    test('should handle AI service failures gracefully', async () => {
      // Given: AI services are down
      mockSupabaseClient.from().limit.mockResolvedValueOnce({
        data: [{ count: 1 }],
        error: null
      });

      // Mock AI service failures
      fetch.mockImplementation((url) => {
        if (url.includes('anthropic.com')) {
          return Promise.reject(new Error('Network timeout'));
        }
        if (url.includes('openai.com')) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: () => Promise.resolve({ error: 'Service unavailable' })
          });
        }
        return Promise.resolve({ ok: true, status: 200 });
      });

      const deepHealthHandler = require('../../pages/api/health/deep.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET'
      });

      // When: Calling health check with AI failures
      await deepHealthHandler.default(req, res);

      // Then: Should report AI service issues
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.checks.claude_api.status).toBe('unhealthy');
      expect(responseData.checks.openai_api.status).toBe('degraded');
      expect(responseData.checks.claude_api.error).toBe('Network timeout');
    });

    test('should reject non-GET methods on health endpoints', async () => {
      // Given: POST request to health endpoint
      const healthHandler = require('../../pages/api/health.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST'
      });

      // When: Making POST request to health endpoint
      await healthHandler.default(req, res);

      // Then: Should reject with 405 Method Not Allowed
      expect(res._getStatusCode()).toBe(405);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        error: 'Method not allowed',
        timestamp: expect.any(String)
      });
    });

    test('should handle health check timeout scenarios', async () => {
      // Given: Long-running health check operations
      mockSupabaseClient.from().limit.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: [{ count: 1 }], error: null });
          }, 6000); // 6 second delay
        });
      });

      // Mock fetch with timeout
      fetch.mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, 5000);
        });
      });

      const deepHealthHandler = require('../../pages/api/health/deep.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET'
      });

      // When: Health check operations timeout
      const startTime = Date.now();
      await deepHealthHandler.default(req, res);
      const duration = Date.now() - startTime;

      // Then: Should complete within reasonable time despite timeouts
      expect(duration).toBeLessThan(10000); // Less than 10 seconds
      expect(res._getStatusCode()).toBe(200);

      const responseData = JSON.parse(res._getData());
      expect(responseData.status).toBe('degraded');
    });
  });

  describe('Metrics Endpoint Validation', () => {
    test('should return system metrics with proper structure', async () => {
      // Given: Metrics endpoint handler
      const metricsHandler = require('../../pages/api/monitoring/metrics.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          timeRange: '1h',
          metrics: 'cpu,memory,response_time'
        }
      });

      // When: Requesting system metrics
      await metricsHandler.default(req, res);

      // Then: Should return structured metrics data
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        timestamp: expect.any(String),
        timeRange: '1h',
        metrics: {
          cpu: {
            current: expect.any(Number),
            average: expect.any(Number),
            peak: expect.any(Number),
            unit: 'percentage'
          },
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number),
            unit: 'MB'
          },
          response_time: {
            average: expect.any(Number),
            p95: expect.any(Number),
            p99: expect.any(Number),
            unit: 'ms'
          }
        },
        dataPoints: expect.any(Array)
      });
    });

    test('should validate time range parameters', async () => {
      // Given: Metrics request with invalid time range
      const metricsHandler = require('../../pages/api/monitoring/metrics.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          timeRange: '999h', // Invalid - too long
          metrics: 'cpu'
        }
      });

      // When: Requesting metrics with invalid time range
      await metricsHandler.default(req, res);

      // Then: Should return validation error
      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        success: false,
        error: 'Invalid time range',
        details: {
          provided: '999h',
          allowed: expect.arrayContaining(['5m', '1h', '6h', '24h', '7d'])
        }
      });
    });

    test('should handle missing metric types gracefully', async () => {
      // Given: Metrics request for non-existent metrics
      const metricsHandler = require('../../pages/api/monitoring/metrics.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          timeRange: '1h',
          metrics: 'cpu,invalid_metric,disk_io'
        }
      });

      // When: Requesting metrics including invalid ones
      await metricsHandler.default(req, res);

      // Then: Should return available metrics and warnings
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.metrics.cpu).toBeDefined();
      expect(responseData.metrics.invalid_metric).toBeUndefined();
      expect(responseData.warnings).toContain('Metric not available: invalid_metric');
      expect(responseData.availableMetrics).toEqual(
        expect.arrayContaining(['cpu', 'memory', 'response_time', 'disk_io'])
      );
    });

    test('should return real-time metrics for streaming requests', async () => {
      // Given: Real-time metrics streaming endpoint
      const realtimeHandler = require('../../pages/api/monitoring/metrics/realtime.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'accept': 'text/event-stream'
        }
      });

      // When: Requesting real-time metrics stream
      await realtimeHandler.default(req, res);

      // Then: Should setup server-sent events
      expect(res._getStatusCode()).toBe(200);
      expect(res.getHeaders()['content-type']).toBe('text/event-stream');
      expect(res.getHeaders()['cache-control']).toBe('no-cache');
      expect(res.getHeaders()['connection']).toBe('keep-alive');

      // Verify initial data was sent
      const responseData = res._getData();
      expect(responseData).toContain('data: {');
      expect(responseData).toContain('event: metrics');
    });

    test('should aggregate metrics across multiple time periods', async () => {
      // Given: Aggregated metrics request
      const aggregateHandler = require('../../pages/api/monitoring/metrics/aggregate.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          timeRanges: ['1h', '6h', '24h'],
          metrics: ['response_time', 'error_rate'],
          aggregation: 'average'
        }
      });

      // When: Requesting aggregated metrics
      await aggregateHandler.default(req, res);

      // Then: Should return aggregated data across time periods
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        aggregation: 'average',
        timeRanges: {
          '1h': {
            response_time: { average: expect.any(Number) },
            error_rate: { average: expect.any(Number) }
          },
          '6h': {
            response_time: { average: expect.any(Number) },
            error_rate: { average: expect.any(Number) }
          },
          '24h': {
            response_time: { average: expect.any(Number) },
            error_rate: { average: expect.any(Number) }
          }
        },
        trends: {
          response_time: expect.stringMatching(/improving|declining|stable/),
          error_rate: expect.stringMatching(/improving|declining|stable/)
        }
      });
    });
  });

  describe('System Status API Testing', () => {
    test('should return comprehensive system status overview', async () => {
      // Given: System status endpoint
      const statusHandler = require('../../pages/api/monitoring/status.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET'
      });

      // When: Requesting system status
      await statusHandler.default(req, res);

      // Then: Should return complete system status
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        overall_status: expect.stringMatching(/operational|degraded|outage/),
        timestamp: expect.any(String),
        components: {
          api_server: {
            status: expect.stringMatching(/operational|degraded|outage/),
            response_time: expect.any(Number),
            uptime_percentage: expect.any(Number)
          },
          database: {
            status: expect.stringMatching(/operational|degraded|outage/),
            connection_pool: {
              active: expect.any(Number),
              idle: expect.any(Number),
              max: expect.any(Number)
            }
          },
          ai_services: {
            claude: {
              status: expect.stringMatching(/operational|degraded|outage/),
              last_check: expect.any(String)
            },
            openai: {
              status: expect.stringMatching(/operational|degraded|outage/),
              last_check: expect.any(String)
            }
          },
          workers: {
            status: expect.stringMatching(/operational|degraded|outage/),
            queue_depth: expect.any(Number),
            processing_rate: expect.any(Number)
          }
        },
        incidents: expect.any(Array),
        maintenance: expect.any(Array)
      });
    });

    test('should track service level indicators (SLIs)', async () => {
      // Given: SLI tracking endpoint
      const sliHandler = require('../../pages/api/monitoring/sli.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          period: '24h'
        }
      });

      // When: Requesting SLI data
      await sliHandler.default(req, res);

      // Then: Should return SLI metrics
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        period: '24h',
        slis: {
          availability: {
            target: 99.9,
            actual: expect.any(Number),
            status: expect.stringMatching(/met|missed/)
          },
          latency: {
            target: 2000, // 2s target
            p95_actual: expect.any(Number),
            status: expect.stringMatching(/met|missed/)
          },
          error_rate: {
            target: 1.0, // 1% target
            actual: expect.any(Number),
            status: expect.stringMatching(/met|missed/)
          },
          throughput: {
            target: 100, // requests per minute
            actual: expect.any(Number),
            status: expect.stringMatching(/met|missed/)
          }
        },
        error_budget: {
          remaining: expect.any(Number),
          consumed: expect.any(Number),
          burn_rate: expect.any(Number)
        }
      });
    });

    test('should provide historical status data', async () => {
      // Given: Historical status endpoint
      const historyHandler = require('../../pages/api/monitoring/status/history.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          days: '30'
        }
      });

      // When: Requesting historical status
      await historyHandler.default(req, res);

      // Then: Should return historical data
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        period_days: 30,
        uptime_percentage: expect.any(Number),
        incidents: expect.any(Array),
        maintenance_windows: expect.any(Array),
        daily_summary: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            uptime_percentage: expect.any(Number),
            incident_count: expect.any(Number),
            avg_response_time: expect.any(Number)
          })
        ])
      });

      expect(responseData.daily_summary).toHaveLength(30);
    });

    test('should handle status page subscriber notifications', async () => {
      // Given: Subscriber notification endpoint
      const notifyHandler = require('../../pages/api/monitoring/status/notify.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          subscribers: [
            'admin@processaudit.ai',
            'ops@processaudit.ai'
          ],
          incident: {
            id: 'INC-2024-001',
            title: 'API Response Time Degradation',
            status: 'investigating',
            impact: 'minor',
            started_at: new Date().toISOString()
          }
        }
      });

      // When: Sending status notifications
      await notifyHandler.default(req, res);

      // Then: Should process notifications
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        notifications_sent: 2,
        incident_id: 'INC-2024-001',
        channels: expect.arrayContaining(['email']),
        delivery_status: expect.objectContaining({
          'admin@processaudit.ai': 'sent',
          'ops@processaudit.ai': 'sent'
        })
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed request bodies', async () => {
      // Given: Malformed JSON request
      const metricsHandler = require('../../pages/api/monitoring/metrics.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: 'invalid json {'
      });

      // When: Processing malformed request
      await metricsHandler.default(req, res);

      // Then: Should handle JSON parse error
      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        success: false,
        error: 'Invalid JSON in request body',
        details: expect.any(String)
      });
    });

    test('should handle database connection pool exhaustion', async () => {
      // Given: Database connection pool exhaustion
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('ConnectionPoolExhaustedException: No connections available');
      });

      const metricsHandler = require('../../pages/api/monitoring/metrics.js');
      const { createMocks } = require('node-mocks-http');

      const { req, res } = createMocks({
        method: 'GET'
      });

      // When: Request hits connection pool limit
      await metricsHandler.default(req, res);

      // Then: Should handle gracefully with fallback
      expect(res._getStatusCode()).toBe(503);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        success: false,
        error: 'Service temporarily unavailable',
        code: 'DATABASE_CONNECTION_EXHAUSTED',
        retry_after: 30
      });
    });

    test('should handle rate limiting scenarios', async () => {
      // Given: Rate limited request
      const rateLimitHandler = require('../../pages/api/monitoring/rate-limit-test.js');
      const { createMocks } = require('node-mocks-http');

      // Simulate multiple requests from same IP
      const requests = Array.from({ length: 101 }, (_, i) =>
        createMocks({
          method: 'GET',
          headers: {
            'x-forwarded-for': '192.168.1.100'
          }
        })
      );

      // When: Exceeding rate limits
      const responses = [];
      for (const { req, res } of requests) {
        await rateLimitHandler.default(req, res);
        responses.push({
          status: res._getStatusCode(),
          data: res._getData() ? JSON.parse(res._getData()) : null
        });
      }

      // Then: Should enforce rate limits
      const successfulResponses = responses.filter(r => r.status === 200);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(successfulResponses.length).toBeLessThanOrEqual(100); // 100 req/min limit
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Verify rate limit headers
      const rateLimitedResponse = rateLimitedResponses[0];
      expect(rateLimitedResponse.data).toMatchObject({
        error: 'Rate limit exceeded',
        retry_after: expect.any(Number),
        limit: 100,
        window: '1m'
      });
    });

    test('should handle concurrent request spikes', async () => {
      // Given: High concurrent load
      const loadTestHandler = require('../../pages/api/monitoring/load-test.js');

      // When: Sending 50 concurrent requests
      const concurrentRequests = Array.from({ length: 50 }, async (_, i) => {
        const { createMocks } = require('node-mocks-http');
        const { req, res } = createMocks({
          method: 'GET',
          query: { requestId: i }
        });

        const startTime = Date.now();
        await loadTestHandler.default(req, res);
        const endTime = Date.now();

        return {
          requestId: i,
          status: res._getStatusCode(),
          responseTime: endTime - startTime,
          data: res._getData() ? JSON.parse(res._getData()) : null
        };
      });

      const results = await Promise.all(concurrentRequests);

      // Then: Should handle concurrent load gracefully
      const successfulRequests = results.filter(r => r.status === 200);
      const failedRequests = results.filter(r => r.status >= 500);

      // At least 80% should succeed under load
      expect(successfulRequests.length).toBeGreaterThan(40);

      // Response times should be reasonable
      const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
      expect(avgResponseTime).toBeLessThan(1000); // Under 1 second average

      // Failed requests should provide useful error info
      failedRequests.forEach(request => {
        expect(request.data).toMatchObject({
          error: expect.any(String),
          code: expect.any(String),
          retry_suggested: expect.any(Boolean)
        });
      });
    });

    test('should handle memory pressure scenarios', async () => {
      // Given: Memory pressure simulation
      const memoryTestHandler = require('../../pages/api/monitoring/memory-pressure.js');
      const { createMocks } = require('node-mocks-http');

      // Simulate low memory condition
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        rss: 900 * 1024 * 1024, // 900MB RSS
        heapUsed: 850 * 1024 * 1024, // 850MB heap used
        heapTotal: 1000 * 1024 * 1024, // 1GB heap total
        external: 50 * 1024 * 1024 // 50MB external
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          simulate_memory_pressure: 'true'
        }
      });

      // When: Handling request under memory pressure
      await memoryTestHandler.default(req, res);

      // Then: Should detect and handle memory pressure
      expect(res._getStatusCode()).toBe(503);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toMatchObject({
        error: 'Service under memory pressure',
        memory_usage: {
          heap_used_mb: 850,
          heap_total_mb: 1000,
          usage_percentage: 85
        },
        retry_after: expect.any(Number),
        code: 'MEMORY_PRESSURE'
      });

      // Cleanup
      process.memoryUsage = originalMemoryUsage;
    });

    test('should validate API authentication and authorization', async () => {
      // Given: Protected monitoring endpoint
      const protectedHandler = require('../../pages/api/monitoring/admin/protected.js');
      const { createMocks } = require('node-mocks-http');

      // Test cases: no auth, invalid auth, valid auth
      const testCases = [
        { headers: {}, expectedStatus: 401, description: 'no authentication' },
        { headers: { 'authorization': 'Bearer invalid_token' }, expectedStatus: 403, description: 'invalid token' },
        { headers: { 'authorization': 'Bearer valid_admin_token' }, expectedStatus: 200, description: 'valid admin token' }
      ];

      for (const testCase of testCases) {
        const { req, res } = createMocks({
          method: 'GET',
          headers: testCase.headers
        });

        // When: Accessing protected endpoint
        await protectedHandler.default(req, res);

        // Then: Should enforce authentication
        expect(res._getStatusCode()).toBe(testCase.expectedStatus);

        if (testCase.expectedStatus !== 200) {
          const responseData = JSON.parse(res._getData());
          expect(responseData.success).toBe(false);
          expect(responseData.error).toContain('auth');
        }
      }
    });

    test('should handle API version compatibility', async () => {
      // Given: Versioned API endpoint
      const versionedHandler = require('../../pages/api/v1/monitoring/metrics.js');
      const { createMocks } = require('node-mocks-http');

      const testVersions = [
        { version: 'v1', supported: true },
        { version: 'v2', supported: false },
        { version: 'legacy', supported: false }
      ];

      for (const test of testVersions) {
        const { req, res } = createMocks({
          method: 'GET',
          headers: {
            'api-version': test.version
          }
        });

        // When: Using different API versions
        await versionedHandler.default(req, res);

        if (test.supported) {
          // Then: Supported versions should work
          expect(res._getStatusCode()).toBe(200);
        } else {
          // Unsupported versions should return appropriate error
          expect(res._getStatusCode()).toBe(400);
          const responseData = JSON.parse(res._getData());
          expect(responseData).toMatchObject({
            error: 'Unsupported API version',
            requested_version: test.version,
            supported_versions: expect.arrayContaining(['v1'])
          });
        }
      }
    });
  });
});