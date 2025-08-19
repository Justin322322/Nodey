import { TransformNodeConfig, TransformExecutionResult } from './TransformNode.types'
import { NodeExecutionContext, NodeExecutionResult } from '../types'

export async function executeTransformNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const startTime = Date.now()
  
  try {
    const config = context.config as unknown as TransformNodeConfig
    
    // Validate required configuration
    if (!config.script || config.script.trim().length === 0) {
      return {
        success: false,
        error: 'Transformation script is required'
      }
    }
    
    // Check for abort signal
    if (context.signal?.aborted) {
      return {
        success: false,
        error: 'Execution was cancelled'
      }
    }
    
    // Get input data (from previous node or context input)
    let inputData: unknown = context.input
    if (config.inputPath) {
      inputData = getNestedValue(context.input, config.inputPath)
    }
    
    // PLACEHOLDER IMPLEMENTATION
    // In a real implementation, this would:
    // 1. Parse and validate the transformation script
    // 2. Execute the script in a sandboxed environment
    // 3. Apply the transformation based on the operation type
    // 4. Handle different script languages (JavaScript, JSONPath)
    
    // Simulate transformation delay
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Check for abort signal immediately after delay
    if (context.signal?.aborted) {
      return {
        success: false,
        error: 'Execution was cancelled'
      }
    }
    
    let transformedData: unknown
    let itemsProcessed = 0
    
    // Mock transformation based on operation type
    switch (config.operation) {
      case 'map':
        if (Array.isArray(inputData)) {
          transformedData = inputData.map((item, index) => {
            itemsProcessed++
            // Mock transformation - add a "processed" flag
            return typeof item === 'object' && item !== null 
              ? { ...(item as Record<string, unknown>), processed: true, transformedAt: new Date().toISOString() }
              : { value: item as unknown, processed: true, transformedAt: new Date().toISOString() }
          })
        } else {
          transformedData = typeof inputData === 'object' && inputData !== null
            ? { ...inputData as Record<string, unknown>, processed: true, transformedAt: new Date().toISOString() }
            : { value: inputData, processed: true, transformedAt: new Date().toISOString() }
          itemsProcessed = 1
        }
        break
        
      case 'filter':
        if (Array.isArray(inputData)) {
          // Mock filter - keep only truthy items or items with specific properties
          transformedData = inputData.filter((item, index) => {
            itemsProcessed++
            return item && (typeof item !== 'object' || Object.keys(item as object).length > 0)
          })
        } else {
          transformedData = inputData ? [inputData] : []
          itemsProcessed = 1
        }
        break
        
      case 'reduce':
        if (Array.isArray(inputData)) {
          itemsProcessed = inputData.length
          transformedData = {
            count: inputData.length,
            summary: 'Mock aggregation result',
            firstItem: (inputData[0] as unknown) ?? null,
            lastItem: (inputData[inputData.length - 1] as unknown) ?? null
          }
        } else {
          transformedData = { count: 1, value: inputData }
          itemsProcessed = 1
        }
        break
        
      case 'sort':
        if (Array.isArray(inputData)) {
          itemsProcessed = inputData.length
          // Mock sort - reverse the array
          transformedData = [...(inputData as unknown[])].reverse()
        } else {
          transformedData = [inputData]
          itemsProcessed = 1
        }
        break
        
      case 'group':
        if (Array.isArray(inputData)) {
          itemsProcessed = inputData.length
          // Mock grouping by type
          const groups: Record<string, unknown[]> = {}
          inputData.forEach(item => {
            const type = typeof item
            if (!groups[type]) groups[type] = []
            groups[type].push(item)
          })
          transformedData = groups
        } else {
          transformedData = { [typeof inputData]: [inputData] }
          itemsProcessed = 1
        }
        break
        
      case 'merge':
        if (Array.isArray(inputData)) {
          itemsProcessed = inputData.length
          // Mock merge - combine all objects
          transformedData = inputData.reduce((acc: Record<string, unknown>, item) => {
            if (typeof item === 'object' && item !== null) {
              return { ...acc, ...(item as Record<string, unknown>) }
            }
            return acc
          }, {} as Record<string, unknown>)
        } else {
          transformedData = inputData
          itemsProcessed = 1
        }
        break
        
      default:
        return {
          success: false,
          error: `Unsupported operation: ${config.operation}`
        }
    }
    
    // Apply output path if specified
    let finalOutput = transformedData
    if (config.outputPath) {
      const outputContainer = {}
      setNestedValue(outputContainer, config.outputPath, transformedData)
      finalOutput = outputContainer
    }
    
    // Check for abort signal before building result
    if (context.signal?.aborted) {
      return {
        success: false,
        error: 'Execution was cancelled'
      }
    }
    
    // Calculate final duration after all transformation work is complete
    const duration = Date.now() - startTime
    
    const result: TransformExecutionResult = {
      operation: config.operation,
      originalData: inputData,
      transformedData: finalOutput,
      duration,
      itemsProcessed
    }
    
    return {
      success: true,
      output: result
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Transform operation was cancelled'
        }
      }
      
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Unknown error occurred during data transformation'
    }
  }
}

// Helper function to get nested values
function getNestedValue(obj: unknown, path: string): unknown {
  if (!path) return obj
  
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

// Helper function to set nested values
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  if (!path) return

  // Prevent prototype pollution
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']
  const parts = path.split('.')

  if (parts.some(part => dangerousKeys.includes(part))) {
    throw new Error('Dangerous path detected')
  }

  let current: Record<string, unknown> = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }

  current[parts[parts.length - 1]] = value
}