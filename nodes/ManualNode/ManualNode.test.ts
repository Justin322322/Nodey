import { describe, it, expect } from 'vitest'
import { ManualNodeService, executeManualNode } from './ManualNode.service'
import { MANUAL_NODE_DEFINITION } from './ManualNode.schema'
import { ManualNodeConfig, ManualExecutionResult } from './ManualNode.types'
import { NodeExecutionContext } from '@/nodes/types'

describe('ManualNode', () => {
  describe('ManualNodeService', () => {
    describe('execute', () => {
      it('should execute successfully with empty config', async () => {
        const context: NodeExecutionContext = {
          nodeId: 'manual-1',
          workflowId: 'workflow-1',
          config: {},
          input: {},
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await ManualNodeService.execute(context)

        expect(result.success).toBe(true)
        expect(result.output).toBeDefined()
        const output = result.output as ManualExecutionResult
        expect(output.triggered).toBe(true)
        expect(output.timestamp).toBeInstanceOf(Date)
      })

      it('should execute successfully with valid config', async () => {
        const config: ManualNodeConfig = {}
        const context: NodeExecutionContext = {
          nodeId: 'manual-1',
          workflowId: 'workflow-1',
          config,
          input: {},
          previousNodes: [],
          executionId: 'exec-1'
        }

        const result = await ManualNodeService.execute(context)

        expect(result.success).toBe(true)
        const output = result.output as ManualExecutionResult
        expect(output?.triggered).toBe(true)
        expect(output?.triggeredBy).toBe('manual-1')
      })
    })

    describe('validateManual', () => {
      it('should validate empty config successfully', () => {
        const config: ManualNodeConfig = {}
        const result = ManualNodeService.validateManual(config)

        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual([])
      })
    })

    describe('isReady', () => {
      it('should always be ready', () => {
        const config: ManualNodeConfig = {}
        const result = ManualNodeService.isReady(config)

        expect(result).toBe(true)
      })
    })

    describe('getDisplayInfo', () => {
      it('should return correct display info', () => {
        const config: ManualNodeConfig = {}
        const result = ManualNodeService.getDisplayInfo(config)

        expect(result.status).toBe('Ready')
        expect(result.description).toBe('Manual trigger - ready to execute when needed')
      })
    })
  })

  describe('executeManualNode', () => {
    it('should execute successfully', async () => {
      const context: NodeExecutionContext = {
        nodeId: 'manual-1',
        workflowId: 'workflow-1',
        config: {},
        input: {},
        previousNodes: [],
        executionId: 'exec-1'
      }

      const result = await executeManualNode(context)

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
    })
  })

  describe('MANUAL_NODE_DEFINITION', () => {
    it('should have correct schema properties', () => {
      expect(MANUAL_NODE_DEFINITION.nodeType).toBe('trigger')
      expect(MANUAL_NODE_DEFINITION.subType).toBe('manual')
      expect(MANUAL_NODE_DEFINITION.label).toBe('Manual Trigger')
      expect(MANUAL_NODE_DEFINITION.description).toBe('Start the workflow manually (no configuration needed)')
      expect(MANUAL_NODE_DEFINITION.parameters).toEqual([])
    })

    it('should validate correctly', () => {
      const config = {}
      const errors = MANUAL_NODE_DEFINITION.validate(config)
      expect(errors).toEqual([])
    })

    it('should provide correct defaults', () => {
      const defaults = MANUAL_NODE_DEFINITION.getDefaults()
      expect(defaults).toEqual({})
    })
  })
})
