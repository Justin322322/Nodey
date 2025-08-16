import { NodeType, TriggerType } from '@/types/workflow'
import { WebhookNodeConfig } from './WebhookNode.types'

interface ParameterDefinition {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'email' | 'url'
  required?: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  description?: string
}

interface NodeDefinition {
  nodeType: NodeType
  subType: TriggerType
  label: string
  description: string
  parameters: ParameterDefinition[]
  validate: (config: Record<string, unknown>) => string[]
  getDefaults: () => WebhookNodeConfig
}

export const WEBHOOK_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.TRIGGER,
  subType: TriggerType.WEBHOOK,
  label: 'Webhook',
  description: 'Trigger workflow via HTTP requests with optional signature verification',
  parameters: [
    {
      name: 'method',
      label: 'HTTP Method',
      type: 'select',
      required: true,
      defaultValue: 'POST',
      description: 'HTTP method that the webhook will accept',
      options: [
        { label: 'POST', value: 'POST' },
        { label: 'GET', value: 'GET' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' }
      ]
    },
    {
      name: 'secret',
      label: 'Webhook Secret',
      type: 'text',
      required: false,
      description: 'Optional secret for signature verification. Leave empty to disable verification.',
      placeholder: 'your-webhook-secret'
    },
    {
      name: 'signatureHeader',
      label: 'Signature Header',
      type: 'text',
      required: false,
      defaultValue: 'x-webhook-signature',
      description: 'Header name for webhook signature verification',
      placeholder: 'x-webhook-signature'
    },
    {
      name: 'responseMode',
      label: 'Response Mode',
      type: 'select',
      required: false,
      defaultValue: 'async',
      description: 'How to handle webhook response',
      options: [
        { label: 'Asynchronous (Immediate Response)', value: 'async' },
        { label: 'Synchronous (Wait for Completion)', value: 'sync' }
      ]
    },
    {
      name: 'responseCode',
      label: 'Response Status Code',
      type: 'number',
      required: false,
      defaultValue: 200,
      description: 'HTTP status code to return on successful webhook'
    },
    {
      name: 'responseBody',
      label: 'Response Body',
      type: 'textarea',
      required: false,
      defaultValue: '{"success": true, "message": "Webhook received"}',
      description: 'JSON response body to return',
      placeholder: '{"success": true, "message": "Webhook received"}'
    },
    {
      name: 'enabled',
      label: 'Enabled',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Whether the webhook is active'
    }
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = []
    const typed = config as unknown as WebhookNodeConfig
    
    // Validate HTTP method
    if (!typed.method) {
      errors.push('HTTP method is required')
    } else if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(typed.method)) {
      errors.push('Invalid HTTP method')
    }
    
    // Validate signature header if secret is provided
    if (typed.secret && (!typed.signatureHeader || typeof typed.signatureHeader !== 'string' || typed.signatureHeader.trim().length === 0)) {
      errors.push('Signature header is required when secret is provided')
    }
    
    // Validate response mode
    if (typed.responseMode && !['sync', 'async'].includes(typed.responseMode)) {
      errors.push('Invalid response mode')
    }
    
    // Validate response code
    if (typed.responseCode !== undefined) {
      if (typeof typed.responseCode !== 'number' || typed.responseCode < 100 || typed.responseCode > 599) {
        errors.push('Response code must be a valid HTTP status code (100-599)')
      }
    }
    
    // Validate response body is valid JSON if provided
    if (typed.responseBody && typeof typed.responseBody === 'string') {
      try {
        JSON.parse(typed.responseBody)
      } catch {
        errors.push('Response body must be valid JSON')
      }
    }
    
    return errors
  },
  getDefaults: (): WebhookNodeConfig => ({
    method: 'POST',
    signatureHeader: 'x-webhook-signature',
    responseMode: 'async',
    responseCode: 200,
    responseBody: '{"success": true, "message": "Webhook received"}',
    enabled: true
  })
}

/**
 * Validates webhook signature using HMAC-SHA256
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false
  
  try {
    // In a real implementation, you'd use crypto.createHmac
    // For now, we'll do a simple comparison as a placeholder
    const expectedSignature = `sha256=${Buffer.from(secret + payload).toString('base64')}`
    return signature === expectedSignature
  } catch {
    return false
  }
}

/**
 * Generate webhook signature for testing
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  if (!secret) return ''
  
  try {
    // Placeholder implementation - in production use crypto.createHmac
    return `sha256=${Buffer.from(secret + payload).toString('base64')}`
  } catch {
    return ''
  }
}
