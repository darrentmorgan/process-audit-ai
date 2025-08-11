/**
 * Tests for Claude 3.7 Cost-Optimized Implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowComplexityDetector } from '../src/utils/complexity-detector.js';
import { ContextOptimizer } from '../src/ai/context-optimizer.js';
import { CostMonitor } from '../src/monitoring/cost-monitor.js';

describe('Claude 3.7 Cost Optimization', () => {
  describe('Complexity Detection', () => {
    it('should detect simple email workflows', () => {
      const job = {
        processData: {
          processDescription: 'Simple email automation for customer support',
          businessContext: { industry: 'Support', volume: '50 emails/day' }
        },
        automationOpportunities: [
          { automationSolution: 'email_basic_response' }
        ]
      };

      const orchestrationPlan = {
        steps: [{ type: 'email' }, { type: 'function' }],
        integrations: ['gmail']
      };

      const analysis = WorkflowComplexityDetector.analyzeComplexity(orchestrationPlan, job);
      
      expect(analysis.complexity).toBe('simple');
      expect(analysis.recommendation).toBe('claude-3.5');
      expect(analysis.score).toBeLessThan(4);
    });

    it('should detect complex multi-platform workflows', () => {
      const job = {
        processData: {
          processDescription: 'Complex AI-powered email classification with Google Sheets and Airtable integration, conditional routing based on customer priority',
          businessContext: { 
            industry: 'Finance', 
            volume: '200+ emails/day',
            complexity: 'High - requires multi-step analysis'
          }
        },
        automationOpportunities: [
          { automationSolution: 'ai_email_processing' },
          { automationSolution: 'intelligent_routing' },
          { automationSolution: 'dual_platform_sync' }
        ]
      };

      const orchestrationPlan = {
        steps: [
          { type: 'email' }, { type: 'ai_processing' }, 
          { type: 'condition' }, { type: 'data_sync' }, 
          { type: 'notification' }
        ],
        integrations: ['gmail', 'googleSheets', 'airtable', 'ai'],
        volumeExpected: '200+ daily'
      };

      const analysis = WorkflowComplexityDetector.analyzeComplexity(orchestrationPlan, job);
      
      expect(analysis.complexity).toBe('complex');
      expect(analysis.recommendation).toBe('claude-3.7');
      expect(analysis.score).toBeGreaterThanOrEqual(4);
      expect(analysis.reasoning).toContain('AI processing required');
      // Check for multi-platform integration (may appear as different text)
      expect(analysis.reasoning.some(r => 
        r.includes('platform') || r.includes('integration') || r.includes('gmail, googleSheets, airtable')
      )).toBe(true);
    });
  });

  describe('Context Optimization', () => {
    it('should optimize context for email automation workflows', () => {
      const job = {
        processData: { processDescription: 'Email automation with AI responses' },
        automationOpportunities: [{ automationSolution: 'ai_email_processing' }]
      };

      const orchestrationPlan = {
        integrations: ['gmail', 'openai']
      };

      const context = ContextOptimizer.getOptimizedContext(orchestrationPlan, job);

      expect(context.workflowType).toBe('email-automation');
      expect(context.focusNodeTypes).toContain('gmail');
      expect(context.focusNodeTypes).toContain('openai');
      expect(context.focusAreas).toContain('email handling');
      expect(context.focusAreas).toContain('AI responses');
    });

    it('should optimize context for data sync workflows', () => {
      const job = {
        processData: { processDescription: 'Sync customer data between Google Sheets and Airtable' }
      };

      const orchestrationPlan = {
        integrations: ['googleSheets', 'airtable', 'webhook']
      };

      const context = ContextOptimizer.getOptimizedContext(orchestrationPlan, job);

      expect(context.workflowType).toBe('data-sync');
      expect(context.focusNodeTypes).toContain('googleSheets');
      expect(context.focusNodeTypes).toContain('airtable');
      expect(context.focusAreas).toContain('data transformation');
      expect(context.focusAreas).toContain('parallel processing');
    });

    it('should scale context based on complexity', () => {
      const job = { processData: { processDescription: 'Simple webhook to email' } };
      const orchestrationPlan = { integrations: ['webhook'] };

      const context = ContextOptimizer.getOptimizedContext(orchestrationPlan, job);

      // Simple workflows should have reduced context
      expect(context.nodeCount).toBeLessThanOrEqual(6);
      expect(context.charsPerDoc).toBeLessThan(1000);
    });
  });

  describe('Cost Monitoring', () => {
    let costMonitor;
    
    beforeEach(() => {
      costMonitor = new CostMonitor({});
      global.costTracker = []; // Reset cost tracker
    });

    it('should calculate costs correctly for Claude 3.5', () => {
      const cost = costMonitor.calculateCost('claude-3-5-sonnet-20241022', 1000, 500);
      
      expect(cost.model).toBe('claude-3-5-sonnet');
      expect(cost.inputCost).toBe(0.003); // 1000/1M * $3
      expect(cost.outputCost).toBe(0.0075); // 500/1M * $15
      expect(cost.totalCost).toBe(0.0105); // $0.0105
    });

    it('should calculate costs correctly for Claude 3.7', () => {
      const cost = costMonitor.calculateCost('claude-3-7-sonnet-20250514', 1000, 500);
      
      expect(cost.model).toBe('claude-3-7-sonnet');
      expect(cost.inputCost).toBe(0.015); // 1000/1M * $15
      expect(cost.outputCost).toBe(0.0375); // 500/1M * $75
      expect(cost.totalCost).toBe(0.0525); // $0.0525 (5x more expensive)
    });

    it('should detect budget violations', () => {
      // Add a high-cost call
      const highCostData = costMonitor.calculateCost('claude-3-7-sonnet-20250514', 50000, 8000);
      
      const budgetStatus = costMonitor.checkBudget(highCostData);
      
      expect(budgetStatus.withinBudget).toBe(false);
      expect(budgetStatus.warnings.length).toBeGreaterThan(0);
      expect(budgetStatus.warnings[0]).toContain('exceeds limit');
    });

    it('should provide optimization recommendations', () => {
      // Simulate high 3.7 usage
      const costData1 = costMonitor.calculateCost('claude-3-7-sonnet-20250514', 20000, 5000);
      const costData2 = costMonitor.calculateCost('claude-3-7-sonnet-20250514', 25000, 6000);
      
      global.costTracker = [
        { ...costData1, complexity: 'simple', model: 'claude-3-7-sonnet' },
        { ...costData2, complexity: 'simple', model: 'claude-3-7-sonnet' }
      ];

      const recommendations = costMonitor.getOptimizationRecommendations({ 
        nodeCount: 8, 
        complexity: 'simple' 
      });

      expect(recommendations.recommendations.length).toBeGreaterThan(0);
      expect(recommendations.recommendations.some(r => r.action === 'prefer-3-5')).toBe(true);
      expect(recommendations.potentialSavings).toBeGreaterThan(0);
    });
  });

  describe('Token Budget Management', () => {
    it('should enforce appropriate budgets for simple workflows', () => {
      const budget = WorkflowComplexityDetector.getContextBudget('simple', 'orchestrator');
      
      expect(budget.inputTokens).toBe(8000);
      expect(budget.outputTokens).toBe(3000);
    });

    it('should allow higher budgets for complex workflows', () => {
      const budget = WorkflowComplexityDetector.getContextBudget('complex', 'orchestrator');
      
      expect(budget.inputTokens).toBe(15000);
      expect(budget.outputTokens).toBe(5000);
      expect(budget.inputTokens).toBeGreaterThan(8000); // Higher than simple
    });

    it('should provide documentation parameters based on complexity', () => {
      const simpleParams = WorkflowComplexityDetector.getDocumentationParams('simple');
      const complexParams = WorkflowComplexityDetector.getDocumentationParams('complex');
      
      expect(simpleParams.nodeCount).toBe(4);
      expect(simpleParams.charsPerDoc).toBe(600);
      
      expect(complexParams.nodeCount).toBe(8);
      expect(complexParams.charsPerDoc).toBe(1200);
      
      // Complex should have more context
      expect(complexParams.nodeCount).toBeGreaterThan(simpleParams.nodeCount);
      expect(complexParams.charsPerDoc).toBeGreaterThan(simpleParams.charsPerDoc);
    });
  });

  describe('Cost-Benefit Analysis', () => {
    it('should demonstrate cost vs quality trade-offs', () => {
      const simpleWorkflow = {
        complexity: 'simple',
        nodeCount: 4,
        charsPerDoc: 600
      };

      const complexWorkflow = {
        complexity: 'complex', 
        nodeCount: 8,
        charsPerDoc: 1200
      };

      const simpleCost = ContextOptimizer.estimateCost(simpleWorkflow, 'claude-3-5-sonnet');
      const complexCost = ContextOptimizer.estimateCost(complexWorkflow, 'claude-3-7-sonnet');

      // Complex workflows should cost more but provide better quality
      expect(complexCost.totalCost).toBeGreaterThan(simpleCost.totalCost);
      expect(complexCost.estimatedInputTokens).toBeGreaterThan(simpleCost.estimatedInputTokens);
      
      // But the cost should be controlled (not 19x more)
      expect(complexCost.totalCost).toBeLessThan(simpleCost.totalCost * 10); // Less than 10x
    });
  });
});