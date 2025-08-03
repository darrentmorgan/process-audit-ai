import { generateQuestions } from '../../utils/aiPrompts'

export default async function handler(req, res) {
  console.log('🎯 API /generate-questions: Request received')
  
  if (req.method !== 'POST') {
    console.log('❌ API /generate-questions: Invalid method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { processDescription, fileContent } = req.body
    
    console.log('📋 API /generate-questions: Request data:', {
      hasProcessDescription: !!processDescription,
      processDescriptionLength: processDescription?.length || 0,
      hasFileContent: !!fileContent,
      fileContentLength: fileContent?.length || 0
    })

    if (!processDescription && !fileContent) {
      console.log('❌ API /generate-questions: No input provided')
      return res.status(400).json({ error: 'Process description or file content is required' })
    }

    // Combine process description and file content
    const fullContext = [processDescription, fileContent].filter(Boolean).join('\n\n')
    console.log('📝 API /generate-questions: Combined context length:', fullContext.length)

    // For now, return sample questions until AI integration is complete
    const sampleQuestions = [
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

    // Try to generate questions using Claude API first
    console.log('🤖 API /generate-questions: Attempting AI question generation')
    const aiQuestions = await generateQuestions(fullContext)
    
    if (aiQuestions) {
      console.log('✅ API /generate-questions: AI generated questions:', {
        count: aiQuestions.length,
        types: aiQuestions.map(q => q.type),
        categories: aiQuestions.map(q => q.category)
      })
      res.status(200).json({ questions: aiQuestions })
    } else {
      console.log('⚠️ API /generate-questions: AI unavailable, using sample questions')
      console.log('📋 Returning sample questions:', sampleQuestions.length)
      res.status(200).json({ questions: sampleQuestions })
    }
  } catch (error) {
    console.error('Error generating questions:', error)
    res.status(500).json({ error: 'Failed to generate questions' })
  }
}