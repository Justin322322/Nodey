/**
 * Security utilities for credential encryption and protection
 */

import CryptoJS from 'crypto-js'

/**
 * Generate a device-specific encryption key
 * This creates a unique key per browser/device for credential encryption
 */
function generateDeviceKey(): string {
  // Try to get existing device key from sessionStorage first
  const existingKey = sessionStorage.getItem('deviceKey')
  if (existingKey) {
    return existingKey
  }

  // Create device fingerprint from available browser properties
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    // Add some randomness that persists for the session
    crypto.randomUUID()
  ].join('|')

  // Generate a key from the fingerprint
  const deviceKey = CryptoJS.SHA256(fingerprint).toString()
  
  // Store in sessionStorage (cleared when browser closes)
  sessionStorage.setItem('deviceKey', deviceKey)
  
  return deviceKey
}

/**
 * Encrypt sensitive credential data
 */
export function encryptCredential(value: string): string {
  if (!value || value.trim().length === 0) {
    return value
  }
  
  try {
    const deviceKey = generateDeviceKey()
    const encrypted = CryptoJS.AES.encrypt(value, deviceKey).toString()
    return encrypted
  } catch (error) {
    console.warn('Failed to encrypt credential:', error)
    return value // Fallback to unencrypted if encryption fails
  }
}

/**
 * Decrypt sensitive credential data
 */
export function decryptCredential(encryptedValue: string): string {
  if (!encryptedValue || encryptedValue.trim().length === 0) {
    return encryptedValue
  }

  // Check if value looks encrypted (base64 format from CryptoJS)
  if (!encryptedValue.includes('/') && !encryptedValue.includes('+') && !encryptedValue.includes('=')) {
    // Likely plaintext, return as-is for backward compatibility
    return encryptedValue
  }
  
  try {
    const deviceKey = generateDeviceKey()
    const decrypted = CryptoJS.AES.decrypt(encryptedValue, deviceKey)
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!plaintext) {
      console.warn('Failed to decrypt credential - invalid key or corrupted data')
      return encryptedValue // Return encrypted value if decryption fails
    }
    
    return plaintext
  } catch (error) {
    console.warn('Failed to decrypt credential:', error)
    return encryptedValue // Fallback to encrypted value if decryption fails
  }
}

/**
 * Encrypt database node configuration
 */
export function encryptDatabaseConfig(config: Record<string, unknown>): Record<string, unknown> {
  // For database nodes, we don't need to encrypt here since credentialId is just a reference
  // The actual connection string is encrypted in the credential store
  // However, trigger migration for legacy connectionString if present
  if (config.connectionString && typeof config.connectionString === 'string' && !config.credentialId) {
    console.warn('Found legacy connectionString in database config. Migration should be handled at the workflow level.');
  }
  return config;
}

/**
 * Decrypt database node configuration
 */
export function decryptDatabaseConfig(config: Record<string, unknown>): Record<string, unknown> {
  // For database nodes, we don't need to decrypt here since credentialId is just a reference
  // The actual connection string is decrypted in the service when needed
  return config;
}

/**
 * Encrypt email service configuration
 */
export function encryptEmailConfig(config: Record<string, unknown>): Record<string, unknown> {
  if (!config.emailService) {
    return config
  }

  const emailService = config.emailService as Record<string, unknown>
  const encryptedEmailService = { ...emailService }

  // Encrypt password/app password
  if (emailService.auth && typeof emailService.auth === 'object') {
    const auth = emailService.auth as Record<string, unknown>
    encryptedEmailService.auth = {
      ...auth,
      pass: auth.pass ? encryptCredential(auth.pass as string) : auth.pass
    }
  }

  // Encrypt API key
  if (emailService.apiKey) {
    encryptedEmailService.apiKey = encryptCredential(emailService.apiKey as string)
  }

  return {
    ...config,
    emailService: encryptedEmailService
  }
}

/**
 * Decrypt email service configuration
 */
export function decryptEmailConfig(config: Record<string, unknown>): Record<string, unknown> {
  if (!config.emailService) {
    return config
  }

  const emailService = config.emailService as Record<string, unknown>
  const decryptedEmailService = { ...emailService }

  // Decrypt password/app password
  if (emailService.auth && typeof emailService.auth === 'object') {
    const auth = emailService.auth as Record<string, unknown>
    decryptedEmailService.auth = {
      ...auth,
      pass: auth.pass ? decryptCredential(auth.pass as string) : auth.pass
    }
  }

  // Decrypt API key
  if (emailService.apiKey) {
    decryptedEmailService.apiKey = decryptCredential(emailService.apiKey as string)
  }

  return {
    ...config,
    emailService: decryptedEmailService
  }
}

/**
 * Clear sensitive data from memory
 */
export function clearSensitiveData(): void {
  // Clear password input fields
  const passwordFields = document.querySelectorAll('input[type="password"]')
  passwordFields.forEach((field) => {
    if (field instanceof HTMLInputElement) {
      field.value = ''
    }
  })

  // Clear any sensitive data from forms
  const sensitiveSelectors = [
    'input[name*="pass"]',
    'input[name*="password"]', 
    'input[name*="secret"]',
    'input[name*="key"]',
    'input[name*="apiKey"]'
  ]

  sensitiveSelectors.forEach(selector => {
    const fields = document.querySelectorAll(selector)
    fields.forEach((field) => {
      if (field instanceof HTMLInputElement) {
        field.value = ''
      }
    })
  })
}

/**
 * Validate if a string looks like an encrypted credential
 */
export function isEncrypted(value: string): boolean {
  if (!value || value.length < 10) return false
  
  // CryptoJS AES encrypted values are base64 and contain these characters
  return /^[A-Za-z0-9+/]+=*$/.test(value) && 
         (value.includes('/') || value.includes('+') || value.includes('='))
}

/**
 * Get security status for UI display
 */
export function getSecurityStatus(): {
  encrypted: boolean
  sessionBased: boolean
  deviceKey: boolean
} {
  return {
    encrypted: !!sessionStorage.getItem('deviceKey'),
    sessionBased: true, // Using sessionStorage
    deviceKey: !!sessionStorage.getItem('deviceKey')
  }
}

/**
 * Security warning messages for users
 */
export const SECURITY_WARNINGS = {
  CREDENTIAL_STORAGE: 'Credentials are encrypted and stored locally on your device only. They are not sent to any external servers.',
  APP_PASSWORD: 'For security, use app-specific passwords instead of your main email password.',
  TRUSTED_DEVICE: 'Only use this feature on trusted devices. Credentials are cleared when you close the browser.',
  DATA_PROTECTION: 'Your credentials are encrypted with a device-specific key and automatically cleared when the browser session ends.'
} as const
