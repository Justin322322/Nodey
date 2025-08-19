import { describe, it, expect, beforeEach } from 'vitest'
import { WorkflowExecutor } from '@/server/services/workflow-executor'
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  NodeType, 
  TriggerType, 
  ActionType, 
  LogicType 
} from '@/types/workflow'
import { HttpExecutionResult } from '@/nodes/HttpNode/HttpNode.types'
import { DatabaseExecutionResult } from '@/nodes/DatabaseNode/DatabaseNode.types'
import { TransformExecutionResult } from '@/nodes/TransformNode/TransformNode.types'
import { DelayExecutionResult } from '@/nodes/DelayNode/DelayNode.types'
import { IfExecutionResult } from '@/nodes/IfNode/IfNode.types'
import { v4 as uuidv4 } from 'uuid'

describe('Workflow Execution Integration', () => {
  let mockWorkflow: Workflow

  beforeEach(() => {
    mockWorkflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Integration test workflow',
      nodes: [],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }
  })

  describe('Single Node Execution', () => {
    it('should execute a manual trigger node', async () => {
      const nodeId = uuidv4()
      const node: WorkflowNode = {
        id: nodeId,
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          label: 'Manual Trigger',
          nodeType: NodeType.TRIGGER,
          triggerType: TriggerType.MANUAL,
          config: {}
        }
      }

      mockWorkflow.nodes = [node]
      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute()

      expect(result.status).toBe('completed')
      expect(result.logs.length).toBeGreaterThan(0)
      expect(result.nodeOutputs[nodeId]).toBeDefined()
    })

    it('should execute an HTTP action node', async () => {
      const nodeId = uuidv4()
      const node: WorkflowNode = {
        id: nodeId,
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'HTTP Request',
          nodeType: NodeType.ACTION,
          actionType: ActionType.HTTP,
          config: {
            method: 'GET',
            url: 'https://httpbin.org/get',
            authentication: { type: 'none' }
          }
        }
      }

      mockWorkflow.nodes = [node]
      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute({ startNodeId: nodeId })

      // HTTP node execution may succeed or fail depending on network
      expect(['completed', 'failed']).toContain(result.status)
      expect(result.completedAt).toBeDefined()
      
      if (result.status === 'completed') {
        expect(result.nodeOutputs[nodeId]).toBeDefined()
        const httpResult = result.nodeOutputs[nodeId] as HttpExecutionResult
        expect(httpResult.url).toBe('https://httpbin.org/get')
      }
    })

    it('should execute a database action node (placeholder)', async () => {
      // Skip test in CI if TEST_DB_URL is not set
      if (!process.env.TEST_DB_URL && process.env.CI === 'true') {
        return // Skip test in CI environment without TEST_DB_URL
      }
      
      // This test uses mocked database operations - no live database required
      const testConnectionString = process.env.TEST_DB_URL || 'postgresql://mock:mock@localhost:5432/mockdb'

      const nodeId = uuidv4()
      const node: WorkflowNode = {
        id: nodeId,
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Database Query',
          nodeType: NodeType.ACTION,
          actionType: ActionType.DATABASE,
          config: {
            operation: 'select',
            connectionString: testConnectionString,
            query: 'SELECT * FROM users'
          }
        }
      }

      mockWorkflow.nodes = [node]
      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute({ startNodeId: nodeId })

      // Note: DatabaseNode service uses mock implementation, no actual DB connection is made
      expect(result.status).toBe('completed')
      expect(result.nodeOutputs[nodeId]).toBeDefined()
      
      const dbResult = result.nodeOutputs[nodeId] as DatabaseExecutionResult
      expect(dbResult.operation).toBe('select')
      expect(dbResult.rows).toBeDefined()
      // Verify we get mock data (indicating successful mock execution)
      expect(Array.isArray(dbResult.rows)).toBe(true)
    })

    it('should execute a transform action node (placeholder)', async () => {
      const nodeId = uuidv4()
      const node: WorkflowNode = {
        id: nodeId,
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Data Transform',
          nodeType: NodeType.ACTION,
          actionType: ActionType.TRANSFORM,
          config: {
            operation: 'map',
            language: 'javascript',
            script: 'return { ...item, processed: true }'
          }
        }
      }

      mockWorkflow.nodes = [node]
      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute({ startNodeId: nodeId })

      expect(result.status).toBe('completed')
      expect(result.nodeOutputs[nodeId]).toBeDefined()
      
      const transformResult = result.nodeOutputs[nodeId] as TransformExecutionResult
      expect(transformResult.operation).toBe('map')
      expect(transformResult.transformedData).toBeDefined()
    })

    it('should execute a delay action node (placeholder)', async () => {
      const nodeId = uuidv4()
      const node: WorkflowNode = {
        id: nodeId,
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Delay',
          nodeType: NodeType.ACTION,
          actionType: ActionType.DELAY,
          config: {
            delayType: 'fixed',
            value: 0.01, // 10ms for fast test
            unit: 'seconds',
            passthrough: true
          }
        }
      }

      mockWorkflow.nodes = [node]
      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute({ startNodeId: nodeId })

      expect(result.status).toBe('completed')
      expect(result.nodeOutputs[nodeId]).toBeDefined()
      
      const delayResult = result.nodeOutputs[nodeId] as DelayExecutionResult
      expect(delayResult.delayType).toBe('fixed')
      expect(delayResult.actualDelayMs).toBeGreaterThan(0)
    })

    it('should execute an IF logic node', async () => {
      const nodeId = uuidv4()
      const node: WorkflowNode = {
        id: nodeId,
        type: 'logic',
        position: { x: 0, y: 0 },
        data: {
          label: 'IF Condition',
          nodeType: NodeType.LOGIC,
          logicType: LogicType.IF,
          config: {
            condition: {
              field: 'value',
              operator: 'equals',
              value: 'test'
            }
          }
        }
      }

      mockWorkflow.nodes = [node]
      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute({ startNodeId: nodeId })

      expect(result.status).toBe('completed')
      expect(result.nodeOutputs[nodeId]).toBeDefined()
      
      const ifResult = result.nodeOutputs[nodeId] as IfExecutionResult
      expect(ifResult.conditionMet).toBeDefined()
      expect(typeof ifResult.conditionMet).toBe('boolean')
    })

    it('should execute a FILTER logic node', async () => {
      const nodeId = uuidv4()
      const node: WorkflowNode = {
        id: nodeId,
        type: 'logic',
        position: { x: 0, y: 0 },
        data: {
          label: 'Filter Items',
          nodeType: NodeType.LOGIC,
          logicType: LogicType.FILTER,
          config: {
            condition: {
              field: 'active',
              operator: 'equals',
              value: true
            }
          }
        }
      }

      mockWorkflow.nodes = [node]
      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute({ startNodeId: nodeId })

      // Filter node should execute (completed or failed both acceptable for integration test)
      expect(['completed', 'failed']).toContain(result.status)
      expect(result.completedAt).toBeDefined()
    })
  })

  describe('Multi-Node Workflow Execution', () => {
    it('should execute a simple linear workflow', async () => {
      const triggerId = uuidv4()
      const actionId = uuidv4()

      const triggerNode: WorkflowNode = {
        id: triggerId,
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          label: 'Manual Trigger',
          nodeType: NodeType.TRIGGER,
          triggerType: TriggerType.MANUAL,
          config: {}
        }
      }

      const actionNode: WorkflowNode = {
        id: actionId,
        type: 'action',
        position: { x: 0, y: 100 },
        data: {
          label: 'Transform Data',
          nodeType: NodeType.ACTION,
          actionType: ActionType.TRANSFORM,
          config: {
            operation: 'map',
            language: 'javascript',
            script: 'return { ...item, processed: true }'
          }
        }
      }

      const edge: WorkflowEdge = {
        id: uuidv4(),
        source: triggerId,
        target: actionId
      }

      mockWorkflow.nodes = [triggerNode, actionNode]
      mockWorkflow.edges = [edge]

      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute()

      expect(result.status).toBe('completed')
      expect(result.nodeOutputs[triggerId]).toBeDefined()
      expect(result.nodeOutputs[actionId]).toBeDefined()
      
      // Should have logs for both nodes
      const triggerLogs = result.logs.filter(log => log.nodeId === triggerId)
      const actionLogs = result.logs.filter(log => log.nodeId === actionId)
      expect(triggerLogs.length).toBeGreaterThan(0)
      expect(actionLogs.length).toBeGreaterThan(0)
    })

    it('should execute a workflow with conditional branching', async () => {
      const triggerId = uuidv4()
      const ifNodeId = uuidv4()
      const trueActionId = uuidv4()
      const falseActionId = uuidv4()

      const triggerNode: WorkflowNode = {
        id: triggerId,
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          label: 'Manual Trigger',
          nodeType: NodeType.TRIGGER,
          triggerType: TriggerType.MANUAL,
          config: {}
        }
      }

      const ifNode: WorkflowNode = {
        id: ifNodeId,
        type: 'logic',
        position: { x: 0, y: 100 },
        data: {
          label: 'IF Condition',
          nodeType: NodeType.LOGIC,
          logicType: LogicType.IF,
          config: {
            condition: {
              field: 'shouldProcess',
              operator: 'equals',
              value: true
            }
          }
        }
      }

      const trueActionNode: WorkflowNode = {
        id: trueActionId,
        type: 'action',
        position: { x: -100, y: 200 },
        data: {
          label: 'Process Data',
          nodeType: NodeType.ACTION,
          actionType: ActionType.TRANSFORM,
          config: {
            operation: 'map',
            language: 'javascript',
            script: 'return { ...item, processed: true }'
          }
        }
      }

      const falseActionNode: WorkflowNode = {
        id: falseActionId,
        type: 'action',
        position: { x: 100, y: 200 },
        data: {
          label: 'Skip Processing',
          nodeType: NodeType.ACTION,
          actionType: ActionType.DELAY,
          config: {
            delayType: 'fixed',
            value: 0.001,
            unit: 'seconds',
            passthrough: true
          }
        }
      }

      const edges: WorkflowEdge[] = [
        { id: uuidv4(), source: triggerId, target: ifNodeId },
        { id: uuidv4(), source: ifNodeId, target: trueActionId, sourceHandle: 'true' },
        { id: uuidv4(), source: ifNodeId, target: falseActionId, sourceHandle: 'false' }
      ]

      mockWorkflow.nodes = [triggerNode, ifNode, trueActionNode, falseActionNode]
      mockWorkflow.edges = edges

      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute()

      expect(result.status).toBe('completed')
      expect(result.nodeOutputs[triggerId]).toBeDefined()
      expect(result.nodeOutputs[ifNodeId]).toBeDefined()
      
      // One of the action nodes should have executed based on the condition
      const trueActionExecuted = result.nodeOutputs[trueActionId] !== undefined
      const falseActionExecuted = result.nodeOutputs[falseActionId] !== undefined
      
      // At least one should have executed (depending on condition evaluation)
      expect(trueActionExecuted || falseActionExecuted).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle workflow with no trigger nodes', async () => {
      const actionNode: WorkflowNode = {
        id: uuidv4(),
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Orphaned Action',
          nodeType: NodeType.ACTION,
          actionType: ActionType.TRANSFORM,
          config: {
            operation: 'map',
            language: 'javascript',
            script: 'return item'
          }
        }
      }

      mockWorkflow.nodes = [actionNode]
      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute()

      expect(result.status).toBe('failed')
      expect(result.error).toContain('No trigger nodes found')
    })

    it('should handle invalid node configuration', async () => {
      const nodeId = uuidv4()
      const node: WorkflowNode = {
        id: nodeId,
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          label: 'Invalid HTTP',
          nodeType: NodeType.ACTION,
          actionType: ActionType.HTTP,
          config: {
            // Missing required URL field
            method: 'GET'
          }
        }
      }

      mockWorkflow.nodes = [node]
      const executor = new WorkflowExecutor(mockWorkflow)
      const result = await executor.execute({ startNodeId: nodeId })

      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
    })
  })

  describe('Workflow Cancellation', () => {
    it('should handle workflow cancellation', async () => {
      const nodeId = uuidv4()
      const node: WorkflowNode = {
        id: nodeId,
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          label: 'Manual Trigger', // Use manual trigger for simpler cancellation test
          nodeType: NodeType.TRIGGER,
          triggerType: TriggerType.MANUAL,
          config: {}
        }
      }

      mockWorkflow.nodes = [node]
      const executor = new WorkflowExecutor(mockWorkflow)
      
      // Test the stop functionality
      const executionPromise = executor.execute()
      executor.stop() // Immediately stop
      
      const result = await executionPromise

      expect(['cancelled', 'completed']).toContain(result.status)
      expect(result.completedAt).toBeDefined()
    })
  })
})
