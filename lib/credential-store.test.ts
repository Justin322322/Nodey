import { describe, it, expect, beforeEach, vi } from 'vitest'
import { credentialStore, migrateConnectionStringToCredential, resolveConnectionString } from './credential-store'

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// Mock the security module
vi.mock('./security', () => ({
  encryptCredential: vi.fn((value: string) => `encrypted_${value}`),
  decryptCredential: vi.fn((value: string) => value.replace('encrypted_', '')),
  isEncrypted: vi.fn((value: string) => value.startsWith('encrypted_'))
}))

// Set up sessionStorage mock
Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
})

describe('credential-store', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    credentialStore.clearAllCredentials()
    vi.clearAllMocks()
  })

  describe('migrateConnectionStringToCredential', () => {
    it('should throw error for empty connection string', () => {
      expect(() => migrateConnectionStringToCredential('')).toThrow('Connection string is required')
    })

    it('should throw error for whitespace-only connection string', () => {
      expect(() => migrateConnectionStringToCredential('   ')).toThrow('Connection string is required')
    })

    it('should throw error for null connection string', () => {
      expect(() => migrateConnectionStringToCredential(null as unknown as string)).toThrow('Connection string is required')
    })

    it('should return credential ID if connection string is already a valid credential ID', () => {
      const existingCredentialId = 'cred_12345678-1234-1234-1234-123456789abc'
      // Mock isValidCredentialId to return true for this ID
      vi.spyOn(credentialStore, 'isValidCredentialId').mockReturnValue(true)
      
      const result = migrateConnectionStringToCredential(existingCredentialId)
      expect(result).toBe(existingCredentialId)
    })

    it('should create new credential for valid connection string', () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/db'
      const mockCredentialId = 'cred_12345678-1234-1234-1234-123456789abc'
      
      // Mock the credential store methods
      vi.spyOn(credentialStore, 'isValidCredentialId').mockReturnValue(false)
      vi.spyOn(credentialStore, 'storeCredential').mockReturnValue(mockCredentialId)
      
      const result = migrateConnectionStringToCredential(connectionString, 'Test Connection')
      
      expect(credentialStore.storeCredential).toHaveBeenCalledWith(
        'Test Connection',
        connectionString,
        'database',
        'Migrated from plain connection string'
      )
      expect(result).toBe(mockCredentialId)
    })
  })

  describe('resolveConnectionString', () => {
    it('should throw error for empty credential ID or plain string', () => {
      expect(() => resolveConnectionString('')).toThrow('Connection string is required')
    })

    it('should throw error for whitespace-only credential ID or plain string', () => {
      expect(() => resolveConnectionString('   ')).toThrow('Connection string is required')
    })

    it('should throw error for null credential ID or plain string', () => {
      expect(() => resolveConnectionString(null as unknown as string)).toThrow('Connection string is required')
    })

    it('should resolve credential value for valid credential ID', () => {
      const credentialId = 'cred_12345678-1234-1234-1234-123456789abc'
      const expectedValue = 'postgresql://user:pass@localhost:5432/db'
      
      // Mock the credential store methods
      vi.spyOn(credentialStore, 'isValidCredentialId').mockReturnValue(true)
      vi.spyOn(credentialStore, 'getCredentialValue').mockReturnValue(expectedValue)
      
      const result = resolveConnectionString(credentialId)
      
      expect(credentialStore.isValidCredentialId).toHaveBeenCalledWith(credentialId)
      expect(credentialStore.getCredentialValue).toHaveBeenCalledWith(credentialId)
      expect(result).toBe(expectedValue)
    })

    it('should return plain string as-is for backward compatibility', () => {
      const plainConnectionString = 'postgresql://user:pass@localhost:5432/db'
      
      // Mock isValidCredentialId to return false for plain string
      vi.spyOn(credentialStore, 'isValidCredentialId').mockReturnValue(false)
      
      const result = resolveConnectionString(plainConnectionString)
      
      expect(credentialStore.isValidCredentialId).toHaveBeenCalledWith(plainConnectionString)
      expect(result).toBe(plainConnectionString)
    })

    it('should return null if credential value cannot be retrieved', () => {
      const credentialId = 'cred_12345678-1234-1234-1234-123456789abc'
      
      // Mock the credential store methods
      vi.spyOn(credentialStore, 'isValidCredentialId').mockReturnValue(true)
      vi.spyOn(credentialStore, 'getCredentialValue').mockReturnValue(null)
      
      const result = resolveConnectionString(credentialId)
      
      expect(result).toBeNull()
    })
  })
})
