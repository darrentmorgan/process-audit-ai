import { useState } from 'react'
import { ChevronLeft, HelpCircle } from 'lucide-react'

const QuestionForm = ({ questions, onComplete, onBack }) => {
  const [answers, setAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [errors, setErrors] = useState({})

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const updateAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    setErrors(prev => ({
      ...prev,
      [questionId]: ''
    }))
  }

  const validateAnswer = (question, answer) => {
    if (!answer || (typeof answer === 'string' && !answer.trim())) {
      return 'This field is required'
    }
    
    if (question.type === 'number' && (isNaN(answer) || answer < 0)) {
      return 'Please enter a valid number'
    }
    
    return ''
  }

  const handleNext = () => {
    const error = validateAnswer(currentQuestion, answers[currentQuestion.id])
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        [currentQuestion.id]: error
      }))
      return
    }

    if (isLastQuestion) {
      onComplete(answers)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const renderQuestionInput = (question) => {
    const value = answers[question.id] || ''
    const error = errors[question.id]

    switch (question.type) {
      case 'select':
        return (
          <div>
            <select
              className={`input-field ${error ? 'border-red-500' : ''}`}
              value={value}
              onChange={(e) => updateAnswer(question.id, e.target.value)}
            >
              <option value="">Select an option...</option>
              {question.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div>
            <textarea
              className={`textarea-field ${error ? 'border-red-500' : ''}`}
              rows={4}
              placeholder="Please provide details..."
              value={value}
              onChange={(e) => updateAnswer(question.id, e.target.value)}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div>
            <input
              type="number"
              className={`input-field ${error ? 'border-red-500' : ''}`}
              placeholder="Enter a number..."
              value={value}
              onChange={(e) => updateAnswer(question.id, e.target.value)}
              min="0"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        )

      default:
        return (
          <div>
            <input
              type="text"
              className={`input-field ${error ? 'border-red-500' : ''}`}
              placeholder="Enter your answer..."
              value={value}
              onChange={(e) => updateAnswer(question.id, e.target.value)}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        )
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      frequency: 'bg-blue-100 text-blue-800',
      resources: 'bg-green-100 text-green-800',
      tools: 'bg-purple-100 text-purple-800',
      pain_points: 'bg-red-100 text-red-800',
      workflow: 'bg-orange-100 text-orange-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryLabel = (category) => {
    const labels = {
      frequency: 'Frequency',
      resources: 'Resources',
      tools: 'Tools',
      pain_points: 'Pain Points',
      workflow: 'Workflow'
    }
    return labels[category] || 'General'
  }

  if (!currentQuestion) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No Questions Available
        </h2>
        <p className="text-gray-600 mb-6">
          Unable to generate questions for your process. Please try again.
        </p>
        <button onClick={onBack} className="btn-secondary">
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <HelpCircle className="w-6 h-6 text-primary mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">
              Discovery Questions
            </h2>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(currentQuestion.category)}`}>
            {getCategoryLabel(currentQuestion.category)}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="card">
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 leading-relaxed">
            {currentQuestion.question}
          </h3>
          
          {renderQuestionInput(currentQuestion)}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={currentQuestionIndex === 0 ? onBack : handlePrevious}
            className="btn-secondary flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {currentQuestionIndex === 0 ? 'Back to Process' : 'Previous'}
          </button>

          <div className="flex items-center space-x-2">
            {/* Question dots indicator */}
            <div className="flex space-x-1 mr-4">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-colors duration-200
                    ${index === currentQuestionIndex 
                      ? 'bg-primary' 
                      : index < currentQuestionIndex 
                        ? 'bg-secondary' 
                        : 'bg-gray-300'
                    }
                  `}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="btn-primary"
            >
              {isLastQuestion ? 'Start Analysis' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>

      {/* Question Summary */}
      {Object.keys(answers).length > 0 && (
        <div className="card mt-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            Your Answers ({Object.keys(answers).length} of {questions.length})
          </h4>
          <div className="space-y-2">
            {Object.entries(answers).map(([questionId, answer]) => {
              const question = questions.find(q => q.id === questionId)
              return (
                <div key={questionId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600 flex-1 pr-4">
                    {question?.question}
                  </span>
                  <span className="text-sm font-medium text-gray-900 max-w-xs text-right">
                    {typeof answer === 'string' && answer.length > 50 
                      ? `${answer.substring(0, 50)}...` 
                      : answer
                    }
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionForm