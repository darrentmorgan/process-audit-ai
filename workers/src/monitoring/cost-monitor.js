/**
 * Cost Monitoring and Budget Management
 * Tracks API usage and costs for Claude 3.7 optimization
 */

export class CostMonitor {
  constructor(env) {
    this.env = env;
    this.costTiers = {
      'claude-3-5-sonnet': { input: 3, output: 15 },
      'claude-3-7-sonnet': { input: 15, output: 75 }
    };
  }

  /**
   * Calculate cost for an API call
   * @param {string} model - Model name
   * @param {number} inputTokens - Input tokens used  
   * @param {number} outputTokens - Output tokens used
   * @returns {Object} Cost breakdown
   */
  calculateCost(model, inputTokens, outputTokens) {
    const modelKey = model.includes('claude-3-7') ? 'claude-3-7-sonnet' : 'claude-3-5-sonnet';
    const rates = this.costTiers[modelKey];
    
    const inputCost = (inputTokens / 1000000) * rates.input;
    const outputCost = (outputTokens / 1000000) * rates.output;
    const totalCost = inputCost + outputCost;
    
    return {
      model: modelKey,
      inputTokens,
      outputTokens,
      inputCost: Math.round(inputCost * 100000) / 100000, // 5 decimal places
      outputCost: Math.round(outputCost * 100000) / 100000,
      totalCost: Math.round(totalCost * 100000) / 100000,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log cost metrics (would integrate with real monitoring in production)
   * @param {Object} costData - Cost calculation result
   * @param {Object} metadata - Additional context
   */
  async logCost(costData, metadata = {}) {
    const logEntry = {
      ...costData,
      workflowType: metadata.workflowType,
      complexity: metadata.complexity,
      jobId: metadata.jobId,
      tier: metadata.tier,
      success: metadata.success
    };
    
    // In production, this would send to monitoring service
    console.log('💰 Cost Tracking:', JSON.stringify(logEntry, null, 2));
    
    // Store in simple in-memory cache for session tracking
    if (!global.costTracker) {
      global.costTracker = [];
    }
    
    global.costTracker.push(logEntry);
    
    // Keep only last 100 entries to prevent memory growth
    if (global.costTracker.length > 100) {
      global.costTracker = global.costTracker.slice(-100);
    }
  }

  /**
   * Get cost summary for current session
   * @returns {Object} Cost summary statistics
   */
  getCostSummary() {
    if (!global.costTracker || global.costTracker.length === 0) {
      return {
        totalCalls: 0,
        totalCost: 0,
        averageCost: 0,
        modelBreakdown: {},
        complexityBreakdown: {}
      };
    }

    const tracker = global.costTracker;
    const totalCost = tracker.reduce((sum, entry) => sum + entry.totalCost, 0);
    const totalCalls = tracker.length;
    
    // Model breakdown
    const modelBreakdown = tracker.reduce((acc, entry) => {
      if (!acc[entry.model]) {
        acc[entry.model] = { calls: 0, cost: 0 };
      }
      acc[entry.model].calls++;
      acc[entry.model].cost += entry.totalCost;
      return acc;
    }, {});

    // Complexity breakdown
    const complexityBreakdown = tracker.reduce((acc, entry) => {
      const complexity = entry.complexity || 'unknown';
      if (!acc[complexity]) {
        acc[complexity] = { calls: 0, cost: 0 };
      }
      acc[complexity].calls++;
      acc[complexity].cost += entry.totalCost;
      return acc;
    }, {});

    return {
      totalCalls,
      totalCost: Math.round(totalCost * 100000) / 100000,
      averageCost: Math.round((totalCost / totalCalls) * 100000) / 100000,
      modelBreakdown,
      complexityBreakdown,
      timeRange: {
        start: tracker[0]?.timestamp,
        end: tracker[tracker.length - 1]?.timestamp
      }
    };
  }

  /**
   * Check if cost budget is within limits
   * @param {Object} costData - Current cost calculation
   * @returns {Object} Budget status
   */
  checkBudget(costData) {
    const summary = this.getCostSummary();
    const dailyBudget = parseFloat(this.env.DAILY_COST_BUDGET || '10.00'); // $10 default
    const singleCallLimit = parseFloat(this.env.SINGLE_CALL_LIMIT || '1.00'); // $1 default
    
    const warnings = [];
    
    if (costData.totalCost > singleCallLimit) {
      warnings.push(`Single call cost $${costData.totalCost.toFixed(5)} exceeds limit $${singleCallLimit}`);
    }
    
    if (summary.totalCost > dailyBudget * 0.8) {
      warnings.push(`Daily usage $${summary.totalCost.toFixed(5)} approaching budget $${dailyBudget}`);
    }
    
    if (summary.totalCost > dailyBudget) {
      warnings.push(`Daily budget $${dailyBudget} exceeded! Current: $${summary.totalCost.toFixed(5)}`);
    }

    return {
      withinBudget: summary.totalCost < dailyBudget && costData.totalCost < singleCallLimit,
      warnings,
      currentCost: costData.totalCost,
      dailyTotal: summary.totalCost,
      dailyBudget,
      singleCallLimit
    };
  }

  /**
   * Get cost-optimized recommendations
   * @param {Object} contextConfig - Current context configuration
   * @returns {Object} Optimization recommendations
   */
  getOptimizationRecommendations(contextConfig) {
    const summary = this.getCostSummary();
    const recommendations = [];

    // Analyze model usage efficiency
    if (summary.modelBreakdown['claude-3-7-sonnet']) {
      const sonnet37Usage = summary.modelBreakdown['claude-3-7-sonnet'];
      const avgCost37 = sonnet37Usage.cost / sonnet37Usage.calls;
      
      if (avgCost37 > 0.50) { // High cost per call
        recommendations.push({
          type: 'cost-reduction',
          message: `Claude 3.7 averaging $${avgCost37.toFixed(3)} per call - consider reducing context size`,
          action: 'reduce-context'
        });
      }
    }

    // Context size recommendations
    if (contextConfig.nodeCount > 6 && contextConfig.complexity === 'simple') {
      recommendations.push({
        type: 'context-optimization',
        message: 'Simple workflows using complex context - reduce to 4-6 nodes',
        action: 'reduce-nodes'
      });
    }

    // Model selection recommendations  
    const simpleComplexRatio = summary.complexityBreakdown.simple?.calls / summary.totalCalls || 0;
    if (simpleComplexRatio > 0.6) {
      recommendations.push({
        type: 'model-optimization',
        message: `${Math.round(simpleComplexRatio * 100)}% simple workflows - consider defaulting to Claude 3.5`,
        action: 'prefer-3-5'
      });
    }

    return {
      recommendations,
      potentialSavings: this.calculatePotentialSavings(summary, recommendations)
    };
  }

  /**
   * Calculate potential savings from optimization recommendations
   */
  calculatePotentialSavings(summary, recommendations) {
    let potentialSavings = 0;
    
    recommendations.forEach(rec => {
      switch (rec.action) {
        case 'reduce-context':
          potentialSavings += summary.totalCost * 0.30; // 30% reduction
          break;
        case 'prefer-3-5':
          potentialSavings += summary.totalCost * 0.60; // 60% reduction from model switch
          break;
        case 'reduce-nodes':
          potentialSavings += summary.totalCost * 0.20; // 20% reduction
          break;
      }
    });

    return Math.round(potentialSavings * 100000) / 100000;
  }

  /**
   * Export cost data for analysis (production would use real analytics)
   */
  exportCostData() {
    const summary = this.getCostSummary();
    const recommendations = this.getOptimizationRecommendations({});
    
    return {
      summary,
      recommendations,
      rawData: global.costTracker || [],
      exportedAt: new Date().toISOString()
    };
  }
}

export default CostMonitor;