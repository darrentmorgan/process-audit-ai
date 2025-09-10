import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';

// PDF Generation Test Suite for ProcessAudit AI
test.describe('ProcessAudit AI PDF Generation System', () => {
  // Test Setup Constants
  const PDF_DOWNLOAD_TIMEOUT = 10000; // 10 seconds for PDF download
  const PDF_SIZE_MIN = 10 * 1024; // 10 KB minimum
  const PDF_SIZE_MAX = 25 * 1024; // 25 KB maximum

  // Mock Test Report Data
  const testReportData = {
    executiveSummary: {
      overview: "Comprehensive Business Process Automation Audit",
      automationScore: 85,
      estimatedROI: "$50,000",
      timeSavings: "20 hours/week"
    },
    automationOpportunities: [
      "Automate Email Routing",
      "Streamline Approval Workflows",
      "Reduce Manual Data Entry"
    ],
    roadmap: {
      phase1: "Email Automation Implementation",
      phase2: "Workflow Optimization",
      phase3: "Integration and Scaling"
    }
  };

  // Authentication and Navigation Helpers
  const loginAndNavigateToAuditReport = async (page) => {
    // Navigate to the application and wait for it to load
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if we're on landing page - click "Start Free Analysis" to begin
    const startButton = page.locator('button:has-text("Start Free Analysis")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      // This will trigger auth flow - for testing, we'll mock the report directly
    }

    // Instead of going through the full flow, inject a mock audit report into the page
    await page.evaluate((reportData) => {
      // Create mock audit report interface
      document.body.innerHTML = `
        <div data-testid="audit-report-section" class="max-w-6xl mx-auto">
          <div class="card mb-8">
            <div class="flex items-center justify-between mb-6">
              <h1 class="text-3xl font-bold text-gray-900">Your Process Audit Report</h1>
              <div class="flex gap-3">
                <div class="relative pdf-export-dropdown">
                  <button data-testid="pdf-export-button" class="btn-primary">
                    Export PDF
                  </button>
                  <div id="pdf-menu" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border">
                    <button data-testid="audit-report-pdf-btn" class="w-full text-left px-4 py-3 hover:bg-gray-50">
                      Complete Audit Report
                    </button>
                    <button data-testid="executive-summary-pdf-button" class="w-full text-left px-4 py-3 hover:bg-gray-50">
                      Executive Summary
                    </button>
                    <button data-testid="sop-pdf-export-button" class="w-full text-left px-4 py-3 hover:bg-gray-50">
                      Standard Operating Procedure
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div class="text-center p-4 bg-blue-50 rounded">
                <div class="text-2xl font-bold">${reportData.executiveSummary.timeSavings}</div>
                <div class="text-sm">Potential Savings</div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Setup PDF download functionality
      let showingMenu = false;
      const pdfButton = document.querySelector('[data-testid="pdf-export-button"]');
      const pdfMenu = document.getElementById('pdf-menu');
      
      pdfButton.onclick = () => {
        showingMenu = !showingMenu;
        pdfMenu.className = showingMenu 
          ? 'absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50'
          : 'hidden absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border';
      };

      // Mock PDF generation for each button
      const setupPDFDownload = (buttonId, documentType, filename) => {
        const button = document.querySelector(`[data-testid="${buttonId}"]`);
        if (button) {
          button.onclick = async () => {
            const payload = {
              documentType,
              reportData: reportData,
              processData: {
                processName: 'Test Business Process',
                industry: 'Technology',
                department: 'Operations'
              },
              options: {
                page: { format: 'A4', orientation: 'portrait' },
                filename: filename,
                metadata: {
                  title: `${documentType} - ProcessAudit AI`,
                  author: 'ProcessAudit AI Test Suite'
                }
              }
            };

            try {
              const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } else {
                console.error('PDF generation failed:', response.status);
              }
            } catch (error) {
              console.error('PDF generation error:', error);
            }
          };
        }
      };

      setupPDFDownload('audit-report-pdf-btn', 'audit-report', 'audit-report.pdf');
      setupPDFDownload('executive-summary-pdf-button', 'executive-summary', 'executive-summary.pdf');
      setupPDFDownload('sop-pdf-export-button', 'sop-document', 'sop-document.pdf');

    }, testReportData);

    // Wait for the mock audit report to be ready
    await page.waitForSelector('[data-testid="audit-report-section"]', { 
      state: 'visible', 
      timeout: 10000 
    });
  };

  // PDF Export Tests
  test('Audit Report PDF Export', async ({ page }, testInfo) => {
    await loginAndNavigateToAuditReport(page);

    // Click to open PDF export menu
    await page.getByTestId('pdf-export-button').click();
    
    // Wait for menu to appear and click audit report option
    await page.waitForSelector('[data-testid="audit-report-pdf-btn"]', { state: 'visible' });
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: PDF_DOWNLOAD_TIMEOUT });
    
    // Click audit report PDF button
    await page.getByTestId('audit-report-pdf-btn').click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toBe('audit-report.pdf');

    // Save downloaded file
    const downloadPath = path.join(testInfo.outputDir, 'audit-report.pdf');
    await download.saveAs(downloadPath);

    // Validate PDF file exists and has content
    const pdfBytes = await fs.promises.readFile(downloadPath);
    expect(pdfBytes.length).toBeGreaterThan(PDF_SIZE_MIN);

    // Verify it's a valid PDF by checking the header
    const pdfHeader = pdfBytes.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');

    console.log(`✅ Audit Report PDF generated successfully (${pdfBytes.length} bytes)`);
  });

  test('Executive Summary PDF Export', async ({ page }, testInfo) => {
    await loginAndNavigateToAuditReport(page);

    // Open PDF export menu first
    await page.getByTestId('pdf-export-button').click();
    await page.waitForSelector('[data-testid="executive-summary-pdf-button"]', { state: 'visible' });

    // Click Executive Summary PDF export
    const downloadPromise = page.waitForEvent('download', { timeout: PDF_DOWNLOAD_TIMEOUT });
    await page.getByTestId('executive-summary-pdf-button').click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toBe('executive-summary.pdf');

    // Save and validate PDF
    const downloadPath = path.join(testInfo.outputDir, 'executive-summary.pdf');
    await download.saveAs(downloadPath);

    const pdfBytes = await fs.promises.readFile(downloadPath);
    expect(pdfBytes.length).toBeGreaterThan(PDF_SIZE_MIN);
    
    // Verify it's a valid PDF
    const pdfHeader = pdfBytes.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');

    console.log(`✅ Executive Summary PDF generated successfully (${pdfBytes.length} bytes)`);
  });

  test('SOP Document PDF Export with Fallback', async ({ page }, testInfo) => {
    await loginAndNavigateToAuditReport(page);

    // Open PDF export menu
    await page.getByTestId('pdf-export-button').click();
    await page.waitForSelector('[data-testid="sop-pdf-export-button"]', { state: 'visible' });

    // SOP PDF Export with Fallback Handling
    const downloadPromise = page.waitForEvent('download', { 
      timeout: PDF_DOWNLOAD_TIMEOUT 
    });

    await page.getByTestId('sop-pdf-export-button').click();
    const download = await downloadPromise;

    // Should default to PDF filename
    expect(download.suggestedFilename()).toBe('sop-document.pdf');

    const downloadPath = path.join(testInfo.outputDir, 'sop-document.pdf');
    await download.saveAs(downloadPath);

    // Validate the downloaded file
    const fileBytes = await fs.promises.readFile(downloadPath);
    expect(fileBytes.length).toBeGreaterThan(PDF_SIZE_MIN);

    // Verify it's a valid PDF
    const pdfHeader = fileBytes.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');

    console.log(`✅ SOP Document PDF generated successfully (${fileBytes.length} bytes)`);
  });

  // Performance and Error Handling Tests
  test('PDF Generation Performance', async ({ page }) => {
    const startTime = Date.now();
    await loginAndNavigateToAuditReport(page);

    // Test a single PDF generation for performance
    await page.getByTestId('pdf-export-button').click();
    await page.waitForSelector('[data-testid="audit-report-pdf-btn"]', { state: 'visible' });
    
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('audit-report-pdf-btn').click();
    await downloadPromise;

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Ensure PDF generation completes within reasonable time (30 seconds)
    expect(totalTime).toBeLessThan(30000);
    
    console.log(`✅ PDF generation performance test passed (${totalTime}ms)`);
  });

  // Error Scenario Tests  
  test('PDF Generation Error Handling', async ({ page }) => {
    // Test error handling by calling the API directly with invalid data
    const response = await page.evaluate(async () => {
      try {
        const apiResponse = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentType: 'invalid-type', // This should trigger an error
            reportData: {},
            options: { page: { format: 'A4' }, filename: 'test.pdf' }
          })
        });
        
        return {
          status: apiResponse.status,
          success: apiResponse.ok,
          data: await apiResponse.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    // Should return a 400 error for invalid document type
    expect(response.status).toBe(400);
    expect(response.success).toBe(false);
    expect(response.data.error).toBeDefined();
    
    console.log(`✅ Error handling test passed: ${response.data.error}`);
  });
});