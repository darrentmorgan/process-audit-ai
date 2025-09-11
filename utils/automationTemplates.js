// Automation Template Generation Utilities - DISABLED
// Previously converted SOP automation opportunities into downloadable workflow templates
// Now provides automation platform recommendations instead of generation

// Disabled: Replaced with automation recommendations
export const generateAutomationRecommendations = (automationOpportunities, sopData) => {
  return {
    recommendations: automationOpportunities.map(opportunity => ({
      title: opportunity.stepDescription || opportunity.title,
      description: opportunity.solution || opportunity.automationSolution,
      platform: 'Multiple platforms supported',
      complexity: opportunity.effort || 'Medium',
      timeframe: '2-6 weeks typical implementation',
      tools: opportunity.tools || ['Zapier', 'Microsoft Power Automate', 'n8n', 'Custom solution']
    })),
    platformSuggestions: [
      {
        name: 'Zapier',
        bestFor: 'Quick integrations between popular apps',
        pricing: 'Starts at $20/month',
        complexity: 'Low to Medium'
      },
      {
        name: 'Microsoft Power Automate', 
        bestFor: 'Enterprise environments with Office 365',
        pricing: 'Included with Office 365',
        complexity: 'Medium'
      },
      {
        name: 'n8n',
        bestFor: 'Custom workflows and advanced automation',
        pricing: 'Free self-hosted, $20/month cloud',
        complexity: 'Medium to High'
      }
    ]
  };
};

// Legacy function disabled but preserved for reference
export const generateN8nWorkflow_DISABLED = (automationOpportunities, sopData) => {
  const workflow = {
    name: `${sopData?.title || 'SOP'} Automation Workflow`,
    nodes: [],
    connections: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: false,
    id: Math.random().toString(36).substr(2, 9)
  }

  let nodeId = 1
  let yPosition = 300

  // Start node
  workflow.nodes.push({
    id: `node-${nodeId}`,
    name: "Start",
    type: "n8n-nodes-base.start",
    position: [100, yPosition],
    parameters: {},
    typeVersion: 1
  })

  const startNodeId = nodeId
  nodeId++
  yPosition += 200

  // Generate nodes for each automation opportunity
  automationOpportunities.forEach((opportunity, index) => {
    const opportunityNodes = generateN8nNodesForOpportunity(opportunity, nodeId, yPosition)
    
    // Add nodes to workflow
    workflow.nodes.push(...opportunityNodes.nodes)
    
    // Connect to previous node
    if (index === 0) {
      workflow.connections[`node-${startNodeId}`] = {
        main: [[{ node: `node-${nodeId}`, type: "main", index: 0 }]]
      }
    } else {
      const prevNodeId = nodeId - opportunityNodes.nodes.length
      workflow.connections[`node-${prevNodeId}`] = {
        main: [[{ node: `node-${nodeId}`, type: "main", index: 0 }]]
      }
    }

    nodeId += opportunityNodes.nodes.length
    yPosition += 200 * opportunityNodes.nodes.length
  })

  return workflow
}

export const generateZapierTemplate = (automationOpportunities, sopData) => {
  const template = {
    title: `${sopData?.title || 'SOP'} Automation`,
    description: `Automated workflow for ${sopData?.title || 'SOP'} process`,
    steps: [],
    created_at: new Date().toISOString()
  }

  // Generate Zapier steps for each automation opportunity
  automationOpportunities.forEach((opportunity, index) => {
    const zapierSteps = generateZapierStepsForOpportunity(opportunity, index + 1)
    template.steps.push(...zapierSteps)
  })

  return template
}

const generateN8nNodesForOpportunity = (opportunity, startNodeId, yPosition) => {
  const nodes = []
  
  // Determine node types based on automation solution
  const solution = opportunity.automationSolution.toLowerCase()
  
  if (solution.includes('form') || solution.includes('data entry')) {
    // Form automation nodes
    nodes.push(
      {
        id: `node-${startNodeId}`,
        name: "Form Trigger",
        type: "n8n-nodes-base.googleForms",
        position: [300, yPosition],
        parameters: {
          operation: "getResponses",
          formId: "YOUR_FORM_ID"
        },
        typeVersion: 1
      },
      {
        id: `node-${startNodeId + 1}`,
        name: "Validate Data",
        type: "n8n-nodes-base.code",
        position: [500, yPosition],
        parameters: {
          jsCode: `
// Validate form data according to SOP requirements
const formData = items[0].json;

// Add your validation logic here
if (!formData.requiredField) {
  throw new Error('Missing required field');
}

return items;
          `
        },
        typeVersion: 1
      }
    )
  } else if (solution.includes('email') || solution.includes('notification')) {
    // Email/notification nodes
    nodes.push(
      {
        id: `node-${startNodeId}`,
        name: "Email Notification",
        type: "n8n-nodes-base.gmail",
        position: [300, yPosition],
        parameters: {
          operation: "send",
          to: "stakeholder@company.com",
          subject: `${opportunity.stepDescription} - Action Required`,
          message: `Automated notification: ${opportunity.automationSolution}`
        },
        typeVersion: 1
      }
    )
  } else if (solution.includes('approval') || solution.includes('workflow')) {
    // Approval workflow nodes
    nodes.push(
      {
        id: `node-${startNodeId}`,
        name: "Approval Request",
        type: "n8n-nodes-base.slack",
        position: [300, yPosition],
        parameters: {
          operation: "postMessage",
          channel: "#approvals",
          text: `Approval needed: ${opportunity.stepDescription}`
        },
        typeVersion: 1
      },
      {
        id: `node-${startNodeId + 1}`,
        name: "Wait for Approval",
        type: "n8n-nodes-base.wait",
        position: [500, yPosition],
        parameters: {
          resume: "webhook",
          webhookPath: "approval-response"
        },
        typeVersion: 1
      }
    )
  } else if (solution.includes('report') || solution.includes('data')) {
    // Data/reporting nodes
    nodes.push(
      {
        id: `node-${startNodeId}`,
        name: "Generate Report",
        type: "n8n-nodes-base.googleSheets",
        position: [300, yPosition],
        parameters: {
          operation: "update",
          sheetId: "YOUR_SHEET_ID",
          range: "A1:Z100"
        },
        typeVersion: 1
      },
      {
        id: `node-${startNodeId + 1}`,
        name: "Send Report",
        type: "n8n-nodes-base.gmail",
        position: [500, yPosition],
        parameters: {
          operation: "send",
          to: "manager@company.com",
          subject: "Automated Report",
          attachments: "report.xlsx"
        },
        typeVersion: 1
      }
    )
  } else {
    // Generic HTTP request node
    nodes.push(
      {
        id: `node-${startNodeId}`,
        name: "API Call",
        type: "n8n-nodes-base.httpRequest",
        position: [300, yPosition],
        parameters: {
          url: "https://api.yourservice.com/endpoint",
          method: "POST",
          body: {
            step: opportunity.stepDescription,
            solution: opportunity.automationSolution
          }
        },
        typeVersion: 1
      }
    )
  }

  return { nodes, count: nodes.length }
}

const generateZapierStepsForOpportunity = (opportunity, stepNumber) => {
  const steps = []
  const solution = opportunity.automationSolution.toLowerCase()
  const stepDescription = opportunity.stepDescription.toLowerCase()

  if (solution.includes('form') || solution.includes('data entry') || stepDescription.includes('form')) {
    steps.push(
      {
        id: `step_${stepNumber}`,
        type: "trigger",
        app: "google-forms",
        event: "new_response",
        title: "New Form Response",
        description: `Trigger when ${opportunity.stepDescription} form is submitted`
      },
      {
        id: `step_${stepNumber + 1}`,
        type: "action", 
        app: "google-sheets",
        event: "create_row",
        title: "Add to Sheet",
        description: "Add validated data to tracking sheet"
      }
    )
  } else if (solution.includes('email') || solution.includes('notification') || solution.includes('response') || solution.includes('template') || stepDescription.includes('response') || stepDescription.includes('email')) {
    steps.push(
      {
        id: `step_${stepNumber}`,
        type: "trigger",
        app: "webhooks",
        event: "catch_hook",
        title: "New Ticket Created",
        description: `Trigger when new ticket needs ${opportunity.stepDescription}`
      },
      {
        id: `step_${stepNumber + 1}`,
        type: "action",
        app: "gmail",
        event: "send_email",
        title: "Send Automated Response",
        description: `Send automated response for ${opportunity.stepDescription}`,
        config: {
          to: "{{customer_email}}",
          subject: `Re: Your Support Ticket - ${opportunity.stepDescription}`,
          body: `This is an automated response: ${opportunity.automationSolution}`
        }
      }
    )
  } else if (solution.includes('approval') || solution.includes('workflow') || stepDescription.includes('approval')) {
    steps.push(
      {
        id: `step_${stepNumber}`,
        type: "action",
        app: "slack",
        event: "send_channel_message",
        title: "Request Approval",
        description: "Send approval request to Slack channel",
        config: {
          channel: "#approvals",
          text: `Approval needed for: ${opportunity.stepDescription}`
        }
      }
    )
  } else if (solution.includes('report') || solution.includes('data') || stepDescription.includes('report')) {
    steps.push(
      {
        id: `step_${stepNumber}`,
        type: "action",
        app: "google-sheets",
        event: "create_spreadsheet_row",
        title: "Update Report Data",
        description: "Add data to reporting spreadsheet"
      },
      {
        id: `step_${stepNumber + 1}`,
        type: "action",
        app: "email",
        event: "send_email",
        title: "Distribute Report",
        description: "Email report to stakeholders"
      }
    )
  } else if (solution.includes('classification') || solution.includes('categorization') || solution.includes('ml') || solution.includes('ai') || stepDescription.includes('categorization') || stepDescription.includes('classification')) {
    // Machine learning / AI classification workflows
    steps.push(
      {
        id: `step_${stepNumber}`,
        type: "trigger",
        app: "webhooks",
        event: "catch_hook",
        title: "New Item to Classify",
        description: `Trigger when new item needs ${opportunity.stepDescription}`
      },
      {
        id: `step_${stepNumber + 1}`,
        type: "action",
        app: "openai",
        event: "create_completion",
        title: "AI Classification",
        description: `Use AI to perform ${opportunity.stepDescription}`,
        config: {
          model: "gpt-3.5-turbo",
          prompt: `Classify this item: {{input_text}}`
        }
      },
      {
        id: `step_${stepNumber + 2}`,
        type: "action",
        app: "webhooks",
        event: "post",
        title: "Update System",
        description: "Send classification results back to system",
        config: {
          url: "https://your-system.com/api/classify",
          method: "POST",
          data: {
            classification: "{{ai_result}}",
            confidence: "{{confidence_score}}"
          }
        }
      }
    )
  } else {
    // Generic automation workflow
    steps.push(
      {
        id: `step_${stepNumber}`,
        type: "trigger",
        app: "webhooks",
        event: "catch_hook",
        title: "Process Trigger",
        description: `Trigger for ${opportunity.stepDescription}`
      },
      {
        id: `step_${stepNumber + 1}`,
        type: "action",
        app: "webhooks",
        event: "post",
        title: "Execute Automation",
        description: `Execute automation: ${opportunity.automationSolution}`,
        config: {
          url: "https://your-system.com/api/automate",
          method: "POST",
          data: {
            step: opportunity.stepDescription,
            solution: opportunity.automationSolution
          }
        }
      }
    )
  }

  return steps
}

export const generateAutomationSummary = (automationOpportunities, sopData) => {
  const totalAnnualSavings = automationOpportunities.reduce((sum, opp) => {
    const savings = parseFloat(opp.annualSavings?.replace(/[$,]/g, '') || 0)
    return sum + savings
  }, 0)

  const totalTimeSavings = automationOpportunities.reduce((total, opp) => {
    const minutes = parseFloat(opp.timeSavings?.replace(/[^\d.]/g, '') || 0)
    return total + minutes
  }, 0)

  const automationCount = automationOpportunities.length
  const highPriorityCount = automationOpportunities.filter(opp => opp.priority >= 80).length
  const mediumPriorityCount = automationOpportunities.filter(opp => opp.priority >= 50 && opp.priority < 80).length

  return {
    totalAnnualSavings: `$${totalAnnualSavings.toLocaleString()}`,
    totalTimeSavingsPerExecution: `${totalTimeSavings} minutes`,
    automationCount,
    priorityBreakdown: {
      high: highPriorityCount,
      medium: mediumPriorityCount,
      low: automationCount - highPriorityCount - mediumPriorityCount
    },
    estimatedImplementationTime: `${Math.ceil(automationCount * 4)} hours`,
    roiTimeline: automationCount <= 3 ? "2-4 weeks" : automationCount <= 6 ? "1-2 months" : "2-3 months"
  }
}

export const generateImplementationGuide = (automationOpportunities) => {
  return {
    phase1: {
      title: "Quick Wins (Week 1-2)",
      items: automationOpportunities
        .filter(opp => opp.priority >= 80)
        .map(opp => ({
          task: opp.stepDescription,
          solution: opp.automationSolution,
          tools: opp.tools,
          estimatedTime: "2-4 hours"
        }))
    },
    phase2: {
      title: "Medium Impact (Week 3-6)", 
      items: automationOpportunities
        .filter(opp => opp.priority >= 50 && opp.priority < 80)
        .map(opp => ({
          task: opp.stepDescription,
          solution: opp.automationSolution,
          tools: opp.tools,
          estimatedTime: "4-8 hours"
        }))
    },
    phase3: {
      title: "Strategic Improvements (Month 2-3)",
      items: automationOpportunities
        .filter(opp => opp.priority < 50)
        .map(opp => ({
          task: opp.stepDescription,
          solution: opp.automationSolution,
          tools: opp.tools,
          estimatedTime: "8-16 hours"
        }))
    }
  }
}

export const formatTemplateForDownload = (template, type = 'n8n') => {
  if (type === 'n8n') {
    return JSON.stringify(template, null, 2)
  } else if (type === 'zapier') {
    // Format as Zapier template JSON
    return JSON.stringify(template, null, 2)
  }
  return JSON.stringify(template, null, 2)
}

export const generateAutomationInstructions = (template, type = 'n8n') => {
  if (type === 'n8n') {
    return `
# n8n Workflow Setup Instructions

## Prerequisites
1. n8n instance running (cloud or self-hosted)
2. Required app credentials configured
3. Access to your data sources

## Installation Steps
1. Open your n8n dashboard
2. Click "Import from JSON"
3. Paste the provided workflow JSON
4. Configure credentials for each node
5. Update specific IDs and endpoints
6. Test the workflow with sample data
7. Activate the workflow

## Configuration Required
- Update form/sheet IDs with your actual IDs
- Configure email addresses for notifications
- Set up webhook URLs where needed
- Test all integrations before going live

## Support
- n8n Documentation: https://docs.n8n.io/
- Community Forum: https://community.n8n.io/
    `
  } else if (type === 'zapier') {
    return `
# Zapier Setup Instructions  

## Prerequisites
1. Zapier account (Pro recommended for multi-step zaps)
2. Connected apps and permissions
3. Access to your data sources

## Installation Steps
1. Log into your Zapier dashboard
2. Click "Create Zap"
3. Set up trigger based on template
4. Add action steps as defined
5. Configure app connections
6. Test each step thoroughly
7. Name and turn on your Zap

## Configuration Required
- Connect all required apps
- Update email addresses and IDs
- Configure filters and conditions
- Set up error handling
- Test with real data

## Support
- Zapier Help Center: https://help.zapier.com/
- App Integration Docs: https://zapier.com/apps
    `
  }
  return ""
}