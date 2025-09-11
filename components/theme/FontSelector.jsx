import { useState, useEffect } from 'react'
import { isValidFontFamily } from '../../lib/themeUtils'

const FontSelector = ({ value, onChange, disabled = false }) => {
  const [customFont, setCustomFont] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog')

  // Google Fonts selection
  const googleFonts = [
    { name: 'Inter', value: '"Inter", sans-serif', category: 'Sans Serif' },
    { name: 'Roboto', value: '"Roboto", sans-serif', category: 'Sans Serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif', category: 'Sans Serif' },
    { name: 'Lato', value: '"Lato", sans-serif', category: 'Sans Serif' },
    { name: 'Montserrat', value: '"Montserrat", sans-serif', category: 'Sans Serif' },
    { name: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif', category: 'Sans Serif' },
    { name: 'Nunito', value: '"Nunito", sans-serif', category: 'Sans Serif' },
    { name: 'Poppins', value: '"Poppins", sans-serif', category: 'Sans Serif' },
    { name: 'Playfair Display', value: '"Playfair Display", serif', category: 'Serif' },
    { name: 'Merriweather', value: '"Merriweather", serif', category: 'Serif' },
    { name: 'Lora', value: '"Lora", serif', category: 'Serif' },
    { name: 'PT Serif', value: '"PT Serif", serif', category: 'Serif' },
    { name: 'Fira Code', value: '"Fira Code", monospace', category: 'Monospace' },
    { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace', category: 'Monospace' },
    { name: 'Source Code Pro', value: '"Source Code Pro", monospace', category: 'Monospace' },
  ]

  // System fonts
  const systemFonts = [
    { name: 'System Default', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', category: 'System' },
    { name: 'San Francisco (macOS)', value: '-apple-system, BlinkMacSystemFont, sans-serif', category: 'System' },
    { name: 'Segoe UI (Windows)', value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', category: 'System' },
    { name: 'Roboto (Android)', value: '"Roboto", "Droid Sans", sans-serif', category: 'System' },
    { name: 'Arial', value: 'Arial, Helvetica, sans-serif', category: 'System' },
    { name: 'Georgia', value: 'Georgia, "Times New Roman", serif', category: 'System' },
    { name: 'Courier New', value: '"Courier New", Courier, monospace', category: 'System' },
  ]

  const allFonts = [...systemFonts, ...googleFonts]
  
  // Group fonts by category
  const fontsByCategory = allFonts.reduce((acc, font) => {
    if (!acc[font.category]) acc[font.category] = []
    acc[font.category].push(font)
    return acc
  }, {})

  useEffect(() => {
    // Check if current value is a custom font
    const isKnownFont = allFonts.some(font => font.value === value)
    if (!isKnownFont && value) {
      setIsCustomMode(true)
      setCustomFont(value)
    }
  }, [value])

  const handleFontChange = (fontValue) => {
    if (fontValue === 'custom') {
      setIsCustomMode(true)
    } else {
      setIsCustomMode(false)
      onChange(fontValue)
    }
  }

  const handleCustomFontChange = (e) => {
    const newFont = e.target.value
    setCustomFont(newFont)
    
    if (isValidFontFamily(newFont)) {
      onChange(newFont)
    }
  }

  const loadGoogleFont = (fontFamily) => {
    // Extract font name for Google Fonts API
    const fontName = fontFamily.replace(/"/g, '').split(',')[0]
    const googleFont = googleFonts.find(f => f.name === fontName)
    
    if (googleFont && !document.querySelector(`link[href*="${fontName}"]`)) {
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
  }

  const currentFontValue = isCustomMode ? customFont : value
  const selectedFont = allFonts.find(font => font.value === value)

  // Load Google Font if needed
  useEffect(() => {
    if (selectedFont && selectedFont.category !== 'System') {
      loadGoogleFont(selectedFont.value)
    }
  }, [selectedFont])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Font Family
        </label>
        
        {/* Font Selection */}
        <div className="space-y-3">
          {!isCustomMode ? (
            <select
              value={value || ''}
              onChange={(e) => handleFontChange(e.target.value)}
              disabled={disabled}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:border-blue-500 focus:ring-blue-500 text-sm
                ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
              `}
            >
              <option value="">Select a font...</option>
              
              {Object.entries(fontsByCategory).map(([category, fonts]) => (
                <optgroup key={category} label={category}>
                  {fonts.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              
              <option value="custom">Custom Font...</option>
            </select>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={customFont}
                onChange={handleCustomFontChange}
                placeholder="Enter font family (e.g., 'Custom Font', sans-serif)"
                disabled={disabled}
                className={`
                  block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 text-sm
                  ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
                `}
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsCustomMode(false)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Choose from list
                </button>
                <span className="text-gray-300">|</span>
                <span className="text-xs text-gray-500">
                  {isValidFontFamily(customFont) ? '✓ Valid' : '✗ Invalid font family'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Preview
        </label>
        
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {/* Preview Text Input */}
          <input
            type="text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="w-full mb-3 px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="Enter preview text..."
          />
          
          {/* Font Preview */}
          <div className="space-y-3">
            <div
              style={{ fontFamily: currentFontValue }}
              className="text-2xl font-bold text-gray-900"
            >
              {previewText}
            </div>
            
            <div
              style={{ fontFamily: currentFontValue }}
              className="text-lg text-gray-700"
            >
              {previewText}
            </div>
            
            <div
              style={{ fontFamily: currentFontValue }}
              className="text-base text-gray-600"
            >
              {previewText}
            </div>
            
            <div
              style={{ fontFamily: currentFontValue }}
              className="text-sm text-gray-500"
            >
              {previewText}
            </div>
          </div>
        </div>

        {/* Font Information */}
        {selectedFont && (
          <div className="text-xs text-gray-500 space-y-1">
            <div><strong>Font:</strong> {selectedFont.name}</div>
            <div><strong>Category:</strong> {selectedFont.category}</div>
            <div><strong>CSS:</strong> <code className="bg-gray-100 px-1 rounded">{selectedFont.value}</code></div>
          </div>
        )}
      </div>

      {/* Font Loading Instructions */}
      {isCustomMode && (
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="font-medium text-blue-800 mb-1">Custom Font Instructions:</p>
          <ul className="space-y-1 text-blue-700">
            <li>• Ensure the font is loaded via CSS or web font service</li>
            <li>• Include fallback fonts (e.g., &apos;&quot;My Font&quot;, Arial, sans-serif&apos;)</li>
            <li>• Test across different devices and browsers</li>
          </ul>
        </div>
      )}

      {/* Google Fonts Note */}
      {selectedFont?.category !== 'System' && !isCustomMode && (
        <div className="text-xs text-gray-500 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700">
            <strong>Google Font:</strong> This font will be automatically loaded from Google Fonts.
          </p>
        </div>
      )}
    </div>
  )
}

export default FontSelector