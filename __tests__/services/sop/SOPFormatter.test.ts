import { SOPFormatter } from '@/services/sop/SOPFormatter'
import { SOPDocument } from '@/types/sop'

describe('SOPFormatter', () => {
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
      purpose: 'To demonstrate SOP formatting',
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
        },
        {
          stepNumber: '2.0',
          description: 'Conduct initial inspection',
          responsibleRole: 'Inspector',
          timeEstimate: '15 minutes'
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

  describe('formatSOP', () => {
    it('should format step-by-step SOP correctly', () => {
      const formattedSOP = SOPFormatter.formatSOP(mockSOPDocument, 'step-by-step')
      
      expect(formattedSOP).toContain('1.0. Prepare workspace')
      expect(formattedSOP).toContain('Responsible: Technician')
      expect(formattedSOP).toContain('Estimated Time: 10 minutes')
      expect(formattedSOP).toContain('2.0. Conduct initial inspection')
    })

    it('should format hierarchical SOP correctly', () => {
      const formattedSOP = SOPFormatter.formatSOP(mockSOPDocument, 'hierarchical')
      
      expect(formattedSOP).toContain('1. Prepare workspace')
      expect(formattedSOP).toContain('2. Conduct initial inspection')
    })

    it('should format checklist SOP correctly', () => {
      const formattedSOP = SOPFormatter.formatSOP(mockSOPDocument, 'checklist')
      
      expect(formattedSOP).toContain('☐ Prepare workspace')
      expect(formattedSOP).toContain('☐ Conduct initial inspection')
    })

    it('should format flowchart SOP correctly', () => {
      const formattedSOP = SOPFormatter.formatSOP(mockSOPDocument, 'flowchart')
      
      expect(formattedSOP).toContain('[Prepare workspace] ↓')
      expect(formattedSOP).toContain('[Conduct initial inspection]')
    })
  })

  describe('validateCompliance', () => {
    it('should validate SOP against ISO-9001 standards', () => {
      const complianceResult = SOPFormatter.validateCompliance(mockSOPDocument)
      
      expect(complianceResult.isCompliant).toBe(true)
      expect(complianceResult.missingFields).toHaveLength(0)
    })

    it('should detect missing mandatory fields', () => {
      const incompleteSOPDocument = { ...mockSOPDocument }
      incompleteSOPDocument.header.documentNumber = ''

      const complianceResult = SOPFormatter.validateCompliance(incompleteSOPDocument)
      
      expect(complianceResult.isCompliant).toBe(false)
      expect(complianceResult.missingFields).toContain('documentNumber')
    })
  })

  describe('generateDocumentNumber', () => {
    it('should generate sequential document number', () => {
      const numberingScheme = {
        format: 'sequential',
        prefix: 'SOP',
        sequenceLength: 3
      }

      const documentNumber = SOPFormatter.generateDocumentNumber(
        numberingScheme, 
        mockSOPDocument
      )

      expect(documentNumber).toMatch(/SOP-001/)
    })

    it('should generate departmental document number', () => {
      const numberingScheme = {
        format: 'departmental',
        prefix: 'SOP',
        departmentCode: 'QA',
        sequenceLength: 3
      }

      const documentNumber = SOPFormatter.generateDocumentNumber(
        numberingScheme, 
        mockSOPDocument
      )

      expect(documentNumber).toMatch(/SOP-QA-001/)
    })

    it('should generate ISO-aligned document number', () => {
      const numberingScheme = {
        format: 'iso-aligned',
        prefix: 'SOP',
        sequenceLength: 3
      }

      const documentNumber = SOPFormatter.generateDocumentNumber(
        numberingScheme, 
        mockSOPDocument
      )

      expect(documentNumber).toMatch(/SOP-7.1.1/)
    })
  })
})