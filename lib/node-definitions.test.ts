import { describe, it, expect } from 'vitest'
import { validateNodeBeforeExecute, findNodeDefinition } from './node-definitions'
import { NodeType, ActionType, TriggerType, WorkflowNode } from '@/types/workflow'

describe('node-definitions', () => {
  describe('validateNodeBeforeExecute', () => {
    it('should validate Email nodes properly', () => {
      const emailNode: WorkflowNode = {
        id: 'test-email-node',
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Send Email',
          nodeType: NodeType.ACTION,
          actionType: ActionType.EMAIL,
          config: {
            // Invalid config - missing required fields
            to: [],
            subject: '',
            body: ''
          }
        }
      }

      const errors = validateNodeBeforeExecute(emailNode)
      
      // Should return validation errors for invalid Email config
      expect(errors).toContain('At least one recipient (To) is required')
      expect(errors).toContain('Subject is required')
      expect(errors).toContain('Email body is required')
    })

    it('should pass validation for valid Email node config', () => {
      const emailNode: WorkflowNode = {
        id: 'test-email-node',
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Send Email',
          nodeType: NodeType.ACTION,
          actionType: ActionType.EMAIL,
          config: {
            to: ['test@example.com'],
            subject: 'Test Subject',
            body: 'Test Body',
            emailService: {
              type: 'gmail',
              auth: {
                user: 'test@example.com',
                pass: 'testpassword'
              }
            }
          }
        }
      }

      const errors = validateNodeBeforeExecute(emailNode)
      
      // Should return no errors for valid config
      expect(errors).toHaveLength(0)
    })

    it('should validate HTTP nodes properly via fallback', () => {
      const httpNode: WorkflowNode = {
        id: 'test-http-node',
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'HTTP Request',
          nodeType: NodeType.ACTION,
          actionType: ActionType.HTTP,
          config: {
            // Invalid config - missing required URL
            method: 'GET',
            url: ''
          }
        }
      }

      const errors = validateNodeBeforeExecute(httpNode)
      
      // Should return validation errors for invalid HTTP config
      expect(errors).toContain('URL is required')
    })

    it('should pass validation for valid HTTP node config', () => {
      const httpNode: WorkflowNode = {
        id: 'test-http-node',
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'HTTP Request',
          nodeType: NodeType.ACTION,
          actionType: ActionType.HTTP,
          config: {
            method: 'GET',
            url: 'https://api.example.com/test'
          }
        }
      }

      const errors = validateNodeBeforeExecute(httpNode)
      
      // Should return no errors for valid config
      expect(errors).toHaveLength(0)
    })

    it('should return empty array for nodes without validation', () => {
      const manualNode: WorkflowNode = {
        id: 'test-manual-node',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          label: 'Manual Trigger',
          nodeType: NodeType.TRIGGER,
          triggerType: TriggerType.MANUAL,
          config: {}
        }
      }

      const errors = validateNodeBeforeExecute(manualNode)
      
      // Manual trigger has no validation, should return empty array
      expect(errors).toHaveLength(0)
    })
  })

  describe('findNodeDefinition', () => {
    it('should find Email node definition using new modular system', () => {
      const emailNode: WorkflowNode = {
        id: 'test-email-node',
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Send Email',
          nodeType: NodeType.ACTION,
          actionType: ActionType.EMAIL,
          config: {}
        }
      }

      const definition = findNodeDefinition(emailNode)
      
      // Email nodes now use the new modular definition system
      expect(definition).toBeDefined()
      expect(definition?.nodeType).toBe(NodeType.ACTION)
      expect(definition?.subType).toBe(ActionType.EMAIL)
      expect(definition?.label).toBe('Send Email')
    })

    it('should return undefined for unknown node types', () => {
      const unknownNode: WorkflowNode = {
        id: 'test-unknown-node',
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Unknown Action',
          nodeType: NodeType.ACTION,
          actionType: 'unknown' as ActionType,
          config: {}
        }
      }

      const definition = findNodeDefinition(unknownNode)
      
      expect(definition).toBeUndefined()
    })
  })
})