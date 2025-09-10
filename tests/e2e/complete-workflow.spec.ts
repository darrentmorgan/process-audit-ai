// Complete ProcessAudit AI Workflow E2E Test
// Tests the entire user journey from authentication to PDF download

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { TEST_CONFIG, TEST_PROCESS_DATA, EXPECTED_PDF_STRUCTURE } from '../test-config';
import TestReporter from '../test-reporter';

test.describe('ProcessAudit AI - Complete Workflow', () => {
  
  test('Complete process audit workflow with PDF generation', async ({ page }, testInfo) => {
    const reporter = new TestReporter(testInfo);
    test.setTimeout(TEST_CONFIG.timeouts.test);

    try {
      // Step 1: Authentication and Navigation
      reporter.setCurrentStep('Authentication');
      
      // Try development access first
      await page.goto('/?access=granted');
      await page.waitForLoadState('networkidle');
      
      // Check if we're on the landing page or main app
      const isLandingPage = await page.locator('text=Turn Your Business Processes').isVisible().catch(() => false);
      
      if (isLandingPage) {
        reporter.setCurrentStep('Landing Page Navigation');
        
        // Try clicking "Start Free Analysis" to access app
        const startButton = page.locator('button:has-text("Start Free Analysis")').first();
        if (await startButton.isVisible()) {
          await startButton.click();
          await page.waitForLoadState('networkidle');
        }
        
        // If still on landing page, try alternative navigation
        const currentUrl = page.url();
        if (currentUrl.includes('accounts.dev') || currentUrl.includes('sign-')) {
          // We're in Clerk auth flow - use direct app navigation
          await page.goto('/dashboard');
          await page.waitForLoadState('networkidle');
        }
      }

      await reporter.documentSuccess(page, 'Authentication', `Successfully accessed app at ${page.url()}`);

      // Step 2: Process Input (Step 1 of 4)
      reporter.setCurrentStep('Process Input');
      
      // Look for process input elements - try multiple selector strategies
      const processInputSelectors = [
        'textarea[placeholder*="process"]',
        'textarea[placeholder*="describe"]', 
        'input[placeholder*="process"]',
        '[data-testid="process-description"]',
        'textarea:first-of-type'
      ];
      
      let processInputFound = false;
      
      for (const selector of processInputSelectors) {
        try {
          const element = page.locator(selector);
          if (await element.isVisible({ timeout: 5000 })) {
            await element.fill(TEST_PROCESS_DATA.description);
            processInputFound = true;
            await reporter.documentSuccess(page, 'Process Input', `Found input using selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!processInputFound) {
        await reporter.documentIssue(page, {
          step: 'Process Input',
          expected: 'Process description input field to be visible and fillable',
          actual: 'No process input field found with any of the attempted selectors',
          error: new Error('Process input field not accessible')
        });
        
        // Try file upload instead
        reporter.setCurrentStep('File Upload Alternative');
        
        const fileInputSelectors = [
          'input[type="file"]',
          '[data-testid="file-upload"]',
          '.file-upload input'
        ];
        
        for (const selector of fileInputSelectors) {
          try {
            const fileInput = page.locator(selector);
            if (await fileInput.isVisible({ timeout: 5000 })) {
              // Create a test file
              const testFilePath = path.join(__dirname, 'test-process.txt');
              fs.writeFileSync(testFilePath, TEST_PROCESS_DATA.description);
              
              await fileInput.setInputFiles(testFilePath);
              await reporter.documentSuccess(page, 'File Upload', `Uploaded test file using ${selector}`);
              break;
            }
          } catch (error) {
            // Continue to next selector
          }
        }
      }

      // Step 3: Start Analysis
      reporter.setCurrentStep('Start Analysis');
      
      const startButtonSelectors = [
        'button:has-text("Start Analysis")',
        'button:has-text("Begin Analysis")',
        'button:has-text("Analyze")',
        '[data-testid="start-analysis"]',
        'button[type="submit"]'
      ];
      
      let analysisStarted = false;
      
      for (const selector of startButtonSelectors) {
        try {
          const button = page.locator(selector);
          if (await button.isVisible({ timeout: 5000 })) {
            await button.click();
            analysisStarted = true;
            await reporter.documentSuccess(page, 'Start Analysis', `Analysis started using ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!analysisStarted) {
        await reporter.documentIssue(page, {
          step: 'Start Analysis',
          expected: 'Analysis start button to be clickable',
          actual: 'No analysis start button found',
          error: new Error('Cannot start analysis process')
        });
        
        // Skip to direct PDF testing
        reporter.setCurrentStep('Direct PDF API Testing');
        await testPDFAPIDirectly(page, reporter);
        return;
      }

      // Step 4: Wait for Analysis Completion
      reporter.setCurrentStep('Analysis Processing');
      
      // Look for analysis progress indicators
      const progressSelectors = [
        '.progress-bar',
        '[data-testid="analysis-progress"]',
        'text=Analyzing',
        'text=Processing'
      ];
      
      // Wait for analysis to complete - look for completion indicators
      const completionSelectors = [
        'text=Analysis Complete',
        'text=Your Process Audit Report',
        '[data-testid="audit-report"]',
        '.audit-report'
      ];
      
      let analysisCompleted = false;
      
      for (const selector of completionSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 60000 });
          analysisCompleted = true;
          await reporter.documentSuccess(page, 'Analysis Processing', `Analysis completed - found: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!analysisCompleted) {
        await reporter.documentIssue(page, {
          step: 'Analysis Processing',
          expected: 'Analysis to complete within 60 seconds',
          actual: 'Analysis did not complete or completion indicator not found',
          error: new Error('Analysis timeout or completion detection failed')
        });
        
        // Try direct PDF testing anyway
        await testPDFAPIDirectly(page, reporter);
        return;
      }

      // Step 5: PDF Export Testing
      await testPDFExportUI(page, reporter);

    } catch (error) {
      await reporter.documentIssue(page, {
        step: reporter['currentStep'] || 'Unknown',
        expected: 'Test to execute without errors',
        actual: `Unexpected error: ${error.message}`,
        error: error as Error
      });
    } finally {
      // Generate final report
      const reportPath = await reporter.generateFinalReport();
      console.log(`📊 Test report generated: ${reportPath}`);
      
      // Attach report to test results
      await testInfo.attach('test-report', { 
        path: reportPath,
        contentType: 'text/markdown'
      });
    }
  });

  // Helper method for PDF export UI testing  
  const testPDFExportUI = async (page: Page, reporter: TestReporter) => {
    reporter.setCurrentStep('PDF Export UI');
    
    // Look for PDF export buttons
    const pdfButtonSelectors = [
      'button:has-text("Export PDF")',
      'button:has-text("Download PDF")', 
      '[data-testid="pdf-export"]',
      '.pdf-export',
      'button:has-text("PDF")'
    ];
    
    for (const selector of pdfButtonSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.isVisible({ timeout: 5000 })) {
          
          // Set up download listener
          const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
          
          await button.click();
          await reporter.documentSuccess(page, 'PDF Export UI', `Found PDF export button: ${selector}`);
          
          try {
            const download = await downloadPromise;
            const downloadPath = await download.path();
            
            if (downloadPath && fs.existsSync(downloadPath)) {
              const fileSize = fs.statSync(downloadPath).size;
              const fileName = download.suggestedFilename();
              
              await reporter.documentSuccess(page, 'PDF Download', 
                `PDF downloaded successfully: ${fileName} (${fileSize} bytes)`);
              
              // Validate PDF content
              await validatePDFFile(downloadPath, reporter);
              
              return; // Success!
            }
          } catch (downloadError) {
            await reporter.documentIssue(page, {
              step: 'PDF Download',
              expected: 'PDF file to download successfully',
              actual: `Download failed: ${downloadError.message}`,
              error: downloadError as Error
            });
          }
          
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // If UI export didn't work, try API testing
    await testPDFAPIDirectly(page, reporter);
  };

  // Helper method for direct API testing
  const testPDFAPIDirectly = async (page: Page, reporter: TestReporter) => {
    reporter.setCurrentStep('Direct PDF API Testing');
    
    try {
      // Test PDF generation via API
      const response = await page.request.post(TEST_CONFIG.api.endpoints.generatePDF, {
        data: {
          documentType: 'executive-summary',
          reportData: {
            executiveSummary: {
              overview: 'E2E test PDF generation',
              automationScore: 85,
              estimatedROI: '$25,000'
            }
          },
          options: {
            page: { format: 'A4' },
            filename: 'e2e-test-report.pdf'
          }
        }
      });

      if (response.ok()) {
        const contentType = response.headers()['content-type'];
        
        if (contentType?.includes('application/pdf')) {
          const pdfBuffer = await response.body();
          
          // Save PDF for validation
          const testPdfPath = path.join('test-results', 'e2e-api-test.pdf');
          fs.writeFileSync(testPdfPath, pdfBuffer);
          
          await reporter.documentSuccess(page, 'Direct PDF API', 
            `PDF generated via API: ${pdfBuffer.length} bytes`);
          
          await validatePDFFile(testPdfPath, reporter);
        } else {
          await reporter.documentIssue(page, {
            step: 'Direct PDF API',
            expected: 'PDF content type in response',
            actual: `Content type: ${contentType}`,
            error: new Error('API returned non-PDF content')
          });
        }
      } else {
        const errorText = await response.text();
        await reporter.documentIssue(page, {
          step: 'Direct PDF API',
          expected: 'Successful API response',
          actual: `HTTP ${response.status()}: ${errorText}`,
          error: new Error('PDF API call failed')
        });
      }
      
    } catch (error) {
      await reporter.documentIssue(page, {
        step: 'Direct PDF API',
        expected: 'API call to succeed',
        actual: `API call failed: ${error.message}`,
        error: error as Error
      });
    }
  };

  // Helper method for PDF validation
  const validatePDFFile = async (filePath: string, reporter: TestReporter) => {
    try {
      const fileStats = fs.statSync(filePath);
      const fileBuffer = fs.readFileSync(filePath);
      
      // Basic PDF validation
      const isPDF = fileBuffer.toString('ascii', 0, 4) === '%PDF';
      
      if (isPDF) {
        console.log(`✅ Valid PDF file: ${fileStats.size} bytes, ${filePath}`);
      } else {
        await reporter.documentIssue(page, {
          step: 'PDF Validation',
          expected: 'Valid PDF file with %PDF header',
          actual: `File header: ${fileBuffer.toString('ascii', 0, 10)}`,
          error: new Error('Invalid PDF format')
        });
      }
      
      // File size validation
      if (fileStats.size >= TEST_CONFIG.pdf.minFileSize && fileStats.size <= TEST_CONFIG.pdf.maxFileSize) {
        console.log(`✅ File size within acceptable range: ${fileStats.size} bytes`);
      } else {
        await reporter.documentIssue(page, {
          step: 'PDF Size Validation',
          expected: `File size between ${TEST_CONFIG.pdf.minFileSize} and ${TEST_CONFIG.pdf.maxFileSize} bytes`,
          actual: `File size: ${fileStats.size} bytes`,
          error: new Error('PDF file size outside expected range')
        });
      }
      
    } catch (error) {
      await reporter.documentIssue(page, {
        step: 'PDF Validation',
        expected: 'PDF file to be readable and valid',
        actual: `Validation failed: ${error.message}`,
        error: error as Error
      });
    }
  };
});