import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeTransformNode } from './TransformNode.service'
import { TRANSFORM_NODE_DEFINITION } from './TransformNode.schema'
import { TransformNodeConfig } from './TransformNode.types'
import { NodeExecutionContext } from '../types'

describe('TransformNode', () => {
  describe('Schema and Validation', () => {
    it('should have correct node definition structure', () => {
      expect(TRANSFORM_NODE_DEFINITION.nodeType).toBe('action')
      expect(TRANSFORM_NODE_DEFINITION.subType).toBe('transform')
      expect(TRANSFORM_NODE_DEFINITION.label).toBe('Data Transform')
      expect(TRANSFORM_NODE_DEFINITION.parameters).toHaveLength(5)
    })

    it('should validate required fields', () => {
      const invalidConfigs = [
        {}, // empty config
        { operation: 'map' }, // missing script and language
        { language: 'javascript' }, // missing operation and script
        { operation: 'map', language: 'javascript', script: '' }, // empty script
      ]

      invalidConfigs.forEach(config => {
        const errors = TRANSFORM_NODE_DEFINITION.validate(config)
        expect(errors.length).toBeGreaterThan(0)
      })
    })

    it('should validate operation types', () => {
      const config = {
        operation: 'invalid',
        language: 'javascript',
        script: 'return item'
      }
      
      const errors = TRANSFORM_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Valid operation is required')
    })

    it('should validate language types', () => {
      const config = {
        operation: 'map',
        language: 'python',
        script: 'return item'
      }
      
      const errors = TRANSFORM_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Valid script language is required')
    })

    it('should validate JavaScript syntax', () => {
      const config = {
        operation: 'map',
        language: 'javascript',
        script: 'invalid javascript syntax {'
      }
      
      const errors = TRANSFORM_NODE_DEFINITION.validate(config)
      expect(errors.some(error => error.startsWith('Invalid JavaScript syntax in transformation script'))).toBe(true)
    })

    it('should pass validation with valid config', () => {
      const config = {
        operation: 'map',
        language: 'javascript',
        script: 'return { ...item, processed: true }'
      }
      
      const errors = TRANSFORM_NODE_DEFINITION.validate(config)
      expect(errors).toHaveLength(0)
    })

    it('should provide correct defaults', () => {
      const defaults = TRANSFORM_NODE_DEFINITION.getDefaults()
      expect(defaults).toEqual({
        operation: 'map',
        language: 'javascript',
        script: '',
        inputPath: '',
        outputPath: ''
      })
    })
  })

  describe('Transform Execution', () => {
    let mockContext: NodeExecutionContext

    beforeEach(() => {
      mockContext = {
        nodeId: 'test-node',
        workflowId: 'test-workflow',
        executionId: 'test-execution',
        config: {
          operation: 'map',
          language: 'javascript',
          script: 'return { ...item, processed: true }'
        } as TransformNodeConfig & Record<string, unknown> & Record<string, unknown>,
        input: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
        previousNodes: []
      }
    })

    it('should execute MAP operation successfully', async () => {
      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        operation: 'map',
        originalData: expect.arrayContaining([
          expect.objectContaining({ id: 1, name: 'Item 1' })
        ]) as unknown[],
        transformedData: expect.arrayContaining([
          expect.objectContaining({ id: 1, name: 'Item 1', processed: true })
        ]) as unknown[],
        itemsProcessed: 2
      })
      expect(typeof (result.output as Record<string, unknown>).duration).toBe('number')
    })

    it('should execute FILTER operation successfully', async () => {
      mockContext.config = {
        operation: 'filter',
        language: 'javascript',
        script: 'return item.id > 1'
      } as TransformNodeConfig & Record<string, unknown>

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        operation: 'filter',
        transformedData: expect.arrayContaining([]) as unknown[],
        itemsProcessed: 2
      })
    })

    it('should execute REDUCE operation successfully', async () => {
      mockContext.config = {
        operation: 'reduce',
        language: 'javascript',
        script: 'return acc + item.id'
      } as TransformNodeConfig & Record<string, unknown>

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        operation: 'reduce',
        transformedData: expect.objectContaining({
          count: 2,
          summary: expect.stringMatching(/.*/) as string
        }) as unknown,
        itemsProcessed: 2
      })
    })

    it('should execute SORT operation successfully', async () => {
      mockContext.config = {
        operation: 'sort',
        language: 'javascript',
        script: 'return a.id - b.id'
      } as TransformNodeConfig & Record<string, unknown>

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        operation: 'sort',
        transformedData: expect.arrayContaining([]) as unknown[],
        itemsProcessed: 2
      })
    })

    it('should execute GROUP operation successfully', async () => {
      mockContext.config = {
        operation: 'group',
        language: 'javascript',
        script: 'return item.category'
      } as TransformNodeConfig & Record<string, unknown>

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        operation: 'group',
        transformedData: expect.objectContaining({}) as unknown,
        itemsProcessed: 2
      })
    })

    it('should execute MERGE operation successfully', async () => {
      mockContext.input = [{ a: 1 }, { b: 2 }, { c: 3 }]
      mockContext.config = {
        operation: 'merge',
        language: 'javascript',
        script: 'return item'
      } as TransformNodeConfig & Record<string, unknown>

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        operation: 'merge',
        transformedData: expect.objectContaining({ a: 1, b: 2, c: 3 }) as unknown,
        itemsProcessed: 3
      })
    })

    it('should handle non-array input data', async () => {
      mockContext.input = { id: 1, name: 'Single Item' }

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        operation: 'map',
        itemsProcessed: 1
      })
    })

    it('should handle inputPath configuration', async () => {
      mockContext.input = { data: { items: [{ id: 1 }] } }
      mockContext.config = {
        ...(mockContext.config as unknown as TransformNodeConfig),
        inputPath: 'data.items'
      } as TransformNodeConfig & Record<string, unknown>

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        originalData: [{ id: 1 }]
      })
    })

    it('should handle outputPath configuration', async () => {
      mockContext.config = {
        ...(mockContext.config as unknown as TransformNodeConfig),
        outputPath: 'result.transformed'
      } as TransformNodeConfig & Record<string, unknown>

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(true)
      expect(result.output).toMatchObject({
        transformedData: expect.objectContaining({
          result: expect.objectContaining({
            transformed: expect.arrayContaining([]) as unknown[]
          }) as unknown
        }) as unknown
      })
    })

    it('should handle missing script', async () => {
      mockContext.config = {
        operation: 'map',
        language: 'javascript',
        script: ''
      } as TransformNodeConfig & Record<string, unknown>

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Transformation script is required')
    })

    it('should handle abort signal', async () => {
      const abortController = new AbortController()
      mockContext.signal = abortController.signal
      abortController.abort()

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Execution was cancelled')
    })

    it('should handle unsupported operation', async () => {
      mockContext.config = {
        operation: 'invalid' as TransformNodeConfig['operation'],
        language: 'javascript',
        script: 'return item'
      } as TransformNodeConfig & Record<string, unknown>

      const result = await executeTransformNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unsupported operation: invalid')
    })
  })
})
