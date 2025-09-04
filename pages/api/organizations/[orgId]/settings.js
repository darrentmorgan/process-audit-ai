import { getAuth, clerkClient } from '@clerk/nextjs/server'

/**
 * API route for organization settings management
 * PATCH /api/organizations/[orgId]/settings - Update organization settings
 */
export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req)
    const { orgId } = req.query
    
    // Check if Clerk authentication is enabled
    const useClerkAuth = process.env.NEXT_PUBLIC_USE_CLERK_AUTH === 'true'
    
    if (!useClerkAuth) {
      return res.status(501).json({
        success: false,
        error: 'Organization settings require Clerk authentication to be enabled',
        code: 'CLERK_NOT_ENABLED'
      })
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      })
    }

    if (!orgId || typeof orgId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required',
        code: 'INVALID_ORG_ID'
      })
    }

    const { method } = req

    switch (method) {
      case 'PATCH':
        return await handleUpdateSettings(req, res, userId, orgId)
      
      default:
        res.setHeader('Allow', ['PATCH'])
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        })
    }
  } catch (error) {
    console.error('Organization settings API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Update organization settings
 */
async function handleUpdateSettings(req, res, userId, orgId) {
  try {
    // Check if user is an admin of the organization
    const membership = await getUserOrganizationMembership(userId, orgId)
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only organization administrators can update settings',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    const { 
      general = {},
      branding = {},
      features = {},
      security = {},
      notifications = {}
    } = req.body

    // Get current organization to preserve existing metadata
    const currentOrg = await clerkClient.organizations.getOrganization({
      organizationId: orgId
    })

    // Prepare updated metadata
    const updatedPublicMetadata = {
      ...currentOrg.publicMetadata,
      ...(general.description !== undefined && { description: general.description }),
      ...(general.website !== undefined && { website: general.website }),
      ...(general.industry !== undefined && { industry: general.industry })
    }

    const updatedPrivateMetadata = {
      ...currentOrg.privateMetadata
    }

    // Update branding settings
    if (Object.keys(branding).length > 0) {
      updatedPrivateMetadata.branding = {
        ...currentOrg.privateMetadata?.branding,
        ...branding
      }
    }

    // Update feature settings
    if (Object.keys(features).length > 0) {
      updatedPrivateMetadata.features = {
        ...currentOrg.privateMetadata?.features,
        ...features
      }

      // Validate feature limits based on plan
      const plan = updatedPrivateMetadata.plan || 'free'
      const validatedFeatures = validateFeatureSettings(features, plan)
      updatedPrivateMetadata.features = {
        ...updatedPrivateMetadata.features,
        ...validatedFeatures
      }
    }

    // Update security settings
    if (Object.keys(security).length > 0) {
      updatedPrivateMetadata.security = {
        ...currentOrg.privateMetadata?.security,
        ...security
      }

      // Validate security settings
      if (security.sessionTimeout !== undefined) {
        if (typeof security.sessionTimeout !== 'number' || security.sessionTimeout < 1 || security.sessionTimeout > 168) {
          return res.status(400).json({
            success: false,
            error: 'Session timeout must be between 1 and 168 hours',
            code: 'INVALID_SESSION_TIMEOUT'
          })
        }
      }

      if (security.ipWhitelist !== undefined) {
        if (!Array.isArray(security.ipWhitelist)) {
          return res.status(400).json({
            success: false,
            error: 'IP whitelist must be an array',
            code: 'INVALID_IP_WHITELIST'
          })
        }
      }
    }

    // Update notification settings
    if (Object.keys(notifications).length > 0) {
      updatedPrivateMetadata.notifications = {
        ...currentOrg.privateMetadata?.notifications,
        ...notifications
      }

      // Validate webhook URLs
      if (notifications.slackWebhook && !isValidUrl(notifications.slackWebhook)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Slack webhook URL',
          code: 'INVALID_SLACK_WEBHOOK'
        })
      }

      if (notifications.webhookUrl && !isValidUrl(notifications.webhookUrl)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook URL',
          code: 'INVALID_WEBHOOK_URL'
        })
      }
    }

    // Prepare update data
    const updateData = {
      publicMetadata: updatedPublicMetadata,
      privateMetadata: updatedPrivateMetadata
    }

    // Update organization name if provided
    if (general.name !== undefined && general.name !== currentOrg.name) {
      if (!general.name || typeof general.name !== 'string' || general.name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Organization name must be at least 2 characters',
          code: 'INVALID_NAME'
        })
      }
      updateData.name = general.name.trim()
    }

    // Update organization in Clerk
    const updatedOrganization = await clerkClient.organizations.updateOrganization(
      orgId,
      updateData
    )

    // Transform response
    const responseData = {
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      publicMetadata: updatedOrganization.publicMetadata || {},
      privateMetadata: updatedOrganization.privateMetadata || {},
      updatedAt: new Date(updatedOrganization.updatedAt).toISOString()
    }

    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Organization settings updated successfully'
    })

  } catch (error) {
    console.error('Update settings error:', error)
    
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      })
    }
    
    if (error.status === 422) {
      const clerkError = error.errors?.[0]
      return res.status(400).json({
        success: false,
        error: clerkError?.longMessage || 'Invalid settings data',
        code: 'VALIDATION_ERROR'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update organization settings',
      code: 'UPDATE_ERROR'
    })
  }
}

/**
 * Validate feature settings based on organization plan
 */
function validateFeatureSettings(features, plan) {
  const validatedFeatures = { ...features }

  // Plan-specific feature validation
  switch (plan) {
    case 'free':
      // Free plan limitations
      if (features.maxProjects !== undefined && features.maxProjects > 5) {
        validatedFeatures.maxProjects = 5
      }
      if (features.maxMembers !== undefined && features.maxMembers > 5) {
        validatedFeatures.maxMembers = 5
      }
      // Disable premium features for free plan
      validatedFeatures.enableIntegrations = false
      validatedFeatures.enableAnalytics = false
      break
      
    case 'professional':
      // Professional plan limitations
      if (features.maxProjects !== undefined && features.maxProjects > 50) {
        validatedFeatures.maxProjects = 50
      }
      if (features.maxMembers !== undefined && features.maxMembers > 25) {
        validatedFeatures.maxMembers = 25
      }
      break
      
    case 'enterprise':
      // Enterprise has no limits
      break
  }

  return validatedFeatures
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

/**
 * Helper function to get user's membership in an organization
 */
async function getUserOrganizationMembership(userId, organizationId) {
  try {
    const membership = await clerkClient.organizations.getOrganizationMembership({
      organizationId,
      userId
    })
    return membership
  } catch (error) {
    if (error.status === 404) {
      return null // User is not a member
    }
    throw error
  }
}