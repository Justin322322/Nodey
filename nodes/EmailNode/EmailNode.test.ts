import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeEmailNode } from './EmailNode.service'
import { NodeExecutionContext, createTestContext } from '../types'
import { EMAIL_NODE_DEFINITION } from './EmailNode.schema'
import { EmailNodeConfig, EmailExecutionResult } from './EmailNode.types'

// Mock the email provider functions
vi.mock('./email-providers', () => ({
  sendWithNodemailer: vi.fn().mockImplementation((config: EmailNodeConfig) => Promise.resolve({
    sent: true,
    to: config.to,
    subject: config.subject,
    messageId: 'test-message-id',
    timestamp: new Date(),
    provider: 'Gmail'
  })),
  sendWithSendGrid: vi.fn().mockImplementation((config: EmailNodeConfig) => Promise.resolve({
    sent: true,
    to: config.to,
    subject: config.subject,
    messageId: 'test-message-id',
    timestamp: new Date(),
    provider: 'SendGrid'
  }))
}))

// Mock the email provider functions to avoid actual email sending in tests

// Helper function to create test email config with required emailService
function createTestEmailConfig(overrides: Partial<EmailNodeConfig> = {}): EmailNodeConfig {
  return {
    to: ['test@example.com'],
    subject: 'Test Subject',
    body: 'Test body content',
    from: undefined,
    attachments: [],
    emailService: {
      type: 'gmail',
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    },
    ...overrides
  }
}

describe('EmailNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Schema Validation', () => {
    it('should validate valid email configuration', () => {
      const config = createTestEmailConfig({
        from: 'sender@example.com'
      })

      const errors = EMAIL_NODE_DEFINITION.validate(config)
      expect(errors).toHaveLength(0)
    })

    it('should require at least one recipient', () => {
      const config = createTestEmailConfig({
        to: []
      })

      const errors = EMAIL_NODE_DEFINITION.validate(config)
      expect(errors).toContain('At least one recipient (To) is required')
    })

    it('should require subject', () => {
      const config = createTestEmailConfig({
        subject: ''
      })

      const errors = EMAIL_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Subject is required')
    })

    it('should require body', () => {
      const config = createTestEmailConfig({
        body: ''
      })

      const errors = EMAIL_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Email body is required')
    })

    it('should validate email format for recipients', () => {
      const config = createTestEmailConfig({
        to: ['invalid-email']
      })

      const errors = EMAIL_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Invalid email format for recipient 1: invalid-email')
    })

    it('should validate email format for sender', () => {
      const config = createTestEmailConfig({
        from: 'invalid-sender-email'
      })

      const errors = EMAIL_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Invalid email format for sender: invalid-sender-email')
    })

    it('should handle multiple recipients', () => {
      const config = createTestEmailConfig({
        to: ['test1@example.com', 'test2@example.com', 'invalid-email']
      })

      const errors = EMAIL_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Invalid email format for recipient 3: invalid-email')
      expect(errors).toHaveLength(1)
    })
  })

  describe('Default Configuration', () => {
    it('should provide correct defaults', () => {
      const defaults = EMAIL_NODE_DEFINITION.getDefaults()
      
      expect(defaults).toEqual({
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
    })
  })

  describe('Email Execution', () => {
    it('should execute email successfully with valid configuration', async () => {
      const config = createTestEmailConfig()
      const context = createTestContext({ config })

      const result = await executeEmailNode(context)

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
      expect(result.error).toBeUndefined()

      const output = result.output as EmailExecutionResult
      expect(output.sent).toBe(true)
      expect(output.to).toEqual(['test@example.com'])
      expect(output.subject).toBe('Test Subject')
      expect(output.messageId).toBeDefined()
      expect(output.timestamp).toBeInstanceOf(Date)
    })

    it('should fail with missing recipients', async () => {
      const config = createTestEmailConfig({ to: [] })
      const context = createTestContext({ config })

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBe('At least one recipient is required')
      expect(result.output).toBeUndefined()
    })

    it('should fail with missing subject', async () => {
      const config = createTestEmailConfig({ subject: '' })
      const context = createTestContext({ config })

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Subject is required')
    })

    it('should fail with missing body', async () => {
      const config = createTestEmailConfig({ body: '' })
      const context = createTestContext({ config })

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email body is required')
    })

    it('should handle abort signal', async () => {
      const abortController = new AbortController()
      abortController.abort()

      const config = createTestEmailConfig()
      const context = createTestContext({
        config,
        signal: abortController.signal
      })

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Execution was cancelled')
    })

    it('should handle multiple recipients', async () => {
      const config = createTestEmailConfig({
        to: ['test1@example.com', 'test2@example.com']
      })
      const context = createTestContext({ config })

      const result = await executeEmailNode(context)

      expect(result.success).toBe(true)
      const output = result.output as EmailExecutionResult
      expect(output.to).toEqual(['test1@example.com', 'test2@example.com'])
    })

    it('should handle execution errors gracefully', async () => {
      // Mock an error by providing invalid config type
      const context = createTestContext({
        config: null as unknown as EmailNodeConfig
      })

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(typeof result.error).toBe('string')
    })
  })
})