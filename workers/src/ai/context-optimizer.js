/**
 * Context Optimization for Cost-Effective AI Usage
 * Dynamically scales context based on workflow type and complexity
 */

import { WorkflowComplexityDetector } from '../utils/complexity-detector.js';

export class ContextOptimizer {
  /**
   * Get optimized documentation context based on workflow type
   * @param {Object} orchestrationPlan 
   * @param {Object} job 
   * @returns {Object} { nodeTypes: string[], contextSize: number, focusAreas: string[] }
   */
  static getOptimizedContext(orchestrationPlan, job) {
    const processDesc = job.processData?.processDescription?.toLowerCase() || '';
    const integrations = orchestrationPlan?.integrations || [];
    
    // Detect workflow pattern
    const workflowType = this.detectWorkflowType(processDesc, integrations, job);
    
    // Get context configuration for this workflow type
    const contextConfig = this.getContextConfig(workflowType);
    
    // Apply complexity scaling
    const complexityAnalysis = WorkflowComplexityDetector.analyzeComplexity(orchestrationPlan, job);
    const scaledContext = this.scaleContextByComplexity(contextConfig, complexityAnalysis.complexity);
    
    return {
      ...scaledContext,
      workflowType,
      complexity: complexityAnalysis.complexity,
      reasoning: `Detected ${workflowType} workflow (${complexityAnalysis.complexity} complexity)`
    };
  }

  /**
   * Detect the primary workflow type for targeted optimization
   */
  static detectWorkflowType(processDesc, integrations, job) {
    // Email automation workflows
    if (processDesc.includes('email') || 
        integrations.includes('gmail') ||
        job.automationOpportunities?.some(op => op.automationSolution?.includes('email'))) {
      return 'email-automation';
    }

    // Data synchronization workflows  
    if (processDesc.includes('sync') || processDesc.includes('sheets') || processDesc.includes('airtable') ||
        integrations.includes('googleSheets') || integrations.includes('airtable')) {
      return 'data-sync';
    }

    // AI classification workflows
    if (processDesc.includes('classif') || processDesc.includes('categoriz') || processDesc.includes('analysis') ||
        job.automationOpportunities?.some(op => op.automationSolution?.includes('ai_'))) {
      return 'ai-classification';
    }

    // Document processing workflows
    if (processDesc.includes('document') || processDesc.includes('pdf') || processDesc.includes('file')) {
      return 'document-processing';
    }

    // API integration workflows
    if (processDesc.includes('api') || processDesc.includes('webhook') || 
        integrations.includes('httpRequest') || integrations.includes('webhook')) {
      return 'api-integration';
    }

    // Default to general automation
    return 'general-automation';
  }

  /**
   * Get base context configuration for each workflow type
   */
  static getContextConfig(workflowType) {
    const configs = {
      'email-automation': {
        focusNodeTypes: ['gmail', 'gmailTrigger', 'function', 'openai', 'switch', 'merge'],
        focusAreas: ['email handling', 'AI responses', 'conditional logic'],
        baseNodeCount: 6,
        baseCharsPerDoc: 1000,
        priority: 'email processing and AI integration'
      },

      'data-sync': {
        focusNodeTypes: ['googleSheets', 'airtable', 'webhook', 'function', 'merge', 'json'],
        focusAreas: ['data transformation', 'parallel processing', 'error handling'],
        baseNodeCount: 6,
        baseCharsPerDoc: 800,
        priority: 'data reliability and sync accuracy'
      },

      'ai-classification': {
        focusNodeTypes: ['openai', 'function', 'switch', 'webhook', 'httpRequest', 'merge'],
        focusAreas: ['AI processing', 'conditional routing', 'decision logic'],
        baseNodeCount: 8,
        baseCharsPerDoc: 1200,
        priority: 'intelligent decision making and routing'
      },

      'document-processing': {
        focusNodeTypes: ['httpRequest', 'function', 'openai', 'googleSheets', 'switch'],
        focusAreas: ['file handling', 'content extraction', 'document analysis'],
        baseNodeCount: 6,
        baseCharsPerDoc: 900,
        priority: 'document parsing and processing'
      },

      'api-integration': {
        focusNodeTypes: ['webhook', 'httpRequest', 'function', 'json', 'switch', 'merge'],
        focusAreas: ['API authentication', 'error handling', 'data transformation'],
        baseNodeCount: 5,
        baseCharsPerDoc: 700,
        priority: 'reliable API connectivity and error handling'
      },

      'general-automation': {
        focusNodeTypes: ['webhook', 'function', 'httpRequest', 'switch', 'merge'],
        focusAreas: ['workflow orchestration', 'error handling', 'general integration'],
        baseNodeCount: 4,
        baseCharsPerDoc: 600,
        priority: 'flexible automation patterns'
      }
    };

    return configs[workflowType] || configs['general-automation'];
  }

  /**
   * Scale context based on complexity
   */
  static scaleContextByComplexity(baseConfig, complexity) {
    const scalingFactors = {
      simple: { nodeCount: 1.0, charsPerDoc: 0.8 },   // Reduce for simple workflows
      complex: { nodeCount: 1.5, charsPerDoc: 1.3 }   // Increase for complex workflows  
    };

    const factor = scalingFactors[complexity] || scalingFactors.simple;

    return {
      ...baseConfig,
      nodeCount: Math.min(10, Math.round(baseConfig.baseNodeCount * factor.nodeCount)),
      charsPerDoc: Math.round(baseConfig.baseCharsPerDoc * factor.charsPerDoc)
    };
  }

  /**
   * Build optimized prompt based on context
   */
  static buildOptimizedPrompt(basePrompt, contextConfig, businessContext) {
    const focusSection = `
## 🎯 WORKFLOW FOCUS AREAS
**Primary Focus**: ${contextConfig.priority}
**Key Areas**: ${contextConfig.focusAreas.join(', ')}
**Target Nodes**: ${contextConfig.focusNodeTypes.join(', ')}

**Business Context**: ${businessContext.industry || 'General'} | ${businessContext.department || 'Operations'}
**Complexity**: ${contextConfig.complexity || 'standard'} workflow requiring ${contextConfig.focusAreas[0]}`;

    return basePrompt + focusSection;
  }

  /**
   * Calculate estimated API cost for this context
   */
  static estimateCost(contextConfig, model = 'claude-3-5-sonnet') {
    const costPerMillion = {
      'claude-3-5-sonnet': { input: 3, output: 15 },
      'claude-3-7-sonnet': { input: 15, output: 75 }
    };

    const rates = costPerMillion[model] || costPerMillion['claude-3-5-sonnet'];
    
    // Estimate tokens (rough calculation)
    const estimatedInputTokens = (contextConfig.nodeCount * contextConfig.charsPerDoc * 0.25) + 2000; // docs + base prompt
    const estimatedOutputTokens = contextConfig.complexity === 'complex' ? 5000 : 3000;
    
    const cost = {
      inputCost: (estimatedInputTokens / 1000000) * rates.input,
      outputCost: (estimatedOutputTokens / 1000000) * rates.output,
      totalCost: 0
    };
    
    cost.totalCost = cost.inputCost + cost.outputCost;
    
    return {
      ...cost,
      estimatedInputTokens,
      estimatedOutputTokens,
      model
    };
  }
}

export default ContextOptimizer;