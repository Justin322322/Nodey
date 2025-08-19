import { describe, it, expect } from 'vitest'

/**
 * Test the workflowId validation regex pattern
 * This ensures our browser-compatible regex maintains the same validation rules
 */

// Browser-compatible regex pattern (same as in node-config-panel.tsx)
const validPattern = /^(?!.*[_-]{2})(?![_-])(?!.*[_-]$)[a-zA-Z0-9_-]+$/

function isValidWorkflowId(input: string): boolean {
  const trimmed = input.trim()
  
  if (!trimmed) {
    return false
  }

  // Reserved names check (simplified for testing)
  const reservedNames = new Set([
    'api', 'app', 'www', 'admin', 'root', 'config', 'test', 'dev', 'prod',
    'system', 'public', 'private', 'static', 'assets', 'lib', 'src', 'node_modules',
    'null', 'undefined', 'true', 'false', 'new', 'delete', 'edit', 'create'
  ])
  
  if (reservedNames.has(trimmed.toLowerCase())) {
    return false
  }

  return validPattern.test(trimmed)
}

describe('WorkflowId Validation', () => {
  describe('Valid inputs', () => {
    it('should accept single alphanumeric characters', () => {
      expect(isValidWorkflowId('a')).toBe(true)
      expect(isValidWorkflowId('A')).toBe(true)
      expect(isValidWorkflowId('1')).toBe(true)
      expect(isValidWorkflowId('9')).toBe(true)
    })

    it('should accept alphanumeric strings', () => {
      expect(isValidWorkflowId('workflow')).toBe(true)
      expect(isValidWorkflowId('myWorkflow123')).toBe(true)
      expect(isValidWorkflowId('test123')).toBe(true)
    })

    it('should accept strings with single underscores or hyphens', () => {
      expect(isValidWorkflowId('my_workflow')).toBe(true)
      expect(isValidWorkflowId('my-workflow')).toBe(true)
      expect(isValidWorkflowId('work_flow_123')).toBe(true)
      expect(isValidWorkflowId('work-flow-123')).toBe(true)
    })

    it('should accept mixed valid characters', () => {
      expect(isValidWorkflowId('my_work-flow123')).toBe(true)
      expect(isValidWorkflowId('test_123-abc')).toBe(true)
    })
  })

  describe('Invalid inputs', () => {
    it('should reject empty or whitespace-only strings', () => {
      expect(isValidWorkflowId('')).toBe(false)
      expect(isValidWorkflowId('   ')).toBe(false)
      expect(isValidWorkflowId('\t')).toBe(false)
    })

    it('should reject strings starting with underscore or hyphen', () => {
      expect(isValidWorkflowId('_workflow')).toBe(false)
      expect(isValidWorkflowId('-workflow')).toBe(false)
      expect(isValidWorkflowId('_test123')).toBe(false)
      expect(isValidWorkflowId('-test123')).toBe(false)
    })

    it('should reject strings ending with underscore or hyphen', () => {
      expect(isValidWorkflowId('workflow_')).toBe(false)
      expect(isValidWorkflowId('workflow-')).toBe(false)
      expect(isValidWorkflowId('test123_')).toBe(false)
      expect(isValidWorkflowId('test123-')).toBe(false)
    })

    it('should reject consecutive underscores or hyphens', () => {
      expect(isValidWorkflowId('work__flow')).toBe(false)
      expect(isValidWorkflowId('work--flow')).toBe(false)
      expect(isValidWorkflowId('work_-flow')).toBe(false)
      expect(isValidWorkflowId('work-_flow')).toBe(false)
      expect(isValidWorkflowId('work___flow')).toBe(false)
      expect(isValidWorkflowId('work---flow')).toBe(false)
    })

    it('should reject invalid characters', () => {
      expect(isValidWorkflowId('work@flow')).toBe(false)
      expect(isValidWorkflowId('work.flow')).toBe(false)
      expect(isValidWorkflowId('work flow')).toBe(false)
      expect(isValidWorkflowId('work+flow')).toBe(false)
      expect(isValidWorkflowId('work/flow')).toBe(false)
      expect(isValidWorkflowId('work\\flow')).toBe(false)
    })

    it('should reject reserved names (case-insensitive)', () => {
      expect(isValidWorkflowId('api')).toBe(false)
      expect(isValidWorkflowId('API')).toBe(false)
      expect(isValidWorkflowId('App')).toBe(false)
      expect(isValidWorkflowId('admin')).toBe(false)
      expect(isValidWorkflowId('test')).toBe(false)
      expect(isValidWorkflowId('TEST')).toBe(false)
      expect(isValidWorkflowId('null')).toBe(false)
      expect(isValidWorkflowId('undefined')).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle trimming correctly', () => {
      expect(isValidWorkflowId(' valid ')).toBe(true)
      expect(isValidWorkflowId('  valid123  ')).toBe(true)
      expect(isValidWorkflowId(' _invalid ')).toBe(false)
    })

    it('should handle mixed case correctly', () => {
      expect(isValidWorkflowId('MyWorkFlow123')).toBe(true)
      expect(isValidWorkflowId('MY_WORK_FLOW')).toBe(true)
      expect(isValidWorkflowId('my-Work-Flow')).toBe(true)
    })
  })
})
