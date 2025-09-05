import { useAuth, useUser, useOrganization, useOrganizationList } from '@clerk/nextjs'
import { createContext, useContext, useMemo, useEffect } from 'react'

const ClerkAuthBridgeContext = createContext({})

export const useClerkBridge = () => {
  const context = useContext(ClerkAuthBridgeContext)
  if (!context) {
    throw new Error('useClerkBridge must be used within a ClerkAuthBridge')
  }
  return context
}

const ClerkAuthBridge = ({ children }) => {
  const clerkAuth = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const { organization, membershipList, isLoaded: orgLoaded, setActive } = useOrganization()
  const { organizationList, isLoaded: orgListLoaded, setActive: setActiveOrg } = useOrganizationList()

  // Add debugging logs for Clerk auth state changes
  useEffect(() => {
    console.log('ClerkAuthBridge: Auth state changed:', {
      isLoaded: clerkAuth?.isLoaded,
      isSignedIn: clerkAuth?.isSignedIn,
      userId: user?.id,
      userEmail: user?.primaryEmailAddress?.emailAddress,
      sessionId: clerkAuth?.sessionId,
      userLoaded,
      orgLoaded,
      orgListLoaded,
      organizationCount: organizationList?.length || 0,
      membershipCount: membershipList?.length || 0,
      timestamp: new Date().toISOString()
    })
  }, [
    clerkAuth?.isLoaded,
    clerkAuth?.isSignedIn,
    user?.id,
    clerkAuth?.sessionId,
    userLoaded,
    orgLoaded,
    orgListLoaded,
    organizationList?.length,
    membershipList?.length
  ])

  // Memoize the bridge value to prevent unnecessary re-renders
  const bridgeValue = useMemo(() => ({
    clerkAuth: {
      ...clerkAuth,
      user, // Override with proper user from useUser()
      isLoaded: clerkAuth?.isLoaded && userLoaded // Both auth and user must be loaded
    },
    organization,
    membershipList, 
    orgLoaded,
    setActive,
    organizationList,
    orgListLoaded,
    setActiveOrg
  }), [
    clerkAuth?.isLoaded,
    clerkAuth?.isSignedIn,
    clerkAuth?.sessionId,
    user?.id,
    userLoaded,
    organization?.id,
    membershipList?.length,
    orgLoaded,
    setActive,
    organizationList?.length,
    orgListLoaded,
    setActiveOrg
  ])

  return (
    <ClerkAuthBridgeContext.Provider value={bridgeValue}>
      {children}
    </ClerkAuthBridgeContext.Provider>
  )
}

export default ClerkAuthBridge