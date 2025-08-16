import { LogicNodeData, LogicType } from '@/types/workflow'

export interface IfNodeConfig extends Record<string, unknown> {
  condition: {
    field: string
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan'
    value: string
  }
}

export interface IfNodeData extends LogicNodeData {
  logicType: LogicType.IF
  config: IfNodeConfig
}

export interface IfExecutionResult {
  conditionMet: boolean
  field: string
  operator: string
  value: string
  actualValue: unknown
  timestamp: Date
  branch: 'true' | 'false'
}

export interface IfValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}
