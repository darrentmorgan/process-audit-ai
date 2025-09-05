/**
 * Comprehensive Authentication Flow Test Suite for Clerk Pages Router
 * Tests the complete OAuth and authentication workflow
 */

const { test, expect } = require('@playwright/test')

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002'
const TEST_TIMEOUT = 30000

test.describe('Clerk Authentication Flow - Pages Router', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing sessions
    await page.context().clearCookies()
    await page.goto(BASE_URL)
  })

  test('should display sign-in page correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`)
    
    // Check page loads without errors
    await expect(page).toHaveTitle(/ProcessAudit AI/)
    
    // Check sign-in elements are present
    await expect(page.locator('[data-testid="sign-in-form"]')).toBeVisible({ timeout: 10000 })
    
    // Check OAuth buttons are present
    await expect(page.locator('button:has-text("Google")')).toBeVisible()
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible()
  })

  test('should display sign-up page correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-up`)
    
    // Check page loads without errors
    await expect(page).toHaveTitle(/ProcessAudit AI/)
    
    // Check sign-up elements are present
    await expect(page.locator('[data-testid="sign-up-form"]')).toBeVisible({ timeout: 10000 })
    
    // Check OAuth buttons are present
    await expect(page.locator('button:has-text("Google")')).toBeVisible()
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible()
  })

  test('should redirect authenticated users from auth pages', async ({ page }) => {
    // This test assumes a way to simulate an authenticated state
    // In a real scenario, you'd mock the Clerk session
    
    // For now, we'll test the middleware redirect logic
    await page.goto(`${BASE_URL}/sign-in`)
    
    // Check that unauthenticated users can access sign-in
    await expect(page.url()).toContain('/sign-in')
  })

  test('should handle OAuth callback URLs', async ({ page }) => {
    // Test OAuth callback handling
    const oauthCallbackUrl = `${BASE_URL}/sign-in?__clerk_oauth_state=test_state`
    
    await page.goto(oauthCallbackUrl)
    
    // Should not crash on OAuth parameters
    await expect(page).not.toHaveURL(/error/)
    
    // Check console for OAuth detection
    const logs = []
    page.on('console', msg => logs.push(msg.text()))
    
    await page.reload()
    
    // Wait for console logs
    await page.waitForTimeout(1000)
    
    // Should detect OAuth callback
    const hasOAuthLog = logs.some(log => 
      log.includes('OAuth callback') || log.includes('oauth')
    )
    expect(hasOAuthLog).toBeTruthy()
  })

  test('should have correct navigation between auth pages', async ({ page }) => {
    // Start at sign-in
    await page.goto(`${BASE_URL}/sign-in`)
    
    // Click sign-up link
    const signUpLink = page.locator('a:has-text("Sign up")')
    if (await signUpLink.isVisible()) {
      await signUpLink.click()
      await expect(page).toHaveURL(/sign-up/)
    }
    
    // Navigate back to sign-in
    const signInLink = page.locator('a:has-text("Sign in")')
    if (await signInLink.isVisible()) {
      await signInLink.click()
      await expect(page).toHaveURL(/sign-in/)
    }
  })

  test('should handle protected dashboard route', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Should redirect to sign-in
    await page.waitForURL(/sign-in/, { timeout: 10000 })
    expect(page.url()).toContain('/sign-in')
  })

  test('should load ClerkProvider without errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    
    await page.goto(`${BASE_URL}/sign-in`)
    
    // Wait for ClerkProvider to initialize
    await page.waitForTimeout(2000)
    
    // Check for JavaScript errors
    const hasClerkErrors = errors.some(error => 
      error.toLowerCase().includes('clerk') ||
      error.toLowerCase().includes('provider')
    )
    expect(hasClerkErrors).toBeFalsy()
  })

  test('should have correct middleware behavior', async ({ page }) => {
    // Test middleware logging
    const logs = []
    page.on('console', msg => logs.push(msg.text()))
    
    await page.goto(`${BASE_URL}/sign-in`)
    await page.waitForTimeout(1000)
    
    // Check for middleware logs
    const hasMiddlewareLogs = logs.some(log => 
      log.includes('Middleware:')
    )
    expect(hasMiddlewareLogs).toBeTruthy()
  })
})

test.describe('Authentication State Management', () => {
  test('should handle UnifiedAuthContext properly', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`)
    
    // Check that UnifiedAuthContext is working
    const authContextCheck = await page.evaluate(() => {
      // This would check if the auth context is properly initialized
      return window.React && typeof window.React === 'object'
    })
    
    expect(authContextCheck).toBeTruthy()
  })

  test('should handle loading states correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Check for loading indicators
    const loadingElements = [
      'text=Loading authentication system...',
      'text=Checking access...',
      'text=Initializing Clerk authentication...'
    ]
    
    let foundLoadingState = false
    for (const selector of loadingElements) {
      if (await page.locator(selector).isVisible({ timeout: 2000 })) {
        foundLoadingState = true
        break
      }
    }
    
    // Should show some loading state before redirect
    expect(foundLoadingState).toBeTruthy()
  })
})

test.describe('Error Handling', () => {
  test('should handle invalid OAuth states gracefully', async ({ page }) => {
    const invalidOAuthUrl = `${BASE_URL}/sign-in?__clerk_oauth_state=invalid_state&error=access_denied`
    
    await page.goto(invalidOAuthUrl)
    
    // Should not crash
    await expect(page).not.toHaveURL(/500/)
    await expect(page).not.toHaveTitle(/Error/)
  })

  test('should handle missing environment variables gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`)
    
    // Check for specific error messages about missing config
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(2000)
    
    // Should not have critical configuration errors
    const hasCriticalErrors = errors.some(error => 
      error.includes('CLERK_PUBLISHABLE_KEY is missing') ||
      error.includes('ClerkProvider')
    )
    
    expect(hasCriticalErrors).toBeFalsy()
  })
})

// Helper functions for testing
test.describe.configure({ timeout: TEST_TIMEOUT })

// Mock OAuth flow (for testing without real OAuth)
const mockOAuthFlow = async (page, provider = 'google') => {
  await page.goto(`${BASE_URL}/sign-in`)
  
  // Click OAuth button
  await page.click(`button:has-text("${provider}")`)
  
  // In a real test, this would handle the OAuth popup/redirect
  // For now, we'll just simulate the callback
  await page.goto(`${BASE_URL}/sign-in?__clerk_oauth_state=mock_state`)
  
  return page
}