import { v4 as uuidv4 } from 'uuid'
import { EmailNodeConfig, EmailExecutionResult } from './EmailNode.types'
import { NodeExecutionContext, NodeExecutionResult } from '../types'
import { sendWithNodemailer, sendWithSendGrid } from './email-providers'

// Email service implementations
class EmailService {
  static async sendEmail(config: EmailNodeConfig): Promise<EmailExecutionResult> {
    const { emailService } = config
    
    switch (emailService.type) {
      case 'sendgrid':
        return await sendWithSendGrid(config)
      case 'gmail':
        return await this.sendWithGmail(config)
      case 'outlook':
        return await this.sendWithOutlook(config)
      case 'smtp':
        return await this.sendWithSMTP(config)
      default:
        throw new Error(`Unsupported email service: ${emailService.type}`)
    }
  }

  private static async sendWithGmail(config: EmailNodeConfig): Promise<EmailExecutionResult> {
    // Gmail uses SMTP with specific settings
    return await sendWithNodemailer({
      ...config,
      emailService: {
        ...config.emailService,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false
      }
    }, 'Gmail')
  }

  private static async sendWithOutlook(config: EmailNodeConfig): Promise<EmailExecutionResult> {
    // Outlook uses SMTP with specific settings
    return await sendWithNodemailer({
      ...config,
      emailService: {
        ...config.emailService,
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false
      }
    }, 'Outlook')
  }

  private static async sendWithSMTP(config: EmailNodeConfig): Promise<EmailExecutionResult> {
    return await sendWithNodemailer(config, 'SMTP')
  }
}

export async function executeEmailNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  try {
    const config = context.config as unknown as EmailNodeConfig
    
    // Validate basic configuration
    if (!Array.isArray(config.to) || config.to.length === 0) {
      return {
        success: false,
        error: 'At least one recipient is required'
      }
    }
    
    if (!config.subject || config.subject.trim().length === 0) {
      return {
        success: false,
        error: 'Subject is required'
      }
    }
    
    if (!config.body || config.body.trim().length === 0) {
      return {
        success: false,
        error: 'Email body is required'
      }
    }

    // Enhanced email service validation with security checks
    if (!config.emailService) {
      return {
        success: false,
        error: 'Email service configuration is required'
      }
    }

    // Validate service type
    if (!config.emailService.type || !['smtp', 'gmail', 'outlook', 'sendgrid'].includes(config.emailService.type)) {
      return {
        success: false,
        error: 'Valid email service type is required (smtp, gmail, outlook, sendgrid)'
      }
    }

    // Validate email address format
    if (!config.emailService.auth?.user) {
      return {
        success: false,
        error: 'Email address is required'
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(config.emailService.auth.user)) {
      return {
        success: false,
        error: 'Valid email address format is required'
      }
    }

    // For SendGrid, validate API key format
    if (config.emailService.type === 'sendgrid') {
      if (!config.emailService.apiKey) {
        return {
          success: false,
          error: 'SendGrid API key is required'
        }
      }
      if (!config.emailService.apiKey.startsWith('SG.')) {
        return {
          success: false,
          error: 'SendGrid API key should start with "SG."'
        }
      }
    } else {
      // For other services, validate password
      if (!config.emailService.auth?.pass) {
        return {
          success: false,
          error: 'Password or app-specific password is required'
        }
      }
      if (config.emailService.auth.pass.length < 6) {
        return {
          success: false,
          error: 'Password should be at least 6 characters long'
        }
      }
    }

    // Validate SMTP-specific settings
    if (config.emailService.type === 'smtp') {
      if (!config.emailService.host || config.emailService.host.trim().length === 0) {
        return {
          success: false,
          error: 'SMTP host is required for SMTP service'
        }
      }
      if (config.emailService.port && (config.emailService.port < 1 || config.emailService.port > 65535)) {
        return {
          success: false,
          error: 'SMTP port must be between 1 and 65535'
        }
      }
    }

    // Check for abort signal
    if (context.signal?.aborted) {
      return {
        success: false,
        error: 'Execution was cancelled'
      }
    }
    
    // Send real email using the configured service
    const result = await EmailService.sendEmail(config)
    
    return {
      success: true,
      output: result
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}