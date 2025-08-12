"use client"

import { create } from 'zustand'
import { Node, Edge, applyNodeChanges, applyEdgeChanges, OnNodesChange, OnEdgesChange, Connection, addEdge } from 'reactflow'
import { v4 as uuidv4 } from 'uuid'
import { Workflow, WorkflowNode, WorkflowEdge, WorkflowExecution, ExecutionLog } from '@/types/workflow'
import { executeWorkflow as executeWorkflowAction, stopWorkflowExecution } from '@/lib/workflow-actions'

interface WorkflowStore {
  // Current workflow
  workflow: Workflow | null
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  
  // Workflow management
  setWorkflow: (workflow: Workflow) => void
  createNewWorkflow: () => void
  saveWorkflow: () => Promise<void>
  
  // Node operations
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  addNode: (node: WorkflowNode) => void
  addEdges: (edges: WorkflowEdge[]) => void
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void
  deleteNode: (nodeId: string) => void
  
  // Execution
  isExecuting: boolean
  currentExecution: WorkflowExecution | null
  executionLogs: ExecutionLog[]
  executeWorkflow: () => Promise<WorkflowExecution | undefined>
  stopExecution: () => Promise<boolean>
  
  // UI State
  selectedNodeId: string | null
  setSelectedNodeId: (nodeId: string | null) => void
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // Initial state
  workflow: null,
  nodes: [],
  edges: [],
  isExecuting: false,
  currentExecution: null,
  executionLogs: [],
  selectedNodeId: null,
  
  // Workflow management
  setWorkflow: (workflow) => {
    set({
      workflow,
      nodes: workflow.nodes,
      edges: workflow.edges,
    })
  },
  
  createNewWorkflow: () => {
    const newWorkflow: Workflow = {
      id: uuidv4(),
      name: 'Untitled Workflow',
      nodes: [],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
    }
    set({
      workflow: newWorkflow,
      nodes: [],
      edges: [],
    })
  },
  
  saveWorkflow: async () => {
    const { workflow, nodes, edges } = get()
    if (!workflow) return
    
    const updatedWorkflow: Workflow = {
      ...workflow,
      nodes,
      edges,
      updatedAt: new Date(),
    }
    
    // Save to localStorage for now
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]')
    const index = workflows.findIndex((w: Workflow) => w.id === workflow.id)
    
    if (index >= 0) {
      workflows[index] = updatedWorkflow
    } else {
      workflows.push(updatedWorkflow)
    }
    
    localStorage.setItem('workflows', JSON.stringify(workflows))
    set({ workflow: updatedWorkflow })
  },
  
  // Node operations
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as unknown as WorkflowNode[],
    })
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges) as unknown as WorkflowEdge[],
    })
  },
  
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    })
  },
  
  addNode: (node) => {
    set({
      nodes: ([...get().nodes, node] as unknown) as WorkflowNode[],
    })
  },
  
  addEdges: (edges) => {
    set({
      edges: ([...get().edges, ...edges] as unknown) as WorkflowEdge[],
    })
  },
  
  updateNode: (nodeId, data) => {
    set({
      nodes: (get().nodes.map((node) =>
        node.id === nodeId
          ? ({ ...node, data: { ...node.data, ...(data as any) } } as WorkflowNode)
          : node
      ) as unknown) as WorkflowNode[],
    })
  },
  
  deleteNode: (nodeId) => {
    set({
      nodes: (get().nodes.filter((node) => node.id !== nodeId) as unknown) as WorkflowNode[],
      edges: (get().edges.filter(
        (edge) => (edge as any).source !== nodeId && (edge as any).target !== nodeId
      ) as unknown) as WorkflowEdge[],
    })
  },
  
  // Execution
  executeWorkflow: async () => {
    const { workflow, nodes, edges } = get()
    if (!workflow || get().isExecuting) return
    
    const workflowToExecute: Workflow = {
      ...workflow,
      nodes,
      edges,
    }
    
    set({
      isExecuting: true,
      executionLogs: [],
    })
    
    try {
      const execution = await executeWorkflowAction(workflowToExecute)
      
      set({
        currentExecution: execution,
        executionLogs: execution.logs,
      })
      return execution
    } catch (error) {
      const errorExecution: WorkflowExecution = {
        id: uuidv4(),
        workflowId: workflow.id,
        status: 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [],
        nodeOutputs: {},
      }
      
      set({
        currentExecution: errorExecution,
      })
      return errorExecution
    } finally {
      set({
        isExecuting: false,
      })
    }
  },
  
  stopExecution: async () => {
    const { workflow, currentExecution } = get()
    if (workflow && currentExecution && currentExecution.status === 'running') {
      try {
        await stopWorkflowExecution(workflow.id)
        
        currentExecution.status = 'cancelled'
        currentExecution.completedAt = new Date()
        
        set({
          isExecuting: false,
          currentExecution,
        })
        return true
      } catch (error) {
        console.error('Failed to stop execution:', error)
        return false
      }
    }
    return false
  },
  
  // UI State
  setSelectedNodeId: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },
}))
