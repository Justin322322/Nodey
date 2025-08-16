/**
 * Shared types for node execution across all node services
 */

export interface NodeExecutionContext {
  nodeId: string
  workflowId: string
  config: Record<string, unknown>
  input: unknown
  previousNodes: string[]
  executionId: string
  signal?: AbortSignal
}

export interface NodeExecutionResult {
  success: boolean
  output?: unknown
  error?: string
}