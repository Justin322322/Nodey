import {
  NodeType,
  TriggerType,
  ActionType,
  LogicType,
  WorkflowNode,
  HttpNodeConfig,
  EmailNodeConfig,
  ScheduleNodeConfig,
  IfNodeConfig,
} from '@/types/workflow'

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

// HTTP Action
const HTTP_DEFINITION: NodeDefinition<ActionType> = {
  nodeType: NodeType.ACTION,
  subType: ActionType.HTTP,
  label: 'HTTP Request',
  description: 'Make an HTTP request to an external API',
  parameters: [
    {
      label: 'Method',
      path: 'method',
      type: 'select',
      required: true,
      default: 'GET',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'PATCH', value: 'PATCH' },
      ],
    },
    {
      label: 'URL',
      path: 'url',
      type: 'string',
      required: true,
      default: '',
      description: 'Full URL to request',
    },
    {
      label: 'Authentication',
      path: 'authentication.type',
      type: 'select',
      required: false,
      default: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Bearer Token', value: 'bearer' },
        { label: 'Basic (Base64 user:pass)', value: 'basic' },
        { label: 'API Key (Header)', value: 'apiKey' },
      ],
    },
    {
      label: 'Auth Value',
      path: 'authentication.value',
      type: 'string',
      required: false,
      showIf: [{ path: 'authentication.type', equals: 'bearer' }],
    },
    {
      label: 'Headers (JSON)',
      path: 'headers',
      type: 'json',
      required: false,
      // no default to avoid pre-populating the friendly editor
    },
    {
      label: 'Body (JSON)',
      path: 'body',
      type: 'json',
      required: false,
      showIf: [{ path: 'method', equals: 'POST' }],
      // no default to avoid pre-populating the friendly editor
    },
  ],
  validate: (config) => {
    const errors: string[] = []
    const typed = config as unknown as HttpNodeConfig
    if (!typed.url || typeof typed.url !== 'string' || typed.url.trim().length === 0) {
      errors.push('URL is required')
    }
    const method = (typed.method as string) || 'GET'
    const valid = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    if (!valid.includes(method)) {
      errors.push(`Invalid HTTP method: ${method}`)
    }
    if (typed.authentication && typed.authentication.type !== 'none' && !typed.authentication.value) {
      errors.push('Authentication value is required for selected auth type')
    }
    return errors
  },
}

// Email Action
const EMAIL_DEFINITION: NodeDefinition<ActionType> = {
  nodeType: NodeType.ACTION,
  subType: ActionType.EMAIL,
  label: 'Send Email',
  description: 'Send an email message',
  parameters: [
    { label: 'To', path: 'to', type: 'stringList', required: true, default: [] },
    { label: 'Subject', path: 'subject', type: 'string', required: true, default: '' },
    { label: 'Body', path: 'body', type: 'textarea', required: true, default: '' },
  ],
  validate: (config) => {
    const errors: string[] = []
    const typed = config as unknown as EmailNodeConfig
    if (!Array.isArray(typed.to) || typed.to.length === 0) errors.push('At least one recipient (To) is required')
    if (!typed.subject || typed.subject.trim().length === 0) errors.push('Subject is required')
    return errors
  },
}

// Schedule Trigger
const SCHEDULE_DEFINITION: NodeDefinition<TriggerType> = {
  nodeType: NodeType.TRIGGER,
  subType: TriggerType.SCHEDULE,
  label: 'Schedule',
  description: 'Run on a recurring schedule',
  parameters: [
    { label: 'Cron', path: 'cron', type: 'string', required: true, default: '0 0 * * *' },
    { label: 'Timezone', path: 'timezone', type: 'string', required: false, default: 'UTC' },
  ],
  validate: (config) => {
    const errors: string[] = []
    const typed = config as unknown as ScheduleNodeConfig
    if (!typed.cron || typed.cron.trim().length === 0) errors.push('Cron expression is required')
    return errors
  },
}

// Webhook Trigger
const WEBHOOK_DEFINITION: NodeDefinition<TriggerType> = {
  nodeType: NodeType.TRIGGER,
  subType: TriggerType.WEBHOOK,
  label: 'Webhook',
  description: 'Trigger the workflow via an HTTP request',
  parameters: [
    {
      label: 'Method',
      path: 'method',
      type: 'select',
      required: true,
      default: 'POST',
      options: [
        { label: 'POST', value: 'POST' },
        { label: 'GET', value: 'GET' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
      ],
    },
    {
      label: 'Secret (optional)',
      path: 'secret',
      type: 'string',
      required: false,
      description: 'If set, include a signature header in requests to verify the source',
    },
    {
      label: 'Signature Header',
      path: 'signatureHeader',
      type: 'string',
      required: false,
      default: 'x-webhook-signature',
      description: 'Header name used to send a request signature',
    },
  ],
}

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
  parameters: [
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
  ],
  validate: (config) => {
    const errors: string[] = []
    const typed = config as unknown as IfNodeConfig
    if (!typed.condition?.field) errors.push('Condition field is required')
    if (!typed.condition?.operator) errors.push('Operator is required')
    if (typeof typed.condition?.value === 'undefined') errors.push('Comparison value is required')
    return errors
  },
}

const NODE_DEFINITIONS: NodeDefinition[] = [
  HTTP_DEFINITION,
  EMAIL_DEFINITION,
  MANUAL_DEFINITION,
  WEBHOOK_DEFINITION,
  SCHEDULE_DEFINITION,
  IF_DEFINITION,
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
  const def = NODE_DEFINITIONS.find((d) => d.nodeType === nodeType && d.subType === subType)
  if (!def) return {}
  if (def.defaults?.config) return def.defaults.config
  return buildDefaultsFromParameters(def.parameters) || {}
}

export function validateNodeBeforeExecute(node: WorkflowNode): string[] {
  const def = findNodeDefinition(node)
  if (!def || !def.validate) return []
  const config = (node.data as { config: Record<string, unknown> }).config || {}
  return def.validate(config)
}


