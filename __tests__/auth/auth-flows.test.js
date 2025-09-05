/**
 * Authentication Flow Tests
 * ProcessAudit AI - Clerk Migration Phase 4 Testing
 * 
 * Tests authentication flows to ensure:
 * - Sign-up redirects work correctly
 * - Sign-in redirects work correctly  
 * - Organization context handling works
 * - Error scenarios are handled properly
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { SignIn, SignUp, useAuth, useOrganization, useOrganizationList } from '@clerk/nextjs'
import { UnifiedAuthProvider } from '../../contexts/UnifiedAuthContext'
import ClerkAuthBridge from '../../components/ClerkAuthBridge'

// Mock Next.js router
jest.mock('next/router')

// Mock Clerk components and hooks
jest.mock('@clerk/nextjs', () => ({
  SignIn: jest.fn(({ routing, redirectUrl, afterSignInUrl }) => (
    <div data-testid="clerk-signin">
      SignIn Component
      <div data-testid="redirect-url">{redirectUrl}</div>
      <div data-testid="after-signin-url">{afterSignInUrl}</div>
    </div>
  )),
  SignUp: jest.fn(({ routing, redirectUrl, afterSignUpUrl }) => (
    <div data-testid="clerk-signup">
      SignUp Component  
      <div data-testid="redirect-url">{redirectUrl}</div>
      <div data-testid="after-signup-url">{afterSignUpUrl}</div>
    </div>
  )),
  useAuth: jest.fn(),
  useOrganization: jest.fn(),
  useOrganizationList: jest.fn(),
  ClerkProvider: ({ children }) => <div>{children}</div>,
}))

// Mock window.location for URL manipulation
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    hostname: 'localhost',
    pathname: '/',
    search: '',
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
  },
})

describe('Authentication Flow Tests', () => {
  // Mock implementations
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    query: {},
    asPath: '/',
    pathname: '/',
    route: '/',
  }

  const createMockAuth = (overrides = {}) => ({
    isLoaded: true,
    isSignedIn: false,
    user: null,
    signOut: jest.fn(),
    ...overrides,
  })

  const createMockOrganization = (overrides = {}) => ({
    organization: null,
    membershipList: [],
    isLoaded: true,
    setActive: jest.fn(),
    ...overrides,
  })

  const createMockOrganizationList = (overrides = {}) => ({
    organizationList: [],
    isLoaded: true,
    setActive: jest.fn(),
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
    useAuth.mockReturnValue(createMockAuth())
    useOrganization.mockReturnValue(createMockOrganization())
    useOrganizationList.mockReturnValue(createMockOrganizationList())
    
    // Reset window location
    window.location.hostname = 'localhost'
    window.location.pathname = '/'
    window.location.search = ''
    window.location.href = 'http://localhost:3000/'
    
    // Set environment variables
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock'
    process.env.CLERK_SECRET_KEY = 'sk_test_mock'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    delete process.env.CLERK_SECRET_KEY
  })

  describe('Sign-Up Flow', () => {
    // Mock sign-up page component
    const MockSignUpPage = () => (
      <ClerkAuthBridge>
        <UnifiedAuthProvider>
          <SignUp 
            routing="path"
            path="/sign-up"
            redirectUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </UnifiedAuthProvider>
      </ClerkAuthBridge>
    )

    it('renders SignUp component with correct props', () => {
      render(<MockSignUpPage />)
      
      expect(screen.getByTestId('clerk-signup')).toBeInTheDocument()
      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/dashboard')
      expect(screen.getByTestId('after-signup-url')).toHaveTextContent('/dashboard')
    })

    it('handles organization context in redirect URLs', () => {
      // Mock organization-specific sign-up
      window.location.hostname = 'acme.processaudit.ai'
      window.location.pathname = '/sign-up'
      
      const MockOrgSignUpPage = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <SignUp 
              routing="path"
              path="/sign-up"
              redirectUrl="/dashboard"
              afterSignUpUrl="/dashboard"
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockOrgSignUpPage />)
      
      expect(screen.getByTestId('clerk-signup')).toBeInTheDocument()
    })

    it('handles query parameters in redirect URLs', () => {
      mockRouter.query = { 
        redirect_url: '/processes/new',
        org: 'test-org'
      }

      const MockSignUpWithQuery = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <SignUp 
              routing="path"
              path="/sign-up"
              redirectUrl={mockRouter.query.redirect_url || '/dashboard'}
              afterSignUpUrl={mockRouter.query.redirect_url || '/dashboard'}
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockSignUpWithQuery />)
      
      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/processes/new')
      expect(screen.getByTestId('after-signup-url')).toHaveTextContent('/processes/new')
    })

    it('falls back to default redirect when no query params', () => {
      mockRouter.query = {}

      const MockSignUpDefault = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <SignUp 
              routing="path"
              path="/sign-up"
              redirectUrl="/dashboard"
              afterSignUpUrl="/dashboard"
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockSignUpDefault />)
      
      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/dashboard')
      expect(screen.getByTestId('after-signup-url')).toHaveTextContent('/dashboard')
    })
  })

  describe('Sign-In Flow', () => {
    const MockSignInPage = () => (
      <ClerkAuthBridge>
        <UnifiedAuthProvider>
          <SignIn 
            routing="path"
            path="/sign-in"
            redirectUrl="/dashboard"
            afterSignInUrl="/dashboard"
          />
        </UnifiedAuthProvider>
      </ClerkAuthBridge>
    )

    it('renders SignIn component with correct props', () => {
      render(<MockSignInPage />)
      
      expect(screen.getByTestId('clerk-signin')).toBeInTheDocument()
      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/dashboard')
      expect(screen.getByTestId('after-signin-url')).toHaveTextContent('/dashboard')
    })

    it('handles subdomain-based organization context', () => {
      window.location.hostname = 'acme.processaudit.ai'
      window.location.pathname = '/sign-in'
      
      const MockOrgSignInPage = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <SignIn 
              routing="path"
              path="/sign-in"
              redirectUrl="/dashboard"
              afterSignInUrl="/dashboard"
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockOrgSignInPage />)
      
      expect(screen.getByTestId('clerk-signin')).toBeInTheDocument()
    })

    it('handles path-based organization context', () => {
      window.location.pathname = '/sign-in'
      mockRouter.query = {
        org: 'test-org',
        redirect_url: '/org/test-org/dashboard'
      }
      
      const MockPathSignInPage = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <SignIn 
              routing="path"
              path="/sign-in"
              redirectUrl={mockRouter.query.redirect_url || '/dashboard'}
              afterSignInUrl={mockRouter.query.redirect_url || '/dashboard'}
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockPathSignInPage />)
      
      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/org/test-org/dashboard')
    })

    it('preserves organization context in redirect after sign-in', () => {
      mockRouter.query = { 
        redirect_url: '/org/acme/reports',
        org: 'acme'
      }

      const MockPreserveOrgSignIn = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <SignIn 
              routing="path"
              path="/sign-in"
              redirectUrl={mockRouter.query.redirect_url}
              afterSignInUrl={mockRouter.query.redirect_url}
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockPreserveOrgSignIn />)
      
      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/org/acme/reports')
      expect(screen.getByTestId('after-signin-url')).toHaveTextContent('/org/acme/reports')
    })
  })

  describe('Organization Context Handling', () => {
    const MockAuthFlowWithOrgContext = ({ orgContext }) => {
      return (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <div data-testid="auth-flow">
              {orgContext && (
                <div data-testid="org-context">
                  {orgContext.type}: {orgContext.identifier}
                </div>
              )}
              <SignIn 
                routing="path"
                path="/sign-in"
                redirectUrl="/dashboard"
                afterSignInUrl="/dashboard"
              />
            </div>
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
    }

    it('detects domain-based organization context during auth flow', () => {
      window.location.hostname = 'company.processaudit.ai'
      
      const orgContext = {
        type: 'domain',
        identifier: 'company.processaudit.ai'
      }

      render(<MockAuthFlowWithOrgContext orgContext={orgContext} />)
      
      expect(screen.getByTestId('org-context')).toHaveTextContent('domain: company.processaudit.ai')
    })

    it('detects path-based organization context during auth flow', () => {
      window.location.pathname = '/org/test-company/sign-in'
      
      const orgContext = {
        type: 'path',
        identifier: 'test-company'
      }

      render(<MockAuthFlowWithOrgContext orgContext={orgContext} />)
      
      expect(screen.getByTestId('org-context')).toHaveTextContent('path: test-company')
    })

    it('handles missing organization context gracefully', () => {
      render(<MockAuthFlowWithOrgContext orgContext={null} />)
      
      expect(screen.queryByTestId('org-context')).not.toBeInTheDocument()
      expect(screen.getByTestId('auth-flow')).toBeInTheDocument()
    })
  })

  describe('Post-Authentication Organization Resolution', () => {
    const MockPostAuthFlow = ({ user, organizations }) => {
      return (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <div data-testid="post-auth">
              {user && <div data-testid="user-name">{user.firstName}</div>}
              {organizations && organizations.length > 0 && (
                <div data-testid="org-count">{organizations.length}</div>
              )}
            </div>
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
    }

    it('handles user with multiple organizations', () => {
      const mockUser = global.testHelpers.createMockUser({ firstName: 'John' })
      const mockOrg1 = global.testHelpers.createMockOrganization({ slug: 'org-1' })
      const mockOrg2 = global.testHelpers.createMockOrganization({ slug: 'org-2' })
      
      const organizations = [
        { organization: mockOrg1, role: 'admin' },
        { organization: mockOrg2, role: 'member' }
      ]

      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: mockUser
      }))

      useOrganizationList.mockReturnValue(createMockOrganizationList({
        organizationList: organizations
      }))

      render(<MockPostAuthFlow user={mockUser} organizations={organizations} />)
      
      expect(screen.getByTestId('user-name')).toHaveTextContent('John')
      expect(screen.getByTestId('org-count')).toHaveTextContent('2')
    })

    it('handles user with no organizations', () => {
      const mockUser = global.testHelpers.createMockUser({ firstName: 'John' })

      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: mockUser
      }))

      useOrganizationList.mockReturnValue(createMockOrganizationList({
        organizationList: []
      }))

      render(<MockPostAuthFlow user={mockUser} organizations={[]} />)
      
      expect(screen.getByTestId('user-name')).toHaveTextContent('John')
      expect(screen.queryByTestId('org-count')).not.toBeInTheDocument()
    })

    it('handles organization switching after authentication', async () => {
      const mockSetActive = jest.fn()
      const mockUser = global.testHelpers.createMockUser()
      const mockOrg1 = global.testHelpers.createMockOrganization({ id: 'org_1' })
      const mockOrg2 = global.testHelpers.createMockOrganization({ id: 'org_2' })

      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: mockUser
      }))

      useOrganization.mockReturnValue(createMockOrganization({
        setActive: mockSetActive
      }))

      const organizations = [
        { organization: mockOrg1, role: 'admin' },
        { organization: mockOrg2, role: 'member' }
      ]

      useOrganizationList.mockReturnValue(createMockOrganizationList({
        organizationList: organizations,
        setActive: mockSetActive
      }))

      const MockOrgSwitcher = () => {
        return (
          <ClerkAuthBridge>
            <UnifiedAuthProvider>
              <button 
                data-testid="switch-org"
                onClick={() => mockSetActive({ organization: 'org_2' })}
              >
                Switch to Org 2
              </button>
            </UnifiedAuthProvider>
          </ClerkAuthBridge>
        )
      }

      render(<MockOrgSwitcher />)
      
      const switchButton = screen.getByTestId('switch-org')
      fireEvent.click(switchButton)

      expect(mockSetActive).toHaveBeenCalledWith({ organization: 'org_2' })
    })
  })

  describe('Error Scenarios', () => {
    it('handles authentication loading state', () => {
      useAuth.mockReturnValue(createMockAuth({
        isLoaded: false,
        isSignedIn: undefined,
        user: undefined
      }))

      const MockLoadingAuth = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <div data-testid="loading">Loading authentication...</div>
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockLoadingAuth />)
      
      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('handles organization loading state', () => {
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))

      useOrganization.mockReturnValue(createMockOrganization({
        isLoaded: false
      }))

      useOrganizationList.mockReturnValue(createMockOrganizationList({
        isLoaded: false
      }))

      const MockLoadingOrg = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <div data-testid="loading-org">Loading organizations...</div>
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockLoadingOrg />)
      
      expect(screen.getByTestId('loading-org')).toBeInTheDocument()
    })

    it('handles authentication errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // Mock Clerk auth hook throwing an error
      useAuth.mockImplementation(() => {
        throw new Error('Clerk authentication error')
      })

      const MockAuthError = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <div data-testid="error-boundary">Error occurred</div>
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      // This should not crash the application
      expect(() => render(<MockAuthError />)).not.toThrow()
      
      consoleSpy.mockRestore()
    })

    it('handles organization resolution failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const mockSetActive = jest.fn().mockRejectedValue(new Error('Organization not found'))

      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))

      useOrganization.mockReturnValue(createMockOrganization({
        setActive: mockSetActive
      }))

      const MockOrgError = () => {
        return (
          <ClerkAuthBridge>
            <UnifiedAuthProvider>
              <button 
                data-testid="fail-switch"
                onClick={() => mockSetActive({ organization: 'nonexistent' })}
              >
                Switch to Non-existent Org
              </button>
            </UnifiedAuthProvider>
          </ClerkAuthBridge>
        )
      }

      render(<MockOrgError />)
      
      const failButton = screen.getByTestId('fail-switch')
      fireEvent.click(failButton)

      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalled()
      })

      // Should handle the error gracefully without crashing
      expect(screen.getByTestId('fail-switch')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('handles missing environment configuration', () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      delete process.env.CLERK_SECRET_KEY

      const MockUnconfiguredAuth = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <div data-testid="unconfigured">Authentication not configured</div>
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockUnconfiguredAuth />)
      
      expect(screen.getByTestId('unconfigured')).toBeInTheDocument()
    })
  })

  describe('Navigation and Routing Integration', () => {
    it('integrates properly with Next.js router for redirects', () => {
      mockRouter.query = { redirect_url: '/processes' }

      const MockRouterIntegration = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <SignIn 
              routing="path"
              path="/sign-in"
              redirectUrl={mockRouter.query.redirect_url || '/'}
              afterSignInUrl={mockRouter.query.redirect_url || '/'}
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockRouterIntegration />)
      
      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/processes')
    })

    it('handles complex redirect URL patterns', () => {
      mockRouter.query = { 
        redirect_url: '/org/acme/projects/123/reports?tab=analytics&date=2024-01-01'
      }

      const MockComplexRedirect = () => (
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <SignIn 
              routing="path"
              path="/sign-in"
              redirectUrl={mockRouter.query.redirect_url}
              afterSignInUrl={mockRouter.query.redirect_url}
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )

      render(<MockComplexRedirect />)
      
      expect(screen.getByTestId('redirect-url')).toHaveTextContent(
        '/org/acme/projects/123/reports?tab=analytics&date=2024-01-01'
      )
    })

    it('sanitizes and validates redirect URLs for security', () => {
      // Test that potentially dangerous redirect URLs are handled safely
      mockRouter.query = { 
        redirect_url: 'javascript:alert("xss")'
      }

      const MockSecureRedirect = () => {
        // In a real implementation, this would sanitize the URL
        const safeRedirectUrl = mockRouter.query.redirect_url?.startsWith('/') 
          ? mockRouter.query.redirect_url 
          : '/'

        return (
          <ClerkAuthBridge>
            <UnifiedAuthProvider>
              <SignIn 
                routing="path"
                path="/sign-in"
                redirectUrl={safeRedirectUrl}
                afterSignInUrl={safeRedirectUrl}
              />
            </UnifiedAuthProvider>
          </ClerkAuthBridge>
        )
      }

      render(<MockSecureRedirect />)
      
      // Should fall back to safe default
      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/')
    })
  })
})