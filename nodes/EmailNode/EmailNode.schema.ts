import { NodeType, ActionType } from '@/types/workflow'
import { EmailNodeConfig } from './EmailNode.types'

export interface ParameterDefinition {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'email' | 'url'
  required?: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  description?: string
}

export interface NodeDefinition {
  nodeType: NodeType
  subType: ActionType
  label: string
  description: string
  parameters: ParameterDefinition[]
  validate: (config: Record<string, unknown>) => string[]
  getDefaults: () => EmailNodeConfig
}

export const EMAIL_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.ACTION,
  subType: ActionType.EMAIL,
  label: 'Send Email',
  description: 'Send an email message',
  parameters: [
    { 
      name: 'to',
      label: 'To', 
      type: 'email', 
      required: true, 
      defaultValue: [],
      description: 'Email recipients',
      placeholder: 'Enter email addresses'
    },
    { 
      name: 'subject',
      label: 'Subject', 
      type: 'text', 
      required: true, 
      defaultValue: '',
      description: 'Email subject line',
      placeholder: 'Enter email subject'
    },
    { 
      name: 'body',
      label: 'Body', 
      type: 'textarea', 
      required: true, 
      defaultValue: '',
      description: 'Email message content',
      placeholder: 'Enter email content'
    },
    {
      name: 'from',
      label: 'From',
      type: 'email',
      required: false,
      description: 'Sender email address (optional)',
      placeholder: 'sender@example.com'
    }
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = []
    const typed = config as unknown as EmailNodeConfig
    
    if (!Array.isArray(typed.to) || typed.to.length === 0) {
      errors.push('At least one recipient (To) is required')
    }
    
    if (Array.isArray(typed.to)) {
      typed.to.forEach((email, index) => {
        if (!email || typeof email !== 'string' || email.trim().length === 0) {
          errors.push(`Recipient ${index + 1} cannot be empty`)
        } else if (!isValidEmail(email.trim())) {
          errors.push(`Invalid email format for recipient ${index + 1}: ${email}`)
        }
      })
    }
    
    if (!typed.subject || typeof typed.subject !== 'string' || typed.subject.trim().length === 0) {
      errors.push('Subject is required')
    }
    
    if (!typed.body || typeof typed.body !== 'string' || typed.body.trim().length === 0) {
      errors.push('Email body is required')
    }
    
    if (typed.from && typeof typed.from === 'string' && typed.from.trim().length > 0) {
      if (!isValidEmail(typed.from.trim())) {
        errors.push(`Invalid email format for sender: ${typed.from}`)
      }
    }
    
    return errors
  },
  getDefaults: (): EmailNodeConfig => ({
    to: [],
    subject: '',
    body: '',
    from: undefined,
    attachments: []
  })
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}