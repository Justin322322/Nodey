import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebhookNodeService } from './WebhookNode.service'
import { NodeExecutionContext, createTestContext } from '../types'
import { WEBHOOK_NODE_DEFINITION, validateWebhookSignature, generateWebhookSignature } from './WebhookNode.schema'
import { WebhookNodeConfig, WebhookExecutionResult } from './WebhookNode.types'

describe('WebhookNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Schema Validation', () => {
    it('should validate valid webhook configuration', () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        secret: 'my-secret-key',
        signatureHeader: 'x-webhook-signature',
        responseMode: 'async',
        responseCode: 200,
        enabled: true
      }

      const errors = WEBHOOK_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toHaveLength(0)
    })

    it('should require HTTP method', () => {
      const config: WebhookNodeConfig = {
        method: '' as unknown as WebhookNodeConfig['method']
      }

      const errors = WEBHOOK_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('HTTP method is required')
    })

    it('should validate HTTP method values', () => {
      const config: WebhookNodeConfig = {
        method: 'INVALID' as unknown as WebhookNodeConfig['method']
      }

      const errors = WEBHOOK_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Invalid HTTP method')
    })

    it('should require signature header when secret is provided', () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        secret: 'my-secret',
        signatureHeader: ''
      }

      const errors = WEBHOOK_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Signature header is required when secret is provided')
    })

    it('should validate response code range', () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        responseCode: 999
      }

      const errors = WEBHOOK_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Response code must be a valid HTTP status code (100-599)')
    })

    it('should validate JSON response body', () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        responseBody: 'invalid json {'
      }

      const errors = WEBHOOK_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Response body must be valid JSON')
    })

    it('should accept valid HTTP methods', () => {
      const methods: Array<WebhookNodeConfig['method']> = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

      methods.forEach(method => {
        const config: WebhookNodeConfig = { method }
        const errors = WEBHOOK_NODE_DEFINITION.validate(config as Record<string, unknown>)
        expect(errors, `Failed for method: ${method}`).toHaveLength(0)
      })
    })

    it('should validate response modes', () => {
      const validConfig: WebhookNodeConfig = {
        method: 'POST',
        responseMode: 'sync'
      }

      const invalidConfig: WebhookNodeConfig = {
        method: 'POST',
        responseMode: 'invalid' as unknown as WebhookNodeConfig['responseMode']
      }

      expect(WEBHOOK_NODE_DEFINITION.validate(validConfig as Record<string, unknown>)).toHaveLength(0)
      expect(WEBHOOK_NODE_DEFINITION.validate(invalidConfig as Record<string, unknown>))
        .toContain('Invalid response mode')
    })
  })

  describe('Default Configuration', () => {
    it('should provide correct defaults', () => {
      const defaults = WEBHOOK_NODE_DEFINITION.getDefaults()
      
      expect(defaults).toEqual({
        method: 'POST',
        signatureHeader: 'x-webhook-signature',
        responseMode: 'async',
        responseCode: 200,
        responseBody: '{"success": true, "message": "Webhook received"}',
        enabled: true
      })
    })
  })

  describe('Service Validation', () => {
    it('should validate webhook with valid configuration', () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        secret: 'secure-secret-key',
        signatureHeader: 'x-signature',
        responseMode: 'async',
        enabled: true
      }

      const result = WebhookNodeService.validateWebhook(config)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should warn about missing secret', () => {
      const config: WebhookNodeConfig = {
        method: 'POST'
      }

      const result = WebhookNodeService.validateWebhook(config)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings).toContain('No webhook secret configured. Consider adding one for security.')
    })

    it('should warn about short secret', () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        secret: 'short',
        signatureHeader: 'x-sig'
      }

      const result = WebhookNodeService.validateWebhook(config)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings).toContain('Webhook secret should be at least 8 characters for security')
    })

    it('should reject missing signature header with secret', () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        secret: 'my-secret-key'
      }

      const result = WebhookNodeService.validateWebhook(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Signature header is required when secret is provided')
    })
  })

  describe('Signature Validation', () => {
    it('should validate correct signature', () => {
      const payload = 'test payload'
      const secret = 'test-secret'
      const signature = generateWebhookSignature(payload, secret)

      const result = WebhookNodeService.validateSignature(payload, signature, secret)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid signature', () => {
      const payload = 'test payload'
      const secret = 'test-secret'
      const invalidSignature = 'invalid-signature'

      const result = WebhookNodeService.validateSignature(payload, invalidSignature, secret)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid signature')
    })

    it('should reject missing signature when secret provided', () => {
      const payload = 'test payload'
      const secret = 'test-secret'

      const result = WebhookNodeService.validateSignature(payload, '', secret)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Signature required but not provided')
    })

    it('should accept missing signature when no secret', () => {
      const payload = 'test payload'

      const result = WebhookNodeService.validateSignature(payload, '', '')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('Webhook Request Processing', () => {
    it('should process valid webhook request', async () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        enabled: true
      }

      const request = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { test: 'data' }
      }

      const result = await WebhookNodeService.processWebhookRequest(config, request)

      expect(result.triggered).toBe(true)
      expect(result.method).toBe('POST')
      expect(result.body).toEqual({ test: 'data' })
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should reject method mismatch', async () => {
      const config: WebhookNodeConfig = {
        method: 'POST'
      }

      const request = {
        method: 'GET',
        headers: {},
        body: {}
      }

      const result = await WebhookNodeService.processWebhookRequest(config, request)

      expect(result.triggered).toBe(false)
      expect(result.reason).toBe('Method mismatch: expected POST, got GET')
    })

    it('should verify signature when configured', async () => {
      const secret = 'test-secret'
      const payload = JSON.stringify({ test: 'data' })
      const signature = generateWebhookSignature(payload, secret)

      const config: WebhookNodeConfig = {
        method: 'POST',
        secret,
        signatureHeader: 'x-signature'
      }

      const request = {
        method: 'POST',
        headers: { 'x-signature': signature },
        body: { test: 'data' }
      }

      const result = await WebhookNodeService.processWebhookRequest(config, request)

      expect(result.triggered).toBe(true)
      expect(result.signatureVerified).toBe(true)
    })

    it('should reject invalid signature', async () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        secret: 'test-secret',
        signatureHeader: 'x-signature'
      }

      const request = {
        method: 'POST',
        headers: { 'x-signature': 'invalid-signature' },
        body: { test: 'data' }
      }

      const result = await WebhookNodeService.processWebhookRequest(config, request)

      expect(result.triggered).toBe(false)
      expect(result.signatureVerified).toBe(false)
      expect(result.reason).toContain('Signature verification failed')
    })
  })

  describe('Webhook Execution', () => {
    it('should execute webhook successfully with valid configuration', async () => {
      const context = createTestContext({
        nodeId: 'test-webhook-node',
        config: {
          method: 'POST',
          enabled: true
        }
      })

      const result = await WebhookNodeService.execute(context)

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
      expect(result.error).toBeUndefined()

      const output = result.output as WebhookExecutionResult
      expect(output.triggered).toBe(true)
      expect(output.method).toBe('POST')
      expect(output.url).toContain('/api/webhooks/test-webhook-node')
      expect(output.timestamp).toBeInstanceOf(Date)
    })

    it('should handle disabled webhook', async () => {
      const context = createTestContext({
        config: {
          method: 'POST',
          enabled: false
        }
      })

      const result = await WebhookNodeService.execute(context)

      expect(result.success).toBe(true)
      const output = result.output as WebhookExecutionResult
      expect(output.triggered).toBe(false)
      expect(output.reason).toBe('Webhook disabled')
    })

    it('should fail with invalid configuration', async () => {
      const context = createTestContext({
        config: {
          method: 'INVALID',
          secret: 'test',
          signatureHeader: '' // Invalid: empty when secret provided
        }
      })

      const result = await WebhookNodeService.execute(context)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Webhook validation failed')
    })

    it('should handle execution errors gracefully', async () => {
      const context = createTestContext({
        config: null as unknown as WebhookNodeConfig
      })

      const result = await WebhookNodeService.execute(context)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Webhook Documentation Generation', () => {
    it('should generate webhook documentation', () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        secret: 'test-secret',
        signatureHeader: 'x-webhook-signature',
        responseBody: '{"success": true, "received": true}'
      }

      const docs = WebhookNodeService.generateWebhookDocs(config, 'test-workflow')

      expect(docs.method).toBe('POST')
      expect(docs.url).toContain('/api/webhooks/test-workflow')
      expect(docs.headers).toHaveProperty('Content-Type', 'application/json')
      expect(docs.headers).toHaveProperty('x-webhook-signature', 'sha256=<signature>')
      expect(docs.examplePayload).toBeDefined()
      expect(docs.exampleResponse).toEqual({ success: true, received: true })
    })

    it('should handle invalid response body in docs', () => {
      const config: WebhookNodeConfig = {
        method: 'GET',
        responseBody: 'invalid json'
      }

      const docs = WebhookNodeService.generateWebhookDocs(config, 'test-workflow')

      expect(docs.exampleResponse).toEqual({ success: true })
    })
  })

  describe('Webhook Testing', () => {
    it('should test valid webhook configuration', async () => {
      const config: WebhookNodeConfig = {
        method: 'POST',
        enabled: true
      }

      const result = await WebhookNodeService.testWebhook(config, 'test-workflow')

      expect(result.success).toBe(true)
      expect(result.url).toContain('/api/webhooks/test-workflow')
      expect(result.error).toBeUndefined()
    })

    it('should fail test with invalid configuration', async () => {
      const config: WebhookNodeConfig = {
        method: 'INVALID' as unknown as WebhookNodeConfig['method']
      }

      const result = await WebhookNodeService.testWebhook(config, 'test-workflow')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('URL Generation', () => {
    it('should generate webhook URL', () => {
      const url = WebhookNodeService.generateWebhookUrl('test-workflow-id')
      
      expect(url).toMatch(/\/api\/webhooks\/test-workflow-id$/)
    })
  })

  describe('Signature Functions', () => {
    it('should generate and validate signatures consistently', () => {
      const payload = 'test payload'
      const secret = 'test-secret'
      
      const signature = generateWebhookSignature(payload, secret)
      expect(signature).toBeTruthy()
      
      const isValid = validateWebhookSignature(payload, signature, secret)
      expect(isValid).toBe(true)
    })

    it('should reject signatures with wrong secret', () => {
      const payload = 'test payload'
      const signature = generateWebhookSignature(payload, 'secret1')
      
      const isValid = validateWebhookSignature(payload, signature, 'secret2')
      expect(isValid).toBe(false)
    })

    it('should handle empty signature gracefully', () => {
      const isValid = validateWebhookSignature('payload', '', 'secret')
      expect(isValid).toBe(false)
    })

    it('should handle empty secret gracefully', () => {
      const signature = generateWebhookSignature('payload', '')
      expect(signature).toBe('')
    })
  })
})
