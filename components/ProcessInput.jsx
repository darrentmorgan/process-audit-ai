import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, X } from 'lucide-react'

const ProcessInput = ({ onNext, onFileUpload }) => {
  const [processDescription, setProcessDescription] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (file) => {
    if (!file) return

    console.log('📁 File Upload: Starting file processing', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    })

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ File Upload: Invalid file type:', file.type)
      setUploadError('Please upload a PDF, DOC, DOCX, or TXT file')
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
      onNext({
        processDescription: processDescription.trim(),
        fileContent: uploadedFile?.content || ''
      })
    } catch (error) {
      console.error('❌ ProcessInput: Error during submission:', error)
      setUploadError('Failed to process submission. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Describe Your Process
        </h2>
        <p className="text-lg text-gray-600">
          Tell us about the business process you'd like to optimize. You can describe it manually or upload a document.
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Upload Process Document (Optional)
          </label>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200
              ${dragActive 
                ? 'border-primary bg-blue-50' 
                : uploadedFile 
                  ? 'border-secondary bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
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
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <p className="text-sm text-gray-600">Processing file...</p>
              </div>
            ) : uploadedFile ? (
              <div className="flex items-center justify-center">
                <FileText className="w-8 h-8 text-secondary mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">File uploaded successfully</p>
                </div>
                <button
                  onClick={removeFile}
                  className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports PDF, DOC, DOCX, TXT (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-3 flex items-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}
        </div>

        {/* Manual Description Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Process Description
          </label>
          <textarea
            className="textarea-field"
            rows={6}
            placeholder="Describe your business process in detail. Include what steps are involved, who does what, what tools you use, and any pain points you experience..."
            value={processDescription}
            onChange={(e) => setProcessDescription(e.target.value)}
          />
          <p className="mt-2 text-sm text-gray-500">
            The more detail you provide, the better we can analyze your process and identify automation opportunities.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={handleNext}
            disabled={(!processDescription.trim() && !uploadedFile) || isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Continue to Questions'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProcessInput