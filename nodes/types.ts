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

/**
 * Helper function to create test NodeExecutionContext with default values
 */
export function createTestContext(overrides: Partial<NodeExecutionContext> = {}): NodeExecutionContext {
  return {
    nodeId: 'test-node-1',
    workflowId: 'test-workflow-1',
    config: {},
    input: {},
    previousNodes: [],
    executionId: 'test-execution-1',
    ...overrides
  }
}