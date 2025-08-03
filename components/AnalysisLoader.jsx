import { useState, useEffect } from 'react'
import { Brain, CheckCircle, Clock, Zap } from 'lucide-react'

const AnalysisLoader = ({ processData, onComplete }) => {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(true)

  const analysisPhases = [
    {
      id: 'processing',
      title: 'Processing Your Input',
      description: 'Analyzing process description and uploaded documents',
      icon: Brain,
      duration: 1000
    },
    {
      id: 'questions',
      title: 'Evaluating Responses',
      description: 'Understanding your workflow patterns and requirements',
      icon: CheckCircle,
      duration: 1500
    },
    {
      id: 'identifying',
      title: 'Identifying Opportunities',
      description: 'Finding automation possibilities and quick wins',
      icon: Zap,
      duration: 2000
    },
    {
      id: 'calculating',
      title: 'Calculating ROI',
      description: 'Estimating time savings and implementation costs',
      icon: Clock,
      duration: 1500
    }
  ]

  useEffect(() => {
    const runAnalysis = async () => {
      // Show each phase progressively
      for (let i = 0; i < analysisPhases.length; i++) {
        setCurrentPhase(i)
        await new Promise(resolve => 
          setTimeout(resolve, analysisPhases[i].duration)
        )
      }

      // Call the actual analysis API
      try {
        const response = await fetch('/api/analyze-process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            processDescription: processData.processDescription,
            fileContent: processData.fileContent,
            answers: processData.answers
          }),
        })

        if (!response.ok) {
          throw new Error('Analysis failed')
        }

        const result = await response.json()
        setIsAnalyzing(false)
        
        // Small delay before showing results
        setTimeout(() => {
          onComplete(result.report)
        }, 500)
      } catch (error) {
        console.error('Analysis error:', error)
        setIsAnalyzing(false)
        // Handle error case
      }
    }

    runAnalysis()
  }, [processData, onComplete])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center">
        <div className="mb-8">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            AI Analysis in Progress
          </h2>
          <p className="text-lg text-gray-600">
            Our AI is analyzing your process to identify automation opportunities
          </p>
        </div>

        {/* Analysis Phases */}
        <div className="space-y-4 mb-8">
          {analysisPhases.map((phase, index) => {
            const isCompleted = index < currentPhase
            const isCurrent = index === currentPhase
            const isUpcoming = index > currentPhase
            const Icon = phase.icon

            return (
              <div
                key={phase.id}
                className={`
                  flex items-center p-4 rounded-lg transition-all duration-300
                  ${isCurrent 
                    ? 'bg-blue-50 border-2 border-primary' 
                    : isCompleted 
                      ? 'bg-green-50 border-2 border-secondary' 
                      : 'bg-gray-50 border-2 border-gray-200'
                  }
                `}
              >
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full mr-4 transition-colors duration-300
                    ${isCurrent 
                      ? 'bg-primary text-white' 
                      : isCompleted 
                        ? 'bg-secondary text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }
                  `}
                >
                  {isCurrent ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <div className="text-left flex-1">
                  <h3
                    className={`
                      font-semibold transition-colors duration-300
                      ${isCurrent || isCompleted ? 'text-gray-900' : 'text-gray-500'}
                    `}
                  >
                    {phase.title}
                  </h3>
                  <p
                    className={`
                      text-sm transition-colors duration-300
                      ${isCurrent ? 'text-gray-700' : isCompleted ? 'text-gray-600' : 'text-gray-400'}
                    `}
                  >
                    {phase.description}
                  </p>
                </div>

                {isCompleted && (
                  <CheckCircle className="w-6 h-6 text-secondary ml-2" />
                )}
              </div>
            )
          })}
        </div>

        {/* Progress Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            What We're Analyzing
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Process complexity and steps
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Time and resource requirements
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Automation potential
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Implementation priorities
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              ROI calculations
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Recommended tools
            </div>
          </div>
        </div>

        {!isAnalyzing && (
          <div className="mt-6 animate-fade-in">
            <div className="flex items-center justify-center text-secondary mb-2">
              <CheckCircle className="w-6 h-6 mr-2" />
              <span className="font-semibold">Analysis Complete!</span>
            </div>
            <p className="text-gray-600">
              Preparing your personalized automation roadmap...
            </p>
          </div>
        )}
      </div>

      {/* Fun facts while waiting */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-80 rounded-full text-sm text-gray-600">
          <Zap className="w-4 h-4 mr-2 text-yellow-500" />
          <span>
            Did you know? The average business process can be automated by 20-50%
          </span>
        </div>
      </div>
    </div>
  )
}

export default AnalysisLoader