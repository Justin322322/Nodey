import { ActionNodeData, ActionType } from '@/types/workflow'

export interface DatabaseNodeConfig {
  operation: 'select' | 'insert' | 'update' | 'delete'
  credentialId: string
  query: string
  parameters?: Record<string, unknown>
  schema?: string
  table?: string
  // @deprecated Legacy field for backward compatibility - will be migrated to credentialId
  // Use credentialId with secure credential store instead
  connectionString?: string
  // Index signature to make it compatible with Record<string, unknown>
  [key: string]: unknown
}

export interface DatabaseNodeData extends ActionNodeData {
  actionType: ActionType.DATABASE
  config: DatabaseNodeConfig & Record<string, unknown>
}

export interface DatabaseExecutionResult {
  operation: string
  rows?: unknown[]
  affectedRows?: number
  insertId?: string | number
  duration: number
  query: string
}

export type { DatabaseNodeConfig as DatabaseConfig }
