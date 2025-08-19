import { ActionNodeData, ActionType } from '@/types/workflow'

export interface DelayNodeConfig extends Record<string, unknown> {
  delayType: 'fixed' | 'random' | 'exponential'
  maxDelayMs?: number
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours'
  value: number
  passthrough: boolean
}

/**
 * Helper function to compute delay in milliseconds from value and unit
 */
export function getDelayMs(config: { value: number; unit: string }): number {
  const multipliers = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
  } as const

  const unitMultiplier = multipliers[config.unit as keyof typeof multipliers]
  if (unitMultiplier === undefined) {
    throw new Error(`Invalid unit: ${config.unit}`)
  }

  const delayMs = config.value * unitMultiplier
  if (!Number.isFinite(delayMs)) {
    throw new Error('Invalid computed delay value')
  }

  return delayMs
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
