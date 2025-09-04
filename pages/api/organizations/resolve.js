import { clerkClient } from '@clerk/nextjs/server'

/**
 * API route for resolving organization context from domains, subdomains, or slugs
 * GET /api/organizations/resolve?domain=example.com
 * GET /api/organizations/resolve?subdomain=acme
 * GET /api/organizations/resolve?slug=acme-corp
 * 
 * This endpoint is public and doesn't require authentication
 * Used by middleware and client-side organization resolution
 */
export default async function handler(req, res) {
  try {
    // Check if Clerk authentication is enabled
    const useClerkAuth = process.env.NEXT_PUBLIC_USE_CLERK_AUTH === 'true'
    
    if (!useClerkAuth) {
      return res.status(501).json({
        success: false,
        error: 'Organization resolution requires Clerk authentication to be enabled',
        code: 'CLERK_NOT_ENABLED'
      })
    }

    const { method } = req

    if (method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`,
        code: 'METHOD_NOT_ALLOWED'
      })
    }

    const { domain, subdomain, slug, id } = req.query

    // Validate that at least one identifier is provided
    if (!domain && !subdomain && !slug && !id) {
      return res.status(400).json({
        success: false,
        error: 'At least one identifier (domain, subdomain, slug, or id) is required',
        code: 'MISSING_IDENTIFIER'
      })
    }

    let organization = null

    try {
      // Try different resolution methods in order of preference
      
      // 1. Direct ID lookup (most reliable)
      if (id) {
        organization = await clerkClient.organizations.getOrganization({
          organizationId: id
        })
      }
      
      // 2. Slug lookup (second most reliable)
      else if (slug) {
        const organizations = await clerkClient.organizations.getOrganizationList({
          limit: 100 // Should be enough for slug uniqueness
        })
        
        organization = organizations.data.find(org => org.slug === slug)
      }
      
      // 3. Custom domain lookup (check private metadata)
      else if (domain) {
        const organizations = await clerkClient.organizations.getOrganizationList({
          limit: 100
        })
        
        organization = organizations.data.find(org => 
          org.privateMetadata?.branding?.customDomain === domain ||
          org.publicMetadata?.customDomain === domain
        )
      }
      
      // 4. Subdomain lookup (match against organization slugs)
      else if (subdomain) {
        const organizations = await clerkClient.organizations.getOrganizationList({
          limit: 100
        })
        
        // First try exact slug match
        organization = organizations.data.find(org => org.slug === subdomain)
        
        // If no exact match, try subdomain in metadata
        if (!organization) {
          organization = organizations.data.find(org => 
            org.privateMetadata?.branding?.subdomain === subdomain ||
            org.publicMetadata?.subdomain === subdomain
          )
        }
      }

    } catch (error) {
      console.error('Organization resolution error:', error)
      
      // Handle specific Clerk errors
      if (error.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
          code: 'ORG_NOT_FOUND'
        })
      }
      
      throw error
    }

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND',
        identifier: { domain, subdomain, slug, id }
      })
    }

    // Transform organization data for response (public data only)
    const responseData = {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      description: organization.publicMetadata?.description || null,
      imageUrl: organization.imageUrl,
      publicMetadata: organization.publicMetadata || {},
      createdAt: new Date(organization.createdAt).toISOString(),
      
      // Organization context information
      context: {
        resolvedBy: id ? 'id' : slug ? 'slug' : domain ? 'domain' : 'subdomain',
        identifier: id || slug || domain || subdomain,
        hasCustomDomain: !!(
          organization.privateMetadata?.branding?.customDomain ||
          organization.publicMetadata?.customDomain
        ),
        customDomain: organization.privateMetadata?.branding?.customDomain ||
                     organization.publicMetadata?.customDomain || null
      }
    }

    // Add cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300') // Cache for 5 minutes

    return res.status(200).json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Organization resolution API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}