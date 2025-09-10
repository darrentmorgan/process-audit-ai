/**
 * ExecutiveSummaryPDF Component - ProcessAudit AI
 * 
 * PDF component for executive summary reports
 * Provides concise, high-level overview for leadership
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
 * Executive Summary PDF Component
 * Generates a concise executive report focused on key insights and recommendations
 */
const ExecutiveSummaryPDF = ({ 
  reportData,
  processData = {},
  branding = {},
  options = {}
}) => {
  if (!reportData) {
    return null
  }

  const {
    executiveSummary = {},
    automationOpportunities = [],
    roadmap = {},
    implementationGuidance = {}
  } = reportData

  return (
    <BasePDFDocument
      title="Executive Summary - Process Analysis"
      metadata={{
        title: processData.processName ? `Executive Summary: ${processData.processName}` : 'Executive Summary - Process Analysis',
        author: branding.companyName || 'ProcessAudit AI',
        subject: 'Executive Summary - Business Process Analysis',
        keywords: ['executive summary', 'process analysis', 'automation', 'ROI'],
        createdDate: new Date()
      }}
      branding={branding}
      showHeader={options.showHeader !== false}
      showFooter={options.showFooter !== false}
      pageNumbers={options.pageNumbers !== false}
    >
      {/* Executive Overview */}
      <ExecutiveOverviewSection 
        processData={processData}
        executiveSummary={executiveSummary}
        branding={branding}
      />

      {/* Key Metrics Dashboard */}
      <KeyMetricsSection 
        executiveSummary={executiveSummary}
        automationOpportunities={automationOpportunities}
      />

      {/* Strategic Recommendations */}
      <StrategicRecommendationsSection 
        automationOpportunities={automationOpportunities}
        roadmap={roadmap}
      />

      {/* Investment Summary */}
      <InvestmentSummarySection 
        executiveSummary={executiveSummary}
        roadmap={roadmap}
      />

      {/* Next Steps */}
      <NextStepsSection 
        implementationGuidance={implementationGuidance}
        roadmap={roadmap}
      />
    </BasePDFDocument>
  )
}

/**
 * Executive Overview Section
 */
const ExecutiveOverviewSection = ({ processData, executiveSummary, branding }) => (
  <View>
    <PDFTitle>Executive Summary</PDFTitle>
    
    <PDFSection>
      <View style={{
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 8,
        border: '1pt solid #e2e8f0',
        marginBottom: 20
      }}>
        <PDFHeading2 style={{ textAlign: 'center', marginBottom: 15, color: '#2563eb' }}>
          {processData.processName || 'Business Process Analysis'}
        </PDFHeading2>
        
        <PDFText style={{ textAlign: 'center', marginBottom: 10 }}>
          {processData.industry ? `${processData.industry} Industry` : ''} 
          {processData.department ? ` • ${processData.department} Department` : ''}
        </PDFText>
        
        <PDFText style={{ textAlign: 'center', fontSize: 10, color: '#64748b' }}>
          Analysis completed on {new Date().toLocaleDateString()} by {branding.companyName || 'ProcessAudit AI'}
        </PDFText>
      </View>
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Executive Overview</PDFHeading2>
      <PDFText>
        {executiveSummary.overview || 
         `This executive summary presents the key findings from our comprehensive analysis of your ${processData.processName || 'business process'}. 
         Our AI-powered assessment has identified significant opportunities for operational improvement and cost reduction through strategic automation initiatives.`}
      </PDFText>
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Key Findings at a Glance</PDFHeading2>
      
      <PDFList items={[
        `Process automation potential: ${executiveSummary.automationScore || 'To be determined'}%`,
        `Estimated annual ROI: ${executiveSummary.estimatedROI || 'To be calculated'}`,
        `Projected time savings: ${executiveSummary.timeSavings || 'To be quantified'}`,
        `Implementation complexity: ${executiveSummary.complexityScore || 'To be assessed'}/10`,
        'Multiple automation opportunities identified across the process workflow'
      ]} />
    </PDFSection>
  </View>
)

/**
 * Key Metrics Dashboard Section
 */
const KeyMetricsSection = ({ executiveSummary, automationOpportunities }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Key Performance Metrics</PDFHeading1>
    
    <PDFSection>
      {/* Primary Metrics Grid */}
      <PDFRow style={{ marginBottom: 20 }}>
        <PDFColumn>
          <View style={{
            backgroundColor: '#dbeafe',
            border: '2pt solid #2563eb',
            borderRadius: 8,
            padding: 15,
            textAlign: 'center',
            minHeight: 80,
            justifyContent: 'center'
          }}>
            <PDFText style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb', marginBottom: 5 }}>
              {executiveSummary.automationScore || 'N/A'}%
            </PDFText>
            <PDFText style={{ fontSize: 10, fontWeight: 'bold' }}>
              Automation Potential
            </PDFText>
          </View>
        </PDFColumn>
        
        <PDFColumn>
          <View style={{
            backgroundColor: '#dcfce7',
            border: '2pt solid #16a34a',
            borderRadius: 8,
            padding: 15,
            textAlign: 'center',
            minHeight: 80,
            justifyContent: 'center'
          }}>
            <PDFText style={{ fontSize: 20, fontWeight: 'bold', color: '#16a34a', marginBottom: 5 }}>
              {executiveSummary.estimatedROI || 'TBD'}
            </PDFText>
            <PDFText style={{ fontSize: 10, fontWeight: 'bold' }}>
              Projected Annual ROI
            </PDFText>
          </View>
        </PDFColumn>
      </PDFRow>
      
      <PDFRow>
        <PDFColumn>
          <View style={{
            backgroundColor: '#fef3c7',
            border: '2pt solid #d97706',
            borderRadius: 8,
            padding: 15,
            textAlign: 'center',
            minHeight: 80,
            justifyContent: 'center'
          }}>
            <PDFText style={{ fontSize: 20, fontWeight: 'bold', color: '#d97706', marginBottom: 5 }}>
              {executiveSummary.timeSavings || 'TBD'}
            </PDFText>
            <PDFText style={{ fontSize: 10, fontWeight: 'bold' }}>
              Time Savings Potential
            </PDFText>
          </View>
        </PDFColumn>
        
        <PDFColumn>
          <View style={{
            backgroundColor: '#f3e8ff',
            border: '2pt solid #7c3aed',
            borderRadius: 8,
            padding: 15,
            textAlign: 'center',
            minHeight: 80,
            justifyContent: 'center'
          }}>
            <PDFText style={{ fontSize: 24, fontWeight: 'bold', color: '#7c3aed', marginBottom: 5 }}>
              {automationOpportunities.length}
            </PDFText>
            <PDFText style={{ fontSize: 10, fontWeight: 'bold' }}>
              Opportunities Identified
            </PDFText>
          </View>
        </PDFColumn>
      </PDFRow>
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Performance Impact Analysis</PDFHeading2>
      
      <PDFTable
        headers={['Metric', 'Current State', 'Potential Improvement', 'Impact Level']}
        rows={[
          ['Process Efficiency', 'Baseline', executiveSummary.efficiencyGain || 'TBD', 'High'],
          ['Cost Reduction', 'Current Costs', executiveSummary.costReduction || 'TBD', 'High'],
          ['Error Rate', 'Current Rate', executiveSummary.errorReduction || 'TBD', 'Medium'],
          ['Processing Time', 'Current Time', executiveSummary.timeReduction || 'TBD', 'High'],
          ['Resource Utilization', 'Current Usage', executiveSummary.resourceOptimization || 'TBD', 'Medium']
        ]}
      />
    </PDFSection>
  </View>
)

/**
 * Strategic Recommendations Section
 */
const StrategicRecommendationsSection = ({ automationOpportunities, roadmap }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Strategic Recommendations</PDFHeading1>
    
    <PDFSection>
      <PDFHeading2>Priority Initiatives</PDFHeading2>
      
      {automationOpportunities.length === 0 && (
        <PDFText>No specific recommendations available. Please refer to the detailed analysis for more information.</PDFText>
      )}
      
      {automationOpportunities
        .filter(opp => opp.priority === 'high')
        .slice(0, 3)
        .map((opportunity, index) => (
          <PDFCard key={index} style={{ marginBottom: 15 }}>
            <PDFRow>
              <PDFColumn style={{ flex: 3 }}>
                <PDFHeading3 style={{ color: '#dc2626', marginBottom: 8 }}>
                  {opportunity.title || `High Priority Initiative ${index + 1}`}
                </PDFHeading3>
                <PDFText style={{ marginBottom: 8 }}>
                  {opportunity.description || 'No description available'}
                </PDFText>
              </PDFColumn>
              
              <PDFColumn style={{ flex: 1, textAlign: 'right' }}>
                <View style={{
                  backgroundColor: '#fef2f2',
                  border: '1pt solid #fecaca',
                  borderRadius: 4,
                  padding: 8
                }}>
                  <PDFText style={{ fontSize: 10, fontWeight: 'bold', color: '#dc2626' }}>
                    HIGH PRIORITY
                  </PDFText>
                </View>
              </PDFColumn>
            </PDFRow>
            
            <PDFRow style={{ marginTop: 10 }}>
              <PDFColumn>
                <PDFText style={{ fontSize: 10, fontWeight: 'bold' }}>
                  Expected Impact: {opportunity.impact || 'High'}
                </PDFText>
              </PDFColumn>
              <PDFColumn>
                <PDFText style={{ fontSize: 10, fontWeight: 'bold' }}>
                  Implementation Effort: {opportunity.effort || 'Medium'}
                </PDFText>
              </PDFColumn>
            </PDFRow>
          </PDFCard>
        ))
      }
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Medium-Term Opportunities</PDFHeading2>
      
      {automationOpportunities
        .filter(opp => opp.priority === 'medium')
        .slice(0, 2)
        .map((opportunity, index) => (
          <PDFText key={index} style={{ marginBottom: 8 }}>
            • {opportunity.title || `Medium priority opportunity ${index + 1}`}
          </PDFText>
        ))
      }
      
      {automationOpportunities.filter(opp => opp.priority === 'medium').length === 0 && (
        <PDFText>Additional opportunities will be identified as high-priority initiatives are completed.</PDFText>
      )}
    </PDFSection>
  </View>
)

/**
 * Investment Summary Section
 */
const InvestmentSummarySection = ({ executiveSummary, roadmap }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Investment Summary</PDFHeading1>
    
    <PDFSection>
      <PDFHeading2>Financial Analysis</PDFHeading2>
      
      <PDFRow>
        <PDFColumn>
          <PDFCard>
            <PDFText style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Implementation Investment
            </PDFText>
            <PDFText style={{ fontSize: 18, color: '#2563eb', fontWeight: 'bold' }}>
              {executiveSummary.implementationCost || 'To be estimated'}
            </PDFText>
            <PDFText small style={{ marginTop: 5 }}>
              One-time setup and configuration
            </PDFText>
          </PDFCard>
        </PDFColumn>
        
        <PDFColumn>
          <PDFCard>
            <PDFText style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Payback Period
            </PDFText>
            <PDFText style={{ fontSize: 18, color: '#16a34a', fontWeight: 'bold' }}>
              {executiveSummary.paybackPeriod || 'TBD'}
            </PDFText>
            <PDFText small style={{ marginTop: 5 }}>
              Expected return on investment
            </PDFText>
          </PDFCard>
        </PDFColumn>
      </PDFRow>
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Implementation Timeline</PDFHeading2>
      
      {roadmap.phases && roadmap.phases.length > 0 ? (
        <PDFTable
          headers={['Phase', 'Duration', 'Investment', 'Expected Benefits']}
          rows={roadmap.phases.slice(0, 4).map((phase, index) => [
            `Phase ${index + 1}`,
            phase.duration || 'TBD',
            phase.cost || 'TBD',
            phase.benefits || 'Process improvements'
          ])}
        />
      ) : (
        <PDFText>
          Detailed implementation timeline and phasing will be developed based on your organization's priorities and constraints.
        </PDFText>
      )}
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Risk Assessment</PDFHeading2>
      
      <PDFList items={[
        'Implementation risk: Low to Medium (proven automation technologies)',
        'Technology risk: Low (established platforms and tools)',
        'Change management risk: Medium (requires process adaptation)',
        'ROI risk: Low (conservative projections with clear benefits)',
        'Operational risk: Low (gradual rollout with fallback procedures)'
      ]} />
    </PDFSection>
  </View>
)

/**
 * Next Steps Section
 */
const NextStepsSection = ({ implementationGuidance, roadmap }) => (
  <View style={pdfStyles.pageBreak}>
    <PDFHeading1>Recommended Next Steps</PDFHeading1>
    
    <PDFSection>
      <PDFHeading2>Immediate Actions (Next 30 Days)</PDFHeading2>
      
      <PDFList items={
        implementationGuidance.nextSteps?.slice(0, 3) || [
          'Review and validate the analysis findings with key stakeholders',
          'Prioritize automation opportunities based on business impact and feasibility',
          'Assemble a cross-functional implementation team'
        ]
      } />
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Short-Term Planning (Next 90 Days)</PDFHeading2>
      
      <PDFList items={[
        'Develop detailed requirements for priority automation initiatives',
        'Evaluate and select appropriate automation tools and platforms',
        'Create detailed project plans with timelines and resource requirements',
        'Establish success metrics and monitoring frameworks',
        'Begin pilot implementations for highest-impact opportunities'
      ]} />
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Long-Term Strategy (6-12 Months)</PDFHeading2>
      
      <PDFList items={[
        'Execute full-scale automation rollout based on proven pilots',
        'Expand automation initiatives to additional process areas',
        'Establish center of excellence for process optimization',
        'Implement continuous improvement and monitoring processes',
        'Measure and report on ROI and business impact'
      ]} />
    </PDFSection>

    <PDFSection>
      <PDFHeading2>Success Factors</PDFHeading2>
      
      <PDFCard style={{ backgroundColor: '#f0fdf4', border: '1pt solid #bbf7d0' }}>
        <PDFText style={{ fontWeight: 'bold', marginBottom: 10, color: '#16a34a' }}>
          Critical Success Factors:
        </PDFText>
        
        <PDFList items={[
          'Strong executive sponsorship and change management',
          'Clear communication of benefits and progress to all stakeholders',
          'Adequate resource allocation and dedicated project team',
          'Phased implementation approach with regular milestone reviews',
          'Comprehensive training and support for affected personnel'
        ]} />
      </PDFCard>
    </PDFSection>
  </View>
)

export default ExecutiveSummaryPDF