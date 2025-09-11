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

// All N8N workflow generation functions removed
// Replaced with generateAutomationRecommendations above

// Legacy functions removed - no longer needed:
// - generateN8nWorkflow 
// - generateZapierTemplate
// - generateN8nNodesForOpportunity  
// - generateZapierStepsForOpportunity
// - All MCP integration code

// All n8n workflow generation functionality has been removed for simplicity
// ProcessAudit AI now focuses on strategic automation recommendations

