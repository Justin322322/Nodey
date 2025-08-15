import { ActionNodeData, ActionType } from '@/types/workflow'

export interface EmailNodeConfig extends Record<string, unknown> {
  to: string[]
  subject: string
  body: string
  from?: string
  attachments?: string[]
}

export interface EmailNodeData extends ActionNodeData {
  actionType: ActionType.EMAIL
  config: EmailNodeConfig
}

export interface EmailExecutionResult {
  sent: boolean
  to: string[]
  subject: string
  messageId: string
  timestamp: Date
}