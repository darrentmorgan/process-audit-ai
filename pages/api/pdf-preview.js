/**
 * PDF Preview API Route - ProcessAudit AI
 * 
 * Generates preview images of PDF documents for UI display
 * Returns base64-encoded image data of the first few pages
 */

const PDFGenerator = require('../../services/pdf/PDFGenerator')

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
    responseLimit: '10mb',
    maxDuration: 30, // 30 seconds for preview generation
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    })
  }

  try {
    // Initialize PDF generator
    const pdfGenerator = new PDFGenerator({
      templates: {},
      branding: {},
      export: {
        tempDirectory: process.env.PDF_TEMP_DIR || '/tmp/processaudit-pdf'
      }
    })

    // Validate request body
    const { documentType, data, options = {} } = req.body
    
    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      })
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required for preview generation'
      })
    }

    // Configure preview options
    const previewOptions = {
      pageCount: Math.min(options.pageCount || 3, 5), // Limit to max 5 pages
      quality: options.quality || 'medium'
    }

    // Build preview request
    const previewRequest = {
      documentType,
      data,
      options: previewOptions
    }

    console.log(`Generating PDF preview: ${documentType}, ${previewOptions.pageCount} pages`)

    const startTime = Date.now()
    const result = await pdfGenerator.generatePreview(previewRequest)
    const generationTime = Date.now() - startTime

    if (!result.success) {
      console.error('PDF preview generation failed:', result.error)
      
      return res.status(500).json({
        success: false,
        error: result.error
      })
    }

    console.log(`PDF preview generated successfully in ${generationTime}ms`)

    return res.status(200).json({
      success: true,
      previewImages: result.previewImages,
      totalPages: result.totalPages,
      previewOptions,
      generationTime
    })

  } catch (error) {
    console.error('PDF preview API error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during PDF preview generation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}