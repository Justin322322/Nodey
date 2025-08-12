"use client"

import { memo, useMemo } from 'react'
import { Handle, Position } from 'reactflow'
import { WorkflowNodeData, NodeType } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { Settings2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useWorkflowStore } from '@/hooks/use-workflow-store'

interface BaseNodeProps {
  nodeId: string
  data: WorkflowNodeData
  icon: React.ReactNode
  color: string
  selected?: boolean
  handles?: {
    target?: boolean
    source?: boolean
  }
}

export const BaseNode = memo(({ nodeId, data, icon, color, handles = { target: true, source: true }, selected }: BaseNodeProps) => {
  const { setSelectedNodeId, deleteNode, currentExecution } = useWorkflowStore()

  const subtypeLabel = useMemo(() => {
    if (data.nodeType === NodeType.TRIGGER) return (data as any).triggerType
    if (data.nodeType === NodeType.ACTION) return (data as any).actionType
    if (data.nodeType === NodeType.LOGIC) return (data as any).logicType
    return ''
  }, [data])
  const subtypeText = String(subtypeLabel || '').toUpperCase()

  const hasOutput = Boolean(currentExecution?.nodeOutputs?.[nodeId])
  const hasError = Boolean(data.error)

  return (
    <div
      className={cn(
        "group px-0 py-0 shadow-md rounded-md border-2 bg-white min-w-[220px] overflow-hidden",
        selected ? "border-primary" : "border-gray-200",
        hasError && "border-red-500"
      )}
    >
      {handles.target && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4"
          style={{ background: '#10b981', zIndex: 30, borderRadius: 0 }}
        />
      )}
      
      {/* Header */}
      <div className="relative border-b">
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
        <div className="h-10 flex items-center gap-2 pl-3 pr-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ color: color, backgroundColor: '#0000000D' }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label}</div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="rounded p-1 hover:bg-gray-100"
              onClick={(e) => { e.stopPropagation(); setSelectedNodeId(nodeId) }}
              title="Configure"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              className="rounded p-1 hover:bg-gray-100"
              onClick={(e) => { e.stopPropagation(); deleteNode(nodeId) }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Status indicator moved to header top-right to avoid handle overlap */}
        <div className="absolute right-2 top-1 pointer-events-none">
          {hasError ? (
            <div className="flex items-center gap-1 text-red-600 text-xs bg-white rounded-full px-2 py-0.5 border border-red-200">
              <AlertCircle className="w-3 h-3" /> Error
            </div>
          ) : hasOutput ? (
            <div className="flex items-center gap-1 text-green-600 text-xs bg-white rounded-full px-2 py-0.5 border border-green-200">
              <CheckCircle2 className="w-3 h-3" /> Done
            </div>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">{data.nodeType}</span>
          {subtypeText && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">{subtypeText}</span>
          )}
        </div>
        {data.description && (
          <div className="mt-2 text-xs text-gray-600">
            {data.description}
          </div>
        )}
        {hasError && (
          <div className="mt-2 text-xs text-red-600">{data.error}</div>
        )}
      </div>
      
      {handles.source && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4"
          style={{ background: '#3b82f6', zIndex: 30, borderRadius: 9999 }}
        />
      )}

      {/* No labels for handles (n8n-style clean connectors) */}
    </div>
  )
})

BaseNode.displayName = 'BaseNode'
