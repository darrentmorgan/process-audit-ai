import { ClerkProvider } from '@clerk/nextjs'
import { useRouter } from 'next/router'

/**
 * Enhanced ClerkProvider wrapper for Next.js Pages Router
 * Provides proper navigation integration and session handling for Pages Router
 * Fixes OAuth callback issues and session persistence
 */
const ClerkProviderPagesRouter = ({ 
  children, 
  publishableKey, 
  appearance = {},
  localization = {},
  ...props 
}) => {
  const router = useRouter()

  // Enhanced navigation handler for Pages Router
  const navigate = async (to) => {
    try {
      console.log('ClerkProvider: Navigating to', to)
      await router.push(to)
      return true
    } catch (error) {
      console.error('ClerkProvider: Navigation failed', error)
      return false
    }
  }

  // Simplified ClerkProvider configuration for hosted authentication
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={appearance}
      localization={localization}
      // Navigation configuration for Next.js Pages Router
      navigate={navigate}
      routerPush={(url) => router.push(url)}
      routerReplace={(url) => router.replace(url)}
      // Redirect URLs - where to go after successful auth
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      // Fallback redirects
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      // Additional Pages Router specific props
      {...props}
    >
      {children}
    </ClerkProvider>
  )
}

export default ClerkProviderPagesRouter