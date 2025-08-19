import { describe, it, expect } from 'vitest'
import { NodeType, ActionType, TriggerType, LogicType } from '@/types/workflow'

describe('Node Import Consistency', () => {
  describe('Individual Node Imports', () => {
    it('should import EmailNode components correctly', async () => {
      const emailModule = await import('@/nodes/EmailNode')
      
      expect(emailModule.EMAIL_NODE_DEFINITION).toBeDefined()
      expect(emailModule.executeEmailNode).toBeDefined()
      expect(emailModule.EmailNode).toBeDefined()
      expect(typeof emailModule.executeEmailNode).toBe('function')
      
      // Check node definition structure
      expect(emailModule.EMAIL_NODE_DEFINITION.nodeType).toBe(NodeType.ACTION)
      expect(emailModule.EMAIL_NODE_DEFINITION.subType).toBe(ActionType.EMAIL)
    })

    it('should import HttpNode components correctly', async () => {
      const httpModule = await import('@/nodes/HttpNode')
      
      expect(httpModule.HTTP_NODE_DEFINITION).toBeDefined()
      expect(httpModule.executeHttpNode).toBeDefined()
      expect(httpModule.HttpNode).toBeDefined()
      expect(typeof httpModule.executeHttpNode).toBe('function')
      
      expect(httpModule.HTTP_NODE_DEFINITION.nodeType).toBe(NodeType.ACTION)
      expect(httpModule.HTTP_NODE_DEFINITION.subType).toBe(ActionType.HTTP)
    })

    it('should import ScheduleNode components correctly', async () => {
      const scheduleModule = await import('@/nodes/ScheduleNode')
      
      expect(scheduleModule.SCHEDULE_NODE_DEFINITION).toBeDefined()
      expect(scheduleModule.ScheduleNodeService).toBeDefined()
      expect(scheduleModule.ScheduleNode).toBeDefined()
      
      expect(scheduleModule.SCHEDULE_NODE_DEFINITION.nodeType).toBe(NodeType.TRIGGER)
      expect(scheduleModule.SCHEDULE_NODE_DEFINITION.subType).toBe(TriggerType.SCHEDULE)
    })

    it('should import WebhookNode components correctly', async () => {
      const webhookModule = await import('@/nodes/WebhookNode')
      
      expect(webhookModule.WEBHOOK_NODE_DEFINITION).toBeDefined()
      expect(webhookModule.WebhookNodeService).toBeDefined()
      expect(webhookModule.WebhookNode).toBeDefined()
      
      expect(webhookModule.WEBHOOK_NODE_DEFINITION.nodeType).toBe(NodeType.TRIGGER)
      expect(webhookModule.WEBHOOK_NODE_DEFINITION.subType).toBe(TriggerType.WEBHOOK)
    })

    it('should import ManualNode components correctly', async () => {
      const manualModule = await import('@/nodes/ManualNode')
      
      expect(manualModule.MANUAL_NODE_DEFINITION).toBeDefined()
      expect(manualModule.executeManualNode).toBeDefined()
      expect(manualModule.ManualNode).toBeDefined()
      expect(typeof manualModule.executeManualNode).toBe('function')
      
      expect(manualModule.MANUAL_NODE_DEFINITION.nodeType).toBe(NodeType.TRIGGER)
      expect(manualModule.MANUAL_NODE_DEFINITION.subType).toBe(TriggerType.MANUAL)
    })

    it('should import IfNode components correctly', async () => {
      const ifModule = await import('@/nodes/IfNode')
      
      expect(ifModule.IF_NODE_DEFINITION).toBeDefined()
      expect(ifModule.executeIfNode).toBeDefined()
      expect(ifModule.IfNode).toBeDefined()
      expect(typeof ifModule.executeIfNode).toBe('function')
      
      expect(ifModule.IF_NODE_DEFINITION.nodeType).toBe(NodeType.LOGIC)
      expect(ifModule.IF_NODE_DEFINITION.subType).toBe(LogicType.IF)
    })

    it('should import FilterNode components correctly', async () => {
      const filterModule = await import('@/nodes/FilterNode')
      
      expect(filterModule.FILTER_NODE_DEFINITION).toBeDefined()
      expect(filterModule.executeFilterNode).toBeDefined()
      expect(filterModule.FilterNode).toBeDefined()
      expect(typeof filterModule.executeFilterNode).toBe('function')
      
      expect(filterModule.FILTER_NODE_DEFINITION.nodeType).toBe(NodeType.LOGIC)
      expect(filterModule.FILTER_NODE_DEFINITION.subType).toBe(LogicType.FILTER)
    })

    it('should import DatabaseNode components correctly', async () => {
      const databaseModule = await import('@/nodes/DatabaseNode')
      
      expect(databaseModule.DATABASE_NODE_DEFINITION).toBeDefined()
      expect(databaseModule.executeDatabaseNode).toBeDefined()
      expect(databaseModule.DatabaseNode).toBeDefined()
      expect(typeof databaseModule.executeDatabaseNode).toBe('function')
      
      expect(databaseModule.DATABASE_NODE_DEFINITION.nodeType).toBe(NodeType.ACTION)
      expect(databaseModule.DATABASE_NODE_DEFINITION.subType).toBe(ActionType.DATABASE)
    })

    it('should import TransformNode components correctly', async () => {
      const transformModule = await import('@/nodes/TransformNode')
      
      expect(transformModule.TRANSFORM_NODE_DEFINITION).toBeDefined()
      expect(transformModule.executeTransformNode).toBeDefined()
      expect(transformModule.TransformNode).toBeDefined()
      expect(typeof transformModule.executeTransformNode).toBe('function')
      
      expect(transformModule.TRANSFORM_NODE_DEFINITION.nodeType).toBe(NodeType.ACTION)
      expect(transformModule.TRANSFORM_NODE_DEFINITION.subType).toBe(ActionType.TRANSFORM)
    })

    it('should import DelayNode components correctly', async () => {
      const delayModule = await import('@/nodes/DelayNode')
      
      expect(delayModule.DELAY_NODE_DEFINITION).toBeDefined()
      expect(delayModule.executeDelayNode).toBeDefined()
      expect(delayModule.DelayNode).toBeDefined()
      expect(typeof delayModule.executeDelayNode).toBe('function')
      
      expect(delayModule.DELAY_NODE_DEFINITION.nodeType).toBe(NodeType.ACTION)
      expect(delayModule.DELAY_NODE_DEFINITION.subType).toBe(ActionType.DELAY)
    })
  })

  describe('Global Node Registry Import', () => {
    it('should import all nodes from global registry', async () => {
      const nodesModule = await import('@/nodes')
      
      // Check registry functions
      expect(nodesModule.NODE_REGISTRY).toBeDefined()
      expect(nodesModule.registerNode).toBeDefined()
      expect(nodesModule.getNodeDefinition).toBeDefined()
      expect(nodesModule.getAllNodeDefinitions).toBeDefined()
      expect(nodesModule.getNodesByType).toBeDefined()
      expect(nodesModule.isNodeRegistered).toBeDefined()
      
      // Check that all node definitions are exported
      expect(nodesModule.EMAIL_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.HTTP_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.SCHEDULE_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.WEBHOOK_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.MANUAL_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.IF_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.FILTER_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.DATABASE_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.TRANSFORM_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.DELAY_NODE_DEFINITION).toBeDefined()
      
      // Check that all execution functions are exported
      expect(nodesModule.executeEmailNode).toBeDefined()
      expect(nodesModule.executeHttpNode).toBeDefined()
      expect(nodesModule.executeManualNode).toBeDefined()
      expect(nodesModule.executeIfNode).toBeDefined()
      expect(nodesModule.executeFilterNode).toBeDefined()
      expect(nodesModule.executeDatabaseNode).toBeDefined()
      expect(nodesModule.executeTransformNode).toBeDefined()
      expect(nodesModule.executeDelayNode).toBeDefined()
      
      // Check that React components are exported
      expect(nodesModule.EmailNode).toBeDefined()
      expect(nodesModule.HttpNode).toBeDefined()
      expect(nodesModule.ScheduleNode).toBeDefined()
      expect(nodesModule.WebhookNode).toBeDefined()
      expect(nodesModule.ManualNode).toBeDefined()
      expect(nodesModule.IfNode).toBeDefined()
      expect(nodesModule.FilterNode).toBeDefined()
      expect(nodesModule.DatabaseNode).toBeDefined()
      expect(nodesModule.TransformNode).toBeDefined()
      expect(nodesModule.DelayNode).toBeDefined()
    })
  })

  describe('Legacy Compatibility Import', () => {
    it('should import legacy compatibility functions', async () => {
      const legacyModule = await import('@/lib/node-definitions')
      
      expect(legacyModule.findNodeDefinition).toBeDefined()
      expect(legacyModule.getDefaultConfigForNode).toBeDefined()
      expect(legacyModule.validateNodeBeforeExecute).toBeDefined()
      
      expect(typeof legacyModule.findNodeDefinition).toBe('function')
      expect(typeof legacyModule.getDefaultConfigForNode).toBe('function')
      expect(typeof legacyModule.validateNodeBeforeExecute).toBe('function')
    })
  })

  describe('Type Consistency', () => {
    it('should have all required exports from nodes', async () => {
      const nodesModule = await import('@/nodes')
      
      // Check that all node execution functions are available
      expect(typeof nodesModule.executeEmailNode).toBe('function')
      expect(typeof nodesModule.executeHttpNode).toBe('function')
      expect(typeof nodesModule.executeManualNode).toBe('function')
      expect(typeof nodesModule.executeIfNode).toBe('function')
      expect(typeof nodesModule.executeFilterNode).toBe('function')
      expect(typeof nodesModule.executeDatabaseNode).toBe('function')
      expect(typeof nodesModule.executeTransformNode).toBe('function')
      expect(typeof nodesModule.executeDelayNode).toBe('function')
      
      // Check that all node definitions are available
      expect(nodesModule.EMAIL_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.HTTP_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.SCHEDULE_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.WEBHOOK_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.MANUAL_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.IF_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.FILTER_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.DATABASE_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.TRANSFORM_NODE_DEFINITION).toBeDefined()
      expect(nodesModule.DELAY_NODE_DEFINITION).toBeDefined()
    })
  })
})
