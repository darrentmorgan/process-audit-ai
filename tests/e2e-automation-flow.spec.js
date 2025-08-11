import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Process Audit AI - Full Automation Flow', () => {
  test('Complete flow from login to n8n download', async ({ page, context }) => {
    // Set timeout for this test as it involves multiple steps
    test.setTimeout(120000); // 2 minutes
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the landing page
    const landingPageVisible = await page.locator('text=Transform Your Business Processes').isVisible().catch(() => false);
    
    if (landingPageVisible) {
      console.log('On landing page, clicking Get Started');
      // Click Get Started button
      await page.click('button:has-text("Get Started")');
      
      // Wait for auth modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Fill in login credentials
      await page.fill('input[type="email"]', 'damorgs85@gmail.com');
      await page.fill('input[type="password"]', 'password123!');
      
      // Click Sign In
      await page.click('button:has-text("Sign In")');
      
      // Wait for authentication to complete
      await page.waitForURL('**/app', { timeout: 10000 }).catch(() => {});
    }
    
    // Alternative: Direct access with query parameter
    if (!(await page.url().includes('/app'))) {
      console.log('Using direct access route');
      await page.goto('http://localhost:3000?access=granted');
      await page.waitForLoadState('networkidle');
    }
    
    // Step 1: Process Input
    console.log('Step 1: Process Input');
    // New UI header
    await page.waitForSelector('h2:has-text("Describe Your Process")', { timeout: 15000 });
    
    // Enter process description
    const processDescription = `Customer Support Ticket Resolution Process:
    
    1. Customer submits support ticket via email or web form
    2. Ticket is manually reviewed and categorized by support team
    3. Priority is assigned based on customer tier and issue severity
    4. Ticket is routed to appropriate department (Technical, Billing, General)
    5. Support agent investigates issue and provides resolution
    6. Customer is notified via email with solution
    7. If unresolved, ticket is escalated to senior support
    8. Follow-up email sent after 48 hours to confirm resolution
    9. Ticket is closed and archived in database
    
    Current pain points:
    - Manual categorization takes 5-10 minutes per ticket
    - Priority assignment is inconsistent
    - Routing errors occur 15% of the time
    - Follow-up emails are often forgotten
    - No real-time tracking or analytics`;
    
    await page.fill('textarea[placeholder*="Describe your business process"]', processDescription);
    
    // Click continue
    await page.click('button:has-text("Continue to Questions")');
    
    // Proceed directly to analysis (flow no longer shows a questions form)
    
    // Step 2: Analysis (wait for progress UI)
    console.log('Step 2: Analysis');
    await page.waitForSelector('h2:has-text("Analyzing Your Process")', { timeout: 20000 });

    // Move to results: try skip buttons if intermediate screens appear
    const maybeSkip = await page.locator('button:has-text("Skip to Results")').first();
    try {
      await maybeSkip.waitFor({ state: 'visible', timeout: 10000 });
      await maybeSkip.click();
    } catch {}

    // Wait for Audit Report step to render
    await page.waitForSelector('h1:has-text("Your Process Audit Report")', { timeout: 60000 });
    
    // Step 4: Audit Report
    console.log('Step 4: Audit Report');
    
    // Verify we're on the report page
    expect(await page.locator('h1:has-text("Your Process Audit Report")').isVisible()).toBeTruthy();
    
    // Check for the Automations tab
    const automationsTab = page.locator('button[role="tab"]:has-text("Automations")');
    await expect(automationsTab).toBeVisible({ timeout: 10000 });
    
    // Click on Automations tab
    await automationsTab.click();
    
    // Wait for automations content to load
    await page.waitForSelector('text=Generate n8n Workflow', { timeout: 20000 });
    
    // Look for Generate Automation button
    const generateButton = page.locator('button:has-text("Generate Automation")').first();
    await expect(generateButton).toBeVisible({ timeout: 10000 });
    
    // Click Generate Workflow
    await generateButton.click();
    
    // Wait for automation generation modal or status
    await page.waitForSelector('text=/Generating.*automation|Creating.*workflow/i', { timeout: 10000 });
    
    // Wait for download button to appear
    const downloadButton = await page.waitForSelector('button:has-text("Download n8n Workflow")', { timeout: 30000 });
    
    // Set up download promise right before clicking download
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    
    // Click download button
    await downloadButton.click();
    
    // Wait for the download to complete
    const download = await downloadPromise;
    
    // Verify download
    expect(download).toBeTruthy();
    
    // Get the download path
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Optionally save the file to a specific location for inspection
    const savedPath = path.join(process.cwd(), 'test-downloads', `n8n-workflow-${Date.now()}.json`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(path.dirname(savedPath))) {
      fs.mkdirSync(path.dirname(savedPath), { recursive: true });
    }
    
    await download.saveAs(savedPath);
    console.log(`Workflow saved to: ${savedPath}`);
    
    // Verify the downloaded file is valid JSON
    const fileContent = fs.readFileSync(savedPath, 'utf-8');
    const workflow = JSON.parse(fileContent);
    
    // Basic validation of n8n workflow structure
    expect(workflow).toHaveProperty('nodes');
    expect(workflow).toHaveProperty('connections');
    expect(Array.isArray(workflow.nodes)).toBeTruthy();
    expect(workflow.nodes.length).toBeGreaterThan(0);
    
    console.log('Test completed successfully!');
    console.log(`Downloaded workflow with ${workflow.nodes.length} nodes`);
  });
});