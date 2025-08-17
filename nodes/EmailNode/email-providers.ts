import { v4 as uuidv4 } from 'uuid'
import { EmailNodeConfig, EmailExecutionResult } from './EmailNode.types'
import { 
  NodemailerModule, 
  Transporter, 
  MailOptions, 
  SendMailResult,
  NodeRequire 
} from './nodemailer-types'

/**
 * Email provider utilities with graceful fallback when packages aren't installed
 */

export async function sendWithNodemailer(config: EmailNodeConfig, provider: string): Promise<EmailExecutionResult> {
  const { emailService, to, subject, body, from } = config
  
  try {
    // Try to load nodemailer dynamically
    let nodemailer: NodemailerModule
    
    try {
      // This will fail gracefully if nodemailer isn't installed
      nodemailer = await loadNodemailer()
    } catch (error) {
      // Fallback to simulation
      return simulateEmailSending(config, provider)
    }

    // Create transporter
    const transporter: Transporter = nodemailer.createTransporter({
      host: emailService.host,
      port: emailService.port || 587,
      secure: emailService.secure || false,
      auth: {
        user: emailService.auth.user,
        pass: emailService.auth.pass
      }
    })

    // Prepare email options
    const mailOptions: MailOptions = {
      from: from || emailService.auth.user,
      to: to.join(', '),
      subject,
      text: body
    }

    // Send email
    const info: SendMailResult = await transporter.sendMail(mailOptions)

    return {
      sent: true,
      to,
      subject,
      messageId: info.messageId || uuidv4(),
      timestamp: new Date(),
      provider
    }
  } catch (error) {
    throw new Error(`${provider} error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function sendWithSendGrid(config: EmailNodeConfig): Promise<EmailExecutionResult> {
  const { emailService, to, subject, body, from } = config
  
  if (!emailService.apiKey) {
    throw new Error('SendGrid API key is required')
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailService.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: to.map(email => ({ email }))
        }],
        from: { email: from || emailService.auth.user },
        subject,
        content: [{
          type: 'text/plain',
          value: body
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status} ${response.statusText}`)
    }

    return {
      sent: true,
      to,
      subject,
      messageId: uuidv4(),
      timestamp: new Date(),
      provider: 'SendGrid'
    }
  } catch (error) {
    throw new Error(`SendGrid error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function simulateEmailSending(config: EmailNodeConfig, provider: string): EmailExecutionResult {
  const { emailService, to, subject, body, from } = config
  
  console.warn('📧 Email package not installed - simulating email sending')
  console.log(`Provider: ${provider}`)
  console.log(`From: ${from || emailService.auth.user}`)
  console.log(`To: ${to.join(', ')}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body: ${body}`)
  console.log('💡 To send real emails, install: npm install nodemailer @types/nodemailer')
  
  return {
    sent: true,
    to,
    subject,
    messageId: `sim-${uuidv4()}`,
    timestamp: new Date(),
    provider: `${provider} (Simulated)`
  }
}

async function loadNodemailer(): Promise<NodemailerModule> {
  // Try different methods to load nodemailer without causing build issues
  
  // Check if we're in Node.js environment
  if (typeof window !== 'undefined') {
    throw new Error('Nodemailer only works in Node.js environment')
  }
  
  try {
    // Method 1: Node.js require using createRequire in ESM environments
    const { createRequire } = await import('module')
    const req = createRequire(import.meta.url)
    const mod = req('nodemailer') as unknown as NodemailerModule
    return (mod as any).default ?? mod
  } catch (requireError) {
    try {
      // Method 2: Dynamic import
      const importResult = (await import('nodemailer')) as unknown as NodemailerModule
      return (importResult as any).default ?? importResult
    } catch (importError) {
      // All methods failed
      throw new Error('Nodemailer not available')
    }
  }
}
