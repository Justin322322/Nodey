import { TriggerNodeData, TriggerType } from '@/types/workflow'

// This node is server-side only due to IMAP dependencies
export const EMAIL_TRIGGER_NODE_IS_SERVER_ONLY = true

export interface EmailTriggerConfig extends Record<string, unknown> {
  // IMAP Connection Settings
  host: string
  port: number
  secure: boolean
  user: string
  password: string

  // Email Processing Settings
  mailbox: string
  postProcessAction: 'read' | 'nothing'
  downloadAttachments: boolean
  format: 'simple' | 'resolved' | 'raw'

  // Advanced Options
  customEmailRules?: string // JSON array of IMAP search criteria
  forceReconnect?: number // minutes
  trackLastMessageId?: boolean

  // Attachment Settings
  attachmentPrefix?: string

  // TLS Settings
  allowUnauthorizedCerts?: boolean
  enabled?: boolean
}

export interface EmailTriggerData extends TriggerNodeData {
  triggerType: TriggerType.EMAIL
  config: EmailTriggerConfig
}

export interface EmailTriggerExecutionResult {
  triggered: boolean
  emailCount: number
  emails: EmailMessage[]
  timestamp: Date
  error?: string
}

export interface EmailMessage {
  id: string
  uid: number
  subject: string
  from: EmailAddress[]
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  date: Date
  text?: string
  html?: string
  attachments?: EmailAttachment[]
  raw?: string // base64 encoded for raw format
  headers: Record<string, string>
}

export interface EmailAddress {
  name?: string
  address: string
}

export interface EmailAttachment {
  filename: string
  contentType: string
  size: number
  content: Buffer
}

export interface EmailTriggerValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}
