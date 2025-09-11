import ClerkProviderPagesRouter from './ClerkProviderPagesRouter'
import { dark } from '@clerk/themes'
import ClerkAuthBridge from './ClerkAuthBridge'

// Feature flag to control Clerk usage
const USE_CLERK_AUTH = process.env.NEXT_PUBLIC_USE_CLERK_AUTH === 'true'

const ClerkProviderWrapper = ({ children }) => {
  // If Clerk is not enabled, just render children
  if (!USE_CLERK_AUTH) {
    return <>{children}</>
  }

  // Validate required environment variables
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  if (!publishableKey) {
    console.error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Clerk authentication disabled.')
    return <>{children}</>
  }

  // Determine if this is a satellite domain (Hospo-Dojo subdomain)
  const isSatellite = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === 'true'
  const satelliteDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN
  const primarySignInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in'
  const primarySignUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up'
  
  // Configure allowed redirect origins for cross-domain auth
  const allowedRedirectOrigins = []
  if (process.env.NEXT_PUBLIC_CLERK_ALLOWED_REDIRECT_ORIGINS) {
    allowedRedirectOrigins.push(...process.env.NEXT_PUBLIC_CLERK_ALLOWED_REDIRECT_ORIGINS.split(','))
  }

  // Satellite domain configuration based on Clerk documentation
  const satelliteConfig = isSatellite ? {
    isSatellite: true,
    domain: (url) => url.host,
    signInUrl: primarySignInUrl,
    signUpUrl: primarySignUpUrl,
  } : {}

  // Primary domain configuration 
  const primaryConfig = !isSatellite && allowedRedirectOrigins.length > 0 ? {
    allowedRedirectOrigins: allowedRedirectOrigins
  } : {}

  return (
    <ClerkProviderPagesRouter
      publishableKey={publishableKey}
      {...satelliteConfig}
      {...primaryConfig}
      appearance={{
        baseTheme: undefined, // Use light theme by default
        variables: {
          // Custom branding variables
          colorPrimary: '#3b82f6', // Match ProcessAudit AI primary color
          colorBackground: '#ffffff',
          colorInputBackground: '#f9fafb',
          colorInputText: '#111827',
          borderRadius: '0.5rem',
        },
        elements: {
          // Custom styling for organization switcher
          organizationSwitcherTrigger: {
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            '&:hover': {
              backgroundColor: '#f9fafb',
            },
          },
          organizationSwitcherPopover: {
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          // Custom styling for user button
          userButtonTrigger: {
            padding: '0.5rem',
            borderRadius: '9999px',
            '&:hover': {
              backgroundColor: '#f3f4f6',
            },
          },
          // Form styling
          formFieldInput: {
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.75rem 1rem',
            '&:focus': {
              borderColor: '#3b82f6',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
            },
          },
          formButtonPrimary: {
            borderRadius: '0.5rem',
            backgroundColor: '#3b82f6',
            '&:hover': {
              backgroundColor: '#2563eb',
            },
          },
        },
      }}
      localization={{
        // Custom text for organization features
        organizationProfile: {
          navbar: {
            title: 'Organization Settings',
            description: 'Manage your organization settings and members',
          },
        },
        organizationSwitcher: {
          action__createOrganization: 'Create Organization',
          action__manageOrganization: 'Manage Organization',
        },
      }}
    >
      <ClerkAuthBridge>
        {children}
      </ClerkAuthBridge>
    </ClerkProviderPagesRouter>
  )
}

export default ClerkProviderWrapper