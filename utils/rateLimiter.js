// Rate limiting utility for API endpoints
import { LRUCache } from 'lru-cache';

// Create a map to store different rate limiters
const rateLimiters = new Map();

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.uniqueTokenPerInterval - Max number of unique tokens
 * @param {number} options.interval - Time window in milliseconds
 * @param {number} options.maxRequests - Max requests per interval
 * @returns {Function} Middleware function
 */
export function rateLimit(options = {}) {
  const {
    uniqueTokenPerInterval = 500,
    interval = 60 * 1000, // 1 minute default
    maxRequests = 10
  } = options;

  // Create or get existing cache for this limiter
  const key = `${interval}-${maxRequests}`;
  
  if (!rateLimiters.has(key)) {
    const tokenCache = new LRUCache({
      max: uniqueTokenPerInterval,
      ttl: interval,
    });
    rateLimiters.set(key, tokenCache);
  }
  
  const tokenCache = rateLimiters.get(key);

  return async (req, res) => {
    try {
      // Get client IP address
      const forwarded = req.headers['x-forwarded-for'];
      const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
      const token = ip || 'anonymous';
      
      // Get current request count
      const tokenCount = tokenCache.get(token) || 0;
      
      // Check if limit exceeded
      if (tokenCount >= maxRequests) {
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + interval).toISOString());
        
        res.status(429).json({ 
          error: 'Too many requests, please try again later.',
          retryAfter: interval / 1000 // seconds
        });
        return false;
      }
      
      // Increment counter
      tokenCache.set(token, tokenCount + 1);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - tokenCount - 1);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + interval).toISOString());
      
      return true;
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Allow request on error to prevent blocking legitimate users
      return true;
    }
  };
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // Strict limit for auth endpoints
  auth: rateLimit({ maxRequests: 5, interval: 15 * 60 * 1000 }), // 5 requests per 15 minutes
  
  // Standard API limit
  api: rateLimit({ maxRequests: 30, interval: 60 * 1000 }), // 30 requests per minute
  
  // Relaxed limit for read operations
  read: rateLimit({ maxRequests: 100, interval: 60 * 1000 }), // 100 requests per minute
  
  // Strict limit for file uploads
  upload: rateLimit({ maxRequests: 10, interval: 10 * 60 * 1000 }), // 10 uploads per 10 minutes
  
  // Very strict limit for expensive operations
  expensive: rateLimit({ maxRequests: 5, interval: 5 * 60 * 1000 }) // 5 requests per 5 minutes
};