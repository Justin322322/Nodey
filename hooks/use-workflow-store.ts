"use client"

import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, OnNodesChange, OnEdgesChange, Connection, addEdge } from 'reactflow'
import { v4 as uuidv4 } from 'uuid'
import { Workflow, WorkflowNode, WorkflowEdge, WorkflowExecution, ExecutionLog } from '@/types/workflow'
import { executeWorkflow as executeWorkflowAction, stopWorkflowExecution } from '@/lib/workflow-actions'
import { encryptEmailConfig, decryptEmailConfig, decryptDatabaseConfig, clearSensitiveData } from '@/lib/security'
import { ActionType } from '@/types/workflow'
import { migrateWorkflowNode } from '@/lib/migration-utils'

// Helper function to encrypt node configs based on their type
function encryptNodeConfig(node: WorkflowNode): WorkflowNode {
  if (node.data.config && typeof node.data.config === 'object') {
    const config = node.data.config as Record<string, unknown>
    let encryptedConfig: Record<string, unknown> = config
    
    // Apply type-specific encryption
    if (node.data.nodeType === 'action') {
      const actionNode = node.data as { actionType: ActionType }
      switch (actionNode.actionType) {
        case ActionType.EMAIL:
          try {
            encryptedConfig = encryptEmailConfig(config)
          } catch {
            encryptedConfig = { ...config }
          }
          break
        case ActionType.DATABASE:
          // Database configs don't need encryption here since they use credentialId references
          // Keep the config as-is (the actual connection string is encrypted in credential store)
          encryptedConfig = { ...config }
          break
        default:
          // For unknown/unsupported action types, preserve the original config
          encryptedConfig = { ...config }
          break
      }
    }
    
    return {
      ...node,
      data: {
        ...node.data,
        config: encryptedConfig
      }
    }
  }
  return node
}

// Helper function to decrypt node configs based on their type and handle migration
function decryptNodeConfig(node: WorkflowNode): WorkflowNode {
  // First, apply any necessary migrations
  const migratedNode = migrateWorkflowNode(node)
  
  if (migratedNode.data.config && typeof migratedNode.data.config === 'object') {
    const config = migratedNode.data.config as Record<string, unknown>
    let decryptedConfig: Record<string, unknown> = { ...config }
    
    // Apply type-specific decryption
    if (migratedNode.data.nodeType === 'action') {
      const actionNode = migratedNode.data as { actionType: ActionType }
      switch (actionNode.actionType) {
        case ActionType.EMAIL:
          try {
            decryptedConfig = decryptEmailConfig(config)
          } catch (error) {
            console.warn('Failed to decrypt email config, using fallback:', error)
            decryptedConfig = { ...config }
          }
          break
        case ActionType.DATABASE:
          try {
            decryptedConfig = decryptDatabaseConfig(config)
          } catch (error) {
            console.warn('Failed to decrypt database config, using fallback:', error)
            decryptedConfig = { ...config }
          }
          break
        case ActionType.HTTP:
          try {
            // HTTP configs may contain sensitive headers or auth data
            // For now, keep the config as-is since there's no specific HTTP decryption
            decryptedConfig = { ...config }
          } catch (error) {
            console.warn('Failed to process HTTP config, using fallback:', error)
            decryptedConfig = { ...config }
          }
          break
        case ActionType.TRANSFORM:
          try {
            // Transform configs typically don't contain sensitive data
            decryptedConfig = { ...config }
          } catch (error) {
            console.warn('Failed to process transform config, using fallback:', error)
            decryptedConfig = { ...config }
          }
          break
        case ActionType.DELAY:
          try {
            // Delay configs typically don't contain sensitive data
            decryptedConfig = { ...config }
          } catch (error) {
            console.warn('Failed to process delay config, using fallback:', error)
            decryptedConfig = { ...config }
          }
          break
        default:
          // Fallback for unknown action types - always provide a safe config
          console.warn('Unknown action type encountered, using safe config fallback:', actionNode.actionType)
          decryptedConfig = { ...config }
          break
      }
    }
    
    return {
      ...migratedNode,
      data: {
        ...migratedNode.data,
        config: decryptedConfig
      }
    }
  }
  return migratedNode
}

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
  executeWorkflow: (options?: { startNodeId?: string }) => Promise<WorkflowExecution | undefined>
  stopExecution: () => Promise<boolean>
  
  // UI State
  selectedNodeId: string | null
  setSelectedNodeId: (nodeId: string | null) => void
  isConfigPanelOpen: boolean
  setConfigPanelOpen: (open: boolean) => void
  pendingDeleteNodeId: string | null
  requestDeleteNode: (nodeId: string) => void
  clearPendingDelete: () => void
  isLogsDialogOpen: boolean
  setLogsDialogOpen: (open: boolean) => void
  isLogsPanelCollapsed: boolean
  setLogsPanelCollapsed: (collapsed: boolean) => void
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // Internal draft autosave timer (debounced)
  // Not part of public store, retained via closure
  _draftTimer: undefined as unknown as ReturnType<typeof setTimeout> | undefined,
  _scheduleDraftSave() {
    try {
      if ((get() as unknown as { _draftTimer?: ReturnType<typeof setTimeout> })._draftTimer) {
        clearTimeout((get() as unknown as { _draftTimer?: ReturnType<typeof setTimeout> })._draftTimer)
      }
    } catch (err) {
      console.debug('clear timer failed', err)
    }
    const timer = setTimeout(() => {
      try {
        const { workflow, nodes, edges } = get()
        if (!workflow) return
        
        // Encrypt sensitive data in nodes before saving
        const encryptedNodes = nodes.map(encryptNodeConfig)
        
        const draft = {
          ...workflow,
          nodes: encryptedNodes,
          edges,
          updatedAt: new Date(),
        }
        
        // Use sessionStorage instead of localStorage for better security
        sessionStorage.setItem('workflowDraft', JSON.stringify(draft))
        sessionStorage.setItem('lastOpenedWorkflowId', workflow.id)
      } catch (err) {
        console.debug('draft save failed', err)
      }
    }, 400)
    ;(get() as unknown as { _draftTimer?: ReturnType<typeof setTimeout> })._draftTimer = timer
  },
  // Initial state
  workflow: null,
  nodes: [],
  edges: [],
  isExecuting: false,
  currentExecution: null,
  executionLogs: [],
  selectedNodeId: null,
  isConfigPanelOpen: false,
  pendingDeleteNodeId: null,
  isLogsDialogOpen: false,
  isLogsPanelCollapsed: false,
  
  // Workflow management
  setWorkflow: (workflow) => {
    // Decrypt credentials when loading workflow
    const decryptedNodes = workflow.nodes.map(decryptNodeConfig)
    
    set({
      workflow,
      nodes: decryptedNodes,
      edges: workflow.edges,
    })
    try {
      sessionStorage.setItem('lastOpenedWorkflowId', workflow.id)
      // initialize draft on load to ensure refresh survival until first change
      const { nodes, edges } = get()
      
      // Encrypt before storing
      const encryptedNodes = nodes.map(encryptNodeConfig)
      
      const draft = { ...workflow, nodes: encryptedNodes, edges, updatedAt: new Date() }
      sessionStorage.setItem('workflowDraft', JSON.stringify(draft))
    } catch (err) {
      console.debug('initialize draft failed', err)
    }
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
    try {
      sessionStorage.setItem('lastOpenedWorkflowId', newWorkflow.id)
      sessionStorage.setItem('workflowDraft', JSON.stringify(newWorkflow))
    } catch (err) {
      console.debug('create draft failed', err)
    }
  },
  
  saveWorkflow: async () => {
    const { workflow, nodes, edges } = get()
    if (!workflow) return
    
    // Encrypt sensitive data before saving
    const encryptedNodes = nodes.map(encryptNodeConfig)
    
    const updatedWorkflow: Workflow = {
      ...workflow,
      nodes: encryptedNodes,
      edges,
      updatedAt: new Date(),
    }
    
    // Save to localStorage for persistence (encrypted)
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]') as Workflow[]
    const index = workflows.findIndex((w: Workflow) => w.id === workflow.id)
    
    if (index >= 0) {
      workflows[index] = updatedWorkflow
    } else {
      workflows.push(updatedWorkflow)
    }
    
    localStorage.setItem('workflows', JSON.stringify(workflows))
    
    // Keep the decrypted version in memory for UI
    set({ workflow: { ...workflow, nodes, edges, updatedAt: new Date() } })
    
    // Clear sensitive data from forms after saving
    setTimeout(() => {
      clearSensitiveData()
    }, 100)

    // Also sync to server registry so webhook routes can access it
    try {
      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWorkflow),
      })
    } catch {
      // no-op
    }
  },
  
  // Node operations
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as unknown as WorkflowNode[],
    })
    ;(get() as unknown as { _scheduleDraftSave: () => void })._scheduleDraftSave()
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges) as unknown as WorkflowEdge[],
    })
    ;(get() as unknown as { _scheduleDraftSave: () => void })._scheduleDraftSave()
  },
  
  onConnect: (connection) => {
    // Prevent self-connections (nodes connecting to themselves)
    if (connection.source === connection.target) {
      console.warn('Cannot connect a node to itself')
      return
    }
    
    set({
      edges: addEdge(connection, get().edges),
    })
  },
  
  addNode: (node) => {
    set({
      nodes: ([...get().nodes, node] as unknown) as WorkflowNode[],
    })
    ;(get() as unknown as { _scheduleDraftSave: () => void })._scheduleDraftSave()
  },
  
  addEdges: (edges) => {
    set({
      edges: ([...get().edges, ...edges] as unknown) as WorkflowEdge[],
    })
    ;(get() as unknown as { _scheduleDraftSave: () => void })._scheduleDraftSave()
  },
  
  updateNode: (nodeId, data) => {
    set({
      nodes: (get().nodes.map((node) =>
        node.id === nodeId
          ? ({ ...node, data: { ...node.data, ...(data as Partial<WorkflowNode['data']>) } } as WorkflowNode)
          : node
      ) as unknown) as WorkflowNode[],
    })
    ;(get() as unknown as { _scheduleDraftSave: () => void })._scheduleDraftSave()
  },
  
  deleteNode: (nodeId) => {
    set({
      nodes: (get().nodes.filter((node) => node.id !== nodeId) as unknown) as WorkflowNode[],
      edges: (get().edges.filter(
        (edge) => (edge as unknown as { source: string; target: string }).source !== nodeId &&
                  (edge as unknown as { source: string; target: string }).target !== nodeId
      ) as unknown) as WorkflowEdge[],
    })
    ;(get() as unknown as { _scheduleDraftSave: () => void })._scheduleDraftSave()
  },
  
  // Execution
  executeWorkflow: async (options) => {
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
      const execution = await executeWorkflowAction(workflowToExecute, options)
      
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
  setConfigPanelOpen: (open) => set({ isConfigPanelOpen: open }),
  requestDeleteNode: (nodeId) => set({ pendingDeleteNodeId: nodeId }),
  clearPendingDelete: () => set({ pendingDeleteNodeId: null }),
  setLogsDialogOpen: (open) => set({ isLogsDialogOpen: open }),
  setLogsPanelCollapsed: (collapsed) => set({ isLogsPanelCollapsed: collapsed }),
}))
