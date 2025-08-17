import { NodeType, TriggerType } from '@/types/workflow'
import { ManualNodeConfig } from './ManualNode.types'

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
  getDefaults: () => ManualNodeConfig
}

export const MANUAL_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.TRIGGER,
  subType: TriggerType.MANUAL,
  label: 'Manual Trigger',
  description: 'Start the workflow manually (no configuration needed)',
  parameters: [
    // No parameters needed for manual trigger
  ],
  validate: (config: Record<string, unknown>): string[] => {
    // Manual trigger has no configuration to validate
    return []
  },
  getDefaults: (): ManualNodeConfig => ({
    // Empty config object for consistency
  })
}
