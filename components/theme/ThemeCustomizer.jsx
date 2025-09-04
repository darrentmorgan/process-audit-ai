import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  Palette, 
  Type, 
  Image, 
  Download, 
  Upload, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Save,
  X,
  Check,
  AlertTriangle
} from 'lucide-react'
import ColorPicker from './ColorPicker'
import FontSelector from './FontSelector'
import AssetUploader from './AssetUploader'
import ThemePreview from './ThemePreview'

const ThemeCustomizer = ({ isOpen, onClose }) => {
  const {
    theme,
    defaultTheme,
    isPreviewMode,
    updateTheme,
    startPreview,
    endPreview,
    applyPreview,
    resetTheme,
    exportTheme,
    importTheme
  } = useTheme()

  const [activeTab, setActiveTab] = useState('colors')
  const [localChanges, setLocalChanges] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(Object.keys(localChanges).length > 0)
  }, [localChanges])

  // Clear messages after timeout
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, successMessage])

  const handleColorChange = (colorKey, value) => {
    const newChanges = {
      ...localChanges,
      colors: {
        ...localChanges.colors,
        [colorKey]: value
      }
    }
    setLocalChanges(newChanges)
    startPreview(newChanges)
  }

  const handleFontChange = (fontKey, value) => {
    const newChanges = {
      ...localChanges,
      typography: {
        ...localChanges.typography,
        [fontKey]: value
      }
    }
    setLocalChanges(newChanges)
    startPreview(newChanges)
  }

  const handleAssetChange = (assetKey, value) => {
    const newChanges = {
      ...localChanges,
      assets: {
        ...localChanges.assets,
        [assetKey]: value
      }
    }
    setLocalChanges(newChanges)
    startPreview(newChanges)
  }

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (isPreviewMode) {
        await applyPreview()
      } else {
        await updateTheme(localChanges)
      }
      
      setLocalChanges({})
      setSuccessMessage('Theme updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to save theme changes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscardChanges = () => {
    if (isPreviewMode) {
      endPreview()
    }
    setLocalChanges({})
    setError(null)
  }

  const handleResetTheme = async () => {
    if (window.confirm('Are you sure you want to reset to the default theme? This action cannot be undone.')) {
      try {
        setIsLoading(true)
        await resetTheme()
        setLocalChanges({})
        setSuccessMessage('Theme reset to default successfully!')
      } catch (err) {
        setError(err.message || 'Failed to reset theme')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleExportTheme = () => {
    try {
      const themeData = exportTheme()
      const blob = new Blob([themeData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'theme.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSuccessMessage('Theme exported successfully!')
    } catch (err) {
      setError('Failed to export theme')
    }
  }

  const handleImportTheme = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setIsLoading(true)
      const text = await file.text()
      await importTheme(text)
      setSuccessMessage('Theme imported successfully!')
    } catch (err) {
      setError(err.message || 'Failed to import theme')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'assets', label: 'Assets', icon: Image }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-6xl bg-white shadow-xl">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900">Theme Customizer</h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mx-6 mt-4 rounded-md bg-red-50 p-3">
                <div className="flex">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <p className="ml-2 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mx-6 mt-4 rounded-md bg-green-50 p-3">
                <div className="flex">
                  <Check className="h-4 w-4 text-green-400" />
                  <p className="ml-2 text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 border-b-2 py-4 px-1 text-center text-sm font-medium ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="mx-auto h-5 w-5 mb-1" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Color Palette</h3>
                  
                  <div className="space-y-4">
                    <ColorPicker
                      label="Primary Color"
                      value={theme.colors?.primary || defaultTheme.colors.primary}
                      onChange={(value) => handleColorChange('primary', value)}
                      description="Main brand color used for buttons, links, and highlights"
                    />
                    
                    <ColorPicker
                      label="Secondary Color"
                      value={theme.colors?.secondary || defaultTheme.colors.secondary}
                      onChange={(value) => handleColorChange('secondary', value)}
                      description="Secondary brand color for accents and highlights"
                    />
                    
                    <ColorPicker
                      label="Background Color"
                      value={theme.colors?.background || defaultTheme.colors.background}
                      onChange={(value) => handleColorChange('background', value)}
                      description="Main background color"
                    />
                    
                    <ColorPicker
                      label="Surface Color"
                      value={theme.colors?.surface || defaultTheme.colors.surface}
                      onChange={(value) => handleColorChange('surface', value)}
                      description="Card and panel background color"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'typography' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Typography</h3>
                  
                  <FontSelector
                    value={theme.typography?.fontFamily || defaultTheme.typography.fontFamily}
                    onChange={(value) => handleFontChange('fontFamily', value)}
                  />
                </div>
              )}

              {activeTab === 'assets' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Brand Assets</h3>
                  
                  <AssetUploader
                    label="Logo"
                    currentUrl={theme.assets?.logoUrl}
                    onChange={(url) => handleAssetChange('logoUrl', url)}
                    accept="image/*"
                    description="Your organization's logo (recommended: SVG or PNG)"
                  />
                  
                  <AssetUploader
                    label="Favicon"
                    currentUrl={theme.assets?.faviconUrl}
                    onChange={(url) => handleAssetChange('faviconUrl', url)}
                    accept="image/x-icon,image/png"
                    description="Browser tab icon (recommended: ICO or PNG, 32x32px)"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-6 space-y-3">
              {hasUnsavedChanges && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveChanges}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    onClick={handleDiscardChanges}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleExportTheme}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                
                <label className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportTheme}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleResetTheme}
                disabled={isLoading}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1">
            <div className="h-full overflow-y-auto">
              <ThemePreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeCustomizer