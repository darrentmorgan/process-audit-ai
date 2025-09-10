# ProcessAudit AI E2E Testing Infrastructure

## Overview

This directory contains the comprehensive End-to-End (E2E) testing suite for ProcessAudit AI, built with Playwright and TypeScript. Our testing strategy focuses on thorough validation of user journeys, system integrations, and critical workflows.

## Test Coverage

### Authentication Tests
- Landing page CTA verification
- User registration with organization
- Development access bypass
- Multi-tenant routing
- Error handling scenarios

### Planned Test Suites
- Core Workflow Testing
- PDF Generation Validation
- SOP Workflow Testing
- Automation Generation Testing
- Error & Resilience Testing
- Performance Benchmarking
- Security Validation

## Setup & Running Tests

### Prerequisites
- Node.js 18+
- npm 8+
- Playwright browsers installed

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Debug mode
npm run test:e2e:debug

# UI Test Runner
npm run test:e2e:ui

# Generate HTML report
npm run test:e2e:report
```

## Test Configuration

All tests are configured via `playwright.config.ts`, which includes:
- Browser configurations
- Global timeouts
- Reporting settings
- Test environment variables

## Test Utilities

`tests/e2e/utils/test-helpers.ts` provides comprehensive utilities:
- Random test user generation
- Screenshot capture
- Network condition simulation
- Mock file generation

## Best Practices

- Use realistic test data
- Cover both happy paths and error scenarios
- Maintain test isolation
- Provide comprehensive assertions
- Log detailed test metadata

## Continuous Integration

Tests are integrated into the CI/CD pipeline and will run automatically on:
- Pull Request creation
- Main branch merges
- Scheduled intervals

## Reporting

- HTML reports generated after test runs
- JSON output for machine parsing
- Screenshots captured for failed tests

## Contributing

1. Write tests following existing patterns
2. Use TypeScript with strict typing
3. Cover critical user journeys
4. Keep tests fast and reliable

## Troubleshooting

- Ensure all environment variables are set
- Check network connectivity
- Verify browser dependencies
- Use debug mode for detailed insights

## License

Part of the ProcessAudit AI testing infrastructure. 
See project root for licensing details.