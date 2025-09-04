import { useState, useRef, useEffect } from 'react'
import { hexToRgb, isValidColor, getAccessibleTextColor } from '../../lib/themeUtils'

const ColorPicker = ({ 
  label, 
  value, 
  onChange, 
  description,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || '#4299e1')
  const [isValid, setIsValid] = useState(true)
  const pickerRef = useRef(null)

  // Predefined color palette
  const colorPalette = [
    '#4299e1', // Blue
    '#38a169', // Green
    '#ed8936', // Orange
    '#e53e3e', // Red
    '#805ad5', // Purple
    '#d69e2e', // Yellow
    '#319795', // Teal
    '#e91e63', // Pink
    '#00bcd4', // Cyan
    '#ff9800', // Amber
    '#9c27b0', // Dark Purple
    '#607d8b', // Blue Grey
  ]

  useEffect(() => {
    setInputValue(value || '#4299e1')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    const valid = isValidColor(newValue)
    setIsValid(valid)
    
    if (valid) {
      onChange(newValue)
    }
  }

  const handleColorSelect = (color) => {
    setInputValue(color)
    setIsValid(true)
    onChange(color)
    setIsOpen(false)
  }

  const handleInputBlur = () => {
    if (!isValid) {
      // Revert to last valid value
      setInputValue(value || '#4299e1')
      setIsValid(true)
    }
  }

  const currentColor = isValid ? inputValue : (value || '#4299e1')
  const textColor = getAccessibleTextColor(currentColor)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      <div className="relative" ref={pickerRef}>
        <div className="flex items-center space-x-3">
          {/* Color Preview */}
          <button
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              w-10 h-10 rounded-md border-2 border-gray-300 shadow-sm
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'}
              ${!isValid ? 'border-red-300' : ''}
            `}
            style={{ backgroundColor: currentColor }}
            title={`Click to change ${label.toLowerCase()}`}
          >
            <span className="sr-only">Select color</span>
          </button>
          
          {/* Hex Input */}
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={disabled}
              placeholder="#4299e1"
              className={`
                block w-full px-3 py-2 border rounded-md shadow-sm text-sm
                ${isValid 
                  ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500' 
                  : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                }
                ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
              `}
            />
            {!isValid && (
              <p className="mt-1 text-xs text-red-600">
                Please enter a valid color (hex, rgb, or hsl)
              </p>
            )}
          </div>
        </div>
        
        {/* Color Picker Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-10 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Quick Colors</h4>
              
              {/* Color Palette Grid */}
              <div className="grid grid-cols-6 gap-2">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`
                      w-8 h-8 rounded border-2 hover:scale-110 transition-transform
                      ${currentColor === color ? 'border-gray-600' : 'border-gray-300'}
                    `}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    <span className="sr-only">{color}</span>
                  </button>
                ))}
              </div>
              
              {/* Custom Color Input */}
              <div className="border-t pt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Custom Color
                </label>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                />
              </div>
              
              {/* Color Info */}
              <div className="border-t pt-3 text-xs text-gray-500">
                <div className="space-y-1">
                  <div>Hex: {currentColor}</div>
                  {(() => {
                    const rgb = hexToRgb(currentColor)
                    return rgb ? (
                      <div>RGB: {rgb.r}, {rgb.g}, {rgb.b}</div>
                    ) : null
                  })()}
                  <div 
                    className="inline-block px-2 py-1 rounded text-xs"
                    style={{ 
                      backgroundColor: currentColor, 
                      color: textColor 
                    }}
                  >
                    Sample Text
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ColorPicker