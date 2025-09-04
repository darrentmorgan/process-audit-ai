import { useState, useRef } from 'react'
import { Upload, X, Eye, AlertCircle } from 'lucide-react'
import { isValidUrl } from '../../lib/themeUtils'

const AssetUploader = ({ 
  label, 
  currentUrl, 
  onChange, 
  accept = 'image/*', 
  description,
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false 
}) => {
  const [uploadMode, setUploadMode] = useState('url')
  const [urlInput, setUrlInput] = useState(currentUrl || '')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(currentUrl)
  const fileInputRef = useRef(null)

  const handleUrlChange = (e) => {
    const url = e.target.value
    setUrlInput(url)
    setError(null)
    
    if (url && isValidUrl(url)) {
      setPreviewUrl(url)
      onChange(url)
    } else if (!url) {
      setPreviewUrl(null)
      onChange(null)
    }
  }

  const handleUrlBlur = () => {
    if (urlInput && !isValidUrl(urlInput)) {
      setError('Please enter a valid URL')
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError(null)

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    // Validate file type
    const acceptedTypes = accept.split(',').map(type => type.trim())
    const isValidType = acceptedTypes.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/')
      if (type.includes('*')) return file.type.startsWith(type.replace('*', ''))
      return file.type === type
    })

    if (!isValidType) {
      setError(`Please select a valid file type: ${accept}`)
      return
    }

    try {
      setIsUploading(true)
      
      // For demo purposes, we'll create a data URL
      // In production, you'd upload to your storage service
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        setPreviewUrl(dataUrl)
        onChange(dataUrl)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setError('Failed to read file')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
      
    } catch (err) {
      setError('Failed to upload file')
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setUrlInput('')
    onChange(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      {/* Upload Mode Toggle */}
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            name={`upload-mode-${label}`}
            value="url"
            checked={uploadMode === 'url'}
            onChange={(e) => setUploadMode(e.target.value)}
            disabled={disabled}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">URL</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name={`upload-mode-${label}`}
            value="upload"
            checked={uploadMode === 'upload'}
            onChange={(e) => setUploadMode(e.target.value)}
            disabled={disabled}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Upload</span>
        </label>
      </div>

      {/* URL Input Mode */}
      {uploadMode === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            value={urlInput}
            onChange={handleUrlChange}
            onBlur={handleUrlBlur}
            placeholder="https://example.com/image.png"
            disabled={disabled}
            className={`
              block w-full px-3 py-2 border rounded-md shadow-sm text-sm
              ${error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
              ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
            `}
          />
        </div>
      )}

      {/* File Upload Mode */}
      {uploadMode === 'upload' && (
        <div className="space-y-2">
          <div
            onClick={!disabled ? triggerFileSelect : undefined}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-colors duration-200
              ${disabled 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                : 'border-gray-300 hover:border-gray-400 bg-white'
              }
            `}
          >
            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500">Uploading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm text-gray-600">
                    Click to select file or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    {accept} (max {Math.round(maxSize / 1024 / 1024)}MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview */}
      {previewUrl && !error && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Preview</span>
            <div className="flex space-x-2">
              <button
                onClick={() => window.open(previewUrl, '_blank')}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="View full size"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={handleRemove}
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="max-w-full max-h-32 object-contain mx-auto"
              onError={() => setError('Failed to load image')}
            />
          </div>
          
          <div className="text-xs text-gray-500">
            <div className="truncate">
              <strong>URL:</strong> {previewUrl}
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      {label === 'Logo' && (
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="font-medium text-blue-800 mb-1">Logo Guidelines:</p>
          <ul className="space-y-1 text-blue-700">
            <li>• Recommended: SVG format for scalability</li>
            <li>• PNG with transparent background works well</li>
            <li>• Optimize for both light and dark backgrounds</li>
            <li>• Maximum recommended height: 80px</li>
          </ul>
        </div>
      )}

      {label === 'Favicon' && (
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="font-medium text-blue-800 mb-1">Favicon Guidelines:</p>
          <ul className="space-y-1 text-blue-700">
            <li>• Recommended: 32x32px or 16x16px</li>
            <li>• ICO format provides best browser support</li>
            <li>• PNG format also widely supported</li>
            <li>• Keep design simple for small size</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default AssetUploader