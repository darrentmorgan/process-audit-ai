import { getAuth, clerkClient } from '@clerk/nextjs/server'

/**
 * API route for organization membership management
 * PATCH /api/organizations/[orgId]/memberships/[membershipId] - Update membership role
 * DELETE /api/organizations/[orgId]/memberships/[membershipId] - Remove member from organization
 */
export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req)
    const { orgId, membershipId } = req.query
    
    // Check if Clerk authentication is enabled
    const useClerkAuth = process.env.NEXT_PUBLIC_USE_CLERK_AUTH === 'true'
    
    if (!useClerkAuth) {
      return res.status(501).json({
        success: false,
        error: 'Membership management requires Clerk authentication to be enabled',
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

    if (!membershipId || typeof membershipId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Membership ID is required',
        code: 'INVALID_MEMBERSHIP_ID'
      })
    }

    const { method } = req

    switch (method) {
      case 'PATCH':
        return await handleUpdateMembership(req, res, userId, orgId, membershipId)
      
      case 'DELETE':
        return await handleRemoveMember(req, res, userId, orgId, membershipId)
      
      default:
        res.setHeader('Allow', ['PATCH', 'DELETE'])
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        })
    }
  } catch (error) {
    console.error('Membership API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Update membership role
 */
async function handleUpdateMembership(req, res, userId, orgId, membershipId) {
  try {
    // Check if user has permission to manage memberships (admin only)
    const userMembership = await getUserOrganizationMembership(userId, orgId)
    if (!userMembership || userMembership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only organization administrators can update member roles',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    // Get the target membership to validate it exists and belongs to this org
    const targetMembership = await clerkClient.organizations.getOrganizationMembership({
      organizationId: orgId,
      userId: membershipId // membershipId is actually the userId in this context
    })

    if (!targetMembership) {
      return res.status(404).json({
        success: false,
        error: 'Membership not found',
        code: 'MEMBERSHIP_NOT_FOUND'
      })
    }

    // Prevent users from changing their own role
    if (targetMembership.publicUserData.userId === userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot change your own role',
        code: 'CANNOT_CHANGE_OWN_ROLE'
      })
    }

    const { role, permissions = [] } = req.body

    // Validate role
    const validRoles = ['admin', 'member', 'guest']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: ' + validRoles.join(', '),
        code: 'INVALID_ROLE'
      })
    }

    // Check if we're trying to make someone an admin (need to ensure at least one admin remains)
    if (targetMembership.role === 'admin' && role !== 'admin') {
      // Count current admins
      const allMemberships = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: 100
      })
      
      const adminCount = allMemberships.data.filter(m => m.role === 'admin').length
      
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove the last administrator from the organization',
          code: 'LAST_ADMIN'
        })
      }
    }

    // Update membership role
    const updatedMembership = await clerkClient.organizations.updateOrganizationMembership({
      organizationId: orgId,
      userId: targetMembership.publicUserData.userId,
      role
    })

    // Transform response
    const responseData = {
      id: updatedMembership.id,
      organization: {
        id: updatedMembership.organization.id,
        name: updatedMembership.organization.name,
        slug: updatedMembership.organization.slug
      },
      user: {
        id: updatedMembership.publicUserData.userId,
        firstName: updatedMembership.publicUserData.firstName,
        lastName: updatedMembership.publicUserData.lastName,
        emailAddress: updatedMembership.publicUserData.identifier,
        imageUrl: updatedMembership.publicUserData.imageUrl
      },
      role: updatedMembership.role,
      permissions: updatedMembership.permissions || [],
      createdAt: new Date(updatedMembership.createdAt).toISOString(),
      updatedAt: new Date(updatedMembership.updatedAt).toISOString()
    }

    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Membership role updated successfully'
    })

  } catch (error) {
    console.error('Update membership error:', error)
    
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Membership not found',
        code: 'MEMBERSHIP_NOT_FOUND'
      })
    }
    
    if (error.status === 422) {
      return res.status(400).json({
        success: false,
        error: 'Invalid membership data',
        code: 'VALIDATION_ERROR'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update membership',
      code: 'UPDATE_ERROR'
    })
  }
}

/**
 * Remove member from organization
 */
async function handleRemoveMember(req, res, userId, orgId, membershipId) {
  try {
    // Check if user has permission to remove members (admin only)
    const userMembership = await getUserOrganizationMembership(userId, orgId)
    if (!userMembership || userMembership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only organization administrators can remove members',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    // Get the target membership to validate it exists and belongs to this org
    const targetMembership = await clerkClient.organizations.getOrganizationMembership({
      organizationId: orgId,
      userId: membershipId // membershipId is actually the userId in this context
    })

    if (!targetMembership) {
      return res.status(404).json({
        success: false,
        error: 'Membership not found',
        code: 'MEMBERSHIP_NOT_FOUND'
      })
    }

    // Prevent users from removing themselves
    if (targetMembership.publicUserData.userId === userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot remove yourself from the organization. Transfer admin rights first or delete the organization.',
        code: 'CANNOT_REMOVE_SELF'
      })
    }

    // Check if we're trying to remove the last admin
    if (targetMembership.role === 'admin') {
      const allMemberships = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: 100
      })
      
      const adminCount = allMemberships.data.filter(m => m.role === 'admin').length
      
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove the last administrator from the organization',
          code: 'LAST_ADMIN'
        })
      }
    }

    // Remove member from organization
    await clerkClient.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      userId: targetMembership.publicUserData.userId
    })

    return res.status(200).json({
      success: true,
      message: 'Member removed from organization successfully'
    })

  } catch (error) {
    console.error('Remove member error:', error)
    
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Membership not found',
        code: 'MEMBERSHIP_NOT_FOUND'
      })
    }
    
    if (error.status === 403) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to remove this member',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to remove member',
      code: 'REMOVE_ERROR'
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