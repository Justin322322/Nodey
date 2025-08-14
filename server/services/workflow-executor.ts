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
  EmailNodeConfig,
  ScheduleNodeConfig,
  IfNodeConfig,
  LogicNodeData
} from '@/types/workflow'
import { v4 as uuidv4 } from 'uuid'
import { executeHttpRequest } from '@/server/services/http-client'

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
        return await this.executeTriggerNode(node)
      case NodeType.ACTION:
        return await this.executeActionNode(node, signal)
      case NodeType.LOGIC:
        return await this.executeLogicNode(node)
      default:
        throw new Error('Unknown node type')
    }
  }
  
  private async executeTriggerNode(node: WorkflowNode): Promise<unknown> {
    const { triggerType, config } = node.data as { triggerType: TriggerType; config: unknown }
    
    switch (triggerType) {
      case TriggerType.MANUAL:
        return { triggered: true, timestamp: new Date() }
        
      case TriggerType.WEBHOOK:
        // In a real implementation, this would set up a webhook listener
        return { triggered: true, method: 'POST', body: {} }
        
      case TriggerType.SCHEDULE: {
        const scheduleConfig = config as ScheduleNodeConfig
        return { triggered: true, cron: scheduleConfig.cron }
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
    
    switch (actionType) {
      case ActionType.HTTP:
        return await this.executeHttpRequest(config as HttpNodeConfig, signal)
        
      case ActionType.EMAIL:
        return await this.sendEmail(config as EmailNodeConfig)
        
      case ActionType.DATABASE:
        // Mock database query
        return { rows: [], affected: 0 }
        
      case ActionType.TRANSFORM:
        // Mock data transformation
        return { transformed: this.getPreviousNodeOutput(node) }
        
      case ActionType.DELAY: {
        const delayMs = (config as { delayMs?: number }).delayMs || 1000
        await new Promise(resolve => setTimeout(resolve, delayMs))
        return { delayed: delayMs }
      }
        
      default:
        throw new Error(`Unknown action type: ${actionType}`)
    }
  }
  
  private async executeLogicNode(node: WorkflowNode): Promise<unknown> {
    const { logicType, config } = node.data as { logicType: LogicType; config: unknown }
    const previousOutput = this.getPreviousNodeOutput(node)
    
    switch (logicType) {
      case LogicType.IF: {
        const ifConfig = config as IfNodeConfig
        const conditionMet = this.evaluateCondition(ifConfig.condition, previousOutput)
        return { conditionMet, branch: conditionMet ? 'true' : 'false' }
      }
        
      case LogicType.SWITCH:
        // Mock switch logic
        return { case: 'default' }
        
      case LogicType.LOOP: {
        // Mock loop logic
        return { iterations: 0, items: [] }
      }
        
      case LogicType.FILTER:
        // Mock filter logic
        return { filtered: [], count: 0 }
        
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
  
  private async sendEmail(config: EmailNodeConfig): Promise<unknown> {
    // Mock email sending
    // In a real implementation, this would use an email service
    return {
      sent: true,
      to: config.to,
      subject: config.subject,
      messageId: uuidv4()
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
  
  private getPreviousNodeOutput(node: WorkflowNode): unknown {
    // Find the edge that connects to this node
    const incomingEdge = this.workflow.edges.find(edge => edge.target === node.id)
    if (!incomingEdge) return null
    
    return this.nodeOutputs[incomingEdge.source] || null
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
