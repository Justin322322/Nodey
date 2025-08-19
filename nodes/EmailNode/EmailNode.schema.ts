import { NodeType, ActionType } from '@/types/workflow'
import { EmailNodeConfig } from './EmailNode.types'
import { ParameterDefinition, NodeDefinition } from '../index'

export const EMAIL_NODE_DEFINITION: NodeDefinition<EmailNodeConfig> = {
  nodeType: NodeType.ACTION,
  subType: ActionType.EMAIL,
  label: 'Send Email',
  description: 'Send an email message',
  parameters: [
    { 
      path: 'to',
      label: 'To', 
      type: 'stringList', 
      required: true, 
      defaultValue: [],
      description: 'Email recipients',
      placeholder: 'Enter email addresses'
    },
    { 
      path: 'subject',
      label: 'Subject', 
      type: 'text', 
      required: true, 
      defaultValue: '',
      description: 'Email subject line',
      placeholder: 'Enter email subject'
    },
    { 
      path: 'body',
      label: 'Body', 
      type: 'textarea', 
      required: true, 
      defaultValue: '',
      description: 'Email message content',
      placeholder: 'Enter email content'
    },
    {
      path: 'from',
      label: 'From',
      type: 'email',
      required: false,
      description: 'Sender email address (optional)',
      placeholder: 'sender@example.com'
    },
    // Email Service Configuration
    {
      path: 'emailService.type',
      label: 'Email Provider',
      type: 'select',
      required: true,
      defaultValue: 'gmail',
      description: 'Choose your email service provider',
      options: [
        { label: 'Gmail', value: 'gmail' },
        { label: 'Outlook', value: 'outlook' },
        { label: 'SendGrid', value: 'sendgrid' },
        { label: 'Custom SMTP', value: 'smtp' }
      ]
    },
    {
      path: 'emailService.auth.user',
      label: 'Email Address',
      type: 'email',
      required: true,
      description: 'Your email address',
      placeholder: 'your.email@gmail.com'
    },
    {
      path: 'emailService.auth.pass',
      label: 'Password/App Password',
      type: 'password',
      required: true,
      description: 'Your email password or app-specific password',
      placeholder: 'Enter your app password'
    },
    {
      path: 'emailService.apiKey',
      label: 'SendGrid API Key',
      type: 'password',
      required: true,
      description: 'Your SendGrid API key',
      placeholder: 'SG.xxxxxxxx',
      showIf: [{ path: 'emailService.type', equals: 'sendgrid' }]
    },
    {
      path: 'emailService.host',
      label: 'SMTP Host',
      type: 'text',
      required: true,
      description: 'SMTP server hostname',
      placeholder: 'smtp.example.com',
      showIf: [{ path: 'emailService.type', equals: 'smtp' }]
    },
    {
      path: 'emailService.port',
      label: 'SMTP Port',
      type: 'number',
      required: false,
      defaultValue: 587,
      description: 'SMTP server port (587 for TLS, 465 for SSL)',
      showIf: [{ path: 'emailService.type', equals: 'smtp' }]
    },
    {
      path: 'emailService.secure',
      label: 'Use SSL',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Use SSL connection (true for port 465)',
      showIf: [{ path: 'emailService.type', equals: 'smtp' }]
    }
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = []
    const typed = config as EmailNodeConfig
    
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

    // Validate email service configuration
    if (!typed.emailService) {
      errors.push('Email service configuration is required')
    } else {
      if (!typed.emailService.type) {
        errors.push('Email service type is required')
      }

      if (!typed.emailService.auth?.user) {
        errors.push('Email address is required')
      } else if (!isValidEmail(typed.emailService.auth.user)) {
        errors.push('Invalid email address format')
      }

      if (typed.emailService.type === 'sendgrid') {
        if (!typed.emailService.apiKey) {
          errors.push('SendGrid API key is required')
        }
      } else {
        if (!typed.emailService.auth?.pass) {
          errors.push('Email password/app password is required')
        }
      }

      if (typed.emailService.type === 'smtp') {
        if (!typed.emailService.host) {
          errors.push('SMTP host is required')
        }
      }
    }
    
    return errors
  },
  getDefaults: (): EmailNodeConfig => ({
    to: [],
    subject: '',
    body: '',
    from: undefined,
    attachments: [],
    emailService: {
      type: 'gmail',
      auth: {
        user: '',
        pass: ''
      }
    }
  })
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}