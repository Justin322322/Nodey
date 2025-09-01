import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ImapSimple } from 'imap-simple'
import { EmailTriggerService } from '../../server/services/email-trigger.service'
import { EmailTriggerConfig } from './EmailTriggerNode.types'

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

// Mock IMAP dependencies
vi.mock('imap-simple', () => ({
  connect: vi.fn(),
  default: vi.fn(),
}))

vi.mock('mailparser', () => ({
  simpleParser: vi.fn(),
}))

describe('EmailTriggerService', () => {
  let service: EmailTriggerService
  let mockConfig: EmailTriggerConfig

  beforeEach(() => {
    service = new EmailTriggerService()
    mockConfig = {
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      user: 'test@example.com',
      password: 'password',
      mailbox: 'INBOX',
      postProcessAction: 'read',
      downloadAttachments: false,
      format: 'simple',
      attachmentPrefix: 'attachment_',
      trackLastMessageId: true,
      allowUnauthorizedCerts: false,
      enabled: true
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('connect', () => {
    it('should connect to IMAP server successfully', async () => {
      // Mock successful connection
      const mockConnection = {
        openBox: vi.fn().mockResolvedValue(undefined),
        end: vi.fn(),
        closeBox: vi.fn(),
      }

      const { connect } = await import('imap-simple')
      vi.mocked(connect).mockResolvedValue(mockConnection as unknown as ImapSimple)

      await service.connect(mockConfig)

      expect(service.isConnectedToServer()).toBe(true)
      expect(connect).toHaveBeenCalledWith({
        imap: {
          user: mockConfig.user,
          password: mockConfig.password,
          host: mockConfig.host,
          port: mockConfig.port,
          tls: mockConfig.secure,
          authTimeout: 20000,
          tlsOptions: {
            servername: mockConfig.host,
          },
        },
        onmail: expect.any(Function),
        onupdate: expect.any(Function),
      })
    })

    it('should handle connection errors', async () => {
      const { connect } = await import('imap-simple')
      vi.mocked(connect).mockRejectedValue(new Error('Connection failed'))

      await expect(service.connect(mockConfig)).rejects.toThrow('Connection failed')
      expect(service.isConnectedToServer()).toBe(false)
    })

    it('should configure TLS options when allowUnauthorizedCerts is true', async () => {
      const configWithTls = { ...mockConfig, allowUnauthorizedCerts: true }

      const mockConnection = {
        openBox: vi.fn().mockResolvedValue(undefined),
        end: vi.fn(),
        closeBox: vi.fn(),
      }

      const { connect } = await import('imap-simple')
      vi.mocked(connect).mockResolvedValue(mockConnection as unknown as ImapSimple)

      await service.connect(configWithTls)

      expect(connect).toHaveBeenCalledWith({
        imap: {
          user: configWithTls.user,
          password: configWithTls.password,
          host: configWithTls.host,
          port: configWithTls.port,
          tls: configWithTls.secure,
          authTimeout: 20000,
          tlsOptions: {
            rejectUnauthorized: false,
            servername: configWithTls.host,
          },
        },
        onmail: expect.any(Function),
        onupdate: expect.any(Function),
      })
    })
  })

  describe('disconnect', () => {
    it('should disconnect from IMAP server', async () => {
      const mockConnection = {
        openBox: vi.fn().mockResolvedValue(undefined),
        end: vi.fn(),
        closeBox: vi.fn().mockResolvedValue(undefined),
      }

      const { connect } = await import('imap-simple')
      vi.mocked(connect).mockResolvedValue(mockConnection as unknown as ImapSimple)

      await service.connect(mockConfig)
      await service.disconnect()

      expect(mockConnection.closeBox).toHaveBeenCalledWith(false)
      expect(mockConnection.end).toHaveBeenCalled()
      expect(service.isConnectedToServer()).toBe(false)
    })

    it('should handle disconnect errors gracefully', async () => {
      const mockConnection = {
        openBox: vi.fn().mockResolvedValue(undefined),
        end: vi.fn().mockRejectedValue(new Error('Disconnect error')),
        closeBox: vi.fn().mockRejectedValue(new Error('Close error')),
      }

      const { connect } = await import('imap-simple')
      vi.mocked(connect).mockResolvedValue(mockConnection as unknown as ImapSimple)

      await service.connect(mockConfig)
      await service.disconnect()

      expect(service.isConnectedToServer()).toBe(false)
    })
  })

  describe('fetchEmails', () => {
    it('should throw error when not connected', async () => {
      await expect(service.fetchEmails(mockConfig)).rejects.toThrow('Not connected to IMAP server')
    })

    it('should parse custom email rules JSON', async () => {
      const configWithRules = {
        ...mockConfig,
        customEmailRules: '["UNSEEN", ["SINCE", "1-Jan-2024"]]'
      }

      const mockConnection = {
        openBox: vi.fn().mockResolvedValue(undefined),
        search: vi.fn().mockResolvedValue([]),
        end: vi.fn(),
        closeBox: vi.fn(),
      }

      const { connect } = await import('imap-simple')
      vi.mocked(connect).mockResolvedValue(mockConnection as unknown as ImapSimple)

      await service.connect(mockConfig)
      await service.fetchEmails(configWithRules)

      expect(mockConnection.search).toHaveBeenCalledWith(
        ['UNSEEN', 'UNSEEN', ['SINCE', '1-Jan-2024']],
        {
          bodies: ['HEADER', 'TEXT'],
          markSeen: true,
        }
      )
    })

    it('should throw error for invalid custom email rules JSON', async () => {
      const configWithInvalidRules = {
        ...mockConfig,
        customEmailRules: 'invalid json'
      }

      const mockConnection = {
        openBox: vi.fn().mockResolvedValue(undefined),
        search: vi.fn(),
        end: vi.fn(),
        closeBox: vi.fn(),
      }

      const { connect } = await import('imap-simple')
      vi.mocked(connect).mockResolvedValue(mockConnection as unknown as ImapSimple)

      await service.connect(mockConfig)
      await expect(service.fetchEmails(configWithInvalidRules)).rejects.toThrow('Invalid custom email rules JSON')
    })
  })

  describe('isConnectedToServer', () => {
    it('should return connection status', () => {
      expect(service.isConnectedToServer()).toBe(false)
    })
  })
})

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
