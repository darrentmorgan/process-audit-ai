/**
 * PDF Generation API Route - ProcessAudit AI
 * 
 * Main endpoint for generating PDF documents from audit reports and SOPs
 * Supports audit-report, sop-document, and executive-summary document types
 */

const PDFGenerator = require('../../services/pdf/PDFGenerator')

// Configure API route for larger payloads and longer processing times
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '50mb',
    maxDuration: 60, // 60 seconds for PDF generation
  },
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    })
  }

  try {
    // Initialize PDF generator
    const pdfGenerator = new PDFGenerator({
      templates: {}, // TODO: Load custom templates
      branding: {}, // TODO: Load default branding
      export: {
        tempDirectory: process.env.PDF_TEMP_DIR || '/tmp/processaudit-pdf'
      }
    })

    // Validate request body
    const { documentType, reportData, sopData, options } = req.body
    
    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      })
    }

    if (!options) {
      return res.status(400).json({
        success: false,
        error: 'PDF options are required'
      })
    }

    // TODO: Get user/organization context from authentication
    // For now, use defaults
    const organizationId = null // await getUserOrganization(req)

    // Apply default options if not provided
    const pdfOptions = {
      page: {
        format: 'A4',
        orientation: 'portrait',
        ...options.page
      },
      filename: options.filename || `${documentType}-${Date.now()}.pdf`,
      metadata: {
        title: `${documentType.replace('-', ' ')} - ProcessAudit AI`,
        author: 'ProcessAudit AI',
        subject: 'Business Process Analysis',
        createdDate: new Date(),
        ...options.metadata
      },
      options: {
        pageNumbers: true,
        coverPage: true,
        ...options.options
      },
      ...options
    }

    // Build PDF generation request
    const pdfRequest = {
      documentType,
      reportData,
      sopData,
      options: pdfOptions
    }

    console.log(`Generating PDF: ${documentType} for organization: ${organizationId || 'default'}`)

    // Generate PDF
    const startTime = Date.now()
    const result = await pdfGenerator.generatePDF(pdfRequest)
    const generationTime = Date.now() - startTime

    if (!result.success) {
      console.error('PDF generation failed:', result.error)
      
      return res.status(500).json({
        success: false,
        error: result.error,
        details: process.env.NODE_ENV === 'development' ? result.errorDetails : undefined
      })
    }

    console.log(`PDF generated successfully in ${generationTime}ms`)

    // Prepare response based on delivery method
    const deliveryMethod = req.query.delivery || 'download'

    switch (deliveryMethod) {
      case 'download':
        // Return PDF directly for download
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
        res.setHeader('Content-Length', result.buffer.length)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        
        return res.status(200).send(result.buffer)

      case 'link':
        // Prepare download link
        const exportService = pdfGenerator.exportService
        const downloadPrep = await exportService.prepareDownload(
          result.buffer,
          result.filename,
          { organizationId }
        )

        if (!downloadPrep.success) {
          return res.status(500).json({
            success: false,
            error: 'Failed to prepare download link'
          })
        }

        return res.status(200).json({
          success: true,
          downloadUrl: downloadPrep.downloadUrl,
          fileId: downloadPrep.fileId,
          filename: downloadPrep.filename,
          fileSize: downloadPrep.fileSize,
          expiresAt: downloadPrep.expiresAt,
          generationTime
        })

      case 'email':
        // Send PDF via email
        const emailOptions = req.body.emailOptions
        
        if (!emailOptions || !emailOptions.to) {
          return res.status(400).json({
            success: false,
            error: 'Email recipient is required for email delivery'
          })
        }

        const emailService = pdfGenerator.exportService
        const emailResult = await emailService.sendEmail(
          result.buffer,
          result.filename,
          {
            to: emailOptions.to,
            subject: emailOptions.subject || `Your ${documentType} from ProcessAudit AI`,
            organizationName: emailOptions.organizationName || 'ProcessAudit AI',
            documentType: documentType.replace('-', ' ')
          }
        )

        if (!emailResult.success) {
          return res.status(500).json({
            success: false,
            error: emailResult.error
          })
        }

        return res.status(200).json({
          success: true,
          messageId: emailResult.messageId,
          recipient: emailResult.recipient,
          sentAt: emailResult.sentAt,
          generationTime
        })

      default:
        return res.status(400).json({
          success: false,
          error: `Invalid delivery method: ${deliveryMethod}`
        })
    }

  } catch (error) {
    console.error('PDF API error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during PDF generation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Get user organization from authentication context
 * TODO: Implement actual authentication integration
 */
async function getUserOrganization(req) {
  // This would integrate with Clerk or your auth system
  // For now, return null (default organization)
  return null
}