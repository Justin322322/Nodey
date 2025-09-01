import type { CredentialType } from '@/types/credentials'

// Extended parameter definition interface
export interface ExtendedParameterDefinition {
  type: string
  label: string
  path?: string
  name?: string
  default?: unknown
  description?: unknown
  placeholder?: unknown
  options?: Array<{ label: string; value: string }> | (() => Array<{ label: string; value: string }>)
  showIf?: Array<{ path?: string; name?: string; equals: string | number | boolean }>
  credentialType?: CredentialType
}

/**
 * Type guard function to check if parameter has required properties
 */
export function isValidParameter(param: unknown): param is ExtendedParameterDefinition {
  if (!param || typeof param !== 'object') return false
  const p = param as Record<string, unknown>
  return typeof p.type === 'string' &&
         typeof p.label === 'string' &&
         (typeof p.path === 'string' || typeof p.name === 'string')
}

/**
 * Helper function to get parameter path (supports both 'path' and 'name' properties)
 */
export function getParamPath(param: ExtendedParameterDefinition): string {
  return param.path || param.name || ''
}

/**
 * Type guard for condition structure
 */
export function isValidCondition(c: unknown): c is { path?: string; name?: string; equals: string | number | boolean } {
  if (!c || typeof c !== 'object') return false
  const condition = c as Record<string, unknown>

  // Must have either path or name (but not both) as strings
  const hasPath = typeof condition.path === 'string'
  const hasName = typeof condition.name === 'string'
  const hasEquals = condition.equals !== undefined

  return (hasPath || hasName) && hasEquals && !(hasPath && hasName)
}

/**
 * Check if a parameter should be shown based on showIf conditions
 */
export function shouldShowParameter(
  param: ExtendedParameterDefinition,
  config: Record<string, unknown>
): boolean {
  // Check if showIf exists and is an array
  if (!Array.isArray(param.showIf) || param.showIf.length === 0) {
    return true
  }

  // Check if any condition matches
  return param.showIf.some((cond) => {
    if (!isValidCondition(cond)) {
      return false
    }

    // Extract the path or name safely
    const pathToCheck = cond.path || cond.name || ''
    if (!pathToCheck) {
      return false
    }

    // Get the value from config using the path
    const value = getValueAtPath(config, pathToCheck)
    return value === cond.equals
  })
}

/**
 * Get value at a specific path in an object
 */
export function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current && typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return current
}
