import { ActionNodeData, ActionType } from '@/types/workflow'

export interface EmailNodeConfig extends Record<string, unknown> {
  to: string[]
  subject: string
  body: string
  from?: string
  attachments?: string[]
  
  // Email service configuration
  emailService: {
    type: 'smtp' | 'gmail' | 'outlook' | 'sendgrid'
    // SMTP Configuration
    host?: string
    port?: number
    secure?: boolean // true for 465, false for other ports
    auth: {
      user: string
      pass: string // App password or API key
    }
    // SendGrid specific
    apiKey?: string
  }
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
  provider?: string
  error?: string
}