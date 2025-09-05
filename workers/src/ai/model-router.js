/**
 * Provider-agnostic model router.
 *
 * Orchestrator → GPT-5 (if OpenAI available), fallback to Claude Sonnet
 * Agent (sub-models) → GPT-5 Mini (if OpenAI available), fallback to Claude Sonnet
 *
 * Returns raw text content from the model.
 */

import { callClaudeAPI } from './claude.js';

/**
 * Call an LLM using routing rules with organization context.
 * @param {Object} env - Execution environment containing API keys
 * @param {string} prompt - Prompt to send
 * @param {Object} opts
 * @param {('orchestrator'|'agent')} [opts.tier] - Routing tier
 * @param {number} [opts.maxTokens] - Max output tokens
 * @param {number} [opts.temperature] - Sampling temperature
 * @param {('simple'|'complex')} [opts.complexity] - Workflow complexity for model selection
 * @param {Object} [opts.organizationContext] - Organization context for model selection
 * @returns {Promise<string>} Raw text content returned by the model
 */
export async function callModel(env, prompt, opts = {}) {
  const tier = opts.tier || 'agent';
  const complexity = opts.complexity || 'simple';
  const organizationContext = opts.organizationContext || {};
  
  // Apply organization-specific model preferences
  const { getOrganizationModelPreferences } = await import('../database.js');
  const orgPreferences = await getOrganizationModelPreferences(env, organizationContext.organizationId);
  
  const maxTokens = typeof opts.maxTokens === 'number' ? opts.maxTokens : orgPreferences.maxTokens;
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : orgPreferences.temperature;
  
  // Log organization context for debugging
  console.log(`AI Model Selection for ${organizationContext.organizationId || 'Personal'}:`, {
    preferredModel: orgPreferences.preferredModel,
    fallbackModel: orgPreferences.fallbackModel,
    tier,
    complexity,
    maxTokens,
    temperature
  });

  // Check for Claude API first - but respect organization preferences
  // Note: process.env doesn't exist in Cloudflare Workers - only use env
  const claudeApiKey = env?.CLAUDE_API_KEY;
  const openaiApiKey = env?.OPENAI_API_KEY;
  
  const hasClaude = !!(claudeApiKey && claudeApiKey.startsWith('sk-ant'));
  const hasOpenAI = !!(openaiApiKey && (openaiApiKey.startsWith('sk-') || openaiApiKey.startsWith('org-')));

  // Apply organization-specific model routing preferences
  const preferredProvider = orgPreferences.preferredModel === 'claude' ? 'claude' : 'openai';
  const fallbackProvider = orgPreferences.fallbackModel === 'claude' ? 'claude' : 'openai';
  
  // Try preferred provider first
  if (preferredProvider === 'claude' && hasClaude) {
    try {
      const claudeResponse = await callClaudeAPI(env, prompt, maxTokens, {
        tier,
        complexity,
        temperature,
        workflowType: opts.workflowType,
        jobId: opts.jobId,
        organizationContext // NEW: Pass organization context to Claude API
      });
      
      // Extract text content from Claude response
      if (typeof claudeResponse === 'string') {
        return claudeResponse;
      } else if (claudeResponse && claudeResponse.content && claudeResponse.content.length > 0) {
        return claudeResponse.content[0].text || '';
      } else {
        throw new Error('Invalid Claude response format');
      }
      
    } catch (error) {
      console.warn(`Claude API failed for ${organizationContext.organizationId || 'Personal'}, trying fallback:`, error.message);
      // Fall through to fallback provider if preferred fails
    }
  }
  
  // Try OpenAI as preferred or fallback
  if ((preferredProvider === 'openai' && hasOpenAI) || (fallbackProvider === 'openai' && hasOpenAI)) {
    const apiKey = env?.OPENAI_API_KEY;
    const model = tier === 'orchestrator'
      ? (env?.OPENAI_ORCHESTRATOR_MODEL || 'gpt-4')
      : (env?.OPENAI_AGENT_MODEL || 'gpt-4');

    const body = {
      model,
      temperature,
      max_completion_tokens: maxTokens, // OpenAI uses max_completion_tokens, not max_tokens
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    // Enhanced OpenAI request with organization context
    const enhancedBody = {
      ...body,
      metadata: {
        organizationId: organizationContext.organizationId || null,
        workspaceType: organizationContext.organizationId ? 'organization' : 'personal',
        tier,
        complexity
      }
    };
    
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(enhancedBody)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    
    // Log successful model usage for organization tracking
    const { logOrganizationUsage } = await import('../database.js');
    await logOrganizationUsage(env, organizationContext.organizationId, {
      eventType: 'ai_model_used',
      jobId: opts.jobId,
      aiModel: `openai-${model}`,
      tier,
      complexity,
      tokenUsage: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0
      },
      success: true
    });
    
    return content;
  }

  // Final fallback - throw meaningful error if no valid API keys
  if (!hasClaude && !hasOpenAI) {
    throw new Error('No valid AI API keys found. Please configure CLAUDE_API_KEY or OPENAI_API_KEY environment variables.');
  }
  
  // Last resort: try fallback provider
  if (fallbackProvider === 'claude' && hasClaude) {
    try {
      const claudeResponse = await callClaudeAPI(env, prompt, maxTokens, {
        tier,
        complexity,
        temperature,
        workflowType: opts.workflowType,
        jobId: opts.jobId,
        organizationContext // NEW: Pass organization context to Claude API
      });
    
      // Extract text content from Claude response
      if (typeof claudeResponse === 'string') {
        return claudeResponse;
      } else if (claudeResponse && claudeResponse.content && claudeResponse.content.length > 0) {
        return claudeResponse.content[0].text || '';
      } else {
        throw new Error('Invalid Claude response format');
      }
    } catch (error) {
      console.error(`All AI providers failed for ${organizationContext.organizationId || 'Personal'}`);
      
      // Log failed model usage for organization tracking
      const { logOrganizationUsage } = await import('../database.js');
      await logOrganizationUsage(env, organizationContext.organizationId, {
        eventType: 'ai_model_failed',
        jobId: opts.jobId,
        aiModel: 'all_providers',
        tier,
        complexity,
        success: false,
        error: error.message
      });
      
      throw new Error(`All AI providers failed for ${organizationContext.organizationId || 'Personal'}. Error: ${error.message}`);
    }
  }
  
  // If we get here, no providers worked
  throw new Error(`No working AI providers available for ${organizationContext.organizationId || 'Personal'} workspace`);
}

export default { callModel };
