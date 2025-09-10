import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('PDF Generation E2E Tests', () => {
  let testReportData;
  let testSOPData;

  test.beforeAll(() => {
    // Prepare test data
    testReportData = {
      executiveSummary: {
        overview: 'This is a test audit report for PDF generation validation',
        automationScore: 85,
        totalTimeSavings: '10-15 hours/week',
        quickWins: 3,
        strategicOpportunities: 2,
        estimatedROI: '350%'
      },
      automationOpportunities: [
        {
          id: 'test-1',
          stepDescription: 'Manual data entry process',
          solution: 'Implement automated form processing',
          category: 'quick-win',
          priority: 90,
          effort: 'Medium',
          timeSavings: '8 hours per week',
          estimatedCost: '$500-1000',
          tools: ['Zapier', 'Microsoft Power Automate'],
          implementationSteps: [
            'Select automation platform',
            'Configure form processing rules',
            'Set up data validation',
            'Test automated workflow'
          ],
          technicalRequirements: 'Form processing software with API integration'
        }
      ],
      roadmap: [
        {
          phase: 'Phase 1: Quick Wins (Weeks 1-4)',
          items: ['Automate form processing', 'Set up data validation'],
          estimatedSavings: '8 hours/week',
          estimatedCost: '$500-1000',
          keyBenefits: ['Immediate time savings', 'Reduced errors']
        }
      ],
      implementationGuidance: {
        gettingStarted: [
          'Evaluate automation platforms',
          'Define data processing rules',
          'Set up initial workflows'
        ],
        successMetrics: [
          'Processing time reduced by 80%',
          'Error rate below 1%',
          'Team productivity increase of 30%'
        ],
        riskConsiderations: [
          'Ensure proper data backup',
          'Plan for staff training',
          'Monitor system performance'
        ]
      }
    };

    testSOPData = {
      metadata: {
        title: 'Customer Support Ticket Processing SOP',
        sopVersion: '1.0',
        department: 'Customer Support',
        preparedBy: 'ProcessAudit AI Test',
        effectiveDate: '2025-01-01'
      },
      purpose: 'To standardize the process of handling customer support tickets',
      scope: 'This SOP applies to all customer support team members',
      procedure: [
        {
          step: 1,
          action: 'Receive and acknowledge customer ticket',
          responsibility: 'Support Agent',
          timing: 'Within 2 hours',
          qualityCriteria: 'Acknowledgment sent with ticket number'
        },
        {
          step: 2,
          action: 'Categorize ticket by priority and type',
          responsibility: 'Support Agent',
          timing: 'Within 4 hours',
          qualityCriteria: 'Accurate categorization based on guidelines'
        }
      ]
    };
  });

  test('Direct API Test: Generate Audit Report PDF', async ({ request }) => {
    console.log('Testing direct PDF API for audit report...');
    
    const response = await request.post('http://localhost:3000/api/generate-pdf', {
      data: {
        documentType: 'audit-report',
        reportData: testReportData,
        processData: {
          processName: 'Customer Support Process',
          industry: 'Technology',
          department: 'Customer Service'
        },
        options: {
          page: { format: 'A4', orientation: 'portrait' },
          filename: 'test-audit-report.pdf',
          metadata: {
            title: 'Test Audit Report - ProcessAudit AI',
            author: 'ProcessAudit AI Test Suite',
            subject: 'Business Process Analysis Report'
          },
          options: {
            coverPage: true,
            tableOfContents: true,
            pageNumbers: true,
            headerFooter: true
          }
        }
      }
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect(response.headers()['content-disposition']).toContain('attachment');
    expect(response.headers()['content-disposition']).toContain('test-audit-report.pdf');

    // Verify PDF content is not empty
    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(1000); // PDF should be substantial size
    
    // Verify it starts with PDF signature
    const pdfHeader = buffer.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');

    console.log(`✅ Audit Report PDF generated successfully (${buffer.length} bytes)`);
  });

  test('Direct API Test: Generate Executive Summary PDF', async ({ request }) => {
    console.log('Testing direct PDF API for executive summary...');
    
    const response = await request.post('http://localhost:3000/api/generate-pdf', {
      data: {
        documentType: 'executive-summary',
        reportData: testReportData,
        processData: {
          processName: 'Customer Support Process',
          industry: 'Technology'
        },
        options: {
          page: { format: 'A4', orientation: 'portrait' },
          filename: 'test-executive-summary.pdf',
          metadata: {
            title: 'Executive Summary - ProcessAudit AI',
            author: 'ProcessAudit AI Test Suite'
          },
          options: {
            coverPage: true,
            tableOfContents: false,
            pageNumbers: true,
            headerFooter: true
          }
        }
      }
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');

    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');

    console.log(`✅ Executive Summary PDF generated successfully (${buffer.length} bytes)`);
  });

  test('Direct API Test: Generate SOP Document PDF', async ({ request }) => {
    console.log('Testing direct PDF API for SOP document...');
    
    const response = await request.post('http://localhost:3000/api/generate-pdf', {
      data: {
        documentType: 'sop-document',
        sopData: testSOPData,
        options: {
          page: { format: 'A4', orientation: 'portrait' },
          filename: 'test-sop-document.pdf',
          metadata: {
            title: 'Test SOP Document - ProcessAudit AI',
            author: 'ProcessAudit AI Test Suite',
            subject: 'Standard Operating Procedure'
          },
          options: {
            coverPage: true,
            tableOfContents: false,
            pageNumbers: true,
            headerFooter: true
          }
        }
      }
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');

    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');

    console.log(`✅ SOP Document PDF generated successfully (${buffer.length} bytes)`);
  });

  test('Direct API Test: PDF Preview Generation', async ({ request }) => {
    console.log('Testing PDF preview API...');
    
    const response = await request.post('http://localhost:3000/api/pdf-preview', {
      data: {
        documentType: 'audit-report',
        data: testReportData,
        options: {
          pageCount: 3,
          quality: 'medium'
        }
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.previewImages).toBeDefined();
    expect(Array.isArray(data.previewImages)).toBe(true);
    expect(data.totalPages).toBeGreaterThan(0);

    console.log(`✅ PDF Preview generated successfully (${data.totalPages} pages)`);
  });

  test('Error Handling: Missing Document Type', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/generate-pdf', {
      data: {
        reportData: testReportData,
        options: {
          page: { format: 'A4' },
          filename: 'test.pdf'
        }
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Document type is required');
  });

  test('Error Handling: Missing Options', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/generate-pdf', {
      data: {
        documentType: 'audit-report',
        reportData: testReportData
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('PDF options are required');
  });

  test('Error Handling: Invalid Document Type', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/generate-pdf', {
      data: {
        documentType: 'invalid-type',
        reportData: testReportData,
        options: {
          page: { format: 'A4' },
          filename: 'test.pdf'
        }
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test('Performance Test: PDF Generation Time', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.post('http://localhost:3000/api/generate-pdf', {
      data: {
        documentType: 'audit-report',
        reportData: testReportData,
        options: {
          page: { format: 'A4' },
          filename: 'performance-test.pdf',
          metadata: {
            title: 'Performance Test PDF'
          }
        }
      }
    });

    const endTime = Date.now();
    const generationTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(generationTime).toBeLessThan(10000); // Should complete within 10 seconds
    
    console.log(`✅ PDF generated in ${generationTime}ms`);
  });

  test('Link Delivery Method Test', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/generate-pdf?delivery=link', {
      data: {
        documentType: 'audit-report',
        reportData: testReportData,
        options: {
          page: { format: 'A4' },
          filename: 'link-test.pdf'
        }
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.downloadUrl).toBeDefined();
    expect(data.fileId).toBeDefined();
    expect(data.expiresAt).toBeDefined();

    console.log(`✅ PDF link generated: ${data.downloadUrl}`);
  });

  test('File Download and Validation', async ({ request }) => {
    // Generate PDF and save to test directory
    const response = await request.post('http://localhost:3000/api/generate-pdf', {
      data: {
        documentType: 'audit-report',
        reportData: testReportData,
        options: {
          page: { format: 'A4' },
          filename: 'validation-test.pdf'
        }
      }
    });

    expect(response.status()).toBe(200);
    
    // Save file for validation
    const buffer = await response.body();
    const testDir = path.join(process.cwd(), 'test-outputs');
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const filePath = path.join(testDir, `pdf-test-${Date.now()}.pdf`);
    fs.writeFileSync(filePath, buffer);
    
    // Validate file exists and has content
    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(1000);
    
    console.log(`✅ PDF saved and validated: ${filePath} (${stats.size} bytes)`);
    
    // Clean up
    fs.unlinkSync(filePath);
  });
});