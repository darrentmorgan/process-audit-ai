/**
 * End-to-End Multi-Tenant Workflow Tests
 * ProcessAudit AI - Phase 4 Testing & Quality Assurance
 */

import { test, expect } from '@playwright/test'

// Test configuration for multi-tenant scenarios
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const ORGANIZATIONS = {
  free: {
    slug: 'test-startup',
    name: 'Test Startup Inc',
    plan: 'free',
    subdomain: `test-startup.${new URL(BASE_URL).hostname}`,
    email: 'admin@teststartup.example.com',
    password: 'TestPassword123!'
  },
  professional: {
    slug: 'test-acme',
    name: 'Test Acme Corporation',
    plan: 'professional', 
    subdomain: `test-acme.${new URL(BASE_URL).hostname}`,
    email: 'admin@testacme.example.com',
    password: 'TestPassword123!'
  },
  enterprise: {
    slug: 'test-global',
    name: 'Test Global Corp',
    plan: 'enterprise',
    customDomain: 'test-process.global.example.com',
    email: 'admin@testglobal.example.com',
    password: 'TestPassword123!'
  }
}

test.describe('Multi-Tenant Complete Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and cookies to ensure clean state
    await page.context().clearCookies()
    await page.context().clearPermissions()
    await page.goto(BASE_URL)
  })

  test.describe('Free Plan Organization Workflow', () => {
    test('complete audit workflow with plan limitations', async ({ page }) => {
      const org = ORGANIZATIONS.free
      
      // 1. Access organization-specific landing page
      await page.goto(`https://${org.subdomain}`)
      
      // Verify organization branding is applied
      await expect(page.locator('[data-testid="org-name"]')).toContainText(org.name)
      await expect(page.locator('[data-testid="plan-indicator"]')).toContainText('Free Plan')
      
      // 2. Sign up / Sign in flow
      await page.click('[data-testid="sign-in-btn"]')
      await page.fill('[data-testid="email-input"]', org.email)
      await page.fill('[data-testid="password-input"]', org.password)
      await page.click('[data-testid="submit-btn"]')
      
      // Wait for authentication and redirect to dashboard
      await page.waitForURL(`https://${org.subdomain}/dashboard`)
      
      // 3. Verify dashboard shows organization context
      await expect(page.locator('[data-testid="current-org"]')).toContainText(org.name)
      await expect(page.locator('[data-testid="plan-badge"]')).toContainText('Free')
      
      // 4. Start new process audit
      await page.click('[data-testid="new-audit-btn"]')
      
      // 5. Process Input Step
      await page.fill('[data-testid="process-title"]', 'Customer Onboarding Process')
      await page.fill('[data-testid="process-description"]', 
        'Manual process for onboarding new customers including email verification and account setup')
      await page.click('[data-testid="next-step-btn"]')
      
      // 6. AI-Generated Questions Step
      await page.waitForSelector('[data-testid="questions-form"]')
      
      // Answer generated questions
      const questions = await page.locator('[data-testid="question-item"]').count()
      expect(questions).toBeGreaterThan(0)
      
      for (let i = 0; i < questions; i++) {
        const questionItem = page.locator('[data-testid="question-item"]').nth(i)
        await questionItem.locator('[data-testid="answer-input"]').fill('Test answer for question')
      }
      
      await page.click('[data-testid="analyze-process-btn"]')
      
      // 7. Analysis Loading Step
      await page.waitForSelector('[data-testid="analysis-progress"]')
      await expect(page.locator('[data-testid="analysis-status"]')).toContainText('Analyzing')
      
      // Wait for analysis to complete
      await page.waitForSelector('[data-testid="audit-report"]', { timeout: 30000 })
      
      // 8. Audit Report Verification
      await expect(page.locator('[data-testid="executive-summary"]')).toBeVisible()
      await expect(page.locator('[data-testid="automation-opportunities"]')).toBeVisible()
      
      // 9. Automation Generation (Free Plan Limitations)
      await page.click('[data-testid="automation-tab"]')
      
      // Verify free plan limitations are displayed
      await expect(page.locator('[data-testid="plan-limitation"]')).toContainText('Free plan allows up to 10 workflows')
      
      // Check current workflow count
      const workflowCount = await page.locator('[data-testid="workflow-count"]').textContent()
      const currentCount = parseInt(workflowCount.match(/\d+/)[0])
      
      if (currentCount < 10) {
        await page.click('[data-testid="generate-automation-btn"]')
        
        // Verify automation generation starts
        await page.waitForSelector('[data-testid="generation-progress"]')
        await expect(page.locator('[data-testid="generation-status"]')).toContainText('Generating')
        
        // Wait for completion
        await page.waitForSelector('[data-testid="download-workflow-btn"]', { timeout: 60000 })
        
        // Verify workflow can be downloaded
        const downloadPromise = page.waitForEvent('download')
        await page.click('[data-testid="download-workflow-btn"]')
        const download = await downloadPromise
        
        expect(download.suggestedFilename()).toMatch(/customer-onboarding-process.*\.json/)
      } else {
        // Verify plan limit enforcement
        await expect(page.locator('[data-testid="upgrade-prompt"]')).toContainText('Upgrade to Professional')
        await expect(page.locator('[data-testid="generate-automation-btn"]')).toBeDisabled()
      }
      
      // 10. Report Saving
      await page.click('[data-testid="save-report-btn"]')
      await page.fill('[data-testid="report-name-input"]', 'Customer Onboarding Audit')
      await page.click('[data-testid="confirm-save-btn"]')
      
      await expect(page.locator('[data-testid="save-success"]')).toContainText('Report saved successfully')
      
      // 11. Verify report appears in dashboard
      await page.goto(`https://${org.subdomain}/dashboard`)
      await expect(page.locator('[data-testid="saved-reports"]')).toContainText('Customer Onboarding Audit')
    })

    test('enforces free plan member limit', async ({ page }) => {
      const org = ORGANIZATIONS.free
      
      await page.goto(`https://${org.subdomain}/dashboard`)
      
      // Login as admin
      await page.click('[data-testid="sign-in-btn"]')
      await page.fill('[data-testid="email-input"]', org.email)
      await page.fill('[data-testid="password-input"]', org.password)
      await page.click('[data-testid="submit-btn"]')
      
      await page.waitForURL(`https://${org.subdomain}/dashboard`)
      
      // Navigate to team management
      await page.click('[data-testid="team-settings"]')
      
      // Verify current member count and limit
      await expect(page.locator('[data-testid="member-limit-info"]')).toContainText('5 members maximum')
      
      const memberCount = await page.locator('[data-testid="current-members"]').textContent()
      const currentMembers = parseInt(memberCount.match(/\d+/)[0])
      
      if (currentMembers >= 5) {
        // Verify invite button is disabled
        await expect(page.locator('[data-testid="invite-member-btn"]')).toBeDisabled()
        await expect(page.locator('[data-testid="upgrade-required"]')).toContainText('Upgrade to add more members')
      } else {
        // Try to invite new member
        await page.click('[data-testid="invite-member-btn"]')
        await page.fill('[data-testid="invite-email"]', 'newmember@example.com')
        await page.click('[data-testid="send-invite-btn"]')
        
        await expect(page.locator('[data-testid="invite-success"]')).toContainText('Invitation sent')
      }
    })
  })

  test.describe('Professional Plan Organization Workflow', () => {
    test('complete workflow with advanced features', async ({ page }) => {
      const org = ORGANIZATIONS.professional
      
      await page.goto(`https://${org.subdomain}`)
      
      // Sign in
      await page.click('[data-testid="sign-in-btn"]')
      await page.fill('[data-testid="email-input"]', org.email)
      await page.fill('[data-testid="password-input"]', org.password)
      await page.click('[data-testid="submit-btn"]')
      
      await page.waitForURL(`https://${org.subdomain}/dashboard`)
      
      // Verify Professional features are available
      await expect(page.locator('[data-testid="plan-badge"]')).toContainText('Professional')
      await expect(page.locator('[data-testid="integrations-tab"]')).toBeVisible()
      await expect(page.locator('[data-testid="analytics-tab"]')).toBeVisible()
      
      // Start new audit
      await page.click('[data-testid="new-audit-btn"]')
      
      // Process input with advanced options
      await page.fill('[data-testid="process-title"]', 'Complex Sales Pipeline')
      await page.fill('[data-testid="process-description"]', 
        'Multi-stage sales process with CRM integration, lead scoring, and automated follow-ups')
      
      // Enable Professional features
      await page.check('[data-testid="enable-integrations"]')
      await page.check('[data-testid="enable-analytics"]')
      
      await page.click('[data-testid="next-step-btn"]')
      
      // Complete audit flow
      await page.waitForSelector('[data-testid="questions-form"]')
      const questions = await page.locator('[data-testid="question-item"]').count()
      
      for (let i = 0; i < questions; i++) {
        await page.locator('[data-testid="question-item"]').nth(i)
          .locator('[data-testid="answer-input"]').fill('Detailed professional answer')
      }
      
      await page.click('[data-testid="analyze-process-btn"]')
      await page.waitForSelector('[data-testid="audit-report"]', { timeout: 30000 })
      
      // Generate automation with integrations
      await page.click('[data-testid="automation-tab"]')
      await page.click('[data-testid="generate-automation-btn"]')
      
      // Verify advanced workflow options
      await expect(page.locator('[data-testid="integration-options"]')).toBeVisible()
      await expect(page.locator('[data-testid="crm-integration"]')).toBeVisible()
      await expect(page.locator('[data-testid="email-integration"]')).toBeVisible()
      
      // Select integrations
      await page.check('[data-testid="hubspot-integration"]')
      await page.check('[data-testid="slack-integration"]')
      
      await page.click('[data-testid="generate-with-integrations-btn"]')
      
      // Wait for complex workflow generation
      await page.waitForSelector('[data-testid="download-workflow-btn"]', { timeout: 90000 })
      
      // Verify workflow includes integrations
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="download-workflow-btn"]')
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toMatch(/complex-sales-pipeline.*\.json/)
      
      // Verify analytics dashboard
      await page.click('[data-testid="analytics-tab"]')
      await expect(page.locator('[data-testid="workflow-performance"]')).toBeVisible()
      await expect(page.locator('[data-testid="roi-projections"]')).toBeVisible()
    })

    test('validates team collaboration features', async ({ page, context }) => {
      const org = ORGANIZATIONS.professional
      
      // Admin user session
      await page.goto(`https://${org.subdomain}`)
      await page.click('[data-testid="sign-in-btn"]')
      await page.fill('[data-testid="email-input"]', org.email)
      await page.fill('[data-testid="password-input"]', org.password)
      await page.click('[data-testid="submit-btn"]')
      
      await page.waitForURL(`https://${org.subdomain}/dashboard`)
      
      // Invite team member
      await page.click('[data-testid="team-settings"]')
      await page.click('[data-testid="invite-member-btn"]')
      await page.fill('[data-testid="invite-email"]', 'teammember@testacme.example.com')
      await page.selectOption('[data-testid="member-role"]', 'member')
      await page.click('[data-testid="send-invite-btn"]')
      
      await expect(page.locator('[data-testid="invite-success"]')).toContainText('Invitation sent')
      
      // Create new page for member user
      const memberPage = await context.newPage()
      await memberPage.goto(`https://${org.subdomain}`)
      
      // Member sign up/in (simulate accepting invitation)
      await memberPage.click('[data-testid="sign-in-btn"]')
      await memberPage.fill('[data-testid="email-input"]', 'teammember@testacme.example.com')
      await memberPage.fill('[data-testid="password-input"]', 'MemberPassword123!')
      await memberPage.click('[data-testid="submit-btn"]')
      
      await memberPage.waitForURL(`https://${org.subdomain}/dashboard`)
      
      // Verify member can see shared reports
      await expect(memberPage.locator('[data-testid="shared-reports"]')).toBeVisible()
      
      // Verify member permissions (can't access admin settings)
      await memberPage.click('[data-testid="settings-menu"]')
      await expect(memberPage.locator('[data-testid="admin-settings"]')).not.toBeVisible()
      await expect(memberPage.locator('[data-testid="billing-settings"]')).not.toBeVisible()
      
      // Member creates report
      await memberPage.click('[data-testid="new-audit-btn"]')
      await memberPage.fill('[data-testid="process-title"]', 'Team Member Process')
      await memberPage.fill('[data-testid="process-description"]', 'Process created by team member')
      await memberPage.click('[data-testid="next-step-btn"]')
      
      // Complete simplified flow for testing
      await memberPage.waitForSelector('[data-testid="questions-form"]')
      await memberPage.locator('[data-testid="answer-input"]').first().fill('Team member answer')
      await memberPage.click('[data-testid="analyze-process-btn"]')
      
      await memberPage.waitForSelector('[data-testid="audit-report"]', { timeout: 30000 })
      
      // Save report
      await memberPage.click('[data-testid="save-report-btn"]')
      await memberPage.fill('[data-testid="report-name-input"]', 'Team Member Report')
      await memberPage.click('[data-testid="confirm-save-btn"]')
      
      // Verify admin can see member's report
      await page.reload()
      await expect(page.locator('[data-testid="team-reports"]')).toContainText('Team Member Report')
    })
  })

  test.describe('Enterprise Plan Organization Workflow', () => {
    test('custom domain and advanced security features', async ({ page }) => {
      const org = ORGANIZATIONS.enterprise
      
      // Access via custom domain
      await page.goto(`https://${org.customDomain}`)
      
      // Verify custom branding
      await expect(page.locator('[data-testid="custom-logo"]')).toBeVisible()
      await expect(page.locator('[data-testid="enterprise-badge"]')).toContainText('Enterprise')
      
      // Sign in with Enterprise features
      await page.click('[data-testid="sso-signin-btn"]') // Enterprise SSO
      
      // Fallback to standard login for test
      await page.click('[data-testid="standard-signin-btn"]')
      await page.fill('[data-testid="email-input"]', org.email)
      await page.fill('[data-testid="password-input"]', org.password)
      await page.click('[data-testid="submit-btn"]')
      
      await page.waitForURL(`https://${org.customDomain}/dashboard`)
      
      // Verify Enterprise features are available
      await expect(page.locator('[data-testid="api-access-tab"]')).toBeVisible()
      await expect(page.locator('[data-testid="custom-fields-tab"]')).toBeVisible()
      await expect(page.locator('[data-testid="advanced-analytics"]')).toBeVisible()
      
      // Create audit with Enterprise features
      await page.click('[data-testid="new-audit-btn"]')
      
      await page.fill('[data-testid="process-title"]', 'Enterprise Manufacturing Process')
      await page.fill('[data-testid="process-description"]', 
        'Complex manufacturing workflow with quality control, compliance tracking, and automated reporting')
      
      // Enable Enterprise features
      await page.check('[data-testid="enable-custom-fields"]')
      await page.check('[data-testid="enable-compliance-tracking"]')
      await page.check('[data-testid="enable-audit-trail"]')
      
      // Add custom fields
      await page.click('[data-testid="add-custom-field"]')
      await page.fill('[data-testid="custom-field-name"]', 'Compliance Level')
      await page.selectOption('[data-testid="custom-field-type"]', 'dropdown')
      await page.fill('[data-testid="custom-field-options"]', 'Low,Medium,High,Critical')
      await page.click('[data-testid="save-custom-field"]')
      
      await page.click('[data-testid="next-step-btn"]')
      
      // Complete Enterprise audit flow
      await page.waitForSelector('[data-testid="questions-form"]')
      
      // Answer questions including custom fields
      const questions = await page.locator('[data-testid="question-item"]').count()
      for (let i = 0; i < questions; i++) {
        await page.locator('[data-testid="question-item"]').nth(i)
          .locator('[data-testid="answer-input"]').fill('Enterprise-level detailed answer')
      }
      
      // Fill custom field
      await page.selectOption('[data-testid="compliance-level"]', 'Critical')
      
      await page.click('[data-testid="analyze-process-btn"]')
      await page.waitForSelector('[data-testid="audit-report"]', { timeout: 30000 })
      
      // Generate Enterprise-level automation
      await page.click('[data-testid="automation-tab"]')
      await page.click('[data-testid="generate-automation-btn"]')
      
      // Verify Enterprise automation options
      await expect(page.locator('[data-testid="enterprise-integrations"]')).toBeVisible()
      await expect(page.locator('[data-testid="compliance-workflows"]')).toBeVisible()
      await expect(page.locator('[data-testid="audit-trail-options"]')).toBeVisible()
      
      // Configure complex workflow
      await page.check('[data-testid="sap-integration"]')
      await page.check('[data-testid="compliance-reporting"]')
      await page.check('[data-testid="automated-auditing"]')
      
      await page.click('[data-testid="generate-enterprise-workflow-btn"]')
      
      // Wait for complex workflow generation (longer timeout for Enterprise)
      await page.waitForSelector('[data-testid="download-workflow-btn"]', { timeout: 120000 })
      
      // Verify Enterprise workflow features
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="download-workflow-btn"]')
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toMatch(/enterprise-manufacturing-process.*\.json/)
      
      // Verify API access features
      await page.click('[data-testid="api-access-tab"]')
      await expect(page.locator('[data-testid="api-key-management"]')).toBeVisible()
      await expect(page.locator('[data-testid="webhook-configuration"]')).toBeVisible()
      
      // Generate API key
      await page.click('[data-testid="generate-api-key-btn"]')
      await page.fill('[data-testid="api-key-name"]', 'Manufacturing Integration')
      await page.selectOption('[data-testid="api-key-permissions"]', 'read-write')
      await page.click('[data-testid="create-api-key-btn"]')
      
      await expect(page.locator('[data-testid="api-key-created"]')).toBeVisible()
    })

    test('validates Enterprise security and compliance', async ({ page }) => {
      const org = ORGANIZATIONS.enterprise
      
      await page.goto(`https://${org.customDomain}`)
      
      // Test security headers
      const response = await page.goto(`https://${org.customDomain}/api/audit-reports`)
      expect(response.headers()['x-content-type-options']).toBe('nosniff')
      expect(response.headers()['x-frame-options']).toBe('DENY')
      expect(response.headers()['strict-transport-security']).toBeTruthy()
      
      // Sign in
      await page.goto(`https://${org.customDomain}`)
      await page.click('[data-testid="standard-signin-btn"]')
      await page.fill('[data-testid="email-input"]', org.email)
      await page.fill('[data-testid="password-input"]', org.password)
      await page.click('[data-testid="submit-btn"]')
      
      await page.waitForURL(`https://${org.customDomain}/dashboard`)
      
      // Verify audit trail functionality
      await page.click('[data-testid="audit-trail-tab"]')
      await expect(page.locator('[data-testid="audit-events"]')).toBeVisible()
      
      // Check for login event
      await expect(page.locator('[data-testid="audit-event"]').first())
        .toContainText('User login')
      
      // Test data export with compliance
      await page.click('[data-testid="data-export-tab"]')
      await page.click('[data-testid="export-all-data-btn"]')
      
      // Verify compliance notice
      await expect(page.locator('[data-testid="compliance-notice"]'))
        .toContainText('Export includes personal data')
      
      await page.check('[data-testid="compliance-acknowledgment"]')
      await page.fill('[data-testid="export-justification"]', 
        'Quarterly compliance audit required by regulatory body')
      await page.click('[data-testid="proceed-with-export-btn"]')
      
      await expect(page.locator('[data-testid="export-initiated"]'))
        .toContainText('Export request submitted for approval')
    })
  })

  test.describe('Cross-Organization Isolation', () => {
    test('prevents data leakage between organizations', async ({ page, context }) => {
      const freeOrg = ORGANIZATIONS.free
      const proOrg = ORGANIZATIONS.professional
      
      // Create report in Free org
      await page.goto(`https://${freeOrg.subdomain}`)
      await page.click('[data-testid="sign-in-btn"]')
      await page.fill('[data-testid="email-input"]', freeOrg.email)
      await page.fill('[data-testid="password-input"]', freeOrg.password)
      await page.click('[data-testid="submit-btn"]')
      
      await page.waitForURL(`https://${freeOrg.subdomain}/dashboard`)
      
      // Create a report
      await page.click('[data-testid="new-audit-btn"]')
      await page.fill('[data-testid="process-title"]', 'Free Org Confidential Process')
      await page.fill('[data-testid="process-description"]', 'Sensitive free org process')
      await page.click('[data-testid="next-step-btn"]')
      
      await page.waitForSelector('[data-testid="questions-form"]')
      await page.locator('[data-testid="answer-input"]').first().fill('Confidential answer')
      await page.click('[data-testid="analyze-process-btn"]')
      
      await page.waitForSelector('[data-testid="audit-report"]', { timeout: 30000 })
      
      await page.click('[data-testid="save-report-btn"]')
      await page.fill('[data-testid="report-name-input"]', 'Free Org Secret Report')
      await page.click('[data-testid="confirm-save-btn"]')
      
      // Now try to access from Professional org
      const proPage = await context.newPage()
      await proPage.goto(`https://${proOrg.subdomain}`)
      
      await proPage.click('[data-testid="sign-in-btn"]')
      await proPage.fill('[data-testid="email-input"]', proOrg.email)
      await proPage.fill('[data-testid="password-input"]', proOrg.password)
      await proPage.click('[data-testid="submit-btn"]')
      
      await proPage.waitForURL(`https://${proOrg.subdomain}/dashboard`)
      
      // Verify Free org report is not visible
      await expect(proPage.locator('[data-testid="saved-reports"]'))
        .not.toContainText('Free Org Secret Report')
      
      // Try direct URL access to Free org report (should fail)
      const reportUrl = `https://${proOrg.subdomain}/reports/free-org-secret-report`
      const response = await proPage.goto(reportUrl)
      expect(response.status()).toBe(403)
      
      // Verify proper organization context
      await expect(proPage.locator('[data-testid="current-org"]'))
        .toContainText(proOrg.name)
      await expect(proPage.locator('[data-testid="current-org"]'))
        .not.toContainText(freeOrg.name)
    })

    test('validates subdomain isolation', async ({ page }) => {
      const freeOrg = ORGANIZATIONS.free
      
      // Access correct subdomain
      await page.goto(`https://${freeOrg.subdomain}`)
      await expect(page.locator('[data-testid="org-name"]')).toContainText(freeOrg.name)
      
      // Try to access wrong subdomain with correct credentials
      await page.goto(`https://wrong-org.${new URL(BASE_URL).hostname}`)
      
      // Should show 404 or redirect to main site
      await expect(page).toHaveURL(/404|processaudit\.ai/)
      
      // Direct API access with wrong org context should fail
      const apiResponse = await page.request.get(`https://${freeOrg.subdomain}/api/audit-reports`, {
        headers: {
          'X-Organization-Context': 'wrong-org-456'
        }
      })
      
      expect(apiResponse.status()).toBe(403)
    })
  })

  test.describe('Performance Under Multi-Tenant Load', () => {
    test('handles concurrent organization access', async ({ browser }) => {
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ])
      
      const orgs = [ORGANIZATIONS.free, ORGANIZATIONS.professional, ORGANIZATIONS.enterprise]
      
      // Create concurrent sessions
      const sessions = await Promise.all(
        contexts.map(async (context, index) => {
          const page = await context.newPage()
          const org = orgs[index]
          
          await page.goto(`https://${org.subdomain || org.customDomain}`)
          
          // Measure page load time
          const startTime = Date.now()
          await page.waitForLoadState('networkidle')
          const loadTime = Date.now() - startTime
          
          return { page, org, loadTime }
        })
      )
      
      // Verify all pages loaded successfully
      sessions.forEach(({ page, org, loadTime }) => {
        expect(loadTime).toBeLessThan(5000) // 5 second max load time
      })
      
      // Perform concurrent operations
      const operations = await Promise.all(
        sessions.map(async ({ page, org }) => {
          const startTime = Date.now()
          
          await page.click('[data-testid="sign-in-btn"]')
          await page.fill('[data-testid="email-input"]', org.email)
          await page.fill('[data-testid="password-input"]', org.password)
          await page.click('[data-testid="submit-btn"]')
          
          await page.waitForURL(new RegExp(org.subdomain || org.customDomain))
          
          const authTime = Date.now() - startTime
          return { org: org.slug, authTime }
        })
      )
      
      // Verify performance
      operations.forEach(({ org, authTime }) => {
        expect(authTime).toBeLessThan(3000) // 3 second max auth time
      })
      
      // Cleanup
      await Promise.all(contexts.map(context => context.close()))
    })
  })
})