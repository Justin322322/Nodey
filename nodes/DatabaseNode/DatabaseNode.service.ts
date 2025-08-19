import { DatabaseNodeConfig, DatabaseExecutionResult } from './DatabaseNode.types'
import { NodeExecutionContext, NodeExecutionResult } from '../types'
import { resolveConnectionString, migrateConnectionStringToCredential } from '@/lib/credential-store'

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
    if (config.credentialId && typeof config.credentialId === 'string' && config.credentialId.trim().length > 0) {
      connectionString = resolveConnectionString(config.credentialId)
      if (!connectionString) {
        return {
          success: false,
          error: 'Failed to resolve database credential'
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
    if (!config.query || config.query.trim().length === 0) {
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
    
    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
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
