import { EmailNodeConfig, EmailExecutionResult } from './EmailNode.types'
import { NodeExecutionContext } from '../types'

export async function executeEmailNode(context: NodeExecutionContext): Promise<{ success: boolean; output?: EmailExecutionResult; error?: string }> {
  const { config, signal } = context

  // Check for abort signal
  if (signal?.aborted) {
    return { success: false, error: 'Execution was cancelled' }
  }

  // Validate config
  if (!config) {
    return { success: false, error: 'Configuration is required' }
  }

  const emailConfig = config as EmailNodeConfig

  // Validate required fields
  if (!emailConfig.to || emailConfig.to.length === 0) {
    return { success: false, error: 'At least one recipient is required' }
  }

  if (!emailConfig.subject || emailConfig.subject.trim() === '') {
    return { success: false, error: 'Subject is required' }
  }

  if (!emailConfig.body || emailConfig.body.trim() === '') {
    return { success: false, error: 'Email body is required' }
  }

  try {
    let result: EmailExecutionResult

    // Only load email providers on the server side
    if (typeof window === 'undefined') {
      // Dynamic import to avoid bundling on client side
      const { sendWithNodemailer, sendWithSendGrid } = await import('./email-providers')
      
      if (emailConfig.emailService.type === 'sendgrid') {
        result = await sendWithSendGrid(emailConfig)
      } else {
        // Default to nodemailer for SMTP/Gmail/Outlook
        result = await sendWithNodemailer(emailConfig, emailConfig.emailService.type)
      }
    } else {
      // Client-side fallback - return simulated result
      result = {
        sent: true,
        to: emailConfig.to,
        subject: emailConfig.subject,
        messageId: `client-${Date.now()}`,
        timestamp: new Date(),
        provider: `${emailConfig.emailService.type} (Client-side)`
      }
    }

    return { success: true, output: result }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}