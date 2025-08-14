import type { WorkflowEdge, WorkflowNode } from '@/types/workflow'

export interface WorkflowTemplate {
  key: string
  label: string
  description: string
  buildAt: (position: { x: number; y: number }) => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }
}


