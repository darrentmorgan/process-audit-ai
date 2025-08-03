import { useState } from 'react'
import StepIndicator from './StepIndicator'
import ProcessInput from './ProcessInput'
import QuestionForm from './QuestionForm'
import AnalysisLoader from './AnalysisLoader'
import AuditReport from './AuditReport'
import UserMenu from './UserMenu'
import AuthModal from './AuthModal'
import SavedReportsModal from './SavedReportsModal'
import DatabaseCleanup from './DatabaseCleanup'
import Logo from './Logo'
import { Zap, Target, BarChart3 } from 'lucide-react'

const ProcessAuditApp = ({ isDemoMode = false }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [processData, setProcessData] = useState({
    processDescription: '',
    fileContent: '',
    questions: [],
    answers: {},
    auditReport: null
  })
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'signin' })
  const [savedReportsModal, setSavedReportsModal] = useState(false)
  const [cleanupModal, setCleanupModal] = useState(false)

  const steps = [
    {
      id: 'input',
      title: 'Process Input',
      description: 'Describe your process'
    },
    {
      id: 'questions',
      title: 'Discovery',
      description: 'Answer targeted questions'
    },
    {
      id: 'analysis',
      title: 'Analysis',
      description: 'AI processes your data'
    },
    {
      id: 'report',
      title: 'Report',
      description: 'Get your audit results'
    }
  ]

  const handleProcessInput = async (inputData) => {
    console.log('🎯 ProcessAuditApp: Received input data', {
      processDescriptionLength: inputData.processDescription.length,
      hasFileContent: !!inputData.fileContent,
      fileContentLength: inputData.fileContent?.length || 0
    })

    setProcessData(prev => ({
      ...prev,
      processDescription: inputData.processDescription,
      fileContent: inputData.fileContent
    }))

    // Generate questions based on the input
    try {
      console.log('🔄 ProcessAuditApp: Starting question generation API call')
      console.log('📤 Sending to /api/generate-questions:', {
        processDescription: inputData.processDescription,
        fileContent: inputData.fileContent ? `${inputData.fileContent.length} chars` : 'none'
      })

      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processDescription: inputData.processDescription,
          fileContent: inputData.fileContent
        }),
      })

      console.log('📥 Question generation response status:', response.status)

      if (!response.ok) {
        throw new Error(`Failed to generate questions: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Question generation successful:', {
        questionCount: result.questions?.length || 0,
        questions: result.questions?.map(q => q.question) || []
      })

      setProcessData(prev => ({
        ...prev,
        questions: result.questions
      }))
      setCurrentStep(2)
    } catch (error) {
      console.error('❌ ProcessAuditApp: Error generating questions:', error)
      // Handle error - could show error state
    }
  }

  const handleQuestionAnswers = (answers) => {
    setProcessData(prev => ({
      ...prev,
      answers
    }))
    setCurrentStep(3)
  }

  const handleAnalysisComplete = (report) => {
    setProcessData(prev => ({
      ...prev,
      auditReport: report
    }))
    setCurrentStep(4)
  }

  const resetAudit = () => {
    setCurrentStep(1)
    setProcessData({
      processDescription: '',
      fileContent: '',
      questions: [],
      answers: {},
      auditReport: null
    })
  }

  const openAuthModal = (mode = 'signin') => {
    console.log('🔑 ProcessAuditApp: Opening auth modal with mode:', mode)
    setAuthModal({ isOpen: true, mode })
  }

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: 'signin' })
  }

  const openSavedReports = () => {
    setSavedReportsModal(true)
  }

  const closeSavedReports = () => {
    setSavedReportsModal(false)
  }

  const loadSavedReport = (reportData) => {
    console.log('Loading saved report into app:', reportData)
    
    // Set the process data to the loaded report
    setProcessData(reportData)
    
    // Navigate to the report view (step 4)
    setCurrentStep(4)
  }

  const openCleanup = () => {
    setCleanupModal(true)
  }

  const closeCleanup = () => {
    setCleanupModal(false)
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative mb-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Logo className="w-16 h-16 text-white mr-4" color="currentColor" />
              <h1 className="text-4xl font-bold text-white">ProcessAudit AI</h1>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Discover automation opportunities in your business processes with AI-powered analysis
            </p>
          </div>
          
          {/* User Menu - positioned absolutely in top right */}
          <div className="absolute top-0 right-0">
            <UserMenu 
              onOpenAuth={openAuthModal} 
              onOpenSavedReports={openSavedReports}
              onOpenCleanup={openCleanup}
            />
          </div>
        </div>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-yellow-500 bg-opacity-90 text-yellow-900 px-6 py-3 rounded-lg mb-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Demo Mode</span>
              <span>•</span>
              <span>Try the tool freely</span>
              <span>•</span>
              <button 
                onClick={() => openAuthModal('signup')}
                className="underline font-semibold hover:no-underline"
              >
                Sign up to save your results
              </button>
            </div>
          </div>
        )}

        {/* Features Banner */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center text-white">
                <Zap className="w-8 h-8 mx-auto mb-3 text-yellow-300" />
                <h3 className="font-semibold mb-2">Quick Analysis</h3>
                <p className="text-sm text-blue-100">Get actionable insights in minutes</p>
              </div>
              <div className="text-center text-white">
                <Target className="w-8 h-8 mx-auto mb-3 text-green-300" />
                <h3 className="font-semibold mb-2">Targeted Recommendations</h3>
                <p className="text-sm text-blue-100">Prioritized by impact and effort</p>
              </div>
              <div className="text-center text-white">
                <BarChart3 className="w-8 h-8 mx-auto mb-3 text-purple-300" />
                <h3 className="font-semibold mb-2">ROI Calculations</h3>
                <p className="text-sm text-blue-100">Quantified time and cost savings</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* Main Content */}
        <div className="fade-in">
          {currentStep === 1 && (
            <ProcessInput 
              onNext={handleProcessInput}
            />
          )}

          {currentStep === 2 && (
            <QuestionForm
              questions={processData.questions}
              onComplete={handleQuestionAnswers}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <AnalysisLoader
              processData={processData}
              onComplete={handleAnalysisComplete}
            />
          )}

          {currentStep === 4 && (
            <AuditReport
              report={processData.auditReport}
              processData={processData}
              onRestart={resetAudit}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-white">
          <p className="text-sm text-blue-100">
            Powered by AI • Built for Technical Founders
          </p>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModal.isOpen}
          onClose={closeAuthModal}
          defaultMode={authModal.mode}
        />

        {/* Saved Reports Modal */}
        <SavedReportsModal
          isOpen={savedReportsModal}
          onClose={closeSavedReports}
          onLoadReport={loadSavedReport}
        />

        {/* Database Cleanup Modal */}
        <DatabaseCleanup
          isOpen={cleanupModal}
          onClose={closeCleanup}
        />
      </div>
    </div>
  )
}

export default ProcessAuditApp