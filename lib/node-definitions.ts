import {
  NodeType,
  TriggerType,
  ActionType,
  LogicType,
  WorkflowNode,
} from '../types/workflow'
import { getNodeDefinition, NodeDefinition as ImportedNodeDefinition } from '../nodes'
import { CredentialType } from '../types/credentials'

// Minimal, n8n-inspired parameter schema for nodes.
// This powers defaults and validation and can later drive dynamic UIs.

type ParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'json'
  | 'textarea'
  | 'stringList'
  | 'text'
  | 'email'
  | 'url'
  | 'password'
  | 'credential'

interface ParameterDefinition {
  // Label shown to users
  label: string
  // JSON path inside node.data.config (e.g., 'authentication.type')
  path: string
  type: ParameterType
  required?: boolean
  description?: string
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  // Simple conditional display logic based on other config values
  showIf?: Array<{ path: string; equals: string | number | boolean }>
  // Default value for this parameter
  default?: unknown
  // For credential type parameters
  credentialType?: CredentialType
}

// Legacy NodeDefinition interface for backward compatibility
interface LegacyNodeDefinition<TSubType extends string = string> {
  nodeType: NodeType
  subType: TSubType
  label: string
  description: string
  defaults?: {
    config?: Record<string, unknown>
    runSettings?: {
      timeoutMs?: number
      retryCount?: number
      retryDelayMs?: number
      continueOnFail?: boolean
    }
  }
  parameters?: ParameterDefinition[]
  validate?: (config: Record<string, unknown>) => string[]
}

// Use the imported NodeDefinition for new functions
type NodeDefinition = ImportedNodeDefinition

// Utility functions removed - they are now handled by individual node modules

// Legacy compatibility functions - these delegate to the new modular system

export function findNodeDefinition(node: WorkflowNode): ImportedNodeDefinition | undefined {
  const data = node.data as WorkflowNode['data']

  // Use the new registry system for all nodes
  switch (data.nodeType) {
    case NodeType.ACTION: {
      const actionType = (data as { actionType: ActionType }).actionType
      return getNodeDefinition(NodeType.ACTION, actionType)
    }

    case NodeType.TRIGGER: {
      const triggerType = (data as { triggerType: TriggerType }).triggerType
      return getNodeDefinition(NodeType.TRIGGER, triggerType)
    }

    case NodeType.LOGIC: {
      const logicType = (data as { logicType: LogicType }).logicType
      return getNodeDefinition(NodeType.LOGIC, logicType)
    }

    default:
      return undefined
  }
}
export function getDefaultConfigForNode(nodeType: NodeType, subType: TriggerType | ActionType | LogicType): Record<string, unknown> | undefined {
  // Use the new registry system for all nodes
  const definition = getNodeDefinition(nodeType, subType as string)
  return definition?.getDefaults() || {}
}

export function validateNodeBeforeExecute(node: WorkflowNode): string[] {
  const data = node.data as WorkflowNode['data']
  const config = (data as { config: Record<string, unknown> }).config || {}
  
  // Use the new registry system for all nodes
  let subType: string
  switch (data.nodeType) {
    case NodeType.TRIGGER:
      subType = (data as { triggerType: TriggerType }).triggerType
      break
    case NodeType.ACTION:
      subType = (data as { actionType: ActionType }).actionType
      break
    case NodeType.LOGIC:
      subType = (data as { logicType: LogicType }).logicType
      break
    default:
      return []
  }
  
  const definition = getNodeDefinition(data.nodeType, subType)
  return definition?.validate(config) || []
}



