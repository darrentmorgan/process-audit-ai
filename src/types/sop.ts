// SOP (Standard Operating Procedure) Type Definitions

export type SOPFormat = 'step-by-step' | 'hierarchical' | 'checklist' | 'flowchart'
export type NumberingSchemeType = 'sequential' | 'departmental' | 'iso-aligned' | 'hierarchical'

export interface SOPHeader {
  title: string
  documentNumber: string
  version: string
  effectiveDate: Date
  organization: string
  approvedBy: string
}

export interface SOPMetadata {
  purpose: string
  scope: string
  relatedDocuments: string[]
  definitions: Array<{term: string, definition: string}>
}

export interface SOPProcedure {
  stepNumber: string
  description: string
  responsibleRole?: string
  timeEstimate?: string
  qualityCheck?: string
}

export interface SOPContent {
  format: SOPFormat
  rolesResponsibilities: Array<{role: string, responsibilities: string[]}>
  procedures: SOPProcedure[]
  safetyConsiderations?: string[]
  qualityControls?: string[]
}

export interface SOPFooter {
  revisionHistory: Array<{
    version: string
    date: Date
    changes: string
  }>
  nextReviewDate: Date
  documentOwner: string
}

export interface SOPDocument {
  header: SOPHeader
  metadata: SOPMetadata
  content: SOPContent
  footer: SOPFooter
}

export interface NumberingScheme {
  format: NumberingSchemeType
  prefix: string
  departmentCode?: string
  sequenceLength: number
}

export interface OrganizationBranding {
  name: string
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
  fontFamily?: string
}

export interface SOPCustomizations {
  includeFlowchart?: boolean
  includeQualityControls?: boolean
  addWatermark?: boolean
}

export interface SOPPDFGenerationRequest {
  reportId: string
  sopFormat: SOPFormat
  branding: OrganizationBranding
  includeBranding: boolean
  customizations?: SOPCustomizations
}

export interface SOPPDFGenerationResponse {
  success: boolean
  pdfUrl?: string
  downloadToken?: string
  metadata?: {
    fileSize: number
    generationTime: number
  }
}

export interface SOPComplianceStandards {
  standard: 'ISO-9001' | 'ISO-45001' | 'Custom'
  requiredSections: string[]
  mandatoryFields: string[]
}