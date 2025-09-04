import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

// Feature flag to enable Clerk authentication
const USE_CLERK_AUTH = process.env.NEXT_PUBLIC_USE_CLERK_AUTH === 'true'

// Organization routing configuration
const ORGANIZATION_ROUTING = {
  // Subdomains to skip organization processing
  SKIP_SUBDOMAINS: ['www', 'app', 'admin', 'localhost', '127', 'api', 'cdn', 'static'],
  
  // Custom domain patterns for different environments
  DOMAIN_PATTERNS: {
    production: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.processaudit\.ai$/,
    staging: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.staging\.processaudit\.ai$/,
    development: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.localhost$/,
  },
  
  // Organization path patterns
  ORG_PATH_PATTERN: /^\/org\/([a-zA-Z0-9_-]+)/,
}

// Helper functions for organization detection
const detectOrganizationContext = (req) => {
  const hostname = req.headers.get('host') || ''
  const pathname = req.nextUrl.pathname
  const subdomain = hostname.split('.')[0]
  
  // Skip processing for common subdomains
  if (ORGANIZATION_ROUTING.SKIP_SUBDOMAINS.includes(subdomain)) {
    return null
  }
  
  // Check for custom domain routing
  const customDomain = detectCustomDomain(hostname)
  if (customDomain) {
    return {
      type: 'domain',
      identifier: customDomain.orgSlug,
      domain: hostname,
      subdomain: customDomain.subdomain,
    }
  }
  
  // Check for path-based organization routing
  const pathMatch = pathname.match(ORGANIZATION_ROUTING.ORG_PATH_PATTERN)
  if (pathMatch) {
    return {
      type: 'path',
      identifier: pathMatch[1],
      originalPath: pathname,
    }
  }
  
  return null
}

const detectCustomDomain = (hostname) => {
  // Check for local development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const subdomain = hostname.split('.')[0]
    if (!ORGANIZATION_ROUTING.SKIP_SUBDOMAINS.includes(subdomain)) {
      return {
        orgSlug: subdomain,
        subdomain: subdomain,
        isCustomDomain: false,
      }
    }
    return null
  }
  
  // Check for Vercel preview deployments
  if (hostname.includes('vercel.app')) {
    return null
  }
  
  // Check for subdomain patterns
  for (const [env, pattern] of Object.entries(ORGANIZATION_ROUTING.DOMAIN_PATTERNS)) {
    if (pattern.test(hostname)) {
      const subdomain = hostname.split('.')[0]
      return {
        orgSlug: subdomain,
        subdomain: subdomain,
        environment: env,
        isCustomDomain: false,
      }
    }
  }
  
  // Check for completely custom domains (not following our patterns)
  if (!hostname.includes('processaudit.ai') && !hostname.includes('vercel.app')) {
    return {
      orgSlug: null, // Will need to be resolved from database
      customDomain: hostname,
      isCustomDomain: true,
    }
  }
  
  return null
}

const handleOrganizationRedirect = (req, orgContext) => {
  const url = req.nextUrl.clone()
  
  // Handle organization switching in path-based routing
  if (orgContext.type === 'path') {
    // Check if we're already in the correct organization path
    if (url.pathname.startsWith(`/org/${orgContext.identifier}`)) {
      return null // No redirect needed
    }
    
    // Redirect to organization-specific path if needed
    if (url.pathname === '/' || url.pathname === '/dashboard') {
      url.pathname = `/org/${orgContext.identifier}${url.pathname === '/' ? '/dashboard' : url.pathname}`
      return NextResponse.redirect(url)
    }
  }
  
  // Handle domain-based routing redirects
  if (orgContext.type === 'domain') {
    // Remove /org/[orgId] prefix for domain-based access
    if (url.pathname.startsWith('/org/')) {
      const pathParts = url.pathname.split('/')
      if (pathParts[2] === orgContext.identifier) {
        // Remove the /org/[orgId] prefix
        url.pathname = '/' + pathParts.slice(3).join('/')
        return NextResponse.redirect(url)
      }
    }
  }
  
  return null
}

export default authMiddleware({
  // Only apply Clerk middleware if the feature is enabled
  beforeAuth: (req) => {
    if (!USE_CLERK_AUTH) {
      return NextResponse.next()
    }
  },

  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/api/health',
    '/dev-access',
    '/api/process-file',
    '/api/generate-questions',
    '/api/analyze-process',
    '/org/:path*', // Allow organization paths for public access
    '/((?!api/automations/).*)', // Allow most routes for backwards compatibility
  ],

  // Routes that should ignore authentication entirely
  ignoredRoutes: [
    '/api/health',
    '/api/organizations/resolve', // Organization resolution endpoint
    '/_next/(.*)',
    '/favicon.ico',
    '/images/(.*)',
    '/public/(.*)',
  ],

  // Advanced organization routing logic
  afterAuth: (auth, req) => {
    if (!USE_CLERK_AUTH) {
      return NextResponse.next()
    }

    const url = req.nextUrl.clone()
    const orgContext = detectOrganizationContext(req)
    
    // Create base response
    const response = NextResponse.next()
    
    // Set organization context headers
    if (orgContext) {
      response.headers.set('x-org-context', JSON.stringify(orgContext))
      response.headers.set('x-org-type', orgContext.type)
      response.headers.set('x-org-identifier', orgContext.identifier || '')
      
      // Additional headers based on context type
      if (orgContext.type === 'domain') {
        response.headers.set('x-org-domain', orgContext.domain || '')
        response.headers.set('x-org-subdomain', orgContext.subdomain || '')
        if (orgContext.customDomain) {
          response.headers.set('x-org-custom-domain', orgContext.customDomain)
        }
      } else if (orgContext.type === 'path') {
        response.headers.set('x-org-original-path', orgContext.originalPath || '')
      }
    }
    
    // Handle organization-based redirects
    if (orgContext) {
      const redirect = handleOrganizationRedirect(req, orgContext)
      if (redirect) {
        // Copy organization headers to redirect response
        redirect.headers.set('x-org-context', JSON.stringify(orgContext))
        redirect.headers.set('x-org-type', orgContext.type)
        redirect.headers.set('x-org-identifier', orgContext.identifier || '')
        return redirect
      }
    }
    
    // Handle authentication requirements for organization routes
    if (orgContext && !auth.userId) {
      // Check if this is a public organization route
      const publicOrgRoutes = ['/', '/about', '/pricing', '/contact']
      const currentPath = orgContext.type === 'path' 
        ? url.pathname.replace(`/org/${orgContext.identifier}`, '') || '/'
        : url.pathname
        
      if (!publicOrgRoutes.includes(currentPath)) {
        // Redirect to sign-in with organization context
        const signInUrl = new URL('/sign-in', req.url)
        if (orgContext.type === 'path') {
          signInUrl.searchParams.set('redirect_url', url.pathname)
        } else {
          signInUrl.searchParams.set('redirect_url', url.pathname)
          signInUrl.searchParams.set('org', orgContext.identifier || orgContext.customDomain)
        }
        return NextResponse.redirect(signInUrl)
      }
    }
    
    // Handle organization membership validation (if authenticated)
    if (orgContext && auth.userId && auth.orgSlug && auth.orgSlug !== orgContext.identifier) {
      // User is authenticated but accessing a different organization
      // This will be handled by the organization context provider on the client side
      response.headers.set('x-org-mismatch', 'true')
      response.headers.set('x-user-org', auth.orgSlug)
    }

    return response
  },

  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
})

export const config = {
  matcher: [
    // Include all routes except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Include API routes
    '/(api|trpc)(.*)',
  ],
}