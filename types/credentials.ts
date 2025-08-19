/**
 * Credential type constants and type definitions
 * Single source of truth for all credential-related types
 */

// Define the credential types as a const assertion for literal types
export const CREDENTIAL_TYPES = ['database', 'api', 'email', 'generic'] as const

// Extract the union type from the const array
export type CredentialType = typeof CREDENTIAL_TYPES[number]

/**
 * Type guard to check if a value is a valid credential type
 * @param value - The value to check
 * @returns True if the value is a valid credential type
 */
export function isValidCredentialType(value: unknown): value is CredentialType {
  return typeof value === 'string' && (CREDENTIAL_TYPES as readonly string[]).includes(value)
}

/**
 * Safely convert a string to a credential type with fallback
 * @param value - The value to convert
 * @param fallback - The fallback value if conversion fails (defaults to 'generic')
 * @returns A valid credential type
 */
export function toCredentialType(value: unknown, fallback: CredentialType = 'generic'): CredentialType {
  return isValidCredentialType(value) ? value : fallback
}
