// Utility functions for Clerk authentication integration
const crypto = require('crypto');

/**
 * Generate a deterministic UUID from a Clerk user ID
 * This ensures the same Clerk user always gets the same UUID
 * @param {string} clerkUserId - Clerk user ID (e.g., "user_32G74SDMg15lICuFS01ctdTNgFj")
 * @returns {string} - UUID v4 format
 */
export function clerkUserIdToUUID(clerkUserId) {
  if (!clerkUserId || typeof clerkUserId !== 'string') {
    throw new Error('Invalid Clerk user ID provided');
  }

  // Create a consistent hash from the Clerk user ID
  const hash = crypto.createHash('sha256').update(clerkUserId).digest('hex');
  
  // Convert hash to UUID format (8-4-4-4-12)
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
  
  return uuid;
}

/**
 * Check if a string is a valid Clerk user ID format
 * @param {string} id - ID to check
 * @returns {boolean}
 */
export function isClerkUserId(id) {
  if (!id || typeof id !== 'string') return false;
  return id.startsWith('user_') && id.length > 10;
}

/**
 * Check if a string is a valid UUID format
 * @param {string} id - ID to check
 * @returns {boolean}
 */
export function isUUID(id) {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Get appropriate user ID for database operations
 * Converts Clerk user ID to UUID format if needed
 * @param {string} userId - Either Clerk user ID or existing UUID
 * @returns {string} - UUID format suitable for database
 */
export function getDBUserId(userId) {
  if (!userId) return null;
  
  if (isUUID(userId)) {
    return userId; // Already in UUID format
  }
  
  if (isClerkUserId(userId)) {
    return clerkUserIdToUUID(userId); // Convert Clerk ID to UUID
  }
  
  throw new Error(`Invalid user ID format: ${userId}`);
}