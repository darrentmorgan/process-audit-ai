import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth as useClerkAuth, useOrganization, useOrganizationList } from '@clerk/nextjs'
import { useAuth as useSupabaseAuth } from './AuthContext'
import { useRouter } from 'next/router'

// Feature flag to control which authentication system to use
const USE_CLERK_AUTH = process.env.NEXT_PUBLIC_USE_CLERK_AUTH === 'true'

const UnifiedAuthContext = createContext({})

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext)
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider')
  }
  return context
}

export const UnifiedAuthProvider = ({ children }) => {
  const router = useRouter()
  
  // Clerk authentication
  const clerkAuth = useClerkAuth()
  const { organization, membershipList, isLoaded: orgLoaded, setActive } = useOrganization()
  const { organizationList, isLoaded: orgListLoaded, setActive: setActiveOrg } = useOrganizationList()
  
  // Supabase authentication (existing)
  const supabaseAuth = useSupabaseAuth()
  
  // Unified state
  const [currentOrg, setCurrentOrg] = useState(null)
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)
  const [orgMemberships, setOrgMemberships] = useState([])
  const [availableOrganizations, setAvailableOrganizations] = useState([])
  const [orgContext, setOrgContext] = useState(null)
  const [isOrgContextLoaded, setIsOrgContextLoaded] = useState(false)

  // Update organization context from URL/domain
  useEffect(() => {
    if (USE_CLERK_AUTH && clerkAuth.isLoaded) {
      const context = getOrganizationContext()
      setOrgContext(context)
      setIsOrgContextLoaded(true)
    }
  }, [USE_CLERK_AUTH, clerkAuth.isLoaded, router.asPath])

  // Handle organization resolution and switching based on context
  useEffect(() => {
    if (USE_CLERK_AUTH && orgContext && clerkAuth.isSignedIn && orgListLoaded) {
      resolveAndSetOrganization(orgContext)
    }
  }, [USE_CLERK_AUTH, orgContext, clerkAuth.isSignedIn, orgListLoaded, organizationList])

  // Update organization state when Clerk organization changes
  useEffect(() => {
    if (USE_CLERK_AUTH && orgLoaded) {
      setCurrentOrg(organization)
      
      // Check if user is an admin of the current organization
      const currentMembership = membershipList?.find(
        membership => membership.organization.id === organization?.id
      )
      setIsOrgAdmin(currentMembership?.role === 'admin')
      setOrgMemberships(membershipList || [])
    }
  }, [organization, membershipList, orgLoaded])

  // Update available organizations list
  useEffect(() => {
    if (USE_CLERK_AUTH && orgListLoaded && organizationList) {
      const orgs = organizationList.map(orgMembership => ({
        id: orgMembership.organization.id,
        slug: orgMembership.organization.slug,
        name: orgMembership.organization.name,
        imageUrl: orgMembership.organization.imageUrl,
        role: orgMembership.role,
        permissions: orgMembership.permissions || []
      }))
      setAvailableOrganizations(orgs)
    }
  }, [USE_CLERK_AUTH, orgListLoaded, organizationList])

  // Function to resolve organization from context
  const resolveAndSetOrganization = async (context) => {
    if (!context || !context.identifier) return

    try {
      // Find organization in user's available organizations
      const targetOrg = availableOrganizations.find(org => 
        org.slug === context.identifier || 
        org.id === context.identifier ||
        org.name.toLowerCase() === context.identifier.toLowerCase()
      )

      if (targetOrg && (!organization || organization.id !== targetOrg.id)) {
        // Switch to the target organization
        await setActive({ organization: targetOrg.id })
      } else if (!targetOrg && context.identifier) {
        // Try to resolve from public API (for organizations user isn't a member of)
        const response = await fetch(`/api/organizations/resolve?${context.type === 'domain' ? 'domain' : 'subdomain'}=${context.identifier}`)
        if (response.ok) {
          const result = await response.json()
          // Store resolved organization info but don't set as active (user isn't a member)
          console.log('Found organization but user is not a member:', result.data)
        }
      }
    } catch (error) {
      console.error('Error resolving organization:', error)
    }
  }

  // Function to switch organization context
  const switchOrganization = async (orgIdentifier) => {
    if (!USE_CLERK_AUTH || !setActive) return

    try {
      let targetOrgId = orgIdentifier

      if (typeof orgIdentifier === 'string') {
        // Find organization by slug or ID
        const targetOrg = availableOrganizations.find(org => 
          org.id === orgIdentifier || 
          org.slug === orgIdentifier
        )
        targetOrgId = targetOrg?.id
      } else if (orgIdentifier && typeof orgIdentifier === 'object') {
        targetOrgId = orgIdentifier.id
      }

      if (targetOrgId) {
        await setActive({ organization: targetOrgId })
        
        // Update URL if needed (for path-based routing)
        if (orgContext?.type === 'path') {
          const targetOrg = availableOrganizations.find(org => org.id === targetOrgId)
          if (targetOrg?.slug) {
            const newPath = router.asPath.replace(
              `/org/${orgContext.identifier}`,
              `/org/${targetOrg.slug}`
            )
            router.push(newPath)
          }
        }
      }
    } catch (error) {
      console.error('Error switching organization:', error)
    }
  }

  // Unified authentication interface
  const auth = USE_CLERK_AUTH ? {
    // User state
    user: clerkAuth.user,
    isSignedIn: clerkAuth.isSignedIn,
    isLoaded: clerkAuth.isLoaded,
    loading: !clerkAuth.isLoaded,
    
    // Organization state
    organization: currentOrg,
    isOrgAdmin,
    orgMemberships,
    orgLoaded,
    availableOrganizations,
    orgListLoaded,
    
    // Organization context
    orgContext,
    isOrgContextLoaded,
    
    // Organization management methods
    switchOrganization,
    setActive,
    
    // Auth methods (Clerk handles these via components)
    signUp: async (email, password, metadata = {}) => {
      throw new Error('Use Clerk SignUp component for registration')
    },
    signIn: async (email, password) => {
      throw new Error('Use Clerk SignIn component for authentication')
    },
    signOut: () => clerkAuth.signOut(),
    
    // Legacy methods for compatibility
    resetPassword: async (email) => {
      throw new Error('Use Clerk password reset flow')
    },
    updateProfile: async (updates) => {
      return await clerkAuth.user?.update(updates)
    },
    
    // Configuration
    isConfigured: !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
      process.env.CLERK_SECRET_KEY
    ),
    
    // Auth system identifier
    authSystem: 'clerk'
  } : {
    // Fallback to Supabase auth
    ...supabaseAuth,
    
    // Organization state (empty for Supabase)
    organization: null,
    isOrgAdmin: false,
    orgMemberships: [],
    orgLoaded: true,
    availableOrganizations: [],
    orgListLoaded: true,
    orgContext: null,
    isOrgContextLoaded: true,
    
    // Organization management methods (no-ops)
    switchOrganization: () => {},
    setActive: () => {},
    
    // Auth system identifier
    authSystem: 'supabase'
  }

  return (
    <UnifiedAuthContext.Provider value={auth}>
      {children}
    </UnifiedAuthContext.Provider>
  )
}

// Helper function to get organization context from URL or subdomain
export const getOrganizationContext = () => {
  if (typeof window === 'undefined') return null
  
  // Check for subdomain-based organization routing
  const hostname = window.location.hostname
  const subdomain = hostname.split('.')[0]
  
  // Skip common subdomains
  if (['www', 'app', 'admin'].includes(subdomain)) {
    return null
  }
  
  // Check for custom domains or organization-specific subdomains
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('vercel.app')) {
    return {
      type: 'domain',
      identifier: hostname
    }
  }
  
  // Check for path-based organization routing
  const pathParts = window.location.pathname.split('/').filter(Boolean)
  if (pathParts[0] === 'org' && pathParts[1]) {
    return {
      type: 'path',
      identifier: pathParts[1]
    }
  }
  
  return null
}

// Helper function to check if current deployment supports organizations
export const isOrganizationsEnabled = () => {
  return USE_CLERK_AUTH && !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.CLERK_SECRET_KEY
  )
}