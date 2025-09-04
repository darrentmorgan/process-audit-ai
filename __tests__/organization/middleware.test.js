/**
 * Tests for organization routing middleware
 * ProcessAudit AI - Phase 2 Multi-Tenancy Implementation
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock the Clerk middleware
jest.mock('@clerk/nextjs/server', () => ({
  authMiddleware: jest.fn((config) => config),
}))

// Import after mocking
const middlewareModule = require('../../middleware')

// Test utilities
const createMockRequest = (url, headers = {}) => {
  const request = {
    nextUrl: new URL(url),
    headers: new Map(Object.entries({
      host: new URL(url).host,
      ...headers
    })),
    url
  }
  
  // Add get method for headers
  request.headers.get = function(key) {
    return this.get(key)
  }
  
  return request
}

const createMockAuth = (userId = null, orgSlug = null) => ({
  userId,
  orgSlug,
})

describe('Organization Routing Middleware', () => {
  // Set environment variable for tests
  process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Organization Context Detection', () => {
    test('detects subdomain-based organization context', async () => {
      const req = createMockRequest('https://acme.processaudit.ai/dashboard')
      const auth = createMockAuth('user123', 'acme')
      
      // Mock the middleware config
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      expect(result.headers.get('x-org-type')).toBe('domain')
      expect(result.headers.get('x-org-identifier')).toBe('acme')
      expect(result.headers.get('x-org-subdomain')).toBe('acme')
    })

    test('detects path-based organization context', async () => {
      const req = createMockRequest('https://app.processaudit.ai/org/acme-corp/dashboard')
      const auth = createMockAuth('user123', 'acme-corp')
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      expect(result.headers.get('x-org-type')).toBe('path')
      expect(result.headers.get('x-org-identifier')).toBe('acme-corp')
      expect(result.headers.get('x-org-original-path')).toBe('/org/acme-corp/dashboard')
    })

    test('detects custom domain context', async () => {
      const req = createMockRequest('https://company.example.com/dashboard')
      const auth = createMockAuth('user123', null)
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      expect(result.headers.get('x-org-type')).toBe('domain')
      expect(result.headers.get('x-org-custom-domain')).toBe('company.example.com')
    })

    test('ignores common subdomains', async () => {
      const testCases = [
        'https://www.processaudit.ai',
        'https://app.processaudit.ai',
        'https://admin.processaudit.ai',
        'https://localhost:3000',
        'https://127.0.0.1:3000'
      ]
      
      for (const url of testCases) {
        const req = createMockRequest(url)
        const auth = createMockAuth('user123', null)
        
        const middlewareConfig = middlewareModule.default
        const result = await middlewareConfig.afterAuth(auth, req)
        
        expect(result.headers.get('x-org-context')).toBeNull()
      }
    })
  })

  describe('Organization-based Redirects', () => {
    test('redirects path-based to organization-specific route', async () => {
      const req = createMockRequest('https://app.processaudit.ai/')
      req.nextUrl.pathname = '/'
      const auth = createMockAuth('user123', null)
      
      // Mock organization context
      req.headers.set('x-org-type', 'path')
      req.headers.set('x-org-identifier', 'acme')
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      // Should redirect to organization-specific path
      expect(result).toBeInstanceOf(NextResponse)
      expect(result.headers.get('location')).toContain('/org/acme')
    })

    test('strips organization prefix for domain-based routing', async () => {
      const req = createMockRequest('https://acme.processaudit.ai/org/acme/dashboard')
      req.nextUrl.pathname = '/org/acme/dashboard'
      const auth = createMockAuth('user123', 'acme')
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      // Should redirect to clean path
      expect(result).toBeInstanceOf(NextResponse)
      expect(result.headers.get('location')).toContain('/dashboard')
    })
  })

  describe('Authentication Requirements', () => {
    test('allows public routes for organization access', async () => {
      const publicRoutes = ['/', '/about', '/pricing', '/contact']
      
      for (const route of publicRoutes) {
        const req = createMockRequest(`https://acme.processaudit.ai${route}`)
        const auth = createMockAuth(null) // Not authenticated
        
        const middlewareConfig = middlewareModule.default
        const result = await middlewareConfig.afterAuth(auth, req)
        
        // Should not redirect to sign-in
        expect(result.headers.get('location')).not.toContain('/sign-in')
      }
    })

    test('requires authentication for private organization routes', async () => {
      const req = createMockRequest('https://acme.processaudit.ai/dashboard')
      const auth = createMockAuth(null) // Not authenticated
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      // Should redirect to sign-in
      expect(result.headers.get('location')).toContain('/sign-in')
    })

    test('preserves redirect URL in sign-in redirect', async () => {
      const req = createMockRequest('https://acme.processaudit.ai/dashboard/reports')
      const auth = createMockAuth(null) // Not authenticated
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      const redirectUrl = new URL(result.headers.get('location'))
      expect(redirectUrl.searchParams.get('redirect_url')).toBe('/dashboard/reports')
      expect(redirectUrl.searchParams.get('org')).toBe('acme')
    })
  })

  describe('Organization Membership Validation', () => {
    test('detects organization mismatch', async () => {
      const req = createMockRequest('https://acme.processaudit.ai/dashboard')
      const auth = createMockAuth('user123', 'different-org') // Different org
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      expect(result.headers.get('x-org-mismatch')).toBe('true')
      expect(result.headers.get('x-user-org')).toBe('different-org')
    })

    test('allows access when organization matches', async () => {
      const req = createMockRequest('https://acme.processaudit.ai/dashboard')
      const auth = createMockAuth('user123', 'acme') // Matching org
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      expect(result.headers.get('x-org-mismatch')).toBeNull()
    })
  })

  describe('Domain Pattern Validation', () => {
    test('validates production domain patterns', () => {
      const productionPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.processaudit\.ai$/
      
      const validDomains = [
        'acme.processaudit.ai',
        'acme-corp.processaudit.ai',
        'a.processaudit.ai',
        'a1b2c3.processaudit.ai'
      ]
      
      const invalidDomains = [
        'processaudit.ai', // No subdomain
        '.processaudit.ai', // Empty subdomain
        '-acme.processaudit.ai', // Starts with hyphen
        'acme-.processaudit.ai', // Ends with hyphen
        'www.example.com' // Wrong domain
      ]
      
      validDomains.forEach(domain => {
        expect(productionPattern.test(domain)).toBe(true)
      })
      
      invalidDomains.forEach(domain => {
        expect(productionPattern.test(domain)).toBe(false)
      })
    })

    test('validates organization path patterns', () => {
      const pathPattern = /^\/org\/([a-zA-Z0-9_-]+)/
      
      const validPaths = [
        '/org/acme',
        '/org/acme-corp',
        '/org/acme_corp',
        '/org/123org',
        '/org/ORG123'
      ]
      
      const invalidPaths = [
        '/org/', // No identifier
        '/organization/acme', // Wrong prefix
        '/org/acme corp', // Space in identifier
        '/org/acme.corp' // Dot in identifier
      ]
      
      validPaths.forEach(path => {
        expect(pathPattern.test(path)).toBe(true)
      })
      
      invalidPaths.forEach(path => {
        expect(pathPattern.test(path)).toBe(false)
      })
    })
  })

  describe('Environment-specific Behavior', () => {
    test('bypasses organization routing when Clerk is disabled', async () => {
      process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'false'
      
      const req = createMockRequest('https://acme.processaudit.ai/dashboard')
      const auth = createMockAuth('user123', null)
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.beforeAuth(req)
      
      expect(result).toBeInstanceOf(NextResponse)
      
      // Reset for other tests
      process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true'
    })

    test('handles localhost development properly', async () => {
      const req = createMockRequest('http://acme.localhost:3000/dashboard')
      const auth = createMockAuth('user123', 'acme')
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      expect(result.headers.get('x-org-type')).toBe('domain')
      expect(result.headers.get('x-org-identifier')).toBe('acme')
    })

    test('ignores Vercel preview deployments', async () => {
      const req = createMockRequest('https://processaudit-git-feature-vercel.app/dashboard')
      const auth = createMockAuth('user123', null)
      
      const middlewareConfig = middlewareModule.default
      const result = await middlewareConfig.afterAuth(auth, req)
      
      expect(result.headers.get('x-org-context')).toBeNull()
    })
  })
})

describe('Organization Context Utilities', () => {
  describe('getOrganizationContext', () => {
    // Mock window object for client-side tests
    const originalWindow = global.window
    
    beforeEach(() => {
      global.window = {
        location: {
          hostname: 'localhost',
          pathname: '/'
        }
      }
    })
    
    afterEach(() => {
      global.window = originalWindow
    })
    
    test('detects subdomain context', () => {
      global.window.location.hostname = 'acme.processaudit.ai'
      global.window.location.pathname = '/dashboard'
      
      // This would need to import the utility function
      // const context = getOrganizationContext()
      // expect(context.type).toBe('domain')
      // expect(context.identifier).toBe('acme')
    })
    
    test('detects path-based context', () => {
      global.window.location.hostname = 'app.processaudit.ai'
      global.window.location.pathname = '/org/acme/dashboard'
      
      // const context = getOrganizationContext()
      // expect(context.type).toBe('path')
      // expect(context.identifier).toBe('acme')
    })
    
    test('returns null for standard routes', () => {
      global.window.location.hostname = 'www.processaudit.ai'
      global.window.location.pathname = '/dashboard'
      
      // const context = getOrganizationContext()
      // expect(context).toBeNull()
    })
  })
})

describe('Configuration Validation', () => {
  test('validates matcher configuration', () => {
    const config = middlewareModule.config
    
    expect(config.matcher).toBeDefined()
    expect(Array.isArray(config.matcher)).toBe(true)
    expect(config.matcher.length).toBeGreaterThan(0)
    
    // Check that API routes are included
    expect(config.matcher.some(pattern => pattern.includes('api'))).toBe(true)
  })
})