import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, ArrowRight, FileText } from 'lucide-react'

const SOPFeedback = ({ analysis, originalSOP, onProceedToRevision, onBack }) => {
  const [selectedImprovements, setSelectedImprovements] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  if (!analysis) {
    return (
      <div className="card max-w-4xl mx-auto text-center">
        <p className="text-gray-600">No SOP analysis available.</p>
        <button onClick={onBack} className="btn-secondary mt-4">
          Go Back
        </button>
      </div>
    )
  }

  const handleImprovementToggle = (improvementIndex) => {
    setSelectedImprovements(prev => {
      if (prev.includes(improvementIndex)) {
        return prev.filter(i => i !== improvementIndex)
      } else {
        return [...prev, improvementIndex]
      }
    })
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'High': return <XCircle className="w-5 h-5 text-red-500" />
      case 'Medium': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'Low': return <CheckCircle className="w-5 h-5 text-green-500" />
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            SOP Analysis Results
          </h2>
          <p className="text-lg text-gray-600">
            Review the analysis of your Standard Operating Procedure
          </p>
        </div>

        {/* Overall Assessment */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-1 ${getScoreColor(analysis.sopAssessment?.overallScore || 0)}`}>
              {analysis.sopAssessment?.overallScore || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold mb-1 ${getScoreColor(analysis.sopAssessment?.completenessScore || 0)}`}>
              {analysis.sopAssessment?.completenessScore || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Completeness</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold mb-1 ${getScoreColor(analysis.sopAssessment?.clarityScore || 0)}`}>
              {analysis.sopAssessment?.clarityScore || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Clarity</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold mb-1 ${getScoreColor(analysis.sopAssessment?.efficiencyScore || 0)}`}>
              {analysis.sopAssessment?.efficiencyScore || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Efficiency</div>
          </div>
        </div>

        {/* Key Strengths and Gaps */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Key Strengths
            </h4>
            <ul className="space-y-2">
              {analysis.sopAssessment?.keyStrengths?.map((strength, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-red-800 mb-3 flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              Critical Gaps
            </h4>
            <ul className="space-y-2">
              {analysis.sopAssessment?.criticalGaps?.map((gap, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Improvement Areas */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Improvement Recommendations
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the improvements you&apos;d like to include in the revised SOP:
        </p>

        <div className="space-y-3">
          {analysis.improvementAreas?.map((improvement, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedImprovements.includes(index)
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleImprovementToggle(index)}
            >
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  {getImpactIcon(improvement.impact)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {improvement.category} Issue
                    </span>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        improvement.impact === 'High' ? 'bg-red-100 text-red-800' :
                        improvement.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {improvement.impact} Impact
                      </span>
                      <span className={`px-2 py-1 rounded-full ${
                        improvement.effort === 'High' ? 'bg-red-100 text-red-800' :
                        improvement.effort === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {improvement.effort} Effort
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{improvement.issue}</p>
                  <p className="text-sm text-blue-700 font-medium">
                    💡 {improvement.recommendation}
                  </p>
                </div>
                <div className="ml-3 mt-4">
                  <input
                    type="checkbox"
                    checked={selectedImprovements.includes(index)}
                    onChange={() => handleImprovementToggle(index)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automation Opportunities */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Automation Opportunities
        </h3>
        
        <div className="grid gap-4">
          {analysis.automationOpportunities?.slice(0, 3).map((opportunity, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {opportunity.stepDescription}
                </h4>
                <div className="flex items-center space-x-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    opportunity.feasibility === 'High' ? 'bg-green-100 text-green-800' :
                    opportunity.feasibility === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {opportunity.feasibility} Feasibility
                  </span>
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    Priority: {opportunity.priority}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Solution:</strong> {opportunity.automationSolution}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Time Savings:</span><br />
                  {opportunity.timeSavings}
                </div>
                <div>
                  <span className="font-medium">Frequency:</span><br />
                  {opportunity.frequency}
                </div>
                <div>
                  <span className="font-medium">Annual Savings:</span><br />
                  {opportunity.annualSavings}
                </div>
                <div>
                  <span className="font-medium">Tools:</span><br />
                  {opportunity.tools?.join(', ') || 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary">
          Go Back
        </button>
        <button
          onClick={async () => {
            setIsGenerating(true)
            try {
              await onProceedToRevision(selectedImprovements)
            } finally {
              setIsGenerating(false)
            }
          }}
          disabled={isGenerating}
          className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating Improved SOP...
            </>
          ) : (
            <>
              Generate Improved SOP
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default SOPFeedback