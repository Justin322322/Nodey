import { TriggerNodeData, TriggerType } from '@/types/workflow'

export interface ScheduleNodeConfig extends Record<string, unknown> {
  cron: string
  timezone?: string
  enabled?: boolean
}

export interface ScheduleNodeData extends TriggerNodeData {
  triggerType: TriggerType.SCHEDULE
  config: ScheduleNodeConfig
}

export interface ScheduleExecutionResult {
  triggered: boolean
  cronExpression: string
  nextRun?: Date
  timezone: string
  timestamp: Date
  reason?: string
}

export interface CronParseResult {
  isValid: boolean
  nextExecution?: Date
  previousExecution?: Date
  description?: string
  error?: string
}

export interface ScheduleValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}
