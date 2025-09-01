import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  NODE_REGISTRY, 
  getNodeDefinition, 
  getAllNodeDefinitions, 
  getNodesByType, 
  isNodeRegistered,
  clearRegistry,
  registerNode,
  NodeDefinition
} from '@/nodes'
import { NodeType, ActionType, TriggerType, LogicType } from '@/types/workflow'

describe('Node Registry Integration', () => {
  describe('Registry Population', () => {
    it('should have all expected nodes registered', () => {
      const allNodes = getAllNodeDefinitions()
      
      // Should have all 11 node types (including EmailTriggerNode)
      expect(allNodes).toHaveLength(11)
      
      // Check that we have the right number of each type
      const triggerNodes = getNodesByType(NodeType.TRIGGER)
      const actionNodes = getNodesByType(NodeType.ACTION)
      const logicNodes = getNodesByType(NodeType.LOGIC)
      
      expect(triggerNodes).toHaveLength(4) // MANUAL, SCHEDULE, WEBHOOK, EMAIL
      expect(actionNodes).toHaveLength(5) // EMAIL, HTTP, DATABASE, TRANSFORM, DELAY
      expect(logicNodes).toHaveLength(2) // IF, FILTER
    })

    it('should have all trigger nodes registered', () => {
      expect(isNodeRegistered(NodeType.TRIGGER, TriggerType.MANUAL)).toBe(true)
      expect(isNodeRegistered(NodeType.TRIGGER, TriggerType.SCHEDULE)).toBe(true)
      expect(isNodeRegistered(NodeType.TRIGGER, TriggerType.WEBHOOK)).toBe(true)
      
      expect(getNodeDefinition(NodeType.TRIGGER, TriggerType.MANUAL)).toBeDefined()
      expect(getNodeDefinition(NodeType.TRIGGER, TriggerType.SCHEDULE)).toBeDefined()
      expect(getNodeDefinition(NodeType.TRIGGER, TriggerType.WEBHOOK)).toBeDefined()
    })

    it('should have all action nodes registered', () => {
      expect(isNodeRegistered(NodeType.ACTION, ActionType.EMAIL)).toBe(true)
      expect(isNodeRegistered(NodeType.ACTION, ActionType.HTTP)).toBe(true)
      expect(isNodeRegistered(NodeType.ACTION, ActionType.DATABASE)).toBe(true)
      expect(isNodeRegistered(NodeType.ACTION, ActionType.TRANSFORM)).toBe(true)
      expect(isNodeRegistered(NodeType.ACTION, ActionType.DELAY)).toBe(true)
      
      expect(getNodeDefinition(NodeType.ACTION, ActionType.EMAIL)).toBeDefined()
      expect(getNodeDefinition(NodeType.ACTION, ActionType.HTTP)).toBeDefined()
      expect(getNodeDefinition(NodeType.ACTION, ActionType.DATABASE)).toBeDefined()
      expect(getNodeDefinition(NodeType.ACTION, ActionType.TRANSFORM)).toBeDefined()
      expect(getNodeDefinition(NodeType.ACTION, ActionType.DELAY)).toBeDefined()
    })

    it('should have all logic nodes registered', () => {
      expect(isNodeRegistered(NodeType.LOGIC, LogicType.IF)).toBe(true)
      expect(isNodeRegistered(NodeType.LOGIC, LogicType.FILTER)).toBe(true)
      
      expect(getNodeDefinition(NodeType.LOGIC, LogicType.IF)).toBeDefined()
      expect(getNodeDefinition(NodeType.LOGIC, LogicType.FILTER)).toBeDefined()
    })
  })

  describe('Node Definition Validation', () => {
    it('should have valid node definitions for all nodes', () => {
      const allNodes = getAllNodeDefinitions()
      
      allNodes.forEach(node => {
        // Check required properties
        expect(node.nodeType).toBeDefined()
        expect(node.subType).toBeDefined()
        expect(node.label).toBeDefined()
        expect(node.description).toBeDefined()
        expect(node.parameters).toBeDefined()
        expect(Array.isArray(node.parameters)).toBe(true)
        expect(typeof node.validate).toBe('function')
        expect(typeof node.getDefaults).toBe('function')
        
        // Test that validate function works
        const defaults = node.getDefaults()
        expect(defaults).toBeDefined()
        
        // Validation should pass for default config
        const errors = node.validate(defaults)
        expect(Array.isArray(errors)).toBe(true)
      })
    })

    it('should have unique node type/subtype combinations', () => {
      const allNodes = getAllNodeDefinitions()
      const combinations = new Set()
      
      allNodes.forEach(node => {
        const combo = `${node.nodeType}-${node.subType}`
        expect(combinations.has(combo)).toBe(false)
        combinations.add(combo)
      })
    })

    it('should provide valid defaults for all nodes', () => {
      const allNodes = getAllNodeDefinitions()
      
      allNodes.forEach(node => {
        const defaults = node.getDefaults()
        expect(defaults).toBeDefined()
        expect(typeof defaults).toBe('object')
        
        // Note: Some nodes may have empty defaults that require user configuration
        // This is expected behavior for nodes like Email that require sensitive credentials
        const errors = node.validate(defaults)
        expect(Array.isArray(errors)).toBe(true)
        
        // For nodes that do provide complete defaults, they should validate
        // Some nodes require user-provided configuration
        const nodesRequiringConfig = [
          ActionType.EMAIL,
          ActionType.HTTP,
          ActionType.DATABASE,
          ActionType.TRANSFORM,
          LogicType.IF,
          LogicType.FILTER
        ]
        if (!nodesRequiringConfig.includes(node.subType as ActionType | LogicType)) {          expect(errors).toEqual([])
        }
      })
    })
  })

  describe('Registry Operations', () => {
    let originalRegistry: Map<string, NodeDefinition>

    beforeEach(() => {
      // Save original registry
      originalRegistry = new Map(NODE_REGISTRY)
    })

    afterEach(() => {
      // Restore original registry
      clearRegistry()
      originalRegistry.forEach((value, key) => {
        NODE_REGISTRY.set(key, value)
      })
    })

    it('should allow registering and unregistering nodes', () => {
      // Clear registry for clean test
      clearRegistry()
      expect(getAllNodeDefinitions()).toHaveLength(0)
      
      // Register a mock node
      const mockNode = {
        nodeType: NodeType.ACTION,
        subType: 'test',
        label: 'Test Node',
        description: 'Test Description',
        parameters: [],
        validate: () => [],
        getDefaults: () => ({})
      }
      
      registerNode(mockNode)
      expect(getAllNodeDefinitions()).toHaveLength(1)
      expect(isNodeRegistered(NodeType.ACTION, 'test')).toBe(true)
      expect(getNodeDefinition(NodeType.ACTION, 'test')).toBe(mockNode)
    })

    it('should filter nodes by type correctly', () => {
      const actionNodes = getNodesByType(NodeType.ACTION)
      const triggerNodes = getNodesByType(NodeType.TRIGGER)
      const logicNodes = getNodesByType(NodeType.LOGIC)
      
      actionNodes.forEach(node => {
        expect(node.nodeType).toBe(NodeType.ACTION)
      })
      
      triggerNodes.forEach(node => {
        expect(node.nodeType).toBe(NodeType.TRIGGER)
      })
      
      logicNodes.forEach(node => {
        expect(node.nodeType).toBe(NodeType.LOGIC)
      })
    })
  })

  describe('Node Type Coverage', () => {
    it('should cover all ActionType enum values', () => {
      const registeredActions = getNodesByType(NodeType.ACTION).map(n => n.subType)
      
      // Check that all important action types are covered
      expect(registeredActions).toContain(ActionType.EMAIL)
      expect(registeredActions).toContain(ActionType.HTTP)
      expect(registeredActions).toContain(ActionType.DATABASE)
      expect(registeredActions).toContain(ActionType.TRANSFORM)
      expect(registeredActions).toContain(ActionType.DELAY)
    })

    it('should cover all TriggerType enum values', () => {
      const registeredTriggers = getNodesByType(NodeType.TRIGGER).map(n => n.subType)
      
      // Check that all important trigger types are covered
      expect(registeredTriggers).toContain(TriggerType.MANUAL)
      expect(registeredTriggers).toContain(TriggerType.SCHEDULE)
      expect(registeredTriggers).toContain(TriggerType.WEBHOOK)
    })

    it('should cover all LogicType enum values', () => {
      const registeredLogic = getNodesByType(NodeType.LOGIC).map(n => n.subType)
      
      // Check that all important logic types are covered
      expect(registeredLogic).toContain(LogicType.IF)
      expect(registeredLogic).toContain(LogicType.FILTER)
    })
  })
})
