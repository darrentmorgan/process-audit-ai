import { 
  SOPDocument, 
  SOPFormat, 
  NumberingScheme, 
  SOPComplianceStandards,
  SOPProcedure
} from '@/types/sop'

export class SOPFormatter {
  private static complianceStandards: Record<string, SOPComplianceStandards> = {
    'ISO-9001': {
      standard: 'ISO-9001',
      requiredSections: [
        'Purpose', 
        'Scope', 
        'Definitions', 
        'Responsibilities', 
        'Procedure Details', 
        'Quality Controls'
      ],
      mandatoryFields: [
        'documentNumber', 
        'version', 
        'effectiveDate', 
        'approvedBy'
      ]
    }
  }

  /**
   * Format SOP based on selected format
   * @param sopDocument Raw SOP document
   * @param format Desired output format
   * @returns Formatted SOP content
   */
  public static formatSOP(
    sopDocument: SOPDocument, 
    format: SOPFormat = 'step-by-step'
  ): string {
    switch (format) {
      case 'step-by-step':
        return this.formatStepByStep(sopDocument)
      case 'hierarchical':
        return this.formatHierarchical(sopDocument)
      case 'checklist':
        return this.formatChecklist(sopDocument)
      case 'flowchart':
        return this.formatFlowchart(sopDocument)
      default:
        return this.formatStepByStep(sopDocument)
    }
  }

  /**
   * Validate SOP document against compliance standards
   * @param sopDocument SOP to validate
   * @param standard Compliance standard to validate against
   * @returns Validation result
   */
  public static validateCompliance(
    sopDocument: SOPDocument, 
    standard: keyof typeof SOPFormatter.complianceStandards = 'ISO-9001'
  ): { isCompliant: boolean; missingFields: string[] } {
    const standards = this.complianceStandards[standard]
    const missingFields: string[] = []

    // Check required sections
    standards.requiredSections.forEach(section => {
      // Simplified check - expand based on actual document structure
      if (!this.checkSectionExists(sopDocument, section)) {
        missingFields.push(section)
      }
    })

    // Check mandatory fields
    standards.mandatoryFields.forEach(field => {
      if (!this.checkFieldExists(sopDocument, field)) {
        missingFields.push(field)
      }
    })

    return {
      isCompliant: missingFields.length === 0,
      missingFields
    }
  }

  /**
   * Generate document number based on numbering scheme
   * @param numbering Numbering scheme configuration
   * @param sopDocument SOP document
   * @returns Formatted document number
   */
  public static generateDocumentNumber(
    numbering: NumberingScheme, 
    sopDocument: SOPDocument
  ): string {
    const { 
      format, 
      prefix, 
      departmentCode, 
      sequenceLength 
    } = numbering

    const padSequence = (num: number) => 
      num.toString().padStart(sequenceLength, '0')

    switch (format) {
      case 'sequential':
        return `${prefix}-${padSequence(1)}`
      case 'departmental':
        return `${prefix}-${departmentCode}-${padSequence(1)}`
      case 'iso-aligned':
        // Example: Map to specific ISO clause
        return `${prefix}-7.1.1`
      case 'hierarchical':
        return `${prefix}-1.0`
      default:
        return `${prefix}-${padSequence(1)}`
    }
  }

  private static formatStepByStep(sopDocument: SOPDocument): string {
    const { content } = sopDocument
    return content.procedures
      .map(proc => 
        `${proc.stepNumber}. ${proc.description}\n` +
        (proc.responsibleRole ? `   Responsible: ${proc.responsibleRole}\n` : '') +
        (proc.timeEstimate ? `   Estimated Time: ${proc.timeEstimate}\n` : '')
      )
      .join('\n')
  }

  private static formatHierarchical(sopDocument: SOPDocument): string {
    const { content } = sopDocument
    const formatNestedProcedures = (
      procedures: SOPProcedure[], 
      parentNumber = ''
    ): string => 
      procedures
        .map((proc, index) => {
          const currentNumber = parentNumber 
            ? `${parentNumber}.${index + 1}` 
            : `${index + 1}`
          
          return `${currentNumber}. ${proc.description}\n` +
            (proc.responsibleRole 
              ? `   Responsible: ${proc.responsibleRole}\n` 
              : '') +
            (proc.timeEstimate 
              ? `   Estimated Time: ${proc.timeEstimate}\n` 
              : '')
        })
        .join('\n')

    return formatNestedProcedures(content.procedures)
  }

  private static formatChecklist(sopDocument: SOPDocument): string {
    const { content } = sopDocument
    return content.procedures
      .map(proc => 
        `☐ ${proc.description}\n` +
        (proc.responsibleRole 
          ? `   Responsible: ${proc.responsibleRole}\n` 
          : '')
      )
      .join('\n')
  }

  private static formatFlowchart(sopDocument: SOPDocument): string {
    // Simplified text-based flowchart representation
    const { content } = sopDocument
    return content.procedures
      .map((proc, index) => {
        const connector = index < content.procedures.length - 1 
          ? '↓' 
          : ''
        return `[${proc.description}] ${connector}`
      })
      .join('\n')
  }

  private static checkSectionExists(
    sopDocument: SOPDocument, 
    section: string
  ): boolean {
    // Placeholder implementation - expand based on actual document structure
    switch (section.toLowerCase()) {
      case 'purpose':
        return !!sopDocument.metadata.purpose
      case 'scope':
        return !!sopDocument.metadata.scope
      case 'definitions':
        return sopDocument.metadata.definitions.length > 0
      case 'responsibilities':
        return sopDocument.content.rolesResponsibilities.length > 0
      case 'procedure details':
        return sopDocument.content.procedures.length > 0
      case 'quality controls':
        return !!sopDocument.content.qualityControls
      default:
        return false
    }
  }

  private static checkFieldExists(
    sopDocument: SOPDocument, 
    field: string
  ): boolean {
    // Placeholder implementation - expand based on actual document structure
    switch (field) {
      case 'documentNumber':
        return !!sopDocument.header.documentNumber
      case 'version':
        return !!sopDocument.header.version
      case 'effectiveDate':
        return !!sopDocument.header.effectiveDate
      case 'approvedBy':
        return !!sopDocument.header.approvedBy
      default:
        return false
    }
  }
}