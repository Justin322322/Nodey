import { ImapSimple, ImapSimpleOptions, Message } from 'imap-simple'
import { connect } from 'imap-simple'
import { simpleParser, ParsedMail } from 'mailparser'
import { EmailTriggerConfig, EmailMessage, EmailAttachment, EmailAddress } from '@/nodes/EmailTriggerNode/EmailTriggerNode.types'

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

export class EmailTriggerService {
  private connection?: ImapSimple
  private isConnected = false

  async connect(config: EmailTriggerConfig): Promise<void> {
    try {
      const imapConfig: ImapSimpleOptions = {
        imap: {
          user: config.user,
          password: config.password,
          host: config.host,
          port: config.port,
          tls: config.secure,
          authTimeout: 20000,
        },
        onmail: (numNewMsgs: number) => {
          console.log(`New emails received: ${numNewMsgs}`)
        },
        onupdate: (seqNo: number, info: unknown) => {
          console.log(`Email update: ${seqNo}`, info)
        },
      }

      // TLS options
      const tlsOptions: Record<string, unknown> = {}
      if (config.allowUnauthorizedCerts) {
        tlsOptions.rejectUnauthorized = false
      }

      if (config.secure) {
        tlsOptions.servername = config.host
      }

      if (Object.keys(tlsOptions).length > 0) {
        imapConfig.imap.tlsOptions = tlsOptions
      }

      const connection = await connect(imapConfig)
      await connection.openBox(config.mailbox || 'INBOX')
      this.connection = connection
      this.isConnected = true
    } catch (error) {
      console.error('Failed to connect to IMAP server:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.closeBox(false)
        this.connection.end()
      } catch (error) {
        console.error('Error disconnecting from IMAP:', error)
      }
      this.connection = undefined
      this.isConnected = false
    }
  }

  async fetchEmails(config: EmailTriggerConfig, lastMessageId?: number): Promise<EmailMessage[]> {
    if (!this.connection || !this.isConnected) {
      throw new Error('Not connected to IMAP server')
    }

    const searchCriteria: (string | string[])[] = ['UNSEEN']

    // Parse custom email rules if provided
    if (config.customEmailRules) {
      try {
        const customRules = JSON.parse(config.customEmailRules) as (string | string[])[]
        searchCriteria.push(...customRules)
      } catch (error) {
        throw new Error('Invalid custom email rules JSON')
      }
    }

    // Filter by last message ID if tracking is enabled
    if (config.trackLastMessageId !== false && lastMessageId) {
      searchCriteria.push(['UID', `${lastMessageId}:*`])
    }

    const messages = await this.connection.search(searchCriteria, {
      bodies: ['HEADER', 'TEXT'],
      markSeen: config.postProcessAction === 'read',
    })

    const emails: EmailMessage[] = []

    for (const message of messages) {
      try {
        const emailMessage = await this.parseEmailMessage(message, config)
        emails.push(emailMessage)
      } catch (error) {
        console.error('Error parsing email message:', error)
      }
    }

    return emails
  }

  private async parseEmailMessage(
    message: Message,
    config: EmailTriggerConfig
  ): Promise<EmailMessage> {
    if (!this.connection || !this.isConnected) {
      throw new Error('Not connected to IMAP server')
    }

    const all = message.parts.find((part) => part.which === '')
    if (!all) {
      throw new Error('No message body found')
    }

    const id = message.attributes.uid.toString()
    const idHeader = 'Imap-Id: ' + id + '\r\n\r\n'
    const emailRaw = idHeader + all.body

    // Parse with mailparser
    const parsed: ParsedMail = await simpleParser(emailRaw)

    // Extract text and HTML content
    let textContent = ''
    let htmlContent = ''

    if (parsed.text) {
      textContent = parsed.text
    }

    if (parsed.html) {
      htmlContent = parsed.html.toString()
    }

    // Handle attachments
    const attachments: EmailAttachment[] = []
    if (config.downloadAttachments && parsed.attachments) {
      for (const attachment of parsed.attachments) {
        if (attachment.type === 'attachment') {
          attachments.push({
            filename: attachment.filename || 'attachment',
            contentType: attachment.contentType || 'application/octet-stream',
            size: attachment.size || 0,
            content: attachment.content as Buffer,
          })
        }
      }
    }

    // Parse addresses
    const parseAddresses = (addresses: ParsedMail['from'] | ParsedMail['to'] | ParsedMail['cc'] | ParsedMail['bcc']): EmailAddress[] => {
      if (!addresses) return []

      // Handle different address formats from mailparser
      if (Array.isArray(addresses)) {
        return addresses.map((addr): EmailAddress => ({
          name: typeof addr === 'object' && addr && 'name' in addr ? String(addr.name || '') : undefined,
          address: typeof addr === 'object' && addr && 'address' in addr ? String(addr.address || '') : '',
        })).filter((addr) => addr.address)
      }

      if (typeof addresses === 'object' && addresses && 'address' in addresses) {
        return [{
          name: 'name' in addresses ? String(addresses.name || '') : undefined,
          address: String(addresses.address || ''),
        }]
      }

      return []
    }

    const emailMessage: EmailMessage = {
      id,
      uid: message.attributes.uid,
      subject: parsed.subject || '',
      from: parseAddresses(parsed.from),
      to: parseAddresses(parsed.to),
      cc: parseAddresses(parsed.cc),
      bcc: parseAddresses(parsed.bcc),
      date: parsed.date || new Date(),
      text: textContent,
      html: htmlContent,
      attachments,
      headers: (() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const headerMap = parsed.headers
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const entries = Array.from(headerMap.entries())
        const headers: Record<string, string> = {}
        for (let i = 0; i < entries.length; i++) {
          const [key, value] = entries[i]
          headers[key] = typeof value === 'string' ? value : String(value)
        }
        return headers
      })(),
    }

    // Add raw content if requested
    if (config.format === 'raw') {
      emailMessage.raw = Buffer.from(emailRaw).toString('base64')
    }

    return emailMessage
  }

  async markAsRead(messageId: number): Promise<void> {
    if (!this.connection || !this.isConnected) {
      throw new Error('Not connected to IMAP server')
    }

    await this.connection.addFlags([messageId], '\\Seen')
  }

  async getLastMessageId(): Promise<number | undefined> {
    if (!this.connection || !this.isConnected) {
      return undefined
    }

    const messages: Message[] = await this.connection.search(['ALL'], { bodies: [] })
    if (messages.length === 0) {
      return undefined
    }

    return Math.max(...messages.map((msg: Message) => msg.attributes.uid as number))
  }

  isConnectedToServer(): boolean {
    return this.isConnected
  }

  getConnection(): ImapSimple | undefined {
    return this.connection
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */