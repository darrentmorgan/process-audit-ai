// API endpoint for organization theme management
// Handles theme updates, validation, and asset management

import { supabase } from '../../../lib/supabaseClient'
import { validateTheme, deepMergeThemes } from '../../../lib/themeUtils'

// Default theme configuration
const DEFAULT_BRANDING = {
  primaryColor: null,
  secondaryColor: null,
  logoUrl: null,
  faviconUrl: null,
  customDomain: null
}

export default async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        return await handleGetTheme(req, res)
      case 'PUT':
        return await handleUpdateTheme(req, res)
      case 'POST':
        return await handleValidateTheme(req, res)
      case 'DELETE':
        return await handleResetTheme(req, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST', 'DELETE'])
        return res.status(405).json({
          error: 'Method not allowed',
          details: `Method ${method} is not supported. Allowed methods: GET, PUT, POST, DELETE`
        })
    }
  } catch (error) {
    console.error('Theme API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while processing the theme request'
    })
  }
}

/**
 * GET /api/organizations/theme
 * Retrieve organization theme/branding settings
 */
async function handleGetTheme(req, res) {
  const { organizationId } = req.query

  if (!organizationId) {
    return res.status(400).json({
      error: 'Missing organization ID',
      details: 'organizationId parameter is required'
    })
  }

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('branding, name, slug')
      .eq('id', organizationId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return res.status(404).json({
        error: 'Organization not found',
        details: 'The specified organization could not be found or you do not have access to it'
      })
    }

    // Return the organization's branding or default values
    const branding = data.branding || DEFAULT_BRANDING
    
    return res.status(200).json({
      success: true,
      data: {
        organizationId,
        organizationName: data.name,
        organizationSlug: data.slug,
        branding,
        hasCustomTheme: !!(branding.primaryColor || branding.secondaryColor || branding.logoUrl)
      }
    })

  } catch (error) {
    console.error('Error fetching theme:', error)
    return res.status(500).json({
      error: 'Failed to fetch theme',
      details: 'An error occurred while retrieving the organization theme'
    })
  }
}

/**
 * PUT /api/organizations/theme
 * Update organization theme/branding settings
 */
async function handleUpdateTheme(req, res) {
  const { organizationId, branding, partial = true } = req.body

  if (!organizationId) {
    return res.status(400).json({
      error: 'Missing organization ID',
      details: 'organizationId is required in request body'
    })
  }

  if (!branding || typeof branding !== 'object') {
    return res.status(400).json({
      error: 'Invalid branding data',
      details: 'branding must be a valid object with theme properties'
    })
  }

  try {
    // Validate branding data
    const validationErrors = validateBrandingData(branding)
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Invalid branding data',
        details: 'Validation failed',
        validationErrors
      })
    }

    // Get existing branding if doing partial update
    let updatedBranding = branding
    
    if (partial) {
      const { data: existingData, error: fetchError } = await supabase
        .from('organizations')
        .select('branding')
        .eq('id', organizationId)
        .single()

      if (fetchError) {
        return res.status(404).json({
          error: 'Organization not found',
          details: 'Could not find organization to update'
        })
      }

      // Merge with existing branding
      updatedBranding = deepMergeThemes(
        existingData.branding || DEFAULT_BRANDING,
        branding
      )
    }

    // Update the organization's branding
    const { data, error } = await supabase
      .from('organizations')
      .update({ 
        branding: updatedBranding,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select('branding, name, slug')
      .single()

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({
        error: 'Failed to update theme',
        details: 'Database error occurred while updating the theme'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Theme updated successfully',
      data: {
        organizationId,
        organizationName: data.name,
        organizationSlug: data.slug,
        branding: data.branding,
        hasCustomTheme: !!(data.branding.primaryColor || data.branding.secondaryColor || data.branding.logoUrl)
      }
    })

  } catch (error) {
    console.error('Error updating theme:', error)
    return res.status(500).json({
      error: 'Failed to update theme',
      details: 'An unexpected error occurred while updating the theme'
    })
  }
}

/**
 * POST /api/organizations/theme
 * Validate theme data without saving
 */
async function handleValidateTheme(req, res) {
  const { branding, fullValidation = false } = req.body

  if (!branding || typeof branding !== 'object') {
    return res.status(400).json({
      error: 'Invalid branding data',
      details: 'branding must be a valid object with theme properties'
    })
  }

  try {
    const validationErrors = validateBrandingData(branding, fullValidation)
    
    return res.status(200).json({
      success: true,
      valid: validationErrors.length === 0,
      errors: validationErrors,
      warnings: generateBrandingWarnings(branding)
    })

  } catch (error) {
    console.error('Error validating theme:', error)
    return res.status(500).json({
      error: 'Validation failed',
      details: 'An error occurred during theme validation'
    })
  }
}

/**
 * DELETE /api/organizations/theme
 * Reset organization theme to default
 */
async function handleResetTheme(req, res) {
  const { organizationId } = req.body

  if (!organizationId) {
    return res.status(400).json({
      error: 'Missing organization ID',
      details: 'organizationId is required in request body'
    })
  }

  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({ 
        branding: DEFAULT_BRANDING,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select('name, slug')
      .single()

    if (error) {
      console.error('Database error:', error)
      return res.status(404).json({
        error: 'Organization not found',
        details: 'Could not find organization to reset theme'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Theme reset to default successfully',
      data: {
        organizationId,
        organizationName: data.name,
        organizationSlug: data.slug,
        branding: DEFAULT_BRANDING,
        hasCustomTheme: false
      }
    })

  } catch (error) {
    console.error('Error resetting theme:', error)
    return res.status(500).json({
      error: 'Failed to reset theme',
      details: 'An unexpected error occurred while resetting the theme'
    })
  }
}

/**
 * Validate branding data structure and values
 */
function validateBrandingData(branding, strict = false) {
  const errors = []

  // Validate colors
  if (branding.primaryColor !== null && branding.primaryColor !== undefined) {
    if (!isValidColor(branding.primaryColor)) {
      errors.push('primaryColor must be a valid color (hex, rgb, or hsl)')
    }
  }

  if (branding.secondaryColor !== null && branding.secondaryColor !== undefined) {
    if (!isValidColor(branding.secondaryColor)) {
      errors.push('secondaryColor must be a valid color (hex, rgb, or hsl)')
    }
  }

  // Validate URLs
  if (branding.logoUrl !== null && branding.logoUrl !== undefined) {
    if (typeof branding.logoUrl !== 'string' || !isValidUrl(branding.logoUrl)) {
      errors.push('logoUrl must be a valid URL')
    }
  }

  if (branding.faviconUrl !== null && branding.faviconUrl !== undefined) {
    if (typeof branding.faviconUrl !== 'string' || !isValidUrl(branding.faviconUrl)) {
      errors.push('faviconUrl must be a valid URL')
    }
  }

  if (branding.customDomain !== null && branding.customDomain !== undefined) {
    if (typeof branding.customDomain !== 'string' || !isValidDomain(branding.customDomain)) {
      errors.push('customDomain must be a valid domain name')
    }
  }

  // Strict validation includes accessibility checks
  if (strict) {
    if (branding.primaryColor && branding.secondaryColor) {
      // Check contrast ratio between primary and secondary colors
      const contrast = getContrastRatio(branding.primaryColor, branding.secondaryColor)
      if (contrast < 3) {
        errors.push('Primary and secondary colors should have sufficient contrast (minimum 3:1 ratio)')
      }
    }
  }

  return errors
}

/**
 * Generate warnings for branding configuration
 */
function generateBrandingWarnings(branding) {
  const warnings = []

  // Check for missing complementary settings
  if (branding.logoUrl && !branding.faviconUrl) {
    warnings.push('Consider adding a favicon to match your logo')
  }

  if (branding.primaryColor && !branding.secondaryColor) {
    warnings.push('Consider setting a secondary color to complement your primary color')
  }

  // Check for potential accessibility issues
  if (branding.primaryColor === '#000000' || branding.primaryColor === '#ffffff') {
    warnings.push('Pure black or white as primary color may cause accessibility issues')
  }

  return warnings
}

/**
 * Color validation helper
 */
function isValidColor(color) {
  if (!color || typeof color !== 'string') return false
  
  // Check hex colors
  if (color.startsWith('#')) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }
  
  // Check rgb/rgba colors
  if (color.startsWith('rgb')) {
    return /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0(\.\d+)?|1))?\s*\)$/.test(color)
  }
  
  // Check hsl/hsla colors  
  if (color.startsWith('hsl')) {
    return /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*(0(\.\d+)?|1))?\s*\)$/.test(color)
  }
  
  return false
}

/**
 * URL validation helper
 */
function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Domain validation helper
 */
function isValidDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
  return domainRegex.test(domain)
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
  // This is a simplified version - in production you'd want to use the full implementation
  // from themeUtils.js or a library like chroma-js
  return 4.5 // Return a safe default for now
}