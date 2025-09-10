import { test, expect } from '@playwright/test';

test.describe('PDF UI Integration Tests', () => {
  let mockReportData;

  test.beforeAll(() => {
    mockReportData = {
      executiveSummary: {
        overview: 'Mock report for UI testing',
        automationScore: 75,
        totalTimeSavings: '8-12 hours/week',
        quickWins: 2,
        strategicOpportunities: 3,
        estimatedROI: '250%'
      },
      automationOpportunities: [
        {
          id: 'ui-test-1',
          stepDescription: 'Manual report generation',
          solution: 'Automated report creation',
          category: 'quick-win',
          priority: 85,
          effort: 'Low',
          timeSavings: '6 hours per week',
          estimatedCost: '$200-500'
        }
      ]
    };
  });

  test('Test PDF Export from Mock Report Page', async ({ page }) => {
    // Set longer timeout for this test
    test.setTimeout(30000);

    // Navigate to application
    await page.goto('http://localhost:3000');
    
    // Inject mock report data directly into the page
    await page.addInitScript((reportData) => {
      window.testReportData = reportData;
      window.testProcessData = {
        processName: 'Test Process',
        processDescription: 'Test process description',
        industry: 'Technology'
      };
    }, mockReportData);

    // Create a mock report component on the page for testing
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="test-audit-report">
          <div class="card">
            <div class="flex items-center justify-between mb-6">
              <h1 class="text-3xl font-bold">Your Process Audit Report</h1>
              <div class="flex gap-3">
                <div class="relative pdf-export-dropdown">
                  <button id="pdf-export-btn" class="btn-primary">
                    Export PDF
                  </button>
                  <div id="pdf-export-menu" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border">
                    <button id="audit-report-btn" class="w-full text-left px-4 py-3 hover:bg-gray-50">
                      Complete Audit Report
                    </button>
                    <button id="executive-summary-btn" class="w-full text-left px-4 py-3 hover:bg-gray-50">
                      Executive Summary
                    </button>
                    <button id="sop-document-btn" class="w-full text-left px-4 py-3 hover:bg-gray-50">
                      Standard Operating Procedure
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div class="text-center p-4 bg-blue-50 rounded">
                <div class="text-2xl font-bold">${window.testReportData.executiveSummary.totalTimeSavings}</div>
                <div class="text-sm">Potential Savings</div>
              </div>
              <div class="text-center p-4 bg-green-50 rounded">
                <div class="text-2xl font-bold">${window.testReportData.executiveSummary.quickWins}</div>
                <div class="text-sm">Quick Wins</div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add PDF export functionality
      let showingMenu = false;
      
      document.getElementById('pdf-export-btn').onclick = () => {
        const menu = document.getElementById('pdf-export-menu');
        showingMenu = !showingMenu;
        menu.className = showingMenu 
          ? 'absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50'
          : 'hidden absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border';
      };

      // Mock PDF generation functions
      const generatePDF = async (documentType) => {
        console.log(`Generating ${documentType} PDF...`);
        
        const payload = {
          documentType,
          reportData: window.testReportData,
          processData: window.testProcessData,
          options: {
            page: { format: 'A4', orientation: 'portrait' },
            filename: `${documentType}-test.pdf`,
            metadata: {
              title: `${documentType} - ProcessAudit AI Test`,
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
            link.download = payload.options.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            window.testPDFSuccess = true;
            window.testPDFType = documentType;
            console.log(`${documentType} PDF generated successfully`);
          } else {
            throw new Error(`PDF generation failed: ${response.status}`);
          }
        } catch (error) {
          console.error('PDF generation error:', error);
          window.testPDFError = error.message;
        }
      };

      document.getElementById('audit-report-btn').onclick = () => generatePDF('audit-report');
      document.getElementById('executive-summary-btn').onclick = () => generatePDF('executive-summary');
      document.getElementById('sop-document-btn').onclick = () => generatePDF('sop-document');
    });

    // Test PDF Export Menu
    await expect(page.locator('#test-audit-report')).toBeVisible();
    await expect(page.locator('#pdf-export-btn')).toBeVisible();

    // Click PDF export button to show menu
    await page.click('#pdf-export-btn');
    await expect(page.locator('#pdf-export-menu')).toBeVisible();

    // Test Complete Audit Report PDF Generation
    console.log('Testing Complete Audit Report PDF generation...');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('#audit-report-btn');
    
    // Wait for download to complete
    const download = await downloadPromise;
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toContain('audit-report-test.pdf');
    
    console.log(`✅ Audit Report PDF download initiated: ${download.suggestedFilename()}`);
  });

  test('Test Executive Summary PDF Generation', async ({ page }) => {
    test.setTimeout(20000);

    await page.goto('http://localhost:3000');
    
    // Inject the same mock setup
    await page.addInitScript((reportData) => {
      window.testReportData = reportData;
    }, mockReportData);

    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="executive-summary-test">
          <button id="exec-summary-test-btn" onclick="generateExecutiveSummary()">
            Generate Executive Summary PDF
          </button>
          <div id="status"></div>
        </div>
      `;

      window.generateExecutiveSummary = async () => {
        const statusEl = document.getElementById('status');
        statusEl.textContent = 'Generating...';
        
        try {
          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentType: 'executive-summary',
              reportData: window.testReportData,
              options: {
                page: { format: 'A4' },
                filename: 'executive-summary-ui-test.pdf'
              }
            })
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'executive-summary-ui-test.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            statusEl.textContent = 'PDF Generated Successfully';
          } else {
            statusEl.textContent = `Error: ${response.status}`;
          }
        } catch (error) {
          statusEl.textContent = `Error: ${error.message}`;
        }
      };
    });

    await expect(page.locator('#exec-summary-test-btn')).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exec-summary-test-btn');
    
    const download = await downloadPromise;
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toBe('executive-summary-ui-test.pdf');
    
    console.log('✅ Executive Summary PDF generation test passed');
  });

  test('Test SOP PDF Generation from SOPRevision Component', async ({ page }) => {
    test.setTimeout(20000);

    await page.goto('http://localhost:3000');
    
    const mockSOPData = {
      metadata: {
        title: 'Test SOP Document',
        sopVersion: '1.0'
      },
      purpose: 'Test SOP purpose',
      scope: 'Test SOP scope',
      procedure: [
        {
          step: 1,
          action: 'First step action',
          responsibility: 'Test User'
        }
      ]
    };

    await page.addInitScript((sopData) => {
      window.testSOPData = sopData;
    }, mockSOPData);

    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="sop-revision-test">
          <h3>SOP Revision Test</h3>
          <button id="download-sop-btn" onclick="downloadSOP()">
            Download SOP PDF
          </button>
          <div id="sop-status"></div>
        </div>
      `;

      window.downloadSOP = async () => {
        const statusEl = document.getElementById('sop-status');
        statusEl.textContent = 'Generating SOP PDF...';
        
        try {
          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentType: 'sop-document',
              sopData: window.testSOPData,
              options: {
                page: { format: 'A4' },
                filename: 'sop-ui-test.pdf',
                metadata: {
                  title: 'Test SOP Document',
                  author: 'UI Test Suite'
                }
              }
            })
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'sop-ui-test.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            statusEl.textContent = 'SOP PDF Downloaded Successfully';
            window.sopTestSuccess = true;
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          statusEl.textContent = `Error: ${error.message}`;
          window.sopTestError = error.message;
        }
      };
    });

    await expect(page.locator('#download-sop-btn')).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('#download-sop-btn');
    
    const download = await downloadPromise;
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toBe('sop-ui-test.pdf');
    
    // Check for success in page
    await expect(page.locator('#sop-status')).toContainText('Successfully');
    
    console.log('✅ SOP PDF generation test passed');
  });

  test('Test PDF Error Handling in UI', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="error-test">
          <button id="invalid-pdf-btn" onclick="testInvalidPDF()">
            Test Invalid PDF Request
          </button>
          <div id="error-status"></div>
        </div>
      `;

      window.testInvalidPDF = async () => {
        const statusEl = document.getElementById('error-status');
        statusEl.textContent = 'Testing error handling...';
        
        try {
          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentType: 'invalid-type', // This should cause an error
              reportData: { invalid: 'data' },
              options: { page: { format: 'A4' } }
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            statusEl.textContent = `Expected Error: ${errorData.error}`;
            window.errorTestPassed = true;
          } else {
            statusEl.textContent = 'Unexpected success - should have failed';
          }
        } catch (error) {
          statusEl.textContent = `Network Error: ${error.message}`;
        }
      };
    });

    await page.click('#invalid-pdf-btn');
    await expect(page.locator('#error-status')).toContainText('Expected Error');
    
    const errorTestPassed = await page.evaluate(() => window.errorTestPassed);
    expect(errorTestPassed).toBe(true);
    
    console.log('✅ PDF error handling test passed');
  });

  test('Test PDF Generation Performance in UI', async ({ page }) => {
    test.setTimeout(15000);

    await page.goto('http://localhost:3000');
    
    await page.addInitScript((reportData) => {
      window.testReportData = reportData;
    }, mockReportData);

    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="performance-test">
          <button id="perf-test-btn" onclick="performanceTest()">
            Performance Test PDF Generation
          </button>
          <div id="perf-status"></div>
        </div>
      `;

      window.performanceTest = async () => {
        const statusEl = document.getElementById('perf-status');
        const startTime = Date.now();
        
        statusEl.textContent = 'Starting performance test...';
        
        try {
          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentType: 'audit-report',
              reportData: window.testReportData,
              options: {
                page: { format: 'A4' },
                filename: 'performance-test.pdf'
              }
            })
          });

          const endTime = Date.now();
          const duration = endTime - startTime;
          
          if (response.ok) {
            statusEl.textContent = `PDF generated in ${duration}ms`;
            window.performanceResult = duration;
            
            // Don't actually download in performance test
            await response.blob(); // Just consume the response
          } else {
            statusEl.textContent = `Error: ${response.status}`;
          }
        } catch (error) {
          statusEl.textContent = `Error: ${error.message}`;
        }
      };
    });

    await page.click('#perf-test-btn');
    await expect(page.locator('#perf-status')).toContainText('generated in');
    
    const duration = await page.evaluate(() => window.performanceResult);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    
    console.log(`✅ Performance test passed: PDF generated in ${duration}ms`);
  });
});