/**
 * Secure credential store for managing database connection strings and other secrets
 */

import { encryptCredential, decryptCredential } from './security'
import { CredentialType } from '@/types/credentials'

export interface StoredCredential {
  id: string
  name: string
  type: CredentialType
  description?: string
  encryptedValue: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown>
}

export interface CredentialReference {
  credentialId: string
  type: CredentialType
}

class CredentialStore {
  private storageKey = 'credentialStore'
  
  /**
   * Get all stored credentials (metadata only, not the actual values)
   */
  getAllCredentials(): Omit<StoredCredential, 'encryptedValue'>[] {
    try {
      const stored = sessionStorage.getItem(this.storageKey)
      if (!stored) return []
      
      const credentials: StoredCredential[] = JSON.parse(stored) as StoredCredential[]
      return credentials.map(({ encryptedValue, ...rest }) => ({
        ...rest,
        createdAt: new Date(rest.createdAt),
        updatedAt: new Date(rest.updatedAt)
      }))
    } catch (error) {
      console.error('Failed to retrieve credentials:', error)
      return []
    }
  }
  
  /**
   * Get a specific credential by ID
   */
  getCredential(id: string): StoredCredential | null {
    try {
      const stored = sessionStorage.getItem(this.storageKey)
      if (!stored) return null
      
      const credentials: StoredCredential[] = JSON.parse(stored) as StoredCredential[]
      const credential = credentials.find(c => c.id === id)
      
      if (!credential) return null
      
      return {
        ...credential,
        createdAt: new Date(credential.createdAt),
        updatedAt: new Date(credential.updatedAt)
      }
    } catch (error) {
      console.error('Failed to retrieve credential:', error)
      return null
    }
  }
  
  /**
   * Get the decrypted value of a credential
   */
  getCredentialValue(id: string): string | null {
    const credential = this.getCredential(id)
    if (!credential) return null
    
    try {
      return decryptCredential(credential.encryptedValue)
    } catch (error) {
      console.error('Failed to decrypt credential:', error)
      return null
    }
  }
  
  /**
   * Store a new credential
   */
  storeCredential(
    name: string,
    value: string,
    type: StoredCredential['type'],
    description?: string,
    metadata?: Record<string, unknown>
  ): string {
    try {
      const encryptedValue = encryptCredential(value)
      const id = `cred_${crypto.randomUUID()}`
      const now = new Date()
      
      const newCredential: StoredCredential = {
        id,
        name,
        type,
        description,
        encryptedValue,
        createdAt: now,
        updatedAt: now,
        metadata
      }
      
      const existing = this.getAllCredentialsWithValues()
      existing.push(newCredential)
      
      sessionStorage.setItem(this.storageKey, JSON.stringify(existing))
      return id
    } catch (error) {
      console.error('Failed to store credential:', error)
      throw new Error('Failed to store credential')
    }
  }
  
  /**
   * Update an existing credential
   */
  updateCredential(
    id: string,
    updates: Partial<Pick<StoredCredential, 'name' | 'description' | 'metadata'>>
  ): boolean {
    try {
      const credentials = this.getAllCredentialsWithValues()
      const index = credentials.findIndex(c => c.id === id)
      
      if (index === -1) return false
      
      credentials[index] = {
        ...credentials[index],
        ...updates,
        updatedAt: new Date()
      }
      
      sessionStorage.setItem(this.storageKey, JSON.stringify(credentials))
      return true
    } catch (error) {
      console.error('Failed to update credential:', error)
      return false
    }
  }
  
  /**
   * Update credential value (re-encrypt)
   */
  updateCredentialValue(id: string, newValue: string): boolean {
    try {
      const credentials = this.getAllCredentialsWithValues()
      const index = credentials.findIndex(c => c.id === id)
      
      if (index === -1) return false
      
      credentials[index] = {
        ...credentials[index],
        encryptedValue: encryptCredential(newValue),
        updatedAt: new Date()
      }
      
      sessionStorage.setItem(this.storageKey, JSON.stringify(credentials))
      return true
    } catch (error) {
      console.error('Failed to update credential value:', error)
      return false
    }
  }
  
  /**
   * Delete a credential
   */
  deleteCredential(id: string): boolean {
    try {
      const credentials = this.getAllCredentialsWithValues()
      const filtered = credentials.filter(c => c.id !== id)
      
      if (filtered.length === credentials.length) return false // Not found
      
      sessionStorage.setItem(this.storageKey, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Failed to delete credential:', error)
      return false
    }
  }
  
  /**
   * Validate credential ID format
   */
  isValidCredentialId(id: string): boolean {
    return /^cred_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  }
  
  /**
   * Check if credential exists
   */
  credentialExists(id: string): boolean {
    return this.getCredential(id) !== null
  }
  
  /**
   * Get credentials by type
   */
  getCredentialsByType(type: StoredCredential['type']): Omit<StoredCredential, 'encryptedValue'>[] {
    return this.getAllCredentials().filter(c => c.type === type)
  }
  
  /**
   * Clear all credentials (for cleanup)
   */
  clearAllCredentials(): void {
    sessionStorage.removeItem(this.storageKey)
  }
  
  /**
   * Private helper to get all credentials with encrypted values
   */
  private getAllCredentialsWithValues(): StoredCredential[] {
    try {
      const stored = sessionStorage.getItem(this.storageKey)
      if (!stored) return []
      
      const credentials: StoredCredential[] = JSON.parse(stored) as StoredCredential[]
      return credentials.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }))
    } catch (error) {
      console.error('Failed to retrieve credentials:', error)
      return []
    }
  }
}

// Export singleton instance
export const credentialStore = new CredentialStore()

/**
 * Migration utility to convert plain connection strings to credential references
 */
export function migrateConnectionStringToCredential(
  connectionString: string,
  name?: string
): string {
  if (!connectionString || connectionString.trim().length === 0) {
    throw new Error('Connection string is required')
  }
  
  // Check if it's already a credential reference
  if (credentialStore.isValidCredentialId(connectionString)) {
    return connectionString
  }
  
  // Create a new credential
  const credentialName = name || `Database Connection ${new Date().toISOString()}`
  const credentialId = credentialStore.storeCredential(
    credentialName,
    connectionString,
    'database',
    'Migrated from plain connection string'
  )
  
  return credentialId
}

/**
 * Utility to get connection string from credential reference
 */
export function resolveConnectionString(credentialIdOrPlainString: string): string | null {
  if (!credentialIdOrPlainString || credentialIdOrPlainString.trim().length === 0) {
    return null
  }
  
  // Check if it's a credential reference
  if (credentialStore.isValidCredentialId(credentialIdOrPlainString)) {
    return credentialStore.getCredentialValue(credentialIdOrPlainString)
  }
  
  // Return as-is for backward compatibility (will be migrated on next save)
  return credentialIdOrPlainString
}
