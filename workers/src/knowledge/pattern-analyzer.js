/**
 * Pattern Recognition System for n8n Workflows
 * Analyzes workflows to identify successful patterns and anti-patterns
 */

import { workingFlowExamples, bestPractices, antiPatterns } from './workflow-examples.js';

export class WorkflowPatternAnalyzer {
  constructor() {
    this.knowledgeBase = workingFlowExamples;
    this.bestPractices = bestPractices;
    this.antiPatterns = antiPatterns;
  }

  /**
   * Find similar workflows based on semantic matching
   */
  findSimilarWorkflows(orchestrationPlan, limit = 3) {
    const planKeywords = this.extractKeywords(orchestrationPlan.description);
    const planType = this.classifyWorkflowType(orchestrationPlan);
    
    const similarities = [];
    
    // Search through all workflow categories
    for (const [category, workflows] of Object.entries(this.knowledgeBase)) {
      for (const [key, workflow] of Object.entries(workflows)) {
        const similarity = this.calculateSimilarity(planKeywords, planType, workflow);
        
        if (similarity.score > 0.3) { // Minimum relevance threshold
          similarities.push({
            ...workflow,
            category,
            key,
            similarity: similarity.score,
            matchedTags: similarity.matchedTags,
            relevanceReason: similarity.reason
          });
        }
      }
    }
    
    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Extract applicable best practices based on workflow characteristics
   */
  getApplicableBestPractices(orchestrationPlan, similarWorkflows = []) {
    const practices = [];
    const planFeatures = this.analyzeWorkflowFeatures(orchestrationPlan);
    
    // Add practices based on workflow features
    if (planFeatures.hasHttpRequests) {
      practices.push(...this.bestPractices.errorHandling.filter(p => 
        p.category === 'HTTP Requests'
      ));
    }
    
    if (planFeatures.hasEmailOperations) {
      practices.push(...this.bestPractices.errorHandling.filter(p => 
        p.category === 'Email Operations'
      ));
    }
    
    if (planFeatures.hasDataProcessing) {
      practices.push(...this.bestPractices.performance.filter(p => 
        p.category === 'Large Dataset Processing'
      ));
    }
    
    if (planFeatures.hasWebhooks) {
      practices.push(...this.bestPractices.security.filter(p => 
        p.category === 'Webhook Authentication'
      ));
    }
    
    // Add practices from similar successful workflows
    similarWorkflows.forEach(workflow => {
      if (workflow.successMetrics.successRate > 0.9) {
        if (workflow.patterns?.errorHandling) {
          practices.push({
            category: 'Error Handling',
            practice: workflow.patterns.errorHandling.strategy,
            implementation: workflow.patterns.errorHandling.implementation,
            successRate: workflow.successMetrics.successRate,
            description: `Proven pattern from ${workflow.name}`,
            source: 'similar_workflow'
          });
        }
      }
    });
    
    return this.deduplicatePractices(practices);
  }

  /**
   * Identify potential failure patterns to warn about
   */
  identifyRisks(orchestrationPlan) {
    const risks = [];
    const planText = orchestrationPlan.description.toLowerCase();
    
    // Check for common anti-patterns
    this.antiPatterns.common.forEach(antiPattern => {
      if (this.matchesAntiPattern(orchestrationPlan, antiPattern)) {
        risks.push({
          risk: antiPattern.name,
          description: antiPattern.description,
          failureRate: antiPattern.failureRate,
          prevention: antiPattern.prevention,
          severity: antiPattern.failureRate > 0.3 ? 'high' : 'medium'
        });
      }
    });
    
    // Check for complexity risks
    if (orchestrationPlan.steps && orchestrationPlan.steps.length > 10) {
      risks.push({
        risk: 'High Complexity',
        description: 'Workflows with many steps are harder to debug and maintain',
        failureRate: 0.20,
        prevention: 'Consider breaking into smaller, focused workflows',
        severity: 'medium'
      });
    }
    
    return risks;
  }

  /**
   * Generate workflow optimization suggestions
   */
  generateOptimizations(orchestrationPlan, similarWorkflows = []) {
    const optimizations = [];
    const features = this.analyzeWorkflowFeatures(orchestrationPlan);
    
    // Performance optimizations
    if (features.hasDataProcessing && features.estimatedDataVolume > 1000) {
      optimizations.push({
        type: 'performance',
        suggestion: 'Use batch processing for large datasets',
        implementation: 'Add SplitInBatches node with batch size 100-500',
        expectedImprovement: '60% faster execution',
        priority: 'high'
      });
    }
    
    if (features.hasMultipleApiCalls) {
      optimizations.push({
        type: 'performance', 
        suggestion: 'Implement parallel processing for independent API calls',
        implementation: 'Use parallel execution paths and Merge node',
        expectedImprovement: '40% faster execution',
        priority: 'medium'
      });
    }
    
    // Reliability optimizations
    if (features.hasEmailOperations) {
      optimizations.push({
        type: 'reliability',
        suggestion: 'Add email delivery confirmation',
        implementation: 'Use email delivery status webhooks or read receipts',
        expectedImprovement: '95% delivery confirmation',
        priority: 'medium'
      });
    }
    
    // Security optimizations
    if (features.hasWebhooks && !features.hasAuthentication) {
      optimizations.push({
        type: 'security',
        suggestion: 'Add webhook authentication',
        implementation: 'Use headerAuth or HMAC signature validation',
        expectedImprovement: 'Prevents unauthorized access',
        priority: 'high'
      });
    }
    
    return optimizations;
  }

  /**
   * Extract successful node sequences from working flows
   */
  extractCommonSequences(workflows = null) {
    const flowsToAnalyze = workflows || this.getAllWorkflows();
    const sequences = new Map();
    
    flowsToAnalyze.forEach(workflow => {
      if (workflow.successMetrics?.successRate > 0.9) {
        const nodeSequence = this.extractNodeSequence(workflow);
        const sequenceKey = nodeSequence.join(' → ');
        
        if (!sequences.has(sequenceKey)) {
          sequences.set(sequenceKey, {
            sequence: nodeSequence,
            frequency: 0,
            successRates: [],
            avgExecutionTimes: [],
            useCases: []
          });
        }
        
        const seqData = sequences.get(sequenceKey);
        seqData.frequency++;
        seqData.successRates.push(workflow.successMetrics.successRate);
        seqData.avgExecutionTimes.push(parseFloat(workflow.successMetrics.avgExecutionTime));
        seqData.useCases.push(workflow.name);
      }
    });
    
    // Calculate averages and filter for common patterns
    return Array.from(sequences.entries())
      .map(([key, data]) => ({
        sequence: data.sequence,
        frequency: data.frequency,
        avgSuccessRate: data.successRates.reduce((a, b) => a + b, 0) / data.successRates.length,
        avgExecutionTime: data.avgExecutionTimes.reduce((a, b) => a + b, 0) / data.avgExecutionTimes.length,
        useCases: data.useCases
      }))
      .filter(seq => seq.frequency >= 2) // Appears in at least 2 workflows
      .sort((a, b) => b.avgSuccessRate - a.avgSuccessRate);
  }

  // Helper methods
  extractKeywords(description) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter(Boolean);
  }

  classifyWorkflowType(orchestrationPlan) {
    const description = orchestrationPlan.description.toLowerCase();
    const steps = orchestrationPlan.steps || [];
    
    if (description.includes('email') || steps.some(s => s.type === 'email')) {
      return 'emailAutomation';
    }
    if (description.includes('data') || description.includes('csv') || description.includes('database')) {
      return 'dataProcessing';
    }
    if (description.includes('crm') || description.includes('sync') || description.includes('integration')) {
      return 'integrationWorkflows';
    }
    
    return 'general';
  }

  calculateSimilarity(planKeywords, planType, workflow) {
    let score = 0;
    let matchedTags = [];
    let reason = [];
    
    // Type-based matching
    if (workflow.tags && workflow.tags.some(tag => planKeywords.includes(tag))) {
      const matches = workflow.tags.filter(tag => planKeywords.includes(tag));
      score += matches.length * 0.3;
      matchedTags.push(...matches);
      reason.push(`Matched tags: ${matches.join(', ')}`);
    }
    
    // Keyword matching in description
    const workflowKeywords = this.extractKeywords(workflow.description);
    const keywordMatches = planKeywords.filter(kw => workflowKeywords.includes(kw));
    score += keywordMatches.length * 0.2;
    
    if (keywordMatches.length > 0) {
      reason.push(`Matched keywords: ${keywordMatches.join(', ')}`);
    }
    
    // Success rate boost
    if (workflow.successMetrics?.successRate > 0.9) {
      score += 0.1;
      reason.push(`High success rate (${(workflow.successMetrics.successRate * 100).toFixed(1)}%)`);
    }
    
    return {
      score: Math.min(score, 1.0),
      matchedTags,
      reason: reason.join('; ')
    };
  }

  analyzeWorkflowFeatures(orchestrationPlan) {
    const description = orchestrationPlan.description.toLowerCase();
    const steps = orchestrationPlan.steps || [];
    const triggers = orchestrationPlan.triggers || [];
    
    return {
      hasHttpRequests: steps.some(s => s.type === 'http') || description.includes('api'),
      hasEmailOperations: steps.some(s => s.type === 'email') || description.includes('email'),
      hasDataProcessing: steps.some(s => s.type === 'transform') || description.includes('data'),
      hasWebhooks: triggers.some(t => t.type === 'webhook') || description.includes('webhook'),
      hasAuthentication: description.includes('auth') || description.includes('token'),
      hasMultipleApiCalls: steps.filter(s => s.type === 'http').length > 1,
      estimatedDataVolume: this.estimateDataVolume(description),
      complexityScore: steps.length + triggers.length
    };
  }

  estimateDataVolume(description) {
    if (description.includes('thousands') || description.includes('bulk')) return 5000;
    if (description.includes('hundreds')) return 500;
    if (description.includes('many') || description.includes('multiple')) return 100;
    return 10; // Default low volume
  }

  matchesAntiPattern(plan, antiPattern) {
    const description = plan.description.toLowerCase();
    
    switch (antiPattern.name) {
      case 'No Error Handling':
        return !description.includes('error') && !description.includes('retry') && !description.includes('handle');
      case 'Hardcoded Values':
        return description.includes('hardcode') || description.includes('fixed');
      case 'No Input Validation':
        return !description.includes('validate') && !description.includes('check') && !description.includes('verify');
      default:
        return false;
    }
  }

  deduplicatePractices(practices) {
    const seen = new Set();
    return practices.filter(practice => {
      const key = practice.category + practice.practice;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  extractNodeSequence(workflow) {
    if (!workflow.workflow?.nodes) return [];
    return workflow.workflow.nodes.map(node => {
      const nodeType = node.type || node.name || 'Unknown';
      return nodeType.replace('n8n-nodes-base.', '').replace(/([A-Z])/g, ' $1').trim();
    });
  }

  getAllWorkflows() {
    const allWorkflows = [];
    Object.values(this.knowledgeBase).forEach(category => {
      Object.values(category).forEach(workflow => {
        allWorkflows.push(workflow);
      });
    });
    return allWorkflows;
  }
}

export default WorkflowPatternAnalyzer;