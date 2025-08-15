import { v4 as uuidv4 } from 'uuid'
import { EmailNodeConfig, EmailExecutionResult } from './EmailNode.types'

export interface NodeExecutionContext {
  nodeId: string
  config: Record<string, unknown>
  previousOutput?: unknown
  signal?: AbortSignal
}

export interface NodeExecutionResult {
  success: boolean
  output?: unknown
  error?: string
}

export async function executeEmailNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  try {
    const config = context.config as unknown as EmailNodeConfig
    
    // Validate configuration
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
    
    // Check for abort signal
    if (context.signal?.aborted) {
      return {
        success: false,
        error: 'Execution was cancelled'
      }
    }
    
    // Mock email sending - in a real implementation, this would use an email service
    // like SendGrid, AWS SES, or SMTP
    const result: EmailExecutionResult = {
      sent: true,
      to: config.to,
      subject: config.subject,
      messageId: uuidv4(),
      timestamp: new Date()
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
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