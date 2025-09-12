/**
 * Mobile Optimization Middleware
 * Optimizes API responses and caching for mobile devices and slow networks
 */

import { NextResponse } from 'next/server'

// Mobile device detection regex
const MOBILE_USER_AGENTS = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

// Slow network types that need optimization
const SLOW_NETWORKS = ['slow-2g', '2g', '3g']

/**
 * Detects if the request is from a mobile device
 */
export function isMobileRequest(request) {
  const userAgent = request.headers.get('user-agent') || ''
  return MOBILE_USER_AGENTS.test(userAgent)
}

/**
 * Detects if the request is from a slow network
 */
export function isSlowNetworkRequest(request) {
  const saveData = request.headers.get('save-data')
  const networkType = request.headers.get('ect') // Effective Connection Type
  
  return saveData === 'on' || (networkType && SLOW_NETWORKS.includes(networkType))
}

/**
 * Optimizes response for mobile devices
 */
export function optimizeForMobile(response, originalData) {
  if (!originalData) return response
  
  // Remove non-essential data for mobile
  const mobileOptimizedData = {
    ...originalData,
    // Remove debug information
    debug: undefined,
    metadata: originalData.metadata ? {
      // Keep only essential metadata
      timestamp: originalData.metadata.timestamp,
      version: originalData.metadata.version
    } : undefined,
    // Compress large text fields
    description: originalData.description?.substring(0, 500) + (
      originalData.description?.length > 500 ? '...' : ''
    )
  }
  
  return NextResponse.json(mobileOptimizedData, {
    status: response.status,
    headers: {
      ...response.headers,
      'X-Mobile-Optimized': 'true',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Encoding': 'gzip'
    }
  })
}

/**
 * Sets mobile-specific headers for better performance
 */
export function setMobileHeaders(response) {
  const headers = new Headers(response.headers)
  
  // Mobile-specific caching
  headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600')
  
  // Enable compression
  headers.set('Content-Encoding', 'gzip')
  
  // Optimize for mobile networks
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Mobile-Optimized', 'true')
  
  // Resource hints for mobile
  headers.set('Link', '</api/analyze-process>; rel=preload; as=fetch')
  
  return NextResponse.next({
    request: response.request,
    headers
  })
}

/**
 * Mobile-specific rate limiting (more lenient for mobile)
 */
export class MobileRateLimiter {
  constructor() {
    this.requests = new Map()
    this.windowMs = 60000 // 1 minute window
    this.mobileLimit = 30 // 30 requests per minute for mobile
    this.desktopLimit = 20 // 20 requests per minute for desktop
  }
  
  isRateLimited(request) {
    const ip = this.getClientIP(request)
    const isMobile = isMobileRequest(request)
    const limit = isMobile ? this.mobileLimit : this.desktopLimit
    
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    // Get existing requests for this IP
    const userRequests = this.requests.get(ip) || []
    
    // Filter requests within the current window
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (recentRequests.length >= limit) {
      return true
    }
    
    // Add current request
    recentRequests.push(now)
    this.requests.set(ip, recentRequests)
    
    return false
  }
  
  getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return realIP || '127.0.0.1'
  }
}

/**
 * Compresses API responses for mobile networks
 */
export function compressResponse(data, compressionLevel = 'mobile') {
  if (!data) return data
  
  switch (compressionLevel) {
    case 'mobile':
      return {
        ...data,
        // Remove or minimize large arrays
        items: data.items?.slice(0, 10), // Limit to first 10 items
        // Compress text content
        content: data.content?.substring(0, 1000),
        // Remove non-critical fields
        analytics: undefined,
        debug: undefined
      }
    
    case 'slow-network':
      return {
        // Minimal data for very slow networks
        id: data.id,
        title: data.title,
        status: data.status,
        essential: data.essential
      }
    
    default:
      return data
  }
}

/**
 * Mobile-specific error responses
 */
export function createMobileErrorResponse(error, statusCode = 500) {
  const isMobileError = error.code === 'MOBILE_TIMEOUT' || error.code === 'SLOW_NETWORK'
  
  return NextResponse.json({
    error: {
      message: isMobileError 
        ? 'Request timeout due to network conditions. Please try again.' 
        : error.message,
      code: error.code,
      mobile: true,
      retry: isMobileError,
      retryAfter: isMobileError ? 5000 : undefined // 5 seconds
    }
  }, { 
    status: statusCode,
    headers: {
      'X-Mobile-Error': 'true',
      'Retry-After': isMobileError ? '5' : undefined
    }
  })
}

/**
 * Adaptive timeout based on network conditions
 */
export function getAdaptiveTimeout(request) {
  const isSlowNetwork = isSlowNetworkRequest(request)
  const isMobile = isMobileRequest(request)
  
  if (isSlowNetwork) {
    return 30000 // 30 seconds for slow networks
  } else if (isMobile) {
    return 15000 // 15 seconds for mobile
  } else {
    return 10000 // 10 seconds for desktop
  }
}

// Initialize rate limiter
const rateLimiter = new MobileRateLimiter()

/**
 * Main mobile optimization middleware function
 */
export function mobileOptimizationMiddleware(request) {
  const isMobile = isMobileRequest(request)
  const isSlowNetwork = isSlowNetworkRequest(request)
  
  // Check rate limiting
  if (rateLimiter.isRateLimited(request)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Mobile': isMobile ? 'true' : 'false'
        }
      }
    )
  }
  
  // Set mobile-specific headers
  const response = NextResponse.next()
  
  if (isMobile) {
    response.headers.set('X-Device-Type', 'mobile')
    response.headers.set('X-Mobile-Optimized', 'true')
  }
  
  if (isSlowNetwork) {
    response.headers.set('X-Network-Type', 'slow')
    response.headers.set('X-Data-Saving', 'true')
  }
  
  return response
}

export { rateLimiter }