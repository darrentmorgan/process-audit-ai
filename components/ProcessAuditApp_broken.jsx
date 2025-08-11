import { useState } from 'react'
import StepIndicator from './StepIndicator'
import ProcessInput from './ProcessInput'
import QuestionForm from './QuestionForm'
import AnalysisLoader from './AnalysisLoader'
import AuditReport from './AuditReport'
import SOPFeedback from './SOPFeedback'
import SOPRevision from './SOPRevision'
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
    auditReport: null,
    // SOP-specific data
    inputType: 'process',
    sopStructure: null,
    isSOPAnalysis: false,
    sopAnalysis: null,
    sopRevision: null
  })
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'signin' })
  const [savedReportsModal, setSavedReportsModal] = useState(false)
  const [cleanupModal, setCleanupModal] = useState(false)

  // Unified workflow steps
  const getSteps = () => {
    return [
      {
        id: 'input',
        title: 'Process Input',
        description: 'Describe or upload process'
      },
      {
        id: 'analysis',
        title: 'Analysis', 
        description: 'AI processing & SOP creation'
      },
      {
        id: 'revision',
        title: 'Optimization',
        description: 'Review improvements'
      },
      {
        id: 'automations',
        title: 'Automations',
        description: 'Generate workflows'
      }
    ]
  }

  const steps = getSteps()

  const handleProcessInput = async (inputData) => {
    console.log('🎯 ProcessAuditApp: Starting unified workflow with input data', {
      processDescriptionLength: inputData.processDescription.length,
      hasFileContent: !!inputData.fileContent,
      fileContentLength: inputData.fileContent?.length || 0,
      inputType: inputData.inputType,
      isSOPAnalysis: inputData.isSOPAnalysis
    })

    // Store input data
    setProcessData(prev => ({
      ...prev,
      processDescription: inputData.processDescription,
      fileContent: inputData.fileContent,
      inputType: inputData.inputType,
      sopStructure: inputData.sopStructure,
      isSOPAnalysis: inputData.isSOPAnalysis
    }))

    // Move to analysis step (step 2) regardless of input type
    setCurrentStep(2)
    
    // Start unified analysis workflow
    await handleUnifiedAnalysis(inputData)
  }

  // New unified analysis handler
  const handleUnifiedAnalysis = async (inputData) => {
    console.log('🔄 ProcessAuditApp: Starting unified analysis workflow')

    // If it's already an SOP, analyze it directly
    if (inputData.isSOPAnalysis) {
      await handleSOPAnalysis(inputData)
      return
    }

    // If it's a general process, create SOP from it
    await handleProcessToSOPConversion(inputData)
  }

  // Convert general process to SOP analysis
  const handleProcessToSOPConversion = async (inputData) => {
    console.log('🔄 Converting general process to SOP analysis')
    
    // For now, let's use the existing SOP analysis API with the process data
    const sopContent = inputData.fileContent || inputData.processDescription
    
    try {
      const response = await fetch('/api/analyze-sop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sopContent: sopContent,
          sopStructure: { isSOP: false, confidence: 50 }, // Indicate it's not a formal SOP
          processDescription: inputData.processDescription
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze process: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Process to SOP analysis successful')

      setProcessData(prev => ({
        ...prev,
        sopAnalysis: result.analysis,
        isSOPAnalysis: true // Now treat it as SOP workflow
      }))

      // Move to revision step
      setCurrentStep(3)

    } catch (error) {
      console.error('❌ Error in process to SOP conversion:', error)
      // Handle error gracefully
    }
  }

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

  // SOP workflow handlers
  const handleSOPAnalysis = async (inputData) => {
    try {
      console.log('📤 ProcessAuditApp: Calling SOP analysis API')
      console.log('🔍 Input data debug:', {
        fileContentLength: inputData.fileContent?.length || 'undefined',
        fileContentPreview: inputData.fileContent?.substring(0, 100) || 'No file content',
        processDescriptionLength: inputData.processDescription?.length || 'undefined',
        processDescriptionPreview: inputData.processDescription?.substring(0, 100) || 'No process description',
        sopStructure: inputData.sopStructure,
        inputType: inputData.inputType,
        isSOPAnalysis: inputData.isSOPAnalysis
      })

      const sopContent = inputData.fileContent || inputData.processDescription
      console.log('📋 Final sopContent for API:', {
        length: sopContent?.length || 'undefined',
        preview: sopContent?.substring(0, 100) || 'No content'
      })

      const response = await fetch('/api/analyze-sop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sopContent: inputData.fileContent || inputData.processDescription,
          sopStructure: inputData.sopStructure,
          processDescription: inputData.processDescription
        }),
      })

      if (!response.ok) {
        throw new Error(`SOP analysis failed: ${response.status}`)
      }

      const analysis = await response.json()
      console.log('✅ ProcessAuditApp: SOP analysis completed')

      setProcessData(prev => ({
        ...prev,
        sopAnalysis: analysis
      }))
      setCurrentStep(2) // Move to feedback step
    } catch (error) {
      console.error('❌ ProcessAuditApp: Error analyzing SOP:', error)
    }
  }

  const handleSOPRevision = async (selectedImprovements) => {
    try {
      console.log('📤 ProcessAuditApp: Calling SOP revision API')
      const response = await fetch('/api/revise-sop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalSOP: processData.fileContent || processData.processDescription,
          analysis: processData.sopAnalysis,
          selectedImprovements,
          preferences: ''
        }),
      })

      if (!response.ok) {
        throw new Error(`SOP revision failed: ${response.status}`)
      }

      const revision = await response.json()
      console.log('✅ ProcessAuditApp: SOP revision completed')

      setProcessData(prev => ({
        ...prev,
        sopRevision: revision
      }))
      setCurrentStep(3) // Move to revision review step
    } catch (error) {
      console.error('❌ ProcessAuditApp: Error revising SOP:', error)
    }
  }

  const handleSOPApproval = async (approvedSOP) => {
    console.log('✅ ProcessAuditApp: SOP approved, moving to automations')
    setCurrentStep(4) // Move to automations step
  }

  const handleSOPRejection = () => {
    console.log('🔄 ProcessAuditApp: SOP rejected, returning to feedback')
    setCurrentStep(2) // Return to feedback step
  }

  const resetAudit = () => {
    setCurrentStep(1)
    setProcessData({
      processDescription: '',
      fileContent: '',
      questions: [],
      answers: {},
      auditReport: null,
      inputType: 'process',
      sopStructure: null,
      isSOPAnalysis: false,
      sopAnalysis: null,
      sopRevision: null
    })
  }

  const openAuthModal = (mode = 'signin') => {
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

          {/* Regular Process Workflow */}
          {!processData.isSOPAnalysis && currentStep === 2 && (
            <QuestionForm
              questions={processData.questions}
              onComplete={handleQuestionAnswers}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {!processData.isSOPAnalysis && currentStep === 3 && (
            <AnalysisLoader
              processData={processData}
              onComplete={handleAnalysisComplete}
            />
          )}

          {!processData.isSOPAnalysis && currentStep === 4 && (
            <AuditReport
              report={processData.auditReport}
              processData={processData}
              onRestart={resetAudit}
            />
          )}

          {/* SOP Analysis Workflow */}
          {processData.isSOPAnalysis && currentStep === 2 && (
            <SOPFeedback
              analysis={processData.sopAnalysis}
              originalSOP={processData.fileContent || processData.processDescription}
              onProceedToRevision={handleSOPRevision}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {processData.isSOPAnalysis && currentStep === 3 && (
            <SOPRevision
              originalSOP={processData.fileContent || processData.processDescription}
              revisedSOP={processData.sopRevision}
              analysis={processData.sopAnalysis}
              onApprove={handleSOPApproval}
              onReject={handleSOPRejection}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {processData.isSOPAnalysis && currentStep === 4 && (
            <>
              {console.log('🔍 ProcessAuditApp Step 4 Debug:', {
                currentStep,
                isSOPAnalysis: processData.isSOPAnalysis,
                hasAnalysis: !!processData.sopAnalysis,
                hasRevision: !!processData.sopRevision,
                analysisKeys: processData.sopAnalysis ? Object.keys(processData.sopAnalysis) : null,
                hasAutomationOpps: !!processData.sopAnalysis?.automationOpportunities,
                automationOppsCount: processData.sopAnalysis?.automationOpportunities?.length
              })}
              <AuditReport
                report={processData.auditReport}
                processData={processData}
                onRestart={resetAudit}
                isSOPMode={true}
                sopData={{
                  analysis: processData.sopAnalysis,
                  revision: processData.sopRevision
                }}
              />
            </>
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