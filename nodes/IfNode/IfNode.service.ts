import { NodeExecutionContext, NodeExecutionResult } from '@/nodes/types'
import { IfNodeConfig, IfExecutionResult, IfValidationResult } from './IfNode.types'

export class IfNodeService {
  /**
   * Execute the IF node - evaluates a condition and returns the branch result
   */
  static async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    try {
      const config = context.config as IfNodeConfig
      
      // Validate the configuration
      const validation = this.validateIf(config)
      if (!validation.isValid) {
        return {
          success: false,
          error: `IF node validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Extract the value from the input data using the field path
      const actualValue = this.getValueAtPath(context.input as Record<string, unknown>, config.condition.field)
      
      // Evaluate the condition
      const conditionMet = this.evaluateCondition(
        actualValue,
        config.condition.operator,
        config.condition.value
      )

      const result: IfExecutionResult = {
        conditionMet,
        field: config.condition.field,
        operator: config.condition.operator,
        value: config.condition.value,
        actualValue,
        timestamp: new Date(),
        branch: conditionMet ? 'true' : 'false'
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
   * Validate IF node configuration
   */
  static validateIf(config: IfNodeConfig): IfValidationResult {
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
   * Evaluate a condition against a value
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
   * Get a value from an object using a dot-notation path
   */
  static getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
    if (!path) return undefined
    
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
   * Get display information for the IF node
   */
  static getDisplayInfo(config: IfNodeConfig): {
    status: string
    description: string
  } {
    if (!config.condition) {
      return {
        status: 'Not configured',
        description: 'IF condition not configured'
      }
    }

    const { field, operator, value } = config.condition
    const operatorLabel = this.getOperatorLabel(operator)

    return {
      status: 'Configured',
      description: `IF ${field} ${operatorLabel} "${value}"`
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
 * Execute IF node
 * This is the main entry point for IF node execution
 */
export async function executeIfNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  return IfNodeService.execute(context)
}
