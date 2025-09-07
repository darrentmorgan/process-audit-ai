import { NextApiRequest } from 'next'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { CLIENT_BRAND_VALIDATION_CONFIG } from './brand-validator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_KEY!
)

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export const uploadBrandAsset = async (
  req: NextApiRequest, 
  orgId: string, 
  assetType: 'logo' | 'favicon' | 'heroImage'
): Promise<UploadResult> => {
  try {
    // Validate file type and size
    const file = req.body.file
    if (!file) {
      return { 
        success: false, 
        error: 'No file uploaded' 
      }
    }

    const fileExtension = file.name.split('.').pop().toLowerCase()
    const fileSize = file.size

    // Validate file type
    if (!CLIENT_BRAND_VALIDATION_CONFIG.allowedFileTypes
      .map(type => type.replace('.', ''))
      .includes(fileExtension)) {
      return {
        success: false,
        error: 'Invalid file type'
      }
    }

    // Validate file size
    if (fileSize > CLIENT_BRAND_VALIDATION_CONFIG.maxLogoSize) {
      return {
        success: false,
        error: 'File size exceeds maximum limit'
      }
    }

    // Generate unique filename
    const uniqueFilename = `${orgId}/${assetType}-${uuidv4()}.${fileExtension}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('client-branding')
      .upload(uniqueFilename, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Upload error:', error)
      return { 
        success: false, 
        error: 'Failed to upload asset' 
      }
    }

    // Generate public URL
    const { data: { publicUrl } } = supabase.storage
      .from('client-branding')
      .getPublicUrl(uniqueFilename)

    // Optional: Update organization branding record with new asset URL
    await supabase
      .from('organizations')
      .update({ 
        [`branding.assets.${assetType}Url`]: publicUrl 
      })
      .eq('id', orgId)

    return {
      success: true,
      url: publicUrl
    }
  } catch (error) {
    console.error('Unexpected upload error:', error)
    return { 
      success: false, 
      error: 'Unexpected error during asset upload' 
    }
  }
}

export const deleteBrandAsset = async (
  orgId: string, 
  assetUrl: string
): Promise<UploadResult> => {
  try {
    // Extract path from full URL
    const path = new URL(assetUrl).pathname.replace('/storage/v1/object/public/', '')

    // Delete from Supabase storage
    const { error } = await supabase.storage
      .from('client-branding')
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return { 
        success: false, 
        error: 'Failed to delete asset' 
      }
    }

    // Optional: Clear asset URL from organization record
    await supabase
      .from('organizations')
      .update({ 
        'branding.assets': null 
      })
      .eq('id', orgId)

    return { success: true }
  } catch (error) {
    console.error('Unexpected delete error:', error)
    return { 
      success: false, 
      error: 'Unexpected error during asset deletion' 
    }
  }
}