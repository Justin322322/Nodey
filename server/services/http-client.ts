import { HttpNodeConfig } from '@/types/workflow'

type HttpResponse = {
  status: number
  statusText: string
  data: unknown
  headers: Record<string, string>
}

export async function executeHttpRequest(config: HttpNodeConfig, signal?: AbortSignal): Promise<HttpResponse> {
  const { method, url, headers = {}, body, authentication } = config
  
  // Build request headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }
  
  // Add authentication
  if (authentication) {
    switch (authentication.type) {
      case 'bearer':
        requestHeaders['Authorization'] = `Bearer ${authentication.value}`
        break
      case 'basic':
        requestHeaders['Authorization'] = `Basic ${authentication.value}`
        break
      case 'apiKey':
        // API key could be in header or query param, assuming header for now
        requestHeaders['X-API-Key'] = authentication.value || ''
        break
    }
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
      signal,
    })
    
    let responseData: unknown
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      responseData = await response.json()
    } else if (contentType?.includes('text/')) {
      responseData = await response.text()
    } else {
      responseData = await response.arrayBuffer()
    }
    
    // Extract response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: responseHeaders,
    }
  } catch (error) {
    throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
