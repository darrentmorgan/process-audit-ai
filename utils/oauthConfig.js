/**
 * OAuth Configuration and Environment Validation
 * Ensures ProcessAudit AI OAuth setup is production-ready
 */

/**
 * Validates Clerk OAuth configuration
 */
export const validateClerkOAuthConfig = () => {
  const config = {
    isValid: true,
    errors: [],
    warnings: [],
    environment: process.env.NODE_ENV || 'development'
  }

  // Check required environment variables
  const requiredVars = {
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY
  }

  for (const [varName, value] of Object.entries(requiredVars)) {
    if (!value) {
      config.errors.push(`Missing required environment variable: ${varName}`)
      config.isValid = false
    } else if (varName === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' && !value.startsWith('pk_')) {
      config.errors.push(`Invalid format for ${varName}: should start with 'pk_'`)
      config.isValid = false
    } else if (varName === 'CLERK_SECRET_KEY' && !value.startsWith('sk_')) {
      config.errors.push(`Invalid format for ${varName}: should start with 'sk_'`)
      config.isValid = false
    }
  }

  // Environment-specific validations
  if (config.environment === 'production') {
    const publishableKey = requiredVars['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']
    if (publishableKey && publishableKey.includes('_test_')) {
      config.errors.push('Using test keys in production environment')
      config.isValid = false
    }
  }

  // Check for development environment warnings
  if (config.environment === 'development') {
    const publishableKey = requiredVars['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']
    if (publishableKey && !publishableKey.includes('_test_')) {
      config.warnings.push('Using production keys in development environment')
    }
  }

  return config
}

/**
 * Gets OAuth redirect configuration for current environment
 */
export const getOAuthRedirectConfig = (orgContext = null) => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'

  const config = {
    baseUrl,
    redirectUrl: `${baseUrl}/sign-in`,
    redirectUrlComplete: orgContext 
      ? `${baseUrl}/org/${orgContext}/dashboard` 
      : `${baseUrl}/dashboard`
  }

  // Add validation
  config.validation = validateOAuthRedirectUrls(config.redirectUrl, config.redirectUrlComplete)

  return config
}

/**
 * Validates OAuth redirect URLs
 */
export const validateOAuthRedirectUrls = (redirectUrl, redirectUrlComplete) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  }

  try {
    // Parse URLs
    const redirectUrlObj = new URL(redirectUrl)
    const completeUrlObj = new URL(redirectUrlComplete)

    // Production HTTPS requirement
    if (process.env.NODE_ENV === 'production') {
      if (redirectUrlObj.protocol !== 'https:') {
        validation.errors.push('Redirect URL must use HTTPS in production')
        validation.isValid = false
      }
      if (completeUrlObj.protocol !== 'https:') {
        validation.errors.push('Completion URL must use HTTPS in production')
        validation.isValid = false
      }
    }

    // Check for localhost in production
    if (process.env.NODE_ENV === 'production') {
      if (redirectUrlObj.hostname === 'localhost' || completeUrlObj.hostname === 'localhost') {
        validation.errors.push('Cannot use localhost URLs in production')
        validation.isValid = false
      }
    }

    // Check for common issues
    if (redirectUrl === redirectUrlComplete) {
      validation.warnings.push('Redirect and completion URLs are identical - may cause redirect loops')
    }

    // Check for proper domain matching
    if (redirectUrlObj.hostname !== completeUrlObj.hostname) {
      validation.warnings.push('Redirect URLs use different domains - may cause cookie issues')
    }

  } catch (error) {
    validation.errors.push(`Invalid URL format: ${error.message}`)
    validation.isValid = false
  }

  return validation
}

/**
 * Comprehensive OAuth setup validation
 */
export const validateOAuthSetup = (orgContext = null) => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    clerk: validateClerkOAuthConfig(),
    redirects: null,
    overall: { ready: false, criticalIssues: [], warnings: [] }
  }

  // Get and validate redirect configuration
  const redirectConfig = getOAuthRedirectConfig(orgContext)
  results.redirects = redirectConfig

  // Determine overall readiness
  results.overall.ready = results.clerk.isValid && results.redirects.validation.isValid

  // Collect all critical issues
  results.overall.criticalIssues = [
    ...results.clerk.errors,
    ...results.redirects.validation.errors
  ]

  // Collect all warnings
  results.overall.warnings = [
    ...results.clerk.warnings,
    ...results.redirects.validation.warnings
  ]

  return results
}

/**
 * Get OAuth provider configuration
 */
export const getOAuthProviderConfig = () => {
  return {
    google: {
      enabled: true,
      name: 'Google',
      icon: 'google',
      strategy: 'oauth_google'
    },
    github: {
      enabled: true,
      name: 'GitHub', 
      icon: 'github',
      strategy: 'oauth_github'
    }
  }
}

/**
 * Development OAuth testing helper
 */
export const testOAuthConfiguration = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('OAuth configuration test should only be run in development')
    return null
  }

  console.log('🔧 Testing OAuth Configuration...')
  
  const validation = validateOAuthSetup()
  
  console.log('📋 OAuth Configuration Results:', {
    environment: validation.environment,
    clerkValid: validation.clerk.isValid,
    redirectsValid: validation.redirects.validation.isValid,
    overallReady: validation.overall.ready
  })

  // Log Clerk configuration
  console.log('🔐 Clerk Configuration:', {
    hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasSecretKey: !!process.env.CLERK_SECRET_KEY,
    errors: validation.clerk.errors
  })

  // Log redirect configuration
  console.log('🔄 Redirect Configuration:', {
    baseUrl: validation.redirects.baseUrl,
    redirectUrl: validation.redirects.redirectUrl,
    completionUrl: validation.redirects.redirectUrlComplete,
    valid: validation.redirects.validation.isValid
  })

  // Log issues
  if (validation.overall.criticalIssues.length > 0) {
    console.error('❌ Critical OAuth Issues:', validation.overall.criticalIssues)
  }

  if (validation.overall.warnings.length > 0) {
    console.warn('⚠️ OAuth Warnings:', validation.overall.warnings)
  }

  if (validation.overall.ready) {
    console.log('✅ OAuth configuration is ready!')
  } else {
    console.error('❌ OAuth configuration needs attention')
  }

  return validation
}

/**
 * Get production-ready OAuth environment checklist
 */
export const getOAuthProductionChecklist = () => {
  return [
    {
      id: 'clerk_keys',
      title: 'Clerk API Keys',
      description: 'Production Clerk keys are configured',
      check: () => {
        const config = validateClerkOAuthConfig()
        return {
          passed: config.isValid && process.env.NODE_ENV === 'production' 
            ? !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('_test_')
            : config.isValid,
          details: config.errors.join(', ') || 'Valid'
        }
      }
    },
    {
      id: 'https_urls',
      title: 'HTTPS Redirect URLs',
      description: 'All OAuth redirect URLs use HTTPS',
      check: () => {
        const redirectConfig = getOAuthRedirectConfig()
        const httpsUrls = redirectConfig.redirectUrl.startsWith('https://') && 
                         redirectConfig.redirectUrlComplete.startsWith('https://')
        return {
          passed: process.env.NODE_ENV === 'development' || httpsUrls,
          details: httpsUrls ? 'Using HTTPS' : 'HTTP detected (development only)'
        }
      }
    },
    {
      id: 'domain_consistency',
      title: 'Domain Consistency',
      description: 'OAuth redirect URLs use consistent domains',
      check: () => {
        try {
          const redirectConfig = getOAuthRedirectConfig()
          const redirectDomain = new URL(redirectConfig.redirectUrl).hostname
          const completeDomain = new URL(redirectConfig.redirectUrlComplete).hostname
          const consistent = redirectDomain === completeDomain
          return {
            passed: consistent,
            details: consistent ? 'Domains match' : `${redirectDomain} !== ${completeDomain}`
          }
        } catch (error) {
          return {
            passed: false,
            details: `URL parsing error: ${error.message}`
          }
        }
      }
    },
    {
      id: 'environment_vars',
      title: 'Environment Variables',
      description: 'All required OAuth environment variables are set',
      check: () => {
        const requiredVars = [
          'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
          'CLERK_SECRET_KEY'
        ]
        const missingVars = requiredVars.filter(varName => !process.env[varName])
        return {
          passed: missingVars.length === 0,
          details: missingVars.length === 0 ? 'All variables set' : `Missing: ${missingVars.join(', ')}`
        }
      }
    }
  ]
}