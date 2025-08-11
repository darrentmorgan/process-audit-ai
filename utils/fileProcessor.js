export async function processFile(fileData, fileType) {
  try {
    // Decode base64 file data in Node environment
    const buffer = Buffer.from(fileData, 'base64')
    const bytes = new Uint8Array(buffer)

    // Process based on file type
    switch (fileType) {
      case 'text/plain':
        return processTextFile(bytes)
      
      case 'application/pdf':
        return processPdfFile(bytes)
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await processDocFile(buffer)
      
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
  // PDF parsing requires additional libraries like pdf-parse
  console.log('⚠️ PDF processing not yet implemented - returning placeholder')
  return `[PDF Processing Not Available]

PDF document parsing is not yet implemented. 

To use your PDF SOP content:
1. Open the PDF file
2. Copy the text content
3. Paste it directly into the text input field below
4. Select "Standard Operating Procedure" mode
5. Continue with analysis

This will provide the same functionality while we work on PDF parsing capabilities.

Sample SOP Content Format:
---
STANDARD OPERATING PROCEDURE
Title: [Your SOP Title]
Purpose: [Objective of the procedure]
Scope: [What this covers]

PROCEDURE:
1. [First step]
2. [Second step]
3. [Third step]
...`
}

async function processDocFile(buffer) {
  try {
    const mammoth = require('mammoth')
    
    // Extract text from the document
    const result = await mammoth.extractRawText({ buffer })
    
    if (result.value && result.value.trim()) {
      console.log('✅ Successfully extracted Word document content:', result.value.length, 'characters')
      return result.value.trim()
    } else {
      console.log('⚠️ No text content found in Word document')
      return '[Empty Word Document]\n\nThe uploaded Word document appears to be empty or contains no extractable text content.'
    }
  } catch (error) {
    console.error('❌ Error processing Word document:', error)
    // Fallback to placeholder if extraction fails
    return `[Word Document Processing Error]
    
Failed to extract content from the uploaded Word document. Error: ${error.message}

Please try:
1. Re-uploading the document
2. Saving the document in a different format
3. Copy-pasting the content directly into the text area

For demonstration purposes, you can paste your SOP content directly into the text input field.`
  }
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