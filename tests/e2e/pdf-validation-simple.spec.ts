// Simple PDF Validation Test - ProcessAudit AI
// Direct API testing to validate PDF generation functionality

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../test-config';

test.describe('ProcessAudit AI PDF Generation Validation', () => {
  
  test('Validate PDF Generation API Functionality', async ({ request }) => {
    console.log('🚀 Starting PDF generation validation...');
    
    const testData = {
      documentType: 'audit-report',
      reportData: {
        executiveSummary: {
          overview: 'E2E Test: Comprehensive business process audit demonstrating PDF generation capabilities',
          automationScore: 88,
          estimatedROI: '$75,000',
          timeSavings: '25 hours/week',
          complexityScore: 6
        },
        automationOpportunities: [
          {
            title: 'Automate Customer Onboarding',
            description: 'Streamline new customer setup process',
            priority: 'high',
            impact: 'Significant time savings and improved accuracy',
            effort: 'Medium implementation'
          },
          {
            title: 'Invoice Processing Automation',
            description: 'Automated invoice capture and approval routing', 
            priority: 'high',
            impact: 'Reduce processing time by 80%',
            effort: 'Low implementation'
          }
        ],
        roadmap: {
          overview: 'Strategic implementation plan for maximum business impact',
          phases: [
            {
              name: 'Quick Wins Implementation',
              duration: '4-6 weeks',
              resources: '2-3 team members',
              tasks: ['Set up automation tools', 'Configure basic workflows', 'Train team'],
              benefits: 'Immediate 40% efficiency gain'
            }
          ]
        },
        implementationGuidance: {
          overview: 'Best practices for successful automation rollout',
          bestPractices: [
            'Start with pilot projects',
            'Ensure stakeholder buy-in',
            'Measure results continuously'
          ],
          nextSteps: [
            'Review automation opportunities with team',
            'Select high-impact, low-effort initiatives',
            'Begin implementation planning'
          ]
        }
      },
      options: {
        page: { format: 'A4' },
        filename: 'e2e-test-audit-report.pdf',
        metadata: {
          title: 'E2E Test Audit Report - ProcessAudit AI',
          author: 'E2E Test Suite'
        },
        options: {
          coverPage: true,
          tableOfContents: true,
          pageNumbers: true
        }
      }
    };

    // Test 1: Audit Report PDF Generation
    console.log('📄 Testing Audit Report PDF generation...');
    
    const auditResponse = await request.post(TEST_CONFIG.api.endpoints.generatePDF, {
      data: testData
    });

    expect(auditResponse.ok()).toBeTruthy();
    
    const auditPDFBuffer = await auditResponse.body();
    expect(auditPDFBuffer.length).toBeGreaterThan(TEST_CONFIG.pdf.minFileSize);
    
    // Validate PDF header
    const pdfHeader = auditPDFBuffer.toString('ascii', 0, 4);
    expect(pdfHeader).toBe('%PDF');
    
    console.log(`✅ Audit Report PDF: ${auditPDFBuffer.length} bytes`);

    // Test 2: Executive Summary PDF Generation
    console.log('📊 Testing Executive Summary PDF generation...');
    
    const executiveData = {
      ...testData,
      documentType: 'executive-summary',
      options: {
        ...testData.options,
        filename: 'e2e-test-executive-summary.pdf'
      }
    };

    const executiveResponse = await request.post(TEST_CONFIG.api.endpoints.generatePDF, {
      data: executiveData
    });

    expect(executiveResponse.ok()).toBeTruthy();
    
    const executivePDFBuffer = await executiveResponse.body();
    expect(executivePDFBuffer.length).toBeGreaterThan(TEST_CONFIG.pdf.minFileSize);
    
    console.log(`✅ Executive Summary PDF: ${executivePDFBuffer.length} bytes`);

    // Test 3: Performance Validation
    console.log('⚡ Testing PDF generation performance...');
    
    const performanceStart = Date.now();
    
    const perfResponse = await request.post(TEST_CONFIG.api.endpoints.generatePDF, {
      data: {
        ...testData,
        options: {
          ...testData.options,
          filename: 'e2e-performance-test.pdf'
        }
      }
    });
    
    const performanceTime = Date.now() - performanceStart;
    
    expect(perfResponse.ok()).toBeTruthy();
    expect(performanceTime).toBeLessThan(5000); // Should complete in under 5 seconds
    
    console.log(`✅ Performance: PDF generated in ${performanceTime}ms`);

    // Test 4: Multiple Document Types
    console.log('📋 Testing multiple document types...');
    
    const documentTypes = ['audit-report', 'executive-summary'];
    const results = [];
    
    for (const docType of documentTypes) {
      const response = await request.post(TEST_CONFIG.api.endpoints.generatePDF, {
        data: {
          documentType: docType,
          reportData: testData.reportData,
          options: {
            page: { format: 'A4' },
            filename: `e2e-test-${docType}.pdf`
          }
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const pdfBuffer = await response.body();
      
      results.push({
        type: docType,
        size: pdfBuffer.length,
        valid: pdfBuffer.toString('ascii', 0, 4) === '%PDF'
      });
    }
    
    console.log('✅ Multi-format results:', results);
    
    // Validate all PDFs are properly formatted
    results.forEach(result => {
      expect(result.valid).toBeTruthy();
      expect(result.size).toBeGreaterThan(1000);
    });

    console.log('🎉 All PDF generation tests completed successfully!');
  });

  test('PDF Error Handling Validation', async ({ request }) => {
    console.log('🔧 Testing PDF error handling...');

    // Test invalid document type
    const invalidResponse = await request.post(TEST_CONFIG.api.endpoints.generatePDF, {
      data: {
        documentType: 'invalid-type',
        reportData: {},
        options: {
          page: { format: 'A4' },
          filename: 'test.pdf'
        }
      }
    });

    expect(invalidResponse.ok()).toBeFalsy();
    expect(invalidResponse.status()).toBe(400);
    
    const errorResponse = await invalidResponse.json();
    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toContain('Invalid document type');
    
    console.log('✅ Error handling working correctly');
  });

  test('PDF Generation Concurrent Requests', async ({ request }) => {
    console.log('⚡ Testing concurrent PDF generation...');
    
    const baseRequest = {
      documentType: 'executive-summary',
      reportData: {
        executiveSummary: {
          overview: 'Concurrent test PDF',
          automationScore: 75
        }
      },
      options: {
        page: { format: 'A4' },
        filename: 'concurrent-test.pdf'
      }
    };

    // Generate 3 PDFs concurrently
    const promises = Array(3).fill(0).map((_, index) => 
      request.post(TEST_CONFIG.api.endpoints.generatePDF, {
        data: {
          ...baseRequest,
          options: {
            ...baseRequest.options,
            filename: `concurrent-test-${index}.pdf`
          }
        }
      })
    );

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    // Validate all responses
    responses.forEach((response, index) => {
      expect(response.ok()).toBeTruthy();
    });

    console.log(`✅ Concurrent generation: 3 PDFs in ${totalTime}ms`);
    expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
  });
});