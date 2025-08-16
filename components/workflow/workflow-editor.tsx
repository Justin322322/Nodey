"use client"

import { useCallback, useRef, useState } from 'react'
import ReactFlow, { ReactFlowProvider, ReactFlowInstance, Node } from 'reactflow'
import { Background, BackgroundVariant } from '@reactflow/background'
import { Controls } from '@reactflow/controls'
import { MiniMap } from '@reactflow/minimap'
import 'reactflow/dist/style.css'
import { v4 as uuidv4 } from 'uuid'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { NodePalette, NodeTemplate } from './node-palette'
import { NodeConfigPanel } from './node-config-panel'
import { TriggerNode, ActionNode, LogicNode } from './nodes'
import FlowEdge from './edges/flow-edge'
import { Button } from '@/components/ui/button'
import { MobileSheet } from '@/components/ui/mobile-sheet'
import { Plus } from 'lucide-react'
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
import { getDefaultConfigForNode } from '@/lib/node-definitions'
import { buildWorkflowTemplateAt } from '@/templates'

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
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false)
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    addEdges,
    setSelectedNodeId,
  } = useWorkflowStore()
  
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setInstance(instance)
  }, [])
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    // Allow drop; we validate payload in onDrop
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])
  
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      
      if (!reactFlowWrapper.current || !reactFlowInstance) return
      
      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      let type = event.dataTransfer.getData('nodeType')
      let subType = event.dataTransfer.getData('subType')
      let label = event.dataTransfer.getData('label')
      const nodeJson = event.dataTransfer.getData('node/json')
      if ((!type || !subType) && nodeJson) {
        try {
          const parsed = JSON.parse(nodeJson) as { type?: string; subType?: string; label?: string }
          type = type || parsed.type || ''
          subType = subType || parsed.subType || ''
          label = label || parsed.label || ''
        } catch {
          // ignore
        }
      }
      const templateKey = event.dataTransfer.getData('templateKey')
      
      // If it's a template insertion via drag
      if (!type && templateKey) {
        const position = reactFlowInstance.project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        })
        const built = buildWorkflowTemplateAt(templateKey, position)
        if (built) {
          built.nodes.forEach((n) => addNode(n))
          addEdges(built.edges)
        }
        return
      }
      
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
            config: getDefaultConfigForNode(NodeType.TRIGGER, subType as TriggerType) || {},
          }
          break
        case NodeType.ACTION:
          nodeData = {
            label,
            nodeType: NodeType.ACTION,
            actionType: subType as ActionType,
            config: getDefaultConfigForNode(NodeType.ACTION, subType as ActionType) || {},
          }
          break
        case NodeType.LOGIC:
          nodeData = {
            label,
            nodeType: NodeType.LOGIC,
            logicType: subType as LogicType,
            config: getDefaultConfigForNode(NodeType.LOGIC, subType as LogicType) || {},
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
    [reactFlowInstance, addNode, addEdges]
  )
  
  const onNodeDrag = (event: React.DragEvent, nodeTemplate: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', 'node')
    event.dataTransfer.setData('nodeType', nodeTemplate.type)
    event.dataTransfer.setData('subType', nodeTemplate.subType)
    event.dataTransfer.setData('label', nodeTemplate.label)
    event.dataTransfer.setData(
      'node/json',
      JSON.stringify({ type: nodeTemplate.type, subType: nodeTemplate.subType, label: nodeTemplate.label })
    )
    event.dataTransfer.effectAllowed = 'move'
  }
  
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
      // Do NOT open config panel automatically here; gear button controls it
    },
    [setSelectedNodeId]
  )
  
  return (
    <div className="flex h-full">
      <div className="hidden md:block">
        <NodePalette onNodeDrag={onNodeDrag} />
      </div>
      
      <div className="flex-1 relative bg-slate-100" ref={reactFlowWrapper}>
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
          deleteKeyCode={['Delete', 'Backspace']}
          className="workbench-flow"
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="rgba(100,116,139,0.5)" />
          <div className="hidden lg:block"> {/* Only show on large screens */}
            <Controls />
          </div>
          <div className="hidden xl:block"> {/* Only show MiniMap on extra large screens */}
            <MiniMap 
              nodeStrokeWidth={2} 
              zoomable 
              pannable 
              style={{ background: '#eef2f7', border: '1px solid #e2e8f0', borderRadius: 8 }} 
            />
          </div>
          <div className="absolute bottom-3 left-16 z-50 rounded-md bg-white px-3 py-2 text-xs text-gray-700 shadow-md hidden sm:block">
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

        {/* Mobile Add Node Button */}
        <Button
          variant="default"
          size="sm"
          className="fixed bottom-4 left-4 z-50 sm:hidden bg-green-600 hover:bg-green-500 text-white shadow-lg"
          aria-label="Add node"
          onClick={() => setIsPaletteOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Node
        </Button>

        {/* Mobile Node Palette Sheet */}
        <div className="sm:hidden">
          <MobileSheet 
            open={isPaletteOpen}
            onOpenChange={setIsPaletteOpen}
            title="Add Nodes"
            description="Drag & drop or tap any node to add it to your workflow"
          >
            <NodePalette onNodeDrag={onNodeDrag} onNodeAdded={() => setIsPaletteOpen(false)} />
          </MobileSheet>
        </div>
      </div>
    </div>
  )
}

export function WorkflowEditorProvider({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}
