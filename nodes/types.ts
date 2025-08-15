/**
 * Shared types for node execution across all node services
 */

export interface NodeExecutionContext {
  nodeId: string
  config: Record<string, unknown>
  previousOutput?: unknown
  signal?: AbortSignal
}

export interface NodeExecutionResult {
  success: boolean
  output?: unknown
  error?: string
}