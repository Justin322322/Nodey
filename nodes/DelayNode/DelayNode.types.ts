import { ActionNodeData, ActionType } from '@/types/workflow'

export interface DelayNodeConfig extends Record<string, unknown> {
  delayType: 'fixed' | 'random' | 'exponential'
  delayMs: number
  maxDelayMs?: number
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours'
  value: number
  passthrough: boolean
}

export interface DelayNodeData extends ActionNodeData {
  actionType: ActionType.DELAY
  config: DelayNodeConfig
}

export interface DelayExecutionResult {
  delayType: string
  actualDelayMs: number
  plannedDelayMs: number
  unit: string
  startTime: string
  endTime: string
  passthrough: boolean
  passthroughData?: unknown
}

export type { DelayNodeConfig as DelayConfig }
