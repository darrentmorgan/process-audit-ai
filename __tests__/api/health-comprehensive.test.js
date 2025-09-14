/**
 * Comprehensive Health Endpoint Tests
 * ProcessAudit AI - Health Monitoring Validation
 */

import { jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';

describe('Health Endpoint Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Health Endpoint', () => {
    test('should return healthy status', async () => {
      const healthHandler = require('../../pages/api/health.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await healthHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.status).toBe('healthy');
      expect(responseData.timestamp).toBeDefined();
      expect(responseData.service).toBe('processaudit-api');
    });

    test('should handle health check errors', async () => {
      // Test error handling in health endpoint
      const healthHandler = require('../../pages/api/health.js').default;
      const { req, res } = createMocks({
        method: 'POST' // Unsupported method
      });

      await healthHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe('Deep Health Endpoint', () => {
    test('should return comprehensive health status', async () => {
      const deepHealthHandler = require('../../pages/api/health/deep.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await deepHealthHandler(req, res);

      const responseData = JSON.parse(res._getData());

      // Should include multiple health checks
      expect(responseData.status).toBeDefined();
      expect(responseData.checks).toBeDefined();
      expect(typeof responseData.checks).toBe('object');
    });

    test('should validate database connectivity check', async () => {
      const deepHealthHandler = require('../../pages/api/health/deep.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await deepHealthHandler(req, res);

      const responseData = JSON.parse(res._getData());

      // Should include database health check
      expect(responseData.checks.database).toBeDefined();
    });

    test('should validate AI provider health checks', async () => {
      const deepHealthHandler = require('../../pages/api/health/deep.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await deepHealthHandler(req, res);

      const responseData = JSON.parse(res._getData());

      // Should include AI provider health checks
      expect(responseData.checks.claude || responseData.checks.openai).toBeDefined();
    });
  });

  describe('System Status Endpoint', () => {
    test('should return system status information', async () => {
      const statusHandler = require('../../pages/api/system-status.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await statusHandler(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.system).toBeDefined();
    });
  });

  describe('Metrics Endpoint', () => {
    test('should return Prometheus metrics', async () => {
      const metricsHandler = require('../../pages/api/metrics.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await metricsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-type']).toBe('text/plain');

      const metricsData = res._getData();
      expect(typeof metricsData).toBe('string');
      expect(metricsData.length).toBeGreaterThan(0);
    });

    test('should include ProcessAudit AI specific metrics', async () => {
      const metricsHandler = require('../../pages/api/metrics.js').default;
      const { req, res } = createMocks({
        method: 'GET'
      });

      await metricsHandler(req, res);

      const metricsData = res._getData();

      // Should include basic Node.js metrics
      expect(metricsData).toContain('nodejs_');
      // Should include HTTP metrics
      expect(metricsData).toContain('http_');
    });
  });
});