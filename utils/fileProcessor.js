export async function processFile(fileData, fileType) {
  try {
    // Decode base64 file data
    const binaryString = atob(fileData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Process based on file type
    switch (fileType) {
      case 'text/plain':
        return processTextFile(bytes)
      
      case 'application/pdf':
        return processPdfFile(bytes)
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return processDocFile(bytes)
      
      default:
        throw new Error('Unsupported file type')
    }
  } catch (error) {
    console.error('File processing error:', error)
    throw new Error('Failed to process file')
  }
}

function processTextFile(bytes) {
  try {
    // Convert bytes to text
    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(bytes)
    return text.trim()
  } catch (error) {
    throw new Error('Failed to read text file')
  }
}

function processPdfFile(bytes) {
  // For now, return a placeholder since PDF parsing requires additional libraries
  // In a real implementation, you would use libraries like pdf-parse or PDF.js
  return `[PDF Content Extracted]
  
This is a placeholder for PDF content extraction. In a production environment, this would contain the actual text content extracted from the PDF file using libraries like pdf-parse, PDF.js, or similar PDF processing tools.

The system would extract:
- Text content from all pages
- Table data where applicable
- Document structure and formatting
- Embedded text from images (with OCR if needed)

For demonstration purposes, assume this contains your process documentation from the uploaded PDF file.`
}

function processDocFile(bytes) {
  // For now, return a placeholder since DOC/DOCX parsing requires additional libraries
  // In a real implementation, you would use libraries like mammoth.js or docx-parser
  return `[Word Document Content Extracted]
  
This is a placeholder for Word document content extraction. In a production environment, this would contain the actual text content extracted from the DOC/DOCX file using libraries like mammoth.js, docx-parser, or similar document processing tools.

The system would extract:
- Main document text and formatting
- Headers, footers, and document structure
- Table content and data
- List items and bullet points
- Comments and tracked changes (if needed)

For demonstration purposes, assume this contains your process documentation from the uploaded Word document.`
}

export function validateFileType(file) {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file, maxSizeInMB = 10) {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

export function getFileExtension(fileName) {
  return fileName.split('.').pop().toLowerCase()
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}