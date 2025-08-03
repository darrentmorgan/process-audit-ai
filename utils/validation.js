// Input validation and sanitization utilities
import validator from 'validator';

/**
 * Sanitize and validate various input types
 */
export const sanitizeInput = {
  /**
   * Sanitize plain text input
   * @param {string} input - Text to sanitize
   * @returns {string} Sanitized text
   */
  text: (input) => {
    if (typeof input !== 'string') return '';
    
    // Remove any HTML tags and trim
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '') // Remove any remaining angle brackets
      .trim();
  },
  
  /**
   * Validate and normalize email
   * @param {string} email - Email to validate
   * @returns {string} Normalized email
   * @throws {Error} If email is invalid
   */
  email: (email) => {
    if (typeof email !== 'string' || !email) {
      throw new Error('Email is required');
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!validator.isEmail(trimmedEmail)) {
      throw new Error('Invalid email format');
    }
    
    // Additional email validation
    if (trimmedEmail.length > 254) { // RFC 5321
      throw new Error('Email address too long');
    }
    
    return trimmedEmail;
  },
  
  /**
   * Sanitize process description with limited HTML
   * @param {string} text - Process description
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized description
   */
  processDescription: (text, maxLength = 10000) => {
    if (typeof text !== 'string') return '';
    
    // Remove dangerous content while preserving basic formatting
    let sanitized = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
    
    if (sanitized.length > maxLength) {
      throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
    }
    
    return sanitized;
  },
  
  /**
   * Sanitize file name
   * @param {string} name - File name to sanitize
   * @returns {string} Sanitized file name
   */
  fileName: (name) => {
    if (typeof name !== 'string') return '';
    
    // Remove path traversal attempts and dangerous characters
    return name
      .replace(/[\/\\]/g, '') // Remove slashes
      .replace(/\.\./g, '') // Remove double dots
      .replace(/[^\w\s.-]/g, '') // Keep only safe characters
      .trim()
      .substring(0, 255); // Limit length
  },
  
  /**
   * Validate and sanitize JSON data
   * @param {any} data - Data to validate
   * @param {Object} schema - Expected schema
   * @returns {Object} Validated data
   */
  jsonData: (data, schema = {}) => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid data format');
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(schema)) {
      if (value.required && !(key in data)) {
        throw new Error(`Missing required field: ${key}`);
      }
      
      if (key in data) {
        const fieldValue = data[key];
        
        switch (value.type) {
          case 'string':
            sanitized[key] = sanitizeInput.text(fieldValue);
            if (value.maxLength && sanitized[key].length > value.maxLength) {
              throw new Error(`${key} exceeds maximum length`);
            }
            break;
            
          case 'number':
            const num = Number(fieldValue);
            if (isNaN(num)) {
              throw new Error(`${key} must be a number`);
            }
            if (value.min !== undefined && num < value.min) {
              throw new Error(`${key} must be at least ${value.min}`);
            }
            if (value.max !== undefined && num > value.max) {
              throw new Error(`${key} must be at most ${value.max}`);
            }
            sanitized[key] = num;
            break;
            
          case 'boolean':
            sanitized[key] = Boolean(fieldValue);
            break;
            
          case 'array':
            if (!Array.isArray(fieldValue)) {
              throw new Error(`${key} must be an array`);
            }
            sanitized[key] = fieldValue.map(item => 
              typeof item === 'string' ? sanitizeInput.text(item) : item
            );
            break;
            
          case 'object':
            if (typeof fieldValue !== 'object' || fieldValue === null) {
              throw new Error(`${key} must be an object`);
            }
            sanitized[key] = sanitizeInput.jsonData(fieldValue, value.schema || {});
            break;
            
          default:
            sanitized[key] = fieldValue;
        }
      }
    }
    
    return sanitized;
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate API request body
 * @param {Object} body - Request body
 * @param {Object} schema - Expected schema
 * @returns {Object} Validated body
 * @throws {Error} If validation fails
 */
export function validateRequestBody(body, schema) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  
  return sanitizeInput.jsonData(body, schema);
}