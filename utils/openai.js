/**
 * OpenAI GPT-5 Integration for ProcessAudit AI
 * 
 * Handles OpenAI API calls with GPT-5 model integration
 * Replaces Claude API for main application AI functionality
 */

// OpenAI GPT-5 Integration - Types imported dynamically for CommonJS compatibility

/**
 * Call OpenAI API with GPT-5
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} API response
 */
async function callOpenAI(prompt, options = {}) {
  const startTime = Date.now();
  
  const {
    model = 'gpt-5',
    maxTokens = 4000,
    temperature = 0.7,
    tier = 'agent',
    organizationContext = {}
  } = options;

  // Configure model based on tier
  const modelToUse = tier === 'orchestrator' 
    ? (process.env.OPENAI_ORCHESTRATOR_MODEL || 'gpt-5')
    : (process.env.OPENAI_AGENT_MODEL || 'gpt-5-mini');

  console.log('🔗 callOpenAI: Making request to OpenAI API');
  console.log('📊 callOpenAI: Request details:', {
    model: modelToUse,
    maxTokens,
    tier,
    temperature,
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 100) + '...',
    organizationId: organizationContext.organizationId || 'default'
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const requestBody = {
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content: 'You are ProcessAudit AI, an expert business process consultant. Always respond with valid JSON when requested.'
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      max_completion_tokens: maxTokens,
      response_format: { type: 'json_object' } // Force JSON responses
    };
    
    // Only add temperature for models that support it (GPT-5, not GPT-5-mini)
    if (modelToUse === 'gpt-5') {
      requestBody.temperature = temperature;
    }

    console.log('📤 callOpenAI: Sending request to https://api.openai.com/v1/chat/completions');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    console.log('📥 callOpenAI: Response received:', {
      status: response.status,
      model: data.model,
      usage: data.usage,
      responseTime: `${responseTime}ms`
    });

    // Extract content from OpenAI response format
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('📄 callOpenAI: Raw response content length:', content.length);
    console.log('📄 callOpenAI: Response preview:', content.substring(0, 200) + '...');

    // Parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      console.log('✅ callOpenAI: Successfully parsed JSON response');
    } catch (parseError) {
      console.error('❌ callOpenAI: Failed to parse JSON:', parseError);
      console.log('📄 callOpenAI: Raw content that failed to parse:', content);
      throw new Error(`Failed to parse OpenAI JSON response: ${parseError.message}`);
    }

    return {
      success: true,
      content,
      parsedContent,
      modelUsed: data.model || modelToUse,
      provider: 'openai',
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ callOpenAI: Error occurred:', error);
    
    return {
      success: false,
      content: '',
      modelUsed: modelToUse,
      provider: 'openai',
      responseTime,
      error: error.message,
      errorDetails: error
    };
  }
}

/**
 * Call OpenAI with fallback to Claude
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Configuration options
 * @returns {Promise<any>} Parsed response content
 */
async function callModelWithFallback(prompt, options = {}) {
  try {
    console.log('🔄 Attempting OpenAI API call...');
    const openaiResponse = await callOpenAI(prompt, options);
    
    if (openaiResponse.success) {
      console.log('✅ OpenAI API call successful');
      return openaiResponse.parsedContent;
    } else {
      throw new Error(`OpenAI failed: ${openaiResponse.error}`);
    }
    
  } catch (openaiError) {
    console.warn('⚠️ OpenAI API failed, attempting Claude fallback:', openaiError.message);
    
    // Fallback to Claude API
    try {
      const { callClaudeAPI } = await import('./aiPrompts.js');
      const claudeResponse = await callClaudeAPI(prompt, false, options.maxTokens);
      
      console.log('✅ Claude fallback successful');
      return claudeResponse;
      
    } catch (claudeError) {
      console.error('❌ Both OpenAI and Claude APIs failed');
      console.error('OpenAI error:', openaiError.message);
      console.error('Claude error:', claudeError.message);
      
      throw new Error(`All AI providers failed. OpenAI: ${openaiError.message}, Claude: ${claudeError.message}`);
    }
  }
}

/**
 * Get optimal model configuration based on request type
 * @param {string} requestType - Type of AI request
 * @param {Object} organizationContext - Organization preferences
 * @returns {OpenAIModelConfig} Optimized model config
 */
function getOptimalModelConfig(requestType, organizationContext = {}) {
  const baseConfig = {
    provider: 'openai',
    temperature: 0.7,
    maxTokens: 4000
  };

  switch (requestType) {
    case 'question-generation':
      return {
        ...baseConfig,
        model: 'gpt-5-mini', // Cost-effective for question generation
        maxTokens: 3000,
        temperature: 0.8 // Higher creativity for questions
      };
      
    case 'process-analysis':
      return {
        ...baseConfig,
        model: 'gpt-5', // Full model for complex analysis
        maxTokens: 6000,
        temperature: 0.6 // Lower temperature for analytical tasks
      };
      
    case 'sop-analysis':
      return {
        ...baseConfig,
        model: 'gpt-5',
        maxTokens: 5000,
        temperature: 0.5 // Very analytical
      };
      
    case 'follow-up-questions':
      return {
        ...baseConfig,
        model: 'gpt-5-mini',
        maxTokens: 2000, // Shorter responses
        temperature: 0.8
      };
      
    default:
      return {
        ...baseConfig,
        model: 'gpt-5-mini'
      };
  }
}

/**
 * Format prompt for OpenAI chat completion format
 * @param {string} prompt - Raw prompt text
 * @param {string} systemMessage - System message for context
 * @returns {Array} Messages array for OpenAI API
 */
function formatPromptForOpenAI(prompt, systemMessage = 'You are ProcessAudit AI, an expert business process consultant.') {
  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt }
  ];
}

module.exports = { 
  callOpenAI, 
  callModelWithFallback, 
  getOptimalModelConfig, 
  formatPromptForOpenAI 
};