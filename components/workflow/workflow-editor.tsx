"use client"

import { useCallback, useRef, useState } from 'react'
import ReactFlow, { ReactFlowProvider, ReactFlowInstance, Node } from 'reactflow'
import { Background } from '@reactflow/background'
import { Controls } from '@reactflow/controls'
import { MiniMap } from '@reactflow/minimap'
import 'reactflow/dist/style.css'
import { v4 as uuidv4 } from 'uuid'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { NodePalette, NodeTemplate } from './node-palette'
import { NodeConfigPanel } from './node-config-panel'
import { TriggerNode, ActionNode, LogicNode } from './nodes'
import FlowEdge from './edges/flow-edge'
import { 
  WorkflowNode, 
  NodeType, 
  TriggerNodeData, 
  ActionNodeData, 
  LogicNodeData,
  TriggerType,
  ActionType,
  LogicType
} from '@/types/workflow'

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
}

const edgeTypes = {
  default: FlowEdge,
}

export function WorkflowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setInstance] = useState<ReactFlowInstance | null>(null)
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
  } = useWorkflowStore()
  
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setInstance(instance)
  }, [])
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])
  
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      
      if (!reactFlowWrapper.current || !reactFlowInstance) return
      
      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const type = event.dataTransfer.getData('nodeType')
      const subType = event.dataTransfer.getData('subType')
      const label = event.dataTransfer.getData('label')
      
      if (!type || !subType) return
      
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })
      
      let nodeData: TriggerNodeData | ActionNodeData | LogicNodeData
      
      switch (type as NodeType) {
        case NodeType.TRIGGER:
          nodeData = {
            label,
            nodeType: NodeType.TRIGGER,
            triggerType: subType as TriggerType,
            config: {},
          }
          break
        case NodeType.ACTION:
          nodeData = {
            label,
            nodeType: NodeType.ACTION,
            actionType: subType as ActionType,
            config: {},
          }
          break
        case NodeType.LOGIC:
          nodeData = {
            label,
            nodeType: NodeType.LOGIC,
            logicType: subType as LogicType,
            config: {},
          }
          break
        default:
          return
      }
      
      const newNode: WorkflowNode = {
        id: uuidv4(),
        type: type.toLowerCase(),
        position,
        data: nodeData,
      }
      
      addNode(newNode)
    },
    [reactFlowInstance, addNode]
  )
  
  const onNodeDrag = (event: React.DragEvent, nodeTemplate: NodeTemplate) => {
    event.dataTransfer.setData('nodeType', nodeTemplate.type)
    event.dataTransfer.setData('subType', nodeTemplate.subType)
    event.dataTransfer.setData('label', nodeTemplate.label)
    event.dataTransfer.effectAllowed = 'move'
  }
  
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId]
  )
  
  return (
    <div className="flex h-full">
      <NodePalette onNodeDrag={onNodeDrag} />
      
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background variant={"dots" as any} gap={12} size={1} />
          <Controls />
          <MiniMap />
          <div className="absolute bottom-3 left-16 z-50 rounded-md border bg-white/95 px-3 py-2 text-xs text-gray-700 shadow">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-4" style={{ background: '#10b981', borderRadius: 0 }} />
                <span>in</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-4 rounded-full" style={{ background: '#3b82f6' }} />
                <span>out</span>
              </div>
              <div>→ edge shows flow direction</div>
            </div>
          </div>
        </ReactFlow>
        
        <NodeConfigPanel />
      </div>
    </div>
  )
}

export function WorkflowEditorProvider({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}
