import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import { useClerkBridge } from '../components/ClerkAuthBridge'
import { UnifiedAuthContextType } from '../types/auth'

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
  
  // Get Clerk auth data from bridge
  const clerkBridge = useClerkBridge()
  // CRITICAL FIX: Don't default isLoaded to true when bridge is null - this was causing premature auth checks
  const clerkAuth = clerkBridge?.clerkAuth || { isLoaded: false, isSignedIn: false, user: null }
  const organization = clerkBridge?.organization || null
  const membershipList = clerkBridge?.membershipList || []
  const orgLoaded = clerkBridge?.orgLoaded || false  // Changed from true to false
  const setActive = clerkBridge?.setActive || (() => Promise.resolve())
  const organizationList = clerkBridge?.organizationList || []
  const orgListLoaded = clerkBridge?.orgListLoaded || false  // Changed from true to false
  const setActiveOrg = clerkBridge?.setActiveOrg || (() => Promise.resolve())
  
  // Unified state
  const [currentOrg, setCurrentOrg] = useState(null)
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)
  const [orgMemberships, setOrgMemberships] = useState([])
  const [orgContext, setOrgContext] = useState(null)
  const [isOrgContextLoaded, setIsOrgContextLoaded] = useState(false)

  // Add debugging logs for authentication state changes
  useEffect(() => {
    console.log('UnifiedAuthContext: Auth state updated:', {
      clerkAuth: {
        isLoaded: clerkAuth?.isLoaded,
        isSignedIn: clerkAuth?.isSignedIn,
        userId: clerkAuth?.user?.id,
        userEmail: clerkAuth?.user?.primaryEmailAddress?.emailAddress,
        userFullName: clerkAuth?.user?.fullName,
        loading: clerkAuth?.isLoaded === false
      },
      organization: {
        id: organization?.id,
        slug: organization?.slug,
        name: organization?.name
      },
      bridgeState: {
        hasBridge: !!clerkBridge,
        orgLoaded,
        orgListLoaded
      },
      timestamp: new Date().toISOString()
    })
  }, [
    clerkAuth?.isLoaded,
    clerkAuth?.isSignedIn,
    clerkAuth?.user?.id,
    clerkAuth?.user?.fullName,
    organization?.id,
    clerkBridge,
    orgLoaded,
    orgListLoaded
  ])

  // Update organization context from URL/domain
  useEffect(() => {
    if (clerkAuth?.isLoaded) {
      const context = getOrganizationContext()
      setOrgContext(context)
      setIsOrgContextLoaded(true)
    }
  }, [clerkAuth?.isLoaded, router.asPath])

  // Update organization state when Clerk organization changes
  useEffect(() => {
    if (orgLoaded) {
      // Only update if organization actually changed
      setCurrentOrg(prev => {
        if (prev?.id !== organization?.id) {
          return organization
        }
        return prev
      })
      
      // Check if user is an admin of the current organization
      const currentMembership = membershipList?.find(
        membership => membership.organization.id === organization?.id
      )
      const newIsOrgAdmin = currentMembership?.role === 'admin'
      
      // Only update admin status if it changed
      setIsOrgAdmin(prev => prev !== newIsOrgAdmin ? newIsOrgAdmin : prev)
      
      // Only update memberships if the array actually changed
      setOrgMemberships(prev => {
        const newMemberships = membershipList || []
        if (prev.length !== newMemberships.length || 
            prev.some((mem, index) => mem.id !== newMemberships[index]?.id)) {
          return newMemberships
        }
        return prev
      })
    }
  }, [organization, membershipList, orgLoaded])

  // Memoize available organizations to prevent unnecessary re-renders
  const availableOrganizations = useMemo(() => {
    if (orgListLoaded && organizationList) {
      return organizationList.map(orgMembership => ({
        id: orgMembership.organization.id,
        slug: orgMembership.organization.slug,
        name: orgMembership.organization.name,
        imageUrl: orgMembership.organization.imageUrl,
        role: orgMembership.role,
        permissions: orgMembership.permissions || []
      }))
    }
    return []
  }, [orgListLoaded, organizationList])

  // Create a stable ref for the setActive function to avoid circular dependencies
  const setActiveRef = useRef()
  setActiveRef.current = setActive

  // Create a stable ref for organization data to avoid circular dependencies  
  const organizationDataRef = useRef()
  organizationDataRef.current = { organization, organizationList, orgListLoaded }

  // Function to resolve organization from context
  const resolveAndSetOrganization = useCallback(async (context) => {
    if (!context || !context.identifier) return

    const { organization: currentOrg, organizationList: currentOrgList, orgListLoaded: currentOrgLoaded } = organizationDataRef.current

    // Build current available orgs from organizationList
    const currentOrgs = currentOrgLoaded && currentOrgList ? 
      currentOrgList.map(orgMembership => ({
        id: orgMembership.organization.id,
        slug: orgMembership.organization.slug,
        name: orgMembership.organization.name,
        imageUrl: orgMembership.organization.imageUrl,
        role: orgMembership.role,
        permissions: orgMembership.permissions || []
      })) : []

    if (!currentOrgs.length) return

    try {
      // Find organization in user's available organizations
      const targetOrg = currentOrgs.find(org => 
        org.slug === context.identifier || 
        org.id === context.identifier ||
        org.name.toLowerCase() === context.identifier.toLowerCase()
      )

      if (targetOrg && (!currentOrg || currentOrg.id !== targetOrg.id)) {
        // Switch to the target organization using the stable ref
        await setActiveRef.current({ organization: targetOrg.id })
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
  }, []) // Empty dependency array since we use refs for data access


  // Create stable refs for router and orgContext to avoid unnecessary recreations
  const routerRef = useRef()
  routerRef.current = router
  const orgContextRef = useRef()
  orgContextRef.current = orgContext

  // Function to switch organization context
  const switchOrganization = useCallback(async (orgIdentifier) => {
    if (!setActiveRef.current) return

    try {
      let targetOrgId = orgIdentifier
      const { organizationList: currentOrgList, orgListLoaded: currentOrgLoaded } = organizationDataRef.current

      if (typeof orgIdentifier === 'string') {
        // Build current available orgs from organizationList
        const currentOrgs = currentOrgLoaded && currentOrgList ? 
          currentOrgList.map(orgMembership => ({
            id: orgMembership.organization.id,
            slug: orgMembership.organization.slug,
            name: orgMembership.organization.name,
          })) : []

        // Find organization by slug or ID
        const targetOrg = currentOrgs.find(org => 
          org.id === orgIdentifier || 
          org.slug === orgIdentifier
        )
        targetOrgId = targetOrg?.id
      } else if (orgIdentifier && typeof orgIdentifier === 'object') {
        targetOrgId = orgIdentifier.id
      }

      if (targetOrgId) {
        await setActiveRef.current({ organization: targetOrgId })
        
        // Update URL if needed (for path-based routing)
        const currentOrgContext = orgContextRef.current
        if (currentOrgContext?.type === 'path') {
          const currentOrgs = currentOrgLoaded && currentOrgList ? 
            currentOrgList.map(orgMembership => ({
              id: orgMembership.organization.id,
              slug: orgMembership.organization.slug,
            })) : []
          const targetOrg = currentOrgs.find(org => org.id === targetOrgId)
          if (targetOrg?.slug) {
            const newPath = routerRef.current.asPath.replace(
              `/org/${currentOrgContext.identifier}`,
              `/org/${targetOrg.slug}`
            )
            routerRef.current.push(newPath)
          }
        }
      }
    } catch (error) {
      console.error('Error switching organization:', error)
    }
  }, []) // Empty dependency array since we use refs for data access

  // Handle organization resolution and switching based on context (after function definitions)
  useEffect(() => {
    if (orgContext && clerkAuth?.isSignedIn && orgListLoaded && organizationList?.length > 0) {
      resolveAndSetOrganization(orgContext)
    }
  }, [orgContext, clerkAuth?.isSignedIn, orgListLoaded, organizationList?.length, resolveAndSetOrganization])

  // Memoize the unified authentication interface to prevent unnecessary re-renders
  const auth = useMemo(() => ({
    // User state
    user: clerkAuth?.user || null,
    isSignedIn: clerkAuth?.isSignedIn || false,
    isLoaded: clerkAuth?.isLoaded || false,
    loading: clerkAuth?.isLoaded === false,
    
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
    signOut: () => clerkAuth?.signOut?.() || Promise.resolve(),
    
    // Legacy methods for compatibility
    resetPassword: async (email) => {
      throw new Error('Use Clerk password reset flow')
    },
    updateProfile: async (updates) => {
      return await clerkAuth?.user?.update?.(updates)
    },
    
    // Configuration - only check client-side accessible env vars
    isConfigured: !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ),
    
    // Auth system identifier
    authSystem: 'clerk'
  }), [
    // User state dependencies
    clerkAuth?.user?.id,
    clerkAuth?.isSignedIn,
    clerkAuth?.isLoaded,
    clerkAuth?.signOut,
    
    // Organization state dependencies
    currentOrg?.id,
    isOrgAdmin,
    orgMemberships,
    orgLoaded,
    availableOrganizations,
    orgListLoaded,
    
    // Organization context dependencies
    orgContext?.type,
    orgContext?.identifier,
    isOrgContextLoaded,
    
    // Method dependencies
    switchOrganization,
    setActive
  ])

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
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.CLERK_SECRET_KEY
  )
}