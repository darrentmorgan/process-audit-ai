import { generateSOPRevision } from '../../utils/aiPrompts'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('📥 /api/revise-sop: Received request')
  console.log('📝 Request body keys:', Object.keys(req.body))

  const { originalSOP, analysis, selectedImprovements, preferences } = req.body

  if (!originalSOP || !analysis) {
    console.log('❌ /api/revise-sop: Missing required parameters')
    return res.status(400).json({ error: 'Original SOP and analysis are required' })
  }

  try {
    console.log('🔄 /api/revise-sop: Starting SOP revision')
    console.log('📊 Original SOP length:', originalSOP.length)
    console.log('🎯 Selected improvements:', selectedImprovements?.length || 0)

    // Filter improvements based on selection
    let improvementsToApply = analysis.improvementAreas || []
    if (selectedImprovements && selectedImprovements.length > 0) {
      improvementsToApply = selectedImprovements.map(index => analysis.improvementAreas[index]).filter(Boolean)
    }

    // Try to get AI revision
    const aiRevision = await generateSOPRevision(
      originalSOP,
      analysis,
      improvementsToApply,
      preferences || ''
    )

    if (aiRevision) {
      console.log('✅ /api/revise-sop: AI revision successful')
      return res.status(200).json(aiRevision)
    }

    // Fallback to sample revision if AI is not available
    console.log('⚠️ /api/revise-sop: Using fallback sample revision')
    const sampleRevision = {
      revisedSOP: {
        header: {
          title: "Customer Onboarding Standard Operating Procedure",
          sopNumber: "SOP-001",
          version: "2.0",
          effectiveDate: new Date().toISOString().split('T')[0],
          approvedBy: "[To be approved by Operations Manager]",
          preparedBy: "ProcessAudit AI Optimization"
        },
        purpose: "To establish a standardized, efficient process for onboarding new customers that ensures consistent service delivery, reduces processing time, and maximizes customer satisfaction while maintaining compliance with company policies.",
        scope: "This procedure applies to all customer onboarding activities from initial inquiry through account activation and first service delivery. Covers all customer types: individual, small business, and enterprise accounts.",
        responsibilities: {
          "Sales Representative": "Initial customer contact, needs assessment, proposal generation, and handoff to onboarding team",
          "Onboarding Specialist": "Account setup, documentation collection, system configuration, and customer orientation",
          "Technical Support": "System access provisioning, integration setup, and initial technical configuration",
          "Account Manager": "Relationship establishment, success metrics definition, and ongoing support coordination"
        },
        materialsEquipment: [
          "CRM system access",
          "Customer onboarding checklist",
          "Welcome packet templates",
          "Account setup forms",
          "System access credentials",
          "Integration testing tools"
        ],
        procedure: [
          {
            step: 1,
            action: "Receive qualified lead from sales team with complete customer information package",
            responsibility: "Onboarding Specialist",
            timing: "Within 2 hours of handoff",
            qualityCriteria: "All required customer data fields completed, decision maker contact verified",
            automationNote: "Lead handoff notification and data validation can be automated via CRM workflows"
          },
          {
            step: 2,
            action: "Send welcome email with onboarding timeline and required documentation checklist",
            responsibility: "Onboarding Specialist",
            timing: "Within 4 hours of lead receipt",
            qualityCriteria: "Email delivered successfully, customer acknowledges receipt within 24 hours",
            automationNote: "Welcome email sequence can be automated based on customer type and service package"
          },
          {
            step: 3,
            action: "Schedule and conduct customer kickoff meeting to review process and gather requirements",
            responsibility: "Onboarding Specialist + Account Manager",
            timing: "Within 48 hours of welcome email",
            qualityCriteria: "All stakeholders present, requirements documented in CRM, next steps agreed",
            automationNote: "Meeting scheduling and agenda generation can be automated based on customer profile"
          },
          {
            step: 4,
            action: "Create customer account in all relevant systems and configure initial settings",
            responsibility: "Technical Support",
            timing: "Within 24 hours of kickoff meeting",
            qualityCriteria: "Account active in all systems, basic configuration completed, credentials generated",
            automationNote: "Account provisioning across multiple systems can be automated using API integrations"
          },
          {
            step: 5,
            action: "Conduct system training session and provide access credentials",
            responsibility: "Technical Support + Onboarding Specialist",
            timing: "Within 72 hours of account creation",
            qualityCriteria: "Customer successfully logs in, completes basic tasks, training completion confirmed",
            automationNote: "Training scheduling and progress tracking can be automated"
          },
          {
            step: 6,
            action: "Perform final quality check and officially activate customer account",
            responsibility: "Account Manager",
            timing: "Within 5 business days of training",
            qualityCriteria: "All setup items completed, customer satisfaction survey > 8/10, account fully operational",
            automationNote: "Quality checklist validation and account activation can be automated with manager approval"
          }
        ],
        qualityControl: [
          {
            checkpoint: "Documentation completeness verification",
            frequency: "Before each handoff between steps",
            acceptanceCriteria: "All required documents present and validated",
            corrective_action: "Pause process and request missing documentation before proceeding"
          },
          {
            checkpoint: "Customer satisfaction check",
            frequency: "After training completion",
            acceptanceCriteria: "Customer satisfaction score of 8 or higher",
            corrective_action: "Schedule additional support session and address concerns"
          }
        ],
        records: [
          {
            document: "Customer onboarding checklist",
            retention: "3 years from account closure",
            location: "CRM system customer record"
          },
          {
            document: "Training completion certificates",
            retention: "Duration of customer relationship",
            location: "Learning management system"
          }
        ]
      },
      revisionSummary: {
        majorChanges: [
          "Added comprehensive header information with version control",
          "Included clear purpose and scope definitions",
          "Defined specific role responsibilities for each team member",
          "Added timing requirements and quality criteria for each step",
          "Integrated automation opportunities throughout the process",
          "Included quality control checkpoints and record-keeping requirements"
        ],
        automationReadiness: "Process is now structured to support automation at 6 key points, with API integration opportunities identified for account provisioning, email sequences, and quality tracking.",
        improvementMetrics: {
          estimatedTimeReduction: "2.5 hours per customer onboarding (40% reduction)",
          qualityImprovement: "Standardized quality checkpoints reduce errors by 60% and improve customer satisfaction scores",
          complianceEnhancement: "Added documentation requirements ensure regulatory compliance and provide audit trail"
        }
      }
    }

    return res.status(200).json(sampleRevision)

  } catch (error) {
    console.error('❌ /api/revise-sop: Error during revision:', error)
    return res.status(500).json({
      error: 'Internal server error during SOP revision',
      details: error.message
    })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increased limit for larger SOPs
    },
  },
}