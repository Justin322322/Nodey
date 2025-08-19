import { DatabaseNodeConfig, DatabaseExecutionResult } from './DatabaseNode.types'
import { NodeExecutionContext, NodeExecutionResult } from '../types'
import { resolveConnectionString, migrateConnectionStringToCredential } from '@/lib/credential-store'

/**
 * Creates an abortable delay that respects AbortSignal
 */
async function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      reject(error)
      return
    }

    const timeoutId = setTimeout(() => {
      resolve()
    }, ms)

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      reject(error)
    })
  })
}

export async function executeDatabaseNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const startTime = Date.now()
  
  try {
    const cfg = context?.config
    if (!cfg) {
      return {
        success: false,
        error: 'Node configuration is missing'
      }
    }
    const config = cfg as DatabaseNodeConfig & Record<string, unknown>

    // Handle migration and credential resolution
    let connectionString: string | null = null
    
    // Check if we have credentialId (new approach)
    if (config.credentialId && typeof config.credentialId === 'string') {
      try {
        connectionString = resolveConnectionString(config.credentialId)
        if (!connectionString) {
          return {
            success: false,
            error: 'Failed to resolve database credential'
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to resolve database credential'
        }
      }
    }
    // Fallback to legacy connectionString and attempt migration
    else if (config.connectionString && typeof config.connectionString === 'string' && config.connectionString.trim().length > 0) {
      connectionString = config.connectionString
      
      // TODO: In a real implementation, you would want to trigger migration here
      // For now, we'll just log a warning
      console.warn('Using legacy connectionString. Consider migrating to credential reference.');
    }
    else {
      return {
        success: false,
        error: 'Database credential is required'
      }
    }    
    if (!config.query || typeof config.query !== 'string' || config.query.trim().length === 0) {
      return {
        success: false,
        error: 'SQL query is required'
      }
    }
    
    // Check for abort signal
    if (context.signal?.aborted) {
      return {
        success: false,
        error: 'Execution was cancelled'
      }
    }
    
    // PLACEHOLDER IMPLEMENTATION
    // In a real implementation, this would:
    // 1. Use the resolved connectionString to establish database connection
    // 2. Execute the SQL query with parameters
    // 3. Return actual results
    // 
    // Note: connectionString is now securely resolved from credential store
    void connectionString; // Mark as intentionally used to avoid linter warnings
    
    // Simulate database operation delay
    await abortableDelay(100, context.signal)
    
    const duration = Date.now() - startTime
    
    // Mock response based on operation type
    let mockResult: DatabaseExecutionResult
    
    switch (config.operation) {
      case 'select':
        mockResult = {
          operation: 'select',
          rows: [
            { id: 1, name: 'Mock User 1', email: 'user1@example.com' },
            { id: 2, name: 'Mock User 2', email: 'user2@example.com' }
          ],
          duration,
          query: config.query
        }
        break
        
      case 'insert':
        mockResult = {
          operation: 'insert',
          affectedRows: 1,
          insertId: 123,
          duration,
          query: config.query
        }
        break
        
      case 'update':
        mockResult = {
          operation: 'update',
          affectedRows: 2,
          duration,
          query: config.query
        }
        break
        
      case 'delete':
        mockResult = {
          operation: 'delete',
          affectedRows: 1,
          duration,
          query: config.query
        }
        break
        
      default:
        return {
          success: false,
          error: `Unsupported operation: ${config.operation}`
        }
    }
    
    return {
      success: true,
      output: mockResult
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Database operation was cancelled'
        }
      }
      
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Unknown error occurred during database operation'
    }
  }
}
