import { Node, Edge } from 'reactflow'

// Node Types
export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  LOGIC = 'logic',
}

// Trigger Types
export enum TriggerType {
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  EMAIL = 'email',
}

// Action Types
export enum ActionType {
  HTTP = 'http',
  EMAIL = 'email',
  DATABASE = 'database',
  TRANSFORM = 'transform',
  DELAY = 'delay',
}

// Logic Types
export enum LogicType {
  IF = 'if',
  SWITCH = 'switch',
  LOOP = 'loop',
  FILTER = 'filter',
}

// Base Node Data
// Base node data (exported as type to avoid unused-export noise when only extended)
type BaseNodeData = {
  label: string
  description?: string
  nodeType: NodeType
  config: Record<string, unknown>
  outputs?: Record<string, unknown>
  error?: string
  // non-interactive, simplified rendering for marketing previews
  isPreview?: boolean
  // n8n-like per-node execution settings
  runSettings?: {
    timeoutMs?: number // max time per node before timing out
    retryCount?: number // number of retries on failure
    retryDelayMs?: number // delay between retries
    continueOnFail?: boolean // proceed even if the node fails
  }
}

// Specific Node Data Types
export interface TriggerNodeData extends BaseNodeData {
  nodeType: NodeType.TRIGGER
  triggerType: TriggerType
}

export interface ActionNodeData extends BaseNodeData {
  nodeType: NodeType.ACTION
  actionType: ActionType
}

export interface LogicNodeData extends BaseNodeData {
  nodeType: NodeType.LOGIC
  logicType: LogicType
}

export type WorkflowNodeData = TriggerNodeData | ActionNodeData | LogicNodeData

export type WorkflowNode = Node<WorkflowNodeData>
export type WorkflowEdge = Edge

// Workflow Definition
export interface Workflow {
  id: string
  name: string
  description?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// Execution
export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  error?: string
  logs: ExecutionLog[]
  nodeOutputs: Record<string, unknown>
}

export interface ExecutionLog {
  timestamp: Date
  nodeId: string
  message: string
  level: 'info' | 'warning' | 'error'
  data?: unknown
}

// Node Configuration Schemas
export interface HttpNodeConfig extends Record<string, unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: unknown
  authentication?: {
    type: 'none' | 'bearer' | 'basic' | 'apiKey'
    value?: string
  }
}



export interface ScheduleNodeConfig {
  cron: string
  timezone?: string
}

export interface IfNodeConfig {
  condition: {
    field: string
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan'
    value: unknown
  }
}

// Filter node uses the same simple condition structure as IF
// Filter node uses the same simple condition structure as IF — removed unused explicit
// exported type to avoid unused-export noise. The schema remains defined in node
// schemas where needed.

// Removed unused LoopNodeConfig
