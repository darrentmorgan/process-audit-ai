import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import StepIndicator from './StepIndicator'
import ProcessInput from './ProcessInput'
import UserMenu from './UserMenu'
import Logo from './Logo'
import SystemStatusBanner from './SystemStatusBanner'
import { Zap, Target, BarChart3 } from 'lucide-react'
import useMobileOptimization from '../hooks/useMobileOptimization'
import { 
  ReportLoadingSkeleton, 
  AuthModalLoadingSkeleton, 
  SavedReportsLoadingSkeleton,
  ProcessingLoadingSkeleton 
} from './MobileLoadingSkeletons'

// Dynamic imports for heavy components - mobile optimization
const AuditReport = dynamic(() => import('./AuditReport'), {
  loading: () => <ReportLoadingSkeleton />,
  ssr: false
})

const ClerkAuthModal = dynamic(() => import('./ClerkAuthModal'), {
  loading: () => <AuthModalLoadingSkeleton />,
  ssr: false
})

const SavedReportsModal = dynamic(() => import('./SavedReportsModal'), {
  loading: () => <SavedReportsLoadingSkeleton />,
  ssr: false
})

// Lazy load SOP-specific components (only when needed)
const SOPFeedback = dynamic(() => import('./SOPFeedback'), {
  loading: () => <ProcessingLoadingSkeleton message="Loading feedback..." />,
  ssr: false
})

const SOPQuestionForm = dynamic(() => import('./SOPQuestionForm'), {
  loading: () => <ProcessingLoadingSkeleton message="Loading questions..." />,
  ssr: false
})

const SOPRevision = dynamic(() => import('./SOPRevision'), {
  loading: () => <ProcessingLoadingSkeleton message="Loading revision..." />,
  ssr: false
})

// Database cleanup is rarely used - lazy load
const DatabaseCleanup = dynamic(() => import('./DatabaseCleanup'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-xl p-6">Loading...</div></div>,
  ssr: false
})

const ProcessAuditApp = ({ isDemoMode = false, organization = null }) => {
  
  // Mobile optimization hook
  const { 
    isMobile, 
    shouldLoadHeavyAssets, 
    handleTouchStart, 
    handleTouchEnd, 
    trackPerformanceMetric,
    isSlowNetwork,
    isLowMemoryDevice 
  } = useMobileOptimization()
  
  // Determine if this is Hospo-Dojo branded experience
  const isHospoDojo = organization === 'hospo-dojo'
  
  // Get branding configuration based on organization
  const getBrandConfig = () => {
    if (isHospoDojo) {
      return {
        name: 'HOSPO DOJO',
        tagline: 'Prep For Success - AI-powered process analysis for hospitality professionals',
        logo: '/Hospo-Dojo-Logo.svg',
        logoType: 'svg',
        theme: {
          primary: '#1C1C1C', // Official Black
          secondary: '#EAE8DD', // Official Ivory
          accent: '#42551C' // Official Khaki Green
        },
        terminology: {
          analysis: 'Prepping Your Success Strategy',
          progress: 'Battle Plan Progress', 
          results: 'Your Hospitality Battle Plan',
          recommendations: 'Strategic Moves for Excellence'
        }
      }
    } else {
      return {
        name: 'ProcessAudit AI',
        tagline: 'Discover automation opportunities in your business processes with AI-powered analysis',
        logo: null,
        theme: {
          primary: '#2563eb',
          secondary: '#64748b', 
          accent: '#8b5cf6'
        },
        terminology: {
          analysis: 'Analyzing Your Process',
          progress: 'Analysis Progress',
          results: 'Your Process Audit Report', 
          recommendations: 'Automation Recommendations'
        }
      }
    }
  }
  
  const brandConfig = getBrandConfig()
  const [currentStep, setCurrentStep] = useState(1)
  
  // Set data-brand attribute on document root for CSS theming
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (isHospoDojo) {
        root.setAttribute('data-brand', 'hospo-dojo')
      } else {
        root.removeAttribute('data-brand')
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-brand')
      }
    }
  }, [isHospoDojo])
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
      {/* System Status Banner */}
      <SystemStatusBanner
        organization={organization}
        isDemoMode={isDemoMode}
        onStatusChange={(status) => {
          // Could update application state based on system status
          console.log('System status changed:', status.overall);
        }}
      />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header - Mobile Stacked Layout */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          {/* Mobile: Stacked vertically, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-between space-y-4 sm:space-y-0 mb-3 sm:mb-4">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              {brandConfig.logo ? (
                brandConfig.logoType === 'svg' ? (
                  <img
                    src={brandConfig.logo}
                    alt={`${brandConfig.name} - Hospitality Operations Platform`}
                    className="hd-logo-mobile transition-transform duration-200 hover:scale-105"
                    style={{
                      filter: 'brightness(0) invert(1)',
                      imageRendering: '-webkit-optimize-contrast',
                      imageRendering: 'crisp-edges'
                    }}
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <>
                    <Logo className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white transition-transform duration-200 hover:scale-105" color="currentColor" />
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">{brandConfig.name}</h1>
                  </>
                )
              ) : (
                <>
                  <Logo className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white transition-transform duration-200 hover:scale-105" color="currentColor" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">{brandConfig.name}</h1>
                </>
              )}
            </div>
            
            {/* User Menu - No overlap, properly spaced */}
            <div className="flex-shrink-0">
              <UserMenu 
                onOpenAuth={openAuthModal} 
                onOpenSavedReports={openSavedReports}
                onOpenCleanup={openCleanup}
              />
            </div>
          </div>
          
          {/* Tagline - Centered below on all screen sizes */}
          <div className="text-center">
            <p className="text-sm sm:text-base lg:text-lg text-blue-100 max-w-2xl mx-auto hd-mobile-spacing leading-relaxed font-medium">
              {brandConfig.tagline}
            </p>
          </div>
        </div>

        {/* Demo Mode Banner - Mobile Touch Optimized */}
        {isDemoMode && (
          <div className="bg-yellow-500 bg-opacity-90 backdrop-blur-sm text-yellow-900 px-3 sm:px-4 lg:px-6 py-3 rounded-xl mb-6 sm:mb-8 text-center hd-mobile-spacing border border-yellow-400 border-opacity-30">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                <span className="font-semibold tracking-wide">{isHospoDojo ? 'Dojo Demo Mode' : 'Demo Mode'}</span>
              </div>
              <div className="hidden sm:block">•</div>
              <span className="hidden sm:inline">Try the tool freely</span>
              <div className="hidden sm:block">•</div>
              <button 
                onClick={() => openAuthModal('signup')}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="hd-touch-feedback underline font-semibold hover:no-underline mt-1 sm:mt-0 px-2 py-1 rounded transition-colors duration-200 touch-target"
                style={{ minHeight: '44px' }}
              >
                {isHospoDojo ? 'Join the Dojo to save results' : 'Sign up to save your results'}
              </button>
            </div>
          </div>
        )}

        {/* Features Banner - Mobile Touch Optimized */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto mb-8 sm:mb-10 lg:mb-12 hd-mobile-spacing">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <div className="text-center text-white bg-white bg-opacity-10 rounded-xl p-4 sm:p-6 backdrop-blur-md border border-white border-opacity-20 transition-all duration-300 hover:bg-opacity-15 hover:transform hover:scale-105">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-yellow-300 drop-shadow-lg" />
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base tracking-wide">
                  {isHospoDojo ? 'Lightning Fast Analysis' : 'Quick Analysis'}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  {isHospoDojo ? 'Battle-tested insights for hospitality excellence' : 'Get actionable insights in minutes'}
                </p>
              </div>
              <div className="text-center text-white bg-white bg-opacity-10 rounded-xl p-4 sm:p-6 backdrop-blur-md border border-white border-opacity-20 transition-all duration-300 hover:bg-opacity-15 hover:transform hover:scale-105">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-green-300 drop-shadow-lg" />
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base tracking-wide">
                  {isHospoDojo ? 'Strategic Moves' : 'Targeted Recommendations'}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  {isHospoDojo ? 'Precision-targeted hospitality optimizations' : 'Prioritized by impact and effort'}
                </p>
              </div>
              <div className="text-center text-white bg-white bg-opacity-10 rounded-xl p-4 sm:p-6 backdrop-blur-md border border-white border-opacity-20 transition-all duration-300 hover:bg-opacity-15 hover:transform hover:scale-105">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-purple-300 drop-shadow-lg" />
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base tracking-wide">
                  {isHospoDojo ? 'Victory Metrics' : 'ROI Calculations'}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  {isHospoDojo ? 'Quantified success for hospitality warriors' : 'Quantified time and cost savings'}
                </p>
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

          {/* Step 2: Analysis (Loading) - Mobile Touch Optimized */}
          {currentStep === 2 && (
            <ProcessingLoadingSkeleton 
              isHospoDojo={isHospoDojo}
              message={brandConfig.terminology.analysis}
            />
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
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Processing Analysis...</h2>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                    Preparing your SOP analysis results...
                  </p>
                  <div className="animate-pulse">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-500 rounded-full mx-auto mb-4 sm:mb-6 animate-bounce"></div>
                  </div>
                  <button onClick={() => setCurrentStep(4)} className="btn-primary w-full sm:w-auto">
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
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Processing Improvements...</h2>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                    Preparing your improvement recommendations...
                  </p>
                  <div className="animate-pulse">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-500 rounded-full mx-auto mb-4 sm:mb-6 animate-bounce"></div>
                  </div>
                  <button onClick={() => setCurrentStep(4)} className="btn-primary w-full sm:w-auto">
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

        {/* Footer - Mobile Touch Optimized */}
        <div className="text-center mt-8 sm:mt-12 lg:mt-16 text-white hd-mobile-spacing">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isHospoDojo && (
              <img 
                src="/dojo-stamp.png" 
                alt="Hospo Dojo Stamp" 
                className="w-4 h-4 opacity-60"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            )}
            <p className="text-xs sm:text-sm text-blue-100 font-medium tracking-wide">
              {isHospoDojo 
                ? 'Powered by AI • Built for Hospitality Warriors' 
                : 'Powered by AI • Built for Technical Founders'
              }
            </p>
            {isHospoDojo && (
              <img 
                src="/dojo-stamp.png" 
                alt="Hospo Dojo Stamp" 
                className="w-4 h-4 opacity-60"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            )}
          </div>
          {isHospoDojo && (
            <p className="text-xs text-blue-200 opacity-75 mt-1 font-medium tracking-widest uppercase">
              Excellence Through Discipline
            </p>
          )}
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