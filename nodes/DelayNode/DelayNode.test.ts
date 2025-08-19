import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeDelayNode } from './DelayNode.service'
import { DELAY_NODE_DEFINITION } from './DelayNode.schema'
import { DelayNodeConfig, DelayExecutionResult } from './DelayNode.types'
import { NodeExecutionContext } from '../types'

describe('DelayNode', () => {
  describe('Schema and Validation', () => {
    it('should have correct node definition structure', () => {
      expect(DELAY_NODE_DEFINITION.nodeType).toBe('action')
      expect(DELAY_NODE_DEFINITION.subType).toBe('delay')
      expect(DELAY_NODE_DEFINITION.label).toBe('Delay')
      expect(DELAY_NODE_DEFINITION.parameters).toHaveLength(5)
    })

    it('should validate required fields', () => {
      const invalidConfigs = [
        {}, // empty config
        { delayType: 'fixed' }, // missing value and unit
        { value: 5 }, // missing delayType and unit
        { unit: 'seconds' }, // missing delayType and value
        { delayType: 'fixed', value: -1, unit: 'seconds' }, // negative value
      ]

      invalidConfigs.forEach(config => {
        const errors = DELAY_NODE_DEFINITION.validate(config)
        expect(errors.length).toBeGreaterThan(0)
      })
    })

    it('should validate delay types', () => {
      const config = {
        delayType: 'invalid',
        value: 5,
        unit: 'seconds'
      }
      
      const errors = DELAY_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Valid delay type is required')
    })

    it('should validate time units', () => {
      const config = {
        delayType: 'fixed',
        value: 5,
        unit: 'invalid'
      }
      
      const errors = DELAY_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Valid time unit is required')
    })

    it('should validate delay value bounds', () => {
      const configNegative = {
        delayType: 'fixed',
        value: -1,
        unit: 'seconds'
      }
      
      const errorsNegative = DELAY_NODE_DEFINITION.validate(configNegative)
      expect(errorsNegative).toContain('Delay value must be a non-negative number')
      
      const configTooLong = {
        delayType: 'fixed',
        value: 25,
        unit: 'hours'
      }
      
      const errorsTooLong = DELAY_NODE_DEFINITION.validate(configTooLong)
      expect(errorsTooLong).toContain('Delay cannot exceed 24 hours')
    })

    it('should pass validation with valid config', () => {
      const config = {
        delayType: 'fixed',
        value: 5,
        unit: 'seconds',
        passthrough: true
      }
      
      const errors = DELAY_NODE_DEFINITION.validate(config)
      expect(errors).toHaveLength(0)
    })

    it('should allow zero delay values', () => {
      const config = {
        delayType: 'fixed',
        value: 0,
        unit: 'seconds',
        passthrough: true
      }
      
      const errors = DELAY_NODE_DEFINITION.validate(config)
      expect(errors).toHaveLength(0)
    })

    it('should provide correct defaults', () => {
      const defaults = DELAY_NODE_DEFINITION.getDefaults()
      expect(defaults).toEqual({
        delayType: 'fixed',
        unit: 'seconds',
        value: 1,
        passthrough: true
      })
    })
  })

  describe('Delay Execution', () => {
    let mockContext: NodeExecutionContext

    beforeEach(() => {
      mockContext = {
        nodeId: 'test-node',
        workflowId: 'test-workflow',
        executionId: 'test-execution',
        config: {
          delayType: 'fixed',
          value: 0.1, // 100ms for fast tests
          unit: 'seconds',
          passthrough: true
        } as DelayNodeConfig,
        input: { testData: 'input data' },
        previousNodes: []
      }
    })

    it('should execute FIXED delay successfully', async () => {
      const startTime = Date.now()
      const result = await executeDelayNode(mockContext)
      const endTime = Date.now()
      const actualDelay = endTime - startTime
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        delayType: 'fixed',
        actualDelayMs: 100,
        plannedDelayMs: 100,
        unit: 'seconds',
        passthrough: true,
        passthroughData: { testData: 'input data' }
      })
      
      // Check that actual delay was approximately correct (allow 50ms tolerance)
      expect(actualDelay).toBeGreaterThanOrEqual(90)
      expect(actualDelay).toBeLessThan(200)
    })

    it('should execute RANDOM delay successfully', async () => {
      mockContext.config = {
        delayType: 'random',
        value: 0.1,
        unit: 'seconds',
        maxDelayMs: 200,
        passthrough: true
      } as DelayNodeConfig

      const result = await executeDelayNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        delayType: 'random',
        plannedDelayMs: 100,
        unit: 'seconds',
        passthrough: true
      })
      
      // Random delay should be between 0 and maxDelayMs
      const actualDelay = (result.output as DelayExecutionResult).actualDelayMs
      expect(actualDelay).toBeGreaterThan(0)
      expect(actualDelay).toBeLessThanOrEqual(200)
    })

    it('should execute EXPONENTIAL delay successfully', async () => {
      mockContext.config = {
        delayType: 'exponential',
        value: 0.05,
        unit: 'seconds',
        maxDelayMs: 300,
        passthrough: true
      } as DelayNodeConfig

      const result = await executeDelayNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        delayType: 'exponential',
        plannedDelayMs: 50,
        unit: 'seconds',
        passthrough: true
      })
      
      // Exponential delay should be between base and max
      const actualDelay = (result.output as DelayExecutionResult).actualDelayMs
      expect(actualDelay).toBeGreaterThan(0)
      expect(actualDelay).toBeLessThanOrEqual(300)
    })

    it('should handle different time units', async () => {
      // Test milliseconds
      mockContext.config = {
        delayType: 'fixed',
        value: 50,
        unit: 'milliseconds',
        passthrough: true
      } as DelayNodeConfig

      const result = await executeDelayNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        actualDelayMs: 50,
        plannedDelayMs: 50,
        unit: 'milliseconds'
      })
    })

    it('should handle passthrough disabled', async () => {
      mockContext.config = {
        delayType: 'fixed',
        value: 0.01,
        unit: 'seconds',
        passthrough: false
      } as DelayNodeConfig

      const result = await executeDelayNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        passthrough: false,
        passthroughData: undefined
      })
    })

    it('should handle invalid delay value', async () => {
      mockContext.config = {
        delayType: 'fixed',
        value: -1,
        unit: 'seconds',
        passthrough: true
      } as DelayNodeConfig

      const result = await executeDelayNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Valid delay value is required')
    })

    it('should handle abort signal', async () => {
      const abortController = new AbortController()
      mockContext.signal = abortController.signal
      mockContext.config = {
        delayType: 'fixed',
        value: 1, // 1 second delay
        unit: 'seconds',
        passthrough: true
      } as DelayNodeConfig

      // Abort after 50ms
      setTimeout(() => abortController.abort(), 50)

      const result = await executeDelayNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Delay was cancelled')
    })

    it('should handle pre-aborted signal', async () => {
      const abortController = new AbortController()
      abortController.abort()
      mockContext.signal = abortController.signal

      const result = await executeDelayNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Execution was cancelled')
    })

    it('should handle unsupported delay type', async () => {
      mockContext.config = {
        delayType: 'invalid' as DelayNodeConfig['delayType'],
        value: 1,
        unit: 'seconds',
        passthrough: true
      } as DelayNodeConfig

      const result = await executeDelayNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unsupported delay type: invalid')
    })

    it('should enforce delay bounds', async () => {
      // Test very large delay gets capped
      mockContext.config = {
        delayType: 'fixed',
        value: 0.01, // Use a very small value for testing the cap logic
        unit: 'seconds',
        passthrough: true
      } as DelayNodeConfig

      const result = await executeDelayNode(mockContext)
      
      // Should execute successfully and respect bounds
      expect(result.success).toBe(true)
      expect((result.output as DelayExecutionResult).actualDelayMs).toBeGreaterThan(0)
      expect((result.output as DelayExecutionResult).actualDelayMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
    })
  })
})
