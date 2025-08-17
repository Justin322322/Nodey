import { HttpNodeConfig, HttpExecutionResult } from './HttpNode.types'
import { NodeExecutionContext, NodeExecutionResult } from '../types'

export async function executeHttpNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const startTime = Date.now()
  
  try {
    const config = context.config as unknown as HttpNodeConfig
    
    // Validate required configuration
    if (!config.url || config.url.trim().length === 0) {
      return {
        success: false,
        error: 'URL is required'
      }
    }
    
    // Validate URL format
    let url: URL
    try {
      url = new URL(config.url)
    } catch {
      return {
        success: false,
        error: 'Invalid URL format'
      }
    }
    
    // Check for abort signal
    if (context.signal?.aborted) {
      return {
        success: false,
        error: 'Execution was cancelled'
      }
    }
    
    // Prepare headers
    const headers: Record<string, string> = {
      'User-Agent': 'Workflow-Engine/1.0'
    }
    
    // Add custom headers if provided
    if (config.headers) {
      let customHeaders: Record<string, string>
      if (typeof config.headers === 'string') {
        try {
          customHeaders = JSON.parse(config.headers) as Record<string, string>
        } catch {
          return {
            success: false,
            error: 'Invalid headers JSON format'
          }
        }
      } else {
        customHeaders = config.headers as Record<string, string>
      }
      
      Object.assign(headers, customHeaders)
    }
    
    // Handle authentication
    if (config.authentication && config.authentication.type !== 'none' && config.authentication.value) {
      switch (config.authentication.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${config.authentication.value}`
          break
        case 'basic':
          headers['Authorization'] = `Basic ${config.authentication.value}`
          break
        case 'apiKey':
          headers['X-API-Key'] = config.authentication.value
          break
      }
    }
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: config.method || 'GET',
      headers,
      signal: context.signal
    }
    
    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(config.method || 'GET') && config.body) {
      if (typeof config.body === 'string') {
        try {
          // Validate JSON if it's a string
          JSON.parse(config.body)
          requestOptions.body = config.body
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json'
          }
        } catch {
          return {
            success: false,
            error: 'Invalid body JSON format'
          }
        }
      } else {
        requestOptions.body = JSON.stringify(config.body)
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json'
        }
      }
    }
    
    // Make the HTTP request
    const response = await fetch(url.toString(), requestOptions)
    const duration = Date.now() - startTime
    
    // Get response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })
    
    // Parse response data
    let responseData: unknown
    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json()
      } catch {
        responseData = await response.text()
      }
    } else {
      responseData = await response.text()
    }
    
    const result: HttpExecutionResult = {
      status: response.status,
      data: responseData,
      headers: responseHeaders,
      duration,
      url: url.toString(),
      method: config.method || 'GET'
    }
    
    // Consider 2xx status codes as success
    const success = response.status >= 200 && response.status < 300
    
    return {
      success,
      output: result,
      error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request was cancelled'
        }
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error: Unable to reach the server'
        }
      }
      
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Unknown error occurred during HTTP request'
    }
  }
}