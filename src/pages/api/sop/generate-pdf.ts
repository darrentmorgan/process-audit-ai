import type { NextApiRequest, NextApiResponse } from 'next'
import { 
  SOPPDFGenerationRequest, 
  SOPPDFGenerationResponse,
  OrganizationBranding
} from '@/types/sop'
import { SOPPDFGenerator } from '@/services/sop/SOPPDFGenerator'
import { withApiAuth } from '@/utils/apiMiddleware'
import { handleApiError } from '@/utils/errorHandler'

async function generateSOPPDF(
  req: NextApiRequest, 
  res: NextApiResponse<SOPPDFGenerationResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      metadata: { fileSize: 0, generationTime: 0 }
    })
  }

  try {
    const { 
      reportId, 
      sopFormat, 
      branding, 
      includeBranding, 
      customizations 
    } = req.body as SOPPDFGenerationRequest

    // Validate request body
    if (!reportId) {
      return res.status(400).json({
        success: false,
        metadata: { fileSize: 0, generationTime: 0 }
      })
    }

    // Use default branding if not provided
    const defaultBranding: OrganizationBranding = {
      name: 'ProcessAudit AI',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      logoUrl: '/logo.svg',
      fontFamily: 'Inter, sans-serif'
    }

    const pdfResponse = await SOPPDFGenerator.generatePDF({
      reportId,
      sopFormat: sopFormat || 'step-by-step',
      branding: branding || defaultBranding,
      includeBranding: includeBranding ?? true,
      customizations
    })

    return res.status(200).json(pdfResponse)
  } catch (error) {
    return handleApiError(res, error, {
      message: 'Failed to generate SOP PDF',
      context: { 
        reportId: req.body.reportId, 
        errorType: 'PDF_GENERATION_ERROR' 
      }
    })
  }
}

export default withApiAuth(generateSOPPDF)