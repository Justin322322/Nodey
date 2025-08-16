import { TriggerNodeData, TriggerType } from '@/types/workflow'

export interface ManualNodeConfig extends Record<string, unknown> {
  // Manual trigger has no configuration parameters
  // This is intentionally empty but extends Record for consistency
}

export interface ManualNodeData extends TriggerNodeData {
  triggerType: TriggerType.MANUAL
  config: ManualNodeConfig
}

export interface ManualExecutionResult {
  triggered: boolean
  timestamp: Date
  triggeredBy?: string
  reason?: string
}

export interface ManualValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}
