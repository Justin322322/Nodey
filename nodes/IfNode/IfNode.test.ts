import { describe, it, expect } from 'vitest'
import { IfNodeService, executeIfNode } from './IfNode.service'
import { IF_NODE_DEFINITION } from './IfNode.schema'
import { IfNodeConfig, IfExecutionResult } from './IfNode.types'
import { NodeExecutionContext } from '@/nodes/types'

describe('IfNode', () => {
  describe('IfNodeService', () => {
    describe('execute', () => {
      it('should execute successfully with true condition', async () => {
        const config: IfNodeConfig = {
          condition: {
            field: 'user.name',
            operator: 'equals',
            value: 'John'
          }
        }

        const context: NodeExecutionContext = {
          nodeId: 'if-1',
          workflowId: 'workflow-1',
          config,
          input: { user: { name: 'John' } },
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await IfNodeService.execute(context)

        expect(result.success).toBe(true)
        const output = result.output as IfExecutionResult
        expect(output?.conditionMet).toBe(true)
        expect(output?.branch).toBe('true')
        expect(output?.actualValue).toBe('John')
      })

      it('should execute successfully with false condition', async () => {
        const config: IfNodeConfig = {
          condition: {
            field: 'user.name',
            operator: 'equals',
            value: 'Jane'
          }
        }

        const context: NodeExecutionContext = {
          nodeId: 'if-1',
          workflowId: 'workflow-1',
          config,
          input: { user: { name: 'John' } },
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await IfNodeService.execute(context)

        expect(result.success).toBe(true)
        const output = result.output as IfExecutionResult
        expect(output?.conditionMet).toBe(false)
        expect(output?.branch).toBe('false')
        expect(output?.actualValue).toBe('John')
      })

      it('should fail with invalid config', async () => {
        const config = { condition: { field: '', operator: 'equals', value: '' } }

        const context: NodeExecutionContext = {
          nodeId: 'if-1',
          workflowId: 'workflow-1',
          config,
          input: {},
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await IfNodeService.execute(context)

        expect(result.success).toBe(false)
        expect(result.error).toContain('validation failed')
      })
    })

    describe('evaluateCondition', () => {
      it('should handle equals operator', () => {
        expect(IfNodeService.evaluateCondition('hello', 'equals', 'hello')).toBe(true)
        expect(IfNodeService.evaluateCondition('hello', 'equals', 'world')).toBe(false)
      })

      it('should handle notEquals operator', () => {
        expect(IfNodeService.evaluateCondition('hello', 'notEquals', 'world')).toBe(true)
        expect(IfNodeService.evaluateCondition('hello', 'notEquals', 'hello')).toBe(false)
      })

      it('should handle contains operator', () => {
        expect(IfNodeService.evaluateCondition('hello world', 'contains', 'world')).toBe(true)
        expect(IfNodeService.evaluateCondition('hello world', 'contains', 'foo')).toBe(false)
        expect(IfNodeService.evaluateCondition('Hello World', 'contains', 'world')).toBe(true) // case insensitive
      })

      it('should handle greaterThan operator with numbers', () => {
        expect(IfNodeService.evaluateCondition(10, 'greaterThan', '5')).toBe(true)
        expect(IfNodeService.evaluateCondition(3, 'greaterThan', '5')).toBe(false)
      })

      it('should handle lessThan operator with numbers', () => {
        expect(IfNodeService.evaluateCondition(3, 'lessThan', '5')).toBe(true)
        expect(IfNodeService.evaluateCondition(10, 'lessThan', '5')).toBe(false)
      })

      it('should handle greaterThan operator with strings', () => {
        expect(IfNodeService.evaluateCondition('z', 'greaterThan', 'a')).toBe(true)
        expect(IfNodeService.evaluateCondition('a', 'greaterThan', 'z')).toBe(false)
      })
    })

    describe('getValueAtPath', () => {
      it('should get nested values', () => {
        const obj = { user: { profile: { name: 'John' } } }
        expect(IfNodeService.getValueAtPath(obj, 'user.profile.name')).toBe('John')
      })

      it('should return undefined for non-existent paths', () => {
        const obj = { user: { name: 'John' } }
        expect(IfNodeService.getValueAtPath(obj, 'user.age')).toBe(undefined)
        expect(IfNodeService.getValueAtPath(obj, 'nonexistent.path')).toBe(undefined)
      })

      it('should handle empty paths', () => {
        const obj = { name: 'John' }
        expect(IfNodeService.getValueAtPath(obj, '')).toBe(undefined)
      })
    })

    describe('validateIf', () => {
      it('should validate correct config', () => {
        const config: IfNodeConfig = {
          condition: {
            field: 'user.name',
            operator: 'equals',
            value: 'John'
          }
        }

        const result = IfNodeService.validateIf(config)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual([])
      })

      it('should fail with missing condition', () => {
        const config = {} as IfNodeConfig

        const result = IfNodeService.validateIf(config)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Condition configuration is required')
      })

      it('should fail with missing field', () => {
        const config = {
          condition: { field: '', operator: 'equals', value: 'test' }
        } as IfNodeConfig

        const result = IfNodeService.validateIf(config)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Condition field is required and must be a string')
      })
    })

    describe('getDisplayInfo', () => {
      it('should return display info for configured condition', () => {
        const config: IfNodeConfig = {
          condition: {
            field: 'user.email',
            operator: 'contains',
            value: '@example.com'
          }
        }

        const result = IfNodeService.getDisplayInfo(config)
        expect(result.status).toBe('Configured')
        expect(result.description).toBe('IF user.email contains "@example.com"')
      })

      it('should return not configured for empty condition', () => {
        const config = {} as IfNodeConfig

        const result = IfNodeService.getDisplayInfo(config)
        expect(result.status).toBe('Not configured')
        expect(result.description).toBe('IF condition not configured')
      })
    })
  })

  describe('executeIfNode', () => {
    it('should execute successfully', async () => {
      const config: IfNodeConfig = {
        condition: {
          field: 'status',
          operator: 'equals',
          value: 'active'
        }
      }

      const context: NodeExecutionContext = {
        nodeId: 'if-1',
        workflowId: 'workflow-1',
        config,
        input: { status: 'active' },
        previousNodes: [],
        executionId: 'exec-1'
      }

      const result = await executeIfNode(context)

      expect(result.success).toBe(true)
      const output = result.output as IfExecutionResult
      expect(output?.conditionMet).toBe(true)
    })
  })

  describe('IF_NODE_DEFINITION', () => {
    it('should have correct schema properties', () => {
      expect(IF_NODE_DEFINITION.nodeType).toBe('logic')
      expect(IF_NODE_DEFINITION.subType).toBe('if')
      expect(IF_NODE_DEFINITION.label).toBe('If/Else')
      expect(IF_NODE_DEFINITION.description).toBe('Conditional branching based on previous data')
      expect(IF_NODE_DEFINITION.parameters).toHaveLength(3)
    })

    it('should validate correctly', () => {
      const validConfig = {
        condition: {
          field: 'test',
          operator: 'equals',
          value: 'value'
        }
      }
      const errors = IF_NODE_DEFINITION.validate(validConfig)
      expect(errors).toEqual([])
    })

    it('should provide correct defaults', () => {
      const defaults = IF_NODE_DEFINITION.getDefaults()
      expect(defaults.condition.field).toBe('')
      expect(defaults.condition.operator).toBe('equals')
      expect(defaults.condition.value).toBe('')
    })
  })
})
