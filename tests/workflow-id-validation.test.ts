import { describe, it, expect } from 'vitest'
import { isValidWorkflowId } from '@/lib/workflow-id-validation'

/**
 * Test the workflowId validation regex pattern
 * This ensures our browser-compatible regex maintains the same validation rules
 */

// Use the production validator to ensure we test real behavior

describe('WorkflowId Validation', () => {
  describe('Valid inputs', () => {
    it('should accept identifiers 3–64 chars long (alphanumeric, "-" or "_")', () => {
      expect(isValidWorkflowId('abc')).toBe(true)
      expect(isValidWorkflowId('ABC')).toBe(true)
      expect(isValidWorkflowId('123')).toBe(true)
      expect(isValidWorkflowId('a1b')).toBe(true)
      expect(isValidWorkflowId('A1b')).toBe(true)
      expect(isValidWorkflowId('my_id-123')).toBe(true)
      expect(isValidWorkflowId('a'.repeat(64))).toBe(true)
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

    it('should reject strings that are too short (< 3 characters)', () => {
      expect(isValidWorkflowId('a')).toBe(false)
      expect(isValidWorkflowId('12')).toBe(false)
      expect(isValidWorkflowId('ab')).toBe(false)
    })

    it('should reject strings that are too long (> 64 characters)', () => {
      const longString = 'a'.repeat(65) // 65 characters
      expect(isValidWorkflowId(longString)).toBe(false)
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
