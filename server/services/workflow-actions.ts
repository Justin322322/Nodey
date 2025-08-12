'use server'

import { Workflow, WorkflowExecution } from '@/types/workflow'
import { WorkflowExecutor } from './workflow-executor'

// In-memory storage for demo purposes
// In production, this would use a proper database
const executors = new Map<string, WorkflowExecutor>()

export async function executeWorkflow(workflow: Workflow): Promise<WorkflowExecution> {
  try {
    const executor = new WorkflowExecutor(workflow)
    executors.set(workflow.id, executor)
    
    const execution = await executor.execute()
    
    // Clean up after execution
    executors.delete(workflow.id)
    
    return execution
  } catch (error) {
    throw new Error(`Failed to execute workflow: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function stopWorkflowExecution(workflowId: string): Promise<void> {
  const executor = executors.get(workflowId)
  if (executor) {
    executor.stop()
    executors.delete(workflowId)
  }
}

export async function saveWorkflow(workflow: Workflow): Promise<void> {
  // In a real implementation, this would save to a database
  // For now, we'll just validate the workflow
  if (!workflow.id || !workflow.name) {
    throw new Error('Invalid workflow: missing required fields')
  }
  
  if (workflow.nodes.length === 0) {
    throw new Error('Workflow must have at least one node')
  }
  
  const triggerNodes = workflow.nodes.filter(n => n.data.nodeType === 'trigger')
  if (triggerNodes.length === 0) {
    throw new Error('Workflow must have at least one trigger node')
  }
}

export async function loadWorkflow(workflowId: string): Promise<Workflow | null> {
  // In a real implementation, this would load from a database
  // For now, return null
  return null
}

export async function listWorkflows(): Promise<Workflow[]> {
  // In a real implementation, this would query a database
  // For now, return empty array
  return []
}
