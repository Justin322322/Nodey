/**
 * Minimal TypeScript interfaces for nodemailer to avoid any types
 * This provides type safety without requiring the actual @types/nodemailer package
 */

export interface MailOptions {
  from?: string
  to: string
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename?: string
    content?: Buffer | string
    path?: string
  }>
}

export interface SendMailResult {
  messageId: string
  envelope?: {
    from: string
    to: string[]
  }
  accepted?: string[]
  rejected?: string[]
  pending?: string[]
  response?: string
}

export interface TransportOptions {
  host?: string
  port?: number
  secure?: boolean
  auth?: {
    user: string
    pass: string
  }
  service?: string
}

export interface Transporter {
  sendMail: (mailOptions: MailOptions) => Promise<SendMailResult>
  verify?: () => Promise<boolean>
  close?: () => void
}

export interface NodemailerModule {
  createTransporter: (options: TransportOptions) => Transporter
  createTransport?: (options: TransportOptions) => Transporter
  default?: NodemailerModule
}

export interface NodeRequire {
  (id: string): unknown
}

declare global {
  namespace NodeJS {
    interface Global {
      require?: NodeRequire
    }
  }
}
