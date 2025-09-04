import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext'
import { Palette, Settings, Eye, Download, Upload, RotateCcw, Save } from 'lucide-react'
import ThemeCustomizer from './ThemeCustomizer'

const ThemeManager = () => {
  const { organization, isOrgAdmin } = useUnifiedAuth()
  const { 
    theme, 
    isLoading, 
    error, 
    isPreviewMode,
    endPreview,
    applyPreview,
    exportTheme,
    resetTheme
  } = useTheme()
  
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)

  // Only show for organization admins
  if (!organization || !isOrgAdmin) {
    return null
  }

  const handleExportTheme = () => {
    try {
      const themeData = exportTheme()
      const blob = new Blob([themeData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${organization.slug || 'organization'}-theme.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export theme:', err)
    }
  }

  const handleResetTheme = async () => {
    if (window.confirm('Are you sure you want to reset to the default theme? This action cannot be undone.')) {
      try {
        await resetTheme()
      } catch (err) {
        console.error('Failed to reset theme:', err)
      }
    }
  }

  return (
    <>
      {/* Floating Theme Manager Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {/* Preview Mode Actions */}
          {isPreviewMode && (
            <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-3 mb-2 min-w-[200px]">
              <div className="text-sm font-medium text-gray-900 mb-3">Preview Mode</div>
              <div className="space-y-2">
                <button
                  onClick={applyPreview}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Apply Changes
                </button>
                <button
                  onClick={endPreview}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions Menu */}
          {showQuickActions && !isPreviewMode && (
            <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 mb-2 min-w-[180px]">
              <button
                onClick={() => {
                  setShowCustomizer(true)
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Palette className="h-4 w-4 mr-3" />
                Customize Theme
              </button>
              
              <button
                onClick={() => {
                  handleExportTheme()
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Download className="h-4 w-4 mr-3" />
                Export Theme
              </button>
              
              <hr className="my-2" />
              
              <button
                onClick={() => {
                  handleResetTheme()
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <RotateCcw className="h-4 w-4 mr-3" />
                Reset to Default
              </button>
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={() => {
              if (isPreviewMode) {
                // In preview mode, clicking shows preview actions
                return
              } else {
                setShowQuickActions(!showQuickActions)
              }
            }}
            className={`
              w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200
              ${isPreviewMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }
            `}
            title={isPreviewMode ? 'Preview Mode Active' : 'Theme Settings'}
          >
            {isPreviewMode ? (
              <Eye className="h-6 w-6" />
            ) : (
              <Settings className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Theme Customizer Modal */}
      {showCustomizer && (
        <ThemeCustomizer
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
        />
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed bottom-6 left-6 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 z-40">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm text-gray-700">Updating theme...</span>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="fixed top-6 right-6 bg-red-50 border border-red-200 rounded-lg p-4 z-40 max-w-md">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Theme Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Theme Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-6 left-6 bg-gray-900 text-white rounded-lg p-3 text-xs z-30 max-w-sm">
          <div className="font-semibold mb-2">Theme Debug Info</div>
          <div className="space-y-1 opacity-75">
            <div>Primary: <span className="font-mono">{theme.colors?.primary || 'default'}</span></div>
            <div>Font: <span className="font-mono">{theme.typography?.fontFamily ? 'custom' : 'default'}</span></div>
            <div>Logo: <span className="font-mono">{theme.assets?.logoUrl ? 'custom' : 'default'}</span></div>
            <div>Preview: <span className="font-mono">{isPreviewMode ? 'active' : 'inactive'}</span></div>
          </div>
        </div>
      )}
    </>
  )
}

export default ThemeManager