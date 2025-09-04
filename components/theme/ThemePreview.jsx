import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Zap, BarChart3, Clock, CheckCircle, ArrowRight, Settings } from 'lucide-react'
import Logo from '../Logo'

const ThemePreview = () => {
  const { theme } = useTheme()
  const [activePreviewTab, setActivePreviewTab] = useState('landing')

  // Preview tabs
  const previewTabs = [
    { id: 'landing', label: 'Landing Page' },
    { id: 'app', label: 'Application' },
    { id: 'components', label: 'Components' }
  ]

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Preview Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Preview</h3>
            <p className="text-sm text-gray-500">See how your theme looks in different contexts</p>
          </div>
          
          {/* Preview Mode Indicator */}
          <div className="flex items-center space-x-3">
            {theme.isPreviewMode && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Preview Mode
              </span>
            )}
          </div>
        </div>

        {/* Preview Tabs */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            {previewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePreviewTab(tab.id)}
                className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                  activePreviewTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Landing Page Preview */}
          {activePreviewTab === 'landing' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Hero Section */}
              <div className="px-8 py-12 text-center" style={{ 
                background: `linear-gradient(135deg, var(--color-primary, ${theme.colors?.primary || '#4299e1'}) 0%, ${theme.colors?.secondary || '#38a169'} 100%)` 
              }}>
                <div className="mb-6">
                  {theme.assets?.logoUrl ? (
                    <img 
                      src={theme.assets.logoUrl} 
                      alt="Logo" 
                      className="h-12 mx-auto mb-4"
                    />
                  ) : (
                    <Logo className="h-12 mx-auto mb-4 text-white" />
                  )}
                </div>
                
                <h1 className="text-4xl font-bold text-white mb-4" style={{ 
                  fontFamily: theme.typography?.fontFamily 
                }}>
                  Transform Your Business Processes
                </h1>
                
                <p className="text-xl text-white opacity-90 mb-8" style={{ 
                  fontFamily: theme.typography?.fontFamily 
                }}>
                  AI-powered process audits and automation recommendations
                </p>
                
                <button 
                  className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  style={{ fontFamily: theme.typography?.fontFamily }}
                >
                  Get Started Free
                </button>
              </div>

              {/* Features Section */}
              <div className="px-8 py-12">
                <h2 className="text-3xl font-bold text-center mb-12" style={{ 
                  fontFamily: theme.typography?.fontFamily,
                  color: theme.colors?.text?.primary || '#2d3748'
                }}>
                  Key Features
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { icon: Zap, title: 'AI Analysis', desc: 'Smart process evaluation' },
                    { icon: BarChart3, title: 'ROI Insights', desc: 'Calculate potential savings' },
                    { icon: Clock, title: 'Quick Setup', desc: 'Results in minutes' }
                  ].map((feature, index) => (
                    <div key={index} className="text-center">
                      <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors?.primary || '#4299e1' }}
                      >
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2" style={{ 
                        fontFamily: theme.typography?.fontFamily,
                        color: theme.colors?.text?.primary || '#2d3748'
                      }}>
                        {feature.title}
                      </h3>
                      <p style={{ 
                        fontFamily: theme.typography?.fontFamily,
                        color: theme.colors?.text?.secondary || '#4a5568'
                      }}>
                        {feature.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Application Preview */}
          {activePreviewTab === 'app' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* App Header */}
              <div 
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ 
                  backgroundColor: theme.colors?.surface || '#f7fafc',
                  borderColor: theme.colors?.border || '#e2e8f0'
                }}
              >
                <div className="flex items-center space-x-3">
                  {theme.assets?.logoUrl ? (
                    <img src={theme.assets.logoUrl} alt="Logo" className="h-8" />
                  ) : (
                    <Logo className="h-8" style={{ color: theme.colors?.primary || '#4299e1' }} />
                  )}
                  <h1 className="text-lg font-semibold" style={{ 
                    fontFamily: theme.typography?.fontFamily,
                    color: theme.colors?.text?.primary || '#2d3748'
                  }}>
                    ProcessAudit AI
                  </h1>
                </div>
                <button 
                  className="p-2 rounded-lg hover:bg-gray-100"
                  style={{ color: theme.colors?.text?.secondary || '#4a5568' }}
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>

              {/* App Content */}
              <div className="p-6">
                {/* Step Indicator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    {['Input', 'Questions', 'Analysis', 'Report'].map((step, index) => (
                      <div key={step} className="flex flex-col items-center">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            index <= 2 ? 'text-white' : 'text-gray-400 bg-gray-200'
                          }`}
                          style={index <= 2 ? { 
                            backgroundColor: theme.colors?.primary || '#4299e1' 
                          } : {}}
                        >
                          {index + 1}
                        </div>
                        <span className="mt-2 text-sm font-medium" style={{ 
                          fontFamily: theme.typography?.fontFamily,
                          color: index <= 2 ? (theme.colors?.primary || '#4299e1') : '#9ca3af'
                        }}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Preview */}
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold mb-6" style={{ 
                    fontFamily: theme.typography?.fontFamily,
                    color: theme.colors?.text?.primary || '#2d3748'
                  }}>
                    Describe Your Process
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ 
                        fontFamily: theme.typography?.fontFamily,
                        color: theme.colors?.text?.secondary || '#4a5568'
                      }}>
                        Process Description
                      </label>
                      <textarea 
                        className="w-full h-32 px-3 py-2 border rounded-lg resize-none"
                        style={{ 
                          fontFamily: theme.typography?.fontFamily,
                          borderColor: theme.colors?.border || '#e2e8f0'
                        }}
                        placeholder="Describe your business process in detail..."
                      />
                    </div>
                    
                    <button 
                      className="w-full py-3 px-6 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
                      style={{ 
                        backgroundColor: theme.colors?.primary || '#4299e1',
                        fontFamily: theme.typography?.fontFamily
                      }}
                    >
                      Generate Questions
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Components Preview */}
          {activePreviewTab === 'components' && (
            <div className="space-y-6">
              {/* Buttons */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ 
                  fontFamily: theme.typography?.fontFamily,
                  color: theme.colors?.text?.primary || '#2d3748'
                }}>
                  Buttons
                </h3>
                
                <div className="flex space-x-4 flex-wrap gap-2">
                  <button 
                    className="px-4 py-2 text-white font-medium rounded-md hover:opacity-90"
                    style={{ 
                      backgroundColor: theme.colors?.primary || '#4299e1',
                      fontFamily: theme.typography?.fontFamily
                    }}
                  >
                    Primary Button
                  </button>
                  
                  <button 
                    className="px-4 py-2 text-white font-medium rounded-md hover:opacity-90"
                    style={{ 
                      backgroundColor: theme.colors?.secondary || '#38a169',
                      fontFamily: theme.typography?.fontFamily
                    }}
                  >
                    Secondary Button
                  </button>
                  
                  <button 
                    className="px-4 py-2 border font-medium rounded-md hover:bg-gray-50"
                    style={{ 
                      color: theme.colors?.text?.primary || '#2d3748',
                      borderColor: theme.colors?.border || '#e2e8f0',
                      fontFamily: theme.typography?.fontFamily
                    }}
                  >
                    Outline Button
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ 
                  fontFamily: theme.typography?.fontFamily,
                  color: theme.colors?.text?.primary || '#2d3748'
                }}>
                  Cards
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div 
                    className="p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: theme.colors?.surface || '#f7fafc',
                      borderColor: theme.colors?.border || '#e2e8f0'
                    }}
                  >
                    <div className="flex items-center mb-3">
                      <CheckCircle 
                        className="h-5 w-5 mr-2" 
                        style={{ color: theme.colors?.primary || '#4299e1' }}
                      />
                      <h4 className="font-semibold" style={{ 
                        fontFamily: theme.typography?.fontFamily,
                        color: theme.colors?.text?.primary || '#2d3748'
                      }}>
                        Sample Card
                      </h4>
                    </div>
                    <p style={{ 
                      fontFamily: theme.typography?.fontFamily,
                      color: theme.colors?.text?.secondary || '#4a5568'
                    }}>
                      This is a sample card component with themed styling.
                    </p>
                  </div>
                  
                  <div 
                    className="p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: theme.colors?.surface || '#f7fafc',
                      borderColor: theme.colors?.border || '#e2e8f0'
                    }}
                  >
                    <div className="flex items-center mb-3">
                      <BarChart3 
                        className="h-5 w-5 mr-2" 
                        style={{ color: theme.colors?.secondary || '#38a169' }}
                      />
                      <h4 className="font-semibold" style={{ 
                        fontFamily: theme.typography?.fontFamily,
                        color: theme.colors?.text?.primary || '#2d3748'
                      }}>
                        Another Card
                      </h4>
                    </div>
                    <p style={{ 
                      fontFamily: theme.typography?.fontFamily,
                      color: theme.colors?.text?.secondary || '#4a5568'
                    }}>
                      Cards automatically adapt to your theme colors and fonts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ 
                  fontFamily: theme.typography?.fontFamily,
                  color: theme.colors?.text?.primary || '#2d3748'
                }}>
                  Typography
                </h3>
                
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold" style={{ 
                    fontFamily: theme.typography?.fontFamily,
                    color: theme.colors?.text?.primary || '#2d3748'
                  }}>
                    Heading 1
                  </h1>
                  <h2 className="text-2xl font-semibold" style={{ 
                    fontFamily: theme.typography?.fontFamily,
                    color: theme.colors?.text?.primary || '#2d3748'
                  }}>
                    Heading 2
                  </h2>
                  <h3 className="text-xl font-medium" style={{ 
                    fontFamily: theme.typography?.fontFamily,
                    color: theme.colors?.text?.primary || '#2d3748'
                  }}>
                    Heading 3
                  </h3>
                  <p style={{ 
                    fontFamily: theme.typography?.fontFamily,
                    color: theme.colors?.text?.secondary || '#4a5568'
                  }}>
                    This is body text that shows how your chosen font family looks in paragraphs. 
                    It adapts to your theme settings automatically.
                  </p>
                  <p className="text-sm" style={{ 
                    fontFamily: theme.typography?.fontFamily,
                    color: theme.colors?.text?.muted || '#718096'
                  }}>
                    This is smaller text often used for captions and secondary information.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ThemePreview