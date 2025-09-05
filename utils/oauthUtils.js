/**
 * OAuth Utilities for Cross-Browser Compatibility
 * Optimized for ProcessAudit AI OAuth flows
 */

/**
 * Detects the current browser and version for OAuth compatibility checks
 */
export const getBrowserInfo = () => {
  if (typeof window === 'undefined') return null

  const userAgent = navigator.userAgent
  const browser = {
    name: 'unknown',
    version: 'unknown',
    isSupported: true,
    warnings: []
  }

  // Chrome detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+)/)
    browser.name = 'chrome'
    browser.version = match ? match[1] : 'unknown'
    browser.isSupported = true
  }
  // Firefox detection
  else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/)
    browser.name = 'firefox'
    browser.version = match ? match[1] : 'unknown'
    browser.isSupported = true
  }
  // Safari detection
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/)
    browser.name = 'safari'
    browser.version = match ? match[1] : 'unknown'
    browser.isSupported = true
    
    // Safari-specific warnings
    if (parseInt(browser.version) < 14) {
      browser.warnings.push('Safari versions below 14 may have OAuth popup issues')
    }
  }
  // Edge detection
  else if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/)
    browser.name = 'edge'
    browser.version = match ? match[1] : 'unknown'
    browser.isSupported = true
  }

  return browser
}

/**
 * Validates OAuth redirect URLs for cross-browser compatibility
 */
export const validateOAuthUrls = (redirectUrl, redirectUrlComplete) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  }

  try {
    // Validate redirect URL
    const redirectUrlObj = new URL(redirectUrl)
    if (redirectUrlObj.protocol !== 'https:' && redirectUrlObj.hostname !== 'localhost') {
      validation.errors.push('Redirect URL must use HTTPS in production')
      validation.isValid = false
    }

    // Validate completion URL
    const completeUrlObj = new URL(redirectUrlComplete)
    if (completeUrlObj.protocol !== 'https:' && completeUrlObj.hostname !== 'localhost') {
      validation.errors.push('Completion URL must use HTTPS in production')
      validation.isValid = false
    }

    // Check for common issues
    if (redirectUrl === redirectUrlComplete) {
      validation.warnings.push('Redirect and completion URLs are identical - this may cause loops')
    }

    // Browser-specific validations
    const browser = getBrowserInfo()
    if (browser) {
      if (browser.name === 'safari' && redirectUrl.includes('localhost')) {
        validation.warnings.push('Safari may block localhost redirects in some configurations')
      }
    }

  } catch (error) {
    validation.errors.push(`Invalid URL format: ${error.message}`)
    validation.isValid = false
  }

  return validation
}

/**
 * Checks if third-party cookies are enabled (affects OAuth in some browsers)
 */
export const checkThirdPartyCookieSupport = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ supported: false, tested: false })
      return
    }

    try {
      // Create a test cookie
      document.cookie = 'oauth_test=1; SameSite=None; Secure'
      
      // Check if cookie was set
      const supported = document.cookie.includes('oauth_test=1')
      
      // Clean up test cookie
      document.cookie = 'oauth_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure'
      
      resolve({ 
        supported, 
        tested: true,
        browserInfo: getBrowserInfo()
      })
    } catch (error) {
      resolve({ 
        supported: false, 
        tested: false, 
        error: error.message,
        browserInfo: getBrowserInfo()
      })
    }
  })
}

/**
 * Detects if popup blockers might interfere with OAuth
 */
export const detectPopupBlocker = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ blocked: false, tested: false })
      return
    }

    try {
      // Try to open a popup
      const popup = window.open('', '_blank', 'width=1,height=1')
      
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        resolve({ blocked: true, tested: true })
      } else {
        popup.close()
        resolve({ blocked: false, tested: true })
      }
    } catch (error) {
      resolve({ blocked: true, tested: false, error: error.message })
    }
  })
}

/**
 * Comprehensive OAuth environment check
 */
export const checkOAuthEnvironment = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    browser: getBrowserInfo(),
    urls: null,
    thirdPartyCookies: null,
    popupBlocker: null,
    overall: { ready: false, issues: [], warnings: [] }
  }

  // Check current URLs if available
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin
    const redirectUrl = baseUrl + '/sign-in'
    const redirectUrlComplete = baseUrl + '/dashboard'
    
    results.urls = {
      base: baseUrl,
      redirect: redirectUrl,
      complete: redirectUrlComplete,
      validation: validateOAuthUrls(redirectUrl, redirectUrlComplete)
    }
  }

  // Check third-party cookies
  results.thirdPartyCookies = await checkThirdPartyCookieSupport()
  
  // Check popup blocker
  results.popupBlocker = await detectPopupBlocker()

  // Determine overall readiness
  if (results.browser && results.browser.isSupported) {
    results.overall.ready = true
  } else {
    results.overall.issues.push('Browser not supported or detected')
  }

  if (results.urls && !results.urls.validation.isValid) {
    results.overall.ready = false
    results.overall.issues.push(...results.urls.validation.errors)
  }

  if (results.popupBlocker && results.popupBlocker.blocked) {
    results.overall.warnings.push('Popup blocker detected - OAuth may require user interaction')
  }

  if (results.thirdPartyCookies && !results.thirdPartyCookies.supported) {
    results.overall.warnings.push('Third-party cookies may be blocked - could affect OAuth')
  }

  // Add browser-specific warnings
  if (results.browser) {
    results.overall.warnings.push(...results.browser.warnings)
  }

  return results
}

/**
 * Get user-friendly error message based on OAuth failure type
 */
export const getOAuthErrorMessage = (error, provider) => {
  const errorString = error?.message || error?.toString() || ''
  const providerName = provider?.charAt(0).toUpperCase() + provider?.slice(1) || 'OAuth'

  // Network/connection errors
  if (errorString.includes('network') || errorString.includes('connection') || errorString.includes('fetch')) {
    return {
      title: 'Connection Error',
      message: `Unable to connect to ${providerName}. Please check your internet connection and try again.`,
      type: 'network'
    }
  }

  // Popup blocked errors
  if (errorString.includes('popup') || errorString.includes('blocked')) {
    return {
      title: 'Popup Blocked',
      message: `Your browser blocked the ${providerName} sign-in popup. Please allow popups for this site and try again.`,
      type: 'popup'
    }
  }

  // Cookie/privacy errors
  if (errorString.includes('cookie') || errorString.includes('privacy') || errorString.includes('tracking')) {
    return {
      title: 'Privacy Settings',
      message: `Your browser's privacy settings are blocking ${providerName} sign-in. Please allow cookies and try again.`,
      type: 'privacy'
    }
  }

  // Rate limiting errors
  if (errorString.includes('rate') || errorString.includes('limit') || errorString.includes('too many')) {
    return {
      title: 'Too Many Attempts',
      message: `Too many sign-in attempts. Please wait a few minutes before trying again.`,
      type: 'rate_limit'
    }
  }

  // Generic OAuth errors
  if (errorString.includes('oauth') || errorString.includes('authorization')) {
    return {
      title: `${providerName} Authentication Failed`,
      message: `There was a problem with ${providerName} authentication. Please try again or use email sign-in.`,
      type: 'oauth'
    }
  }

  // Default error
  return {
    title: 'Sign-in Error',
    message: `An unexpected error occurred during ${providerName} sign-in. Please try again or contact support if the issue persists.`,
    type: 'unknown'
  }
}

/**
 * Test OAuth flow readiness (development only)
 */
export const testOAuthReadiness = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('OAuth readiness test should only be run in development')
    return null
  }

  console.log('🔍 Testing OAuth Environment...')
  
  const results = await checkOAuthEnvironment()
  
  console.log('📊 OAuth Environment Results:', {
    browser: `${results.browser?.name} ${results.browser?.version}`,
    ready: results.overall.ready,
    issues: results.overall.issues.length,
    warnings: results.overall.warnings.length
  })

  if (results.overall.issues.length > 0) {
    console.error('❌ OAuth Issues Found:', results.overall.issues)
  }

  if (results.overall.warnings.length > 0) {
    console.warn('⚠️ OAuth Warnings:', results.overall.warnings)
  }

  if (results.overall.ready) {
    console.log('✅ OAuth environment is ready!')
  } else {
    console.error('❌ OAuth environment has issues that need to be resolved')
  }

  return results
}