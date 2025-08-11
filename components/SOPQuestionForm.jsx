import React, { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react'

const SOPQuestionForm = ({ sopAnalysis, onComplete, onBack }) => {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [hasLoadedQuestions, setHasLoadedQuestions] = useState(false)

  // Generate SOP discovery questions using Haiku
  const generateSOPQuestions = async () => {
    if (hasLoadedQuestions) return

    setIsGeneratingQuestions(true)
    try {
      const response = await fetch('/api/generate-sop-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sopAnalysis: sopAnalysis,
          focusAreas: ['improvements', 'context', 'constraints', 'priorities']
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate questions')
      }

      const data = await response.json()
      setQuestions(data.questions || [])
      setHasLoadedQuestions(true)
    } catch (error) {
      console.error('Error generating SOP questions:', error)
      // Fallback questions if API fails
      setQuestions([
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
      ])
      setHasLoadedQuestions(true)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  // Load questions on component mount
  useEffect(() => {
    generateSOPQuestions()
  }, [])

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // Pass answers to parent component
      await onComplete(answers)
    } finally {
      setIsLoading(false)
    }
  }

  const isCurrentAnswered = () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return false
    
    const answer = answers[currentQuestion.id]
    return answer && (typeof answer === 'string' ? answer.trim() : answer.length > 0)
  }

  const allAnswered = () => {
    return questions.every(q => {
      const answer = answers[q.id]
      return answer && (typeof answer === 'string' ? answer.trim() : answer.length > 0)
    })
  }

  if (isGeneratingQuestions) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <div className="animate-pulse">
          <HelpCircle className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Generating Discovery Questions</h2>
        <p className="text-gray-600">
          Creating targeted questions to better understand your SOP improvement needs...
        </p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Generate Questions</h2>
        <p className="text-gray-600 mb-6">
          We encountered an issue generating discovery questions. You can proceed directly to the improvement recommendations.
        </p>
        <div className="flex justify-between">
          <button onClick={onBack} className="btn-secondary">
            Go Back
          </button>
          <button onClick={() => onComplete({})} className="btn-primary">
            Skip to Improvements
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          SOP Discovery Questions
        </h2>
        <p className="text-xl text-blue-100">
          Help us understand your specific needs and context to provide better improvement recommendations
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-blue-100 mb-2">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-blue-200 bg-opacity-20 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="card mb-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {currentQuestion.question}
          </h3>

          {/* Single Choice */}
          {currentQuestion.type === 'single_choice' && (
            <div className="space-y-2">
              {currentQuestion.options?.map((option, index) => (
                <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="mr-3"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Multiple Choice */}
          {currentQuestion.type === 'multiple_choice' && (
            <div className="space-y-2">
              {currentQuestion.options?.map((option, index) => (
                <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    value={option}
                    checked={answers[currentQuestion.id]?.includes(option) || false}
                    onChange={(e) => {
                      const currentAnswers = answers[currentQuestion.id] || []
                      if (e.target.checked) {
                        handleAnswerChange(currentQuestion.id, [...currentAnswers, option])
                      } else {
                        handleAnswerChange(currentQuestion.id, currentAnswers.filter(a => a !== option))
                      }
                    }}
                    className="mr-3"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Textarea */}
          {currentQuestion.type === 'textarea' && (
            <textarea
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}

          {/* Text Input */}
          {currentQuestion.type === 'text' && (
            <input
              type="text"
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={currentQuestionIndex === 0 ? onBack : handlePrevious}
          className="btn-secondary flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentQuestionIndex === 0 ? 'Go Back' : 'Previous'}
        </button>

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!isCurrentAnswered()}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={!allAnswered() || isLoading}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                Continue to Improvements
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default SOPQuestionForm