/**
 * Type-safe utility functions for accessing object values by path
 * Replaces unsafe getValueAtPath usage throughout the codebase
 */

/**
 * Type guard to check if a value is a valid object
 */
function isValidObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Generic type-safe path getter with fallback support
 */
export function getValueAtPath<T = unknown>(
  obj: Record<string, unknown> | undefined,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!obj || !isValidObject(obj)) {
    return defaultValue
  }

  try {
    const result = path.split('.').reduce((acc: unknown, part: string) => {
      if (isValidObject(acc)) {
        return acc[part]
      }
      return undefined
    }, obj)

    return result !== undefined ? (result as T) : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Type-safe string value getter
 */
export function getStringValue(
  obj: Record<string, unknown> | undefined,
  path: string,
  defaultValue = ''
): string {
  const value = getValueAtPath(obj, path, defaultValue)
  return typeof value === 'string' ? value : defaultValue
}

/**
 * Type-safe boolean value getter
 */
export function getBooleanValue(
  obj: Record<string, unknown> | undefined,
  path: string,
  defaultValue = false
): boolean {
  const value = getValueAtPath(obj, path, defaultValue)
  return typeof value === 'boolean' ? value : defaultValue
}

/**
 * Type-safe number value getter
 */
export function getNumberValue(
  obj: Record<string, unknown> | undefined,
  path: string,
  defaultValue = 0
): number {
  const value = getValueAtPath(obj, path, defaultValue)
  return typeof value === 'number' ? value : defaultValue
}

/**
 * Type-safe array value getter
 */
export function getArrayValue<T = unknown>(
  obj: Record<string, unknown> | undefined,
  path: string,
  defaultValue: T[] = []
): T[] {
  const value = getValueAtPath(obj, path, defaultValue)
  return Array.isArray(value) ? value : defaultValue
}

/**
 * Type-safe object value getter
 */
export function getObjectValue<T extends Record<string, unknown> = Record<string, unknown>>(
  obj: Record<string, unknown> | undefined,
  path: string,
  defaultValue: T = {} as T
): T {
  const value = getValueAtPath(obj, path, defaultValue)
  return isValidObject(value) ? (value as T) : defaultValue
}

/**
 * Type-safe string value getter with validation for non-empty strings
 */
export function getNonEmptyStringValue(
  obj: Record<string, unknown> | undefined,
  path: string,
  defaultValue = ''
): string {
  const value = getStringValue(obj, path, defaultValue)
  return value.trim() || defaultValue
}

/**
 * Type-safe value checker for conditional rendering
 */
export function hasValueAtPath(
  obj: Record<string, unknown> | undefined,
  path: string
): boolean {
  const value = getValueAtPath(obj, path)
  return value !== undefined && value !== null
}

/**
 * Type-safe equality checker for path values
 */
export function pathValueEquals(
  obj: Record<string, unknown> | undefined,
  path: string,
  expectedValue: unknown
): boolean {
  const value = getValueAtPath(obj, path)
  return value === expectedValue
}

/**
 * Safe default value getter with type checking - always returns the expected type
 */
export function getSafeDefaultValue(
  defaultValue: unknown,
  type: 'string'
): string
export function getSafeDefaultValue(
  defaultValue: unknown,
  type: 'number'
): number
export function getSafeDefaultValue(
  defaultValue: unknown,
  type: 'boolean'
): boolean
export function getSafeDefaultValue<T extends Record<string, unknown>>(
  defaultValue: unknown,
  type: 'object'
): T
export function getSafeDefaultValue<T extends unknown[]>(
  defaultValue: unknown,
  type: 'array'
): T
export function getSafeDefaultValue(
  defaultValue: unknown,
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
): string | number | boolean | Record<string, unknown> | unknown[] {
  switch (type) {
    case 'string':
      return typeof defaultValue === 'string' ? defaultValue : ''
    case 'number':
      return typeof defaultValue === 'number' ? defaultValue : 0
    case 'boolean':
      return typeof defaultValue === 'boolean' ? defaultValue : false
    case 'object':
      return defaultValue !== null && typeof defaultValue === 'object' && !Array.isArray(defaultValue) 
        ? defaultValue as Record<string, unknown>
        : {}
    case 'array':
      return Array.isArray(defaultValue) ? defaultValue as unknown[] : []
    default:
      return ''
  }
}

/**
 * Safe parameter description getter
 */
export function getSafeDescription(description: unknown): string {
  return typeof description === 'string' ? description : ''
}

/**
 * Safe parameter placeholder getter
 */
export function getSafePlaceholder(placeholder: unknown): string {
  return typeof placeholder === 'string' ? placeholder : ''
}

/**
 * Comprehensive type-safe parameter value getter
 */
export function getTypedParameterValue<T = string>(
  config: Record<string, unknown> | undefined,
  path: string,
  paramDefault: unknown,
  type: 'string'
): string
export function getTypedParameterValue<T = number>(
  config: Record<string, unknown> | undefined,
  path: string,
  paramDefault: unknown,
  type: 'number'
): number
export function getTypedParameterValue<T = boolean>(
  config: Record<string, unknown> | undefined,
  path: string,
  paramDefault: unknown,
  type: 'boolean'
): boolean
export function getTypedParameterValue(
  config: Record<string, unknown> | undefined,
  path: string,
  paramDefault: unknown,
  type: 'string' | 'number' | 'boolean'
): string | number | boolean {
  // Get value from config path
  const configValue = getValueAtPath(config, path)
  
  // If config has a value of the expected type, use it
  if (type === 'string' && typeof configValue === 'string') {
    return configValue
  }
  if (type === 'number' && typeof configValue === 'number') {
    return configValue
  }
  if (type === 'boolean' && typeof configValue === 'boolean') {
    return configValue
  }
  
  // Fall back to param default if it's the right type
  if (type === 'string' && typeof paramDefault === 'string') {
    return paramDefault
  }
  if (type === 'number' && typeof paramDefault === 'number') {
    return paramDefault
  }
  if (type === 'boolean' && typeof paramDefault === 'boolean') {
    return paramDefault
  }
  
  // Final fallback to type defaults
  switch (type) {
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
