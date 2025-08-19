/**
 * Shared workflow ID validation utilities
 * This module provides consistent validation across the application
 */

/**
 * Browser-compatible regex pattern for workflow ID validation
 * - Must start and end with alphanumeric character
 * - Can contain alphanumeric, dash, or underscore in the middle
 * - No consecutive special characters (-- __ -_ _-)
 * - Uses negative lookaheads instead of lookbehind for browser compatibility
 */
export const workflowIdPattern = /^(?!.*[_-]{2})(?![_-])(?!.*[_-]$)[a-zA-Z0-9_-]+$/

/**
 * Reserved names that are not allowed as workflow IDs
 * These are case-insensitive and include common system paths and keywords
 */
export const reservedWorkflowNames = new Set([
  'api', 'app', 'www', 'admin', 'root', 'test', 'demo', 'config', 'settings',
  'system', 'public', 'private', 'static', 'assets', 'lib', 'src', 'node_modules',
  'null', 'undefined', 'true', 'false', 'new', 'delete', 'edit', 'create'
])

/**
 * Validates and sanitizes a workflowId parameter
 * @param workflowId - The workflowId to validate
 * @returns A safe workflowId string or '<workflowId>' fallback
 */
export function validateWorkflowId(workflowId: string | null): string {
  if (!workflowId) {
    return '<workflowId>'
  }
  
  // Trim whitespace from input
  const trimmed = workflowId.trim()
  
  // Check if empty after trimming
  if (!trimmed) {
    return '<workflowId>'
  }
  
  // Check length constraints (min 3, max 64 characters)
  if (trimmed.length < 3 || trimmed.length > 64) {
    return '<workflowId>'
  }
  
  // Check for reserved names (case-insensitive)
  if (reservedWorkflowNames.has(trimmed.toLowerCase())) {
    return '<workflowId>'
  }
  
  if (!workflowIdPattern.test(trimmed)) {
    return '<workflowId>'
  }
  
  return trimmed
}

/**
 * Simple boolean validation function that returns true/false
 * @param input - The string to validate
 * @returns true if valid, false otherwise
 */
export function isValidWorkflowId(input: string): boolean {
  const result = validateWorkflowId(input)
  return result !== '<workflowId>'
}
