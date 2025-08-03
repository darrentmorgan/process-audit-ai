// AI prompts for Claude API integration
// These would be used with the actual Claude API when implemented

export const QUESTION_GENERATION_PROMPT = `You are ProcessAudit AI. Generate 6-8 simple, conversational questions to understand a business process and find automation opportunities.

PROCESS: {processDescription}
FILE: {fileContent}

FOCUS AREAS:
- Frequency and volume
- Time spent per step  
- Tools and systems used
- Pain points and bottlenecks
- Manual/repetitive tasks
- Data flow and approvals

QUESTION STYLE:
- One clear question per item
- Conversational tone
- Use bullet points for multi-part questions
- Focus on automation potential

RETURN FORMAT: Valid JSON array only, no other text:
[
  {
    "id": "frequency",
    "question": "How often do you run this process?",
    "type": "select", 
    "category": "volume",
    "automationFocus": "Frequency determines automation ROI",
    "options": ["Daily", "Weekly", "Monthly", "As needed"],
    "followUp": "High frequency = better automation candidate"
  },
  {
    "id": "time_breakdown", 
    "question": "How much time does each step take?\n• Setup: ___ min\n• Active work: ___ min\n• Waiting: ___ hours\n• Follow-up: ___ min",
    "type": "textarea",
    "category": "time", 
    "automationFocus": "Time breakdown reveals automation priorities",
    "placeholder": "Setup: 10 min\nWork: 45 min\nWaiting: 2 hrs\nFollow-up: 15 min",
    "followUp": "Time-intensive steps are automation targets"
  }
]

IMPORTANT: Return ONLY the JSON array. No explanations or markdown.`

export const PROCESS_ANALYSIS_PROMPT = `You are ProcessAudit AI. Analyze this business process and provide automation recommendations with ROI calculations.

PROCESS: {processDescription}
ANSWERS: {answers}  
FILE: {fileContent}

ANALYZE:
1. Map current workflow steps and pain points
2. Identify automation opportunities with time/cost savings
3. Calculate ROI and implementation effort
4. Prioritize by impact vs complexity

RETURN: JSON object only, no other text:
{
  "executiveSummary": {
    "totalTimeSavings": "X hours/week",
    "quickWins": 2,
    "estimatedROI": "X%",
    "implementationCost": "$X,XXX",
    "paybackPeriod": "X months"
  },
  "automationOpportunities": [
    {
      "id": 1,
      "processStep": "Manual task description",
      "solution": "Automation approach",
      "timeSavings": "X hours per week",
      "effort": "Low|Medium|High",
      "tools": ["Tool name"],
      "priority": 85,
      "category": "quick-win",
      "implementationSteps": ["Step 1", "Step 2"],
      "roi": "X%"
    }
  ],
  "roadmap": [
    {
      "phase": "Quick Wins (0-30 days)",
      "items": ["automation 1"],
      "estimatedSavings": "X hours/week"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object above. No explanations or markdown.`

export const DYNAMIC_FOLLOWUP_PROMPT = `Generate 2-3 follow-up questions for: "{previousQuestion}"
Answer: {userResponse}

Return JSON array only:
[{"id":"follow1","question":"Specific follow-up question","type":"textarea","category":"clarification"}]`

export async function generateQuestions(processDescription, fileContent = '') {
  console.log('🚀 generateQuestions: Starting question generation')
  console.log('📝 Input data:', {
    processDescriptionLength: processDescription.length,
    fileContentLength: fileContent.length,
    hasApiKey: !!process.env.CLAUDE_API_KEY
  })

  try {
    if (process.env.CLAUDE_API_KEY) {
      console.log('🤖 generateQuestions: Using Claude API for question generation')
      
      const prompt = QUESTION_GENERATION_PROMPT
        .replace('{processDescription}', processDescription)
        .replace('{fileContent}', fileContent)
      
      console.log('📋 generateQuestions: Generated prompt length:', prompt.length)
      console.log('📤 generateQuestions: Calling Claude API...')
      
      const startTime = Date.now()
      const response = await callClaudeAPI(prompt)
      const endTime = Date.now()
      
      console.log('⏱️ generateQuestions: Claude API response time:', `${endTime - startTime}ms`)
      console.log('📥 generateQuestions: Raw Claude response:', response)
      
      // Check if response is an array (successful parsing) or has error
      if (Array.isArray(response)) {
        console.log('✅ generateQuestions: Successfully parsed questions array:', response.length)
        return response
      } else if (response.error) {
        console.error('❌ generateQuestions: Claude API parsing error:', response.error)
        console.log('📄 generateQuestions: Raw response was:', response.rawResponse)
        return null // Fall back to sample data
      } else {
        console.log('🔄 generateQuestions: Response not an array, checking for .questions property')
        const questions = response.questions || response
        if (Array.isArray(questions)) {
          console.log('✅ generateQuestions: Found questions in response:', questions.length)
          return questions
        } else {
          console.log('❌ generateQuestions: No valid questions found in response')
          return null
        }
      }
    }
    
    console.log('⚠️ generateQuestions: No Claude API key found, using sample data')
    return null // Use sample data
  } catch (error) {
    console.error('❌ generateQuestions: Error calling Claude API:', error)
    console.error('❌ generateQuestions: Error stack:', error.stack)
    return null // Fall back to sample data
  }
}

export async function analyzeProcess(processDescription, fileContent = '', answers = {}) {
  try {
    if (process.env.CLAUDE_API_KEY) {
      console.log('Using Claude API for process analysis...')
      const prompt = PROCESS_ANALYSIS_PROMPT
        .replace('{processDescription}', processDescription)
        .replace('{fileContent}', fileContent)
        .replace('{answers}', JSON.stringify(answers, null, 2))
      
      const response = await callClaudeAPI(prompt)
      
      // Check if response has the expected structure or has error
      if (response.error) {
        console.error('Claude API parsing error:', response.error)
        return null // Fall back to sample data
      } else if (response.executiveSummary || response.report) {
        return response.report || response
      } else {
        return response
      }
    }
    
    console.log('No Claude API key found, using sample data')
    return null // Use sample data
  } catch (error) {
    console.error('Error calling Claude API:', error)
    return null // Fall back to sample data
  }
}

export async function generateFollowUpQuestions(previousQuestion, userResponse) {
  console.log('🚀 generateFollowUpQuestions: Starting follow-up generation')
  console.log('📝 Input data:', {
    previousQuestion,
    userResponseLength: userResponse.length,
    hasApiKey: !!process.env.CLAUDE_API_KEY
  })

  try {
    if (process.env.CLAUDE_API_KEY) {
      console.log('🤖 generateFollowUpQuestions: Using Claude API for follow-up generation')
      
      const prompt = DYNAMIC_FOLLOWUP_PROMPT
        .replace('{previousQuestion}', previousQuestion)
        .replace('{userResponse}', userResponse)
      
      console.log('📋 generateFollowUpQuestions: Generated prompt length:', prompt.length)
      console.log('📤 generateFollowUpQuestions: Calling Claude API...')
      
      const startTime = Date.now()
      const response = await callClaudeAPI(prompt)
      const endTime = Date.now()
      
      console.log('⏱️ generateFollowUpQuestions: Claude API response time:', `${endTime - startTime}ms`)
      console.log('📥 generateFollowUpQuestions: Raw Claude response:', response)
      
      // Check if response is an array (successful parsing) or has error
      if (Array.isArray(response)) {
        console.log('✅ generateFollowUpQuestions: Successfully parsed follow-up questions array:', response.length)
        return response
      } else if (response.error) {
        console.error('❌ generateFollowUpQuestions: Claude API parsing error:', response.error)
        console.log('📄 generateFollowUpQuestions: Raw response was:', response.rawResponse)
        return null // No follow-up questions
      } else {
        console.log('🔄 generateFollowUpQuestions: Response not an array, checking for .questions property')
        const questions = response.questions || response
        if (Array.isArray(questions)) {
          console.log('✅ generateFollowUpQuestions: Found questions in response:', questions.length)
          return questions
        } else {
          console.log('❌ generateFollowUpQuestions: No valid questions found in response')
          return null
        }
      }
    }
    
    console.log('⚠️ generateFollowUpQuestions: No Claude API key found, skipping follow-up')
    return null // No follow-up questions
  } catch (error) {
    console.error('❌ generateFollowUpQuestions: Error calling Claude API:', error)
    console.error('❌ generateFollowUpQuestions: Error stack:', error.stack)
    return null // No follow-up questions
  }
}

// Helper function for Claude API calls using Haiku for cost-effective testing
async function callClaudeAPI(prompt, retryWithMoreTokens = false) {
  // Adjust token limit based on retry flag - increased for longer prompts
  const maxTokens = retryWithMoreTokens ? 8000 : 4000
  
  console.log('🔗 callClaudeAPI: Making request to Claude API')
  console.log('📊 callClaudeAPI: Request details:', {
    model: 'claude-3-haiku-20240307',
    maxTokens: maxTokens,
    isRetry: retryWithMoreTokens,
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 200) + '...'
  })

  const requestBody = {
    model: 'claude-3-haiku-20240307', // Using Haiku for cost-effective testing
    max_tokens: maxTokens, // Optimized token limit for cost efficiency
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  }

  console.log('📤 callClaudeAPI: Sending request to https://api.anthropic.com/v1/messages')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  })

  console.log('📥 callClaudeAPI: Response received:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('❌ callClaudeAPI: API request failed:', errorData)
    throw new Error(`Claude API request failed: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  console.log('📄 callClaudeAPI: Raw response data:', data)
  console.log('💬 callClaudeAPI: Response text content:', data.content[0]?.text)
  
  // Check for token limit issues
  const usage = data.usage
  if (usage) {
    console.log('📊 TOKEN USAGE ANALYSIS:', {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      maxTokensLimit: requestBody.max_tokens,
      tokenLimitReached: usage.output_tokens >= requestBody.max_tokens * 0.95, // 95% threshold
      utilizationPercent: Math.round((usage.output_tokens / requestBody.max_tokens) * 100)
    })
    
    if (usage.output_tokens >= requestBody.max_tokens * 0.95) {
      console.warn('⚠️ LIKELY TOKEN LIMIT HIT! Response may be truncated.')
      console.warn('💡 Consider increasing max_tokens or simplifying the prompt.')
    }
  }
  
  // Check if response appears truncated
  const responseText = data.content[0]?.text || ''
  const lastChar = responseText.trim().slice(-1)
  const openBraces = (responseText.match(/\{/g) || []).length
  const closeBraces = (responseText.match(/\}/g) || []).length
  const openBrackets = (responseText.match(/\[/g) || []).length
  const closeBrackets = (responseText.match(/\]/g) || []).length
  
  if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
    console.warn('⚠️ RESPONSE APPEARS TRUNCATED - Mismatched brackets/braces!')
    console.warn('📊 Bracket analysis:', {
      openBraces,
      closeBraces,
      openBrackets,
      closeBrackets,
      lastChar,
      endsWithValidJSON: ['}', ']'].includes(lastChar)
    })
  }

  try {
    let responseText = data.content[0].text.trim()
    console.log('📄 callClaudeAPI: Raw response text length:', responseText.length)
    console.log('📄 callClaudeAPI: Raw response preview:', responseText.substring(0, 500) + '...')
    
    // Try to clean up common JSON issues
    // Remove any text before the first { or [
    const jsonStart = Math.min(
      responseText.indexOf('{') !== -1 ? responseText.indexOf('{') : Infinity,
      responseText.indexOf('[') !== -1 ? responseText.indexOf('[') : Infinity
    )
    
    if (jsonStart !== Infinity && jsonStart > 0) {
      console.log('🧹 callClaudeAPI: Cleaning response - removing text before JSON')
      responseText = responseText.substring(jsonStart)
    }
    
    // Try to find the last complete } or ]
    let jsonEnd = Math.max(responseText.lastIndexOf('}'), responseText.lastIndexOf(']'))
    if (jsonEnd !== -1 && jsonEnd < responseText.length - 1) {
      console.log('🧹 callClaudeAPI: Cleaning response - removing text after JSON')
      responseText = responseText.substring(0, jsonEnd + 1)
    }
    
    console.log('🧹 callClaudeAPI: Cleaned response preview:', responseText.substring(0, 200) + '...')
    
    const parsedResponse = JSON.parse(responseText)
    console.log('✅ callClaudeAPI: Successfully parsed JSON response')
    return parsedResponse
  } catch (parseError) {
    console.warn('❌ callClaudeAPI: Failed to parse Claude response as JSON:', parseError.message)
    console.log('📄 callClaudeAPI: Raw text that failed to parse:', data.content[0]?.text?.substring(0, 1000) + '...')
    
    // Try to extract partial JSON if possible
    const responseText = data.content[0]?.text || ''
    
    // Look for array patterns for questions
    const arrayMatch = responseText.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      try {
        console.log('🔄 callClaudeAPI: Attempting to parse extracted array')
        const extractedArray = JSON.parse(arrayMatch[0])
        console.log('✅ callClaudeAPI: Successfully parsed extracted array')
        return extractedArray
      } catch (e) {
        console.log('❌ callClaudeAPI: Failed to parse extracted array')
      }
    }
    
    // Look for object patterns for analysis
    const objectMatch = responseText.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        console.log('🔄 callClaudeAPI: Attempting to parse extracted object')
        const extractedObject = JSON.parse(objectMatch[0])
        console.log('✅ callClaudeAPI: Successfully parsed extracted object')
        return extractedObject
      } catch (e) {
        console.log('❌ callClaudeAPI: Failed to parse extracted object')
      }
    }
    
    // If parsing failed and we haven't retried with more tokens yet, try again
    if (!retryWithMoreTokens && usage && usage.output_tokens >= requestBody.max_tokens * 0.95) {
      console.log('🔄 callClaudeAPI: Retrying with increased token limit due to likely truncation')
      return await callClaudeAPI(prompt, true)
    }
    
    return { error: 'Failed to parse AI response', rawResponse: responseText }
  }
}

export const SAMPLE_QUESTIONS = [
  {
    id: 'frequency',
    question: 'How often do you perform this process?',
    type: 'select',
    options: ['Daily', 'Weekly', 'Monthly', 'As needed'],
    category: 'frequency'
  },
  {
    id: 'time_spent',
    question: 'Approximately how much time does this process take each time?',
    type: 'select',
    options: ['Less than 30 minutes', '30 minutes - 1 hour', '1-2 hours', '2-4 hours', 'More than 4 hours'],
    category: 'resources'
  },
  {
    id: 'people_involved',
    question: 'How many people are typically involved in this process?',
    type: 'number',
    category: 'resources'
  },
  {
    id: 'current_tools',
    question: 'What tools or software do you currently use for this process?',
    type: 'textarea',
    category: 'tools'
  },
  {
    id: 'pain_points',
    question: 'What are the biggest challenges or frustrations with this process?',
    type: 'textarea',
    category: 'pain_points'
  },
  {
    id: 'manual_steps',
    question: 'Which steps in this process are currently done manually?',
    type: 'textarea',
    category: 'pain_points'
  },
  {
    id: 'data_entry',
    question: 'Does this process involve repetitive data entry or copying information between systems?',
    type: 'select',
    options: ['Yes, frequently', 'Sometimes', 'Rarely', 'No'],
    category: 'pain_points'
  },
  {
    id: 'approval_workflows',
    question: 'Are there approval steps or review processes involved?',
    type: 'select',
    options: ['Yes, multiple approvals', 'Yes, single approval', 'No approvals needed'],
    category: 'workflow'
  }
]