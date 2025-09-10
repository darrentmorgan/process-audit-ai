import { test, expect } from '@playwright/test';

// Direct PDF API Tests - No UI navigation required
test.describe('ProcessAudit AI PDF API Direct Tests', () => {
  const testReportData = {
    executiveSummary: {
      overview: "Test audit report for direct API validation",
      automationScore: 88,
      totalTimeSavings: "15-20 hours/week",
      quickWins: 4,
      strategicOpportunities: 3,
      estimatedROI: "420%"
    },
    automationOpportunities: [
      {
        id: 'api-test-1',
        stepDescription: 'Manual document processing',
        solution: 'Implement automated document workflow',
        category: 'quick-win',
        priority: 85,
        effort: 'Medium',
        timeSavings: '6 hours per week',
        estimatedCost: '$800-1500',
        tools: ['ProcessAudit AI', 'Zapier'],
        implementationSteps: [
          'Setup document automation platform',
          'Configure processing rules',
          'Test workflow validation'
        ],
        technicalRequirements: 'Document processing API with validation'
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1: Quick Implementation (Weeks 1-3)',
        items: ['Setup automated document processing', 'Configure validation rules'],
        estimatedSavings: '6 hours/week',
        estimatedCost: '$800-1500',
        keyBenefits: ['Immediate time savings', 'Improved accuracy']
      }
    ],
    implementationGuidance: {
      gettingStarted: [
        'Choose document automation platform',
        'Define processing workflows',
        'Set up validation criteria'
      ],
      successMetrics: [
        'Processing time reduced by 75%',
        'Error rate below 2%',
        'User satisfaction above 90%'
      ],
      riskConsiderations: [
        'Ensure document format compatibility',
        'Plan for user training period',
        'Monitor processing accuracy'
      ]
    }
  };

  const testSOPData = {
    metadata: {
      title: 'API Test SOP Document',
      sopVersion: '2.0',
      department: 'Quality Assurance',
      preparedBy: 'API Test Suite',
      effectiveDate: '2025-01-15'
    },
    purpose: 'To validate API-based SOP PDF generation functionality',
    scope: 'This SOP applies to automated testing procedures',
    procedure: [
      {
        step: 1,
        action: 'Initialize API test environment',
        responsibility: 'Test System',
        timing: 'Immediate',
        qualityCriteria: 'Environment ready for testing'
      },
      {
        step: 2,
        action: 'Execute PDF generation API call',
        responsibility: 'Test System',
        timing: 'Within 30 seconds',
        qualityCriteria: 'Valid PDF response received'
      }
    ]
  };

  test('API Direct: Generate Complete Audit Report PDF', async ({ request }) => {
    console.log('Testing audit report PDF generation via direct API...');
    
    const response = await request.post('/api/generate-pdf', {
      data: {
        documentType: 'audit-report',
        reportData: testReportData,
        processData: {
          processName: 'API Test Business Process',
          industry: 'Technology',
          department: 'Quality Assurance',
          processOwner: 'QA Team'
        },
        options: {
          page: { format: 'A4', orientation: 'portrait' },
          filename: 'api-test-audit-report.pdf',
          metadata: {
            title: 'API Test Audit Report - ProcessAudit AI',
            author: 'ProcessAudit AI Direct API Test',
            subject: 'Business Process Analysis Report',
            keywords: ['automation', 'audit', 'api-test']
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

    // Validate response
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect(response.headers()['content-disposition']).toContain('attachment');
    expect(response.headers()['content-disposition']).toContain('api-test-audit-report.pdf');

    // Validate PDF content
    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(1000); // PDFKit generates smaller files
    
    // Check PDF signature
    const pdfHeader = buffer.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');

    console.log(`✅ Audit Report PDF: ${buffer.length} bytes generated successfully`);
  });

  test('API Direct: Generate Executive Summary PDF', async ({ request }) => {
    console.log('Testing executive summary PDF generation via direct API...');
    
    const response = await request.post('/api/generate-pdf', {
      data: {
        documentType: 'executive-summary',
        reportData: testReportData,
        processData: {
          processName: 'API Test Process',
          industry: 'Technology'
        },
        options: {
          page: { format: 'A4', orientation: 'portrait' },
          filename: 'api-test-executive-summary.pdf',
          metadata: {
            title: 'API Test Executive Summary',
            author: 'ProcessAudit AI API Test'
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
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');

    console.log(`✅ Executive Summary PDF: ${buffer.length} bytes generated successfully`);
  });

  test('API Direct: Generate SOP Document PDF', async ({ request }) => {
    console.log('Testing SOP document PDF generation via direct API...');
    
    const response = await request.post('/api/generate-pdf', {
      data: {
        documentType: 'sop-document',
        sopData: testSOPData,
        options: {
          page: { format: 'A4', orientation: 'portrait' },
          filename: 'api-test-sop-document.pdf',
          metadata: {
            title: 'API Test SOP Document',
            author: 'ProcessAudit AI API Test',
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
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');

    console.log(`✅ SOP Document PDF: ${buffer.length} bytes generated successfully`);
  });

  test('API Direct: Test Different Page Formats', async ({ request }) => {
    console.log('Testing PDF generation with different page formats...');
    
    const formats = ['A4', 'Letter', 'Legal'];
    
    for (const format of formats) {
      const response = await request.post('/api/generate-pdf', {
        data: {
          documentType: 'executive-summary',
          reportData: testReportData,
          options: {
            page: { format: format, orientation: 'portrait' },
            filename: `api-test-${format.toLowerCase()}.pdf`
          }
        }
      });

      expect(response.status()).toBe(200);
      const buffer = await response.body();
      expect(buffer.length).toBeGreaterThan(1000);
      
      console.log(`✅ ${format} format PDF: ${buffer.length} bytes`);
    }
  });

  test('API Direct: Test PDF Generation Performance', async ({ request }) => {
    console.log('Testing PDF generation performance...');
    
    const startTime = Date.now();
    
    const response = await request.post('/api/generate-pdf', {
      data: {
        documentType: 'audit-report',
        reportData: testReportData,
        options: {
          page: { format: 'A4' },
          filename: 'performance-test.pdf'
        }
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(15000); // Should complete within 15 seconds

    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(1000);

    console.log(`✅ Performance test: PDF generated in ${duration}ms (${buffer.length} bytes)`);
  });

  test('API Direct: Test Error Handling', async ({ request }) => {
    console.log('Testing API error handling...');
    
    // Test missing document type
    const response1 = await request.post('/api/generate-pdf', {
      data: {
        reportData: testReportData,
        options: { page: { format: 'A4' }, filename: 'test.pdf' }
      }
    });

    expect(response1.status()).toBe(400);
    const error1 = await response1.json();
    expect(error1.success).toBe(false);
    expect(error1.error).toContain('Document type is required');
    
    // Test invalid document type
    const response2 = await request.post('/api/generate-pdf', {
      data: {
        documentType: 'invalid-type',
        reportData: testReportData,
        options: { page: { format: 'A4' }, filename: 'test.pdf' }
      }
    });

    expect(response2.status()).toBe(400);
    const error2 = await response2.json();
    expect(error2.success).toBe(false);
    
    // Test missing options
    const response3 = await request.post('/api/generate-pdf', {
      data: {
        documentType: 'audit-report',
        reportData: testReportData
      }
    });

    expect(response3.status()).toBe(400);
    const error3 = await response3.json();
    expect(error3.success).toBe(false);
    expect(error3.error).toContain('PDF options are required');

    console.log('✅ Error handling tests passed');
  });

  test('API Direct: Test Link Delivery Method', async ({ request }) => {
    console.log('Testing link delivery method...');
    
    const response = await request.post('/api/generate-pdf?delivery=link', {
      data: {
        documentType: 'audit-report',
        reportData: testReportData,
        options: {
          page: { format: 'A4' },
          filename: 'link-delivery-test.pdf'
        }
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.downloadUrl).toBeDefined();
    expect(data.fileId).toBeDefined();
    expect(data.expiresAt).toBeDefined();

    console.log(`✅ Link delivery test passed: ${data.downloadUrl}`);
  });

  test('API Direct: Test PDF Preview Generation', async ({ request }) => {
    console.log('Testing PDF preview generation...');
    
    const response = await request.post('/api/pdf-preview', {
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

    console.log(`✅ PDF Preview test passed: ${data.totalPages} pages generated`);
  });

  test('API Direct: Test Concurrent PDF Generation', async ({ request }) => {
    console.log('Testing concurrent PDF generation...');
    
    const startTime = Date.now();
    
    // Generate multiple PDFs concurrently
    const promises = [
      request.post('/api/generate-pdf', {
        data: {
          documentType: 'audit-report',
          reportData: testReportData,
          options: { page: { format: 'A4' }, filename: 'concurrent-1.pdf' }
        }
      }),
      request.post('/api/generate-pdf', {
        data: {
          documentType: 'executive-summary',
          reportData: testReportData,
          options: { page: { format: 'A4' }, filename: 'concurrent-2.pdf' }
        }
      }),
      request.post('/api/generate-pdf', {
        data: {
          documentType: 'sop-document',
          sopData: testSOPData,
          options: { page: { format: 'A4' }, filename: 'concurrent-3.pdf' }
        }
      })
    ];

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // All requests should succeed
    responses.forEach((response, index) => {
      expect(response.status()).toBe(200);
    });

    expect(duration).toBeLessThan(45000); // Should complete within 45 seconds

    console.log(`✅ Concurrent generation test passed: 3 PDFs in ${duration}ms`);
  });
});