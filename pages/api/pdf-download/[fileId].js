/**
 * PDF Download API Route - ProcessAudit AI
 * 
 * Retrieves generated PDF files by file ID for download
 * Handles temporary file retrieval with expiration
 */

import PDFExportService from '../../../services/pdf/PDFExportService'

export const config = {
  api: {
    responseLimit: '50mb',
    maxDuration: 10, // 10 seconds for file retrieval
  },
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    })
  }

  try {
    const { fileId } = req.query

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required'
      })
    }

    // Validate file ID format (basic security check)
    if (!/^pdf-\d+-[a-zA-Z0-9]+$/.test(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID format'
      })
    }

    // Initialize export service
    const exportService = new PDFExportService({
      tempDirectory: process.env.PDF_TEMP_DIR || '/tmp/processaudit-pdf'
    })

    console.log(`Retrieving PDF file: ${fileId}`)

    // Get file by ID
    const result = await exportService.getFileById(fileId)

    if (!result.success) {
      console.log(`File not found or expired: ${fileId}`)
      
      return res.status(404).json({
        success: false,
        error: result.error
      })
    }

    console.log(`PDF file retrieved successfully: ${result.filename}`)

    // Set appropriate headers for PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.setHeader('Content-Length', result.buffer.length)
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    // Optional: Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')

    return res.status(200).send(result.buffer)

  } catch (error) {
    console.error('PDF download API error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during file retrieval',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}