/**
 * Migration utilities for converting legacy configurations to secure credential references
 */

import { credentialStore, migrateConnectionStringToCredential } from './credential-store'
import { WorkflowNode, ActionType } from '@/types/workflow'
import { DatabaseNodeConfig } from '@/nodes/DatabaseNode/DatabaseNode.types'

/**
 * Migrate database node configuration from legacy connectionString to credential reference
 */
export function migrateDatabaseNodeConfig(config: DatabaseNodeConfig & Record<string, unknown>): DatabaseNodeConfig & Record<string, unknown> {
  // If already using credentialId, no migration needed
  if (config.credentialId && config.credentialId.trim().length > 0) {
    // Clean up legacy connectionString if present
    if (config.connectionString) {
      const { connectionString, ...cleanConfig } = config
      console.log('Cleaned up legacy connectionString field after migration')
      return cleanConfig
    }
    return config
  }
  
  // If we have a legacy connectionString, migrate it
  if (config.connectionString && config.connectionString.trim().length > 0) {
    try {
      const credentialName = `Database Connection (migrated ${new Date().toISOString().split('T')[0]})`
      const credentialId = migrateConnectionStringToCredential(config.connectionString, credentialName)
      
      // Return updated config with credentialId and without connectionString
      const { connectionString, ...cleanConfig } = config
      const migratedConfig = {
        ...cleanConfig,
        credentialId
      }
      
      console.log(`Migrated database connectionString to credential: ${credentialId}`)
      return migratedConfig
    } catch (error) {
      console.error('Failed to migrate database connectionString:', error)
      // Return original config if migration fails
      return config
    }
  }
  
  // No connectionString to migrate
  return config
}

/**
 * Migrate a workflow node if it's a database node with legacy configuration
 */
export function migrateWorkflowNode(node: WorkflowNode): WorkflowNode {
  // Only process database action nodes
  if (node.data.nodeType !== 'action') {
    return node
  }
  
  const actionNode = node.data as { actionType: ActionType; config: Record<string, unknown> }
  if (actionNode.actionType !== ActionType.DATABASE) {
    return node
  }
  
  const originalConfig = actionNode.config as DatabaseNodeConfig & Record<string, unknown>
  const migratedConfig = migrateDatabaseNodeConfig(originalConfig)
  
  // Return updated node if config changed
  if (migratedConfig !== originalConfig) {
    return {
      ...node,
      data: {
        ...node.data,
        config: migratedConfig
      }
    }
  }
  
  return node
}

/**
 * Check if a database node config needs migration
 */
export function needsDatabaseMigration(config: DatabaseNodeConfig & Record<string, unknown>): boolean {
  const hasCredentialId = Boolean(config.credentialId && config.credentialId.trim().length > 0)
  const hasConnectionString = Boolean(config.connectionString && config.connectionString.trim().length > 0)
  
  // Needs migration if it has connectionString but no credentialId
  return !hasCredentialId && hasConnectionString
}

/**
 * Validate a database node configuration (post-migration)
 */
export function validateDatabaseNodeConfig(config: DatabaseNodeConfig & Record<string, unknown>): string[] {
  const errors: string[] = []
  
  const hasCredentialId = config.credentialId && config.credentialId.trim().length > 0
  const hasConnectionString = config.connectionString && config.connectionString.trim().length > 0
  
  // Must have either credentialId or connectionString
  if (!hasCredentialId && !hasConnectionString) {
    errors.push('Database credential is required')
    return errors
  }
  
  // If using credentialId, validate it
  if (hasCredentialId) {
    if (!credentialStore.isValidCredentialId(config.credentialId)) {
      errors.push('Invalid credential ID format')
    } else if (!credentialStore.credentialExists(config.credentialId)) {
      errors.push('Referenced credential does not exist')
    }
  }
  
  // Warn about legacy connectionString
  if (hasConnectionString && !hasCredentialId) {
    console.warn('Database node is using legacy connectionString. Consider migrating to credential reference.')
  }
  
  return errors
}
