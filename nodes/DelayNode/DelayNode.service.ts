import { DelayNodeConfig, DelayExecutionResult, getDelayMs } from './DelayNode.types'
import { NodeExecutionContext, NodeExecutionResult } from '../types'

export async function executeDelayNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const startTime = new Date()
  
  try {
    const config = context.config as unknown as DelayNodeConfig
    
    // Validate required configuration
    if (typeof config.value !== 'number' || config.value <= 0) {
      return {
        success: false,
        error: 'Valid delay value is required'
      }
    }
    
    // Check for abort signal before starting delay
    if (context.signal?.aborted) {
      return {
        success: false,
        error: 'Execution was cancelled'
      }
    }
    
    // Convert delay value to milliseconds using helper function
    let baseDelayMs: number
    try {
      baseDelayMs = getDelayMs({ value: config.value, unit: config.unit })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid delay configuration'
      }
    }

    let actualDelayMs: number    
    // Calculate actual delay based on delay type
    switch (config.delayType) {
      case 'fixed':
        actualDelayMs = baseDelayMs
        break
        
      case 'random':
        const maxDelay = Math.max(0, config.maxDelayMs ?? (baseDelayMs * 2))
        if (maxDelay <= baseDelayMs) {
          actualDelayMs = baseDelayMs
        } else {
          actualDelayMs = baseDelayMs + Math.random() * (maxDelay - baseDelayMs)
        }
        break
        
      case 'exponential':
        // Simple exponential backoff simulation
        const maxExp = config.maxDelayMs || baseDelayMs * 4
        const exponentialDelay = baseDelayMs * Math.pow(2, Math.random() * 3)
        actualDelayMs = Math.min(exponentialDelay, maxExp)
        break
        
      default:
        return {
          success: false,
          error: `Unsupported delay type: ${config.delayType}`
        }
    }
    
    // Ensure delay is within reasonable bounds
    actualDelayMs = Math.max(1, Math.min(actualDelayMs, 24 * 60 * 60 * 1000)) // 1ms to 24 hours
    
    // PLACEHOLDER IMPLEMENTATION
    // In a real implementation, this would:
    // 1. Handle very long delays efficiently (not just setTimeout)
    // 2. Support delay persistence across restarts
    // 3. Implement proper cancellation mechanisms
    // 4. Handle system sleep/hibernate scenarios
    
    // Execute the delay with cancellation support
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve()
      }, actualDelayMs)
      
      // Handle abort signal
      if (context.signal) {
        const abortHandler = () => {
          clearTimeout(timer)
          reject(new Error('Delay was cancelled'))
        }
        
        if (context.signal.aborted) {
          clearTimeout(timer)
          reject(new Error('Delay was cancelled'))
          return
        }
        
        context.signal.addEventListener('abort', abortHandler, { once: true })
        
        // Clean up event listener when promise resolves
        timer && setTimeout(() => {
          context.signal?.removeEventListener('abort', abortHandler)
        }, actualDelayMs + 100)
      }
    })
    
    const endTime = new Date()
    
    const result: DelayExecutionResult = {
      delayType: config.delayType,
      actualDelayMs: Math.round(actualDelayMs),
      plannedDelayMs: Math.round(baseDelayMs),
      unit: config.unit,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      passthrough: config.passthrough ?? true,
      passthroughData: config.passthrough !== false ? context.input : undefined
    }
    
    return {
      success: true,
      output: result
    }
    
  } catch (error) {
    const endTime = new Date()
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError' || error.message.includes('cancelled')) {
        return {
          success: false,
          error: 'Delay was cancelled'
        }
      }
      
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Unknown error occurred during delay'
    }
  }
}
