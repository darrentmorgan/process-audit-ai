import { useState } from 'react'
import { Check, X, Download, Upload, ArrowLeft, ArrowRight, FileText, Zap } from 'lucide-react'

const SOPRevision = ({ originalSOP, revisedSOP, analysis, onApprove, onReject, onBack }) => {
  const [activeTab, setActiveTab] = useState('comparison')
  const [isApproving, setIsApproving] = useState(false)

  if (!revisedSOP?.revisedSOP) {
    return (
      <div className="card max-w-4xl mx-auto text-center">
        <p className="text-gray-600">No revised SOP available.</p>
        <button onClick={onBack} className="btn-secondary mt-4">
          Go Back
        </button>
      </div>
    )
  }

  const revised = revisedSOP.revisedSOP

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await onApprove(revisedSOP)
    } catch (error) {
      console.error('Error approving SOP:', error)
    } finally {
      setIsApproving(false)
    }
  }

  const downloadSOP = (content, filename) => {
    const sopText = formatSOPForDownload(content)
    const blob = new Blob([sopText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatSOPForDownload = (sop) => {
    if (typeof sop === 'string') return sop
    
    // Format structured SOP object into readable text
    let formatted = `${sop.header?.title || 'Standard Operating Procedure'}\n`
    formatted += `${sop.header?.sopNumber || ''} - Version ${sop.header?.version || '1.0'}\n`
    formatted += `Effective Date: ${sop.header?.effectiveDate || new Date().toISOString().split('T')[0]}\n`
    formatted += `Prepared By: ${sop.header?.preparedBy || 'ProcessAudit AI'}\n\n`
    
    if (sop.purpose) {
      formatted += `PURPOSE\n${sop.purpose}\n\n`
    }
    
    if (sop.scope) {
      formatted += `SCOPE\n${sop.scope}\n\n`
    }
    
    if (sop.responsibilities) {
      formatted += `RESPONSIBILITIES\n`
      Object.entries(sop.responsibilities).forEach(([role, resp]) => {
        formatted += `${role}: ${resp}\n`
      })
      formatted += `\n`
    }
    
    if (sop.materialsEquipment?.length) {
      formatted += `MATERIALS & EQUIPMENT\n`
      sop.materialsEquipment.forEach((item, index) => {
        formatted += `${index + 1}. ${item}\n`
      })
      formatted += `\n`
    }
    
    if (sop.procedure?.length) {
      formatted += `PROCEDURE\n`
      sop.procedure.forEach((step) => {
        formatted += `${step.step}. ${step.action}\n`
        if (step.responsibility) formatted += `   Responsibility: ${step.responsibility}\n`
        if (step.timing) formatted += `   Timing: ${step.timing}\n`
        if (step.qualityCriteria) formatted += `   Quality Criteria: ${step.qualityCriteria}\n`
        if (step.automationNote) formatted += `   Automation Note: ${step.automationNote}\n`
        formatted += `\n`
      })
    }
    
    return formatted
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            SOP Revision Review
          </h2>
          <p className="text-lg text-gray-600">
            Review and approve your optimized Standard Operating Procedure
          </p>
        </div>

        {/* Improvement Summary */}
        {revisedSOP.revisionSummary && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Key Improvements Made
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800">Time Reduction:</span><br />
                <span className="text-green-700">
                  {revisedSOP.revisionSummary.improvementMetrics?.estimatedTimeReduction || 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-green-800">Quality Enhancement:</span><br />
                <span className="text-green-700">
                  {revisedSOP.revisionSummary.improvementMetrics?.qualityImprovement || 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-green-800">Compliance:</span><br />
                <span className="text-green-700">
                  {revisedSOP.revisionSummary.improvementMetrics?.complianceEnhancement || 'N/A'}
                </span>
              </div>
            </div>
            {revisedSOP.revisionSummary.majorChanges?.length > 0 && (
              <div className="mt-3">
                <span className="font-medium text-green-800 text-sm">Major Changes:</span>
                <ul className="mt-1 space-y-1">
                  {revisedSOP.revisionSummary.majorChanges.map((change, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comparison'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Side-by-Side Comparison
            </button>
            <button
              onClick={() => setActiveTab('revised')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'revised'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Revised SOP Only
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'structure'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Structured View
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'comparison' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Original SOP</h4>
                <button
                  onClick={() => downloadSOP(originalSOP, 'original-sop.txt')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto border">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {typeof originalSOP === 'string' ? originalSOP : JSON.stringify(originalSOP, null, 2)}
                </pre>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Revised SOP</h4>
                <button
                  onClick={() => downloadSOP(revised, 'revised-sop.txt')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
              <div className="bg-green-50 rounded-lg p-4 h-96 overflow-y-auto border border-green-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {formatSOPForDownload(revised)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revised' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Optimized SOP</h4>
              <button
                onClick={() => downloadSOP(revised, 'optimized-sop.txt')}
                className="btn-secondary flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download SOP
              </button>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="prose max-w-none">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {formatSOPForDownload(revised)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'structure' && revised && (
          <div className="space-y-6">
            {/* Header Info */}
            {revised.header && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Document Information</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {revised.header.title}
                  </div>
                  <div>
                    <span className="font-medium">SOP Number:</span> {revised.header.sopNumber}
                  </div>
                  <div>
                    <span className="font-medium">Version:</span> {revised.header.version}
                  </div>
                  <div>
                    <span className="font-medium">Effective Date:</span> {revised.header.effectiveDate}
                  </div>
                </div>
              </div>
            )}

            {/* Purpose and Scope */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Purpose</h4>
                <p className="text-sm text-gray-700">{revised.purpose}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Scope</h4>
                <p className="text-sm text-gray-700">{revised.scope}</p>
              </div>
            </div>

            {/* Procedure Steps */}
            {revised.procedure?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Procedure Steps</h4>
                <div className="space-y-4">
                  {revised.procedure.map((step, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 flex-shrink-0">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-2">{step.action}</p>
                          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                            {step.responsibility && (
                              <div>
                                <span className="font-medium">Responsibility:</span> {step.responsibility}
                              </div>
                            )}
                            {step.timing && (
                              <div>
                                <span className="font-medium">Timing:</span> {step.timing}
                              </div>
                            )}
                            {step.qualityCriteria && (
                              <div className="md:col-span-2">
                                <span className="font-medium">Quality Criteria:</span> {step.qualityCriteria}
                              </div>
                            )}
                            {step.automationNote && (
                              <div className="md:col-span-2 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                                <span className="font-medium text-yellow-800">💡 Automation Opportunity:</span>
                                <span className="text-yellow-700 ml-1">{step.automationNote}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Analysis
        </button>
        <div className="flex space-x-3">
          <button onClick={onReject} className="btn-secondary flex items-center">
            <X className="w-4 h-4 mr-2" />
            Request Changes
          </button>
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="btn-primary flex items-center"
          >
            {isApproving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Approve & Generate Automations
          </button>
        </div>
      </div>
    </div>
  )
}

export default SOPRevision