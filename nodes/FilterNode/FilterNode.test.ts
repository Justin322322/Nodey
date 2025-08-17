import { describe, it, expect } from 'vitest'
import { FilterNodeService, executeFilterNode } from './FilterNode.service'
import { FILTER_NODE_DEFINITION } from './FilterNode.schema'
import { FilterNodeConfig, FilterExecutionResult } from './FilterNode.types'
import { NodeExecutionContext } from '@/nodes/types'

describe('FilterNode', () => {
  describe('FilterNodeService', () => {
    describe('execute', () => {
      it('should filter array successfully', async () => {
        const config: FilterNodeConfig = {
          condition: {
            field: 'status',
            operator: 'equals',
            value: 'active'
          }
        }

        const inputArray = [
          { id: 1, status: 'active', name: 'Item 1' },
          { id: 2, status: 'inactive', name: 'Item 2' },
          { id: 3, status: 'active', name: 'Item 3' }
        ]

        const context: NodeExecutionContext = {
          nodeId: 'filter-1',
          workflowId: 'workflow-1',
          config,
          input: inputArray,
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await FilterNodeService.execute(context)

        expect(result.success).toBe(true)
        const output = result.output as FilterExecutionResult
        expect(output?.originalCount).toBe(3)
        expect(output?.filteredCount).toBe(2)
        expect(output?.filteredItems).toHaveLength(2)
        expect(output?.filteredItems[0]).toEqual({ id: 1, status: 'active', name: 'Item 1' })
        expect(output?.filteredItems[1]).toEqual({ id: 3, status: 'active', name: 'Item 3' })
      })

      it('should handle object with array property', async () => {
        const config: FilterNodeConfig = {
          condition: {
            field: 'active',
            operator: 'equals',
            value: 'true'
          }
        }

        const inputObject = {
          users: [
            { id: 1, active: true },
            { id: 2, active: false },
            { id: 3, active: true }
          ],
          metadata: { total: 3 }
        }

        const context: NodeExecutionContext = {
          nodeId: 'filter-1',
          workflowId: 'workflow-1',
          config,
          input: inputObject,
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await FilterNodeService.execute(context)

        expect(result.success).toBe(true)
        const output = result.output as FilterExecutionResult
        expect(output?.originalCount).toBe(3)
        expect(output?.filteredCount).toBe(2)
      })

      it('should handle nested field paths', async () => {
        const config: FilterNodeConfig = {
          condition: {
            field: 'user.role',
            operator: 'equals',
            value: 'admin'
          }
        }

        const inputArray = [
          { id: 1, user: { role: 'admin', name: 'John' } },
          { id: 2, user: { role: 'user', name: 'Jane' } },
          { id: 3, user: { role: 'admin', name: 'Bob' } }
        ]

        const context: NodeExecutionContext = {
          nodeId: 'filter-1',
          workflowId: 'workflow-1',
          config,
          input: inputArray,
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await FilterNodeService.execute(context)

        expect(result.success).toBe(true)
                const output = result.output as FilterExecutionResult
        expect(output?.filteredCount).toBe(2)
        expect(output?.filteredItems.every(item =>
          (item as { user: { role: string } }).user.role === 'admin'
        )).toBe(true)
      })

      it('should fail with non-array input', async () => {
        const config: FilterNodeConfig = {
          condition: {
            field: 'status',
            operator: 'equals',
            value: 'active'
          }
        }

        const context: NodeExecutionContext = {
          nodeId: 'filter-1',
          workflowId: 'workflow-1',
          config,
          input: { notAnArray: 'value' },
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await FilterNodeService.execute(context)

        expect(result.success).toBe(false)
        expect(result.error).toContain('must be an array')
      })

      it('should fail with invalid config', async () => {
        const config = { condition: { field: '', operator: 'equals', value: '' } }

        const context: NodeExecutionContext = {
          nodeId: 'filter-1',
          workflowId: 'workflow-1',
          config,
          input: [],
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await FilterNodeService.execute(context)

        expect(result.success).toBe(false)
        expect(result.error).toContain('validation failed')
      })
    })

    describe('evaluateCondition', () => {
      it('should handle all operators correctly', () => {
        // equals
        expect(FilterNodeService.evaluateCondition('test', 'equals', 'test')).toBe(true)
        expect(FilterNodeService.evaluateCondition('test', 'equals', 'other')).toBe(false)

        // notEquals
        expect(FilterNodeService.evaluateCondition('test', 'notEquals', 'other')).toBe(true)
        expect(FilterNodeService.evaluateCondition('test', 'notEquals', 'test')).toBe(false)

        // contains
        expect(FilterNodeService.evaluateCondition('hello world', 'contains', 'world')).toBe(true)
        expect(FilterNodeService.evaluateCondition('hello world', 'contains', 'foo')).toBe(false)

        // greaterThan
        expect(FilterNodeService.evaluateCondition(10, 'greaterThan', '5')).toBe(true)
        expect(FilterNodeService.evaluateCondition(3, 'greaterThan', '5')).toBe(false)

        // lessThan
        expect(FilterNodeService.evaluateCondition(3, 'lessThan', '5')).toBe(true)
        expect(FilterNodeService.evaluateCondition(10, 'lessThan', '5')).toBe(false)
      })
    })

    describe('getValueAtPath', () => {
      it('should extract nested values', () => {
        const obj = { user: { profile: { name: 'John' } } }
        expect(FilterNodeService.getValueAtPath(obj, 'user.profile.name')).toBe('John')
      })

      it('should return undefined for non-existent paths', () => {
        const obj = { user: { name: 'John' } }
        expect(FilterNodeService.getValueAtPath(obj, 'user.age')).toBe(undefined)
        expect(FilterNodeService.getValueAtPath(obj, 'nonexistent.path')).toBe(undefined)
      })

      it('should handle null/undefined objects', () => {
        expect(FilterNodeService.getValueAtPath(null, 'path')).toBe(undefined)
        expect(FilterNodeService.getValueAtPath(undefined, 'path')).toBe(undefined)
      })
    })

    describe('validateFilter', () => {
      it('should validate correct config', () => {
        const config: FilterNodeConfig = {
          condition: {
            field: 'status',
            operator: 'equals',
            value: 'active'
          }
        }

        const result = FilterNodeService.validateFilter(config)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual([])
      })

      it('should fail with missing condition', () => {
        const config = {} as FilterNodeConfig

        const result = FilterNodeService.validateFilter(config)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Condition configuration is required')
      })

      it('should fail with invalid operator', () => {
        const config = {
          condition: { field: 'test', operator: 'invalid', value: 'test' }
        } as unknown as FilterNodeConfig

        const result = FilterNodeService.validateFilter(config)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid operator: invalid')
      })
    })

    describe('getDisplayInfo', () => {
      it('should return display info for configured condition', () => {
        const config: FilterNodeConfig = {
          condition: {
            field: 'status',
            operator: 'contains',
            value: 'active'
          }
        }

        const result = FilterNodeService.getDisplayInfo(config)
        expect(result.status).toBe('Configured')
        expect(result.description).toBe('Filter where status contains "active"')
      })

      it('should return not configured for empty condition', () => {
        const config = {} as FilterNodeConfig

        const result = FilterNodeService.getDisplayInfo(config)
        expect(result.status).toBe('Not configured')
        expect(result.description).toBe('Filter condition not configured')
      })
    })
  })

  describe('executeFilterNode', () => {
    it('should execute successfully', async () => {
      const config: FilterNodeConfig = {
        condition: {
          field: 'active',
          operator: 'equals',
          value: 'true'
        }
      }

      const context: NodeExecutionContext = {
        nodeId: 'filter-1',
        workflowId: 'workflow-1',
        config,
        input: [{ active: true }, { active: false }],
        previousNodes: [],
        executionId: 'exec-1'
      }

      const result = await executeFilterNode(context)

      expect(result.success).toBe(true)
      const output = result.output as FilterExecutionResult
      expect(output?.filteredCount).toBe(1)
    })
  })

  describe('FILTER_NODE_DEFINITION', () => {
    it('should have correct schema properties', () => {
      expect(FILTER_NODE_DEFINITION.nodeType).toBe('logic')
      expect(FILTER_NODE_DEFINITION.subType).toBe('filter')
      expect(FILTER_NODE_DEFINITION.label).toBe('Filter')
      expect(FILTER_NODE_DEFINITION.description).toBe('Filter array items using a simple condition')
      expect(FILTER_NODE_DEFINITION.parameters).toHaveLength(3)
    })

    it('should validate correctly', () => {
      const validConfig = {
        condition: {
          field: 'test',
          operator: 'equals',
          value: 'value'
        }
      }
      const errors = FILTER_NODE_DEFINITION.validate(validConfig)
      expect(errors).toEqual([])
    })

    it('should provide correct defaults', () => {
      const defaults = FILTER_NODE_DEFINITION.getDefaults()
      expect(defaults.condition.field).toBe('')
      expect(defaults.condition.operator).toBe('equals')
      expect(defaults.condition.value).toBe('')
    })
  })
})
