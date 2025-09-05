/**
 * TypeScript Authentication Types Tests
 * ProcessAudit AI - Clerk Migration Phase 4 Testing
 * 
 * Tests TypeScript type definitions for authentication:
 * - Type guards work correctly
 * - Auth interface compatibility
 * - Organization type conversions
 * - Type safety and validation
 */

import {
  // Type imports
  ClerkUser,
  ClerkOrganization,
  ClerkOrganizationMembership,
  UnifiedAuthContextType,
  AuthError,
  AuthErrorCode,
  OrganizationIdentifier,
  UserProfileUpdate,
  
  // Type guards
  isClerkUser,
  isAuthError,
  isValidAuthErrorCode,
  isOrganizationIdentifier,
  
  // Helper functions
  clerkUserToUser,
  clerkOrgToOrganization,
  clerkMembershipToMembership,
  
  // Default states
  createEmptyAuthState,
  
  // Constants
  CLERK_AUTH_SYSTEM,
  SUPPORTED_AUTH_SYSTEMS,
  ORGANIZATION_ROLE_HIERARCHY,
} from '../../types/auth'

import { Organization, OrganizationRole } from '../../types/organization'

describe('Authentication Type Guards', () => {
  describe('isClerkUser', () => {
    it('returns true for valid Clerk user objects', () => {
      const validUser: ClerkUser = {
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        username: 'johndoe',
        emailAddresses: [
          {
            id: 'email_123',
            emailAddress: 'john@example.com',
            verification: null,
            linkedTo: []
          }
        ],
        primaryEmailAddress: {
          id: 'email_123',
          emailAddress: 'john@example.com',
          verification: null,
          linkedTo: []
        },
        phoneNumbers: [],
        primaryPhoneNumber: null,
        profileImageUrl: 'https://example.com/avatar.jpg',
        imageUrl: 'https://example.com/avatar.jpg',
        hasImage: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignInAt: new Date(),
        twoFactorEnabled: false,
        totpEnabled: false,
        backupCodeEnabled: false,
        publicMetadata: {},
        privateMetadata: {},
        unsafeMetadata: {},
        organizationMemberships: [],
        passwordEnabled: true,
        externalId: null,
        web3Wallets: [],
        externalAccounts: [],
        samlAccounts: []
      }

      expect(isClerkUser(validUser)).toBe(true)
    })

    it('returns false for invalid objects', () => {
      expect(isClerkUser(null)).toBe(false)
      expect(isClerkUser(undefined)).toBe(false)
      expect(isClerkUser({})).toBe(false)
      expect(isClerkUser({ id: 'user_123' })).toBe(false) // Missing emailAddresses
      expect(isClerkUser({ emailAddresses: [] })).toBe(false) // Missing id
      expect(isClerkUser('string')).toBe(false)
      expect(isClerkUser(123)).toBe(false)
    })

    it('returns false for objects with wrong types', () => {
      expect(isClerkUser({
        id: 123, // Should be string
        emailAddresses: []
      })).toBe(false)

      expect(isClerkUser({
        id: 'user_123',
        emailAddresses: 'not-array' // Should be array
      })).toBe(false)
    })
  })

  describe('isAuthError', () => {
    it('returns true for valid AuthError objects', () => {
      const validError: AuthError = {
        code: 'USER_NOT_AUTHENTICATED',
        message: 'User is not authenticated',
        details: { reason: 'token_expired' }
      }

      expect(isAuthError(validError)).toBe(true)
    })

    it('returns false for invalid objects', () => {
      expect(isAuthError(null)).toBe(false)
      expect(isAuthError(undefined)).toBe(false)
      expect(isAuthError({})).toBe(false)
      expect(isAuthError({ code: 'ERROR' })).toBe(false) // Missing message
      expect(isAuthError({ message: 'Error' })).toBe(false) // Missing code
      expect(isAuthError(new Error('Standard error'))).toBe(false)
    })

    it('returns false for objects with wrong types', () => {
      expect(isAuthError({
        code: 123, // Should be string
        message: 'Error'
      })).toBe(false)

      expect(isAuthError({
        code: 'ERROR',
        message: 123 // Should be string
      })).toBe(false)
    })
  })

  describe('isValidAuthErrorCode', () => {
    it('returns true for valid error codes', () => {
      const validCodes: AuthErrorCode[] = [
        'AUTH_NOT_CONFIGURED',
        'USER_NOT_AUTHENTICATED',
        'USER_NOT_LOADED',
        'ORGANIZATION_NOT_FOUND',
        'ORGANIZATION_SWITCH_FAILED',
        'INSUFFICIENT_PERMISSIONS',
        'AUTH_METHOD_NOT_SUPPORTED',
        'PROFILE_UPDATE_FAILED',
        'SESSION_EXPIRED',
        'NETWORK_ERROR',
        'UNKNOWN_ERROR'
      ]

      validCodes.forEach(code => {
        expect(isValidAuthErrorCode(code)).toBe(true)
      })
    })

    it('returns false for invalid error codes', () => {
      expect(isValidAuthErrorCode('INVALID_CODE')).toBe(false)
      expect(isValidAuthErrorCode('')).toBe(false)
      expect(isValidAuthErrorCode('user_not_authenticated')).toBe(false) // Wrong case
      expect(isValidAuthErrorCode('AUTH_ERROR')).toBe(false) // Not in list
    })
  })

  describe('isOrganizationIdentifier', () => {
    it('returns true for valid organization identifiers', () => {
      const validIdentifiers: OrganizationIdentifier[] = [
        { id: 'org_123' },
        { slug: 'test-org' },
        { name: 'Test Organization' },
        { id: 'org_123', slug: 'test-org' },
        { id: 'org_123', slug: 'test-org', name: 'Test Organization' }
      ]

      validIdentifiers.forEach(identifier => {
        expect(isOrganizationIdentifier(identifier)).toBe(true)
      })
    })

    it('returns false for invalid identifiers', () => {
      expect(isOrganizationIdentifier(null)).toBe(false)
      expect(isOrganizationIdentifier(undefined)).toBe(false)
      expect(isOrganizationIdentifier({})).toBe(false) // No properties
      expect(isOrganizationIdentifier('string')).toBe(false)
      expect(isOrganizationIdentifier({ other: 'property' })).toBe(false)
    })
  })
})

describe('Type Conversion Functions', () => {
  describe('clerkUserToUser', () => {
    it('returns Clerk user as-is (pass-through)', () => {
      const clerkUser: ClerkUser = {
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        username: 'johndoe',
        emailAddresses: [{
          id: 'email_123',
          emailAddress: 'john@example.com',
          verification: null,
          linkedTo: []
        }],
        primaryEmailAddress: {
          id: 'email_123',
          emailAddress: 'john@example.com',
          verification: null,
          linkedTo: []
        },
        phoneNumbers: [],
        primaryPhoneNumber: null,
        profileImageUrl: 'https://example.com/avatar.jpg',
        imageUrl: 'https://example.com/avatar.jpg',
        hasImage: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        lastSignInAt: new Date('2024-01-03'),
        twoFactorEnabled: false,
        totpEnabled: false,
        backupCodeEnabled: false,
        publicMetadata: { role: 'admin' },
        privateMetadata: { subscription: 'pro' },
        unsafeMetadata: { lastAction: 'login' },
        organizationMemberships: [],
        passwordEnabled: true,
        externalId: null,
        web3Wallets: [],
        externalAccounts: [],
        samlAccounts: []
      }

      const result = clerkUserToUser(clerkUser)
      
      // Should return the same object reference (pass-through)
      expect(result).toBe(clerkUser)
      expect(result).toEqual(clerkUser)
    })
  })

  describe('clerkOrgToOrganization', () => {
    it('converts Clerk organization to Organization type', () => {
      const clerkOrg: ClerkOrganization = {
        id: 'org_123',
        slug: 'test-org',
        name: 'Test Organization',
        imageUrl: 'https://example.com/org-logo.jpg',
        publicMetadata: {
          description: 'A test organization',
          plan: 'pro',
          website: 'https://test.com'
        },
        privateMetadata: {
          billing: { customerId: 'cus_123' }
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        membersCount: 5,
        maxAllowedMemberships: 10
      } as ClerkOrganization

      const result = clerkOrgToOrganization(clerkOrg)

      expect(result).toEqual({
        id: 'org_123',
        slug: 'test-org',
        name: 'Test Organization',
        description: 'A test organization',
        imageUrl: 'https://example.com/org-logo.jpg',
        publicMetadata: {
          description: 'A test organization',
          plan: 'pro',
          website: 'https://test.com'
        },
        privateMetadata: {
          billing: { customerId: 'cus_123' }
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        membersCount: 5,
        maxMembers: 10,
        plan: 'pro'
      })
    })

    it('handles missing optional properties', () => {
      const clerkOrg: ClerkOrganization = {
        id: 'org_123',
        slug: 'test-org',
        name: 'Test Organization',
        imageUrl: '',
        publicMetadata: {},
        privateMetadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        membersCount: 1,
        maxAllowedMemberships: 5
      } as ClerkOrganization

      const result = clerkOrgToOrganization(clerkOrg)

      expect(result.description).toBeUndefined()
      expect(result.plan).toBe('free') // Default value
      expect(result.imageUrl).toBe('')
    })
  })

  describe('clerkMembershipToMembership', () => {
    it('converts Clerk membership to OrganizationMembership type', () => {
      const clerkMembership: ClerkOrganizationMembership = {
        id: 'membership_123',
        organization: {
          id: 'org_123',
          slug: 'test-org',
          name: 'Test Organization',
          imageUrl: '',
          publicMetadata: {},
          privateMetadata: {},
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          membersCount: 1,
          maxAllowedMemberships: 5
        } as ClerkOrganization,
        publicUserData: {
          firstName: 'John',
          lastName: 'Doe',
          profileImageUrl: 'https://example.com/avatar.jpg',
          identifier: 'john@example.com',
          userId: 'user_123'
        },
        role: 'admin' as OrganizationRole,
        permissions: ['org:read', 'org:write'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      } as ClerkOrganizationMembership

      const result = clerkMembershipToMembership(clerkMembership)

      expect(result.id).toBe('membership_123')
      expect(result.organization.id).toBe('org_123')
      expect(result.user.id).toBe('user_123')
      expect(result.user.firstName).toBe('John')
      expect(result.user.emailAddress).toBe('john@example.com')
      expect(result.role).toBe('admin')
      expect(result.permissions).toEqual(['org:read', 'org:write'])
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z')
    })

    it('handles missing permissions gracefully', () => {
      const clerkMembership: ClerkOrganizationMembership = {
        id: 'membership_123',
        organization: {
          id: 'org_123',
          slug: 'test-org',
          name: 'Test Organization',
          imageUrl: '',
          publicMetadata: {},
          privateMetadata: {},
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          membersCount: 1,
          maxAllowedMemberships: 5
        } as ClerkOrganization,
        publicUserData: {
          firstName: 'John',
          lastName: 'Doe',
          profileImageUrl: '',
          identifier: 'john@example.com',
          userId: 'user_123'
        },
        role: 'member' as OrganizationRole,
        permissions: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      } as ClerkOrganizationMembership

      const result = clerkMembershipToMembership(clerkMembership)

      expect(result.permissions).toEqual([])
    })
  })
})

describe('Default State Creation', () => {
  describe('createEmptyAuthState', () => {
    it('creates a valid empty authentication state', () => {
      const emptyState = createEmptyAuthState()

      // Verify all required properties exist
      expect(emptyState).toHaveProperty('user', null)
      expect(emptyState).toHaveProperty('isSignedIn', false)
      expect(emptyState).toHaveProperty('isLoaded', false)
      expect(emptyState).toHaveProperty('loading', true)
      
      expect(emptyState).toHaveProperty('organization', null)
      expect(emptyState).toHaveProperty('isOrgAdmin', false)
      expect(emptyState).toHaveProperty('orgMemberships', [])
      expect(emptyState).toHaveProperty('orgLoaded', false)
      expect(emptyState).toHaveProperty('availableOrganizations', [])
      expect(emptyState).toHaveProperty('orgListLoaded', false)
      
      expect(emptyState).toHaveProperty('orgContext', null)
      expect(emptyState).toHaveProperty('isOrgContextLoaded', false)
      
      expect(emptyState).toHaveProperty('isConfigured', false)
      expect(emptyState).toHaveProperty('authSystem', 'clerk')

      // Verify methods exist and are functions
      expect(typeof emptyState.switchOrganization).toBe('function')
      expect(typeof emptyState.setActive).toBe('function')
      expect(typeof emptyState.signUp).toBe('function')
      expect(typeof emptyState.signIn).toBe('function')
      expect(typeof emptyState.signOut).toBe('function')
      expect(typeof emptyState.resetPassword).toBe('function')
      expect(typeof emptyState.updateProfile).toBe('function')
    })

    it('has methods that throw appropriate errors', async () => {
      const emptyState = createEmptyAuthState()

      await expect(emptyState.signUp('test@example.com', 'password'))
        .rejects.toThrow('Use Clerk SignUp component')
      
      await expect(emptyState.signIn('test@example.com', 'password'))
        .rejects.toThrow('Use Clerk SignIn component')
      
      await expect(emptyState.resetPassword('test@example.com'))
        .rejects.toThrow('Use Clerk password reset')
    })

    it('has methods that resolve successfully', async () => {
      const emptyState = createEmptyAuthState()

      // These methods should resolve without error
      await expect(emptyState.switchOrganization('org_123')).resolves.toBeUndefined()
      await expect(emptyState.setActive({ organization: 'org_123' })).resolves.toBeUndefined()
      await expect(emptyState.signOut()).resolves.toBeUndefined()
      await expect(emptyState.updateProfile({})).resolves.toBeNull()
    })
  })
})

describe('Constants and Configuration', () => {
  describe('System Constants', () => {
    it('has correct auth system constant', () => {
      expect(CLERK_AUTH_SYSTEM).toBe('clerk')
      expect(SUPPORTED_AUTH_SYSTEMS).toEqual(['clerk'])
      expect(SUPPORTED_AUTH_SYSTEMS).toContain(CLERK_AUTH_SYSTEM)
    })

    it('has correct organization role hierarchy', () => {
      expect(ORGANIZATION_ROLE_HIERARCHY).toEqual({
        guest: 1,
        member: 2,
        admin: 3
      })

      // Verify hierarchy order
      expect(ORGANIZATION_ROLE_HIERARCHY.guest).toBeLessThan(ORGANIZATION_ROLE_HIERARCHY.member)
      expect(ORGANIZATION_ROLE_HIERARCHY.member).toBeLessThan(ORGANIZATION_ROLE_HIERARCHY.admin)
    })
  })
})

describe('Interface Compatibility', () => {
  describe('UnifiedAuthContextType', () => {
    it('maintains backward compatibility with expected interface', () => {
      const mockAuthContext: UnifiedAuthContextType = {
        // Core authentication
        user: null,
        isSignedIn: false,
        isLoaded: true,
        loading: false,
        
        // Organization state
        organization: null,
        isOrgAdmin: false,
        orgMemberships: [],
        orgLoaded: true,
        availableOrganizations: [],
        orgListLoaded: true,
        
        // Organization context
        orgContext: null,
        isOrgContextLoaded: true,
        
        // Methods
        switchOrganization: async () => {},
        setActive: async () => {},
        signUp: async () => { throw new Error('Use Clerk') },
        signIn: async () => { throw new Error('Use Clerk') },
        signOut: async () => {},
        resetPassword: async () => { throw new Error('Use Clerk') },
        updateProfile: async () => null,
        
        // Configuration
        isConfigured: true,
        authSystem: 'clerk'
      }

      // Should compile without TypeScript errors
      expect(mockAuthContext.authSystem).toBe('clerk')
      expect(typeof mockAuthContext.switchOrganization).toBe('function')
      expect(typeof mockAuthContext.signOut).toBe('function')
    })
  })

  describe('Method Signatures', () => {
    it('maintains expected method signatures for compatibility', () => {
      const mockUpdate: UserProfileUpdate = {
        firstName: 'New Name',
        publicMetadata: { role: 'admin' }
      }

      const mockOrgIdentifier: OrganizationIdentifier = {
        id: 'org_123',
        slug: 'test-org'
      }

      // These should compile without TypeScript errors
      expect(mockUpdate.firstName).toBe('New Name')
      expect(mockOrgIdentifier.id).toBe('org_123')
    })
  })
})

describe('Error Handling Types', () => {
  describe('AuthError Type', () => {
    it('supports all required error scenarios', () => {
      const errors: AuthError[] = [
        {
          code: 'AUTH_NOT_CONFIGURED',
          message: 'Authentication is not properly configured'
        },
        {
          code: 'USER_NOT_AUTHENTICATED',
          message: 'User is not authenticated',
          details: { redirectUrl: '/sign-in' }
        },
        {
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found',
          details: { orgId: 'org_123' },
          originalError: {
            code: 'resource_not_found',
            message: 'Organization not found'
          }
        }
      ]

      errors.forEach(error => {
        expect(isAuthError(error)).toBe(true)
        expect(isValidAuthErrorCode(error.code)).toBe(true)
      })
    })
  })
})