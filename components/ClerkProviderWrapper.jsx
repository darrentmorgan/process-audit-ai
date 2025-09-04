import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

// Feature flag to control Clerk usage
const USE_CLERK_AUTH = process.env.NEXT_PUBLIC_USE_CLERK_AUTH === 'true'

const ClerkProviderWrapper = ({ children }) => {
  // If Clerk is not enabled, just render children
  if (!USE_CLERK_AUTH) {
    return <>{children}</>
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
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
      {children}
    </ClerkProvider>
  )
}

export default ClerkProviderWrapper