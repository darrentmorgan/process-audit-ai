# Monitoring Infrastructure Test Suite
**ProcessAudit AI - Comprehensive Monitoring & Multi-Tenant Testing**

This test suite provides comprehensive coverage for ProcessAudit AI's monitoring infrastructure, focusing on enterprise-grade reliability, multi-tenant security, and performance requirements compliance.

## 🎯 Test Coverage Overview

### Core Test Areas
- **PagerDuty Integration**: Alert escalation, incident management, service key validation
- **Slack Integration**: Webhook delivery, message formatting, channel routing
- **Multi-Tenant Isolation**: Data segregation, plan-based restrictions, cross-tenant security
- **API Endpoints**: Health checks, metrics validation, system status, error handling
- **Performance Requirements**: Response times, load testing, resource monitoring
- **Manual Validation**: Human-verified procedures for complex workflows

### Test Statistics
- **Total Test Files**: 6
- **Automated Tests**: 120+
- **Manual Procedures**: 15+
- **Performance Benchmarks**: 25+
- **Security Validations**: 30+

---

## 📁 Test Suite Structure

```
__tests__/monitoring/
├── pagerduty-integration.test.js      # PagerDuty alerting tests
├── slack-integration.test.js          # Slack notification tests
├── multitenant-isolation.test.js      # Multi-tenant security tests
├── api-endpoints.test.js              # API reliability tests
├── performance-requirements.test.js   # Performance compliance tests
├── manual-validation-procedures.md    # Human validation steps
└── README.md                          # This file
```

---

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Set test environment variables
cp .env.test.example .env.test

# Required environment variables
NEXT_PUBLIC_USE_CLERK_AUTH=true
PAGERDUTY_SERVICE_KEY=test_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/test
SUPABASE_SERVICE_KEY=test_service_key
```

### Individual Test Suites

```bash
# PagerDuty Integration Tests
npm test __tests__/monitoring/pagerduty-integration.test.js

# Slack Integration Tests
npm test __tests__/monitoring/slack-integration.test.js

# Multi-Tenant Isolation Tests
npm test __tests__/monitoring/multitenant-isolation.test.js

# API Endpoint Tests
npm test __tests__/monitoring/api-endpoints.test.js

# Performance Requirements Tests
npm test __tests__/monitoring/performance-requirements.test.js
```

### Complete Monitoring Test Suite

```bash
# Run all monitoring tests
npm run test:monitoring

# Run with coverage report
npm run test:monitoring:coverage

# Run in watch mode for development
npm run test:monitoring:watch
```

### Performance & Load Testing

```bash
# Quick performance validation
npm run test:performance:quick

# Full load testing suite
npm run test:performance:full

# Memory leak detection
npm run test:performance:memory
```

---

## 📊 Test Categories

### 1. PagerDuty Integration Tests (`pagerduty-integration.test.js`)

**Coverage Areas**:
- Alert escalation workflows
- Critical incident handling
- Service key validation
- Incident acknowledgment and resolution

**Key Test Scenarios**:
- System down alert escalation
- Security incident immediate escalation
- Performance degradation threshold alerts
- Error rate spike handling
- Integration failure recovery

**Given-When-Then Examples**:
```javascript
// Example test structure
test('should escalate critical system down alert to PagerDuty', async () => {
  // Given: System health check failure
  const criticalAlert = {
    alertname: 'ProcessAuditSystemDown',
    severity: 'critical',
    description: 'Health check endpoint returning 503 for >2 minutes'
  };

  // When: Alert is sent to PagerDuty webhook
  await alertmanagerWebhook.handler(req, res);

  // Then: PagerDuty incident should be created
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('api.pagerduty.com/incidents'),
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': expect.stringContaining('Token token=')
      })
    })
  );
});
```

### 2. Slack Integration Tests (`slack-integration.test.js`)

**Coverage Areas**:
- Webhook delivery validation
- Message formatting verification
- Channel routing accuracy
- Rich attachment rendering

**Key Features Tested**:
- Critical/warning/business/security alert routing
- Message size limits and truncation
- Interactive button functionality
- Multi-tenant context in messages
- Rate limiting and batch delivery
- Error handling and fallback channels

### 3. Multi-Tenant Isolation Tests (`multitenant-isolation.test.js`)

**Coverage Areas**:
- Complete data isolation verification
- Organization-specific feature access
- Plan-based restrictions enforcement
- Cross-tenant security validation

**Security Validations**:
- Database RLS policy enforcement
- Organization context validation
- Plan feature restriction
- Cross-tenant access prevention
- Worker organization isolation
- Audit logging of violations

### 4. API Endpoints Tests (`api-endpoints.test.js`)

**Coverage Areas**:
- All health check endpoints
- Metrics endpoint validation
- System status API testing
- Error handling and edge cases

**Endpoints Tested**:
- `/api/health` - Basic health check
- `/api/health/deep` - Comprehensive system check
- `/api/monitoring/metrics` - System metrics
- `/api/monitoring/status` - System status
- `/api/monitoring/sli` - Service level indicators

### 5. Performance Requirements Tests (`performance-requirements.test.js`)

**Coverage Areas**:
- API response time validation (P95 < 2s, P99 < 5s)
- Concurrent request handling (100+ concurrent)
- Memory usage monitoring and leak detection
- Database query performance
- Scalability validation

**Performance Benchmarks**:
```javascript
const PERFORMANCE_THRESHOLDS = {
  api_response_time: {
    p95: 2000, // 95th percentile under 2 seconds
    p99: 5000, // 99th percentile under 5 seconds
    average: 1000 // Average under 1 second
  },
  concurrent_requests: {
    target: 100, // Handle 100 concurrent requests
    success_rate: 0.95 // 95% success rate under load
  }
};
```

---

## 🔧 Test Configuration

### Jest Configuration (`jest.config.monitoring.js`)

```javascript
module.exports = {
  displayName: 'Monitoring Infrastructure Tests',
  testMatch: ['**/__tests__/monitoring/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.monitoring.js'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    'pages/api/health/**/*.js',
    'pages/api/monitoring/**/*.js',
    'utils/monitoring/**/*.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80
    }
  }
};
```

### Environment Variables

**Required for Tests**:
```bash
# Authentication
NEXT_PUBLIC_USE_CLERK_AUTH=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_123
CLERK_SECRET_KEY=sk_test_123

# Database
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
SUPABASE_SERVICE_ROLE_KEY=test_service_key

# Monitoring Services
PAGERDUTY_SERVICE_KEY=test_pagerduty_key
PAGERDUTY_SECURITY_SERVICE_KEY=test_security_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/test/webhook
SLACK_ALERTS_CRITICAL=https://hooks.slack.com/alerts/critical

# AI Services
ANTHROPIC_API_KEY=test_anthropic_key
OPENAI_API_KEY=test_openai_key

# Performance Testing
PERFORMANCE_MONITORING_ENABLED=true
```

---

## 📈 Monitoring Test Metrics

### Coverage Targets
- **Line Coverage**: 80%+
- **Branch Coverage**: 80%+
- **Function Coverage**: 85%+
- **Statement Coverage**: 80%+

### Performance Benchmarks
- **API Response Time**: P95 < 2s, P99 < 5s
- **Health Check Time**: Basic < 100ms, Deep < 5s
- **Concurrent Handling**: 100+ requests with 95% success
- **Memory Usage**: <512MB baseline, <1GB under load
- **Database Queries**: Simple < 100ms, Complex < 1s

### Security Validations
- **Data Isolation**: 100% between organizations
- **Plan Restrictions**: Enforced for all feature tiers
- **Access Controls**: No cross-tenant data leakage
- **Audit Logging**: All violations captured

---

## 🔍 Debugging Test Failures

### Common Issues and Solutions

**1. PagerDuty Tests Failing**
```bash
# Check service key configuration
echo $PAGERDUTY_SERVICE_KEY

# Verify network connectivity
curl -I https://api.pagerduty.com

# Check test environment isolation
npm run test:pagerduty -- --verbose
```

**2. Slack Integration Issues**
```bash
# Validate webhook URLs
npm run validate:slack-config

# Test webhook delivery
curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"Test"}'

# Debug message formatting
npm run test:slack -- --verbose
```

**3. Performance Test Failures**
```bash
# Check baseline performance
npm run perf:baseline

# Monitor memory during tests
npm run test:performance:memory -- --detect-leaks

# Profile slow tests
npm run test:performance -- --verbose --detectSlowTests
```

**4. Multi-Tenant Isolation Issues**
```bash
# Verify RLS policies
npm run db:test-rls

# Check organization context
npm run test:multitenant -- --verbose

# Validate auth mocking
npm run test:auth:debug
```

### Test Output Analysis

**Coverage Report**: `./coverage/monitoring/html/index.html`
```bash
# Generate and view coverage
npm run test:monitoring:coverage
open ./coverage/monitoring/html/index.html
```

**Performance Report**: `./test-results/performance-report.json`
```bash
# Generate performance report
npm run test:performance:report

# View detailed metrics
cat ./test-results/performance-report.json | jq '.metrics'
```

---

## 🎛️ Manual Testing Integration

### When to Use Manual Tests
- Visual validation of Slack message formatting
- End-to-end incident response workflows
- Complex multi-step escalation scenarios
- User interface monitoring dashboards
- Real-world load testing scenarios

### Manual Test Execution
```bash
# Start test environment
npm run test:env:start

# Run manual test procedures
npm run test:manual

# Generate manual test report
npm run test:manual:report
```

See [manual-validation-procedures.md](./manual-validation-procedures.md) for detailed steps.

---

## 📋 Test Maintenance

### Updating Tests for New Features

**1. Adding New Monitoring Endpoints**:
```javascript
// Add to api-endpoints.test.js
describe('New Endpoint Tests', () => {
  test('should handle new endpoint properly', async () => {
    // Test implementation
  });
});
```

**2. Adding New Alert Types**:
```javascript
// Add to pagerduty-integration.test.js and slack-integration.test.js
test('should handle new alert type', async () => {
  // PagerDuty escalation test
  // Slack formatting test
});
```

**3. Adding New Plan Features**:
```javascript
// Add to multitenant-isolation.test.js
test('should enforce new plan restrictions', async () => {
  // Plan limitation test
});
```

### Test Data Management

**Clean Test Data**:
```bash
# Reset test database
npm run test:db:reset

# Clear test alerts
npm run test:alerts:cleanup

# Reset monitoring state
npm run test:monitoring:reset
```

### Continuous Integration

**GitHub Actions Integration**:
```yaml
# .github/workflows/monitoring-tests.yml
name: Monitoring Tests
on: [push, pull_request]
jobs:
  monitoring-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run monitoring tests
        run: npm run test:monitoring:ci
        env:
          PAGERDUTY_SERVICE_KEY: ${{ secrets.PAGERDUTY_TEST_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_TEST_WEBHOOK }}
```

---

## 🎯 Quality Gates

### Pre-Deployment Checklist
- [ ] All monitoring tests passing
- [ ] Performance benchmarks met
- [ ] Security validations passed
- [ ] Multi-tenant isolation verified
- [ ] Manual procedures validated
- [ ] Coverage thresholds met

### Monitoring Health Validation
- [ ] PagerDuty integration functional
- [ ] Slack notifications working
- [ ] Health checks responding
- [ ] Metrics collection active
- [ ] Multi-tenant data isolated

---

## 📞 Support and Contact

**Test Suite Maintainer**: ProcessAudit AI Development Team
**Documentation**: [docs.processaudit.ai/testing](https://docs.processaudit.ai/testing)
**Issues**: [GitHub Issues](https://github.com/processaudit/processaudit-ai/issues)

For questions about monitoring tests or infrastructure, please refer to the development team or create an issue with the `monitoring-tests` label.