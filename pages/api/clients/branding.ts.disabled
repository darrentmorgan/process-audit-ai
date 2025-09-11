import type { NextApiRequest, NextApiResponse } from 'next'
import { ClientBrandPackage, ClientBrandEditorConfig } from '../../../types/client-branding'
import { isValidOrganizationSettings } from '../../../types/organization'
import { withClerkAuth } from '../../../middleware/clerk-auth'
import { uploadBrandAsset } from '../../../services/asset-upload'
import { validateBrandConfiguration } from '../../../services/brand-validator'

// Client branding management API
const clientBrandingHandler = async (
  req: NextApiRequest, 
  res: NextApiResponse
) => {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetBranding(req, res)
    case 'PUT':
      return handleUpdateBranding(req, res)
    case 'POST':
      return handleUploadAsset(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'POST'])
      return res.status(405).end(`Method ${method} Not Allowed`)
  }
}

// Get current client branding configuration
const handleGetBranding = async (
  req: NextApiRequest, 
  res: NextApiResponse
) => {
  try {
    const orgId = req.query.orgId as string
    
    // Fetch branding from Supabase
    const { data, error } = await supabase
      .from('organizations')
      .select('branding')
      .eq('id', orgId)
      .single()

    if (error) throw error

    return res.status(200).json(data.branding)
  } catch (error) {
    console.error('Error fetching branding:', error)
    return res.status(500).json({ 
      error: 'Failed to retrieve branding configuration' 
    })
  }
}

// Update client branding configuration
const handleUpdateBranding = async (
  req: NextApiRequest, 
  res: NextApiResponse
) => {
  try {
    const brandConfig = req.body as ClientBrandPackage
    const orgId = req.query.orgId as string

    // Validate brand configuration
    const validationResult = validateBrandConfiguration(brandConfig)
    
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Invalid branding configuration',
        details: validationResult.errors
      })
    }

    // Update in Supabase
    const { data, error } = await supabase
      .from('organizations')
      .update({ branding: brandConfig })
      .eq('id', orgId)

    if (error) throw error

    return res.status(200).json(brandConfig)
  } catch (error) {
    console.error('Error updating branding:', error)
    return res.status(500).json({ 
      error: 'Failed to update branding configuration' 
    })
  }
}

// Upload brand assets (logo, favicon, etc.)
const handleUploadAsset = async (
  req: NextApiRequest, 
  res: NextApiResponse
) => {
  try {
    const orgId = req.query.orgId as string
    const assetType = req.query.type as 'logo' | 'favicon' | 'heroImage'
    
    // Upload asset and get secure URL
    const uploadResult = await uploadBrandAsset(req, orgId, assetType)

    if (!uploadResult.success) {
      return res.status(400).json({
        error: 'Asset upload failed',
        details: uploadResult.error
      })
    }

    return res.status(200).json({
      assetUrl: uploadResult.url,
      message: 'Asset uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading brand asset:', error)
    return res.status(500).json({ 
      error: 'Failed to upload brand asset' 
    })
  }
}

// Client branding configuration defaults
export const CLIENT_BRAND_CONFIG: ClientBrandEditorConfig = {
  allowedFileTypes: ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
  maxLogoSize: 5 * 1024 * 1024, // 5MB
  colorValidation: {
    minContrast: 4.5,
    allowCustom: true
  }
}

export default withClerkAuth(clientBrandingHandler)