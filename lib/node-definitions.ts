import {
  NodeType,
  TriggerType,
  ActionType,
  LogicType,
  WorkflowNode,
  ScheduleNodeConfig,
} from '@/types/workflow'
import { EMAIL_NODE_DEFINITION } from '@/nodes/EmailNode/EmailNode.schema'
import { HTTP_NODE_DEFINITION } from '@/nodes/HttpNode/HttpNode.schema'
import { SCHEDULE_NODE_DEFINITION } from '@/nodes/ScheduleNode/ScheduleNode.schema'
import { WEBHOOK_NODE_DEFINITION } from '@/nodes/WebhookNode/WebhookNode.schema'
import { MANUAL_NODE_DEFINITION } from '@/nodes/ManualNode/ManualNode.schema'
import { IF_NODE_DEFINITION } from '@/nodes/IfNode/IfNode.schema'
import { FILTER_NODE_DEFINITION } from '@/nodes/FilterNode/FilterNode.schema'

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

interface ParameterDefinition {
  // Label shown to users
  label: string
  // JSON path inside node.data.config (e.g., 'authentication.type')
  path: string
  type: ParameterType
  required?: boolean
  description?: string
  options?: Array<{ label: string; value: string }>
  // Simple conditional display logic based on other config values
  showIf?: Array<{ path: string; equals: string | number | boolean }>
  // Default value for this parameter
  default?: unknown
}

interface NodeDefinition<TSubType extends string = string> {
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

function setValueAtPath(obj: Record<string, unknown>, path: string, value: unknown) {
  if (!path) return
  const parts = path.split('.')
  let current: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]
    const existing = current[part]
    const isObject = typeof existing === 'object' && existing !== null
    if (!isObject) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
}

function buildDefaultsFromParameters(params?: ParameterDefinition[]): Record<string, unknown> | undefined {
  if (!params || params.length === 0) return undefined
  const cfg: Record<string, unknown> = {}
  for (const p of params) {
    if (typeof p.default !== 'undefined') {
      setValueAtPath(cfg, p.path, p.default)
    }
  }
  return cfg
}

// Legacy utility functions - these are now handled by individual node modules
// Kept for backwards compatibility


// All node definitions are now handled by their respective modules
// This file provides compatibility functions that delegate to the new modular system

const NODE_DEFINITIONS: NodeDefinition[] = [
  // All definitions moved to individual node modules
  // This array is kept for backwards compatibility but is no longer used
]

export function findNodeDefinition(node: WorkflowNode): NodeDefinition | undefined {
  const data = node.data as WorkflowNode['data']
  switch (data.nodeType) {
    case NodeType.ACTION:
      return NODE_DEFINITIONS.find((d) => d.nodeType === NodeType.ACTION && d.subType === (data as { actionType: ActionType }).actionType)
    case NodeType.TRIGGER:
      return NODE_DEFINITIONS.find((d) => d.nodeType === NodeType.TRIGGER && d.subType === (data as { triggerType: TriggerType }).triggerType)
    case NodeType.LOGIC:
      return NODE_DEFINITIONS.find((d) => d.nodeType === NodeType.LOGIC && d.subType === (data as { logicType: LogicType }).logicType)
    default:
      return undefined
  }
}

export function getDefaultConfigForNode(nodeType: NodeType, subType: TriggerType | ActionType | LogicType): Record<string, unknown> | undefined {
  // Route to appropriate node definition based on type and subtype
  if (nodeType === NodeType.TRIGGER) {
    switch (subType as TriggerType) {
      case TriggerType.SCHEDULE:
        return SCHEDULE_NODE_DEFINITION.getDefaults()
      case TriggerType.WEBHOOK:
        return WEBHOOK_NODE_DEFINITION.getDefaults()
      case TriggerType.MANUAL:
        return MANUAL_NODE_DEFINITION.getDefaults()
      default:
        return {}
    }
  }
  
  if (nodeType === NodeType.ACTION) {
    switch (subType as ActionType) {
      case ActionType.EMAIL:
        return EMAIL_NODE_DEFINITION.getDefaults()
      case ActionType.HTTP:
        return HTTP_NODE_DEFINITION.getDefaults()
      default:
        return {}
    }
  }
  
  if (nodeType === NodeType.LOGIC) {
    switch (subType as LogicType) {
      case LogicType.IF:
        return IF_NODE_DEFINITION.getDefaults()
      case LogicType.FILTER:
        return FILTER_NODE_DEFINITION.getDefaults()
      default:
        return {}
    }
  }
  
  return {}
}

export function validateNodeBeforeExecute(node: WorkflowNode): string[] {
  const data = node.data as WorkflowNode['data']
  const config = (data as { config: Record<string, unknown> }).config || {}
  
  // Route to appropriate node definition for validation
  if (data.nodeType === NodeType.TRIGGER) {
    const triggerData = data as { triggerType: TriggerType }
    switch (triggerData.triggerType) {
      case TriggerType.SCHEDULE:
        return SCHEDULE_NODE_DEFINITION.validate(config as unknown as Record<string, unknown>)
      case TriggerType.WEBHOOK:
        return WEBHOOK_NODE_DEFINITION.validate(config as unknown as Record<string, unknown>)
      case TriggerType.MANUAL:
        return MANUAL_NODE_DEFINITION.validate(config)
      default:
        return []
    }
  }
  
  if (data.nodeType === NodeType.ACTION) {
    const actionData = data as { actionType: ActionType }
    switch (actionData.actionType) {
      case ActionType.EMAIL:
        return EMAIL_NODE_DEFINITION.validate(config as unknown as Record<string, unknown>)
      case ActionType.HTTP:
        return HTTP_NODE_DEFINITION.validate(config)
      default:
        return []
    }
  }
  
  if (data.nodeType === NodeType.LOGIC) {
    const logicData = data as { logicType: LogicType }
    switch (logicData.logicType) {
      case LogicType.IF:
        return IF_NODE_DEFINITION.validate(config)
      case LogicType.FILTER:
        return FILTER_NODE_DEFINITION.validate(config)
      default:
        return []
    }
  }
  
  return []
}



