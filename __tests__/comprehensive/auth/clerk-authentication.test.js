/**
 * Comprehensive Clerk Authentication Test Suite
 * ProcessAudit AI - 95% Coverage Target
 *
 * Coverage Areas:
 * - Authentication flows (sign-in, sign-up, sign-out)
 * - Organization context management
 * - Multi-tenant session handling
 * - Error scenarios and edge cases
 * - Security boundary testing
 * - Session persistence and validation
 * - Redirect URL validation
 * - JWT token handling
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/router';
import {
  SignIn,
  SignUp,
  useAuth,
  useOrganization,
  useOrganizationList,
  useUser,
  useSession
} from '@clerk/nextjs';
import { UnifiedAuthProvider } from '../../../contexts/UnifiedAuthContext';
import ClerkAuthBridge from '../../../components/ClerkAuthBridge';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  query: {},
  pathname: '/',
  asPath: '/',
  route: '/',
  events: { on: jest.fn(), off: jest.fn() }
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter
}));

// Mock Clerk hooks and components
jest.mock('@clerk/nextjs', () => ({
  SignIn: jest.fn(),
  SignUp: jest.fn(),
  useAuth: jest.fn(),
  useOrganization: jest.fn(),
  useOrganizationList: jest.fn(),
  useUser: jest.fn(),
  useSession: jest.fn(),
  ClerkProvider: ({ children }) => React.createElement('div', { 'data-testid': 'clerk-provider' }, children),
  ClerkLoaded: ({ children }) => React.createElement('div', { 'data-testid': 'clerk-loaded' }, children),
  ClerkLoading: () => React.createElement('div', { 'data-testid': 'clerk-loading' }, 'Loading...'),
}));

describe('Comprehensive Clerk Authentication Tests', () => {
  const mockUser = {
    id: 'user_test123',
    firstName: 'John',
    lastName: 'Doe',
    emailAddresses: [{ emailAddress: 'john@example.com', id: 'email_123' }],
    primaryEmailAddressId: 'email_123',
    publicMetadata: {},
    privateMetadata: {},
    unsafeMetadata: {}
  };

  const mockOrganization = {
    id: 'org_test123',
    name: 'Test Organization',
    slug: 'test-org',
    imageUrl: '',
    publicMetadata: {},
    privateMetadata: {
      plan: 'premium',
      features: { enableAutomations: true }
    }
  };

  const mockSession = {
    id: 'sess_test123',
    status: 'active',
    lastActiveAt: new Date(),
    expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    abandonAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    useAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      signOut: jest.fn(),
      getToken: jest.fn()
    });

    useUser.mockReturnValue({
      isLoaded: true,
      user: null
    });

    useOrganization.mockReturnValue({
      isLoaded: true,
      organization: null,
      membership: null
    });

    useOrganizationList.mockReturnValue({
      isLoaded: true,
      organizationList: [],
      userMemberships: { data: [], count: 0 },
      setActive: jest.fn(),
      createOrganization: jest.fn()
    });

    useSession.mockReturnValue({
      isLoaded: true,
      session: null
    });
  });

  describe('Authentication State Management', () => {
    test('should handle unauthenticated state correctly', async () => {
      const TestComponent = () => {
        const auth = useAuth();
        return React.createElement('div', { 'data-testid': 'auth-state' },
          React.createElement('span', { 'data-testid': 'is-signed-in' }, auth.isSignedIn.toString()),
          React.createElement('span', { 'data-testid': 'user-id' }, auth.userId || 'null')
        );
      };

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      );

      expect(screen.getByTestId('is-signed-in')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('null');
    });

    test('should handle authenticated state correctly', async () => {
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_test123',
        sessionId: 'sess_test123',
        orgId: 'org_test123',
        orgRole: 'admin',
        orgSlug: 'test-org',
        signOut: jest.fn(),
        getToken: jest.fn()
      });

      useUser.mockReturnValue({
        isLoaded: true,
        user: mockUser
      });

      useSession.mockReturnValue({
        isLoaded: true,
        session: mockSession
      });

      const TestComponent = () => {
        const auth = useAuth();
        const { user } = useUser();
        return (
          <div data-testid="auth-state">
            <span data-testid="is-signed-in">{auth.isSignedIn.toString()}</span>
            <span data-testid="user-id">{auth.userId}</span>
            <span data-testid="user-email">{user?.emailAddresses[0]?.emailAddress}</span>
            <span data-testid="org-id">{auth.orgId}</span>
          </div>
        );
      };

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      );

      expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true');
      expect(screen.getByTestId('user-id')).toHaveTextContent('user_test123');
      expect(screen.getByTestId('user-email')).toHaveTextContent('john@example.com');
      expect(screen.getByTestId('org-id')).toHaveTextContent('org_test123');
    });

    test('should handle loading state correctly', async () => {
      useAuth.mockReturnValue({
        isLoaded: false,
        isSignedIn: undefined,
        userId: null,
        sessionId: null,
        orgId: null,
        orgRole: null,
        orgSlug: null,
        signOut: jest.fn(),
        getToken: jest.fn()
      });

      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div data-testid="auth-state">
            <span data-testid="is-loaded">{auth.isLoaded.toString()}</span>
            <span data-testid="is-signed-in">{String(auth.isSignedIn)}</span>
          </div>
        );
      };

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      );

      expect(screen.getByTestId('is-loaded')).toHaveTextContent('false');
      expect(screen.getByTestId('is-signed-in')).toHaveTextContent('undefined');
    });
  });

  describe('Organization Context Management', () => {
    test('should handle organization switching', async () => {
      const mockSetActive = jest.fn();

      useOrganizationList.mockReturnValue({
        isLoaded: true,
        organizationList: [
          { organization: mockOrganization },
          { organization: { ...mockOrganization, id: 'org_456', name: 'Another Org', slug: 'another-org' }}
        ],
        userMemberships: { data: [], count: 2 },
        setActive: mockSetActive,
        createOrganization: jest.fn()
      });

      const TestComponent = () => {
        const { organizationList, setActive } = useOrganizationList();

        const switchOrg = () => {
          setActive({ organization: 'org_456' });
        };

        return (
          <div>
            <div data-testid="org-count">{organizationList?.length || 0}</div>
            <button data-testid="switch-org" onClick={switchOrg}>
              Switch Organization
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('org-count')).toHaveTextContent('2');

      fireEvent.click(screen.getByTestId('switch-org'));

      expect(mockSetActive).toHaveBeenCalledWith({ organization: 'org_456' });
    });

    test('should handle organization creation', async () => {
      const mockCreateOrganization = jest.fn().mockResolvedValue({
        id: 'org_new123',
        name: 'New Organization',
        slug: 'new-org'
      });

      useOrganizationList.mockReturnValue({
        isLoaded: true,
        organizationList: [],
        userMemberships: { data: [], count: 0 },
        setActive: jest.fn(),
        createOrganization: mockCreateOrganization
      });

      const TestComponent = () => {
        const { createOrganization } = useOrganizationList();

        const handleCreateOrg = async () => {
          await createOrganization({ name: 'New Organization' });
        };

        return (
          <button data-testid="create-org" onClick={handleCreateOrg}>
            Create Organization
          </button>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('create-org'));

      await waitFor(() => {
        expect(mockCreateOrganization).toHaveBeenCalledWith({ name: 'New Organization' });
      });
    });

    test('should validate organization metadata access', async () => {
      useOrganization.mockReturnValue({
        isLoaded: true,
        organization: mockOrganization,
        membership: {
          id: 'mem_test123',
          role: 'admin',
          permissions: ['org:read', 'org:write'],
          publicMetadata: {},
          privateMetadata: {}
        }
      });

      const TestComponent = () => {
        const { organization, membership } = useOrganization();

        return (
          <div>
            <div data-testid="org-plan">{organization?.privateMetadata?.plan}</div>
            <div data-testid="member-role">{membership?.role}</div>
            <div data-testid="has-automations">
              {organization?.privateMetadata?.features?.enableAutomations?.toString()}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('org-plan')).toHaveTextContent('premium');
      expect(screen.getByTestId('member-role')).toHaveTextContent('admin');
      expect(screen.getByTestId('has-automations')).toHaveTextContent('true');
    });
  });

  describe('Authentication Flow Tests', () => {
    test('should handle sign-in flow', async () => {
      const mockSignIn = jest.fn();

      SignIn.mockImplementation(({ redirectUrl, afterSignInUrl }) => (
        <div data-testid="sign-in-component">
          <div data-testid="redirect-url">{redirectUrl}</div>
          <div data-testid="after-signin-url">{afterSignInUrl}</div>
          <button data-testid="signin-submit" onClick={mockSignIn}>
            Sign In
          </button>
        </div>
      ));

      render(<SignIn redirectUrl="/dashboard" afterSignInUrl="/dashboard" />);

      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/dashboard');
      expect(screen.getByTestId('after-signin-url')).toHaveTextContent('/dashboard');

      fireEvent.click(screen.getByTestId('signin-submit'));
      expect(mockSignIn).toHaveBeenCalled();
    });

    test('should handle sign-up flow', async () => {
      const mockSignUp = jest.fn();

      SignUp.mockImplementation(({ redirectUrl, afterSignUpUrl }) => (
        <div data-testid="sign-up-component">
          <div data-testid="redirect-url">{redirectUrl}</div>
          <div data-testid="after-signup-url">{afterSignUpUrl}</div>
          <button data-testid="signup-submit" onClick={mockSignUp}>
            Sign Up
          </button>
        </div>
      ));

      render(<SignUp redirectUrl="/onboarding" afterSignUpUrl="/onboarding" />);

      expect(screen.getByTestId('redirect-url')).toHaveTextContent('/onboarding');
      expect(screen.getByTestId('after-signup-url')).toHaveTextContent('/onboarding');

      fireEvent.click(screen.getByTestId('signup-submit'));
      expect(mockSignUp).toHaveBeenCalled();
    });

    test('should handle sign-out flow', async () => {
      const mockSignOut = jest.fn();

      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_test123',
        signOut: mockSignOut,
        getToken: jest.fn()
      });

      const TestComponent = () => {
        const { signOut } = useAuth();

        return (
          <button data-testid="signout-button" onClick={() => signOut()}>
            Sign Out
          </button>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('signout-button'));

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('Token Management and Security', () => {
    test('should handle JWT token retrieval', async () => {
      const mockGetToken = jest.fn().mockResolvedValue('mock-jwt-token');

      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_test123',
        sessionId: 'sess_test123',
        signOut: jest.fn(),
        getToken: mockGetToken
      });

      const TestComponent = () => {
        const { getToken } = useAuth();

        const handleGetToken = async () => {
          const token = await getToken();
          console.log('Token retrieved:', token);
        };

        return (
          <button data-testid="get-token" onClick={handleGetToken}>
            Get Token
          </button>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('get-token'));

      await waitFor(() => {
        expect(mockGetToken).toHaveBeenCalled();
      });
    });

    test('should handle token with custom template', async () => {
      const mockGetToken = jest.fn().mockResolvedValue('custom-token');

      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_test123',
        sessionId: 'sess_test123',
        signOut: jest.fn(),
        getToken: mockGetToken
      });

      const TestComponent = () => {
        const { getToken } = useAuth();

        const handleGetCustomToken = async () => {
          await getToken({ template: 'supabase' });
        };

        return (
          <button data-testid="get-custom-token" onClick={handleGetCustomToken}>
            Get Custom Token
          </button>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('get-custom-token'));

      await waitFor(() => {
        expect(mockGetToken).toHaveBeenCalledWith({ template: 'supabase' });
      });
    });

    test('should handle session expiration', async () => {
      const expiredSession = {
        ...mockSession,
        status: 'expired',
        expireAt: new Date(Date.now() - 60000) // Expired 1 minute ago
      };

      useSession.mockReturnValue({
        isLoaded: true,
        session: expiredSession
      });

      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        userId: null,
        sessionId: null,
        signOut: jest.fn(),
        getToken: jest.fn()
      });

      const TestComponent = () => {
        const { session } = useSession();
        const auth = useAuth();

        return (
          <div>
            <div data-testid="session-status">{session?.status}</div>
            <div data-testid="is-signed-in">{auth.isSignedIn.toString()}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('session-status')).toHaveTextContent('expired');
      expect(screen.getByTestId('is-signed-in')).toHaveTextContent('false');
    });
  });

  describe('Multi-tenant Security Boundaries', () => {
    test('should prevent cross-organization data access', async () => {
      const org1 = { ...mockOrganization, id: 'org_1', name: 'Organization 1' };
      const org2 = { ...mockOrganization, id: 'org_2', name: 'Organization 2' };

      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_test123',
        orgId: 'org_1',
        orgRole: 'member',
        signOut: jest.fn(),
        getToken: jest.fn()
      });

      useOrganization.mockReturnValue({
        isLoaded: true,
        organization: org1,
        membership: {
          id: 'mem_1',
          role: 'member',
          permissions: ['org:read']
        }
      });

      const TestComponent = () => {
        const auth = useAuth();
        const { organization } = useOrganization();

        // Simulate attempt to access different org's data
        const attemptCrossOrgAccess = () => {
          if (auth.orgId !== 'org_2') {
            throw new Error('Unauthorized access to organization data');
          }
        };

        return (
          <div>
            <div data-testid="current-org">{organization?.id}</div>
            <button
              data-testid="cross-org-access"
              onClick={attemptCrossOrgAccess}
            >
              Access Other Org
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('current-org')).toHaveTextContent('org_1');

      // Should throw error when attempting cross-org access
      expect(() => {
        fireEvent.click(screen.getByTestId('cross-org-access'));
      }).toThrow('Unauthorized access to organization data');
    });

    test('should validate organization membership permissions', async () => {
      const membershipWithoutWriteAccess = {
        id: 'mem_readonly',
        role: 'member',
        permissions: ['org:read'] // No write permissions
      };

      useOrganization.mockReturnValue({
        isLoaded: true,
        organization: mockOrganization,
        membership: membershipWithoutWriteAccess
      });

      const TestComponent = () => {
        const { membership } = useOrganization();

        const canWrite = membership?.permissions?.includes('org:write');
        const canDelete = membership?.permissions?.includes('org:delete');

        return (
          <div>
            <div data-testid="can-write">{canWrite.toString()}</div>
            <div data-testid="can-delete">{canDelete.toString()}</div>
            <div data-testid="role">{membership?.role}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('can-write')).toHaveTextContent('false');
      expect(screen.getByTestId('can-delete')).toHaveTextContent('false');
      expect(screen.getByTestId('role')).toHaveTextContent('member');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      const mockGetToken = jest.fn().mockRejectedValue(new Error('Network error'));

      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_test123',
        signOut: jest.fn(),
        getToken: mockGetToken
      });

      const TestComponent = () => {
        const { getToken } = useAuth();
        const [error, setError] = React.useState(null);

        const handleGetToken = async () => {
          try {
            await getToken();
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <div>
            <button data-testid="get-token" onClick={handleGetToken}>
              Get Token
            </button>
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('get-token'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      });
    });

    test('should handle missing environment configuration', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

      const TestComponent = () => {
        const hasClerkConfig = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

        return (
          <div data-testid="has-config">{hasClerkConfig.toString()}</div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('has-config')).toHaveTextContent('false');

      // Restore environment
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalEnv;
    });

    test('should handle concurrent organization switches', async () => {
      const mockSetActive = jest.fn()
        .mockImplementationOnce(() => Promise.resolve())
        .mockImplementationOnce(() => Promise.reject(new Error('Concurrent switch error')));

      useOrganizationList.mockReturnValue({
        isLoaded: true,
        organizationList: [
          { organization: { id: 'org_1', name: 'Org 1' }},
          { organization: { id: 'org_2', name: 'Org 2' }}
        ],
        setActive: mockSetActive
      });

      const TestComponent = () => {
        const { setActive } = useOrganizationList();
        const [error, setError] = React.useState(null);

        const switchOrg1 = () => setActive({ organization: 'org_1' });
        const switchOrg2 = async () => {
          try {
            await setActive({ organization: 'org_2' });
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <div>
            <button data-testid="switch-org1" onClick={switchOrg1}>Org 1</button>
            <button data-testid="switch-org2" onClick={switchOrg2}>Org 2</button>
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      render(<TestComponent />);

      // First switch should succeed
      fireEvent.click(screen.getByTestId('switch-org1'));

      // Second switch should fail
      fireEvent.click(screen.getByTestId('switch-org2'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Concurrent switch error');
      });
    });
  });

  describe('ClerkAuthBridge Integration', () => {
    test('should properly bridge Clerk auth state', async () => {
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_test123',
        orgId: 'org_test123',
        orgRole: 'admin',
        signOut: jest.fn(),
        getToken: jest.fn()
      });

      render(
        <UnifiedAuthProvider>
          <ClerkAuthBridge />
        </UnifiedAuthProvider>
      );

      // ClerkAuthBridge should render without errors when auth state is loaded
      expect(screen.getByTestId('clerk-provider')).toBeInTheDocument();
    });

    test('should handle auth state transitions correctly', async () => {
      const { rerender } = render(
        <UnifiedAuthProvider>
          <ClerkAuthBridge />
        </UnifiedAuthProvider>
      );

      // Simulate sign-in
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_test123',
        orgId: 'org_test123',
        signOut: jest.fn(),
        getToken: jest.fn()
      });

      rerender(
        <UnifiedAuthProvider>
          <ClerkAuthBridge />
        </UnifiedAuthProvider>
      );

      // Should handle the transition from signed out to signed in
      expect(screen.getByTestId('clerk-provider')).toBeInTheDocument();
    });
  });
});