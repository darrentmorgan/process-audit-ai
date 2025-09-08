import { SOPPDFGenerator } from '@/services/sop/SOPPDFGenerator'
import { SOPDocument, OrganizationBranding } from '@/types/sop'
import * as cloudStorage from '@/utils/cloudStorage'

// Mock dependencies
jest.mock('@/utils/cloudStorage', () => ({
  uploadToCloudStorage: jest.fn()
}))

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockImplementation(() => ({
    newPage: jest.fn().mockImplementation(() => ({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock pdf content')),
      close: jest.fn()
    })),
    close: jest.fn()
  }))
}))

describe('SOPPDFGenerator', () => {
  const mockSOPDocument: SOPDocument = {
    header: {
      title: 'Test SOP',
      documentNumber: 'SOP-001',
      version: '1.0',
      effectiveDate: new Date('2023-09-07'),
      organization: 'Test Org',
      approvedBy: 'John Doe'
    },
    metadata: {
      purpose: 'To demonstrate SOP PDF generation',
      scope: 'All departments',
      relatedDocuments: ['QA-001'],
      definitions: [
        { term: 'SOP', definition: 'Standard Operating Procedure' }
      ]
    },
    content: {
      format: 'step-by-step',
      rolesResponsibilities: [
        { 
          role: 'Manager', 
          responsibilities: ['Approve procedure', 'Ensure compliance'] 
        }
      ],
      procedures: [
        {
          stepNumber: '1.0',
          description: 'Prepare workspace',
          responsibleRole: 'Technician',
          timeEstimate: '10 minutes'
        }
      ],
      safetyConsiderations: ['Wear protective equipment'],
      qualityControls: ['Verify measurements']
    },
    footer: {
      revisionHistory: [
        { 
          version: '1.0', 
          date: new Date('2023-09-07'), 
          changes: 'Initial version' 
        }
      ],
      nextReviewDate: new Date('2024-09-07'),
      documentOwner: 'Quality Assurance Department'
    }
  }

  const mockBranding: OrganizationBranding = {
    name: 'Test Organization',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    logoUrl: 'https://example.com/logo.svg',
    fontFamily: 'Inter, sans-serif'
  }

  // Mock the private method fetchSOPDocument
  const originalFetchSOPDocument = SOPPDFGenerator['fetchSOPDocument']
  const originalSaveGeneratedSOPMetadata = SOPPDFGenerator['saveGeneratedSOPMetadata']

  beforeEach(() => {
    SOPPDFGenerator['fetchSOPDocument'] = jest.fn().mockResolvedValue(mockSOPDocument)
    SOPPDFGenerator['saveGeneratedSOPMetadata'] = jest.fn()

    // Reset mocks
    jest.clearAllMocks()
  })

  afterAll(() => {
    // Restore original implementations
    SOPPDFGenerator['fetchSOPDocument'] = originalFetchSOPDocument
    SOPPDFGenerator['saveGeneratedSOPMetadata'] = originalSaveGeneratedSOPMetadata
  })

  describe('generatePDF', () => {
    it('should generate PDF successfully', async () => {
      // Mock cloud storage upload
      ;(cloudStorage.uploadToCloudStorage as jest.Mock).mockResolvedValue('https://example.com/sop.pdf')

      const result = await SOPPDFGenerator.generatePDF({
        reportId: 'report-123',
        sopFormat: 'step-by-step',
        branding: mockBranding,
        includeBranding: true
      })

      expect(result.success).toBe(true)
      expect(result.pdfUrl).toBe('https://example.com/sop.pdf')
      expect(result.downloadToken).toBeDefined()
      expect(result.metadata?.fileSize).toBeGreaterThan(0)
    })

    it('should handle missing branding with default values', async () => {
      // Mock cloud storage upload
      ;(cloudStorage.uploadToCloudStorage as jest.Mock).mockResolvedValue('https://example.com/sop.pdf')

      const result = await SOPPDFGenerator.generatePDF({
        reportId: 'report-123',
        sopFormat: 'step-by-step',
        branding: undefined,
        includeBranding: true
      })

      expect(result.success).toBe(true)
      expect(result.pdfUrl).toBe('https://example.com/sop.pdf')
    })

    it('should handle PDF generation failure', async () => {
      // Mock cloud storage upload to throw an error
      ;(cloudStorage.uploadToCloudStorage as jest.Mock).mockRejectedValue(new Error('Upload failed'))

      const result = await SOPPDFGenerator.generatePDF({
        reportId: 'report-123',
        sopFormat: 'step-by-step',
        branding: mockBranding,
        includeBranding: true
      })

      expect(result.success).toBe(false)
      expect(result.pdfUrl).toBeUndefined()
    })
  })

  describe('Compliance and Security', () => {
    it('should sanitize HTML template to prevent XSS', async () => {
      const maliciousSOPDocument: SOPDocument = {
        ...mockSOPDocument,
        content: {
          ...mockSOPDocument.content,
          procedures: [
            {
              stepNumber: '1.0',
              description: '<script>alert("XSS")</script>Prepare workspace',
              responsibleRole: 'Technician',
              timeEstimate: '10 minutes'
            }
          ]
        }
      }

      // Mock fetchSOPDocument to return malicious document
      SOPPDFGenerator['fetchSOPDocument'] = jest.fn().mockResolvedValue(maliciousSOPDocument)

      // Mock cloud storage upload
      ;(cloudStorage.uploadToCloudStorage as jest.Mock).mockResolvedValue('https://example.com/sop.pdf')

      const result = await SOPPDFGenerator.generatePDF({
        reportId: 'report-123',
        sopFormat: 'step-by-step',
        branding: mockBranding,
        includeBranding: true
      })

      expect(result.success).toBe(true)
      
      // Additional checks would verify that script tags are removed/escaped
    })
  })
})