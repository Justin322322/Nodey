import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeDatabaseNode } from './DatabaseNode.service'
import { DATABASE_NODE_DEFINITION } from './DatabaseNode.schema'
import { DatabaseNodeConfig, DatabaseExecutionResult } from './DatabaseNode.types'
import { NodeExecutionContext } from '../types'

describe('DatabaseNode', () => {
  describe('Schema and Validation', () => {
    it('should have correct node definition structure', () => {
      expect(DATABASE_NODE_DEFINITION.nodeType).toBe('action')
      expect(DATABASE_NODE_DEFINITION.subType).toBe('database')
      expect(DATABASE_NODE_DEFINITION.label).toBe('Database Query')
      expect(DATABASE_NODE_DEFINITION.parameters).toHaveLength(4)
    })

    it('should validate required fields', () => {
      const invalidConfigs = [
        {}, // empty config
        { operation: 'select' }, // missing connectionString and query
        { connectionString: 'test', query: '' }, // empty query
        { connectionString: '', query: 'SELECT *' }, // empty connectionString
      ]

      invalidConfigs.forEach(config => {
        const errors = DATABASE_NODE_DEFINITION.validate(config)
        expect(errors.length).toBeGreaterThan(0)
      })
    })

    it('should validate operation types', () => {
      const config = {
        operation: 'invalid',
        credentialId: 'test-credential-id',
        query: 'SELECT *'
      }
      
      const errors = DATABASE_NODE_DEFINITION.validate(config)
      expect(errors).toContain('Invalid configuration structure')
    })

    it('should validate parameters as object', () => {
      const config = {
        operation: 'select',
        credentialId: 'test-credential-id',
        query: 'SELECT *',
        parameters: 'invalid parameters'
      }
      
      const errors = DATABASE_NODE_DEFINITION.validate(config)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain('Invalid parameters JSON: Unable to parse JSON string')
    })

    it('should pass validation with valid config', () => {
      const config = {
        operation: 'select',
        connectionString: 'postgresql://user:pass@localhost:5432/db',
        query: 'SELECT * FROM users',
        parameters: { limit: 10 }
      }
      
      const errors = DATABASE_NODE_DEFINITION.validate(config)
      expect(errors).toHaveLength(0)
    })

    it('should provide correct defaults', () => {
      const defaults = DATABASE_NODE_DEFINITION.getDefaults()
      expect(defaults).toEqual({
        operation: 'select',
        credentialId: '',
        query: '',
        parameters: {}
      })
    })
  })

  describe('Database Execution', () => {
    let mockContext: NodeExecutionContext

    beforeEach(() => {
      mockContext = {
        nodeId: 'test-node',
        workflowId: 'test-workflow',
        executionId: 'test-execution',
        config: {
          operation: 'select',
          credentialId: 'test-credential-id',
          connectionString: 'postgresql://user:pass@localhost:5432/testdb',
          query: 'SELECT * FROM users'
        } as DatabaseNodeConfig,
        input: {},
        previousNodes: []
      }
    })

    it('should execute SELECT operation successfully', async () => {
      const result = await executeDatabaseNode(mockContext)
      
      expect(result.success).toBe(true)
      const output = result.output as DatabaseExecutionResult
      expect(output).toMatchObject({
        operation: 'select',
        query: 'SELECT * FROM users'
      })
      expect(Array.isArray(output.rows)).toBe(true)
      const rows = output.rows as Array<{ id: number; name: string }>
      expect(rows.length).toBeGreaterThan(0)
      if (rows.length > 0) {
        expect(typeof rows[0].id).toBe('number')
        expect(typeof rows[0].name).toBe('string')
      }
      expect(typeof output.duration).toBe('number')
    })

    it('should execute INSERT operation successfully', async () => {
      mockContext.config = {
        operation: 'insert',
        credentialId: 'test-credential-id',
        connectionString: 'postgresql://user:pass@localhost:5432/testdb',
        query: 'INSERT INTO users (name, email) VALUES ($1, $2)',
        parameters: { name: 'John', email: 'john@example.com' }
      } as DatabaseNodeConfig

      const result = await executeDatabaseNode(mockContext)
      
      expect(result.success).toBe(true)
      const output = result.output as DatabaseExecutionResult
      expect(output).toMatchObject({
        operation: 'insert',
        affectedRows: 1
      })
      expect(typeof output.insertId).toBe('number')
      expect(typeof output.duration).toBe('number')
    })

    it('should execute UPDATE operation successfully', async () => {
      mockContext.config = {
        operation: 'update',
        credentialId: 'test-credential-id',
        connectionString: 'postgresql://user:pass@localhost:5432/testdb',
        query: 'UPDATE users SET name = $1 WHERE id = $2'
      } as DatabaseNodeConfig

      const result = await executeDatabaseNode(mockContext)
      
      expect(result.success).toBe(true)
      const output = result.output as DatabaseExecutionResult
      expect(output).toMatchObject({
        operation: 'update',
        affectedRows: 2
      })
      expect(typeof output.duration).toBe('number')
    })

    it('should execute DELETE operation successfully', async () => {
      mockContext.config = {
        operation: 'delete',
        credentialId: 'test-credential-id',
        connectionString: 'postgresql://user:pass@localhost:5432/testdb',
        query: 'DELETE FROM users WHERE id = $1'
      } as DatabaseNodeConfig

      const result = await executeDatabaseNode(mockContext)
      
      expect(result.success).toBe(true)
      const output = result.output as DatabaseExecutionResult
      expect(output).toMatchObject({
        operation: 'delete',
        affectedRows: 1
      })
      expect(typeof output.duration).toBe('number')
    })

    it('should handle missing connection string', async () => {
      mockContext.config = {
        operation: 'select',
        credentialId: '',
        connectionString: '',
        query: 'SELECT *'
      } as DatabaseNodeConfig

      const result = await executeDatabaseNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Database credential is required')
    })

    it('should handle whitespace-only credential ID', async () => {
      mockContext.config = {
        operation: 'select',
        credentialId: '   ',  // whitespace-only
        connectionString: '',
        query: 'SELECT *'
      } as DatabaseNodeConfig

      const result = await executeDatabaseNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection string is required')
    })

    it('should handle missing query', async () => {
      mockContext.config = {
        operation: 'select',
        credentialId: 'test-credential-id',
        connectionString: 'postgresql://test',
        query: ''
      } as DatabaseNodeConfig

      const result = await executeDatabaseNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('SQL query is required')
    })

    it('should handle abort signal', async () => {
      const abortController = new AbortController()
      mockContext.signal = abortController.signal
      abortController.abort()

      const result = await executeDatabaseNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Execution was cancelled')
    })

    it('should handle unsupported operation', async () => {
      mockContext.config = {
        operation: 'truncate' as DatabaseNodeConfig['operation'],
        credentialId: 'test-credential-id',
        connectionString: 'postgresql://test',
        query: 'TRUNCATE TABLE users'
      } as DatabaseNodeConfig

      const result = await executeDatabaseNode(mockContext)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unsupported operation: truncate')
    })
  })
})
