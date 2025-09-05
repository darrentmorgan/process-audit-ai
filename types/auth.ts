/**
 * TypeScript types and interfaces for Clerk authentication integration
 * ProcessAudit AI - Clerk-only Authentication System
 * 
 * This file provides comprehensive type definitions for the Clerk authentication
 * system, maintaining API compatibility with the existing UnifiedAuthContext
 * while removing Supabase fallback dependencies.
 */

import { ReactNode } from 'react'
import {
  Organization,
  OrganizationMembership,
  OrganizationContext,
  OrganizationRole,
  OrganizationContextType,
  ClerkOrganization,
  ClerkOrganizationMembership
} from './organization'

// Core Clerk User Types
export interface ClerkUser {
  id: string
  firstName: string | null
  lastName: string | null
  fullName: string | null
  username: string | null
  emailAddresses: ClerkEmailAddress[]
  primaryEmailAddress: ClerkEmailAddress | null
  phoneNumbers: ClerkPhoneNumber[]
  primaryPhoneNumber: ClerkPhoneNumber | null
  profileImageUrl: string
  imageUrl: string
  hasImage: boolean
  createdAt: Date | null
  updatedAt: Date | null
  lastSignInAt: Date | null
  twoFactorEnabled: boolean
  totpEnabled: boolean
  backupCodeEnabled: boolean
  publicMetadata: UserPublicMetadata
  privateMetadata: UserPrivateMetadata
  unsafeMetadata: UserUnsafeMetadata
  organizationMemberships: ClerkOrganizationMembership[]
  passwordEnabled: boolean
  externalId: string | null
  web3Wallets: ClerkWeb3Wallet[]
  externalAccounts: ClerkExternalAccount[]
  samlAccounts: ClerkSamlAccount[]
}

export interface ClerkEmailAddress {
  id: string
  emailAddress: string
  verification: ClerkVerification | null
  linkedTo: ClerkLinkedTo[]
}

export interface ClerkPhoneNumber {
  id: string
  phoneNumber: string
  reservedForSecondFactor: boolean
  defaultSecondFactor: boolean
  verification: ClerkVerification | null
  linkedTo: ClerkLinkedTo[]
}

export interface ClerkVerification {
  status: 'verified' | 'unverified' | 'transferable' | 'expired'
  strategy: string
  attempts: number | null
  expireAt: Date | null
  error: ClerkError | null
}

export interface ClerkLinkedTo {
  type: string
  id: string
}

export interface ClerkWeb3Wallet {
  id: string
  web3Wallet: string
  verification: ClerkVerification | null
}

export interface ClerkExternalAccount {
  id: string
  provider: string
  providerUserId: string
  emailAddress: string
  username: string | null
  publicMetadata: Record<string, any>
  label: string | null
  verification: ClerkVerification | null
}

export interface ClerkSamlAccount {
  id: string
  provider: string
  providerUserId: string | null
  emailAddress: string
  firstName: string | null
  lastName: string | null
  verification: ClerkVerification | null
}

// User Metadata Types
export interface UserPublicMetadata {
  [key: string]: any
}

export interface UserPrivateMetadata {
  [key: string]: any
}

export interface UserUnsafeMetadata {
  [key: string]: any
}

// Clerk Authentication Hook Types
export interface UseClerkAuthReturn {
  isLoaded: boolean
  isSignedIn: boolean | undefined
  user: ClerkUser | null | undefined
  userId: string | null | undefined
  sessionId: string | null | undefined
  session: ClerkSession | null | undefined
  actor: ClerkActorToken | null | undefined
  signOut: (params?: ClerkSignOutParams) => Promise<void>
  has: (params: ClerkHasParams) => boolean
  getToken: (params?: ClerkGetTokenParams) => Promise<string | null>
}

export interface ClerkSession {
  id: string
  status: 'active' | 'ended' | 'expired' | 'removed' | 'replaced' | 'revoked'
  lastActiveAt: Date
  expireAt: Date
  user: ClerkUser
  actor: ClerkActorToken | null
  publicUserData: ClerkPublicUserData
  getToken: (params?: ClerkGetTokenParams) => Promise<string | null>
  checkAuthorization: (params: ClerkAuthorizationParams) => boolean
}

export interface ClerkActorToken {
  sub: string
  actor: Record<string, any>
}

export interface ClerkPublicUserData {
  firstName: string | null
  lastName: string | null
  profileImageUrl: string
  identifier: string
  userId: string
}

// Clerk Organization Hook Types
export interface UseClerkOrganizationReturn {
  isLoaded: boolean
  organization: ClerkOrganization | null | undefined
  membershipList: ClerkOrganizationMembership[] | null | undefined
  membership: ClerkOrganizationMembership | null | undefined
  setActive: (params: ClerkSetActiveParams) => Promise<void>
}

export interface UseClerkOrganizationListReturn {
  isLoaded: boolean
  organizationList: ClerkOrganizationMembership[] | null | undefined
  setActive: (params: ClerkSetActiveParams) => Promise<void>
}

// Clerk Parameters and Options
export interface ClerkSignOutParams {
  redirectUrl?: string
  sessionId?: string
}

export interface ClerkHasParams {
  permission?: string
  role?: string
}

export interface ClerkGetTokenParams {
  template?: string
  leewayInSeconds?: number
  skipCache?: boolean
}

export interface ClerkAuthorizationParams {
  permission?: string
  role?: string
}

export interface ClerkSetActiveParams {
  session?: string | null
  organization?: string | null
  beforeEmit?: () => void | Promise<void>
}

// Bridge and Context Types
export interface ClerkAuthBridge {
  clerkAuth: UseClerkAuthReturn
  organization: ClerkOrganization | null | undefined
  membershipList: ClerkOrganizationMembership[] | null | undefined
  orgLoaded: boolean
  setActive: (params: ClerkSetActiveParams) => Promise<void>
  organizationList: ClerkOrganizationMembership[] | null | undefined
  orgListLoaded: boolean
  setActiveOrg: (params: ClerkSetActiveParams) => Promise<void>
}

// Unified Authentication Interface (Clerk-only)
export interface UnifiedAuthContextType {
  // Core user authentication state
  user: ClerkUser | null
  isSignedIn: boolean
  isLoaded: boolean
  loading: boolean

  // Organization state
  organization: Organization | null
  isOrgAdmin: boolean
  orgMemberships: OrganizationMembership[]
  orgLoaded: boolean
  availableOrganizations: Organization[]
  orgListLoaded: boolean

  // Organization context and routing
  orgContext: OrganizationContext | null
  isOrgContextLoaded: boolean

  // Organization management methods
  switchOrganization: (orgIdentifier: OrganizationIdentifier) => Promise<void>
  setActive: (params: ClerkSetActiveParams) => Promise<void>

  // Authentication methods
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<never>
  signIn: (email: string, password: string) => Promise<never>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<never>
  updateProfile: (updates: UserProfileUpdate) => Promise<ClerkUser | null>

  // Configuration and system info
  isConfigured: boolean
  authSystem: 'clerk'
}

// Authentication Context Provider Props
export interface UnifiedAuthProviderProps {
  children: ReactNode
}

export interface ClerkAuthBridgeProps {
  children: ReactNode
}

// Organization Management Types
export interface OrganizationIdentifier {
  id?: string
  slug?: string
  name?: string
}

export type OrganizationSwitchTarget = string | OrganizationIdentifier

// Available organizations with role information
export interface AvailableOrganization {
  id: string
  slug: string
  name: string
  imageUrl: string
  role: OrganizationRole
  permissions: string[]
}

// User Profile Update Types
export interface UserProfileUpdate {
  firstName?: string
  lastName?: string
  username?: string
  publicMetadata?: UserPublicMetadata
  privateMetadata?: UserPrivateMetadata
  unsafeMetadata?: UserUnsafeMetadata
}

// Authentication Error Types
export interface ClerkError {
  code: string
  message: string
  longMessage?: string
  meta?: Record<string, any>
}

export interface AuthError {
  code: AuthErrorCode
  message: string
  details?: Record<string, any>
  originalError?: ClerkError
}

export type AuthErrorCode =
  | 'AUTH_NOT_CONFIGURED'
  | 'USER_NOT_AUTHENTICATED'
  | 'USER_NOT_LOADED'
  | 'ORGANIZATION_NOT_FOUND'
  | 'ORGANIZATION_SWITCH_FAILED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'AUTH_METHOD_NOT_SUPPORTED'
  | 'PROFILE_UPDATE_FAILED'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

// Hook Return Types
export interface UseUnifiedAuthReturn extends UnifiedAuthContextType {}

export interface UseClerkBridgeReturn extends ClerkAuthBridge {}

export interface UseAuthenticationReturn {
  user: ClerkUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
  signOut: () => Promise<void>
  updateProfile: (updates: UserProfileUpdate) => Promise<ClerkUser | null>
}

export interface UseOrganizationManagementReturn {
  currentOrganization: Organization | null
  isOrgAdmin: boolean
  availableOrganizations: AvailableOrganization[]
  isLoading: boolean
  error: AuthError | null
  switchOrganization: (target: OrganizationSwitchTarget) => Promise<void>
  refreshOrganizations: () => Promise<void>
}

// Organization Context Resolution Types
export interface OrganizationResolutionResult {
  organization: Organization | null
  userIsMember: boolean
  userRole: OrganizationRole | null
  error?: AuthError
}

export interface OrganizationContextResolver {
  resolveFromDomain: (domain: string) => Promise<OrganizationResolutionResult>
  resolveFromSubdomain: (subdomain: string) => Promise<OrganizationResolutionResult>
  resolveFromPath: (slug: string) => Promise<OrganizationResolutionResult>
  resolveFromIdentifier: (identifier: string) => Promise<OrganizationResolutionResult>
}

// Authentication Configuration Types
export interface ClerkAuthConfig {
  publishableKey: string
  secretKey?: string
  domain?: string
  isSatellite?: boolean
  proxyUrl?: string
  signInUrl?: string
  signUpUrl?: string
  afterSignInUrl?: string
  afterSignUpUrl?: string
  organizationProfileMode?: 'navigation' | 'modal'
  organizationProfileUrl?: string
  createOrganizationUrl?: string
  afterCreateOrganizationUrl?: string
  userProfileUrl?: string
  afterUserProfileUrl?: string
}

export interface AuthConfiguration {
  clerk: ClerkAuthConfig
  features: {
    organizationsEnabled: boolean
    multiTenancyEnabled: boolean
    customDomainsEnabled: boolean
    ssoEnabled: boolean
  }
}

// Component Props Types
export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
  redirectUrl?: string
}

export interface UserMenuProps {
  user: ClerkUser
  currentOrganization?: Organization
  availableOrganizations?: AvailableOrganization[]
  onOrganizationSwitch?: (org: Organization) => void
  onSignOut?: () => void
}

export interface OrganizationSwitcherProps {
  currentOrganization?: Organization
  availableOrganizations: AvailableOrganization[]
  onOrganizationChange: (org: Organization) => void
  showCreateOption?: boolean
  className?: string
}

// Utility Types
export type AuthenticationState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

export type OrganizationLoadingState = 'loading' | 'loaded' | 'error'

export type AuthSystemType = 'clerk'

// Type Guards and Validators
export const isClerkUser = (value: any): value is ClerkUser => {
  return value && 
    typeof value === 'object' && 
    typeof value.id === 'string' && 
    Array.isArray(value.emailAddresses)
}

export const isAuthError = (value: any): value is AuthError => {
  return value && 
    typeof value === 'object' && 
    typeof value.code === 'string' && 
    typeof value.message === 'string'
}

export const isValidAuthErrorCode = (code: string): code is AuthErrorCode => {
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
  return validCodes.includes(code as AuthErrorCode)
}

export const isOrganizationIdentifier = (value: any): value is OrganizationIdentifier => {
  return value && 
    typeof value === 'object' && 
    (value.id || value.slug || value.name)
}

// Helper Functions for Type Conversion
export const clerkUserToUser = (clerkUser: ClerkUser): ClerkUser => {
  // In Clerk-only system, we return the user as-is
  // This function exists for potential future transformation needs
  return clerkUser
}

export const clerkOrgToOrganization = (clerkOrg: ClerkOrganization): Organization => {
  return {
    id: clerkOrg.id,
    slug: clerkOrg.slug || '',
    name: clerkOrg.name,
    description: clerkOrg.publicMetadata?.description,
    imageUrl: clerkOrg.imageUrl,
    publicMetadata: clerkOrg.publicMetadata,
    privateMetadata: clerkOrg.privateMetadata,
    createdAt: new Date(clerkOrg.createdAt).toISOString(),
    updatedAt: new Date(clerkOrg.updatedAt).toISOString(),
    membersCount: clerkOrg.membersCount,
    maxMembers: clerkOrg.maxAllowedMemberships,
    plan: clerkOrg.publicMetadata?.plan || 'free'
  }
}

export const clerkMembershipToMembership = (
  clerkMembership: ClerkOrganizationMembership
): OrganizationMembership => {
  return {
    id: clerkMembership.id,
    organization: clerkOrgToOrganization(clerkMembership.organization),
    user: {
      id: clerkMembership.publicUserData.userId,
      firstName: clerkMembership.publicUserData.firstName,
      lastName: clerkMembership.publicUserData.lastName,
      emailAddress: clerkMembership.publicUserData.identifier,
      imageUrl: clerkMembership.publicUserData.imageUrl
    },
    role: clerkMembership.role as OrganizationRole,
    permissions: clerkMembership.permissions || [],
    createdAt: new Date(clerkMembership.createdAt).toISOString(),
    updatedAt: new Date(clerkMembership.updatedAt).toISOString()
  }
}

// Default/Empty States
export const createEmptyAuthState = (): UnifiedAuthContextType => ({
  user: null,
  isSignedIn: false,
  isLoaded: false,
  loading: true,
  organization: null,
  isOrgAdmin: false,
  orgMemberships: [],
  orgLoaded: false,
  availableOrganizations: [],
  orgListLoaded: false,
  orgContext: null,
  isOrgContextLoaded: false,
  switchOrganization: async () => {},
  setActive: async () => {},
  signUp: async () => { throw new Error('Use Clerk SignUp component') },
  signIn: async () => { throw new Error('Use Clerk SignIn component') },
  signOut: async () => {},
  resetPassword: async () => { throw new Error('Use Clerk password reset') },
  updateProfile: async () => null,
  isConfigured: false,
  authSystem: 'clerk'
})

// Constants
export const CLERK_AUTH_SYSTEM = 'clerk' as const
export const SUPPORTED_AUTH_SYSTEMS = [CLERK_AUTH_SYSTEM] as const

export const DEFAULT_ORGANIZATION_PERMISSIONS: string[] = []

export const ORGANIZATION_ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  guest: 1,
  member: 2,
  admin: 3
}

// Exported for use in components and hooks
export { type OrganizationRole, type OrganizationContextType } from './organization'