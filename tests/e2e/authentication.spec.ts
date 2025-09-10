import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { AuthTestContext } from '../../types/testing';

// Comprehensive Authentication Test Suite
test.describe('ProcessAudit AI Authentication System', () => {
  // Test Configuration
  const testConfig: AuthTestContext = {
    user: {
      email: faker.internet.email(),
      password: `Test${faker.internet.password({ length: 16 })}!`,
      organization: `ProcessAudit-Test-${faker.company.name()}`
    }
  };

  // Landing Page Authentication Flow
  test('Landing Page Authentication Flow', async ({ page }) => {
    await page.goto('/');

    // Check for authentication CTA buttons
    const signUpButton = page.getByRole('button', { name: /sign up/i });
    const loginButton = page.getByRole('button', { name: /log in/i });

    expect(signUpButton).toBeVisible();
    expect(loginButton).toBeVisible();
  });

  // User Registration Test
  test('User Registration with Organization', async ({ page }) => {
    await page.goto('/sign-up');

    // Fill out registration form
    await page.fill('input[name="email"]', testConfig.user.email);
    await page.fill('input[name="password"]', testConfig.user.password);
    await page.fill('input[name="organization"]', testConfig.user.organization);

    const createAccountButton = page.getByRole('button', { name: /create account/i });
    await createAccountButton.click();

    // Verify successful registration
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(testConfig.user.organization)).toBeVisible();
  });

  // Development Access Bypass
  test('Development Access Bypass', async ({ page }) => {
    await page.goto('/?access=granted');

    // Verify app access without full authentication
    await expect(page.getByTestId('process-input-section')).toBeVisible();
  });

  // Multi-Tenant Routing Test
  test('Multi-Tenant Organization Routing', async ({ page }) => {
    // Simulate different tenant subdomains
    const tenantSubdomains = [
      'processaudit', 
      'hospo-dojo', 
      'enterprise-custom'
    ];

    for (const subdomain of tenantSubdomains) {
      await page.goto(`https://${subdomain}.processaudit.ai`);

      // Verify tenant-specific branding
      await expect(page.getByTestId('tenant-logo')).toBeVisible();
      await expect(page.getByTestId('tenant-primary-color')).toHaveCSS('background-color');
    }
  });

  // Error Scenarios
  test('Authentication Error Handling', async ({ page }) => {
    await page.goto('/sign-in');

    // Attempt login with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');

    const loginButton = page.getByRole('button', { name: /log in/i });
    await loginButton.click();

    // Verify error message display
    const errorMessage = page.getByTestId('auth-error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/invalid credentials/i);
  });
});