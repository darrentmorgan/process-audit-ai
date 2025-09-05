import { useRouter } from 'next/router'
import { useEffect, useRef, useState, useMemo } from 'react'
import ProcessAuditApp from '../components/ProcessAuditApp'
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading, isLoaded, isSignedIn } = useUnifiedAuth()
  const redirectAttempted = useRef(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)

  // Check for OAuth success parameters in URL
  const isFromOAuth = useMemo(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const hasOAuthState = urlParams.has('__clerk_oauth_state')
      const hasOAuthHash = window.location.hash.includes('oauth')
      console.log('Dashboard: Checking OAuth parameters:', {
        hasOAuthState,
        hasOAuthHash,
        urlParams: Object.fromEntries(urlParams),
        hash: window.location.hash,
        href: window.location.href
      })
      return hasOAuthState || hasOAuthHash
    }
    return false
  }, [])

  useEffect(() => {
    console.log('Dashboard: Auth state change:', { 
      user: !!user,
      userId: user?.id,
      userEmail: user?.primaryEmailAddress?.emailAddress,
      loading, 
      isLoaded, 
      isSignedIn, 
      pathname: router.pathname,
      redirectAttempted: redirectAttempted.current,
      isFromOAuth,
      authChecked,
      timestamp: new Date().toISOString()
    })

    // CRITICAL FIX: Add longer wait for OAuth callbacks to complete
    if (isFromOAuth && !redirectAttempted.current) {
      console.log('Dashboard: OAuth callback detected - waiting for auth state to settle')
      // Give OAuth callback extra time to process
      const oauthTimer = setTimeout(() => {
        console.log('Dashboard: OAuth wait timeout - checking auth state:', {
          user: !!user,
          isSignedIn,
          isLoaded,
          loading
        })
        
        if (isLoaded && !loading && !redirectAttempted.current) {
          if (!user && !isSignedIn) {
            console.log('Dashboard: OAuth callback failed - redirecting to sign-in')
            redirectAttempted.current = true
            router.push('/sign-in')
          } else if (user && isSignedIn) {
            console.log('Dashboard: OAuth callback successful - showing dashboard')
            setAuthChecked(true)
            setShowWelcomeMessage(true)
            setTimeout(() => setShowWelcomeMessage(false), 3000)
          }
        }
      }, 500) // Wait 500ms for OAuth callback to complete
      
      return () => clearTimeout(oauthTimer)
    }

    // Normal authentication check for non-OAuth flows
    if (isLoaded && !loading && !redirectAttempted.current && !isFromOAuth) {
      if (!user && !isSignedIn) {
        console.log('Dashboard: No authentication detected - redirecting to sign-in')
        redirectAttempted.current = true
        router.push('/sign-in')
        return
      }
      console.log('Dashboard: Authentication confirmed - setting authChecked')
      setAuthChecked(true)
    }
  }, [user, loading, isLoaded, isSignedIn, router, isFromOAuth, authChecked])

  // ENHANCED LOADING STATE: Show loading while Clerk is initializing or authentication is being checked
  // Wait for BOTH Clerk to be loaded AND our auth context to be checked
  const clerkIsLoading = !isLoaded || loading
  const contextIsLoading = !authChecked
  
  if (clerkIsLoading || contextIsLoading) {
    console.log('Dashboard: Loading state -', {
      clerkIsLoading,
      contextIsLoading,
      isLoaded,
      loading,
      authChecked,
      isFromOAuth
    })
    
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">
            {clerkIsLoading ? 'Loading authentication system...' : 'Checking access...'}
          </div>
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-white text-sm">
              {clerkIsLoading ? 'Initializing Clerk authentication...' : 'Please wait...'}
            </span>
          </div>
          {isFromOAuth && (
            <div className="mt-4 text-blue-200 text-sm">
              Completing OAuth authentication...
            </div>
          )}
          <div className="mt-2 text-blue-300 text-xs">
            Debug: Clerk loaded: {isLoaded ? 'Yes' : 'No'}, Auth checked: {authChecked ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    )
  }

  // If no user after auth check, show error instead of redirect loop
  if (!user || !isSignedIn) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-xl mb-4">Authentication Required</div>
          <button 
            onClick={() => router.push('/sign-in')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  // User is authenticated, show the main app
  console.log('Dashboard: Rendering ProcessAuditApp for authenticated user')
  
  return (
    <div className="relative">
      {/* OAuth Success Welcome Message */}
      {showWelcomeMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg border border-green-400 transition-opacity duration-500">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Welcome back! You're successfully signed in.</span>
          </div>
        </div>
      )}
      
      <ProcessAuditApp isDemoMode={false} />
    </div>
  )
}