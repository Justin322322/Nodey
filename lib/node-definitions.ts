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

// Shared conditional parameter set for logic nodes that compare a field to a value
const CONDITION_PARAMETERS: ParameterDefinition[] = [
  { label: 'Field', path: 'condition.field', type: 'string', required: true, default: '' },
  {
    label: 'Operator',
    path: 'condition.operator',
    type: 'select',
    required: true,
    default: 'equals',
    options: [
      { label: 'Equals', value: 'equals' },
      { label: 'Not Equals', value: 'notEquals' },
      { label: 'Contains', value: 'contains' },
      { label: 'Greater Than', value: 'greaterThan' },
      { label: 'Less Than', value: 'lessThan' },
    ],
  },
  { label: 'Value', path: 'condition.value', type: 'string', required: true, default: '' },
]

function validateConditionConfig(config: Record<string, unknown>): string[] {
  const errors: string[] = []
  const typed = config as { condition?: { field?: string; operator?: string; value?: unknown } }
  if (!typed.condition?.field) errors.push('Condition field is required')
  if (!typed.condition?.operator) errors.push('Operator is required')
  if (typeof typed.condition?.value === 'undefined') errors.push('Comparison value is required')
  return errors
}


// Schedule Trigger (now handled by ScheduleNode module)
// Removed - replaced by nodes/ScheduleNode implementation

// Webhook Trigger (now handled by WebhookNode module)
// Removed - replaced by nodes/WebhookNode implementation

// Manual Trigger (n8n-equivalent): has no configurable parameters
const MANUAL_DEFINITION: NodeDefinition<TriggerType> = {
  nodeType: NodeType.TRIGGER,
  subType: TriggerType.MANUAL,
  label: 'Manual Trigger',
  description: 'Start the workflow manually (no configuration needed)',
}

// IF Logic
const IF_DEFINITION: NodeDefinition<LogicType> = {
  nodeType: NodeType.LOGIC,
  subType: LogicType.IF,
  label: 'If/Else',
  description: 'Conditional branching based on previous data',
  parameters: CONDITION_PARAMETERS,
  validate: validateConditionConfig,
}

// FILTER Logic
const FILTER_DEFINITION: NodeDefinition<LogicType> = {
  nodeType: NodeType.LOGIC,
  subType: LogicType.FILTER,
  label: 'Filter',
  description: 'Filter array items using a simple condition',
  parameters: CONDITION_PARAMETERS,
  validate: validateConditionConfig,
}

const NODE_DEFINITIONS: NodeDefinition[] = [
  MANUAL_DEFINITION,
  // WEBHOOK_DEFINITION removed - handled by WebhookNode module
  // SCHEDULE_DEFINITION removed - handled by ScheduleNode module
  IF_DEFINITION,
  FILTER_DEFINITION,
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
  // Handle modular nodes first
  if (nodeType === NodeType.TRIGGER && subType === TriggerType.SCHEDULE) {
    return SCHEDULE_NODE_DEFINITION.getDefaults()
  }
  
  if (nodeType === NodeType.TRIGGER && subType === TriggerType.WEBHOOK) {
    return WEBHOOK_NODE_DEFINITION.getDefaults()
  }
  
  const def = NODE_DEFINITIONS.find((d) => d.nodeType === nodeType && d.subType === subType)
  if (!def) return {}
  if (def.defaults?.config) return def.defaults.config
  return buildDefaultsFromParameters(def.parameters) || {}
}

export function validateNodeBeforeExecute(node: WorkflowNode): string[] {
  const def = findNodeDefinition(node)
  if (def && def.validate) {
    const config = (node.data as { config: Record<string, unknown> }).config || {}
    return def.validate(config)
  }
  
  // Fallback for modular nodes that aren't in NODE_DEFINITIONS
  const data = node.data as WorkflowNode['data']
  const config = (data as { config: Record<string, unknown> }).config || {}
  
  if (data.nodeType === NodeType.ACTION) {
    const actionData = data as { actionType: ActionType }
    
    // Handle Email nodes
    if (actionData.actionType === ActionType.EMAIL) {
      return EMAIL_NODE_DEFINITION.validate(config as unknown as Record<string, unknown>)
    }
    
    // Handle HTTP nodes
    if (actionData.actionType === ActionType.HTTP) {
      return HTTP_NODE_DEFINITION.validate(config)
    }
  }
  
  if (data.nodeType === NodeType.TRIGGER) {
    const triggerData = data as { triggerType: TriggerType }
    
    // Handle Schedule nodes
    if (triggerData.triggerType === TriggerType.SCHEDULE) {
      return SCHEDULE_NODE_DEFINITION.validate(config as unknown as Record<string, unknown>)
    }
    
    // Handle Webhook nodes
    if (triggerData.triggerType === TriggerType.WEBHOOK) {
      return WEBHOOK_NODE_DEFINITION.validate(config as unknown as Record<string, unknown>)
    }
  }
  
  return []
}


