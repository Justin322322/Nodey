import { NodeType, LogicType } from '@/types/workflow'
import { IfNodeConfig } from './IfNode.types'

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
  subType: LogicType
  label: string
  description: string
  parameters: ParameterDefinition[]
  validate: (config: Record<string, unknown>) => string[]
  getDefaults: () => IfNodeConfig
}

export const IF_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.LOGIC,
  subType: LogicType.IF,
  label: 'If/Else',
  description: 'Conditional branching based on previous data',
  parameters: [
    {
      name: 'field',
      label: 'Field',
      type: 'text',
      required: true,
      defaultValue: '',
      description: 'The field path to check (e.g., user.email, response.status)',
      placeholder: 'user.email'
    },
    {
      name: 'operator',
      label: 'Operator',
      type: 'select',
      required: true,
      defaultValue: 'equals',
      description: 'The comparison operator to use',
      options: [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
        { label: 'Contains', value: 'contains' },
        { label: 'Greater Than', value: 'greaterThan' },
        { label: 'Less Than', value: 'lessThan' },
      ]
    },
    {
      name: 'value',
      label: 'Value',
      type: 'text',
      required: true,
      defaultValue: '',
      description: 'The value to compare against',
      placeholder: 'expected value'
    }
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = []
    const typed = config as { condition?: { field?: string; operator?: string; value?: unknown } }
    
    if (!typed.condition?.field) {
      errors.push('Condition field is required')
    }
    
    if (!typed.condition?.operator) {
      errors.push('Operator is required')
    }
    
    if (typeof typed.condition?.value === 'undefined') {
      errors.push('Comparison value is required')
    }
    
    return errors
  },
  getDefaults: (): IfNodeConfig => ({
    condition: {
      field: '',
      operator: 'equals',
      value: ''
    }
  })
}
