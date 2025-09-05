import { useState } from 'react'
import StepIndicator from './StepIndicator'
import ProcessInput from './ProcessInput'
import QuestionForm from './QuestionForm'
import AnalysisLoader from './AnalysisLoader'
import AuditReport from './AuditReport'
import SOPFeedback from './SOPFeedback'
import SOPQuestionForm from './SOPQuestionForm'
import SOPRevision from './SOPRevision'
import UserMenu from './UserMenu'
import ClerkAuthModal from './ClerkAuthModal'
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
    sopQuestionAnswers: {},
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

  // New unified workflow handler
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
      console.log('✅ Process to SOP analysis successful', result)

      setProcessData(prev => ({
        ...prev,
        sopAnalysis: result, // Store the entire result as the analysis
        isSOPAnalysis: true // Now treat it as SOP workflow
      }))

      // Move to revision step
      setCurrentStep(3)

    } catch (error) {
      console.error('❌ Error in process to SOP conversion:', error)
      // Handle error gracefully
    }
  }

  // Existing SOP Analysis handler
  const handleSOPAnalysis = async (inputData) => {
    console.log('🔄 ProcessAuditApp: Starting SOP analysis workflow')

    setProcessData(prev => ({
      ...prev,
      processDescription: inputData.processDescription,
      fileContent: inputData.fileContent,
      inputType: inputData.inputType,
      isSOPAnalysis: inputData.isSOPAnalysis
    }))

    const sopContent = inputData.fileContent || inputData.processDescription
    
    try {
      console.log('📤 Sending SOP analysis request')

      const response = await fetch('/api/analyze-sop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sopContent: sopContent,
          sopStructure: inputData.sopStructure,
          processDescription: inputData.processDescription
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze SOP: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ SOP Analysis successful', result)

      setProcessData(prev => ({
        ...prev,
        sopAnalysis: result // Store the entire result as the analysis
      }))

      // Move to revision step (step 3)
      setCurrentStep(3)
    } catch (error) {
      console.error('❌ Error in SOP analysis:', error)
    }
  }

  // Handle SOP question form completion
  const handleSOPQuestionsComplete = async (questionAnswers) => {
    console.log('🎯 ProcessAuditApp: SOP questions completed with answers:', questionAnswers)
    
    // Store the answers
    setProcessData(prev => ({
      ...prev,
      sopQuestionAnswers: questionAnswers
    }))
    
    // Continue to the improvement recommendations step
    // For now, we'll show the SOPFeedback component which displays the improvement recommendations
    // In the future, we could also pass the question answers to enhance the recommendations
    setCurrentStep(3.5) // Intermediate step to show improvements
  }

  // Rest of the existing handlers (SOPRevision, etc.)
  const handleSOPRevision = async (selectedImprovements, preferences) => {
    console.log('🔄 ProcessAuditApp: Starting SOP revision with improvements:', selectedImprovements)
    
    const originalSOP = processData.fileContent || processData.processDescription
    
    try {
      const response = await fetch('/api/revise-sop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalSOP: originalSOP,
          analysis: processData.sopAnalysis,
          selectedImprovements: selectedImprovements,
          preferences: preferences
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to revise SOP: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ SOP Revision successful')

      setProcessData(prev => ({
        ...prev,
        // Store full revision object so SOPRevision receives { revisedSOP, revisionSummary }
        sopRevision: result
      }))

      // Stay on review step to show side-by-side comparison
      setCurrentStep(3.5)
    } catch (error) {
      console.error('❌ Error in SOP revision:', error)
    }
  }

  const handleSOPApproval = () => {
    console.log('✅ SOP approved, moving to automations')
    setCurrentStep(4)
  }

  const handleSOPRejection = () => {
    console.log('❌ SOP rejected, going back to feedback step')
    setCurrentStep(2)
  }

  // Modal handlers
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

  const openCleanup = () => {
    setCleanupModal(true)
  }

  const closeCleanup = () => {
    setCleanupModal(false)
  }

  const loadSavedReport = (loaded) => {
    try {
      console.log('📥 Loading saved report:', loaded?.title || loaded?.auditReport?.title || 'Untitled')

      // Support both shapes:
      // - DB row: { id, process_description, answers, report_data }
      // - Wrapper: { reportId, processDescription, answers, auditReport }
      const isDbRow = !!loaded?.report_data || (!!loaded?.id && loaded?.process_description !== undefined)

      const processDescription = isDbRow
        ? (loaded.process_description || '')
        : (loaded.processDescription || '')

      const answers = isDbRow
        ? (loaded.answers || {})
        : (loaded.answers || {})

      const auditReport = isDbRow
        ? (loaded.report_data || {})
        : (loaded.auditReport || {})

      const reportId = isDbRow ? loaded.id : loaded.reportId

      setProcessData({
        reportId,
        processDescription,
        fileContent: '',
        questions: [],
        answers,
        auditReport,
        inputType: 'process',
        sopStructure: null,
        isSOPAnalysis: false,
        sopAnalysis: null,
        sopRevision: null
      })

      setCurrentStep(4)
      setSavedReportsModal(false)
    } catch (err) {
      console.error('Failed to load saved report:', err)
    }
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
      sopQuestionAnswers: {},
      sopRevision: null
    })
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
          {/* Step 1: Process Input */}
          {currentStep === 1 && (
            <ProcessInput 
              onNext={handleProcessInput}
            />
          )}

          {/* Step 2: Analysis (Loading) */}
          {currentStep === 2 && (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-6 animate-bounce"></div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Analyzing Your Process</h2>
              <p className="text-blue-100">Creating optimized SOP and identifying automation opportunities...</p>
            </div>
          )}

          {/* Step 3: SOP Discovery Questions */}
          {currentStep === 3 && (
            <>
              {console.log('🔍 Step 3 Debug - Questions Phase:', {
                currentStep,
                hasSopAnalysis: !!processData.sopAnalysis,
                hasQuestionAnswers: Object.keys(processData.sopQuestionAnswers).length > 0,
                sopAnalysisKeys: processData.sopAnalysis ? Object.keys(processData.sopAnalysis) : null,
                processDataKeys: Object.keys(processData)
              })}
              {processData.sopAnalysis ? (
                <SOPQuestionForm
                  sopAnalysis={processData.sopAnalysis}
                  onComplete={handleSOPQuestionsComplete}
                  onBack={() => setCurrentStep(1)}
                />
              ) : (
                <div className="card max-w-2xl mx-auto text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Analysis...</h2>
                  <p className="text-gray-600 mb-6">
                    Preparing your SOP analysis results...
                  </p>
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-6 animate-bounce"></div>
                  </div>
                  <button onClick={() => setCurrentStep(4)} className="btn-primary">
                    Skip to Results
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 3.5: SOP Improvement Recommendations / Review */}
          {currentStep === 3.5 && (
            <>
              {console.log('🔍 Step 3.5 Debug - Improvements Phase:', {
                currentStep,
                hasSopAnalysis: !!processData.sopAnalysis,
                hasSopRevision: !!processData.sopRevision,
                hasQuestionAnswers: Object.keys(processData.sopQuestionAnswers).length > 0,
                sopAnalysisKeys: processData.sopAnalysis ? Object.keys(processData.sopAnalysis) : null,
                processDataKeys: Object.keys(processData)
              })}
              {processData.sopRevision ? (
                <SOPRevision
                  originalSOP={processData.fileContent || processData.processDescription}
                  revisedSOP={processData.sopRevision}
                  analysis={processData.sopAnalysis}
                  onApprove={handleSOPApproval}
                  onReject={handleSOPRejection}
                  onBack={() => setCurrentStep(3)}
                />
              ) : processData.sopAnalysis ? (
                <SOPFeedback
                  analysis={processData.sopAnalysis}
                  originalSOP={processData.fileContent || processData.processDescription}
                  onProceedToRevision={handleSOPRevision}
                  onBack={() => setCurrentStep(3)}
                />
              ) : (
                <div className="card max-w-2xl mx-auto text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Improvements...</h2>
                  <p className="text-gray-600 mb-6">
                    Preparing your improvement recommendations...
                  </p>
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-6 animate-bounce"></div>
                  </div>
                  <button onClick={() => setCurrentStep(4)} className="btn-primary">
                    Skip to Results
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 4: Automations */}
          {currentStep === 4 && (
            <AuditReport
              report={processData.auditReport}
              processData={processData}
              onRestart={resetAudit}
              isSOPMode={processData.isSOPAnalysis}
              sopData={{
                analysis: processData.sopAnalysis,
                revision: processData.sopRevision
              }}
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
        <ClerkAuthModal
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