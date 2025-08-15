import { ActionNodeData, ActionType, HttpNodeConfig } from '@/types/workflow'

export interface HttpNodeData extends ActionNodeData {
  actionType: ActionType.HTTP
  config: HttpNodeConfig & Record<string, unknown>
}

export interface HttpExecutionResult {
  status: number
  data: unknown
  headers: Record<string, string>
  duration: number
  url: string
  method: string
}

export type { HttpNodeConfig }