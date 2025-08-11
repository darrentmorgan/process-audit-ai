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
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  
  // Track actual token usage and cost
  const actualInputTokens = data.usage?.input_tokens || estimatedInputTokens;
  const actualOutputTokens = data.usage?.output_tokens || Math.ceil(data.content[0].text.length / 4);
  
  // Log cost metrics (import done lazily to avoid circular dependencies)
  try {
    const { CostMonitor } = await import('../monitoring/cost-monitor.js');
    const costMonitor = new CostMonitor(env);
    
    const costData = costMonitor.calculateCost(selectedModel, actualInputTokens, actualOutputTokens);
    await costMonitor.logCost(costData, {
      workflowType,
      complexity,
      jobId,
      tier,
      success: true
    });
    
    const budgetStatus = costMonitor.checkBudget(costData);
    if (!budgetStatus.withinBudget) {
      console.warn('⚠️ Budget warning:', budgetStatus.warnings.join('; '));
    }
  } catch (costError) {
    console.warn('Cost monitoring failed:', costError.message);
  }
  
  // Extract JSON from the response
  const content = data.content[0].text;
  
  // Try to parse JSON from the response
  try {
    // Look for JSON blocks in the response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    
    // Try to parse the entire response as JSON
    JSON.parse(content);
    return content;
  } catch (e) {
    // If not valid JSON, try to extract JSON object
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = content.substring(jsonStart, jsonEnd);
      JSON.parse(jsonStr); // Validate it's valid JSON
      return jsonStr;
    }
    
    throw new Error('Failed to extract valid JSON from Claude response');
  }
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