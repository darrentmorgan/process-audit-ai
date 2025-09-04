/**
 * TypeScript types and interfaces for multi-tenant organization system
 * ProcessAudit AI - Phase 2 Multi-Tenancy Implementation
 */

// Core organization types
export interface Organization {
  id: string
  slug: string
  name: string
  description?: string
  imageUrl?: string
  publicMetadata?: Record<string, any>
  privateMetadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  membersCount?: number
  maxMembers?: number
  plan?: OrganizationPlan
}

export interface OrganizationMembership {
  id: string
  organization: Organization
  user: {
    id: string
    firstName?: string
    lastName?: string
    emailAddress: string
    imageUrl?: string
  }
  role: OrganizationRole
  permissions?: string[]
  createdAt: string
  updatedAt: string
}

// Organization roles and permissions
export type OrganizationRole = 'admin' | 'member' | 'guest'

export interface OrganizationPermissions {
  canManageOrganization: boolean
  canManageMembers: boolean
  canCreateProjects: boolean
  canViewReports: boolean
  canManageReports: boolean
  canManageAutomations: boolean
  canManageIntegrations: boolean
  canAccessAnalytics: boolean
}

// Organization plans and billing
export type OrganizationPlan = 'free' | 'professional' | 'enterprise'

export interface OrganizationBilling {
  plan: OrganizationPlan
  status: 'active' | 'inactive' | 'past_due' | 'canceled'
  currentPeriodStart?: string
  currentPeriodEnd?: string
  subscriptionId?: string
  customerId?: string
}

// Organization context and routing
export type OrganizationContextType = 'domain' | 'path' | 'none'

export interface OrganizationContext {
  type: OrganizationContextType
  identifier?: string
  domain?: string
  subdomain?: string
  customDomain?: string
  originalPath?: string
  isCustomDomain?: boolean
  environment?: 'production' | 'staging' | 'development'
}

export interface OrganizationRouting {
  currentOrg?: Organization
  orgContext?: OrganizationContext
  isOrgAdmin: boolean
  orgMemberships: OrganizationMembership[]
  availableOrgs: Organization[]
}

// Organization creation and management
export interface CreateOrganizationData {
  name: string
  slug?: string
  description?: string
  imageUrl?: string
  plan?: OrganizationPlan
  publicMetadata?: Record<string, any>
}

export interface UpdateOrganizationData {
  name?: string
  slug?: string
  description?: string
  imageUrl?: string
  publicMetadata?: Record<string, any>
  privateMetadata?: Record<string, any>
}

// Member management
export interface InviteMemberData {
  emailAddress: string
  role: OrganizationRole
  redirectUrl?: string
}

export interface UpdateMembershipData {
  role: OrganizationRole
  permissions?: string[]
}

// Organization settings
export interface OrganizationSettings {
  general: {
    name: string
    description?: string
    imageUrl?: string
    website?: string
    industry?: string
  }
  branding: {
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string
    faviconUrl?: string
    customDomain?: string
  }
  features: {
    enableAutomations: boolean
    enableReporting: boolean
    enableIntegrations: boolean
    enableAnalytics: boolean
    maxProjects?: number
    maxMembers?: number
  }
  security: {
    requireTwoFactor: boolean
    allowGuestAccess: boolean
    sessionTimeout?: number
    ipWhitelist?: string[]
  }
  notifications: {
    emailNotifications: boolean
    slackWebhook?: string
    webhookUrl?: string
  }
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface OrganizationApiResponse extends ApiResponse<Organization> {}
export interface OrganizationListResponse extends ApiResponse<Organization[]> {}
export interface MembershipApiResponse extends ApiResponse<OrganizationMembership> {}
export interface MembershipListResponse extends ApiResponse<OrganizationMembership[]> {}

// Error types
export interface OrganizationError {
  code: string
  message: string
  details?: Record<string, any>
}

export type OrganizationErrorCode = 
  | 'ORG_NOT_FOUND'
  | 'ORG_ALREADY_EXISTS'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'INVALID_SLUG'
  | 'MEMBER_NOT_FOUND'
  | 'MEMBER_ALREADY_EXISTS'
  | 'PLAN_LIMIT_EXCEEDED'
  | 'INVALID_DOMAIN'
  | 'DOMAIN_ALREADY_TAKEN'

// Component prop types
export interface OrganizationProviderProps {
  children: React.ReactNode
  initialOrganization?: Organization
  orgContext?: OrganizationContext
}

export interface OrganizationSwitcherProps {
  className?: string
  onOrganizationChange?: (org: Organization) => void
  showCreateOption?: boolean
  hidePersonalAccount?: boolean
}

export interface OrganizationManagerProps {
  organization?: Organization
  isOpen: boolean
  onClose: () => void
  onOrganizationUpdate?: (org: Organization) => void
}

export interface OrganizationMembershipModalProps {
  organization: Organization
  isOpen: boolean
  onClose: () => void
  onMembershipChange?: () => void
}

export interface OrganizationSettingsPanelProps {
  organization: Organization
  userRole: OrganizationRole
  onSettingsUpdate?: (settings: Partial<OrganizationSettings>) => void
}

// Hook return types
export interface UseOrganizationReturn {
  organization?: Organization
  isLoaded: boolean
  memberships: OrganizationMembership[]
  membership?: OrganizationMembership
  isAdmin: boolean
  isMember: boolean
  setActive: (params: { organization: string }) => Promise<void>
}

export interface UseOrganizationListReturn {
  organizations: Organization[]
  isLoaded: boolean
  isLoading: boolean
  hasNextPage: boolean
  fetchNext: () => void
}

export interface UseOrganizationContextReturn {
  orgContext: OrganizationContext | null
  routingType: OrganizationContextType
  isOrganizationRoute: boolean
  resolveOrganization: (identifier: string) => Promise<Organization | null>
  switchOrganization: (org: Organization | string) => void
}

// Database/Clerk integration types
export interface ClerkOrganization {
  id: string
  name: string
  slug: string | null
  imageUrl: string
  hasImage: boolean
  createdBy: string
  createdAt: number
  updatedAt: number
  publicMetadata: Record<string, any>
  privateMetadata: Record<string, any>
  maxAllowedMemberships: number
  adminDeleteEnabled: boolean
  membersCount?: number
}

export interface ClerkOrganizationMembership {
  id: string
  organization: ClerkOrganization
  publicUserData: {
    userId: string
    firstName: string | null
    lastName: string | null
    imageUrl: string
    hasImage: boolean
    identifier: string
  }
  role: string
  permissions: string[]
  createdAt: number
  updatedAt: number
}

// Utility types
export type OrganizationIdentifier = string | Organization
export type MembershipIdentifier = string | OrganizationMembership

// Type guards
export const isOrganization = (value: any): value is Organization => {
  return value && typeof value === 'object' && typeof value.id === 'string' && typeof value.name === 'string'
}

export const isOrganizationMembership = (value: any): value is OrganizationMembership => {
  return value && typeof value === 'object' && value.organization && value.user && typeof value.role === 'string'
}

export const isValidOrganizationRole = (role: string): role is OrganizationRole => {
  return ['admin', 'member', 'guest'].includes(role)
}

export const isValidOrganizationPlan = (plan: string): plan is OrganizationPlan => {
  return ['free', 'professional', 'enterprise'].includes(plan)
}