import { NodeExecutionContext, NodeExecutionResult } from '@/nodes/types'
import { ManualNodeConfig, ManualExecutionResult, ManualValidationResult } from './ManualNode.types'

export class ManualNodeService {
  /**
   * Execute the manual node - this represents a manual trigger
   * In a real implementation, this would be called when a user manually starts the workflow
   */
  static async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    try {
      const config = context.config as ManualNodeConfig
      
      // Validate the configuration (though manual trigger has no config)
      const validation = this.validateManual(config)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Manual trigger validation failed: ${validation.errors.join(', ')}`
        }
      }

      const result: ManualExecutionResult = {
        triggered: true,
        timestamp: new Date(),
        triggeredBy: context.nodeId || 'unknown',
        reason: 'Manual execution triggered'
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
   * Validate manual trigger configuration
   * Since manual triggers have no configuration, this always passes
   */
  static validateManual(config: ManualNodeConfig): ManualValidationResult {
    return {
      isValid: true,
      errors: []
    }
  }

  /**
   * Check if manual trigger is ready to execute
   * Manual triggers are always ready since they require no setup
   */
  static isReady(config: ManualNodeConfig): boolean {
    return true
  }

  /**
   * Get display information for the manual trigger
   */
  static getDisplayInfo(config: ManualNodeConfig): {
    status: string
    description: string
  } {
    return {
      status: 'Ready',
      description: 'Manual trigger - ready to execute when needed'
    }
  }
}

/**
 * Execute manual trigger node
 * This is the main entry point for manual trigger execution
 */
export async function executeManualNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  return ManualNodeService.execute(context)
}
