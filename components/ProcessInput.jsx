import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, X, FileCheck } from 'lucide-react'

// SOP Structure Detection
const detectSOPStructure = (content) => {
  if (!content) return { isSOP: false }
  
  const text = content.toLowerCase()
  const sopIndicators = [
    'standard operating procedure',
    'sop',
    'procedure',
    'step 1',
    'step 2', 
    'step:',
    'objective:',
    'purpose:',
    'scope:',
    'responsibility',
    'responsibilities:',
    'materials needed',
    'equipment needed',
    'safety precautions',
    'process steps',
    'procedure steps'
  ]
  
  const foundIndicators = sopIndicators.filter(indicator => text.includes(indicator))
  const stepPattern = /step\s*\d+/gi
  const steps = content.match(stepPattern) || []
  
  const isSOP = foundIndicators.length >= 3 || steps.length >= 3
  
  return {
    isSOP,
    confidence: isSOP ? Math.min(100, (foundIndicators.length * 20) + (steps.length * 10)) : 0,
    indicators: foundIndicators,
    stepCount: steps.length,
    hasObjective: text.includes('objective') || text.includes('purpose'),
    hasResponsibilities: text.includes('responsibility') || text.includes('responsibilities'),
    hasSteps: steps.length > 0
  }
}

const ProcessInput = ({ onNext, onFileUpload }) => {
  const [processDescription, setProcessDescription] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [sopStructure, setSopStructure] = useState(null)
  const fileInputRef = useRef(null)

  // Automatically detect if content is an SOP when content changes
  const detectAndSetSOPStructure = (content) => {
    if (content && content.length > 50) { // Only detect if meaningful content
      const structure = detectSOPStructure(content)
      setSopStructure(structure)
      console.log('🔍 Auto-detected content type:', structure.isSOP ? 'SOP' : 'General Process', structure)
    } else {
      setSopStructure(null)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return

    console.log('📁 File Upload: Starting file processing', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    })

    // Validate file type
    const allowedTypes = [
      'text/plain', 
      'text/markdown', 
      'text/x-markdown', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ File Upload: Invalid file type:', file.type)
      setUploadError('Please upload a PDF, DOC, DOCX, TXT, or MD file')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ File Upload: File too large:', file.size, 'bytes')
      setUploadError('File size must be less than 10MB')
      return
    }

    console.log('✅ File Upload: File validation passed')
    setIsUploading(true)
    setUploadError('')

    try {
      console.log('🔄 File Upload: Converting file to base64...')
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const fileData = e.target.result.split(',')[1] // Remove data:mime;base64, prefix
        console.log('📄 File Upload: Base64 conversion complete, length:', fileData.length)

        console.log('📤 File Upload: Sending to /api/process-file')
        const response = await fetch('/api/process-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: fileData,
            fileName: file.name,
            fileType: file.type
          }),
        })

        console.log('📥 File Upload: Response status:', response.status)

        if (!response.ok) {
          throw new Error(`Failed to process file: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ File Upload: File processed successfully', {
          contentLength: result.content?.length || 0,
          fileName: result.fileName
        })

        setUploadedFile({
          name: file.name,
          content: result.content
        })

        // Auto-detect if this is an SOP based on content structure
        detectAndSetSOPStructure(result.content)

        if (onFileUpload) {
          onFileUpload(result.content)
        }

        setIsUploading(false)
      }

      reader.onerror = () => {
        console.error('❌ File Upload: FileReader error')
        setUploadError('Failed to read file')
        setIsUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('❌ File Upload: Error during upload:', error)
      setUploadError('Failed to upload file. Please try again.')
      setIsUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNext = async () => {
    if (!processDescription.trim() && !uploadedFile) {
      setUploadError('Please provide a process description or upload a file')
      return
    }

    setIsSubmitting(true)
    setUploadError('')

    console.log('🚀 ProcessInput: Starting submission process')
    console.log('📝 Process Description:', processDescription.trim())
    console.log('📄 File Content:', uploadedFile ? `${uploadedFile.content.length} characters` : 'None')

    try {
      // Small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('✅ ProcessInput: Calling onNext with data')
      
      // Auto-detect content type if not already detected
      let finalSopStructure = sopStructure
      const content = uploadedFile?.content || processDescription.trim()
      
      if (!finalSopStructure && content) {
        finalSopStructure = detectSOPStructure(content)
        console.log('🔍 ProcessInput: Final SOP auto-detection:', finalSopStructure)
      }
      
      const isSOPContent = finalSopStructure && finalSopStructure.isSOP
      
      onNext({
        processDescription: processDescription.trim(),
        fileContent: uploadedFile?.content || '',
        inputType: isSOPContent ? 'sop' : 'process',
        sopStructure: finalSopStructure,
        isSOPAnalysis: isSOPContent
      })
    } catch (error) {
      console.error('❌ ProcessInput: Error during submission:', error)
      setUploadError('Failed to process submission. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card max-w-3xl mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          Describe Your Process
        </h2>
        <p className="text-base sm:text-lg text-gray-600 px-2 sm:px-0 leading-relaxed">
          Tell us about the business process you&apos;d like to optimize. You can describe it manually or upload a document. 
          We&apos;ll automatically detect if it&apos;s a Standard Operating Procedure or general process.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* File Upload Section - Mobile Optimized */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3 px-1">
            Upload Process Document (Optional)
          </label>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors duration-200 touch-manipulation
              ${dragActive 
                ? 'border-primary bg-blue-50' 
                : uploadedFile 
                  ? 'border-secondary bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400 active:border-primary'
              }
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-manipulation"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
              disabled={isUploading}
              style={{ minHeight: '44px' }} // iOS touch target size
            />

            {isUploading ? (
              <div className="flex flex-col items-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mb-2"></div>
                <p className="text-sm text-gray-600">Processing file...</p>
              </div>
            ) : uploadedFile ? (
              <div className="flex flex-col sm:flex-row items-center justify-center p-2">
                <div className="flex items-center mb-2 sm:mb-0">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-secondary mr-3 flex-shrink-0" />
                  <div className="text-center sm:text-left">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">{uploadedFile.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">File uploaded successfully</p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="ml-0 sm:ml-4 mt-2 sm:mt-0 p-2 text-gray-400 hover:text-gray-600 active:text-gray-800 touch-manipulation"
                  style={{ minHeight: '44px', minWidth: '44px' }} // iOS touch target
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="py-2">
                <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400 mb-3 sm:mb-4" />
                <div>
                  <p className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                    <span className="hidden sm:inline">Drag and drop your file here</span>
                    <span className="sm:hidden">Tap to upload your file</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="hidden sm:inline">or </span>click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports PDF, DOC, DOCX, TXT, MD (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-3 flex items-start text-red-600 px-2 sm:px-0">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm leading-relaxed">{uploadError}</span>
            </div>
          )}
          
          {/* SOP Structure Detection Feedback - Mobile Optimized */}
          {sopStructure && sopStructure.isSOP && (
            <div className="mt-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md mx-2 sm:mx-0">
              <div className="flex items-center text-green-800 mb-2">
                <FileCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium">SOP Structure Detected</span>
              </div>
              <div className="text-xs sm:text-sm text-green-700 space-y-1">
                <p>• {sopStructure.stepCount} procedure steps identified</p>
                {sopStructure.hasObjective && <p>• Objective/Purpose section found</p>}
                {sopStructure.hasResponsibilities && <p>• Responsibilities section found</p>}
                <p>• Confidence: {sopStructure.confidence}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Manual Description Section - Mobile Optimized */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3 px-1">
            Process Description
          </label>
          <textarea
            className="textarea-field text-base sm:rows-6 rows-8" // Larger text for mobile
            rows={8} // More rows on mobile for better UX
            placeholder="Describe your business process in detail. Include what steps are involved, who does what, what tools you use, and any pain points you experience. If it's a Standard Operating Procedure, we'll automatically detect it!"
            value={processDescription}
            onChange={(e) => {
              setProcessDescription(e.target.value)
              // Auto-detect content type as user types
              detectAndSetSOPStructure(e.target.value)
            }}
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
          />
          <p className="mt-2 text-sm text-gray-500 px-1 sm:px-0 leading-relaxed">
            The more detail you provide, the better we can analyze your process and identify automation opportunities.
          </p>
          
          {/* SOP Detection Indicator - Mobile Optimized */}
          {sopStructure && processDescription.length > 50 && (
            <div className={`mt-3 p-3 sm:p-4 rounded-lg border mx-2 sm:mx-0 ${
              sopStructure.isSOP 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center">
                <FileCheck className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 ${
                  sopStructure.isSOP ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <span className={`font-medium text-sm sm:text-base ${
                  sopStructure.isSOP ? 'text-blue-800' : 'text-gray-700'
                }`}>
                  {sopStructure.isSOP ? 'SOP Structure Detected' : 'General Process Detected'}
                </span>
              </div>
              {sopStructure.isSOP && (
                <div className="mt-2 text-xs sm:text-sm text-blue-700 space-y-1">
                  <p>• {sopStructure.stepCount || 0} procedure steps identified</p>
                  <p>• {sopStructure.hasObjective ? 'Objective/Purpose section found' : 'No clear purpose section'}</p>
                  <p>• {sopStructure.hasResponsibilities ? 'Responsibilities section found' : 'No responsibilities section'}</p>
                  <p>• Confidence: {sopStructure.confidence}%</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="flex justify-center sm:justify-end pt-6 border-t border-gray-200">
          <button
            onClick={handleNext}
            disabled={(!processDescription.trim() && !uploadedFile) || isSubmitting}
            className="btn-primary w-full sm:w-auto py-3 sm:py-2 text-base sm:text-sm font-semibold"
            style={{ minHeight: '44px' }} // iOS touch target
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="text-sm sm:text-base">Processing...</span>
              </div>
            ) : (
              <span className="text-sm sm:text-base">Continue to Questions</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProcessInput