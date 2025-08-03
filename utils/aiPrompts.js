// AI prompts for Claude API integration
// These would be used with the actual Claude API when implemented

export const QUESTION_GENERATION_PROMPT = `You are ProcessAudit AI, a friendly business process consultant who helps technical founders find automation opportunities.

YOUR APPROACH:
Ask simple, conversational questions to understand:
- How often they do this process
- How long it takes 
- What tools they use
- Where they get stuck or frustrated
- What parts are repetitive or manual

PROCESS TO ANALYZE:
{processDescription}

FILE CONTENT (if provided):
{fileContent}

QUESTION GUIDELINES:

1. **Keep It Simple**: One clear question at a time - no compound questions
2. **Be Conversational**: Ask like you're chatting with a colleague over coffee
3. **Use Bullet Points**: When you need details, format as simple bullet lists
4. **Focus on Pain**: Find what's slow, boring, or error-prone
5. **Think Automation**: Every question should help spot automation opportunities

QUESTION CATEGORIES TO COVER:
- **volume**: How often, how many, what triggers the process
- **time**: Duration per iteration, peak periods, resource allocation
- **systems**: Current tools, data sources, integration points
- **pain_points**: Bottlenecks, errors, delays, frustrations
- **business_rules**: Decision criteria, approval workflows, exception handling
- **data_flow**: Inputs, outputs, transformations, storage requirements
- **stakeholders**: Who's involved, approval chains, communication needs
- **metrics**: How performance is measured, KPIs, quality standards

RESPONSE FORMAT:
Return ONLY a valid JSON array of 6-8 questions following this exact structure:

[
  {
    "id": "volume_frequency",
    "question": "How often do you run this process?",
    "type": "select",
    "category": "volume",
    "automationFocus": "Understanding frequency helps prioritize automation ROI",
    "options": ["Daily", "Weekly", "Monthly", "As needed"],
    "followUp": "High frequency processes are prime automation candidates"
  },
  {
    "id": "time_breakdown",
    "question": "Can you break down the time this takes?\n• Setup time: ___ minutes\n• Active work: ___ minutes\n• Waiting for approvals: ___ hours\n• Follow-up tasks: ___ minutes",
    "type": "textarea",
    "category": "time",
    "automationFocus": "Detailed time breakdown reveals biggest automation opportunities",
    "placeholder": "Setup: 10 minutes\nActive work: 45 minutes\nWaiting: 2 hours\nFollow-up: 15 minutes",
    "followUp": "Time-intensive steps become automation priorities"
  }
]

QUESTION QUALITY CRITERIA:
✅ **Specific & Actionable**: Questions should be precise enough to get quantifiable answers
✅ **Automation-Focused**: Each question should directly relate to potential automation opportunities
✅ **Business Impact Oriented**: Questions should help calculate ROI and prioritize opportunities
✅ **Technical Implementation Ready**: Questions should gather info needed for actual implementation
✅ **Progressive Disclosure**: Start broad, then drill into specifics based on process complexity

QUESTION STYLE REQUIREMENTS:
✅ **Keep it Simple**: One clear question per item - avoid compound questions
✅ **Use Bullet Points**: For multi-part questions, format as numbered lists or bullet points  
✅ **Be Conversational**: Ask like you're talking to a colleague, not conducting a formal interview
✅ **Focus on One Thing**: Each question should target one specific piece of information

EXAMPLES OF HIGH-QUALITY QUESTIONS:

❌ Poor: "What tools do you use and how is data currently transferred between them including manual entry, CSV export/import, API, etc.?"
✅ Good: "Which software tools do you use for this process?" (with follow-up: "How do you transfer data between these tools?")

❌ Poor: "What is the total time investment per process iteration, broken down by: initial setup (X minutes), active work time (X minutes), waiting for approvals (X hours), and follow-up tasks (X minutes)?"
✅ Good: "How long does this process typically take from start to finish?"

❌ Poor: "At which specific step in the process do you most frequently encounter errors, delays, or need to restart? What triggers these issues and how much additional time does recovery typically require?"
✅ Good: "Where do you usually run into problems or delays in this process?"

AUTOMATION OPPORTUNITY INDICATORS TO PROBE:
- Repetitive data entry across multiple systems
- Manual file handling and processing
- Email-based workflows and notifications
- Copy-paste operations between applications
- Regular report generation and distribution
- Approval workflows with predictable criteria
- Data validation and quality checks
- Scheduled or triggered activities
- Customer onboarding and communication sequences
- Invoice/document generation and sending

Generate questions that help spot automation opportunities while being easy and quick to answer.

Focus on finding practical automation wins that can save time and reduce frustration.

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no explanations, no markdown, no additional text
- Start with [ and end with ]
- Ensure all strings are properly quoted
- Do not include any text before or after the JSON array
- Double-check that all brackets and braces are properly closed

IMPORTANT: Your response must be valid JSON that can be parsed directly.`

export const PROCESS_ANALYSIS_PROMPT = `You are ProcessAudit AI, an expert automation consultant specializing in SaaS workflow optimization for technical founders. You excel at identifying high-impact automation opportunities with precise ROI calculations and actionable implementation roadmaps.

PROCESS ANALYSIS REQUEST:
Process Description: {processDescription}
Discovery Answers: {answers}
File Content: {fileContent}

ANALYSIS FRAMEWORK:

**Phase 1: Process Decomposition**
- Map each step in the current workflow
- Identify decision points and branching logic
- Catalog all manual touchpoints and data transfers
- Document system integrations and tool usage
- Note stakeholder involvement and handoff points

**Phase 2: Automation Opportunity Assessment**
For each process component, evaluate:
- **Automation Feasibility**: Technical complexity and implementation effort
- **Business Impact**: Time savings, error reduction, scalability improvements
- **Implementation Effort**: Development time, tool requirements, complexity rating
- **ROI Calculation**: (Time saved × frequency × hourly rate) - implementation cost
- **Risk Assessment**: What could go wrong, fallback plans, change management needs

**Phase 3: Technical Implementation Planning**
- Specific tools and platforms required
- API integrations and data flow design
- Security and compliance considerations
- Monitoring and maintenance requirements
- Rollback and error handling strategies

CALCULATION METHODOLOGY:

**Time Savings Formula:**
- Current Time Per Iteration × Frequency × 52 weeks = Annual Time Investment
- Automation Reduction % × Annual Time Investment = Annual Time Savings
- Annual Time Savings × Average Hourly Rate = Annual Cost Savings

**Priority Score Algorithm:**
Priority Score = (Annual Cost Savings × Impact Multiplier) / (Implementation Effort × Complexity Factor)
- Impact Multiplier: 1.0 (basic), 1.5 (strategic), 2.0 (transformational)
- Complexity Factor: 1.0 (low), 2.0 (medium), 4.0 (high)

**ROI Calculation:**
ROI % = ((Annual Savings - Implementation Cost) / Implementation Cost) × 100

RESPONSE FORMAT:
Return a JSON object with this exact structure:

{
  "executiveSummary": {
    "totalTimeSavings": "X-Y hours/week",
    "quickWins": number,
    "strategicOpportunities": number,
    "estimatedROI": "X-Y%",
    "implementationCost": "$X,XXX - $X,XXX",
    "paybackPeriod": "X-Y months",
    "riskLevel": "Low|Medium|High"
  },
  "processMap": {
    "currentSteps": [
      {
        "step": "Step description",
        "timeRequired": "X minutes",
        "frequency": "per day/week/month",
        "painPoints": ["issue1", "issue2"],
        "automationPotential": "High|Medium|Low"
      }
    ],
    "keyBottlenecks": ["bottleneck1", "bottleneck2"],
    "systemsInvolved": ["system1", "system2"]
  },
  "automationOpportunities": [
    {
      "id": number,
      "processStep": "Current manual process description",
      "solution": "Specific automation implementation approach",
      "timeSavings": "X hours per iteration",
      "frequency": "X times per day/week/month",
      "annualSavings": "$X,XXX",
      "effort": "Low|Medium|High",
      "implementationCost": "$XXX - $X,XXX",
      "tools": ["specific tool/platform names"],
      "priority": number (0-100),
      "category": "quick-win|strategic|transformational",
      "technicalRequirements": [
        "Specific API or integration needed",
        "Data transformation requirements",
        "Security considerations"
      ],
      "implementationSteps": [
        "Step 1: Specific action item",
        "Step 2: Specific action item",
        "Step 3: Specific action item"
      ],
      "risks": ["potential risk 1", "potential risk 2"],
      "successMetrics": ["metric 1", "metric 2"],
      "roi": "X%",
      "paybackPeriod": "X months"
    }
  ],
  "roadmap": [
    {
      "phase": "Phase 1: Quick Wins (0-30 days)",
      "items": ["specific automation 1", "specific automation 2"],
      "estimatedEffort": "X hours",
      "estimatedSavings": "X hours/week",
      "keyMilestones": ["milestone 1", "milestone 2"]
    },
    {
      "phase": "Phase 2: Strategic Improvements (1-3 months)",
      "items": ["automation 3", "automation 4"],
      "estimatedEffort": "X hours",
      "estimatedSavings": "X hours/week",
      "keyMilestones": ["milestone 1", "milestone 2"]
    },
    {
      "phase": "Phase 3: Transformational Changes (3-6 months)",
      "items": ["advanced automation 1", "advanced automation 2"],
      "estimatedEffort": "X hours",
      "estimatedSavings": "X hours/week",
      "keyMilestones": ["milestone 1", "milestone 2"]
    }
  ],
  "technicalRecommendations": {
    "preferredTools": [
      {
        "category": "Workflow Automation",
        "recommendation": "Zapier Pro",
        "reasoning": "Specific reason for this tool choice",
        "monthlyCost": "$XX"
      }
    ],
    "integrationConsiderations": [
      "API rate limits and quotas",
      "Data security and compliance requirements",
      "Scalability planning for growth"
    ],
    "monitoringStrategy": [
      "Error tracking and alerting",
      "Performance monitoring",
      "Cost optimization tracking"
    ]
  },
  "riskAssessment": {
    "implementationRisks": ["risk 1", "risk 2"],
    "mitigationStrategies": ["strategy 1", "strategy 2"],
    "rollbackPlans": ["plan 1", "plan 2"]
  }
}

ANALYSIS QUALITY STANDARDS:
✅ **Quantified Benefits**: All time savings and costs must be specific and calculated
✅ **Technical Specificity**: Include exact tools, APIs, and implementation approaches
✅ **Actionable Roadmap**: Each phase should have concrete deliverables and timelines
✅ **Risk-Aware**: Address potential failures and mitigation strategies
✅ **ROI-Focused**: Every recommendation should include clear financial justification
✅ **Implementation-Ready**: Provide enough detail for immediate execution

AUTOMATION OPPORTUNITY PRIORITIZATION:
1. **Quick Wins** (0-30 days, <$1K investment, >10 hours/week savings)
2. **Strategic** (1-3 months, $1K-5K investment, >20 hours/week savings)
3. **Transformational** (3-6 months, $5K+ investment, fundamental process change)

Focus on practical, implementable solutions using readily available tools and APIs. Prioritize opportunities that provide immediate ROI while building toward more sophisticated automation capabilities.

Provide technical founders with the specific information they need to make informed decisions and begin implementation immediately.

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no explanations, no markdown, no additional text
- Start with { and end with }
- Ensure all strings are properly quoted and escaped
- Do not include any text before or after the JSON object
- Double-check that all brackets and braces are properly closed
- Ensure all JSON keys are in double quotes

IMPORTANT: Your response must be valid JSON that can be parsed directly.`

export const DYNAMIC_FOLLOWUP_PROMPT = `You are ProcessAudit AI. Based on the user's response to: "{previousQuestion}", generate 2-3 intelligent follow-up questions that dive deeper into automation opportunities.

Previous Answer: {userResponse}

Generate follow-up questions that:
1. Quantify the opportunity more precisely
2. Identify specific technical implementation paths
3. Uncover hidden complexity or integration points

Return JSON array of follow-up questions with same structure as initial questions.

Focus on discovering the highest-impact automation opportunities that weren't revealed by the initial response.

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no explanations, no markdown, no additional text
- Start with [ and end with ]
- Ensure all strings are properly quoted
- Do not include any text before or after the JSON array
- Double-check that all brackets and braces are properly closed

IMPORTANT: Your response must be valid JSON that can be parsed directly.`

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
  // Adjust token limit based on retry flag
  const maxTokens = retryWithMoreTokens ? 4000 : 3000
  
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