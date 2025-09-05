# Authentication Test Suite Documentation
**ProcessAudit AI - Clerk Migration Phase 4 Testing**

This directory contains comprehensive test coverage for ProcessAudit AI's migration to Clerk-only authentication system.

## Test Structure

### 1. Unit Tests (`contexts/UnifiedAuthContext.test.js`)
Tests the core authentication context functionality:

**Coverage:**
- ✅ Context provider initialization and error handling
- ✅ Authentication state management (signed in/out/loading)
- ✅ Organization state and admin role detection
- ✅ Organization context detection from URL/domain
- ✅ Organization switching functionality
- ✅ API compatibility with legacy method signatures
- ✅ Configuration detection and validation
- ✅ Utility functions (getOrganizationContext, isOrganizationsEnabled)

**Mock Strategy:**
- Mocks Clerk hooks (`useAuth`, `useOrganization`, `useOrganizationList`)
- Mocks ClerkAuthBridge component
- Mocks Next.js router
- Uses global test helpers for creating mock objects

### 2. Authentication Flow Tests (`auth/auth-flows.test.js`)
Tests authentication flows and integration:

**Coverage:**
- ✅ Sign-up component rendering and redirect handling
- ✅ Sign-in component rendering and redirect handling  
- ✅ Organization context preservation during auth flows
- ✅ Post-authentication organization resolution
- ✅ Error scenario handling (loading states, failures)
- ✅ Navigation and routing integration
- ✅ URL parameter handling and security validation

**Mock Strategy:**
- Mocks Clerk components (`SignIn`, `SignUp`, Clerk buttons)
- Mocks authentication hooks with various states
- Simulates window.location for URL testing
- Tests component integration within ClerkAuthBridge

### 3. Component Integration Tests (`components/auth-components.test.js`)
Tests component integration with authentication:

**Coverage:**
- ✅ LandingPage authentication CTAs and routing
- ✅ UserMenu authentication states and organization switching
- ✅ ProcessAuditApp authentication requirements
- ✅ Cross-component authentication state consistency
- ✅ Error handling across components
- ✅ Configuration changes and loading states

**Mock Strategy:**
- Mocks all Clerk UI components
- Mocks dependent components (ProcessAuditApp, Logo)
- Tests full component tree integration
- Simulates user interactions with userEvent

### 4. TypeScript Type Tests (`types/auth-types.test.ts`)
Tests TypeScript type definitions and type safety:

**Coverage:**
- ✅ Type guards for ClerkUser, AuthError, OrganizationIdentifier
- ✅ Type conversion functions (clerkUserToUser, clerkOrgToOrganization)
- ✅ Interface compatibility and backward compatibility
- ✅ Default state creation and validation
- ✅ Constants and configuration validation
- ✅ Error type handling and validation

**Testing Approach:**
- Direct TypeScript compilation testing
- Runtime type validation testing
- Type guard functionality verification
- Interface compatibility verification

### 5. E2E Authentication Tests (`../tests/e2e-auth-flow.spec.js`)
End-to-end authentication flow testing:

**Coverage:**
- ✅ Complete sign-up journey from landing page
- ✅ Complete sign-in journey with redirects
- ✅ Authentication state persistence
- ✅ Organization selection and switching
- ✅ Multi-tenant routing scenarios
- ✅ Error scenarios and graceful degradation
- ✅ Mobile responsiveness and accessibility
- ✅ Security validation (XSS prevention, URL sanitization)

**Testing Strategy:**
- Uses Playwright for browser automation
- Tests real browser interactions
- Validates visual elements and user flows
- Tests across different viewport sizes

## Running the Tests

### Individual Test Suites

```bash
# Unit tests (UnifiedAuthContext)
npm test __tests__/contexts/UnifiedAuthContext.test.js

# Authentication flow tests  
npm test __tests__/auth/auth-flows.test.js

# Component integration tests
npm test __tests__/components/auth-components.test.js

# TypeScript type tests
npm test __tests__/types/auth-types.test.ts

# E2E authentication tests
npm run test:e2e tests/e2e-auth-flow.spec.js
```

### Full Authentication Test Suite

```bash
# Run all authentication-related tests
npm test __tests__/contexts/ __tests__/auth/ __tests__/components/ __tests__/types/

# Run with coverage
npm run test:coverage

# Run all tests including E2E
npm run test:all
```

### Watch Mode for Development

```bash
# Watch unit tests during development
npm run test:watch -- __tests__/contexts/ __tests__/auth/

# Watch TypeScript tests
npm run test:watch -- __tests__/types/
```

## Test Configuration

### Environment Variables Required

```bash
# Clerk Configuration (for configuration detection tests)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_mock
CLERK_SECRET_KEY=sk_test_mock

# E2E Test Configuration  
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@processaudit.ai
TEST_USER_PASSWORD=TestPassword123!
```

### Jest Configuration
Tests use the existing Jest configuration in `jest.config.js` with:
- jsdom environment for React components
- Next.js integration for proper module resolution
- Custom test helpers for mock object creation
- Extended matchers for organization testing

### Playwright Configuration
E2E tests use Playwright with:
- Chromium browser for consistency
- Network idle waiting for reliable testing
- Cookie clearing between tests for isolation
- Mobile viewport testing for responsiveness

## Mock Objects and Test Helpers

### Global Test Helpers (from `jest.setup.js`)

```javascript
// Available in all tests
global.testHelpers.createMockOrganization(overrides)
global.testHelpers.createMockUser(overrides)  
global.testHelpers.createMockMembership(overrides)
global.testHelpers.waitFor(callback, timeout)
```

### Custom Matchers

```javascript
// Organization-specific matchers
expect(slug).toBeValidOrganizationSlug()
expect(email).toBeValidEmail()
expect(membership).toHaveOrganizationRole('admin')
```

## Coverage Goals

### Target Coverage Metrics
- **Lines**: 80%+ for authentication components
- **Branches**: 80%+ for authentication logic
- **Functions**: 85%+ for authentication methods
- **Statements**: 80%+ for authentication code

### Critical Paths Covered
1. ✅ User authentication state transitions
2. ✅ Organization context detection and switching
3. ✅ Error handling and recovery scenarios
4. ✅ URL routing and redirect handling
5. ✅ Multi-tenant organization isolation
6. ✅ Component integration and state consistency

## Debugging Tests

### Common Issues and Solutions

1. **Clerk Hook Mocking Issues**
   ```javascript
   // Ensure proper mock order
   jest.mock('@clerk/nextjs')
   jest.mock('../../components/ClerkAuthBridge') 
   // Use beforeEach to reset mocks
   ```

2. **Window Location Mocking**
   ```javascript
   // Reset window.location in beforeEach
   Object.defineProperty(window, 'location', {
     writable: true,
     value: { hostname: 'localhost', pathname: '/' }
   })
   ```

3. **Async State Updates**
   ```javascript
   // Use act() for state updates
   import { act } from '@testing-library/react'
   await act(async () => {
     await result.current.switchOrganization('org_123')
   })
   ```

4. **TypeScript Import Issues**
   ```javascript
   // Use proper import syntax for types
   import type { ClerkUser } from '../../types/auth'
   // Or use typeof for runtime values
   import { isClerkUser } from '../../types/auth'
   ```

### Test Output Analysis

Tests generate detailed output including:
- HTML coverage reports (`./coverage/html-report/report.html`)
- Jest test results with failure details
- Playwright test reports with screenshots
- Console logs for debugging (use `console.log` in tests)

## Integration with CI/CD

### GitHub Actions Integration
```yaml
- name: Run Authentication Tests
  run: |
    npm run test:ci __tests__/contexts/ __tests__/auth/ __tests__/components/ __tests__/types/
    npm run test:e2e tests/e2e-auth-flow.spec.js
```

### Quality Gates
- All authentication tests must pass before deployment
- Coverage must meet minimum thresholds
- No console errors in E2E tests
- TypeScript compilation must succeed

## Maintenance and Updates

### When to Update Tests
1. **Adding new authentication features**
   - Add unit tests for new context methods
   - Add integration tests for new components
   - Update E2E tests for new user flows

2. **Modifying organization functionality**
   - Update organization switching tests
   - Update multi-tenant routing tests
   - Update type definitions and tests

3. **Clerk API changes**
   - Update mock implementations
   - Update type definitions
   - Update integration tests

### Test Review Checklist
- [ ] All authentication states covered
- [ ] Error scenarios handled
- [ ] Organization context preserved
- [ ] Type safety maintained
- [ ] E2E flows complete
- [ ] Mobile compatibility verified
- [ ] Security validations included
- [ ] Performance considerations addressed