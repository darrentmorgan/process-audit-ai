import { useState } from 'react'
import { Download, ExternalLink, Play, Settings, CheckCircle, Clock, DollarSign, Zap, Cpu } from 'lucide-react'
import { 
  generateAutomationRecommendations
} from '../utils/automationTemplates'
// import AutomationGenerator from './AutomationGenerator' // Removed: Now showing recommendations instead

const AutomationTemplates = ({ automationOpportunities, sopData, processData, auditReportId, userId }) => {
  const [activeTab, setActiveTab] = useState('overview')
  // const [showAutomationGenerator, setShowAutomationGenerator] = useState(false) // Removed: Now showing recommendations

  if (!automationOpportunities || automationOpportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No automation opportunities identified.</p>
      </div>
    )
  }

  const automationRecommendations = generateAutomationRecommendations(automationOpportunities, sopData)

  const getPriorityColor = (priority) => {
    if (priority >= 80) return 'bg-red-100 text-red-800'
    if (priority >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getPriorityLabel = (priority) => {
    if (priority >= 80) return 'High'
    if (priority >= 50) return 'Medium'
    return 'Low'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Automation Templates Ready
        </h2>
        <p className="text-lg text-gray-600">
          One-click automation setup for your optimized SOP
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{automationSummary.totalAnnualSavings}</div>
          <div className="text-sm text-gray-600">Annual Savings</div>
        </div>
        <div className="card p-4 text-center">
          <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{automationSummary.totalTimeSavingsPerExecution}</div>
          <div className="text-sm text-gray-600">Time Saved Per Run</div>
        </div>
        <div className="card p-4 text-center">
          <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{automationSummary.automationCount}</div>
          <div className="text-sm text-gray-600">Automations</div>
        </div>
        <div className="card p-4 text-center">
          <CheckCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{automationSummary.roiTimeline}</div>
          <div className="text-sm text-gray-600">ROI Timeline</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Automation Overview
            </button>
            <button
              onClick={() => setActiveTab('generation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generation'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Generate n8n Workflow
            </button>
            <button
              onClick={() => setActiveTab('implementation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'implementation'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Implementation Guide
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Automation Opportunities</h3>
              <div className="space-y-4">
                {automationOpportunities.map((opportunity, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex-1">
                        {opportunity.stepDescription}
                      </h4>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(opportunity.priority)}`}>
                          {getPriorityLabel(opportunity.priority)} Priority
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Solution:</strong> {opportunity.automationSolution}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Time Savings:</span><br />
                        <span className="text-green-600">{opportunity.timeSavings}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Frequency:</span><br />
                        <span>{opportunity.frequency}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Annual Savings:</span><br />
                        <span className="text-green-600">{opportunity.annualSavings}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Tools:</span><br />
                        <span>{opportunity.tools?.join(', ') || 'TBD'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'generation' && (
          <div className="space-y-6">
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
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-700 mb-1">Implementation Ready</div>
                  <div className="text-sm text-green-600">Use platform recommendations above</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Implementation Guidance</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Choose platform based on your technical expertise and existing tools</li>
                <li>• Start with highest-impact, lowest-effort opportunities first</li>
                <li>• Consider pilot implementations before full deployment</li>
                <li>• Plan for user training and change management</li>
                <li>• Measure results and iterate on automation workflows</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'implementation' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Phased Implementation Plan</h3>
              <div className="space-y-6">
                {[implementationGuide.phase1, implementationGuide.phase2, implementationGuide.phase3]
                  .filter(phase => phase.items.length > 0)
                  .map((phase, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                        {index + 1}
                      </span>
                      {phase.title}
                    </h4>
                    <div className="space-y-3 ml-9">
                      {phase.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{item.task}</p>
                            <p className="text-sm text-gray-600 mt-1">{item.solution}</p>
                            <div className="flex items-center mt-2 text-xs text-gray-500 space-x-4">
                              <span>⏱️ {item.estimatedTime}</span>
                              <span>🔧 {item.tools?.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Implementation Tips</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Start with high-priority, low-effort automations</li>
                <li>• Test each automation thoroughly before going live</li>
                <li>• Keep manual backup processes during initial rollout</li>
                <li>• Train team members on new automated workflows</li>
                <li>• Monitor and measure results to demonstrate ROI</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Automation Generator Removed - Now showing platform recommendations instead */}
    </div>
  )
}

export default AutomationTemplates