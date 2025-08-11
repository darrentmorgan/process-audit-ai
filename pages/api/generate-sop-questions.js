import { generateSOPQuestions } from '../../utils/aiPrompts'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sopAnalysis, focusAreas = [] } = req.body

  if (!sopAnalysis) {
    return res.status(400).json({ error: 'SOP analysis is required' })
  }

  try {
    console.log('📝 Generating SOP discovery questions')
    
    const questions = await generateSOPQuestions(sopAnalysis, focusAreas)
    
    console.log('✅ SOP questions generated successfully')
    
    res.status(200).json({ 
      questions,
      success: true 
    })

  } catch (error) {
    console.error('❌ Error generating SOP questions:', error)
    
    // Return fallback questions if AI generation fails
    const fallbackQuestions = [
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

    res.status(200).json({ 
      questions: fallbackQuestions,
      success: true,
      fallback: true
    })
  }
}