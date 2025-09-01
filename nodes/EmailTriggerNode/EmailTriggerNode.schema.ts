import { NodeType, TriggerType } from '@/types/workflow'
import { EmailTriggerConfig, EMAIL_TRIGGER_NODE_IS_SERVER_ONLY } from './EmailTriggerNode.types'
import type { NodeDefinition, ParameterDefinition } from '@/nodes'

// Import service only on server side to avoid client-side bundling
interface EmailTriggerServiceType {
  new (): {
    connect(config: EmailTriggerConfig): Promise<void>
    disconnect(): Promise<void>
    fetchEmails(config: EmailTriggerConfig, lastMessageId?: number): Promise<unknown[]>
    markAsRead(messageId: number): Promise<void>
    getLastMessageId(): Promise<number | undefined>
    isConnectedToServer(): boolean
    getConnection(): unknown
  }
}

let EmailTriggerService: EmailTriggerServiceType | undefined

// Try to load EmailTriggerService dynamically, but don't fail if it's not available
try {
  if (typeof window === 'undefined') {
    // Server-side only - use relative path for better test compatibility
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const serviceModule = require('../../server/services/email-trigger.service')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    EmailTriggerService = serviceModule.EmailTriggerService
  }
} catch (error) {
  // Service not available (e.g., in test environment or when dependencies are missing)
  // This is expected and shouldn't cause test failures
  if (process.env.NODE_ENV !== 'test') {
    console.warn('EmailTriggerService not available:', error)
  }
  EmailTriggerService = undefined
}

export const EMAIL_TRIGGER_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.TRIGGER,
  subType: TriggerType.EMAIL,
  label: 'Email Trigger',
  description: 'Triggers workflow when new emails are received via IMAP (Server-side only)',
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  serverSideOnly: EMAIL_TRIGGER_NODE_IS_SERVER_ONLY,
  parameters: [
    // IMAP Connection Settings
    {
      name: 'host',
      label: 'IMAP Host',
      type: 'text',
      required: true,
      description: 'IMAP server hostname or IP address',
      placeholder: 'imap.gmail.com'
    },
    {
      name: 'port',
      label: 'Port',
      type: 'number',
      required: true,
      defaultValue: 993,
      description: 'IMAP server port (993 for SSL, 143 for non-SSL)'
    },
    {
      name: 'secure',
      label: 'Use SSL/TLS',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Whether to use SSL/TLS encryption for the connection'
    },
    {
      name: 'user',
      label: 'Username',
      type: 'email',
      required: true,
      description: 'Email address for IMAP authentication',
      placeholder: 'your-email@example.com'
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      description: 'Password or app password for IMAP authentication'
    },

    // Email Processing Settings
    {
      name: 'mailbox',
      label: 'Mailbox',
      type: 'text',
      required: false,
      defaultValue: 'INBOX',
      description: 'IMAP mailbox/folder to monitor for new emails',
      placeholder: 'INBOX'
    },
    {
      name: 'postProcessAction',
      label: 'After Processing',
      type: 'select',
      required: false,
      defaultValue: 'read',
      description: 'What to do with emails after processing',
      options: [
        { label: 'Mark as Read', value: 'read' },
        { label: 'Leave Unread', value: 'nothing' }
      ]
    },

    // Content Processing
    {
      name: 'format',
      label: 'Output Format',
      type: 'select',
      required: false,
      defaultValue: 'simple',
      description: 'Format of the email data output',
      options: [
        { label: 'Simple (Text/HTML)', value: 'simple' },
        { label: 'Resolved (With Attachments)', value: 'resolved' },
        { label: 'Raw (Base64)', value: 'raw' }
      ]
    },
    {
      name: 'downloadAttachments',
      label: 'Download Attachments',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Whether to download email attachments (increases processing time)',
      showIf: [
        { name: 'format', equals: 'simple' },
        { name: 'format', equals: 'resolved' }
      ]
    },
    {
      name: 'attachmentPrefix',
      label: 'Attachment Prefix',
      type: 'text',
      required: false,
      defaultValue: 'attachment_',
      description: 'Prefix for attachment file names in the output',
      placeholder: 'attachment_',
      showIf: [
        { name: 'downloadAttachments', equals: true }
      ]
    },

    // Advanced Options
    {
      name: 'customEmailRules',
      label: 'Custom Email Rules',
      type: 'textarea',
      required: false,
      description: 'Custom IMAP search criteria as JSON array. Leave empty for default UNSEEN emails.',
      placeholder: '["UNSEEN", ["SINCE", "1-Jan-2024"]]'
    },
    {
      name: 'trackLastMessageId',
      label: 'Track Last Message',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Whether to only process new emails since the last run'
    },
    {
      name: 'forceReconnect',
      label: 'Force Reconnect (minutes)',
      type: 'number',
      required: false,
      description: 'Force reconnection every N minutes to refresh connection (0 to disable)',
      placeholder: '60'
    },

    // TLS Settings
    {
      name: 'allowUnauthorizedCerts',
      label: 'Allow Unauthorized Certificates',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Allow connections to servers with invalid/expired SSL certificates (not recommended for production)'
    },

    // General Settings
    {
      name: 'enabled',
      label: 'Enabled',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Whether the email trigger is active'
    }
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = []
    const typed = config as unknown as EmailTriggerConfig

    // Validate host
    if (!typed.host || typeof typed.host !== 'string' || typed.host.trim().length === 0) {
      errors.push('IMAP host is required')
    }

    // Validate port
    if (!typed.port || typeof typed.port !== 'number' || typed.port < 1 || typed.port > 65535) {
      errors.push('Valid port number is required (1-65535)')
    }

    // Validate user
    if (!typed.user || typeof typed.user !== 'string' || typed.user.trim().length === 0) {
      errors.push('Username/email is required')
    }

    // Validate password
    if (!typed.password || typeof typed.password !== 'string' || typed.password.trim().length === 0) {
      errors.push('Password is required')
    }

    // Validate mailbox
    if (typed.mailbox && typeof typed.mailbox !== 'string') {
      errors.push('Mailbox must be a string')
    }

    // Validate postProcessAction
    if (typed.postProcessAction && !['read', 'nothing'].includes(typed.postProcessAction)) {
      errors.push('Invalid post-process action')
    }

    // Validate format
    if (typed.format && !['simple', 'resolved', 'raw'].includes(typed.format)) {
      errors.push('Invalid output format')
    }

    // Validate customEmailRules JSON
    if (typed.customEmailRules && typeof typed.customEmailRules === 'string') {
      try {
        JSON.parse(typed.customEmailRules)
      } catch {
        errors.push('Custom email rules must be valid JSON')
      }
    }

    // Validate forceReconnect
    if (typed.forceReconnect !== undefined) {
      if (typeof typed.forceReconnect !== 'number' || typed.forceReconnect < 0) {
        errors.push('Force reconnect interval must be a positive number or 0 to disable')
      }
    }

    return errors
  },
  getDefaults: (): EmailTriggerConfig => ({
    host: '',
    port: 993,
    secure: true,
    user: '',
    password: '',
    mailbox: 'INBOX',
    postProcessAction: 'read',
    downloadAttachments: false,
    format: 'simple',
    attachmentPrefix: 'attachment_',
    trackLastMessageId: true,
    allowUnauthorizedCerts: false,
    enabled: true
  })
}
