/**
 * UnifiedAuthContext Unit Tests
 * ProcessAudit AI - Clerk Migration Phase 4 Testing
 * 
 * Tests the Clerk-only authentication context to ensure:
 * - Context provides correct auth state
 * - Organization switching functionality works
 * - API compatibility maintained (same method signatures)
 * - Proper Clerk hooks integration
 */

import React from 'react'
import { render, renderHook, act, waitFor, screen } from '@testing-library/react'
import { useRouter } from 'next/router'
import { UnifiedAuthProvider, useUnifiedAuth, getOrganizationContext, isOrganizationsEnabled } from '../../contexts/UnifiedAuthContext'
import { useClerkBridge } from '../../components/ClerkAuthBridge'

// Mock Next.js router
jest.mock('next/router')

// Mock ClerkAuthBridge
jest.mock('../../components/ClerkAuthBridge')

// Mock window.location for organization context tests
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    hostname: 'localhost',
    pathname: '/',
  },
})

describe('UnifiedAuthContext', () => {
  // Mock implementations
  const mockRouter = {
    push: jest.fn(),
    asPath: '/',
  }

  const createMockClerkAuth = (overrides = {}) => ({
    isLoaded: true,
    isSignedIn: false,
    user: null,
    signOut: jest.fn(),
    ...overrides,
  })

  const createMockClerkBridge = (overrides = {}) => ({
    clerkAuth: createMockClerkAuth(),
    organization: null,
    membershipList: [],
    orgLoaded: true,
    setActive: jest.fn(),
    organizationList: [],
    orgListLoaded: true,
    setActiveOrg: jest.fn(),
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
    useClerkBridge.mockReturnValue(createMockClerkBridge())
    
    // Reset window location
    window.location.hostname = 'localhost'
    window.location.pathname = '/'
    
    // Set environment variables for configuration
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock'
    process.env.CLERK_SECRET_KEY = 'sk_test_mock'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    delete process.env.CLERK_SECRET_KEY
  })

  describe('Context Provider', () => {
    it('provides authentication context without errors', () => {
      const TestComponent = () => {
        const auth = useUnifiedAuth()
        return <div data-testid="auth-context">{JSON.stringify(auth.authSystem)}</div>
      }

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      )

      expect(screen.getByTestId('auth-context')).toHaveTextContent('"clerk"')
    })

    it('throws error when used outside provider', () => {
      const TestComponent = () => {
        useUnifiedAuth()
        return <div>Test</div>
      }

      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      expect(() => render(<TestComponent />)).toThrow(
        'useUnifiedAuth must be used within a UnifiedAuthProvider'
      )

      console.error = originalError
    })

    it('provides all required auth properties', () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      const auth = result.current

      // Core authentication state
      expect(auth).toHaveProperty('user')
      expect(auth).toHaveProperty('isSignedIn')
      expect(auth).toHaveProperty('isLoaded')
      expect(auth).toHaveProperty('loading')

      // Organization state
      expect(auth).toHaveProperty('organization')
      expect(auth).toHaveProperty('isOrgAdmin')
      expect(auth).toHaveProperty('orgMemberships')
      expect(auth).toHaveProperty('orgLoaded')
      expect(auth).toHaveProperty('availableOrganizations')
      expect(auth).toHaveProperty('orgListLoaded')

      // Organization context
      expect(auth).toHaveProperty('orgContext')
      expect(auth).toHaveProperty('isOrgContextLoaded')

      // Methods
      expect(auth).toHaveProperty('switchOrganization')
      expect(auth).toHaveProperty('setActive')
      expect(auth).toHaveProperty('signUp')
      expect(auth).toHaveProperty('signIn')
      expect(auth).toHaveProperty('signOut')
      expect(auth).toHaveProperty('resetPassword')
      expect(auth).toHaveProperty('updateProfile')

      // Configuration
      expect(auth).toHaveProperty('isConfigured')
      expect(auth).toHaveProperty('authSystem')
      expect(auth.authSystem).toBe('clerk')
    })
  })

  describe('Authentication State', () => {
    it('reflects unauthenticated state correctly', () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      const auth = result.current
      expect(auth.user).toBeNull()
      expect(auth.isSignedIn).toBe(false)
      expect(auth.isLoaded).toBe(true)
      expect(auth.loading).toBe(false)
    })

    it('reflects authenticated state correctly', () => {
      const mockUser = global.testHelpers.createMockUser()
      const mockClerkAuth = createMockClerkAuth({
        isSignedIn: true,
        user: mockUser,
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          clerkAuth: mockClerkAuth,
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      const auth = result.current
      expect(auth.user).toEqual(mockUser)
      expect(auth.isSignedIn).toBe(true)
      expect(auth.isLoaded).toBe(true)
      expect(auth.loading).toBe(false)
    })

    it('reflects loading state correctly', () => {
      const mockClerkAuth = createMockClerkAuth({
        isLoaded: false,
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          clerkAuth: mockClerkAuth,
          orgLoaded: false,
          orgListLoaded: false,
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      const auth = result.current
      expect(auth.isLoaded).toBe(false)
      expect(auth.loading).toBe(true)
    })
  })

  describe('Organization State', () => {
    it('provides organization state correctly', () => {
      const mockOrganization = global.testHelpers.createMockOrganization()
      const mockMembership = global.testHelpers.createMockMembership({
        organization: mockOrganization,
        role: 'admin',
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          organization: mockOrganization,
          membershipList: [mockMembership],
          organizationList: [mockMembership],
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      const auth = result.current
      expect(auth.organization).toEqual(mockOrganization)
      expect(auth.isOrgAdmin).toBe(true)
      expect(auth.orgMemberships).toEqual([mockMembership])
      expect(auth.availableOrganizations).toHaveLength(1)
    })

    it('calculates admin status correctly for different roles', () => {
      const mockOrganization = global.testHelpers.createMockOrganization()
      const mockMembership = global.testHelpers.createMockMembership({
        organization: mockOrganization,
        role: 'member',
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          organization: mockOrganization,
          membershipList: [mockMembership],
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      const auth = result.current
      expect(auth.isOrgAdmin).toBe(false)
    })

    it('maps available organizations correctly', () => {
      const mockOrg1 = global.testHelpers.createMockOrganization({
        id: 'org_1',
        slug: 'org-1',
        name: 'Organization 1',
      })
      const mockOrg2 = global.testHelpers.createMockOrganization({
        id: 'org_2',
        slug: 'org-2',
        name: 'Organization 2',
      })

      const mockMembership1 = global.testHelpers.createMockMembership({
        organization: mockOrg1,
        role: 'admin',
      })
      const mockMembership2 = global.testHelpers.createMockMembership({
        organization: mockOrg2,
        role: 'member',
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          organizationList: [mockMembership1, mockMembership2],
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      const auth = result.current
      expect(auth.availableOrganizations).toHaveLength(2)
      expect(auth.availableOrganizations[0]).toEqual({
        id: 'org_1',
        slug: 'org-1',
        name: 'Organization 1',
        imageUrl: '',
        role: 'admin',
        permissions: [],
      })
    })
  })

  describe('Organization Context Detection', () => {
    it('detects organization context from URL changes', async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      // Update router path to simulate navigation
      act(() => {
        mockRouter.asPath = '/org/test-org/dashboard'
        window.location.pathname = '/org/test-org/dashboard'
      })

      await waitFor(() => {
        const auth = result.current
        expect(auth.isOrgContextLoaded).toBe(true)
      })
    })

    it('updates context when authentication state changes', async () => {
      const mockClerkAuth = createMockClerkAuth({
        isLoaded: false,
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          clerkAuth: mockClerkAuth,
        })
      )

      const { result, rerender } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      expect(result.current.isOrgContextLoaded).toBe(false)

      // Update to loaded state
      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          clerkAuth: createMockClerkAuth({ isLoaded: true }),
        })
      )

      rerender()

      await waitFor(() => {
        expect(result.current.isOrgContextLoaded).toBe(true)
      })
    })
  })

  describe('Organization Switching', () => {
    it('switches organization by ID', async () => {
      const mockSetActive = jest.fn()
      const mockOrg1 = global.testHelpers.createMockOrganization({
        id: 'org_1',
        slug: 'org-1',
      })
      const mockOrg2 = global.testHelpers.createMockOrganization({
        id: 'org_2',
        slug: 'org-2',
      })

      const mockMembership1 = global.testHelpers.createMockMembership({
        organization: mockOrg1,
      })
      const mockMembership2 = global.testHelpers.createMockMembership({
        organization: mockOrg2,
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          setActive: mockSetActive,
          organizationList: [mockMembership1, mockMembership2],
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      await act(async () => {
        await result.current.switchOrganization('org_2')
      })

      expect(mockSetActive).toHaveBeenCalledWith({ organization: 'org_2' })
    })

    it('switches organization by slug', async () => {
      const mockSetActive = jest.fn()
      const mockOrg1 = global.testHelpers.createMockOrganization({
        id: 'org_1',
        slug: 'org-1',
      })

      const mockMembership = global.testHelpers.createMockMembership({
        organization: mockOrg1,
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          setActive: mockSetActive,
          organizationList: [mockMembership],
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      await act(async () => {
        await result.current.switchOrganization('org-1')
      })

      expect(mockSetActive).toHaveBeenCalledWith({ organization: 'org_1' })
    })

    it('switches organization by object', async () => {
      const mockSetActive = jest.fn()

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          setActive: mockSetActive,
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      await act(async () => {
        await result.current.switchOrganization({ id: 'org_test' })
      })

      expect(mockSetActive).toHaveBeenCalledWith({ organization: 'org_test' })
    })

    it('updates URL for path-based routing', async () => {
      const mockSetActive = jest.fn()
      const mockOrg1 = global.testHelpers.createMockOrganization({
        id: 'org_1',
        slug: 'old-org',
      })
      const mockOrg2 = global.testHelpers.createMockOrganization({
        id: 'org_2',
        slug: 'new-org',
      })

      const mockMembership1 = global.testHelpers.createMockMembership({
        organization: mockOrg1,
      })
      const mockMembership2 = global.testHelpers.createMockMembership({
        organization: mockOrg2,
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          setActive: mockSetActive,
          organizationList: [mockMembership1, mockMembership2],
        })
      )

      // Set path-based organization context
      window.location.pathname = '/org/old-org/dashboard'
      mockRouter.asPath = '/org/old-org/dashboard'

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      await act(async () => {
        await result.current.switchOrganization('org_2')
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/org/new-org/dashboard')
    })

    it('handles switching errors gracefully', async () => {
      const mockSetActive = jest.fn().mockRejectedValue(new Error('Switch failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          setActive: mockSetActive,
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      await act(async () => {
        await result.current.switchOrganization('org_test')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error switching organization:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Authentication Methods', () => {
    it('signUp throws error directing to Clerk component', async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      await expect(
        result.current.signUp('test@example.com', 'password')
      ).rejects.toThrow('Use Clerk SignUp component for registration')
    })

    it('signIn throws error directing to Clerk component', async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      await expect(
        result.current.signIn('test@example.com', 'password')
      ).rejects.toThrow('Use Clerk SignIn component for authentication')
    })

    it('resetPassword throws error directing to Clerk flow', async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      await expect(
        result.current.resetPassword('test@example.com')
      ).rejects.toThrow('Use Clerk password reset flow')
    })

    it('signOut calls Clerk signOut method', async () => {
      const mockSignOut = jest.fn()
      const mockClerkAuth = createMockClerkAuth({
        signOut: mockSignOut,
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          clerkAuth: mockClerkAuth,
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSignOut).toHaveBeenCalled()
    })

    it('updateProfile calls user update method', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ id: 'user_123' })
      const mockUser = global.testHelpers.createMockUser({
        update: mockUpdate,
      })
      const mockClerkAuth = createMockClerkAuth({
        user: mockUser,
      })

      useClerkBridge.mockReturnValue(
        createMockClerkBridge({
          clerkAuth: mockClerkAuth,
        })
      )

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      const updates = { firstName: 'New Name' }
      await act(async () => {
        await result.current.updateProfile(updates)
      })

      expect(mockUpdate).toHaveBeenCalledWith(updates)
    })
  })

  describe('Configuration', () => {
    it('detects when Clerk is configured', () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      expect(result.current.isConfigured).toBe(true)
    })

    it('detects when Clerk is not configured', () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      delete process.env.CLERK_SECRET_KEY

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      expect(result.current.isConfigured).toBe(false)
    })
  })

  describe('API Compatibility', () => {
    it('maintains the same method signatures as before', () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: UnifiedAuthProvider,
      })

      const auth = result.current

      // Check that all legacy methods exist and are functions
      expect(typeof auth.signUp).toBe('function')
      expect(typeof auth.signIn).toBe('function')
      expect(typeof auth.signOut).toBe('function')
      expect(typeof auth.resetPassword).toBe('function')
      expect(typeof auth.updateProfile).toBe('function')
      expect(typeof auth.switchOrganization).toBe('function')

      // Check that method signatures accept expected parameters
      expect(auth.signUp.length).toBe(3) // email, password, metadata
      expect(auth.signIn.length).toBe(2) // email, password
      expect(auth.resetPassword.length).toBe(1) // email
      expect(auth.updateProfile.length).toBe(1) // updates
      expect(auth.switchOrganization.length).toBe(1) // orgIdentifier
    })
  })
})

describe('Utility Functions', () => {
  beforeEach(() => {
    // Reset window location
    window.location.hostname = 'localhost'
    window.location.pathname = '/'
  })

  describe('getOrganizationContext', () => {
    it('returns null for localhost', () => {
      window.location.hostname = 'localhost'
      expect(getOrganizationContext()).toBeNull()
    })

    it('returns null for 127.0.0.1', () => {
      window.location.hostname = '127.0.0.1'
      expect(getOrganizationContext()).toBeNull()
    })

    it('returns null for common subdomains', () => {
      const commonSubdomains = ['www', 'app', 'admin']
      commonSubdomains.forEach(subdomain => {
        window.location.hostname = `${subdomain}.processaudit.ai`
        expect(getOrganizationContext()).toBeNull()
      })
    })

    it('returns null for vercel preview URLs', () => {
      window.location.hostname = 'processaudit-git-feature.vercel.app'
      expect(getOrganizationContext()).toBeNull()
    })

    it('detects domain-based organization context', () => {
      window.location.hostname = 'acme.processaudit.ai'
      const context = getOrganizationContext()
      expect(context).toEqual({
        type: 'domain',
        identifier: 'acme.processaudit.ai',
      })
    })

    it('detects path-based organization context', () => {
      window.location.hostname = 'app.processaudit.ai'
      window.location.pathname = '/org/acme-corp/dashboard'
      const context = getOrganizationContext()
      expect(context).toEqual({
        type: 'path',
        identifier: 'acme-corp',
      })
    })

    it('returns null for invalid path patterns', () => {
      window.location.pathname = '/org/'
      expect(getOrganizationContext()).toBeNull()

      window.location.pathname = '/organization/acme'
      expect(getOrganizationContext()).toBeNull()
    })

    it('handles custom domains', () => {
      window.location.hostname = 'company.example.com'
      const context = getOrganizationContext()
      expect(context).toEqual({
        type: 'domain',
        identifier: 'company.example.com',
      })
    })
  })

  describe('isOrganizationsEnabled', () => {
    it('returns true when Clerk is configured', () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock'
      process.env.CLERK_SECRET_KEY = 'sk_test_mock'
      expect(isOrganizationsEnabled()).toBe(true)
    })

    it('returns false when Clerk is not configured', () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      delete process.env.CLERK_SECRET_KEY
      expect(isOrganizationsEnabled()).toBe(false)
    })

    it('returns false when only public key is configured', () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock'
      delete process.env.CLERK_SECRET_KEY
      expect(isOrganizationsEnabled()).toBe(false)
    })
  })
})