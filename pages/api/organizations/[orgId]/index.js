import { getAuth, clerkClient } from '@clerk/nextjs/server'

/**
 * API route for individual organization operations
 * GET /api/organizations/[orgId] - Get organization details
 * PATCH /api/organizations/[orgId] - Update organization
 * DELETE /api/organizations/[orgId] - Delete organization
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
        error: 'Organization management requires Clerk authentication to be enabled',
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
      case 'GET':
        return await handleGetOrganization(req, res, userId, orgId)
      
      case 'PATCH':
        return await handleUpdateOrganization(req, res, userId, orgId)
      
      case 'DELETE':
        return await handleDeleteOrganization(req, res, userId, orgId)
      
      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        })
    }
  } catch (error) {
    console.error('Organization API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Get organization details with user's membership info
 */
async function handleGetOrganization(req, res, userId, orgId) {
  try {
    // Check user's membership in the organization
    const membership = await getUserOrganizationMembership(userId, orgId)
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this organization',
        code: 'NOT_MEMBER'
      })
    }

    // Get organization details
    const organization = await clerkClient.organizations.getOrganization({
      organizationId: orgId
    })

    // Get member count
    const memberships = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 1 // Just to get the count
    })

    // Transform to our format
    const responseData = {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      description: organization.publicMetadata?.description || null,
      imageUrl: organization.imageUrl,
      publicMetadata: organization.publicMetadata || {},
      privateMetadata: organization.privateMetadata || {},
      createdAt: new Date(organization.createdAt).toISOString(),
      updatedAt: new Date(organization.updatedAt).toISOString(),
      membersCount: memberships.totalCount,
      maxMembers: organization.maxAllowedMemberships,
      plan: organization.privateMetadata?.plan || 'free',
      
      // User's membership info
      userMembership: {
        id: membership.id,
        role: membership.role,
        permissions: membership.permissions || [],
        createdAt: new Date(membership.createdAt).toISOString(),
        updatedAt: new Date(membership.updatedAt).toISOString()
      }
    }

    return res.status(200).json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Get organization error:', error)
    
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch organization',
      code: 'FETCH_ERROR'
    })
  }
}

/**
 * Update organization details
 */
async function handleUpdateOrganization(req, res, userId, orgId) {
  try {
    // Check if user is an admin of the organization
    const membership = await getUserOrganizationMembership(userId, orgId)
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only organization administrators can update organization details',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    const { 
      name, 
      slug, 
      description, 
      publicMetadata = {},
      privateMetadata = {} 
    } = req.body

    // Validate name if provided
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Organization name must be at least 2 characters',
          code: 'INVALID_NAME'
        })
      }
    }

    // Validate slug if provided
    if (slug !== undefined && slug !== null) {
      if (!/^[a-z0-9-_]+$/.test(slug)) {
        return res.status(400).json({
          success: false,
          error: 'Organization slug can only contain lowercase letters, numbers, hyphens, and underscores',
          code: 'INVALID_SLUG'
        })
      }
    }

    // Get current organization to merge metadata
    const currentOrg = await clerkClient.organizations.getOrganization({
      organizationId: orgId
    })

    // Prepare update data
    const updateData = {}
    
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    
    if (slug !== undefined) {
      updateData.slug = slug
    }

    // Merge public metadata
    if (Object.keys(publicMetadata).length > 0 || description !== undefined) {
      updateData.publicMetadata = {
        ...currentOrg.publicMetadata,
        ...publicMetadata
      }
      
      if (description !== undefined) {
        updateData.publicMetadata.description = description?.trim() || null
      }
    }

    // Merge private metadata (be careful not to overwrite system settings)
    if (Object.keys(privateMetadata).length > 0) {
      updateData.privateMetadata = {
        ...currentOrg.privateMetadata,
        ...privateMetadata
      }
    }

    // Update organization in Clerk
    const updatedOrganization = await clerkClient.organizations.updateOrganization(
      orgId,
      updateData
    )

    // Transform response
    const responseData = {
      id: updatedOrganization.id,
      slug: updatedOrganization.slug,
      name: updatedOrganization.name,
      description: updatedOrganization.publicMetadata?.description || null,
      imageUrl: updatedOrganization.imageUrl,
      publicMetadata: updatedOrganization.publicMetadata || {},
      privateMetadata: updatedOrganization.privateMetadata || {},
      createdAt: new Date(updatedOrganization.createdAt).toISOString(),
      updatedAt: new Date(updatedOrganization.updatedAt).toISOString(),
      membersCount: updatedOrganization.membersCount,
      maxMembers: updatedOrganization.maxAllowedMemberships,
      plan: updatedOrganization.privateMetadata?.plan || 'free'
    }

    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Organization updated successfully'
    })

  } catch (error) {
    console.error('Update organization error:', error)
    
    if (error.status === 422) {
      const clerkError = error.errors?.[0]
      
      if (clerkError?.code === 'form_identifier_exists') {
        return res.status(409).json({
          success: false,
          error: 'An organization with this name or slug already exists',
          code: 'ORGANIZATION_EXISTS'
        })
      }
      
      return res.status(400).json({
        success: false,
        error: clerkError?.longMessage || 'Invalid organization data',
        code: 'VALIDATION_ERROR'
      })
    }
    
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update organization',
      code: 'UPDATE_ERROR'
    })
  }
}

/**
 * Delete organization (admin only)
 */
async function handleDeleteOrganization(req, res, userId, orgId) {
  try {
    // Check if user is an admin of the organization
    const membership = await getUserOrganizationMembership(userId, orgId)
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only organization administrators can delete organizations',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    // Additional check - require confirmation parameter
    const { confirm } = req.body
    if (confirm !== true) {
      return res.status(400).json({
        success: false,
        error: 'Organization deletion requires explicit confirmation',
        code: 'CONFIRMATION_REQUIRED'
      })
    }

    // Delete organization in Clerk
    await clerkClient.organizations.deleteOrganization(orgId)

    return res.status(200).json({
      success: true,
      message: 'Organization deleted successfully'
    })

  } catch (error) {
    console.error('Delete organization error:', error)
    
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      })
    }
    
    if (error.status === 403) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this organization',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to delete organization',
      code: 'DELETE_ERROR'
    })
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