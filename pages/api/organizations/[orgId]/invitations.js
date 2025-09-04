import { getAuth, clerkClient } from '@clerk/nextjs/server'

/**
 * API route for organization invitations
 * POST /api/organizations/[orgId]/invitations - Send invitation to join organization
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
        error: 'Organization invitations require Clerk authentication to be enabled',
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
      case 'POST':
        return await handleCreateInvitation(req, res, userId, orgId)
      
      default:
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        })
    }
  } catch (error) {
    console.error('Organization invitations API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Create and send organization invitation
 */
async function handleCreateInvitation(req, res, userId, orgId) {
  try {
    // Check if user has permission to invite members
    const membership = await getUserOrganizationMembership(userId, orgId)
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this organization',
        code: 'NOT_MEMBER'
      })
    }

    // Only admins and members can invite (not guests)
    if (membership.role === 'guest') {
      return res.status(403).json({
        success: false,
        error: 'Guests cannot invite new members',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    const { 
      emailAddress, 
      role = 'member', 
      message = '',
      redirectUrl 
    } = req.body

    // Validate required fields
    if (!emailAddress || typeof emailAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email address is required',
        code: 'INVALID_EMAIL'
      })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format',
        code: 'INVALID_EMAIL_FORMAT'
      })
    }

    // Validate role
    const validRoles = ['admin', 'member', 'guest']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: ' + validRoles.join(', '),
        code: 'INVALID_ROLE'
      })
    }

    // Only admins can invite other admins
    if (role === 'admin' && membership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only organization administrators can invite other administrators',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    // Get organization details for invitation
    const organization = await clerkClient.organizations.getOrganization({
      organizationId: orgId
    })

    // Check if the organization has reached member limits
    if (organization.maxAllowedMemberships) {
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: 1 // Just to get the count
      })
      
      if (memberships.totalCount >= organization.maxAllowedMemberships) {
        return res.status(400).json({
          success: false,
          error: 'Organization has reached its member limit',
          code: 'MEMBER_LIMIT_REACHED'
        })
      }
    }

    // Check if user is already a member or has a pending invitation
    try {
      const existingMembership = await clerkClient.organizations.getOrganizationMembership({
        organizationId: orgId,
        userId: emailAddress // Clerk can lookup by email
      })
      
      if (existingMembership) {
        return res.status(409).json({
          success: false,
          error: 'This user is already a member of the organization',
          code: 'ALREADY_MEMBER'
        })
      }
    } catch (error) {
      // User not found or not a member - this is expected, continue with invitation
      if (error.status !== 404) {
        throw error
      }
    }

    // Create invitation
    const invitationData = {
      emailAddress: emailAddress.toLowerCase().trim(),
      role,
      redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/org/${organization.slug || orgId}`
    }

    // Add public metadata with invitation context
    if (message.trim()) {
      invitationData.publicMetadata = {
        inviterMessage: message.trim(),
        inviterUserId: userId
      }
    }

    const invitation = await clerkClient.organizations.createOrganizationInvitation(
      orgId,
      invitationData
    )

    // Get inviter information for response
    const inviter = await clerkClient.users.getUser(userId)

    // Transform response
    const responseData = {
      id: invitation.id,
      emailAddress: invitation.emailAddress,
      role: invitation.role,
      status: invitation.status,
      createdAt: new Date(invitation.createdAt).toISOString(),
      updatedAt: new Date(invitation.updatedAt).toISOString(),
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      },
      inviter: {
        id: inviter.id,
        firstName: inviter.firstName,
        lastName: inviter.lastName,
        emailAddress: inviter.emailAddresses[0]?.emailAddress
      },
      redirectUrl: invitationData.redirectUrl
    }

    return res.status(201).json({
      success: true,
      data: responseData,
      message: `Invitation sent to ${emailAddress}`
    })

  } catch (error) {
    console.error('Create invitation error:', error)
    
    if (error.status === 422) {
      const clerkError = error.errors?.[0]
      
      if (clerkError?.code === 'form_identifier_exists') {
        return res.status(409).json({
          success: false,
          error: 'An invitation has already been sent to this email address',
          code: 'INVITATION_EXISTS'
        })
      }
      
      return res.status(400).json({
        success: false,
        error: clerkError?.longMessage || 'Invalid invitation data',
        code: 'VALIDATION_ERROR'
      })
    }
    
    if (error.status === 403) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to invite members to this organization',
        code: 'INSUFFICIENT_PERMISSIONS'
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
      error: 'Failed to send invitation',
      code: 'INVITATION_ERROR'
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