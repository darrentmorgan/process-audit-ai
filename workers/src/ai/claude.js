/**
 * Claude API integration for AI-powered automation generation
 * Supports both Claude 3.5 and 3.7 with cost optimization
 */

export async function callClaudeAPI(env, prompt, maxTokens = 4096, options = {}) {
  const {
    model = 'claude-3-5-sonnet-20241022',
    temperature = 0.2,
    tier = 'agent',
    complexity = 'simple',
    workflowType = 'general',
    jobId = 'unknown'
  } = options;

  // Cost-aware model selection
  const selectedModel = selectOptimalModel(model, tier, complexity, env);
  
  // Token budget enforcement
  const budgetEnforcedTokens = enforceTokenBudget(maxTokens, selectedModel, complexity);
  
  // Estimate input tokens (rough calculation: 4 chars per token)
  const estimatedInputTokens = Math.ceil(prompt.length / 4);
  
  console.log(`🤖 Using ${selectedModel} (${complexity} workflow, ${tier} tier)`);
  console.log(`📊 Estimated: ${estimatedInputTokens} input + ${budgetEnforcedTokens} output tokens`);

  // Retry logic for overloaded errors
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: budgetEnforcedTokens,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        lastError = error;
        
        // Parse error to check if it's overloaded
        let errorData;
        try {
          errorData = JSON.parse(error);
        } catch {
          errorData = { error: { type: 'unknown', message: error } };
        }
        
        // If overloaded and we have attempts left, wait and retry
        if (errorData.error?.type === 'overloaded_error' && attempt < 3) {
          console.log(`🔄 Claude API overloaded, retrying attempt ${attempt + 1}/3 after ${attempt * 2}s...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
        
        throw new Error(`Claude API error: ${error}`);
      }

      // Success - break out of retry loop
      const data = await response.json();
      
      // Cost tracking
      if (data.usage) {
        try {
          const { CostMonitor } = await import('../monitoring/cost-monitor.js');
          const costMonitor = new CostMonitor(env);
          
          const costData = costMonitor.calculateCost(selectedModel, data.usage.input_tokens, data.usage.output_tokens);
          await costMonitor.logCost(costData, {
            workflowType,
            complexity,
            jobId,
            tier,
            success: true
          });
        } catch (costError) {
          console.warn('Cost monitoring failed:', costError.message);
        }
      }
      
      return data;
      
    } catch (error) {
      lastError = error.message;
      if (attempt === 3) {
        throw error;
      }
      console.log(`🔄 Attempt ${attempt} failed: ${error.message}, retrying...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  // Should never reach here due to throws above
  throw new Error(`All Claude API attempts failed: ${lastError}`);
}

/**
 * Select optimal model based on complexity and tier
 */
function selectOptimalModel(requestedModel, tier, complexity, env) {
  // Check if Claude 3.7 is available (via environment flag)
  const hasClaudeSonnet37 = env.CLAUDE_SONNET_37_ENABLED === 'true';
  
  if (!hasClaudeSonnet37) {
    return 'claude-3-5-sonnet-20241022'; // Fallback to 3.5
  }

  // For complex orchestration tasks, prefer Claude 3.7
  if (complexity === 'complex' && tier === 'orchestrator') {
    return 'claude-3-7-sonnet-20250514'; // Use 3.7 for complex orchestration
  }

  // For all other cases, use 3.5 to control costs
  return 'claude-3-5-sonnet-20241022';
}

/**
 * Enforce token budget based on model and complexity
 */
function enforceTokenBudget(requestedTokens, model, complexity) {
  const budgets = {
    'claude-3-5-sonnet-20241022': {
      simple: 3000,
      complex: 4000
    },
    'claude-3-7-sonnet-20250514': {
      simple: 4000,  // Higher budget for 3.7 but still controlled
      complex: 5000
    }
  };

  const modelBudgets = budgets[model] || budgets['claude-3-5-sonnet-20241022'];
  const maxBudget = modelBudgets[complexity] || modelBudgets.simple;
  
  return Math.min(requestedTokens, maxBudget);
}