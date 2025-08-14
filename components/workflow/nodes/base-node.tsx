"use client"

import { memo, useMemo } from 'react'
import { Handle, Position } from 'reactflow'
import { WorkflowNodeData, NodeType } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { Settings2, Trash2 } from 'lucide-react'
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

export const BaseNode = memo(({ nodeId, data, icon, color, handles = { target: true, source: true } }: BaseNodeProps) => {
  const { setSelectedNodeId, setConfigPanelOpen, requestDeleteNode, clearPendingDelete, currentExecution } = useWorkflowStore()

  const subtypeLabel = useMemo(() => {
    if (data.nodeType === NodeType.TRIGGER) return (data as { triggerType?: string }).triggerType
    if (data.nodeType === NodeType.ACTION) return (data as { actionType?: string }).actionType
    if (data.nodeType === NodeType.LOGIC) return (data as { logicType?: string }).logicType
    return ''
  }, [data])
  const subtypeText = String(subtypeLabel || '').toUpperCase()

  const hasOutput = Boolean(currentExecution?.nodeOutputs?.[nodeId])
  const hasError = Boolean(data.error)

  const isPreview = Boolean(data.isPreview)

  return (
    <div
      className={cn(
        "group px-0 py-0 rounded-md min-w-[220px] sm:min-w-[240px] overflow-hidden touch-manipulation",
        isPreview ? "shadow-sm bg-white/90" : "shadow-md bg-white",
        hasError && !isPreview && "shadow-[0_0_0_3px_rgba(239,68,68,0.25)]",
        hasOutput && !isPreview && !hasError && "shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"
      )}
    >
      {handles.target && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn("w-6 h-6 sm:w-6 sm:h-6")}
          style={{ background: '#10b981', zIndex: 30, borderRadius: isPreview ? 6 : 0, opacity: isPreview ? 0 : 1 }}
        />
      )}
      
      {/* Header */}
      <div className={cn("relative", isPreview ? "border-b border-gray-100" : "border-b border-gray-200") }>
        <div className="absolute left-0 top-0 bottom-0" style={{ width: isPreview ? 2 : 4, backgroundColor: color }} />
        <div className={cn("flex items-center gap-2 pl-3 pr-2", isPreview ? "h-9" : "h-10 sm:h-12") }>
          <div className={cn(isPreview ? "w-6 h-6" : "w-7 h-7 sm:w-8 sm:h-8", "rounded flex items-center justify-center")} style={{ color: color, backgroundColor: '#FFFFFF' }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("truncate", isPreview ? "text-[13px] font-medium text-gray-900" : "text-sm sm:text-base font-medium text-gray-900")}>{data.label}</div>
          </div>
          {!isPreview && (
          <div className="flex items-center gap-1 z-10 text-gray-500">
            <button
              className="rounded p-1.5 sm:p-2 hover:bg-gray-100 hover:text-gray-700 touch-manipulation"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); clearPendingDelete(); setSelectedNodeId(nodeId); setConfigPanelOpen(true) }}
              title="Configure"
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              className="rounded p-1.5 sm:p-2 hover:bg-gray-100 hover:text-gray-700 touch-manipulation"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); requestDeleteNode(nodeId) }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={cn("px-3", isPreview ? "py-1.5" : "py-2") }>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
          <span className="rounded bg-white border border-gray-200 px-1.5 py-0.5 text-gray-800">{data.nodeType}</span>
          {subtypeText && (
            <span className="rounded bg-white border border-gray-200 px-1.5 py-0.5 text-gray-800">{subtypeText}</span>
          )}
        </div>
        {data.description && (
          <div className="mt-2 text-xs text-gray-600">
            {data.description}
          </div>
        )}
        {!isPreview && hasError && (
          <div className="mt-2 text-xs text-red-600">{data.error}</div>
        )}
      </div>
      
      {handles.source && (
        data.nodeType === NodeType.LOGIC && (data as { logicType?: string }).logicType === 'if' ? (
          <>
            <Handle
              id="true"
              type="source"
              position={Position.Right}
              className={cn("w-6 h-6 sm:w-6 sm:h-6")}
              style={{ background: '#3b82f6', zIndex: 30, borderRadius: 9999, top: isPreview ? 16 : 18, opacity: isPreview ? 0 : 1 }}
            />
            <Handle
              id="false"
              type="source"
              position={Position.Right}
              className={cn("w-6 h-6 sm:w-6 sm:h-6")}
              style={{ background: '#94a3b8', zIndex: 30, borderRadius: 9999, top: isPreview ? 40 : 46, opacity: isPreview ? 0 : 1 }}
            />
            {!isPreview && (
              <>
                <div className="absolute right-1 top-[6px] text-[10px] text-gray-500">T</div>
                <div className="absolute right-1 top-[30px] text-[10px] text-gray-500">F</div>
              </>
            )}
          </>
        ) : (
          <Handle
            type="source"
            position={Position.Right}
            className={cn("w-6 h-6 sm:w-6 sm:h-6")}
            style={{ background: '#3b82f6', zIndex: 30, borderRadius: 9999, opacity: isPreview ? 0 : 1 }}
          />
        )
      )}

      {/* No labels for handles (n8n-style clean connectors) */}
    </div>
  )
})

BaseNode.displayName = 'BaseNode'
