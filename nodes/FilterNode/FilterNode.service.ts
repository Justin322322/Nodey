import { NodeExecutionContext, NodeExecutionResult } from '@/nodes/types'
import { FilterNodeConfig, FilterExecutionResult, FilterValidationResult } from './FilterNode.types'

export class FilterNodeService {
  /**
   * Execute the Filter node - filters array items based on a condition
   */
  static async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    try {
      const config = context.config as FilterNodeConfig
      
      // Validate the configuration
      const validation = this.validateFilter(config)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Filter node validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Ensure input is an array or has an array property
      let inputArray: unknown[]
      if (Array.isArray(context.input)) {
        inputArray = context.input
      } else if (context.input && typeof context.input === 'object') {
        // Look for array properties in the input object
        const arrayProps = Object.values(context.input as Record<string, unknown>)
          .filter(val => Array.isArray(val))
        
        if (arrayProps.length > 0) {
          inputArray = arrayProps[0] as unknown[]
        } else {
          return {
            success: false,
            error: 'Input must be an array or contain an array property'
          }
        }
      } else {
        return {
          success: false,
          error: 'Input must be an array or contain an array property'
        }
      }

      // Filter the array based on the condition
      const filteredItems = inputArray.filter(item => {
        const itemValue = this.getValueAtPath(item as Record<string, unknown>, config.condition.field)
        return this.evaluateCondition(
          itemValue,
          config.condition.operator,
          config.condition.value
        )
      })

      const result: FilterExecutionResult = {
        originalCount: inputArray.length,
        filteredCount: filteredItems.length,
        field: config.condition.field,
        operator: config.condition.operator,
        value: config.condition.value,
        filteredItems,
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
   * Validate Filter node configuration
   */
  static validateFilter(config: FilterNodeConfig): FilterValidationResult {
    const errors: string[] = []

    if (!config.condition) {
      errors.push('Condition configuration is required')
      return { isValid: false, errors }
    }

    if (!config.condition.field || typeof config.condition.field !== 'string') {
      errors.push('Condition field is required and must be a string')
    }

    if (!config.condition.operator) {
      errors.push('Condition operator is required')
    } else {
      const validOperators = ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan']
      if (!validOperators.includes(config.condition.operator)) {
        errors.push(`Invalid operator: ${config.condition.operator}`)
      }
    }

    if (typeof config.condition.value === 'undefined') {
      errors.push('Condition value is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Evaluate a condition against a value (same as IfNode)
   */
  static evaluateCondition(actualValue: unknown, operator: string, expectedValue: string): boolean {
    const actualStr = String(actualValue ?? '')
    const expectedStr = String(expectedValue)

    switch (operator) {
      case 'equals':
        return actualStr === expectedStr

      case 'notEquals':
        return actualStr !== expectedStr

      case 'contains':
        return actualStr.toLowerCase().includes(expectedStr.toLowerCase())

      case 'greaterThan':
        const actualNum = Number(actualValue)
        const expectedNum = Number(expectedValue)
        if (isNaN(actualNum) || isNaN(expectedNum)) {
          return actualStr > expectedStr
        }
        return actualNum > expectedNum

      case 'lessThan':
        const actualNumLess = Number(actualValue)
        const expectedNumLess = Number(expectedValue)
        if (isNaN(actualNumLess) || isNaN(expectedNumLess)) {
          return actualStr < expectedStr
        }
        return actualNumLess < expectedNumLess

      default:
        throw new Error(`Unknown operator: ${operator}`)
    }
  }

  /**
   * Get a value from an object using a dot-notation path (same as IfNode)
   */
  static getValueAtPath(obj: unknown, path: string): unknown {
    if (!path || typeof obj !== 'object' || obj === null) return undefined
    
    const parts = path.split('.')
    let current: unknown = obj

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }
      
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * Get display information for the Filter node
   */
  static getDisplayInfo(config: FilterNodeConfig): {
    status: string
    description: string
  } {
    if (!config.condition) {
      return {
        status: 'Not configured',
        description: 'Filter condition not configured'
      }
    }

    const { field, operator, value } = config.condition
    const operatorLabel = this.getOperatorLabel(operator)

    return {
      status: 'Configured',
      description: `Filter where ${field} ${operatorLabel} "${value}"`
    }
  }

  /**
   * Get a human-readable label for an operator
   */
  static getOperatorLabel(operator: string): string {
    switch (operator) {
      case 'equals': return '='
      case 'notEquals': return '≠'
      case 'contains': return 'contains'
      case 'greaterThan': return '>'
      case 'lessThan': return '<'
      default: return operator
    }
  }
}

/**
 * Execute Filter node
 * This is the main entry point for Filter node execution
 */
export async function executeFilterNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  return FilterNodeService.execute(context)
}
