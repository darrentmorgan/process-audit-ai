import { getAuth, clerkClient } from '@clerk/nextjs/server'

/**
 * API route for organization CRUD operations
 * GET /api/organizations - List organizations for the current user
 * POST /api/organizations - Create a new organization
 */
export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req)
    
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

    const { method } = req

    switch (method) {
      case 'GET':
        return await handleGetOrganizations(req, res, userId)
      
      case 'POST':
        return await handleCreateOrganization(req, res, userId)
      
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        })
    }
  } catch (error) {
    console.error('Organizations API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Get organizations for the current user
 */
async function handleGetOrganizations(req, res, userId) {
  try {
    // Get user's organization memberships from Clerk
    const organizationMemberships = await clerkClient.users.getOrganizationMembershipList({
      userId,
      limit: 100
    })

    // Transform Clerk organization data to our format
    const organizations = organizationMemberships.map(membership => ({
      id: membership.organization.id,
      slug: membership.organization.slug,
      name: membership.organization.name,
      description: membership.organization.publicMetadata?.description || null,
      imageUrl: membership.organization.imageUrl,
      publicMetadata: membership.organization.publicMetadata || {},
      privateMetadata: membership.organization.privateMetadata || {},
      createdAt: new Date(membership.organization.createdAt).toISOString(),
      updatedAt: new Date(membership.organization.updatedAt).toISOString(),
      membersCount: membership.organization.membersCount,
      maxMembers: membership.organization.maxAllowedMemberships,
      plan: membership.organization.privateMetadata?.plan || 'free',
      
      // User's membership info
      userMembership: {
        id: membership.id,
        role: membership.role,
        permissions: membership.permissions || [],
        createdAt: new Date(membership.createdAt).toISOString(),
        updatedAt: new Date(membership.updatedAt).toISOString()
      }
    }))

    return res.status(200).json({
      success: true,
      data: organizations,
      total: organizations.length
    })

  } catch (error) {
    console.error('Get organizations error:', error)
    
    // Handle Clerk-specific errors
    if (error.status === 422) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        code: 'INVALID_PARAMS'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations',
      code: 'FETCH_ERROR'
    })
  }
}

/**
 * Create a new organization
 */
async function handleCreateOrganization(req, res, userId) {
  try {
    const { name, slug, description, publicMetadata = {}, plan = 'free' } = req.body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Organization name is required and must be at least 2 characters',
        code: 'INVALID_NAME'
      })
    }

    // Validate slug if provided
    if (slug && !/^[a-z0-9-_]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Organization slug can only contain lowercase letters, numbers, hyphens, and underscores',
        code: 'INVALID_SLUG'
      })
    }

    // Validate plan
    const validPlans = ['free', 'professional', 'enterprise']
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan. Must be one of: ' + validPlans.join(', '),
        code: 'INVALID_PLAN'
      })
    }

    // Prepare organization data
    const organizationData = {
      name: name.trim(),
      createdBy: userId,
      publicMetadata: {
        description: description?.trim() || null,
        ...publicMetadata
      },
      privateMetadata: {
        plan,
        features: {
          enableAutomations: true,
          enableReporting: true,
          enableIntegrations: plan !== 'free',
          enableAnalytics: plan !== 'free',
          maxProjects: plan === 'free' ? 5 : plan === 'professional' ? 50 : null,
          maxMembers: plan === 'free' ? 5 : plan === 'professional' ? 25 : null
        },
        security: {
          requireTwoFactor: false,
          allowGuestAccess: true,
          sessionTimeout: 24
        },
        notifications: {
          emailNotifications: true
        }
      }
    }

    // Add slug if provided
    if (slug) {
      organizationData.slug = slug
    }

    // Create organization in Clerk
    const organization = await clerkClient.organizations.createOrganization(organizationData)

    // Transform response to our format
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
      membersCount: 1, // Creator is the first member
      maxMembers: organization.maxAllowedMemberships,
      plan: organization.privateMetadata?.plan || 'free'
    }

    return res.status(201).json({
      success: true,
      data: responseData,
      message: 'Organization created successfully'
    })

  } catch (error) {
    console.error('Create organization error:', error)
    
    // Handle Clerk-specific errors
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
    
    if (error.status === 403) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to create organizations',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create organization',
      code: 'CREATE_ERROR'
    })
  }
}