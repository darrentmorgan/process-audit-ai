/**
 * Workflow Complexity Detection for Smart Model Routing
 * Determines whether to use Claude 3.7 (expensive, high-quality) or 3.5 (cheaper)
 */

export class WorkflowComplexityDetector {
  /**
   * Analyze job complexity and recommend model tier
   * @param {Object} orchestrationPlan - The orchestration plan
   * @param {Object} job - The job data
   * @returns {Object} { complexity: 'simple'|'complex', score: number, reasoning: string[] }
   */
  static analyzeComplexity(orchestrationPlan, job) {
    let complexityScore = 0;
    const reasoning = [];

    // 1. Node count analysis
    const stepCount = orchestrationPlan?.steps?.length || 0;
    if (stepCount >= 5) {
      complexityScore += 3;
      reasoning.push(`High step count: ${stepCount} steps`);
    } else if (stepCount >= 3) {
      complexityScore += 1;
      reasoning.push(`Medium step count: ${stepCount} steps`);
    }

    // 2. Integration complexity
    const integrations = orchestrationPlan?.integrations || [];
    const multiPlatform = integrations.length >= 2;
    if (multiPlatform) {
      complexityScore += 2;
      reasoning.push(`Multi-platform integration: ${integrations.join(', ')}`);
    }

    // 3. AI processing requirements
    const processDescription = job.processData?.processDescription?.toLowerCase() || '';
    const hasAI = processDescription.includes('ai') || 
                  processDescription.includes('analysis') || 
                  processDescription.includes('classification') ||
                  job.automationOpportunities?.some(op => 
                    op.automationSolution?.includes('ai_') || 
                    op.automationSolution?.includes('intelligent')
                  );
    
    if (hasAI) {
      complexityScore += 2;
      reasoning.push('AI processing required');
    }

    // 4. Business context complexity
    const businessContext = job.processData?.businessContext;
    const isHighVolumeIndustry = businessContext?.industry?.toLowerCase().includes('finance') ||
                                businessContext?.industry?.toLowerCase().includes('insurance') ||
                                businessContext?.industry?.toLowerCase().includes('healthcare');
    
    if (isHighVolumeIndustry) {
      complexityScore += 1;
      reasoning.push(`High-compliance industry: ${businessContext.industry}`);
    }

    // 5. Volume and SLA requirements
    const volume = businessContext?.volume || orchestrationPlan?.volumeExpected || '';
    const highVolume = volume.toLowerCase().includes('100+') || 
                      volume.toLowerCase().includes('200+') ||
                      volume.toLowerCase().includes('high');
    
    if (highVolume) {
      complexityScore += 1;
      reasoning.push(`High volume requirements: ${volume}`);
    }

    // 6. Error handling and conditional logic
    const hasConditionalLogic = orchestrationPlan?.steps?.some(step => 
      step.type === 'condition' || 
      step.type === 'switch' || 
      step.type === 'conditional'
    );

    if (hasConditionalLogic) {
      complexityScore += 1;
      reasoning.push('Conditional logic required');
    }

    // 7. Parallel processing requirements
    const hasParallelProcessing = integrations.length > 2 ||
                                 processDescription.includes('parallel') ||
                                 processDescription.includes('simultaneous');

    if (hasParallelProcessing) {
      complexityScore += 2;
      reasoning.push('Parallel processing required');
    }

    // Determine complexity level
    const complexity = complexityScore >= 4 ? 'complex' : 'simple';
    
    return {
      complexity,
      score: complexityScore,
      reasoning,
      recommendation: complexity === 'complex' ? 'claude-3.7' : 'claude-3.5',
      costImpact: complexity === 'complex' ? 'high' : 'low'
    };
  }

  /**
   * Get context budget based on complexity
   * @param {string} complexity - 'simple' or 'complex'
   * @param {string} role - 'orchestrator' or 'agent'
   * @returns {Object} { inputTokens: number, outputTokens: number }
   */
  static getContextBudget(complexity, role) {
    const budgets = {
      simple: {
        orchestrator: { inputTokens: 8000, outputTokens: 3000 },
        agent: { inputTokens: 6000, outputTokens: 2000 }
      },
      complex: {
        orchestrator: { inputTokens: 15000, outputTokens: 5000 },
        agent: { inputTokens: 10000, outputTokens: 3000 }
      }
    };

    return budgets[complexity]?.[role] || budgets.simple[role];
  }

  /**
   * Get documentation retrieval parameters based on complexity
   * @param {string} complexity - 'simple' or 'complex'
   * @returns {Object} { nodeCount: number, charsPerDoc: number }
   */
  static getDocumentationParams(complexity) {
    return complexity === 'complex' 
      ? { nodeCount: 8, charsPerDoc: 1200 }  // Enhanced for complex workflows
      : { nodeCount: 4, charsPerDoc: 600 };  // Conservative for simple workflows
  }
}

export default WorkflowComplexityDetector;