/**
 * TypeScript type definitions for Clerk Pages Router integration
 * Ensures proper type safety for Clerk authentication in Next.js Pages Router
 */

import type { ClerkProvider } from '@clerk/nextjs'
import type { AppearanceOptions } from '@clerk/types'

export interface ClerkPagesRouterProps {
  children: React.ReactNode
  publishableKey: string
  
  // Navigation props for Pages Router
  navigate?: (to: string) => Promise<boolean>
  routerPush?: (url: string) => Promise<boolean>
  routerReplace?: (url: string) => Promise<boolean>
  
  // Appearance customization
  appearance?: AppearanceOptions
  localization?: any
  
  // Authentication URLs
  signInUrl?: string
  signUpUrl?: string
  afterSignInUrl?: string
  afterSignUpUrl?: string
  
  // OAuth and organization support
  afterSignUpUrl?: string
  afterSignInUrl?: string
  signInForceRedirectUrl?: string
  signUpForceRedirectUrl?: string
}

export interface ClerkAuthState {
  isLoaded: boolean
  isSignedIn: boolean | undefined
  user: any | null
  sessionId: string | null
  orgRole: string | null
  orgId: string | null
  orgSlug: string | null
  getToken: (options?: any) => Promise<string | null>
}

export interface ClerkOrganizationState {
  organization: any | null
  isLoaded: boolean
  membershipList: any[] | null
  setActive: (params: { organization: string }) => Promise<void>
}

export interface UnifiedAuthContextType {
  // Core authentication
  user: any | null
  loading: boolean
  isLoaded: boolean
  isSignedIn: boolean | undefined
  sessionId: string | null
  
  // Organization management
  organization: any | null
  orgLoaded: boolean
  membershipList: any[] | null
  organizationList: any[] | null
  setActiveOrganization: (orgId: string) => Promise<void>
  
  // Authentication actions
  signOut: () => Promise<void>
  getToken: (options?: any) => Promise<string | null>
}

// Test types for authentication flow
export interface AuthFlowTestContext {
  signInUrl: string
  signUpUrl: string
  dashboardUrl: string
  publishableKey: string
  isTestMode: boolean
}

export interface OAuthTestResult {
  success: boolean
  redirectUrl?: string
  error?: string
  sessionCreated: boolean
  userAuthenticated: boolean
}

export interface SessionTestResult {
  isValid: boolean
  userId?: string
  orgId?: string
  expiresAt?: Date
  error?: string
}