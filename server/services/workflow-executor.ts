import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
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
  LoopNodeConfig
} from '@/types/workflow'
import { v4 as uuidv4 } from 'uuid'
import { executeHttpRequest } from '@/server/services/http-client'

export class WorkflowExecutor {
  private workflow: Workflow
  private execution: WorkflowExecution
  private logs: ExecutionLog[] = []
  private nodeOutputs: Record<string, any> = {}
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
  
  async execute(): Promise<WorkflowExecution> {
    try {
      this.log('info', 'workflow-start', `Starting workflow: ${this.workflow.name}`)
      
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
  
  private async executeNode(node: WorkflowNode): Promise<any> {
    if (this.abortController.signal.aborted) {
      throw new Error('Execution cancelled')
    }
    
    this.log('info', node.id, `Executing node: ${node.data.label}`)
    
    try {
      let output: any
      
      // Execute based on node type
      switch (node.data.nodeType) {
        case NodeType.TRIGGER:
          output = await this.executeTriggerNode(node)
          break
        case NodeType.ACTION:
          output = await this.executeActionNode(node)
          break
        case NodeType.LOGIC:
          output = await this.executeLogicNode(node)
          break
      }
      
      this.nodeOutputs[node.id] = output
      this.log('info', node.id, `Node executed successfully`, output)
      
      // Execute downstream nodes
      const downstreamEdges = this.workflow.edges.filter(edge => edge.source === node.id)
      for (const edge of downstreamEdges) {
        const targetNode = this.workflow.nodes.find(n => n.id === edge.target)
        if (targetNode) {
          await this.executeNode(targetNode)
        }
      }
      
      return output
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.log('error', node.id, `Node execution failed: ${errorMsg}`)
      throw error
    }
  }
  
  private async executeTriggerNode(node: WorkflowNode): Promise<any> {
    const { triggerType, config } = node.data as any
    
    switch (triggerType) {
      case TriggerType.MANUAL:
        return { triggered: true, timestamp: new Date() }
        
      case TriggerType.WEBHOOK:
        // In a real implementation, this would set up a webhook listener
        return { triggered: true, method: 'POST', body: {} }
        
      case TriggerType.SCHEDULE:
        const scheduleConfig = config as ScheduleNodeConfig
        return { triggered: true, cron: scheduleConfig.cron }
        
      case TriggerType.EMAIL:
        // In a real implementation, this would monitor an email inbox
        return { triggered: true, from: 'test@example.com' }
        
      default:
        throw new Error(`Unknown trigger type: ${triggerType}`)
    }
  }
  
  private async executeActionNode(node: WorkflowNode): Promise<any> {
    const { actionType, config } = node.data as any
    
    switch (actionType) {
      case ActionType.HTTP:
        return await this.executeHttpRequest(config as HttpNodeConfig)
        
      case ActionType.EMAIL:
        return await this.sendEmail(config as EmailNodeConfig)
        
      case ActionType.DATABASE:
        // Mock database query
        return { rows: [], affected: 0 }
        
      case ActionType.TRANSFORM:
        // Mock data transformation
        const previousOutput = this.getPreviousNodeOutput(node)
        return { transformed: previousOutput }
        
      case ActionType.DELAY:
        const delayMs = config.delayMs || 1000
        await new Promise(resolve => setTimeout(resolve, delayMs))
        return { delayed: delayMs }
        
      default:
        throw new Error(`Unknown action type: ${actionType}`)
    }
  }
  
  private async executeLogicNode(node: WorkflowNode): Promise<any> {
    const { logicType, config } = node.data as any
    const previousOutput = this.getPreviousNodeOutput(node)
    
    switch (logicType) {
      case LogicType.IF:
        const ifConfig = config as IfNodeConfig
        const conditionMet = this.evaluateCondition(ifConfig.condition, previousOutput)
        return { conditionMet, branch: conditionMet ? 'true' : 'false' }
        
      case LogicType.SWITCH:
        // Mock switch logic
        return { case: 'default' }
        
      case LogicType.LOOP:
        const loopConfig = config as LoopNodeConfig
        // Mock loop logic
        return { iterations: 0, items: [] }
        
      case LogicType.FILTER:
        // Mock filter logic
        return { filtered: [], count: 0 }
        
      default:
        throw new Error(`Unknown logic type: ${logicType}`)
    }
  }
  
  private async executeHttpRequest(config: HttpNodeConfig): Promise<any> {
    try {
      const response = await executeHttpRequest(config)
      return response
    } catch (error) {
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  private async sendEmail(config: EmailNodeConfig): Promise<any> {
    // Mock email sending
    // In a real implementation, this would use an email service
    return {
      sent: true,
      to: config.to,
      subject: config.subject,
      messageId: uuidv4()
    }
  }
  
  private evaluateCondition(condition: any, data: any): boolean {
    // Simple condition evaluation
    const { field, operator, value } = condition
    const fieldValue = this.getNestedValue(data, field)
    
    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'notEquals':
        return fieldValue !== value
      case 'contains':
        return String(fieldValue).includes(value)
      case 'greaterThan':
        return Number(fieldValue) > Number(value)
      case 'lessThan':
        return Number(fieldValue) < Number(value)
      default:
        return false
    }
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
  }
  
  private getPreviousNodeOutput(node: WorkflowNode): any {
    // Find the edge that connects to this node
    const incomingEdge = this.workflow.edges.find(edge => edge.target === node.id)
    if (!incomingEdge) return null
    
    return this.nodeOutputs[incomingEdge.source] || null
  }
  
  private log(level: 'info' | 'warning' | 'error', nodeId: string, message: string, data?: any) {
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
