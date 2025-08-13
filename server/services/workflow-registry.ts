import { Workflow, WorkflowExecution } from '@/types/workflow'

// Simple in-memory registry for demo purposes only
const workflowRegistry = new Map<string, Workflow>()
const workflowExecutions = new Map<string, WorkflowExecution[]>()

export function saveWorkflowToRegistry(workflow: Workflow) {
  workflowRegistry.set(workflow.id, workflow)
}

export function getWorkflowById(workflowId: string): Workflow | undefined {
  return workflowRegistry.get(workflowId)
}

export function saveWorkflowExecution(workflowId: string, execution: WorkflowExecution) {
  const list = workflowExecutions.get(workflowId) || []
  list.push(execution)
  workflowExecutions.set(workflowId, list)
}

