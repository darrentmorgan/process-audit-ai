import { useState, useEffect } from 'react'
import { 
  Download, 
  RefreshCw, 
  Clock, 
  DollarSign, 
  Zap, 
  Target,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  Save,
  Heart,
  Cpu
} from 'lucide-react'
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'
import { useAuditReports } from '../hooks/useSupabase'
import AutoSaveNotification from './AutoSaveNotification'
import AutomationTemplates from './AutomationTemplates'
import AutomationGenerator from './AutomationGenerator'

const AuditReport = ({ report, onRestart, processData, isSOPMode = false, sopData }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedOpportunity, setExpandedOpportunity] = useState(null)
  const [saveTitle, setSaveTitle] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const [reportId, setReportId] = useState(null) // Track if this is a loaded report
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  const [showAutomationGenerator, setShowAutomationGenerator] = useState(false)
  
  const { user, isConfigured } = useUnifiedAuth()
  const { saveReport } = useAuditReports()
  
  // Normalize report data early to use throughout the component
  // Handle both direct report objects and nested structures
  const getReportData = () => {
    // Handle SOP mode
    if (isSOPMode && !report) {
      const analysis = sopData?.analysis || processData?.sopAnalysis
      
      return {
        executiveSummary: {
          totalTimeSavings: analysis?.potentialTimeSavings || "2-4 hours/week",
          quickWins: analysis?.automationOpportunities?.filter(opp => opp.priority >= 80).length || 2,
          strategicOpportunities: analysis?.automationOpportunities?.filter(opp => opp.priority < 80).length || 3,
          estimatedROI: "300%",
          frequency: "Weekly",
          currentTimeSpent: "8 hours/week"
        },
        automationOpportunities: analysis?.automationOpportunities || [
          {
            id: 'mock-1',
            stepDescription: 'Email ticket intake and categorization',
            solution: 'Implement automated ticket routing with AI categorization',
            category: 'quick-win',
            priority: 90,
            effort: 'Medium',
            timeSavings: '8 minutes per ticket',
            estimatedCost: '$500-1000',
            tools: ['Zendesk', 'Freshdesk', 'ServiceNow'],
            implementationSteps: [
              'Select help desk platform',
              'Configure automated categorization rules',
              'Set up team assignment logic',
              'Train team on new system'
            ],
            technicalRequirements: 'Help desk software with API integration and AI categorization capabilities'
          },
          {
            id: 'mock-2', 
            stepDescription: 'Manual ticket tracking and logging',
            solution: 'Replace spreadsheet with automated ticket management',
            category: 'strategic',
            priority: 75,
            effort: 'Medium',
            timeSavings: '5 minutes per ticket',
            estimatedCost: '$200-500',
            tools: ['Jira Service Desk', 'HubSpot Service Hub'],
            implementationSteps: [
              'Define workflow states',
              'Set up automated reporting', 
              'Configure SLA tracking',
              'Enable automated notifications'
            ],
            technicalRequirements: 'Ticket management system with workflow automation'
          }
        ],
        roadmap: [
          {
            phase: "Phase 1: Quick Wins (Weeks 1-4)",
            items: [
              "Set up help desk software",
              "Configure automated categorization", 
              "Implement basic ticket routing"
            ],
            estimatedSavings: "8-10 hours/week",
            estimatedCost: "$500-1000",
            keyBenefits: ["Immediate time savings", "Reduced human error", "Better ticket organization"]
          },
          {
            phase: "Phase 2: Process Optimization (Weeks 5-8)",
            items: [
              "Advanced workflow automation",
              "SLA tracking and alerts",
              "Customer satisfaction surveys"
            ],
            estimatedSavings: "12-15 hours/week", 
            estimatedCost: "$200-500",
            keyBenefits: ["Improved response times", "Better customer experience", "Performance insights"]
          }
        ],
        implementationGuidance: {
          gettingStarted: [
            "Evaluate help desk software options (Zendesk, Freshdesk, ServiceNow)",
            "Define ticket categorization rules and priority levels",
            "Set up team access and permissions",
            "Plan migration from current spreadsheet system"
          ],
          successMetrics: [
            "Average ticket resolution time reduced by 50%",
            "Ticket categorization accuracy above 90%",
            "Customer satisfaction score improvement",
            "Team productivity increase of 25%"
          ],
          riskConsiderations: [
            "Ensure proper team training on new system",
            "Plan for initial productivity dip during transition",
            "Monitor data migration accuracy carefully",
            "Have rollback plan if system issues occur"
          ]
        }
      }
    }
    
    // Handle regular report
    if (report && report.report) {
      return report.report
    }
    
    return report || {}
  }
  
  const normalizedReport = getReportData()

  // Check if this is a loaded report (has an ID in processData)
  useEffect(() => {
    if (processData?.reportId) {
      console.log('AuditReport: This is a loaded report, skipping auto-save')
      setReportId(processData.reportId)
      setAutoSaved(true) // Mark as saved since it's a loaded report
    } else {
      setReportId(null)
      setAutoSaved(false)
    }
  }, [processData?.reportId])

  // Auto-save report when user is logged in and report is complete (but not for loaded reports)
  useEffect(() => {
    const autoSaveReport = async () => {
      // Don't auto-save if:
      // - No user or not configured
      // - No report data
      // - Already auto-saved
      // - This is a loaded report (has reportId)
      if (!user || !isConfigured || !report || autoSaved || reportId) {
        console.log('AuditReport: Skipping auto-save', {
          hasUser: !!user,
          isConfigured,
          hasReport: !!report,
          autoSaved,
          isLoadedReport: !!reportId
        })
        return
      }

      console.log('AuditReport: Starting auto-save for new report')
      try {
        setAutoSaveStatus('Saving report...')
        
        const reportTitle = `Process Audit - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
        
        // Use the normalized report data that we already computed
        const reportToSave = getReportData()
        
        const { error } = await saveReport({
          title: reportTitle,
          processDescription: processData?.processDescription || '',
          fileContent: processData?.fileContent || '',
          answers: processData?.answers || {},
          report: reportToSave
        })

        if (error) {
          console.error('Auto-save failed:', error)
          setAutoSaveStatus('Auto-save failed')
          setNotificationMessage('Failed to save report automatically')
          setNotificationType('error')
          setShowNotification(true)
        } else {
          console.log('AuditReport: Auto-save successful')
          setAutoSaved(true)
          setAutoSaveStatus('✅ Report automatically saved!')
          setNotificationMessage('Report automatically saved to your account!')
          setNotificationType('success')
          setShowNotification(true)
          
          // Clear the status after 3 seconds
          setTimeout(() => {
            setAutoSaveStatus('')
          }, 3000)
        }
      } catch (error) {
        console.error('Auto-save error:', error)
        setAutoSaveStatus('Auto-save failed')
      }
    }

    // Use setTimeout to prevent multiple rapid calls
    const saveTimer = setTimeout(autoSaveReport, 1000)
    return () => clearTimeout(saveTimer)
  }, [user, isConfigured, report, autoSaved, reportId]) // Removed processData and saveReport to prevent infinite loops

  // Extract data from normalized report
  const executiveSummary = normalizedReport.executiveSummary || {}
  const automationOpportunities = Array.isArray(normalizedReport.automationOpportunities)
    ? normalizedReport.automationOpportunities
    : []
  const roadmap = Array.isArray(normalizedReport.roadmap)
    ? normalizedReport.roadmap
    : []
  const implementationGuidance = normalizedReport.implementationGuidance
    || normalizedReport.technicalRecommendations
    || null

  // For regular process analysis mode, ensure we have a report
  if (!normalizedReport || Object.keys(normalizedReport).length === 0) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Report Not Available
        </h2>
        <p className="text-gray-600 mb-6">
          Unable to generate your audit report. Please try again.
        </p>
        <button onClick={onRestart} className="btn-primary">
          Start New Audit
        </button>
      </div>
    )
  }

  const getPriorityColor = (priority) => {
    if (priority >= 90) return 'bg-red-100 text-red-800 border-red-200'
    if (priority >= 75) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (priority >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getEffortColor = (effort) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800'
    }
    return colors[effort] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'quick-win': Zap,
      'strategic': Target,
      'advanced': Settings
    }
    return icons[category] || CheckCircle
  }

  // Define tabs based on mode
  const getTabs = () => {
    if (isSOPMode && sopData?.analysis) {
      return [
        { id: 'overview', label: 'SOP Summary', icon: BarChart3 },
        { id: 'opportunities', label: 'Improvements', icon: Zap },
        { id: 'automations', label: 'Automations', icon: Target },
        { id: 'guidance', label: 'Implementation', icon: Users }
      ]
    } else {
      return [
        { id: 'overview', label: 'Executive Summary', icon: BarChart3 },
        { id: 'opportunities', label: 'Opportunities', icon: Zap },
        { id: 'roadmap', label: 'Implementation', icon: Target },
        { id: 'guidance', label: 'Guidance', icon: Users }
      ]
    }
  }

  const tabs = getTabs()

  const handleSaveReport = async () => {
    if (!user || !isConfigured) {
      alert('Please sign in to save reports')
      return
    }
    
    setShowSaveModal(true)
    setSaveTitle(`Process Audit - ${new Date().toLocaleDateString()}`)
  }

  const confirmSaveReport = async () => {
    if (!saveTitle.trim()) {
      alert('Please enter a title for your report')
      return
    }

    setSaving(true)
    try {
      const { error } = await saveReport({
        title: saveTitle.trim(),
        processDescription: processData?.processDescription || '',
        fileContent: processData?.fileContent || '',
        answers: processData?.answers || {},
        report: normalizedReport
      })

      if (error) {
        alert('Failed to save report: ' + error.message)
      } else {
        alert('Report saved successfully!')
        setShowSaveModal(false)
        setSaveTitle('')
      }
    } catch (error) {
      alert('Failed to save report')
    } finally {
      setSaving(false)
    }
  }

  const exportReport = () => {
    // In a real implementation, this would generate a PDF
          const reportDataToExport = {
        title: 'ProcessAudit AI - Automation Analysis Report',
        generatedAt: new Date().toISOString(),
        ...normalizedReport
      }
    
    const dataStr = JSON.stringify(reportDataToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'process-audit-report.json'
    link.click()
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Process Audit Report
            </h1>
            <div className="flex items-center space-x-4">
              <p className="text-gray-600">
                AI-powered analysis with actionable automation recommendations
              </p>
              {autoSaveStatus && (
                <div className="flex items-center">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    autoSaveStatus.includes('✅') 
                      ? 'bg-green-100 text-green-700' 
                      : autoSaveStatus.includes('failed')
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}>
                    {autoSaveStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            {user && isConfigured ? (
              <button
                onClick={handleSaveReport}
                className={`btn-secondary flex items-center ${autoSaved ? 'opacity-75' : ''}`}
              >
                <Save className="w-4 h-4 mr-2" />
                {autoSaved ? 'Save Another Copy' : 'Save Report'}
              </button>
            ) : isConfigured && (
              <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <Save className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-700">
                  Sign in to auto-save reports
                </span>
              </div>
            )}
            <button
              onClick={exportReport}
              className="btn-secondary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </button>
            <button
              onClick={onRestart}
              className="btn-primary flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Audit
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {executiveSummary?.totalTimeSavings || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Potential Savings</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Zap className="w-8 h-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {executiveSummary?.quickWins || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Quick Wins</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {executiveSummary?.strategicOpportunities || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Strategic Items</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {executiveSummary?.estimatedROI || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Est. ROI</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200
                ${activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Executive Summary Tab */}
        {activeTab === 'overview' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Executive Summary</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Current State</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Process Frequency:</span>
                    <span className="font-medium">{executiveSummary?.frequency || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time per Iteration:</span>
                    <span className="font-medium">{executiveSummary?.currentTimeSpent || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Optimization Potential</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Automation Opportunities:</span>
                    <span className="font-medium">{automationOpportunities?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Implementation Time:</span>
                    <span className="font-medium">2-12 weeks</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Key Recommendations</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-secondary mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Start with {executiveSummary?.quickWins || 'available'} quick-win opportunities for immediate impact
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-secondary mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Focus on automation tools that integrate with your existing workflow
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-secondary mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Expect {executiveSummary?.estimatedROI || 'significant'} return on investment within 6-12 months
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            {/* Advanced Automation Button */}
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Generate n8n Workflow</h3>
                    <p className="text-sm text-gray-600">
                      Create a complete automation workflow that you can import into n8n
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAutomationGenerator(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Generate Workflow
                </button>
              </div>
            </div>
            
            {(automationOpportunities || []).map((opportunity, index) => {
              // Ensure each opportunity has a unique identifier
              const opportunityId = opportunity.id || `opportunity-${index}`
              const isExpanded = expandedOpportunity === opportunityId
              const CategoryIcon = getCategoryIcon(opportunity.category)

              return (
                <div key={opportunityId} className="card">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedOpportunity(isExpanded ? null : opportunityId)}
                  >
                    <div className="flex items-center flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white mr-4">
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {opportunity.processStep || opportunity.stepDescription}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {opportunity.solution || opportunity.automationSolution}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mr-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(opportunity.priority)}`}>
                        {opportunity.priority}% Priority
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getEffortColor(opportunity.effort)}`}>
                        {opportunity.effort} Effort
                      </span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {opportunity.timeSavings}
                        </div>
                        <div className="text-xs text-gray-500">time saved</div>
                      </div>
                    </div>

                    <ChevronRight 
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Implementation Steps</h4>
                          <ol className="space-y-2">
                            {(opportunity.implementationSteps || []).map((step, index) => (
                              <li key={index} className="flex items-start">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                                  {index + 1}
                                </span>
                                <span className="text-gray-700">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Recommended Tools</h4>
                            <div className="flex flex-wrap gap-2">
                              {(opportunity.tools || []).map((tool, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Technical Requirements</h4>
                            <p className="text-gray-700 text-sm">
                              {opportunity.technicalRequirements || 'Basic automation tools and API access'}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Estimated Cost</h4>
                            <p className="text-gray-700 font-medium">
                              {opportunity.estimatedCost || 'Contact for pricing'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            {(roadmap || []).map((phase, index) => (
              <div key={index} className="card">
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg mr-4 flex-shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {phase.phase}
                    </h3>
                    
                    <div className="grid md:grid-cols-3 gap-6 mt-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Automation Items</h4>
                        <ul className="space-y-2">
                          {phase.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-secondary mr-2" />
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Expected Outcomes</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-primary mr-2" />
                            <span>{phase.estimatedSavings}</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-secondary mr-2" />
                            <span>{phase.estimatedCost}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Key Benefits</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {(phase.keyBenefits || []).map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="flex items-start">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0"></div>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SOP Automations Tab */}
        {isSOPMode && activeTab === 'automations' && sopData?.analysis?.automationOpportunities && (
          <AutomationTemplates 
            automationOpportunities={sopData.analysis.automationOpportunities}
            sopData={sopData.revision?.revisedSOP || {}}
            processData={processData}
            auditReportId={reportId}
            userId={user?.id}
          />
        )}

        {/* Guidance Tab */}
        {activeTab === 'guidance' && implementationGuidance && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h3>
              <ul className="space-y-3">
                {(implementationGuidance.gettingStarted || []).map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-sm font-medium flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Success Metrics</h3>
                <ul className="space-y-2">
                  {(implementationGuidance.successMetrics || []).map((metric, index) => (
                    <li key={index} className="flex items-center">
                      <BarChart3 className="w-4 h-4 text-secondary mr-3" />
                      <span className="text-gray-700">{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Risk Considerations</h3>
                <ul className="space-y-2">
                  {(implementationGuidance.riskConsiderations || []).map((risk, index) => (
                    <li key={index} className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-warning mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Save Report</h3>
            <p className="text-gray-600 mb-4">
              Give your audit report a name so you can find it later.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title
              </label>
              <input
                type="text"
                className="input-field"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Enter report title..."
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSaveModal(false)
                  setSaveTitle('')
                }}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={confirmSaveReport}
                className="btn-primary flex-1"
                disabled={saving || !saveTitle.trim()}
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save Notification */}
      <AutoSaveNotification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={() => setShowNotification(false)}
      />

      {/* Automation Generator Modal */}
      {showAutomationGenerator && (
        <AutomationGenerator
          auditReportId={reportId}
          processData={processData}
          automationOpportunities={automationOpportunities}
          userId={user?.id}
          onClose={() => setShowAutomationGenerator(false)}
        />
      )}
    </div>
  )
}

export default AuditReport