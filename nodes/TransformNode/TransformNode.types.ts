import { ActionNodeData, ActionType } from '@/types/workflow'

export interface TransformNodeConfig extends Record<string, unknown> {
  operation: 'map' | 'filter' | 'reduce' | 'sort' | 'group' | 'merge'
  script: string
  language: 'javascript' | 'jsonpath'
  inputPath?: string
  outputPath?: string
  options?: Record<string, unknown>
}

export interface TransformNodeData extends ActionNodeData {
  actionType: ActionType.TRANSFORM
  config: TransformNodeConfig
}

export interface TransformExecutionResult {
  operation: string
  originalData: unknown
  transformedData: unknown
  duration: number
  itemsProcessed: number
}

export type { TransformNodeConfig as TransformConfig }
