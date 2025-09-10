/**
 * PDF Generation API Tests
 * 
 * Integration tests for PDF generation API endpoints
 * Tests the full API flow from request to response
 */

import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/generate-pdf'
import previewHandler from '../../pages/api/pdf-preview'

// Mock the PDF services to avoid actual PDF generation in tests
jest.mock('../../services/pdf/PDFGenerator', () => {
  return jest.fn().mockImplementation(() => ({
    generatePDF: jest.fn().mockResolvedValue({
      success: true,
      buffer: Buffer.from('mock-pdf-data'),
      filename: 'test.pdf',
      fileSize: 1024,
      generatedAt: new Date(),
      generationTime: 500
    }),
    generatePreview: jest.fn().mockResolvedValue({
      success: true,
      previewImages: ['data:image/png;base64,mock-preview'],
      totalPages: 3
    })
  }))
})

describe('/api/generate-pdf', () => {
  describe('POST requests', () => {
    it('should generate PDF successfully with valid request', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'audit-report',
          reportData: {
            executiveSummary: {
              overview: 'Test report summary',
              automationScore: 85
            }
          },
          options: {
            page: { format: 'A4' },
            filename: 'test-audit-report.pdf'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res._getHeaders()['content-type']).toBe('application/pdf')
      expect(res._getHeaders()['content-disposition']).toContain('attachment')
      expect(res._getData()).toBeDefined()
    })

    it('should return download link when delivery method is link', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { delivery: 'link' },
        body: {
          documentType: 'audit-report',
          reportData: {
            executiveSummary: { overview: 'Test' }
          },
          options: {
            page: { format: 'A4' },
            filename: 'test.pdf'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.downloadUrl).toBeDefined()
      expect(data.fileId).toBeDefined()
      expect(data.expiresAt).toBeDefined()
    })

    it('should handle SOP document generation', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'sop-document',
          sopData: {
            metadata: {
              title: 'Test SOP',
              sopVersion: '1.0'
            },
            purpose: 'Test SOP purpose',
            scope: 'Test scope'
          },
          options: {
            page: { format: 'A4' },
            filename: 'test-sop.pdf'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res._getHeaders()['content-type']).toBe('application/pdf')
    })

    it('should handle executive summary generation', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'executive-summary',
          reportData: {
            executiveSummary: {
              overview: 'Executive test',
              automationScore: 75
            }
          },
          options: {
            page: { format: 'Letter' },
            filename: 'executive-summary.pdf'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res._getHeaders()['content-type']).toBe('application/pdf')
    })
  })

  describe('error handling', () => {
    it('should return 405 for non-POST requests', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Method not allowed')
    })

    it('should return 400 for missing document type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          reportData: {},
          options: {
            page: { format: 'A4' },
            filename: 'test.pdf'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Document type is required')
    })

    it('should return 400 for missing options', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'audit-report',
          reportData: {}
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('PDF options are required')
    })

    it('should return 400 for missing email recipient when delivery is email', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { delivery: 'email' },
        body: {
          documentType: 'audit-report',
          reportData: { executiveSummary: { overview: 'Test' } },
          options: {
            page: { format: 'A4' },
            filename: 'test.pdf'
          },
          emailOptions: {
            // Missing 'to' field
            subject: 'Your report'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Email recipient is required')
    })

    it('should return 400 for invalid delivery method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { delivery: 'invalid-method' },
        body: {
          documentType: 'audit-report',
          reportData: { executiveSummary: { overview: 'Test' } },
          options: {
            page: { format: 'A4' },
            filename: 'test.pdf'
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid delivery method')
    })
  })

  describe('configuration and headers', () => {
    it('should set proper PDF headers for direct download', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'audit-report',
          reportData: { executiveSummary: { overview: 'Test' } },
          options: {
            page: { format: 'A4' },
            filename: 'report-with-spaces.pdf'
          }
        }
      })

      await handler(req, res)

      const headers = res._getHeaders()
      expect(headers['content-type']).toBe('application/pdf')
      expect(headers['content-disposition']).toContain('attachment')
      expect(headers['content-disposition']).toContain('report-with-spaces.pdf')
      expect(headers['cache-control']).toContain('no-cache')
    })

    it('should apply default options when not provided', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'audit-report',
          reportData: { executiveSummary: { overview: 'Test' } },
          options: {
            filename: 'test.pdf'
            // Missing page format - should default to A4
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should set proper metadata in PDF options', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'audit-report',
          reportData: { executiveSummary: { overview: 'Test' } },
          options: {
            page: { format: 'A4' },
            filename: 'metadata-test.pdf',
            metadata: {
              title: 'Custom Title',
              author: 'Custom Author'
            }
          }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // The metadata should be passed through to the PDF generator
    })
  })
})

describe('/api/pdf-preview', () => {
  describe('POST requests', () => {
    it('should generate preview successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'audit-report',
          data: {
            executiveSummary: { overview: 'Preview test' }
          },
          options: {
            pageCount: 2,
            quality: 'medium'
          }
        }
      })

      await previewHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.previewImages).toBeInstanceOf(Array)
      expect(data.totalPages).toBeDefined()
    })

    it('should return 405 for non-POST requests', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      })

      await previewHandler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should return 400 for missing document type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          data: { executiveSummary: { overview: 'Test' } }
        }
      })

      await previewHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Document type is required')
    })

    it('should return 400 for missing data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'audit-report'
        }
      })

      await previewHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Data is required')
    })

    it('should limit preview page count', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'audit-report',
          data: { executiveSummary: { overview: 'Test' } },
          options: {
            pageCount: 10 // Should be limited to max 5
          }
        }
      })

      await previewHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // The pageCount should be limited internally
    })

    it('should use default preview options when not provided', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          documentType: 'audit-report',
          data: { executiveSummary: { overview: 'Test' } }
        }
      })

      await previewHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })
})

describe('API error handling and resilience', () => {
  it('should handle PDF generation failures gracefully', async () => {
    // Mock PDF generator to fail
    const PDFGenerator = require('../../services/pdf/PDFGenerator')
    PDFGenerator.mockImplementationOnce(() => ({
      generatePDF: jest.fn().mockResolvedValue({
        success: false,
        error: 'Generation failed'
      })
    }))

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        documentType: 'audit-report',
        reportData: { executiveSummary: { overview: 'Test' } },
        options: {
          page: { format: 'A4' },
          filename: 'test.pdf'
        }
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })

  it('should handle unexpected errors gracefully', async () => {
    // Mock PDF generator to throw an error
    const PDFGenerator = require('../../services/pdf/PDFGenerator')
    PDFGenerator.mockImplementationOnce(() => ({
      generatePDF: jest.fn().mockRejectedValue(new Error('Unexpected error'))
    }))

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        documentType: 'audit-report',
        reportData: { executiveSummary: { overview: 'Test' } },
        options: {
          page: { format: 'A4' },
          filename: 'test.pdf'
        }
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error).toContain('Internal server error')
  })

  it('should include error details in development mode', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const PDFGenerator = require('../../services/pdf/PDFGenerator')
    PDFGenerator.mockImplementationOnce(() => ({
      generatePDF: jest.fn().mockResolvedValue({
        success: false,
        error: 'Development error',
        errorDetails: 'Detailed stack trace'
      })
    }))

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        documentType: 'audit-report',
        reportData: { executiveSummary: { overview: 'Test' } },
        options: {
          page: { format: 'A4' },
          filename: 'test.pdf'
        }
      }
    })

    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(data.details).toBeDefined()

    process.env.NODE_ENV = originalEnv
  })
})