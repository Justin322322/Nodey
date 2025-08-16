import { TriggerNodeData, TriggerType } from '@/types/workflow'

export interface WebhookNodeConfig extends Record<string, unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  secret?: string
  signatureHeader?: string
  responseMode?: 'sync' | 'async'
  responseCode?: number
  responseBody?: string
  enabled?: boolean
}

export interface WebhookNodeData extends TriggerNodeData {
  triggerType: TriggerType.WEBHOOK
  config: WebhookNodeConfig
}

export interface WebhookExecutionResult {
  triggered: boolean
  method: string
  url?: string
  headers: Record<string, string>
  body?: unknown
  timestamp: Date
  signatureVerified?: boolean
  reason?: string
}

export interface WebhookValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface WebhookSignatureResult {
  isValid: boolean
  signature?: string
  error?: string
}
