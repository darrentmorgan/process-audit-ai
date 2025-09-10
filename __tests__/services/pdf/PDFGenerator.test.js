/**
 * PDFGenerator Service Tests
 * 
 * Comprehensive test suite for PDF generation functionality
 * Tests all document types, error scenarios, and performance characteristics
 */

const PDFGenerator = require('../../../services/pdf/PDFGenerator')

describe('PDFGenerator', () => {
  let pdfGenerator

  beforeEach(() => {
    pdfGenerator = new PDFGenerator({
      templates: {},
      branding: {
        companyName: 'Test Company',
        primaryColor: '#2563eb'
      },
      export: {
        tempDirectory: '/tmp/test-pdf'
      }
    })
  })

  afterEach(() => {
    // Clean up any generated files
    pdfGenerator.resetStats()
  })

  describe('initialization', () => {
    it('should exist and be importable', () => {
      expect(PDFGenerator).toBeDefined()
    })

    it('should initialize with default options', () => {
      const generator = new PDFGenerator()
      expect(generator).toBeInstanceOf(PDFGenerator)
      expect(generator.stats).toBeDefined()
      expect(generator.templateEngine).toBeDefined()
      expect(generator.brandingService).toBeDefined()
      expect(generator.exportService).toBeDefined()
      expect(generator.componentRenderer).toBeDefined()
    })

    it('should initialize with custom options', () => {
      const customOptions = {
        templates: { custom: 'template' },
        branding: { companyName: 'Custom Corp' }
      }
      const generator = new PDFGenerator(customOptions)
      expect(generator).toBeInstanceOf(PDFGenerator)
    })
  })

  describe('PDF generation', () => {
    const validAuditReportRequest = {
      documentType: 'audit-report',
      reportData: {
        executiveSummary: {
          overview: 'Test process analysis summary',
          automationScore: 85,
          estimatedROI: '$50,000',
          timeSavings: '20 hours/week'
        },
        automationOpportunities: [
          {
            title: 'Automate Data Entry',
            description: 'Implement automated data entry system',
            priority: 'high',
            impact: 'High time savings',
            effort: 'Medium implementation'
          }
        ]
      },
      options: {
        page: { format: 'A4' },
        filename: 'test-audit-report.pdf'
      }
    }

    const validSOPRequest = {
      documentType: 'sop-document',
      sopData: {
        metadata: {
          title: 'Test SOP Document',
          sopVersion: '1.0',
          effectiveDate: new Date(),
          approvalStatus: 'draft'
        },
        purpose: 'Test SOP for unit testing',
        scope: 'Testing scope',
        procedures: [
          {
            name: 'Test Procedure',
            steps: [
              {
                stepNumber: 1,
                title: 'First Step',
                description: 'This is the first test step'
              }
            ]
          }
        ]
      },
      options: {
        page: { format: 'A4' },
        filename: 'test-sop.pdf'
      }
    }

    it('should generate audit report PDF successfully', async () => {
      const result = await pdfGenerator.generatePDF(validAuditReportRequest)
      
      expect(result.success).toBe(true)
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toBe('test-audit-report.pdf')
      expect(result.fileSize).toBeGreaterThan(0)
      expect(result.generatedAt).toBeInstanceOf(Date)
      expect(result.generationTime).toBeGreaterThan(0)
    })

    it('should generate SOP document PDF successfully', async () => {
      const result = await pdfGenerator.generatePDF(validSOPRequest)
      
      expect(result.success).toBe(true)
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toBe('test-sop.pdf')
      expect(result.fileSize).toBeGreaterThan(0)
    })

    it('should generate executive summary PDF successfully', async () => {
      const executiveSummaryRequest = {
        documentType: 'executive-summary',
        reportData: validAuditReportRequest.reportData,
        options: {
          page: { format: 'A4' },
          filename: 'test-executive-summary.pdf'
        }
      }

      const result = await pdfGenerator.generatePDF(executiveSummaryRequest)
      
      expect(result.success).toBe(true)
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toBe('test-executive-summary.pdf')
    })

    it('should update statistics after successful generation', async () => {
      const initialStats = pdfGenerator.getStats()
      
      await pdfGenerator.generatePDF(validAuditReportRequest)
      
      const updatedStats = pdfGenerator.getStats()
      expect(updatedStats.totalGenerated).toBe(initialStats.totalGenerated + 1)
      expect(updatedStats.generationsByType['audit-report']).toBe(1)
      expect(updatedStats.averageGenerationTime).toBeGreaterThan(0)
    })

    it('should handle different page formats', async () => {
      const letterFormatRequest = {
        ...validAuditReportRequest,
        options: {
          ...validAuditReportRequest.options,
          page: { format: 'Letter' }
        }
      }

      const result = await pdfGenerator.generatePDF(letterFormatRequest)
      expect(result.success).toBe(true)
    })

    it('should apply branding correctly', async () => {
      const brandedRequest = {
        ...validAuditReportRequest,
        options: {
          ...validAuditReportRequest.options,
          branding: {
            companyName: 'Branded Company',
            primaryColor: '#ff0000'
          }
        }
      }

      const result = await pdfGenerator.generatePDF(brandedRequest)
      expect(result.success).toBe(true)
    })
  })

  describe('PDF preview generation', () => {
    it('should generate preview successfully', async () => {
      const previewRequest = {
        documentType: 'audit-report',
        data: {
          executiveSummary: { overview: 'Test preview' }
        }
      }

      const result = await pdfGenerator.generatePreview(previewRequest)
      
      expect(result.success).toBe(true)
      expect(result.previewImages).toBeInstanceOf(Array)
      expect(result.previewImages.length).toBeGreaterThan(0)
      expect(result.totalPages).toBeGreaterThan(0)
    })

    it('should handle preview for unsupported document types', async () => {
      const previewRequest = {
        documentType: 'unsupported-type',
        data: {}
      }

      const result = await pdfGenerator.generatePreview(previewRequest)
      expect(result.success).toBe(true)
      expect(result.previewImages).toBeInstanceOf(Array)
    })
  })

  describe('error handling', () => {
    it('should handle missing document type', async () => {
      const invalidRequest = {
        reportData: {},
        options: { page: { format: 'A4' }, filename: 'test.pdf' }
      }

      const result = await pdfGenerator.generatePDF(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Document type is required')
    })

    it('should handle invalid document type', async () => {
      const invalidRequest = {
        documentType: 'invalid-type',
        reportData: {},
        options: { page: { format: 'A4' }, filename: 'test.pdf' }
      }

      const result = await pdfGenerator.generatePDF(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid document type')
    })

    it('should handle missing options', async () => {
      const invalidRequest = {
        documentType: 'audit-report',
        reportData: {}
      }

      const result = await pdfGenerator.generatePDF(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('PDF options are required')
    })

    it('should handle missing filename', async () => {
      const invalidRequest = {
        documentType: 'audit-report',
        reportData: {},
        options: { page: { format: 'A4' } }
      }

      const result = await pdfGenerator.generatePDF(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('PDF filename is required')
    })

    it('should update error statistics', async () => {
      const initialStats = pdfGenerator.getStats()
      
      const invalidRequest = {
        documentType: 'invalid-type',
        reportData: {},
        options: { page: { format: 'A4' }, filename: 'test.pdf' }
      }

      await pdfGenerator.generatePDF(invalidRequest)
      
      const updatedStats = pdfGenerator.getStats()
      expect(updatedStats.totalErrors).toBe(initialStats.totalErrors + 1)
    })

    it('should handle empty report data gracefully', async () => {
      const emptyDataRequest = {
        documentType: 'audit-report',
        reportData: {},
        options: {
          page: { format: 'A4' },
          filename: 'empty-test.pdf'
        }
      }

      const result = await pdfGenerator.generatePDF(emptyDataRequest)
      
      // Should still generate PDF with empty/default content
      expect(result.success).toBe(true)
    })
  })

  describe('statistics and monitoring', () => {
    it('should track generation statistics', async () => {
      const request = {
        documentType: 'audit-report',
        reportData: { executiveSummary: { overview: 'Test' } },
        options: { page: { format: 'A4' }, filename: 'stats-test.pdf' }
      }

      await pdfGenerator.generatePDF(request)
      await pdfGenerator.generatePDF(request)
      
      const stats = pdfGenerator.getStats()
      expect(stats.totalGenerated).toBe(2)
      expect(stats.generationsByType['audit-report']).toBe(2)
      expect(stats.averageGenerationTime).toBeGreaterThan(0)
    })

    it('should reset statistics', () => {
      const initialStats = pdfGenerator.getStats()
      pdfGenerator.resetStats()
      const resetStats = pdfGenerator.getStats()
      
      expect(resetStats.totalGenerated).toBe(0)
      expect(resetStats.totalErrors).toBe(0)
      expect(resetStats.averageGenerationTime).toBe(0)
      expect(Object.keys(resetStats.generationsByType)).toHaveLength(0)
    })
  })

  describe('performance characteristics', () => {
    it('should complete generation within reasonable time', async () => {
      const request = {
        documentType: 'audit-report',
        reportData: {
          executiveSummary: { overview: 'Performance test' },
          automationOpportunities: Array(10).fill({
            title: 'Test Opportunity',
            description: 'Performance test opportunity'
          })
        },
        options: {
          page: { format: 'A4' },
          filename: 'performance-test.pdf'
        }
      }

      const startTime = Date.now()
      const result = await pdfGenerator.generatePDF(request)
      const endTime = Date.now()
      
      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(30000) // Should complete within 30 seconds
    })

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill().map((_, index) => ({
        documentType: 'audit-report',
        reportData: { executiveSummary: { overview: `Concurrent test ${index}` } },
        options: {
          page: { format: 'A4' },
          filename: `concurrent-test-${index}.pdf`
        }
      }))

      const startTime = Date.now()
      const results = await Promise.all(
        requests.map(request => pdfGenerator.generatePDF(request))
      )
      const endTime = Date.now()

      results.forEach(result => {
        expect(result.success).toBe(true)
      })
      
      const stats = pdfGenerator.getStats()
      expect(stats.totalGenerated).toBe(5)
      expect(endTime - startTime).toBeLessThan(60000) // Should complete within 60 seconds
    })
  })
})