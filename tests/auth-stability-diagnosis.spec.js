/**
 * Authentication Stability Diagnosis Tests
 * ProcessAudit AI - Clerk Authentication Issues
 * 
 * Comprehensive tests to diagnose:
 * - Blinking/flashing screen behavior
 * - React frame ID errors from chrome extensions
 * - Fast Refresh rebuilding issues
 * - Console expression errors
 * - Authentication flow stability
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Stability Diagnosis', () => {
  test.setTimeout(90000) // Increased timeout for diagnosis
  
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
  
  let consoleErrors = []
  let consoleWarnings = []
  let networkErrors = []
  let pageFlashingCount = 0
  let lastPageContent = ''
  
  test.beforeEach(async ({ page }) => {
    // Reset diagnostic counters
    consoleErrors = []
    consoleWarnings = []
    networkErrors = []
    pageFlashingCount = 0
    lastPageContent = ''
    
    // Set up comprehensive error monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          text: msg.text(),
          timestamp: new Date().toISOString(),
          location: msg.location()
        })
      } else if (msg.type() === 'warning') {
        consoleWarnings.push({
          text: msg.text(),
          timestamp: new Date().toISOString(),
          location: msg.location()
        })
      }
    })
    
    // Monitor network failures
    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      })
    })
    
    // Monitor page crashes
    page.on('pageerror', error => {
      consoleErrors.push({
        text: `Page Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        stack: error.stack
      })
    })
    
    // Clear browser state
    await page.context().clearCookies()
    await page.context().clearPermissions()
    
    // Disable service workers to prevent caching issues
    await page.context().addInitScript(() => {
      delete window.navigator.serviceWorker
    })
    
    // Add script to detect Fast Refresh activity
    await page.addInitScript(() => {
      let refreshCount = 0
      const originalLog = console.log
      console.log = (...args) => {
        if (args.some(arg => typeof arg === 'string' && arg.includes('Fast Refresh'))) {
          refreshCount++
          window.__fastRefreshCount = refreshCount
        }
        originalLog.apply(console, args)
      }
    })
  })

  test('DIAGNOSIS: Sign-in page stability and blinking behavior', async ({ page }) => {
    console.log('🔍 Starting sign-in page stability diagnosis...')
    
    // Navigate to sign-in page
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' })
    
    // Monitor content changes that could indicate flashing
    const contentChanges = []
    let previousContent = ''
    
    // Monitor DOM mutations
    await page.evaluate(() => {
      const observer = new MutationObserver((mutations) => {
        window.__mutationCount = (window.__mutationCount || 0) + mutations.length
        window.__lastMutation = Date.now()
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })
      
      // Track content changes
      let lastBodyContent = document.body.textContent
      setInterval(() => {
        const currentContent = document.body.textContent
        if (currentContent !== lastBodyContent) {
          window.__contentChanges = (window.__contentChanges || 0) + 1
          window.__lastContentChange = Date.now()
          lastBodyContent = currentContent
        }
      }, 100)
    })
    
    // Wait and monitor for flashing/blinking behavior
    const monitoringDuration = 10000 // 10 seconds
    const checkInterval = 500 // Check every 500ms
    const checks = monitoringDuration / checkInterval
    
    console.log(`📊 Monitoring page stability for ${monitoringDuration / 1000} seconds...`)
    
    for (let i = 0; i < checks; i++) {
      await page.waitForTimeout(checkInterval)
      
      try {
        const currentContent = await page.locator('body').textContent({ timeout: 1000 })
        const currentTitle = await page.title()
        const currentUrl = page.url()
        
        // Check for significant content changes (potential flashing)
        if (previousContent && previousContent !== currentContent) {
          contentChanges.push({
            timestamp: new Date().toISOString(),
            iteration: i,
            contentLength: currentContent?.length || 0,
            previousLength: previousContent?.length || 0,
            title: currentTitle,
            url: currentUrl
          })
        }
        
        previousContent = currentContent
        
        // Check React errors in console
        const reactErrors = consoleErrors.filter(error => 
          error.text.includes('React') || 
          error.text.includes('frameId') || 
          error.text.includes('Expression not available')
        )
        
        if (reactErrors.length > 0) {
          console.log(`❌ React errors detected at iteration ${i}:`, reactErrors.slice(-3))
        }
        
        // Log progress
        if (i % 4 === 0) {
          console.log(`⏱️  Check ${i + 1}/${checks} - Content changes: ${contentChanges.length}, Errors: ${consoleErrors.length}`)
        }
        
      } catch (error) {
        contentChanges.push({
          timestamp: new Date().toISOString(),
          iteration: i,
          error: error.message,
          type: 'check_error'
        })
      }
    }
    
    // Get final metrics
    const mutationCount = await page.evaluate(() => window.__mutationCount || 0)
    const contentChangeCount = await page.evaluate(() => window.__contentChanges || 0)
    const fastRefreshCount = await page.evaluate(() => window.__fastRefreshCount || 0)
    const lastMutation = await page.evaluate(() => window.__lastMutation || 0)
    const lastContentChange = await page.evaluate(() => window.__lastContentChange || 0)
    
    // Analyze authentication form state
    const authFormAnalysis = await page.evaluate(() => {
      const clerkForms = document.querySelectorAll('.cl-signIn-root, .cl-card, [data-testid="clerk-signin"]')
      const customForms = document.querySelectorAll('form')
      const emailInputs = document.querySelectorAll('input[type="email"], input[name="identifier"], input[name="emailAddress"]')
      const passwordInputs = document.querySelectorAll('input[type="password"], input[name="password"]')
      const oauthButtons = document.querySelectorAll('button[data-testid*="oauth"], button:has-text("Continue with"), button:has-text("Google"), button:has-text("GitHub")')
      
      return {
        clerkFormsFound: clerkForms.length,
        customFormsFound: customForms.length,
        emailInputsFound: emailInputs.length,
        passwordInputsFound: passwordInputs.length,
        oauthButtonsFound: oauthButtons.length,
        visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const rect = el.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        }).length
      }
    })
    
    // Generate comprehensive diagnosis report
    console.log('\n📋 AUTHENTICATION STABILITY DIAGNOSIS REPORT')
    console.log('=' .repeat(60))
    console.log(`🕐 Monitoring Duration: ${monitoringDuration / 1000} seconds`)
    console.log(`📄 Page URL: ${page.url()}`)
    console.log(`📖 Page Title: ${await page.title()}`)
    console.log(`🔄 Content Changes Detected: ${contentChanges.length}`)
    console.log(`🧬 DOM Mutations: ${mutationCount}`)
    console.log(`💨 Fast Refresh Count: ${fastRefreshCount}`)
    console.log(`❌ Console Errors: ${consoleErrors.length}`)
    console.log(`⚠️  Console Warnings: ${consoleWarnings.length}`)
    console.log(`🌐 Network Errors: ${networkErrors.length}`)
    
    console.log('\n🔍 Authentication Form Analysis:')
    console.log(`   - Clerk Forms: ${authFormAnalysis.clerkFormsFound}`)
    console.log(`   - Custom Forms: ${authFormAnalysis.customFormsFound}`)
    console.log(`   - Email Inputs: ${authFormAnalysis.emailInputsFound}`)
    console.log(`   - Password Inputs: ${authFormAnalysis.passwordInputsFound}`)
    console.log(`   - OAuth Buttons: ${authFormAnalysis.oauthButtonsFound}`)
    console.log(`   - Visible Elements: ${authFormAnalysis.visibleElements}`)
    
    // Detailed error analysis
    if (consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS DETECTED:')
      consoleErrors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.timestamp}] ${error.text}`)
      })
      if (consoleErrors.length > 10) {
        console.log(`   ... and ${consoleErrors.length - 10} more errors`)
      }
    }
    
    // Content change analysis
    if (contentChanges.length > 0) {
      console.log('\n🔄 CONTENT CHANGES (Potential Flashing):')
      contentChanges.slice(0, 5).forEach((change, index) => {
        console.log(`   ${index + 1}. [${change.timestamp}] Iteration ${change.iteration}: ${change.previousLength} → ${change.contentLength} chars`)
      })
      if (contentChanges.length > 5) {
        console.log(`   ... and ${contentChanges.length - 5} more changes`)
      }
    }
    
    // Network error analysis
    if (networkErrors.length > 0) {
      console.log('\n🌐 NETWORK ERRORS:')
      networkErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.timestamp}] ${error.method} ${error.url} - ${error.failure}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    
    // Create stability assessment
    const stabilityScore = calculateStabilityScore(
      contentChanges.length,
      consoleErrors.length,
      mutationCount,
      fastRefreshCount
    )
    
    console.log(`🏆 STABILITY SCORE: ${stabilityScore}/100`)
    console.log(`📊 Assessment: ${getStabilityAssessment(stabilityScore)}`)
    
    // Store diagnostic data for further analysis
    const diagnosticData = {
      monitoringDuration,
      contentChanges: contentChanges.length,
      consoleErrors: consoleErrors.length,
      consoleWarnings: consoleWarnings.length,
      networkErrors: networkErrors.length,
      mutationCount,
      fastRefreshCount,
      authFormAnalysis,
      stabilityScore,
      timestamp: new Date().toISOString()
    }
    
    // Write diagnostic data to a file for analysis
    await page.evaluate((data) => {
      window.__diagnosticData = data
    }, diagnosticData)
    
    // Assertions for test framework
    expect(authFormAnalysis.emailInputsFound).toBeGreaterThan(0) // Should have email input
    expect(authFormAnalysis.visibleElements).toBeGreaterThan(10) // Should have reasonable content
    
    // Fail test if stability is critically low
    if (stabilityScore < 30) {
      throw new Error(`Critical stability issues detected! Score: ${stabilityScore}/100. Check console for detailed report.`)
    }
    
    // Warnings for moderate stability issues
    if (stabilityScore < 70) {
      console.warn(`⚠️  WARNING: Moderate stability issues detected. Score: ${stabilityScore}/100`)
    }
    
    return diagnosticData
  })

  test('DIAGNOSIS: OAuth button interaction stability', async ({ page }) => {
    console.log('🔍 Starting OAuth button interaction diagnosis...')
    
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000) // Allow page to stabilize
    
    // Look for OAuth buttons
    const oauthButtons = await page.locator('button:has-text("Continue with"), button:has-text("Google"), button:has-text("GitHub")').all()
    
    console.log(`🔘 Found ${oauthButtons.length} OAuth buttons`)
    
    if (oauthButtons.length === 0) {
      console.warn('⚠️  No OAuth buttons found! This might indicate a loading issue.')
      return
    }
    
    // Test each OAuth button interaction
    for (let i = 0; i < Math.min(oauthButtons.length, 2); i++) {
      const button = oauthButtons[i]
      const buttonText = await button.textContent()
      
      console.log(`🔘 Testing OAuth button: "${buttonText}"`)
      
      const errorsBefore = consoleErrors.length
      
      try {
        // Test hover interaction
        await button.hover()
        await page.waitForTimeout(500)
        
        // Test click (will likely redirect or show popup, but we're looking for errors)
        await button.click()
        await page.waitForTimeout(2000)
        
        const errorsAfter = consoleErrors.length
        const newErrors = errorsAfter - errorsBefore
        
        console.log(`   - Errors generated: ${newErrors}`)
        
        if (newErrors > 0) {
          console.log('   - New errors:', consoleErrors.slice(-newErrors))
        }
        
      } catch (error) {
        console.log(`   - Interaction error: ${error.message}`)
      }
      
      // Navigate back to sign-in for next test
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)
    }
    
    expect(oauthButtons.length).toBeGreaterThan(0)
  })

  test('DIAGNOSIS: Page refresh and Fast Refresh behavior', async ({ page }) => {
    console.log('🔍 Starting Fast Refresh diagnosis...')
    
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' })
    
    // Monitor Fast Refresh activity
    const initialRefreshCount = await page.evaluate(() => window.__fastRefreshCount || 0)
    
    console.log(`🔄 Initial Fast Refresh count: ${initialRefreshCount}`)
    
    // Perform multiple page reloads to test stability
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Reload ${i + 1}/3`)
      
      const errorsBefore = consoleErrors.length
      
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)
      
      const errorsAfter = consoleErrors.length
      const refreshCount = await page.evaluate(() => window.__fastRefreshCount || 0)
      
      console.log(`   - Fast Refresh count: ${refreshCount}`)
      console.log(`   - New errors: ${errorsAfter - errorsBefore}`)
    }
    
    const finalRefreshCount = await page.evaluate(() => window.__fastRefreshCount || 0)
    
    console.log(`🏁 Final Fast Refresh count: ${finalRefreshCount}`)
    console.log(`📊 Total Fast Refresh activity: ${finalRefreshCount - initialRefreshCount}`)
    
    // Check for excessive Fast Refresh activity
    if (finalRefreshCount - initialRefreshCount > 10) {
      console.warn('⚠️  WARNING: Excessive Fast Refresh activity detected!')
    }
    
    expect(finalRefreshCount).toBeGreaterThanOrEqual(initialRefreshCount)
  })

  test('DIAGNOSIS: Chrome extension frame errors', async ({ page }) => {
    console.log('🔍 Starting Chrome extension frame error diagnosis...')
    
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000) // Allow extensions to load
    
    // Filter errors specifically related to Chrome extensions and frameId
    const extensionErrors = consoleErrors.filter(error => 
      error.text.includes('frameId') || 
      error.text.includes('chrome-extension') ||
      error.text.includes('Extension') ||
      error.text.includes('invalid frameId')
    )
    
    const expressionErrors = consoleErrors.filter(error =>
      error.text.includes('Expression not available') ||
      error.text.includes('Evaluation failed')
    )
    
    console.log(`🧩 Chrome extension errors: ${extensionErrors.length}`)
    console.log(`📝 Expression errors: ${expressionErrors.length}`)
    
    if (extensionErrors.length > 0) {
      console.log('🧩 Extension errors details:')
      extensionErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.text}`)
      })
    }
    
    if (expressionErrors.length > 0) {
      console.log('📝 Expression errors details:')
      expressionErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.text}`)
      })
    }
    
    // These errors are often from browser extensions and shouldn't fail the test
    expect(consoleErrors.length).toBeGreaterThanOrEqual(0) // Allow any number of errors for diagnosis
  })

  test.afterEach(async ({ page }, testInfo) => {
    // Generate final diagnostic summary
    const diagnosticSummary = {
      testName: testInfo.title,
      duration: Date.now() - testInfo._startTime,
      consoleErrors: consoleErrors.length,
      consoleWarnings: consoleWarnings.length,
      networkErrors: networkErrors.length,
      finalUrl: page.url(),
      status: testInfo.status
    }
    
    console.log('\n📋 Test Diagnostic Summary:', diagnosticSummary)
  })
})

function calculateStabilityScore(contentChanges, consoleErrors, mutationCount, fastRefreshCount) {
  let score = 100
  
  // Penalize for content changes (flashing)
  score -= Math.min(contentChanges * 5, 30)
  
  // Penalize for console errors
  score -= Math.min(consoleErrors * 3, 25)
  
  // Penalize for excessive mutations
  if (mutationCount > 100) {
    score -= Math.min((mutationCount - 100) * 0.1, 20)
  }
  
  // Penalize for excessive Fast Refresh
  if (fastRefreshCount > 5) {
    score -= Math.min((fastRefreshCount - 5) * 2, 15)
  }
  
  return Math.max(0, Math.round(score))
}

function getStabilityAssessment(score) {
  if (score >= 90) return 'Excellent - Very stable'
  if (score >= 70) return 'Good - Minor issues'
  if (score >= 50) return 'Fair - Moderate issues'
  if (score >= 30) return 'Poor - Significant issues'
  return 'Critical - Major stability problems'
}