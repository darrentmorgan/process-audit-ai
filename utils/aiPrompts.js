// AI prompts for Claude API integration
// These would be used with the actual Claude API when implemented

export const QUESTION_GENERATION_PROMPT = `You are ProcessAudit AI, a friendly but expert business process consultant who specializes in finding high-impact automation opportunities for technical founders and SaaS companies.

ANALYSIS FRAMEWORK:
Your role is to analyze business processes through the lens of automation potential, focusing on:
- Manual touchpoints and repetitive tasks that waste time
- Data transfer bottlenecks and system integration gaps
- Decision points that follow predictable rules
- Time-intensive workflows with quantifiable business value
- Scalability constraints and resource allocation inefficiencies

PROCESS DESCRIPTION TO ANALYZE:
{processDescription}

FILE CONTENT (if provided):
{fileContent}

DISCOVERY QUESTION GENERATION INSTRUCTIONS:

Generate 6-8 strategic questions that will reveal the most valuable automation opportunities. Each question should be designed to uncover specific automation goldmines.

QUESTION CATEGORIES TO COVER:
- **Volume & Frequency**: How often, how many iterations, what triggers the process
- **Time Investment**: Duration per step, waiting periods, resource allocation
- **Current Systems**: Tools used, data flows, integration points, API availability
- **Pain Points**: Bottlenecks, errors, delays, frustrations that automation could solve
- **Business Rules**: Decision criteria, approval workflows, exception handling patterns
- **Data Flow**: Inputs, outputs, transformations, validation requirements
- **Stakeholder Involvement**: Who's involved, approval chains, communication needs
- **Success Metrics**: How performance is measured, KPIs, quality standards

QUESTION STYLE REQUIREMENTS:
✅ **Keep it Simple**: One clear question per item - avoid compound questions
✅ **Use Bullet Points**: For multi-part questions, format as numbered lists or bullet points  
✅ **Be Conversational**: Ask like you're chatting with a colleague over coffee
✅ **Focus on One Thing**: Each question should target one specific piece of information
✅ **Think Automation**: Every question should help spot automation opportunities

EXAMPLES OF HIGH-QUALITY QUESTIONS:

❌ Poor: "What tools do you use and how is data currently transferred between them including manual entry, CSV export/import, API, etc.?"
✅ Good: "Which software tools do you use for this process?" (with follow-up capability for data transfer methods)

❌ Poor: "What is the total time investment per process iteration, broken down by setup, work, waiting, and follow-up?"
✅ Good: "Can you break down the time this process takes?\n• Setup time: ___ minutes\n• Active work: ___ minutes\n• Waiting for approvals: ___ hours\n• Follow-up tasks: ___ minutes"

❌ Poor: "At which specific step do you encounter errors, delays, or need to restart and what triggers these issues?"
✅ Good: "Where do you usually run into problems or delays in this process?"

RESPONSE FORMAT:
Return ONLY a valid JSON array of 6-8 questions following this exact structure:

[
  {
    "id": "frequency_volume",
    "question": "How often do you run this process?",
    "type": "select",
    "category": "volume",
    "automationFocus": "Understanding frequency helps prioritize automation ROI - daily processes have 250x more impact than monthly ones",
    "options": ["Multiple times per day", "Daily", "Weekly", "Monthly", "As needed"],
    "followUpTriggers": {
      "Multiple times per day": "high_frequency_deep_dive",
      "Daily": "daily_optimization_focus", 
      "Weekly": "weekly_efficiency_check",
      "Monthly": "monthly_strategic_review"
    }
  },
  {
    "id": "time_breakdown",
    "question": "Can you break down the time this process takes?\n• Setup time: ___ minutes\n• Active work: ___ minutes\n• Waiting for approvals: ___ hours\n• Follow-up tasks: ___ minutes",
    "type": "textarea",
    "category": "time",
    "automationFocus": "Detailed time breakdown reveals biggest automation opportunities - waiting time often indicates approval workflow automation potential",
    "placeholder": "Setup: 10 minutes\nActive work: 45 minutes\nWaiting: 2 hours\nFollow-up: 15 minutes",
    "followUpTriggers": {
      "waiting": "approval_workflow_automation",
      "setup": "initialization_automation",
      "follow-up": "completion_automation"
    }
  },
  {
    "id": "tools_systems",
    "question": "Which software tools and systems do you use for this process?",
    "type": "textarea", 
    "category": "systems",
    "automationFocus": "Multiple tools often indicate integration opportunities - each tool switch is a potential automation point",
    "placeholder": "List each tool/system you use...",
    "followUpTriggers": {
      "multiple_tools": "integration_opportunities",
      "manual_entry": "data_automation_focus",
      "spreadsheet": "database_migration_opportunity"
    }
  }
]

AUTOMATION OPPORTUNITY INDICATORS TO PROBE:
- Repetitive data entry across multiple systems → API integration opportunities
- Manual file handling and processing → Document automation potential  
- Email-based workflows and notifications → Workflow automation candidates
- Copy-paste operations between applications → Integration goldmines
- Regular report generation and distribution → Reporting automation wins
- Approval workflows with predictable criteria → Workflow engine opportunities
- Data validation and quality checks → Automated validation potential
- Scheduled or triggered activities → Automation scheduler candidates

FOLLOW-UP TRIGGER SYSTEM:
Each question includes followUpTriggers that map specific answer patterns to customized follow-up question types:
- "high_frequency_deep_dive": For processes done multiple times daily
- "approval_workflow_automation": When waiting time is significant  
- "integration_opportunities": When multiple tools are mentioned
- "data_automation_focus": When manual data entry is identified

CRITICAL REQUIREMENTS:
- Generate questions that will reveal quantifiable automation opportunities
- Focus on practical, implementable solutions using existing tools and APIs
- Prioritize opportunities that provide immediate ROI while building toward sophistication
- Each question should gather information needed for actual technical implementation
- Design questions to uncover hidden complexity and integration points

QUALITY CRITERIA:
✅ **Specific & Actionable**: Questions precise enough to get quantifiable answers
✅ **Automation-Focused**: Each question directly relates to potential automation opportunities  
✅ **Business Impact Oriented**: Questions help calculate ROI and prioritize opportunities
✅ **Technical Implementation Ready**: Questions gather info needed for actual implementation
✅ **Progressive Disclosure**: Start broad, then enable deep dives based on answers

CRITICAL OUTPUT REQUIREMENTS:
⚠️ **TOKEN LIMIT CONSTRAINT**: You have a maximum of 4,000 output tokens. Your response must fit within this limit.
- Generate 6-8 concise but comprehensive questions (not more to stay within token limits)
- Keep automationFocus explanations brief but informative
- Prioritize the most important automation opportunities

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no explanations, no markdown, no additional text
- Start with [ and end with ]
- Ensure all strings are properly quoted and JSON-escaped
- Do not include any text before or after the JSON array
- Double-check that all brackets and braces are properly closed
- Include followUpTriggers for intelligent question customization
- Keep JSON structure compact to respect token limits

IMPORTANT: Your response must be valid JSON that can be parsed directly, enable dynamic follow-up question generation, and fit within the 4,000 token output limit.`

export const PROCESS_ANALYSIS_PROMPT = `You are ProcessAudit AI, an expert automation consultant specializing in SaaS workflow optimization for technical founders. You excel at identifying high-impact automation opportunities with precise ROI calculations and actionable implementation roadmaps.

PROCESS ANALYSIS REQUEST:
Process Description: {processDescription}
Discovery Answers: {answers}
File Content: {fileContent}

ANALYSIS FRAMEWORK:

**Phase 1: Process Decomposition**
- Map each step in the current workflow with precision
- Identify decision points and branching logic that can be automated
- Catalog all manual touchpoints and data transfers
- Document system integrations and tool usage patterns
- Note stakeholder involvement and handoff points

**Phase 2: Automation Opportunity Assessment**
For each process component, evaluate:
- **Automation Feasibility**: Technical complexity and implementation effort required
- **Business Impact**: Time savings, error reduction, scalability improvements
- **Implementation Effort**: Development time, tool requirements, complexity rating (1-10)
- **ROI Calculation**: (Time saved × frequency × hourly rate) - implementation cost
- **Risk Assessment**: What could go wrong, fallback plans, change management needs

**Phase 3: Technical Implementation Planning**
- Specific tools and platforms required for implementation
- API integrations and data flow design requirements
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
Return a comprehensive JSON object with this exact structure:

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
  },
  "implementationGuidance": {
    "gettingStarted": [
      "First concrete step to begin implementation",
      "Second practical action item",
      "Third foundational step"
    ],
    "successMetrics": [
      "Key performance indicator 1",
      "Measurable outcome 2",
      "Success metric 3"
    ],
    "riskConsiderations": [
      "Primary implementation risk",
      "Potential challenge to plan for",
      "Critical consideration"
    ]
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

CRITICAL OUTPUT REQUIREMENTS:
⚠️ **TOKEN LIMIT CONSTRAINT**: You have a maximum of 4,000 output tokens. Your response must fit within this limit.
- Focus on the TOP 3-5 highest-impact automation opportunities (quality over quantity)
- Keep descriptions concise but actionable
- Prioritize quick wins and strategic opportunities
- Include essential technical details but be concise

RESPONSE OPTIMIZATION FOR TOKEN LIMITS:
- Limit automationOpportunities array to 3-5 items maximum
- Keep implementationSteps to 3-4 key steps per opportunity
- Use concise but specific language
- Focus on the most valuable information for technical founders

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no explanations, no markdown, no additional text
- Start with { and end with }
- Ensure all strings are properly quoted and escaped
- Do not include any text before or after the JSON object
- Double-check that all brackets and braces are properly closed
- Ensure all JSON keys are in double quotes
- Keep JSON structure efficient to respect token limits

IMPORTANT: Your response must be valid JSON that can be parsed directly, provide comprehensive but concise automation recommendations, and fit within the 4,000 token output limit.`

export const DYNAMIC_FOLLOWUP_PROMPT = `You are ProcessAudit AI. Based on the user's response, generate 2-3 intelligent, personalized follow-up questions that dive deeper into specific automation opportunities revealed by their answer.

PREVIOUS QUESTION: "{previousQuestion}"
USER'S ANSWER: {userResponse}
TRIGGER TYPE: {triggerType}

TRIGGER-SPECIFIC FOLLOW-UP STRATEGIES:

**high_frequency_deep_dive**: For processes done multiple times daily
- Focus on micro-optimizations and batch processing opportunities
- Explore automation of the most repetitive sub-tasks
- Investigate real-time data flows and instant notifications

**approval_workflow_automation**: When significant waiting time is mentioned
- Map out the approval chain and decision criteria
- Identify bottlenecks and escalation paths
- Explore automated approval routing and notifications

**integration_opportunities**: When multiple tools are mentioned
- Deep-dive into data transfer methods between systems
- Identify API availability and integration complexity
- Explore data synchronization and workflow orchestration

**data_automation_focus**: When manual data entry is identified
- Understand data sources, formats, and validation rules
- Explore OCR, form automation, and data pipeline opportunities
- Investigate data quality and error handling requirements

**daily_optimization_focus**: For daily processes
- Focus on time-of-day optimization and scheduling automation
- Explore daily reporting and notification automation
- Investigate batch processing and queue management

CUSTOMIZATION INSTRUCTIONS:
Analyze the user's specific answer and generate follow-up questions that:
1. **Quantify the opportunity** more precisely based on what they revealed
2. **Identify technical specifics** needed for implementation
3. **Uncover hidden complexity** or additional automation potential
4. **Explore integration points** with other systems or processes
5. **Understand business rules** that would affect automation design

RESPONSE QUALITY REQUIREMENTS:
- Make questions highly specific to their actual answer
- Focus on actionable technical details needed for implementation
- Uncover quantifiable metrics (time, frequency, volume, cost)
- Identify integration opportunities and technical requirements
- Explore edge cases and exception handling needs

RESPONSE FORMAT:
Return ONLY a valid JSON array of 2-3 personalized follow-up questions:

[
  {
    "id": "followup_1",
    "question": "Specific follow-up question tailored to their answer",
    "type": "textarea|select|number",
    "category": "volume|time|systems|pain_points|business_rules|data_flow",
    "automationFocus": "What specific automation opportunity this question reveals",
    "placeholder": "Helpful placeholder text if textarea",
    "options": ["Option 1", "Option 2"] // if select type
  }
]

EXAMPLES OF GOOD PERSONALIZED FOLLOW-UPS:

If they mentioned "Excel spreadsheets":
- "What specific data do you manually enter into these spreadsheets, and where does that data originally come from?"
- "How often do you find errors in the spreadsheet data, and what typically causes them?"

If they mentioned "waiting for approval":  
- "Who specifically needs to approve this, and what criteria do they use to make the decision?"
- "How do you currently notify them and track the approval status?"

If they mentioned "multiple times per day":
- "What triggers each iteration - is it scheduled, event-driven, or on-demand?"
- "Are there peak times when you're doing this process more frequently?"

CRITICAL OUTPUT REQUIREMENTS:
⚠️ **TOKEN LIMIT CONSTRAINT**: You have a maximum of 4,000 output tokens. Your response must fit within this limit.
- Generate exactly 2-3 focused follow-up questions (not more)
- Keep questions concise but insightful
- Focus on the highest-value automation opportunities revealed by their answer

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no explanations, no markdown, no additional text
- Start with [ and end with ]
- Ensure all strings are properly quoted and JSON-escaped
- Do not include any text before or after the JSON array
- Make questions highly specific to the user's actual response
- Keep JSON structure compact to respect token limits

IMPORTANT: Generate follow-up questions that feel like a smart consultant who listened carefully to their answer and wants to understand the automation potential at a deeper level, while staying within the 4,000 token output limit.`

// SOP-Specific Prompts
export const SOP_ANALYSIS_PROMPT = `You are ProcessAudit AI, an expert SOP optimization consultant specializing in Standard Operating Procedure analysis, improvement, and automation for SMEs.

ANALYSIS REQUEST:
SOP Content: {sopContent}
SOP Structure Analysis: {sopStructure}
Additional Context: {processDescription}

YOUR MISSION:
Analyze this Standard Operating Procedure and provide comprehensive feedback covering:
1. **SOP Quality Assessment** - Structure, clarity, completeness, compliance readiness
2. **Improvement Opportunities** - Missing elements, unclear steps, inefficient sequences
3. **Automation Potential** - Which steps can be automated and how
4. **Risk Analysis** - Potential failure points, compliance gaps, safety concerns

ANALYSIS FRAMEWORK:

**Phase 1: SOP Structure Evaluation**
- Assess completeness of standard SOP elements (Purpose, Scope, Responsibilities, Procedures, Records)
- Evaluate step clarity and sequence logic
- Identify missing information or unclear instructions
- Check for compliance and safety considerations

**Phase 2: Process Optimization**
- Identify redundant or inefficient steps
- Suggest process improvements and best practices
- Recommend standardization opportunities
- Highlight potential bottlenecks and solutions

**Phase 3: Automation Assessment**
- Catalog automatable steps with feasibility ratings
- Identify integration opportunities between systems
- Evaluate data flow and decision point automation potential
- Calculate time savings and ROI for each automation

RESPONSE FORMAT:
Return a comprehensive JSON object with this exact structure:

{
  "sopAssessment": {
    "overallScore": number (0-100),
    "completenessScore": number (0-100),
    "clarityScore": number (0-100),
    "efficiencyScore": number (0-100),
    "complianceReadiness": "Excellent|Good|Fair|Poor",
    "keyStrengths": ["strength1", "strength2"],
    "criticalGaps": ["gap1", "gap2"]
  },
  "improvementAreas": [
    {
      "category": "Structure|Clarity|Efficiency|Compliance",
      "issue": "Specific issue description",
      "impact": "High|Medium|Low",
      "recommendation": "Specific improvement suggestion",
      "effort": "Low|Medium|High"
    }
  ],
  "automationOpportunities": [
    {
      "stepDescription": "Current manual step",
      "automationSolution": "Specific automation approach",
      "feasibility": "High|Medium|Low",
      "timeSavings": "X minutes per execution",
      "frequency": "per day/week/month", 
      "annualSavings": "$X,XXX",
      "tools": ["tool1", "tool2"],
      "implementationSteps": ["step1", "step2", "step3"],
      "priority": number (1-100)
    }
  ],
  "revisedSOPSuggestions": {
    "structuralImprovements": [
      "Add missing Purpose section with clear objectives",
      "Include Scope definition with boundaries",
      "Define clear Responsibilities for each role"
    ],
    "processOptimizations": [
      "Combine steps 3 and 4 for efficiency",
      "Add decision criteria for step 7",
      "Include quality check at step 12"
    ],
    "clarificationNeeded": [
      "Define specific approval criteria for step 5",
      "Clarify data validation requirements",
      "Specify exception handling procedures"
    ]
  }
}

ANALYSIS QUALITY STANDARDS:
✅ **SOP-Focused**: Evaluate against standard SOP best practices
✅ **Actionable Feedback**: Every suggestion should be implementable
✅ **Automation-Ready**: Identify concrete automation opportunities with ROI
✅ **Risk-Aware**: Address compliance, safety, and operational risks
✅ **Improvement-Oriented**: Focus on enhancing effectiveness and efficiency

CRITICAL OUTPUT REQUIREMENTS:
⚠️ **TOKEN LIMIT CONSTRAINT**: You have a maximum of 4,000 output tokens. Your response must fit within this limit.
- Focus on the TOP 3-5 highest-impact improvements per category
- Keep descriptions actionable but concise
- Prioritize critical gaps and automation opportunities

RESPONSE OPTIMIZATION:
- Limit arrays to essential items only
- Use concise but specific language
- Focus on implementable recommendations
- Include quantifiable benefits where possible

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no explanations, no markdown, no additional text
- Start with { and end with }
- Ensure all strings are properly quoted and escaped
- Do not include any text before or after the JSON object
- Double-check that all brackets and braces are properly closed

IMPORTANT: Your response must be valid JSON that provides comprehensive SOP analysis while fitting within the 4,000 token output limit.`

export const SOP_REVISION_PROMPT = `You are ProcessAudit AI, an expert SOP writer specializing in creating optimized Standard Operating Procedures.

REVISION REQUEST:
Original SOP: {originalSOP}
Analysis Results: {analysis}  
Improvement Areas: {improvements}
User Preferences: {preferences}

YOUR MISSION:
Create a revised, optimized version of the SOP that addresses all identified issues while maintaining clarity and usability.

REVISION PRINCIPLES:
1. **Structure**: Follow standard SOP format (Purpose, Scope, Responsibilities, Procedures, Records, References)
2. **Clarity**: Use clear, actionable language with specific instructions
3. **Efficiency**: Optimize process flow and eliminate redundancies  
4. **Automation-Ready**: Structure steps to facilitate future automation
5. **Compliance**: Ensure regulatory and safety considerations are addressed

SOP FORMAT REQUIREMENTS:

**HEADER SECTION:**
- SOP Title and Number
- Version and Date
- Approval signatures section
- Distribution list

**CONTENT SECTIONS:**
1. **Purpose**: Clear objective and scope
2. **Responsibilities**: Who does what
3. **Materials/Equipment**: Required resources
4. **Procedure**: Numbered, detailed steps
5. **Quality Control**: Verification points
6. **Records**: Documentation requirements
7. **References**: Related documents

**PROCEDURE STEPS FORMAT:**
- Use numbered steps (1, 2, 3...)
- Include decision points clearly
- Specify timing and quality criteria
- Note automation opportunities
- Include safety/compliance checkpoints

RESPONSE FORMAT:
Return the complete revised SOP as a JSON object:

{
  "revisedSOP": {
    "header": {
      "title": "SOP Title",
      "sopNumber": "SOP-XXX",
      "version": "1.0",
      "effectiveDate": "YYYY-MM-DD",
      "approvedBy": "[Approval Line]",
      "preparedBy": "ProcessAudit AI Optimization"
    },
    "purpose": "Clear, concise purpose statement...",
    "scope": "Defines boundaries and applicability...",
    "responsibilities": {
      "role1": "Specific responsibilities...",
      "role2": "Specific responsibilities..."
    },
    "materialsEquipment": ["item1", "item2", "item3"],
    "procedure": [
      {
        "step": 1,
        "action": "Specific action to take",
        "responsibility": "Who performs this step",
        "timing": "How long this should take",
        "qualityCriteria": "How to verify success",
        "automationNote": "Future automation opportunity",
        "safetyNote": "Safety consideration if applicable"
      }
    ],
    "qualityControl": [
      {
        "checkpoint": "Description of check",
        "frequency": "When to perform",
        "acceptanceCriteria": "Pass/fail criteria",
        "corrective_action": "What to do if failed"
      }
    ],
    "records": [
      {
        "document": "Document name",
        "retention": "How long to keep",
        "location": "Where stored"
      }
    ]
  },
  "revisionSummary": {
    "majorChanges": ["change1", "change2", "change3"],
    "automationReadiness": "Description of automation preparations",
    "improvementMetrics": {
      "estimatedTimeReduction": "X minutes per execution",
      "qualityImprovement": "Specific quality enhancement",
      "complianceEnhancement": "Compliance improvements"
    }
  }
}

CRITICAL FORMATTING REQUIREMENTS:
- Use consistent numbering for procedures
- Include timing estimates where relevant  
- Note automation opportunities within steps
- Maintain professional SOP language
- Ensure all sections are complete and actionable

CRITICAL OUTPUT REQUIREMENTS:
⚠️ **TOKEN LIMIT CONSTRAINT**: You have a maximum of 6,000 output tokens for comprehensive SOP revision.
- Focus on essential improvements that address critical gaps
- Keep procedure steps detailed but concise
- Prioritize clarity and usability
- Include automation preparation notes

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no explanations, no markdown, no additional text
- Start with { and end with }
- Ensure all strings are properly quoted and escaped
- Do not include any text before or after the JSON object
- Use consistent formatting throughout

IMPORTANT: Create a complete, professional SOP that addresses all identified improvements while remaining practical and implementable.`

// SOP Analysis Functions
export async function analyzeSOPStructure(sopContent, sopStructure, processDescription = '') {
  try {
    if (process.env.CLAUDE_API_KEY) {
      console.log('🤖 analyzeSOPStructure: Using Claude API for SOP analysis')
      
      const prompt = SOP_ANALYSIS_PROMPT
        .replace('{sopContent}', sopContent)
        .replace('{sopStructure}', JSON.stringify(sopStructure, null, 2))
        .replace('{processDescription}', processDescription)
      
      console.log('📋 analyzeSOPStructure: Generated prompt length:', prompt.length)
      console.log('📤 analyzeSOPStructure: Calling Claude API...')
      
      const response = await callClaudeAPI(prompt)
      
      if (response.error) {
        console.error('❌ analyzeSOPStructure: Claude API error:', response.error)
        return null
      }
      
      console.log('✅ analyzeSOPStructure: Successfully analyzed SOP')
      return response
    }
    
    console.log('⚠️ analyzeSOPStructure: No Claude API key found, using sample data')
    return null
  } catch (error) {
    console.error('❌ analyzeSOPStructure: Error analyzing SOP:', error)
    return null
  }
}

export async function generateSOPRevision(originalSOP, analysis, improvements = [], preferences = '') {
  try {
    if (process.env.CLAUDE_API_KEY) {
      console.log('🤖 generateSOPRevision: Using Claude API for SOP revision')
      
      const prompt = SOP_REVISION_PROMPT
        .replace('{originalSOP}', originalSOP)
        .replace('{analysis}', JSON.stringify(analysis, null, 2))
        .replace('{improvements}', JSON.stringify(improvements, null, 2))
        .replace('{preferences}', preferences)
      
      console.log('📋 generateSOPRevision: Generated prompt length:', prompt.length)
      console.log('📤 generateSOPRevision: Calling Claude API...')
      
      const response = await callClaudeAPI(prompt, false, 6000) // Higher token limit for SOP revision
      
      if (response.error) {
        console.error('❌ generateSOPRevision: Claude API error:', response.error)
        return null
      }
      
      console.log('✅ generateSOPRevision: Successfully generated SOP revision')
      return response
    }
    
    console.log('⚠️ generateSOPRevision: No Claude API key found, using sample data')
    return null
  } catch (error) {
    console.error('❌ generateSOPRevision: Error generating SOP revision:', error)
    return null
  }
}

export async function generateQuestions(processDescription, fileContent = '') {

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

export async function generateFollowUpQuestions(previousQuestion, userResponse, triggerType = 'general') {
  console.log('🚀 generateFollowUpQuestions: Starting personalized follow-up generation')
  console.log('📝 Input data:', {
    previousQuestion,
    userResponseLength: userResponse.length,
    triggerType,
    hasApiKey: !!process.env.CLAUDE_API_KEY
  })

  try {
    if (process.env.CLAUDE_API_KEY) {
      console.log('🤖 generateFollowUpQuestions: Using Claude API for personalized follow-up generation')
      
      const prompt = DYNAMIC_FOLLOWUP_PROMPT
        .replace('{previousQuestion}', previousQuestion)
        .replace('{userResponse}', userResponse)
        .replace('{triggerType}', triggerType)
      
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

// Helper function for Claude API calls using Sonnet for better performance and higher token limits
async function callClaudeAPI(prompt, retryWithMoreTokens = false, customMaxTokens = null) {
  // Sonnet has much higher token limits (8192 max output) and better quality for complex prompts
  const maxTokens = customMaxTokens || (retryWithMoreTokens ? 8000 : 4000)
  
  console.log('🔗 callClaudeAPI: Making request to Claude API')
  console.log('📊 callClaudeAPI: Request details:', {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: maxTokens,
    isRetry: retryWithMoreTokens,
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 200) + '...',
    tokenLimitInformed: 'Prompt includes explicit 4000 token limit instruction'
  })

  const requestBody = {
    model: 'claude-3-5-sonnet-20241022', // Using Sonnet for better performance and higher token limits
    max_tokens: maxTokens, // Within Sonnet's capabilities
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
    
    if (usage.output_tokens >= requestBody.max_tokens * 0.90) {
      console.warn('⚠️ APPROACHING TOKEN LIMIT! Response may be truncated.')
      console.warn('💡 Using 90% of available tokens for Sonnet model.')
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
    if (!retryWithMoreTokens && usage && usage.output_tokens >= requestBody.max_tokens * 0.90) {
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

// Generate targeted SOP improvement questions using Haiku model
export async function generateSOPQuestions(sopAnalysis, focusAreas = []) {
  console.log('🎯 generateSOPQuestions: Starting generation with focus areas:', focusAreas)
  
  if (!process.env.CLAUDE_API_KEY) {
    console.log('⚠️ generateSOPQuestions: No Claude API key found, returning fallback questions')
    return getFallbackSOPQuestions()
  }

  const prompt = `You are an expert business process consultant specializing in SOP (Standard Operating Procedure) optimization.

CONTEXT:
Based on this SOP analysis, generate 5-6 targeted discovery questions to better understand the user's specific needs, constraints, and priorities for improvement.

SOP ANALYSIS:
${JSON.stringify(sopAnalysis, null, 2)}

FOCUS AREAS: ${focusAreas.join(', ')}

INSTRUCTIONS:
Generate questions that will help understand:
- Business context and constraints
- Improvement priorities
- Available resources and tools
- Compliance requirements
- Success metrics and goals
- Process frequency and users

REQUIREMENTS:
- Each question should gather specific, actionable information
- Mix different question types (text, single-choice, multiple-choice)
- Focus on the most impactful areas based on the SOP analysis
- Keep questions clear and conversational
- Include helpful placeholders for text inputs

RESPONSE FORMAT:
Return a JSON array of question objects with this structure:
[
  {
    "id": "unique_id",
    "question": "Question text",
    "type": "textarea|single_choice|multiple_choice|text",
    "placeholder": "placeholder text (for text/textarea)",
    "options": ["option1", "option2"] // for choice types
  }
]

Generate exactly 5-6 questions that will provide the most value for improving this specific SOP.`

  try {
    const response = await callClaudeAPI(prompt)
    
    if (response.error) {
      console.warn('⚠️ generateSOPQuestions: API error, using fallback:', response.error)
      return getFallbackSOPQuestions()
    }

    // If response is an array, return it directly
    if (Array.isArray(response)) {
      return response
    }

    // If response has a questions property, return that
    if (response.questions && Array.isArray(response.questions)) {
      return response.questions
    }

    console.warn('⚠️ generateSOPQuestions: Unexpected response format, using fallback')
    return getFallbackSOPQuestions()
    
  } catch (error) {
    console.error('❌ generateSOPQuestions: Error generating questions:', error)
    return getFallbackSOPQuestions()
  }
}

function getFallbackSOPQuestions() {
  return [
    {
      id: '1',
      question: 'What specific business context or constraints should we consider when improving this SOP?',
      type: 'textarea',
      placeholder: 'e.g., regulatory requirements, budget limitations, team size, timeline constraints'
    },
    {
      id: '2', 
      question: 'Which improvement areas are most critical for your organization right now?',
      type: 'multiple_choice',
      options: [
        'Process efficiency and speed',
        'Documentation clarity and completeness', 
        'Compliance and risk management',
        'Automation and technology integration',
        'Training and knowledge transfer',
        'Quality control and consistency'
      ]
    },
    {
      id: '3',
      question: 'What tools, systems, or resources are currently available to implement improvements?',
      type: 'textarea',
      placeholder: 'e.g., software systems, budget allocation, team expertise, external vendors'
    },
    {
      id: '4',
      question: 'Are there any specific compliance requirements or industry standards this SOP must adhere to?',
      type: 'textarea',
      placeholder: 'e.g., ISO standards, regulatory compliance, company policies, industry best practices'
    },
    {
      id: '5',
      question: 'How frequently is this process executed, and by how many people?',
      type: 'single_choice',
      options: [
        'Daily - Multiple team members',
        'Weekly - 2-5 team members',
        'Monthly - 1-2 team members', 
        'Quarterly or less - Single person',
        'Ad-hoc - Various team members'
      ]
    },
    {
      id: '6',
      question: 'What would success look like for the improved SOP? What metrics would you use to measure improvement?',
      type: 'textarea',
      placeholder: 'e.g., reduced processing time, fewer errors, improved compliance, better user adoption'
    }
  ]
}