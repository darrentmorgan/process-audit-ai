// CSRF protection utilities
import { randomBytes } from 'crypto';
import { getCookie, setCookie } from 'cookies-next';

/**
 * Generate a CSRF token
 * @returns {string} CSRF token
 */
export function generateCSRFToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Set CSRF token in cookie
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {string} Generated token
 */
export function setCSRFToken(req, res) {
  const token = generateCSRFToken();
  
  setCookie('csrf-token', token, {
    req,
    res,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  });
  
  return token;
}

/**
 * Get CSRF token from cookie
 * @param {Object} req - Request object
 * @returns {string|null} CSRF token
 */
export function getCSRFToken(req) {
  return getCookie('csrf-token', { req }) || null;
}

/**
 * Validate CSRF token
 * @param {Object} req - Request object
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateCSRF(req) {
  // Skip CSRF check for GET requests
  if (req.method === 'GET') {
    return true;
  }
  
  const cookieToken = getCSRFToken(req);
  const headerToken = req.headers['x-csrf-token'];
  const bodyToken = req.body?._csrf;
  
  // Check if token exists
  if (!cookieToken) {
    throw new Error('CSRF token not found in cookie');
  }
  
  // Check if token is provided in request
  const requestToken = headerToken || bodyToken;
  if (!requestToken) {
    throw new Error('CSRF token not found in request');
  }
  
  // Validate tokens match
  if (cookieToken !== requestToken) {
    throw new Error('Invalid CSRF token');
  }
  
  return true;
}

/**
 * CSRF middleware for API routes
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler
 */
export function withCSRF(handler) {
  return async (req, res) => {
    try {
      // Set CSRF token if not exists
      if (!getCSRFToken(req)) {
        setCSRFToken(req, res);
      }
      
      // Validate CSRF for state-changing methods
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        validateCSRF(req);
      }
      
      return handler(req, res);
    } catch (error) {
      if (error.message.includes('CSRF')) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
      throw error;
    }
  };
}

/**
 * Client-side helper to get CSRF token for requests
 * @returns {string|null} CSRF token
 */
export function getClientCSRFToken() {
  if (typeof window === 'undefined') return null;
  
  // Try to get from meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }
  
  // Fallback to cookie (if accessible)
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Add CSRF token to fetch headers
 * @param {Object} headers - Existing headers
 * @returns {Object} Headers with CSRF token
 */
export function addCSRFHeader(headers = {}) {
  const token = getClientCSRFToken();
  if (token) {
    headers['X-CSRF-Token'] = token;
  }
  return headers;
}