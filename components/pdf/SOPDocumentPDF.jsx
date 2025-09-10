/**
 * SOPDocumentPDF Component - ProcessAudit AI
 * 
 * PDF component for Standard Operating Procedure documents
 * Follows standard SOP format with proper structure and compliance requirements
 */

import React from 'react'
import { Text, View, Page } from '@react-pdf/renderer'
import BasePDFDocument, {
  PDFTitle,
  PDFHeading1,
  PDFHeading2,
  PDFHeading3,
  PDFText,
  PDFSection,
  PDFCard,
  PDFRow,
  PDFColumn,
  PDFList,
  PDFTable,
  pdfStyles
} from './BasePDFDocument'

/**
 * SOP Document PDF Component
 * Generates a professional SOP document from structured data
 */
const SOPDocumentPDF = ({ 
  sopData,
  branding = {},
  options = {}
}) => {
  if (!sopData) {
    return null
  }

  const {
    metadata = {},
    purpose = '',
    scope = '',
    responsibilities = [],
    procedures = [],
    relatedDocuments = [],
    revisionHistory = []
  } = sopData

  return (
    <BasePDFDocument
      title={metadata.title || 'Standard Operating Procedure'}
      metadata={{
        title: metadata.title,
        author: metadata.author || branding.companyName || 'ProcessAudit AI',
        subject: 'Standard Operating Procedure',
        keywords: ['SOP', 'procedure', 'operations', metadata.title],
        createdDate: metadata.effectiveDate || new Date(),
        version: metadata.sopVersion || '1.0',
        classification: 'internal'
      }}
      branding={branding}
      showHeader={options.showHeader !== false}
      showFooter={options.showFooter !== false}
      pageNumbers={options.pageNumbers !== false}
    >
      {/* SOP Header Page */}
      <SOPHeaderPage 
        metadata={metadata}
        branding={branding}
        purpose={purpose}
        scope={scope}
      />

      {/* Document Control Section */}
      <DocumentControlSection 
        metadata={metadata}
        revisionHistory={revisionHistory}
      />

      {/* Purpose and Scope */}
      <PurposeAndScopeSection 
        purpose={purpose}
        scope={scope}
      />

      {/* Responsibilities */}
      <ResponsibilitiesSection 
        responsibilities={responsibilities}
      />

      {/* Procedures */}
      <ProceduresSection 
        procedures={procedures}
      />

      {/* Related Documents */}
      {relatedDocuments.length > 0 && (
        <RelatedDocumentsSection 
          relatedDocuments={relatedDocuments}
        />
      )}

      {/* Revision History */}
      {revisionHistory.length > 0 && (
        <RevisionHistorySection 
          revisionHistory={revisionHistory}
        />
      )}
    </BasePDFDocument>
  )
}

/**
 * SOP Header Page Component
 */
const SOPHeaderPage = ({ metadata, branding, purpose, scope }) => (
  <Page size="A4" style={pdfStyles.page}>
    <View style={{ 
      flex: 1, 
      paddingHorizontal: 40
    }}>
      {/* Document Header */}
      <View style={{
        textAlign: 'center',
        marginBottom: 40,
        paddingBottom: 20,
        borderBottom: '2pt solid #2563eb'
      }}>
        <PDFTitle style={{ fontSize: 24, marginBottom: 10 }}>
          STANDARD OPERATING PROCEDURE
        </PDFTitle>
        
        <PDFText style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 20 }}>
          {metadata.title || 'Untitled SOP'}
        </PDFText>
        
        <PDFRow>
          <PDFColumn style={{ textAlign: 'center' }}>
            <PDFText style={{ fontWeight: 'bold' }}>Document ID:</PDFText>
            <PDFText>{metadata.documentId || 'SOP-001'}</PDFText>
          </PDFColumn>
          <PDFColumn style={{ textAlign: 'center' }}>
            <PDFText style={{ fontWeight: 'bold' }}>Version:</PDFText>
            <PDFText>{metadata.sopVersion || '1.0'}</PDFText>
          </PDFColumn>
          <PDFColumn style={{ textAlign: 'center' }}>
            <PDFText style={{ fontWeight: 'bold' }}>Status:</PDFText>
            <PDFText style={{ 
              textTransform: 'uppercase',
              color: metadata.approvalStatus === 'approved' ? '#16a34a' : '#dc2626'
            }}>
              {metadata.approvalStatus || 'Draft'}
            </PDFText>
          </PDFColumn>
        </PDFRow>
      </View>

      {/* Document Information Table */}
      <PDFTable
        headers={['Field', 'Information']}
        rows={[
          ['Effective Date', metadata.effectiveDate ? new Date(metadata.effectiveDate).toLocaleDateString() : 'TBD'],
          ['Review Date', metadata.reviewDate ? new Date(metadata.reviewDate).toLocaleDateString() : 'TBD'],
          ['Department', metadata.department || 'Not specified'],
          ['Process Owner', metadata.processOwner || 'Not specified'],
          ['Approved By', metadata.approver?.name || 'Pending approval'],
          ['Classification', metadata.classification || 'Internal']
        ]}
      />

      {/* Approval Section */}
      {metadata.approver && (
        <View style={{ 
          marginTop: 30,
          padding: 20,
          backgroundColor: '#f8fafc',
          border: '1pt solid #e2e8f0',
          borderRadius: 4
        }}>
          <PDFHeading3 style={{ marginBottom: 15, textAlign: 'center' }}>
            Document Approval
          </PDFHeading3>
          
          <PDFTable
            rows={[
              ['Approver Name', metadata.approver.name],
              ['Title', metadata.approver.title],
              ['Approval Date', metadata.approver.date ? new Date(metadata.approver.date).toLocaleDateString() : 'Pending'],
              ['Signature', 'Digital signature on file']
            ]}
          />
        </View>
      )}

      {/* Quick Reference */}
      <View style={{ marginTop: 30 }}>
        <PDFHeading3>Quick Reference</PDFHeading3>
        
        <PDFCard>
          <PDFText style={{ fontWeight: 'bold', marginBottom: 8 }}>
            Purpose Summary:
          </PDFText>
          <PDFText small>
            {purpose ? purpose.substring(0, 200) + (purpose.length > 200 ? '...' : '') : 'See detailed purpose section'}
          </PDFText>
        </PDFCard>
        
        <PDFCard>
          <PDFText style={{ fontWeight: 'bold', marginBottom: 8 }}>
            Scope Summary:
          </PDFText>
          <PDFText small>
            {scope ? scope.substring(0, 200) + (scope.length > 200 ? '...' : '') : 'See detailed scope section'}
          </PDFText>
        </PDFCard>
      </View>
    </View>
  </Page>
)

/**
 * Document Control Section
 */
const DocumentControlSection = ({ metadata, revisionHistory }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Document Control</PDFHeading1>
    
    <PDFSection>
      <PDFHeading2>Document Information</PDFHeading2>
      
      <PDFTable
        headers={['Attribute', 'Value']}
        rows={[
          ['Document Title', metadata.title || 'Untitled SOP'],
          ['Document ID', metadata.documentId || 'SOP-001'],
          ['Version', metadata.sopVersion || '1.0'],
          ['Effective Date', metadata.effectiveDate ? new Date(metadata.effectiveDate).toLocaleDateString() : 'TBD'],
          ['Next Review Date', metadata.reviewDate ? new Date(metadata.reviewDate).toLocaleDateString() : 'TBD'],
          ['Document Owner', metadata.processOwner || 'Not specified'],
          ['Classification', metadata.classification || 'Internal'],
          ['Status', metadata.approvalStatus || 'Draft']
        ]}
      />
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Distribution List</PDFHeading2>
      <PDFText>
        This document is distributed to all relevant personnel and stakeholders. 
        Please ensure you are working with the latest approved version.
      </PDFText>
      
      <PDFCard>
        <PDFText style={{ fontWeight: 'bold', marginBottom: 5 }}>
          Important Note:
        </PDFText>
        <PDFText small>
          Printed copies of this document are considered uncontrolled. 
          Always refer to the electronic version for the most current information.
        </PDFText>
      </PDFCard>
    </PDFSection>
  </View>
)

/**
 * Purpose and Scope Section
 */
const PurposeAndScopeSection = ({ purpose, scope }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Purpose and Scope</PDFHeading1>
    
    <PDFSection>
      <PDFHeading2>1. Purpose</PDFHeading2>
      <PDFText>
        {purpose || 'The purpose of this Standard Operating Procedure has not been specified.'}
      </PDFText>
    </PDFSection>

    <PDFSection>
      <PDFHeading2>2. Scope</PDFHeading2>
      <PDFText>
        {scope || 'The scope of this Standard Operating Procedure has not been specified.'}
      </PDFText>
    </PDFSection>

    <PDFSection>
      <PDFHeading2>3. Applicability</PDFHeading2>
      <PDFText>
        This SOP applies to all personnel involved in the processes described herein. 
        Compliance with this procedure is mandatory for all applicable staff members.
      </PDFText>
    </PDFSection>
  </View>
)

/**
 * Responsibilities Section
 */
const ResponsibilitiesSection = ({ responsibilities }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Responsibilities</PDFHeading1>
    
    {responsibilities.length === 0 && (
      <PDFText>No specific responsibilities have been defined for this procedure.</PDFText>
    )}
    
    {responsibilities.map((responsibility, index) => (
      <PDFSection key={index}>
        <PDFHeading2>{responsibility.role}</PDFHeading2>
        <PDFText>{responsibility.description}</PDFText>
      </PDFSection>
    ))}
    
    <PDFSection>
      <PDFHeading2>General Responsibilities</PDFHeading2>
      <PDFList items={[
        'Ensure compliance with this SOP at all times',
        'Report any deviations or issues immediately to the process owner',
        'Participate in regular training and competency assessments',
        'Maintain accurate records as specified in this procedure',
        'Follow all safety and regulatory requirements'
      ]} />
    </PDFSection>
  </View>
)

/**
 * Procedures Section
 */
const ProceduresSection = ({ procedures }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Procedures</PDFHeading1>
    
    {procedures.length === 0 && (
      <PDFText>No specific procedures have been defined.</PDFText>
    )}
    
    {procedures.map((procedure, procedureIndex) => (
      <PDFSection key={procedureIndex}>
        <PDFHeading2>{procedure.name}</PDFHeading2>
        
        {procedure.steps.map((step, stepIndex) => (
          <View key={stepIndex} style={{ marginBottom: 20 }}>
            <PDFHeading3>
              {step.stepNumber}. {step.title}
            </PDFHeading3>
            
            <PDFText style={{ marginBottom: 10 }}>
              {step.description}
            </PDFText>
            
            {step.instructions && step.instructions.length > 0 && (
              <>
                <PDFText style={{ fontWeight: 'bold', marginBottom: 5 }}>
                  Instructions:
                </PDFText>
                <PDFList items={step.instructions} />
              </>
            )}
            
            {(step.prerequisites && step.prerequisites.length > 0) ||
             (step.resources && step.resources.length > 0) ||
             (step.risks && step.risks.length > 0) ? (
              <PDFRow style={{ marginTop: 10 }}>
                {step.prerequisites && step.prerequisites.length > 0 && (
                  <PDFColumn>
                    <PDFCard style={{ marginRight: 5 }}>
                      <PDFText style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>
                        Prerequisites:
                      </PDFText>
                      <PDFList items={step.prerequisites.slice(0, 3)} />
                    </PDFCard>
                  </PDFColumn>
                )}
                
                {step.resources && step.resources.length > 0 && (
                  <PDFColumn>
                    <PDFCard style={{ marginHorizontal: 2.5 }}>
                      <PDFText style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>
                        Resources:
                      </PDFText>
                      <PDFList items={step.resources.slice(0, 3)} />
                    </PDFCard>
                  </PDFColumn>
                )}
                
                {step.risks && step.risks.length > 0 && (
                  <PDFColumn>
                    <PDFCard style={{ marginLeft: 5, backgroundColor: '#fef2f2', border: '1pt solid #fecaca' }}>
                      <PDFText style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5, color: '#dc2626' }}>
                        Risks:
                      </PDFText>
                      <PDFList items={step.risks.slice(0, 2)} />
                    </PDFCard>
                  </PDFColumn>
                )}
              </PDFRow>
            ) : null}
            
            {step.expectedOutcome && (
              <View style={{ marginTop: 10 }}>
                <PDFText style={{ fontWeight: 'bold', fontSize: 10 }}>
                  Expected Outcome:
                </PDFText>
                <PDFText small style={{ fontStyle: 'italic' }}>
                  {step.expectedOutcome}
                </PDFText>
              </View>
            )}
            
            {step.timeEstimate && (
              <View style={{ marginTop: 5 }}>
                <PDFText style={{ fontWeight: 'bold', fontSize: 10 }}>
                  Estimated Time: {step.timeEstimate} minutes
                </PDFText>
              </View>
            )}
            
            {step.qualityChecks && step.qualityChecks.length > 0 && (
              <View style={{ 
                marginTop: 10,
                padding: 10,
                backgroundColor: '#f0fdf4',
                border: '1pt solid #bbf7d0',
                borderRadius: 4
              }}>
                <PDFText style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5, color: '#16a34a' }}>
                  Quality Checkpoints:
                </PDFText>
                <PDFList items={step.qualityChecks} />
              </View>
            )}
          </View>
        ))}
      </PDFSection>
    ))}
  </View>
)

/**
 * Related Documents Section
 */
const RelatedDocumentsSection = ({ relatedDocuments }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Related Documents</PDFHeading1>
    
    <PDFSection>
      <PDFText>
        The following documents are referenced in or related to this SOP:
      </PDFText>
      
      <PDFTable
        headers={['Document Title', 'Reference', 'Type']}
        rows={relatedDocuments.map(doc => [
          doc.title,
          doc.reference,
          doc.type.charAt(0).toUpperCase() + doc.type.slice(1)
        ])}
      />
    </PDFSection>
  </View>
)

/**
 * Revision History Section
 */
const RevisionHistorySection = ({ revisionHistory }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Revision History</PDFHeading1>
    
    <PDFSection>
      <PDFText>
        This section documents all changes made to this SOP since its initial release.
      </PDFText>
      
      <PDFTable
        headers={['Version', 'Date', 'Author', 'Changes']}
        rows={revisionHistory.map(revision => [
          revision.version,
          new Date(revision.date).toLocaleDateString(),
          revision.author,
          revision.changes
        ])}
      />
    </PDFSection>
  </View>
)

export default SOPDocumentPDF