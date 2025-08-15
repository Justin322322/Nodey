import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeEmailNode, NodeExecutionContext } from './EmailNode.service'
import { EMAIL_NODE_DEFINITION } from './EmailNode.schema'
import { EmailNodeConfig } from './EmailNode.types'

describe('EmailNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Schema Validation', () => {
    it('should validate valid email configuration', () => {
      const config: EmailNodeConfig = {
        to: ['test@example.com'],
        subject: 'Test Subject',
        body: 'Test body content',
        from: 'sender@example.com'
      }

      const errors = EMAIL_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toHaveLength(0)
    })

    it('should require at least one recipient', () => {
      const config: EmailNodeConfig = {
        to: [],
        subject: 'Test Subject',
        body: 'Test body content'
      }

      const errors = EMAIL_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('At least one recipient (To) is required')
    })

    it('should require subject', () => {
      const config: EmailNodeConfig = {
        to: ['test@example.com'],
        subject: '',
        body: 'Test body content'
      }

      const errors = EMAIL_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Subject is required')
    })

    it('should require body', () => {
      const config: EmailNodeConfig = {
        to: ['test@example.com'],
        subject: 'Test Subject',
        body: ''
      }

      const errors = EMAIL_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Email body is required')
    })

    it('should validate email format for recipients', () => {
      const config: EmailNodeConfig = {
        to: ['invalid-email'],
        subject: 'Test Subject',
        body: 'Test body content'
      }

      const errors = EMAIL_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Invalid email format for recipient 1: invalid-email')
    })

    it('should validate email format for sender', () => {
      const config: EmailNodeConfig = {
        to: ['test@example.com'],
        subject: 'Test Subject',
        body: 'Test body content',
        from: 'invalid-sender-email'
      }

      const errors = EMAIL_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Invalid email format for sender: invalid-sender-email')
    })

    it('should handle multiple recipients', () => {
      const config: EmailNodeConfig = {
        to: ['test1@example.com', 'test2@example.com', 'invalid-email'],
        subject: 'Test Subject',
        body: 'Test body content'
      }

      const errors = EMAIL_NODE_DEFINITION.validate(config as Record<string, unknown>)
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
        attachments: []
      })
    })
  })

  describe('Email Execution', () => {
    it('should execute email successfully with valid configuration', async () => {
      const context: NodeExecutionContext = {
        nodeId: 'test-node',
        config: {
          to: ['test@example.com'],
          subject: 'Test Subject',
          body: 'Test body content'
        }
      }

      const result = await executeEmailNode(context)

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
      expect(result.error).toBeUndefined()

      const output = result.output as any
      expect(output.sent).toBe(true)
      expect(output.to).toEqual(['test@example.com'])
      expect(output.subject).toBe('Test Subject')
      expect(output.messageId).toBeDefined()
      expect(output.timestamp).toBeInstanceOf(Date)
    })

    it('should fail with missing recipients', async () => {
      const context: NodeExecutionContext = {
        nodeId: 'test-node',
        config: {
          to: [],
          subject: 'Test Subject',
          body: 'Test body content'
        }
      }

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBe('At least one recipient is required')
      expect(result.output).toBeUndefined()
    })

    it('should fail with missing subject', async () => {
      const context: NodeExecutionContext = {
        nodeId: 'test-node',
        config: {
          to: ['test@example.com'],
          subject: '',
          body: 'Test body content'
        }
      }

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Subject is required')
    })

    it('should fail with missing body', async () => {
      const context: NodeExecutionContext = {
        nodeId: 'test-node',
        config: {
          to: ['test@example.com'],
          subject: 'Test Subject',
          body: ''
        }
      }

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email body is required')
    })

    it('should handle abort signal', async () => {
      const abortController = new AbortController()
      abortController.abort()

      const context: NodeExecutionContext = {
        nodeId: 'test-node',
        config: {
          to: ['test@example.com'],
          subject: 'Test Subject',
          body: 'Test body content'
        },
        signal: abortController.signal
      }

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Execution was cancelled')
    })

    it('should handle multiple recipients', async () => {
      const context: NodeExecutionContext = {
        nodeId: 'test-node',
        config: {
          to: ['test1@example.com', 'test2@example.com'],
          subject: 'Test Subject',
          body: 'Test body content'
        }
      }

      const result = await executeEmailNode(context)

      expect(result.success).toBe(true)
      const output = result.output as any
      expect(output.to).toEqual(['test1@example.com', 'test2@example.com'])
    })

    it('should handle execution errors gracefully', async () => {
      // Mock an error by providing invalid config type
      const context: NodeExecutionContext = {
        nodeId: 'test-node',
        config: null as any
      }

      const result = await executeEmailNode(context)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(typeof result.error).toBe('string')
    })
  })
})