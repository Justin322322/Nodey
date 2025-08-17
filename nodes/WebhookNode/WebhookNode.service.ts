import { NodeExecutionContext, NodeExecutionResult } from '@/nodes/types'
import { 
  WebhookNodeConfig, 
  WebhookExecutionResult, 
  WebhookValidationResult, 
  WebhookSignatureResult 
} from './WebhookNode.types'
import { validateWebhookSignature } from './WebhookNode.schema'

export class WebhookNodeService {
  /**
   * Execute the webhook node - this validates configuration and provides webhook information
   * The actual webhook handling is done by the API route
   */
  static async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    try {
      const config = context.config as WebhookNodeConfig
      
      // Check if webhook is disabled
      if (config.enabled === false) {
        const result: WebhookExecutionResult = {
          triggered: false,
          reason: 'Webhook disabled',
          method: config.method || 'POST',
          headers: {},
          timestamp: new Date()
        }

        return {
          success: true,
          output: result
        }
      }
      
      // Validate the webhook configuration
      const validation = this.validateWebhook(config)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Webhook validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Generate webhook URL for the workflow
      const webhookUrl = this.generateWebhookUrl(context.nodeId)
      
      const result: WebhookExecutionResult = {
        triggered: true,
        method: config.method || 'POST',
        url: webhookUrl,
        headers: {},
        timestamp: new Date()
      }

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

  /**
   * Validate the webhook configuration
   */
  static validateWebhook(config: WebhookNodeConfig): WebhookValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate HTTP method
    if (!config.method) {
      errors.push('HTTP method is required')
    } else if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
      errors.push('Invalid HTTP method')
    }

    // Validate signature configuration
    if (config.secret) {
      if (!config.signatureHeader || config.signatureHeader.trim().length === 0) {
        errors.push('Signature header is required when secret is provided')
      }
      
      if (config.secret.length < 8) {
        warnings.push('Webhook secret should be at least 8 characters for security')
      }
    } else {
      warnings.push('No webhook secret configured. Consider adding one for security.')
    }

    // Validate response configuration
    if (config.responseCode !== undefined) {
      if (typeof config.responseCode !== 'number' || config.responseCode < 100 || config.responseCode > 599) {
        errors.push('Response code must be a valid HTTP status code (100-599)')
      }
    }

    if (config.responseBody && typeof config.responseBody === 'string') {
      try {
        JSON.parse(config.responseBody)
      } catch {
        errors.push('Response body must be valid JSON')
      }
    }

    // Validate response mode
    if (config.responseMode && !['sync', 'async'].includes(config.responseMode)) {
      errors.push('Invalid response mode')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Validate webhook signature
   */
  static validateSignature(
    payload: string,
    signature: string,
    secret: string
  ): WebhookSignatureResult {
    if (!secret) {
      return {
        isValid: true // No secret means no validation required
      }
    }

    if (!signature) {
      return {
        isValid: false,
        error: 'Signature required but not provided'
      }
    }

    try {
      const isValid = validateWebhookSignature(payload, signature, secret)
      return {
        isValid,
        signature,
        error: isValid ? undefined : 'Invalid signature'
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Signature validation failed'
      }
    }
  }

  /**
   * Process incoming webhook request
   */
  static async processWebhookRequest(
    config: WebhookNodeConfig,
    request: {
      method: string
      headers: Record<string, string>
      body?: unknown
      query?: Record<string, string>
    }
  ): Promise<WebhookExecutionResult> {
    const timestamp = new Date()

    // Normalize method comparison (case-insensitive)
    const expectedMethod = (config.method || 'POST').toUpperCase()
    const receivedMethod = (request.method || '').toUpperCase()

    // Normalize header keys for case-insensitive access
    const lowerHeaderEntries = Object.entries(request.headers || {}).map(
      ([k, v]) => [k.toLowerCase(), v] as const
    )
    const headersLower: Record<string, string> = Object.fromEntries(lowerHeaderEntries)
    const signatureHeaderName = (config.signatureHeader || '').toLowerCase()

    // Build sanitized headers without the signature header (any casing)
    const sanitizedHeaders: Record<string, string> = {}
    for (const [k, v] of Object.entries(request.headers || {})) {
      if (k.toLowerCase() !== signatureHeaderName) {
        sanitizedHeaders[k] = v
      }
    }

    // Method mismatch
    if (receivedMethod !== expectedMethod) {
      return {
        triggered: false,
        reason: `Method mismatch: expected ${config.method}, got ${request.method}`,
        method: request.method,
        headers: sanitizedHeaders,
        timestamp
      }
    }

    // Validate signature if secret is configured
    let signatureVerified = true
    if (config.secret && config.signatureHeader) {
      const signature = headersLower[signatureHeaderName]
      const payload =
        typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body || {})

      const signatureResult = this.validateSignature(
        payload,
        signature || '',
        config.secret
      )
      signatureVerified = signatureResult.isValid

      if (!signatureVerified) {
        return {
          triggered: false,
          reason: `Signature verification failed: ${signatureResult.error}`,
          method: request.method,
          headers: sanitizedHeaders,
          body: request.body,
          timestamp,
          signatureVerified: false
        }
      }
    }

    return {
      triggered: true,
      method: request.method,
      headers: sanitizedHeaders,
      body: request.body,
      timestamp,
      signatureVerified
    }
  }

  /**
   * Generate webhook URL for a workflow
   */
  static generateWebhookUrl(workflowId: string): string {
    // In production, this would use the actual domain
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    return `${baseUrl}/api/webhooks/${workflowId}`
  }

  /**
   * Generate webhook documentation
   */
  static generateWebhookDocs(config: WebhookNodeConfig, workflowId: string): {
    url: string
    method: string
    headers: Record<string, string>
    examplePayload: unknown
    exampleResponse: unknown
  } {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (config.secret && config.signatureHeader) {
      headers[config.signatureHeader] = 'sha256=<signature>'
    }

    const examplePayload = {
      event: 'example.event',
      data: {
        id: 'example-id',
        message: 'Hello, World!'
      },
      timestamp: new Date().toISOString()
    }

    let exampleResponse
    try {
      exampleResponse = config.responseBody ? JSON.parse(config.responseBody) as unknown : { success: true }
    } catch {
      exampleResponse = { success: true }
    }

    return {
      url: this.generateWebhookUrl(workflowId),
      method: config.method || 'POST',
      headers,
      examplePayload,
      exampleResponse
    }
  }

  /**
   * Test webhook configuration
   */
  static async testWebhook(config: WebhookNodeConfig, workflowId: string): Promise<{
    success: boolean
    url: string
    error?: string
  }> {
    try {
      const validation = this.validateWebhook(config)
      if (!validation.isValid) {
        return {
          success: false,
          url: this.generateWebhookUrl(workflowId),
          error: validation.errors.join(', ')
        }
      }

      return {
        success: true,
        url: this.generateWebhookUrl(workflowId)
      }
    } catch (error) {
      return {
        success: false,
        url: this.generateWebhookUrl(workflowId),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
