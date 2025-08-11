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
 * Call an LLM using routing rules.
 * @param {Object} env - Execution environment containing API keys
 * @param {string} prompt - Prompt to send
 * @param {Object} opts
 * @param {('orchestrator'|'agent')} [opts.tier] - Routing tier
 * @param {number} [opts.maxTokens] - Max output tokens
 * @param {number} [opts.temperature] - Sampling temperature
 * @param {('simple'|'complex')} [opts.complexity] - Workflow complexity for model selection
 * @returns {Promise<string>} Raw text content returned by the model
 */
export async function callModel(env, prompt, opts = {}) {
  const tier = opts.tier || 'agent';
  const complexity = opts.complexity || 'simple';
  const maxTokens = typeof opts.maxTokens === 'number' ? opts.maxTokens : 4096;
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.2;

  // Check for Claude API first (prioritize Claude over OpenAI)
  // Note: process.env doesn't exist in Cloudflare Workers - only use env
  const claudeApiKey = env?.CLAUDE_API_KEY;
  const openaiApiKey = env?.OPENAI_API_KEY;
  
  const hasClaude = !!(claudeApiKey && claudeApiKey.startsWith('sk-ant'));
  const hasOpenAI = !!(openaiApiKey && (openaiApiKey.startsWith('sk-') || openaiApiKey.startsWith('org-')));

  // Use Claude if available, otherwise try OpenAI
  if (hasClaude) {
    try {
      const claudeResponse = await callClaudeAPI(env, prompt, maxTokens, {
        tier,
        complexity,
        temperature,
        workflowType: opts.workflowType,
        jobId: opts.jobId
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
      console.warn('Claude API failed, trying OpenAI fallback:', error.message);
      // Fall through to OpenAI if Claude fails
    }
  }

  if (hasOpenAI) {
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

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return content;
  }

  // Final fallback - throw meaningful error if no valid API keys
  if (!hasClaude && !hasOpenAI) {
    throw new Error('No valid AI API keys found. Please configure CLAUDE_API_KEY or OPENAI_API_KEY environment variables.');
  }
  
  // Last resort: try Claude without validation (might be dev environment)
  try {
    const claudeResponse = await callClaudeAPI(env, prompt, maxTokens, {
      tier,
      complexity,
      temperature,
      workflowType: opts.workflowType,
      jobId: opts.jobId
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
    throw new Error(`All AI providers failed. Claude error: ${error.message}`);
  }
}

export default { callModel };
