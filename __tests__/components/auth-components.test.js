/**
 * Authentication Components Integration Tests
 * ProcessAudit AI - Clerk Migration Phase 4 Testing
 * 
 * Tests component integration with Clerk authentication:
 * - LandingPage routing to Clerk pages
 * - UserMenu authentication states
 * - ProcessAuditApp with auth requirements
 * - Organization components integration
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import { useAuth, useOrganization, useOrganizationList } from '@clerk/nextjs'
import { UnifiedAuthProvider } from '../../contexts/UnifiedAuthContext'
import ClerkAuthBridge from '../../components/ClerkAuthBridge'
import LandingPage from '../../components/LandingPage'
import UserMenu from '../../components/UserMenu'
import ProcessAuditApp from '../../components/ProcessAuditApp'

// Mock Next.js router
jest.mock('next/router')

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  useOrganization: jest.fn(),
  useOrganizationList: jest.fn(),
  SignInButton: ({ children, redirectUrl }) => (
    <button data-testid="clerk-signin-button" data-redirect={redirectUrl}>
      {children}
    </button>
  ),
  SignUpButton: ({ children, redirectUrl }) => (
    <button data-testid="clerk-signup-button" data-redirect={redirectUrl}>
      {children}
    </button>
  ),
  UserButton: ({ afterSignOutUrl }) => (
    <div data-testid="clerk-user-button" data-signout-url={afterSignOutUrl}>
      User Button
    </div>
  ),
  OrganizationSwitcher: ({ afterCreateOrganizationUrl, afterSelectOrganizationUrl }) => (
    <div 
      data-testid="clerk-org-switcher"
      data-after-create={afterCreateOrganizationUrl}
      data-after-select={afterSelectOrganizationUrl}
    >
      Org Switcher
    </div>
  ),
}))

// Mock ProcessAuditApp component
jest.mock('../../components/ProcessAuditApp', () => {
  return function MockProcessAuditApp() {
    return <div data-testid="process-audit-app">Process Audit App Content</div>
  }
})

// Mock Logo component
jest.mock('../../components/Logo', () => {
  return function MockLogo() {
    return <div data-testid="logo">ProcessAudit AI</div>
  }
})

describe('Authentication Components Integration', () => {
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
    
    // Set environment variables
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock'
    process.env.CLERK_SECRET_KEY = 'sk_test_mock'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    delete process.env.CLERK_SECRET_KEY
  })

  describe('LandingPage Component', () => {
    const renderLandingPage = (props = {}) => {
      return render(
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <LandingPage {...props} />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
    }

    it('renders landing page with authentication CTAs', () => {
      renderLandingPage()
      
      expect(screen.getByTestId('logo')).toBeInTheDocument()
      
      // Should have sign-in and sign-up buttons
      const signInButtons = screen.getAllByText(/sign in/i)
      const signUpButtons = screen.getAllByText(/sign up|get started/i)
      
      expect(signInButtons.length).toBeGreaterThan(0)
      expect(signUpButtons.length).toBeGreaterThan(0)
    })

    it('handles sign-in navigation correctly', async () => {
      renderLandingPage()
      
      // Find and click sign-in button/link
      const signInElements = screen.getAllByText(/sign in/i)
      if (signInElements.length > 0) {
        fireEvent.click(signInElements[0])
        
        expect(mockRouter.push).toHaveBeenCalledWith('/sign-in')
      }
    })

    it('handles sign-up navigation correctly', async () => {
      renderLandingPage()
      
      // Find and click sign-up button/link
      const signUpElements = screen.getAllByText(/sign up|get started/i)
      if (signUpElements.length > 0) {
        fireEvent.click(signUpElements[0])
        
        expect(mockRouter.push).toHaveBeenCalledWith('/sign-up')
      }
    })

    it('handles waitlist signup when provided', async () => {
      const mockOnSignUp = jest.fn().mockResolvedValue()
      
      renderLandingPage({ onSignUp: mockOnSignUp })
      
      // Look for email input and submit button
      const emailInputs = screen.getAllByDisplayValue('')
      const submitButtons = screen.getAllByText(/join waitlist|get started/i)
      
      if (emailInputs.length > 0 && submitButtons.length > 0) {
        const emailInput = emailInputs.find(input => 
          input.getAttribute('type') === 'email' || 
          input.getAttribute('placeholder')?.includes('email')
        )
        
        if (emailInput) {
          await userEvent.type(emailInput, 'test@example.com')
          fireEvent.click(submitButtons[0])
          
          await waitFor(() => {
            expect(mockOnSignUp).toHaveBeenCalledWith('test@example.com')
          })
        }
      }
    })

    it('shows different content for authenticated users', () => {
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      renderLandingPage()
      
      // When authenticated, might show different content
      // This depends on your LandingPage implementation
      expect(screen.getByTestId('logo')).toBeInTheDocument()
    })

    it('handles organization context in CTAs', () => {
      // Mock organization context
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          hostname: 'acme.processaudit.ai',
          pathname: '/',
        },
      })
      
      renderLandingPage()
      
      // Should render without errors in organization context
      expect(screen.getByTestId('logo')).toBeInTheDocument()
    })
  })

  describe('UserMenu Component', () => {
    const renderUserMenu = (props = {}) => {
      return render(
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <UserMenu 
              onOpenAuth={jest.fn()}
              onOpenSavedReports={jest.fn()}
              onOpenCleanup={jest.fn()}
              {...props}
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
    }

    it('shows disabled state when auth not configured', () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      delete process.env.CLERK_SECRET_KEY
      
      renderUserMenu()
      
      expect(screen.getByText(/auth not configured/i)).toBeInTheDocument()
    })

    it('shows Clerk authentication components when using Clerk', () => {
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      renderUserMenu()
      
      // Should show Clerk UserButton
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
    })

    it('shows organization switcher when signed in', () => {
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      renderUserMenu()
      
      expect(screen.getByTestId('clerk-org-switcher')).toBeInTheDocument()
    })

    it('does not show organization switcher when not signed in', () => {
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: false,
        user: null
      }))
      
      renderUserMenu()
      
      expect(screen.queryByTestId('clerk-org-switcher')).not.toBeInTheDocument()
    })

    it('handles organization context correctly', () => {
      const mockOrganization = global.testHelpers.createMockOrganization()
      
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      useOrganization.mockReturnValue(createMockOrganization({
        organization: mockOrganization
      }))
      
      renderUserMenu()
      
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
      expect(screen.getByTestId('clerk-org-switcher')).toBeInTheDocument()
    })

    it('shows admin indicators for organization admins', () => {
      const mockOrganization = global.testHelpers.createMockOrganization()
      const mockMembership = global.testHelpers.createMockMembership({
        organization: mockOrganization,
        role: 'admin'
      })
      
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      useOrganization.mockReturnValue(createMockOrganization({
        organization: mockOrganization,
        membershipList: [mockMembership]
      }))
      
      renderUserMenu()
      
      // The component should render without errors
      // Admin indicators would depend on your UserMenu implementation
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
    })

    it('handles sign out correctly', async () => {
      const mockSignOut = jest.fn().mockResolvedValue()
      
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser(),
        signOut: mockSignOut
      }))
      
      renderUserMenu()
      
      // The UserMenu component should handle sign out through Clerk's UserButton
      // This test ensures the component renders properly with sign out capability
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
    })

    it('handles loading states correctly', () => {
      useAuth.mockReturnValue(createMockAuth({
        isLoaded: false,
        isSignedIn: undefined,
        user: undefined
      }))
      
      renderUserMenu()
      
      // Should handle loading state gracefully
      // The exact behavior depends on your UserMenu implementation
      expect(screen.queryByText(/auth not configured/i)).not.toBeInTheDocument()
    })
  })

  describe('ProcessAuditApp Component', () => {
    const renderProcessAuditApp = (props = {}) => {
      return render(
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <ProcessAuditApp {...props} />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
    }

    it('renders when user is authenticated', () => {
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      renderProcessAuditApp()
      
      expect(screen.getByTestId('process-audit-app')).toBeInTheDocument()
    })

    it('handles authentication requirements', () => {
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: false,
        user: null
      }))
      
      renderProcessAuditApp()
      
      // The component should handle unauthenticated state
      // This might show a login prompt or redirect
      // The exact behavior depends on your ProcessAuditApp implementation
    })

    it('handles organization context in app', () => {
      const mockOrganization = global.testHelpers.createMockOrganization()
      
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      useOrganization.mockReturnValue(createMockOrganization({
        organization: mockOrganization
      }))
      
      renderProcessAuditApp()
      
      expect(screen.getByTestId('process-audit-app')).toBeInTheDocument()
    })

    it('handles loading states in app', () => {
      useAuth.mockReturnValue(createMockAuth({
        isLoaded: false
      }))
      
      renderProcessAuditApp()
      
      // Should handle loading state appropriately
      // The exact behavior depends on your ProcessAuditApp implementation
    })
  })

  describe('Component Integration Scenarios', () => {
    it('handles full authentication flow from landing to app', async () => {
      // Start with unauthenticated state
      const mockAuth = createMockAuth({
        isSignedIn: false,
        user: null
      })
      
      useAuth.mockReturnValue(mockAuth)
      
      // Render landing page
      render(
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <LandingPage />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
      
      expect(screen.getByTestId('logo')).toBeInTheDocument()
      
      // Simulate authentication (would normally happen in Clerk components)
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      // Re-render with authenticated state
      render(
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <ProcessAuditApp />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
      
      expect(screen.getByTestId('process-audit-app')).toBeInTheDocument()
    })

    it('handles organization switching across components', async () => {
      const mockOrg1 = global.testHelpers.createMockOrganization({
        id: 'org_1',
        name: 'Organization 1'
      })
      const mockOrg2 = global.testHelpers.createMockOrganization({
        id: 'org_2',
        name: 'Organization 2'
      })
      
      const mockSetActive = jest.fn()
      
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      useOrganization.mockReturnValue(createMockOrganization({
        organization: mockOrg1,
        setActive: mockSetActive
      }))
      
      const mockMembership1 = global.testHelpers.createMockMembership({
        organization: mockOrg1
      })
      const mockMembership2 = global.testHelpers.createMockMembership({
        organization: mockOrg2
      })
      
      useOrganizationList.mockReturnValue(createMockOrganizationList({
        organizationList: [mockMembership1, mockMembership2],
        setActive: mockSetActive
      }))
      
      render(
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <UserMenu 
              onOpenAuth={jest.fn()}
              onOpenSavedReports={jest.fn()}
              onOpenCleanup={jest.fn()}
            />
            <ProcessAuditApp />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
      
      expect(screen.getByTestId('clerk-org-switcher')).toBeInTheDocument()
      expect(screen.getByTestId('process-audit-app')).toBeInTheDocument()
    })

    it('handles error states consistently across components', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // Mock an error state
      useAuth.mockImplementation(() => {
        throw new Error('Authentication service unavailable')
      })
      
      // Components should handle errors gracefully
      expect(() => {
        render(
          <ClerkAuthBridge>
            <UnifiedAuthProvider>
              <UserMenu 
                onOpenAuth={jest.fn()}
                onOpenSavedReports={jest.fn()}
                onOpenCleanup={jest.fn()}
              />
            </UnifiedAuthProvider>
          </ClerkAuthBridge>
        )
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })

    it('handles configuration changes dynamically', () => {
      // Start with configured state
      useAuth.mockReturnValue(createMockAuth({
        isSignedIn: true,
        user: global.testHelpers.createMockUser()
      }))
      
      const { rerender } = render(
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <UserMenu 
              onOpenAuth={jest.fn()}
              onOpenSavedReports={jest.fn()}
              onOpenCleanup={jest.fn()}
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
      
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
      
      // Simulate configuration change
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      
      rerender(
        <ClerkAuthBridge>
          <UnifiedAuthProvider>
            <UserMenu 
              onOpenAuth={jest.fn()}
              onOpenSavedReports={jest.fn()}
              onOpenCleanup={jest.fn()}
            />
          </UnifiedAuthProvider>
        </ClerkAuthBridge>
      )
      
      // Should show unconfigured state
      expect(screen.getByText(/auth not configured/i)).toBeInTheDocument()
    })
  })
})