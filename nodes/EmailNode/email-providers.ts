import { v4 as uuidv4 } from 'uuid'
import { EmailNodeConfig, EmailExecutionResult } from './EmailNode.types'
import { Transporter, MailOptions, SendMailResult } from './nodemailer-types'
import type { Transporter as NodemailerTransporter } from 'nodemailer'

/**
 * Email provider utilities with graceful fallback when packages aren't installed
 */

export async function sendWithNodemailer(config: EmailNodeConfig, provider: string): Promise<EmailExecutionResult> {
  // Only allow on server side
  if (typeof window !== 'undefined') {
    throw new Error('Email sending can only be performed on the server side')
  }
  
  const { emailService, to, subject, body, from } = config

  try {
    // Create transporter using the loaded nodemailer module
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transporter: NodemailerTransporter = await getNodemailerTransporter({
      host: emailService.host,
      port: emailService.port || 587,
      secure: emailService.secure || false,
      auth: {
        user: emailService.auth.user,
        pass: emailService.auth.pass
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // Prepare email options
    const mailOptions: MailOptions = {
      from: from || emailService.auth.user,
      to: to.join(', '),
      subject,
      text: body
    }

    // Send email
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const info: SendMailResult = await transporter.sendMail(mailOptions) as SendMailResult

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
  // Only allow on server side
  if (typeof window !== 'undefined') {
    throw new Error('Email sending can only be performed on the server side')
  }
  
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
  console.log('To send real emails, install: npm install nodemailer @types/nodemailer')
  
  return {
    sent: true,
    to,
    subject,
    messageId: `sim-${uuidv4()}`,
    timestamp: new Date(),
    provider: `${provider} (Simulated)`
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
let nodemailer: typeof import('nodemailer') | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getNodemailerTransporter(options: any): Promise<NodemailerTransporter> {
  // Only load nodemailer on the server side
  if (typeof window !== 'undefined') {
    throw new Error('Nodemailer can only be used on the server side')
  }
  
  if (!nodemailer) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      nodemailer = require('nodemailer') as typeof import('nodemailer')
    } catch (error) {
      throw new Error('Failed to load nodemailer module')
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return nodemailer.createTransport(options)
}
