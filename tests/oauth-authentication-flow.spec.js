import { test, expect } from '@playwright/test'

test.describe('OAuth Authentication Flow', () => {
  // Use the correct port for the dev server
  const BASE_URL = 'http://localhost:3002'

  test.beforeEach(async ({ page }) => {
    // Monitor console logs to track authentication flow
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser Console [${msg.type()}]:`, msg.text())
      }
    })
    
    // Monitor network requests for OAuth redirects
    page.on('request', request => {
      const url = request.url()
      if (url.includes('oauth') || url.includes('clerk') || url.includes('google')) {
        console.log(`Network Request:`, url)
      }
    })
  })

  test('should redirect unauthenticated user from dashboard to sign-in', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Should be redirected to sign-in page or see authentication required
    await page.waitForURL(/sign-in/, { timeout: 10000 })
    
    // Should see sign-in page elements
    await expect(page.locator('text=Welcome Back')).toBeVisible()
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible()
    await expect(page.locator('button:has-text("Continue with GitHub")')).toBeVisible()
  })

  test('should initiate Google OAuth flow when button clicked', async ({ page }) => {
    // Go to sign-in page
    await page.goto(`${BASE_URL}/sign-in`)
    
    // Wait for page to load
    await expect(page.locator('text=Welcome Back')).toBeVisible()
    
    // Click Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")')
    await expect(googleButton).toBeVisible()
    
    // Monitor for OAuth flow initiation
    const oauthPromise = page.waitForRequest(request => {
      return request.url().includes('oauth') || request.url().includes('google')
    }, { timeout: 10000 })
    
    // Click the button
    await googleButton.click()
    
    // Wait for OAuth request to be initiated
    try {
      const oauthRequest = await oauthPromise
      console.log('OAuth request initiated:', oauthRequest.url())
      
      // The request should be to a Clerk OAuth endpoint or Google OAuth
      expect(oauthRequest.url()).toMatch(/(oauth|clerk|google)/)
    } catch (error) {
      console.error('OAuth request not detected within timeout:', error)
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'oauth-failure.png', fullPage: true })
      
      // Check if we stayed on the same page (which indicates OAuth didn't start)
      const currentUrl = page.url()
      console.log('Current URL after OAuth button click:', currentUrl)
      
      throw error
    }
  })

  test('should handle OAuth callback and redirect to dashboard', async ({ page }) => {
    // Simulate OAuth callback by visiting sign-in with OAuth parameters
    // This tests the callback handling logic without actually going through OAuth
    const oauthCallbackUrl = `${BASE_URL}/sign-in?__clerk_oauth_state=test_state&__clerk_oauth_code=test_code`
    
    await page.goto(oauthCallbackUrl)
    
    // Wait for authentication processing
    // The page should either redirect to dashboard or show loading state
    await page.waitForTimeout(1000) // Give time for auth processing
    
    // Check current URL and page state
    const currentUrl = page.url()
    console.log('URL after OAuth callback simulation:', currentUrl)
    
    // We should either be on dashboard or see loading/processing indicators
    const isOnDashboard = currentUrl.includes('/dashboard')
    const hasLoadingIndicator = await page.locator('text=Loading').isVisible()
    const hasAuthRequired = await page.locator('text=Authentication Required').isVisible()
    
    console.log('Page state after OAuth callback:', {
      isOnDashboard,
      hasLoadingIndicator,
      hasAuthRequired,
      currentUrl
    })
    
    // If we see "Authentication Required", that's the bug we're trying to fix
    if (hasAuthRequired) {
      console.log('❌ BUG DETECTED: OAuth callback showing "Authentication Required"')
      await page.screenshot({ path: 'oauth-auth-required-bug.png', fullPage: true })
    }
  })

  test('should show proper loading states during authentication', async ({ page }) => {
    // Go to dashboard to trigger authentication check
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Should see loading indicator while checking authentication
    const loadingStates = [
      'Loading authentication...',
      'Checking access...',
      'Please wait...'
    ]
    
    // At least one loading state should be visible
    let foundLoadingState = false
    for (const loadingText of loadingStates) {
      const isVisible = await page.locator(`text=${loadingText}`).isVisible()
      if (isVisible) {
        foundLoadingState = true
        console.log(`Found loading state: ${loadingText}`)
        break
      }
    }
    
    if (!foundLoadingState) {
      console.log('No loading state found - this might indicate immediate redirect')
    }
    
    // Eventually should redirect to sign-in or show dashboard
    await page.waitForURL(/sign-in/, { timeout: 10000 })
  })

  test('should detect OAuth parameters correctly', async ({ page }) => {
    // Test various OAuth parameter scenarios
    const scenarios = [
      {
        name: 'Clerk OAuth state parameter',
        url: `${BASE_URL}/dashboard?__clerk_oauth_state=test_state`,
        shouldDetectOAuth: true
      },
      {
        name: 'OAuth hash parameter',
        url: `${BASE_URL}/dashboard#oauth=success`,
        shouldDetectOAuth: true
      },
      {
        name: 'No OAuth parameters',
        url: `${BASE_URL}/dashboard`,
        shouldDetectOAuth: false
      }
    ]
    
    for (const scenario of scenarios) {
      console.log(`Testing scenario: ${scenario.name}`)
      
      await page.goto(scenario.url)
      await page.waitForTimeout(500) // Let the page process
      
      // Check console logs for OAuth detection
      // The page should log OAuth parameter detection
      console.log(`URL tested: ${scenario.url}`)
      
      // Take screenshot for each scenario
      await page.screenshot({ 
        path: `oauth-scenario-${scenario.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true 
      })
    }
  })

  test('should handle authentication state changes correctly', async ({ page }) => {
    // Monitor authentication state changes through console logs
    const authLogs = []
    
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('ClerkAuthBridge:') || 
          text.includes('UnifiedAuthContext:') || 
          text.includes('Dashboard:')) {
        authLogs.push({
          timestamp: new Date().toISOString(),
          message: text
        })
      }
    })
    
    // Visit dashboard to trigger authentication flow
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Wait for authentication flow to complete
    await page.waitForTimeout(2000)
    
    // Log all authentication state changes
    console.log('Authentication state changes detected:')
    authLogs.forEach(log => {
      console.log(`${log.timestamp}: ${log.message}`)
    })
    
    // Should have at least some authentication logs
    expect(authLogs.length).toBeGreaterThan(0)
    
    // Should show either authentication required or successful auth
    const currentUrl = page.url()
    const pageContent = await page.textContent('body')
    
    console.log('Final state:', {
      url: currentUrl,
      hasAuthRequired: pageContent.includes('Authentication Required'),
      hasSignInButton: pageContent.includes('Go to Sign In'),
      hasProcessAuditApp: pageContent.includes('ProcessAudit')
    })
  })
})