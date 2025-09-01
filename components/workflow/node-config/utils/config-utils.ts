import { getTypedParameterValue, getSafeDescription, getSafePlaceholder, getSafeDefaultValue } from '@/lib/type-safe-utils'
import { getValueAtPath } from './parameter-utils'

/**
 * Safely get parameter value with type checking
 */
export function getParamValue(
  config: Record<string, unknown>,
  path: string,
  paramType: 'string' | 'number' | 'boolean',
  defaultVal?: unknown
): string | number | boolean {
  try {
    if (paramType === 'string') {
      return getTypedParameterValue(config, path, defaultVal, 'string')
    } else if (paramType === 'number') {
      return getTypedParameterValue(config, path, defaultVal, 'number')
    } else {
      return getTypedParameterValue(config, path, defaultVal, 'boolean')
    }
  } catch {
    // Fallback for type safety
    switch (paramType) {
      case 'string':
        return ''
      case 'number':
        return 0
      case 'boolean':
        return false
      default:
        return ''
    }
  }
}

/**
 * Get safe description for parameter
 */
export function getParameterDescription(description: unknown): string {
  return getSafeDescription(description)
}

/**
 * Get safe placeholder for parameter
 */
export function getParameterPlaceholder(placeholder: unknown): string | undefined {
  return getSafePlaceholder(placeholder)
}

/**
 * Get safe default value for parameter
 */
export function getParameterDefault(defaultVal: unknown, expectedType: 'string'): string
export function getParameterDefault(defaultVal: unknown, expectedType: 'number'): number
export function getParameterDefault(defaultVal: unknown, expectedType: 'boolean'): boolean
export function getParameterDefault(defaultVal: unknown, expectedType: 'object'): Record<string, unknown>
export function getParameterDefault(defaultVal: unknown, expectedType: string): unknown {
  // Use a switch statement to handle each type individually to satisfy TypeScript overloads
  switch (expectedType) {
    case 'string':
      return getSafeDefaultValue(defaultVal, 'string')
    case 'number':
      return getSafeDefaultValue(defaultVal, 'number')
    case 'boolean':
      return getSafeDefaultValue(defaultVal, 'boolean')
    case 'object':
      return getSafeDefaultValue(defaultVal, 'object')
    case 'array':
      return getSafeDefaultValue(defaultVal, 'array')
    default:
      // For any other type, fall back to string
      return getSafeDefaultValue(defaultVal, 'string')
  }
}

/**
 * Get array value safely
 */
export function getArrayValue<T>(config: Record<string, unknown>, path: string, defaultValue: T[]): T[] {
  const value = getValueAtPath(config, path)
  return Array.isArray(value) ? value as T[] : defaultValue
}

/**
 * Get object value safely
 */
export function getObjectValue<T>(config: Record<string, unknown>, path: string, defaultValue: T): T {
  const value = getValueAtPath(config, path)
  return (value && typeof value === 'object' && !Array.isArray(value)) ? value as T : defaultValue
}


