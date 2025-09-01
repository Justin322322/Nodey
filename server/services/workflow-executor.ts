import { 
  Workflow, 
  WorkflowNode, 
  WorkflowExecution,
  ExecutionLog,
  NodeType,
  ActionType,
  TriggerType,
  LogicType,
  HttpNodeConfig,
  ScheduleNodeConfig,
  IfNodeConfig,
  LogicNodeData
} from '../../types/workflow'
import { v4 as uuidv4 } from 'uuid'
import { ScheduleNodeService } from '../../nodes/ScheduleNode/ScheduleNode.service'
import { executeHttpRequest } from './http-client'
import { validateNodeBeforeExecute } from '../../lib/node-definitions'
import { executeEmailNode } from '@/nodes/EmailNode'
import { executeHttpNode } from '@/nodes/HttpNode'
import { executeManualNode } from '@/nodes/ManualNode'
import { executeIfNode } from '@/nodes/IfNode'
import { executeFilterNode } from '@/nodes/FilterNode'
import { executeDatabaseNode } from '@/nodes/DatabaseNode'
import { executeTransformNode } from '@/nodes/TransformNode'
import { executeDelayNode } from '@/nodes/DelayNode'
import { WebhookNodeService } from '../../nodes/WebhookNode/WebhookNode.service'
import { NodeExecutionContext } from '../../nodes/types'

export class WorkflowExecutor {
  private workflow: Workflow
  private execution: WorkflowExecution
  private logs: ExecutionLog[] = []
  private nodeOutputs: Record<string, unknown> = {}
  private abortController: AbortController
  
  constructor(workflow: Workflow) {
    this.workflow = workflow
    this.abortController = new AbortController()
    this.execution = {
      id: uuidv4(),
      workflowId: workflow.id,
      status: 'running',
      startedAt: new Date(),
      logs: [],
      nodeOutputs: {}
    }
  }
  
  async execute(options?: { startNodeId?: string }): Promise<WorkflowExecution> {
    try {
      this.log('info', 'workflow-start', `Starting workflow: ${this.workflow.name}`)
      
      if (options?.startNodeId) {
        const startNode = this.workflow.nodes.find(n => n.id === options.startNodeId)
        if (!startNode) throw new Error('Start node not found')
        await this.executeNode(startNode)
      } else {
        // Find all trigger nodes
        const triggerNodes = this.workflow.nodes.filter(
          node => node.data.nodeType === NodeType.TRIGGER
        )
        
        if (triggerNodes.length === 0) {
          throw new Error('No trigger nodes found in workflow')
        }
        
        // Execute each trigger node and its downstream nodes
        for (const triggerNode of triggerNodes) {
          if (this.abortController.signal.aborted) break
          await this.executeNode(triggerNode)
        }
      }
      
      this.execution.status = 'completed'
      this.log('info', 'workflow-end', `Workflow completed successfully`)
    } catch (error) {
      this.execution.status = 'failed'
      this.execution.error = error instanceof Error ? error.message : 'Unknown error'
      this.log('error', 'workflow-error', `Workflow failed: ${this.execution.error}`)
    }
    
    this.execution.completedAt = new Date()
    this.execution.logs = this.logs
    this.execution.nodeOutputs = this.nodeOutputs
    
    return this.execution
  }
  
  stop() {
    this.abortController.abort()
    this.execution.status = 'cancelled'
    this.execution.completedAt = new Date()
  }
  
  private async executeNode(node: WorkflowNode): Promise<unknown> {
    if (this.abortController.signal.aborted) {
      throw new Error('Execution cancelled')
    }
    
    this.log('info', node.id, `Executing node: ${node.data.label}`)

    // Validate node config using definition schema (n8n-inspired)
    const errors = validateNodeBeforeExecute(node)
    if (errors.length > 0) {
      const message = `Invalid configuration: ${errors.join('; ')}`
      this.log('error', node.id, message)
      throw new Error(message)
    }
    
    try {
      let output: unknown
      const runSettings = node.data.runSettings || {}
      const timeoutMs = runSettings.timeoutMs ?? 30000
      const retryCount = runSettings.retryCount ?? 0
      const retryDelayMs = runSettings.retryDelayMs ?? 0
      const continueOnFail = runSettings.continueOnFail ?? false

      const executeWithTimeout = async (): Promise<unknown> => {
        // perform single attempt execution wrapped with timeout
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const result = await this.executeNodeCore(node, controller.signal)
          return result
        } finally {
          clearTimeout(timer)
        }
      }

      let attempt = 0
      while (true) {
        try {
          output = await executeWithTimeout()
          break
        } catch (err) {
          attempt += 1
          const message = err instanceof Error ? err.message : String(err)
          this.log('error', node.id, `Attempt ${attempt} failed: ${message}`)
          if (attempt > retryCount) {
            if (continueOnFail) {
              this.log('warning', node.id, 'continueOnFail enabled; proceeding downstream')
              output = { __error: true, message }
              break
            }
            throw err
          }
          if (retryDelayMs > 0) {
            await new Promise((r) => setTimeout(r, retryDelayMs))
          }
        }
      }
      
      this.nodeOutputs[node.id] = output
      this.log('info', node.id, `Node executed successfully`, output)
      
      // Execute downstream nodes
      const downstreamEdges = this.workflow.edges.filter(edge => edge.source === node.id)
      for (const edge of downstreamEdges) {
        const targetNode = this.workflow.nodes.find(n => n.id === edge.target)
        if (!targetNode) continue

        // Branch routing for IF node using sourceHandle id 'true'/'false'
        if (node.data.nodeType === NodeType.LOGIC && (node.data as LogicNodeData).logicType === LogicType.IF) {
          let branch: string = 'false'
          if (typeof output === 'object' && output !== null) {
            const o = output as Record<string, unknown>
            if (typeof o.branch === 'string') {
              branch = o.branch
            } else if (typeof o.conditionMet === 'boolean') {
              branch = o.conditionMet ? 'true' : 'false'
            }
          }
          const sourceHandle = edge.sourceHandle ?? undefined
          if (sourceHandle && sourceHandle !== branch) {
            continue
          }
        }
        await this.executeNode(targetNode)
      }
      
      return output
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.log('error', node.id, `Node execution failed: ${errorMsg}`)
      throw error
    }
  }

  private async executeNodeCore(node: WorkflowNode, signal?: AbortSignal): Promise<unknown> {
    // Execute based on node type
    switch (node.data.nodeType) {
      case NodeType.TRIGGER:
        return await this.executeTriggerNode(node, signal)
      case NodeType.ACTION:
        return await this.executeActionNode(node, signal)
      case NodeType.LOGIC:
        return await this.executeLogicNode(node, signal)
      default:
        throw new Error('Unknown node type')
    }
  }
  
  private async executeTriggerNode(node: WorkflowNode, signal?: AbortSignal): Promise<unknown> {
    const { triggerType, config } = node.data as { triggerType: TriggerType; config: unknown }
    
    const context: NodeExecutionContext = {
      nodeId: node.id,
      workflowId: this.workflow.id,
      config: config as Record<string, unknown>,
      input: this.getPreviousNodeOutput(node) || {},
      previousNodes: this.getPreviousNodes(node),
      executionId: this.execution.id,
      signal
    }
    
    switch (triggerType) {
      case TriggerType.MANUAL: {
        const result = await executeManualNode(context)
        if (!result.success) {
          throw new Error(result.error || 'Manual trigger execution failed')
        }
        return result.output
      }
        
      case TriggerType.WEBHOOK: {
        const result = await WebhookNodeService.execute(context)
        if (!result.success) {
          throw new Error(result.error || 'Webhook trigger execution failed')
        }
        return result.output
      }
        
      case TriggerType.SCHEDULE: {
        const result = await ScheduleNodeService.execute(context)
        if (!result.success) {
          throw new Error(result.error || 'Schedule execution failed')
        }
        return result.output
      }
        
      case TriggerType.EMAIL:
        // In a real implementation, this would monitor an email inbox
        return { triggered: true, from: 'test@example.com' }
        
      default:
        throw new Error(`Unknown trigger type: ${triggerType}`)
    }
  }
  
  private async executeActionNode(node: WorkflowNode, signal?: AbortSignal): Promise<unknown> {
    const { actionType, config } = node.data as { actionType: ActionType; config: unknown }
    
    const context: NodeExecutionContext = {
      nodeId: node.id,
      workflowId: this.workflow.id,
      config: config as Record<string, unknown>,
      input: this.getPreviousNodeOutput(node) || {},
      previousNodes: this.getPreviousNodes(node),
      executionId: this.execution.id,
      signal
    }
    
    switch (actionType) {
      case ActionType.HTTP: {
        const result = await executeHttpNode(context)
        if (!result.success) {
          throw new Error(result.error || 'HTTP execution failed')
        }
        return result.output
      }
        
      case ActionType.EMAIL: {
        const result = await executeEmailNode(context)
        if (!result.success) {
          throw new Error(result.error || 'Email execution failed')
        }
        return result.output
      }
        
      case ActionType.DATABASE: {
        const result = await executeDatabaseNode(context)
        if (!result.success) {
          throw new Error(result.error || 'Database execution failed')
        }
        return result.output
      }
        
      case ActionType.TRANSFORM: {
        const result = await executeTransformNode(context)
        if (!result.success) {
          throw new Error(result.error || 'Transform execution failed')
        }
        return result.output
      }
        
      case ActionType.DELAY: {
        const result = await executeDelayNode(context)
        if (!result.success) {
          throw new Error(result.error || 'Delay execution failed')
        }
        return result.output
      }
        
      default:
        throw new Error(`Unknown action type: ${actionType}`)
    }
  }
  
  private async executeLogicNode(node: WorkflowNode, signal?: AbortSignal): Promise<unknown> {
    const { logicType, config } = node.data as { logicType: LogicType; config: unknown }
    
    const context: NodeExecutionContext = {
      nodeId: node.id,
      workflowId: this.workflow.id,
      config: config as Record<string, unknown>,
      input: this.getPreviousNodeOutput(node) || {},
      previousNodes: this.getPreviousNodes(node),
      executionId: this.execution.id,
      signal
    }
    
    switch (logicType) {
      case LogicType.IF: {
        const result = await executeIfNode(context)
        if (!result.success) {
          throw new Error(result.error || 'IF logic execution failed')
        }
        return result.output
      }
        
      case LogicType.SWITCH:
        // Mock switch logic
        return { case: 'default' }
        
      case LogicType.LOOP: {
        // Mock loop logic
        return { iterations: 0, items: [] }
      }
        
      case LogicType.FILTER: {
        const result = await executeFilterNode(context)
        if (!result.success) {
          throw new Error(result.error || 'Filter logic execution failed')
        }
        return result.output
      }
        
      default:
        throw new Error(`Unknown logic type: ${logicType}`)
    }
  }
  
  private async executeHttpRequest(config: HttpNodeConfig, signal?: AbortSignal): Promise<unknown> {
    try {
      const response = await executeHttpRequest(config, signal)
      return response
    } catch (error) {
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  

  
  private evaluateCondition(condition: { field: string; operator: string; value: unknown }, data: unknown): boolean {
    // Simple condition evaluation
    const { field, operator, value } = condition
    const fieldValue = this.getNestedValue(data, field)
    
    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'notEquals':
        return fieldValue !== value
      case 'contains':
        return String(fieldValue).includes(String(value))
      case 'greaterThan':
        return Number(fieldValue) > Number(value)
      case 'lessThan':
        return Number(fieldValue) < Number(value)
      default:
        return false
    }
  }
  
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part]
      }
      return undefined
    }, obj)
  }
  
  private extractArrayFromPrevious(previousOutput: unknown): unknown[] {
    if (Array.isArray(previousOutput)) return previousOutput
    if (previousOutput && typeof previousOutput === 'object') {
      const obj = previousOutput as Record<string, unknown>
      if (Array.isArray(obj.items)) return obj.items
      if (Array.isArray(obj.data)) return obj.data as unknown[]
      if (obj.data && typeof obj.data === 'object') {
        const dataObj = obj.data as Record<string, unknown>
        if (Array.isArray(dataObj.items)) return dataObj.items
      }
    }
    return []
  }
  
  private getPreviousNodeOutput(node: WorkflowNode): unknown {
    // Find the edge that connects to this node
    const incomingEdge = this.workflow.edges.find(edge => edge.target === node.id)
    if (!incomingEdge) return null
    
    return this.nodeOutputs[incomingEdge.source] || null
  }
  
  private getPreviousNodes(node: WorkflowNode): string[] {
    // Find all nodes that connect to this node
    const incomingEdges = this.workflow.edges.filter(edge => edge.target === node.id)
    return incomingEdges.map(edge => edge.source)
  }
  
  private log(level: 'info' | 'warning' | 'error', nodeId: string, message: string, data?: unknown) {
    const log: ExecutionLog = {
      timestamp: new Date(),
      nodeId,
      message,
      level,
      data
    }
    this.logs.push(log)
  }
}
