import { NodeType, LogicType } from '@/types/workflow'
import { FilterNodeConfig } from './FilterNode.types'

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
  getDefaults: () => FilterNodeConfig
}

export const FILTER_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.LOGIC,
  subType: LogicType.FILTER,
  label: 'Filter',
  description: 'Filter array items using a simple condition',
  parameters: [
    {
      name: 'field',
      label: 'Field',
      type: 'text',
      required: true,
      defaultValue: '',
      description: 'The field path to check within each array item (e.g., name, status, user.email)',
      placeholder: 'status'
    },
    {
      name: 'operator',
      label: 'Operator',
      type: 'select',
      required: true,
      defaultValue: 'equals',
      description: 'The comparison operator to use for filtering',
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
      description: 'The value to filter for',
      placeholder: 'active'
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
  getDefaults: (): FilterNodeConfig => ({
    condition: {
      field: '',
      operator: 'equals',
      value: ''
    }
  })
}
