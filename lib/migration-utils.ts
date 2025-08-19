/**
 * Migration utilities for converting legacy configurations to secure credential references
 */

import { credentialStore, migrateConnectionStringToCredential } from './credential-store'
import { WorkflowNode, ActionType } from '@/types/workflow'
import { DatabaseNodeConfig } from '@/nodes/DatabaseNode/DatabaseNode.types'
import { DelayNodeConfig } from '@/nodes/DelayNode/DelayNode.types'

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
 * Migrate a workflow node if it has legacy configuration
 */
export function migrateWorkflowNode(node: WorkflowNode): WorkflowNode {
  // Only process action nodes
  if (node.data.nodeType !== 'action') {
    return node
  }
  
  const actionNode = node.data as { actionType: ActionType; config: Record<string, unknown> }
  let migratedConfig = actionNode.config
  
  // Handle database node migration
  if (actionNode.actionType === ActionType.DATABASE) {
    const originalConfig = actionNode.config as DatabaseNodeConfig & Record<string, unknown>
    migratedConfig = migrateDatabaseNodeConfig(originalConfig)
  }
  
  // Handle delay node migration
  if (actionNode.actionType === ActionType.DELAY) {
    const originalConfig = actionNode.config as DelayNodeConfig & Record<string, unknown>
    migratedConfig = migrateDelayNodeConfig(originalConfig)
  }
  
  // Return updated node if config changed
  if (migratedConfig !== actionNode.config) {
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

/**
 * Migrate DelayNode configuration from legacy delayMs to value+unit pattern
 */
export function migrateDelayNodeConfig(config: DelayNodeConfig & Record<string, unknown>): DelayNodeConfig & Record<string, unknown> {
  // If already using the new pattern (has value and unit), no migration needed
  if (typeof config.value === 'number' && config.unit) {
    // Clean up legacy delayMs if present
    if ('delayMs' in config) {
      const { delayMs, ...cleanConfig } = config
      console.log('Cleaned up legacy delayMs field after migration')
      return cleanConfig
    }
    return config
  }
  
  // If we have a legacy delayMs, migrate it to value+unit
  if (typeof config.delayMs === 'number' && config.delayMs > 0) {
    try {
      // Convert milliseconds to a reasonable unit
      let value: number
      let unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours'
      
      if (config.delayMs < 1000) {
        // Less than 1 second - keep as milliseconds
        value = config.delayMs
        unit = 'milliseconds'
      } else if (config.delayMs < 60000) {
        // Less than 1 minute - convert to seconds
        value = config.delayMs / 1000
        unit = 'seconds'
      } else if (config.delayMs < 3600000) {
        // Less than 1 hour - convert to minutes
        value = config.delayMs / 60000
        unit = 'minutes'
      } else {
        // 1 hour or more - convert to hours
        value = config.delayMs / 3600000
        unit = 'hours'
      }
      
      // Remove delayMs and add value/unit
      const { delayMs, ...cleanConfig } = config
      const migratedConfig = {
        ...cleanConfig,
        value,
        unit
      }
      
      console.log(`Migrated DelayNode from delayMs=${config.delayMs}ms to value=${value} ${unit}`)
      return migratedConfig
    } catch (error) {
      console.warn('Failed to migrate DelayNode delayMs to value+unit:', error)
      return config
    }
  }
  
  return config
}

/**
 * Check if a DelayNode config needs migration
 */
export function needsDelayMigration(config: DelayNodeConfig & Record<string, unknown>): boolean {
  const hasValueAndUnit = typeof config.value === 'number' && config.unit
  const hasLegacyDelayMs = typeof config.delayMs === 'number'
  
  // Needs migration if it has delayMs but missing value/unit
  return hasLegacyDelayMs && !hasValueAndUnit
}
