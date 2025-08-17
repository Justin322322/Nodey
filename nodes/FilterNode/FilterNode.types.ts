import { LogicNodeData, LogicType } from '@/types/workflow'

export interface FilterNodeConfig extends Record<string, unknown> {
  condition: {
    field: string
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan'
    value: string
  }
}

export interface FilterNodeData extends LogicNodeData {
  logicType: LogicType.FILTER
  config: FilterNodeConfig
}

export interface FilterExecutionResult {
  originalCount: number
  filteredCount: number
  field: string
  operator: string
  value: string
  filteredItems: unknown[]
  timestamp: Date
}

export interface FilterValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}
