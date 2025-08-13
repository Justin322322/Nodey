"use client"

import React, { useEffect, useMemo } from 'react'
import ReactFlow, { ReactFlowProvider, useReactFlow } from 'reactflow'
import { Background, BackgroundVariant } from '@reactflow/background'
import 'reactflow/dist/style.css'
import { TriggerNode, ActionNode, LogicNode } from '@/components/workflow/nodes'
import FlowEdge from '@/components/workflow/edges/flow-edge'
import { NodeType, TriggerType, ActionType, LogicType, WorkflowNode, WorkflowEdge } from '@/types/workflow'

function MeteorsOverlay({ count = 10 }: { count?: number }) {
  // Precompute positions and timings for deterministic animation
  const items = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: 10 + (i * 7) % 60, // 10% to 70%
      left: (i * 11) % 100,   // spread across width
      delay: (i * 0.35) % 4,  // staggered delays
      duration: 5 + (i % 3),  // 5s to 7s
    }))
  }, [count])

  return (
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden text-white">
      {items.map((m) => (
        <span
          key={m.id}
          className="absolute block h-px w-28 -rotate-45 bg-gradient-to-r from-white/70 to-transparent shadow-[0_0_12px_rgba(255,255,255,0.25)]"
          style={{ top: `${m.top}%`, left: `${m.left}%`, animation: `meteor ${m.duration}s linear ${m.delay}s infinite` }}
        />
      ))}
    </div>
  )
}

function InnerPreview() {
  const { fitView } = useReactFlow()
  const nodeTypes = useMemo(() => ({
    trigger: TriggerNode,
    action: ActionNode,
    logic: LogicNode,
  }), [])

  const edgeTypes = useMemo(() => ({
    default: FlowEdge,
  }), [])

  // base nodes without fixed positions
  const baseNodes = useMemo<WorkflowNode[]>(() => ([
    {
      id: 'n1',
      type: 'trigger',
      position: { x: 0, y: 0 },
      data: {
        label: 'Webhook received',
        nodeType: NodeType.TRIGGER,
        triggerType: TriggerType.WEBHOOK,
        config: {},
      },
    },
    {
      id: 'n2',
      type: 'logic',
      position: { x: 0, y: 0 },
      data: {
        label: 'IF payload.valid',
        nodeType: NodeType.LOGIC,
        logicType: LogicType.IF,
        config: {},
      },
    },
    {
      id: 'n3',
      type: 'action',
      position: { x: 0, y: 0 },
      data: {
        label: 'Call API',
        nodeType: NodeType.ACTION,
        actionType: ActionType.HTTP,
        config: {},
      },
    },
    {
      id: 'n4',
      type: 'action',
      position: { x: 0, y: 0 },
      data: {
        label: 'Send Email',
        nodeType: NodeType.ACTION,
        actionType: ActionType.EMAIL,
        config: {},
      },
    },
  ]), [])

  const edges = useMemo<WorkflowEdge[]>(() => ([
    { id: 'e1-2', source: 'n1', target: 'n2', type: 'default' },
    { id: 'e2-3', source: 'n2', target: 'n3', type: 'default' },
    { id: 'e2-4', source: 'n2', target: 'n4', type: 'default' },
  ]), [])

  // Auto layout nodes in columns based on edge flow (BFS levels)
  const nodes = useMemo<WorkflowNode[]>(() => {
    const nodesCopy = baseNodes.map(n => ({ ...n, position: { x: 0, y: 0 } }))
    const incoming: Record<string, number> = {}
    for (const n of nodesCopy) incoming[n.id] = 0
    for (const e of edges) incoming[e.target] = (incoming[e.target] || 0) + 1

    const adjacency: Record<string, string[]> = {}
    for (const e of edges) {
      if (!adjacency[e.source]) adjacency[e.source] = []
      adjacency[e.source].push(e.target)
    }

    const level: Record<string, number> = {}
    const queue: string[] = []
    for (const n of nodesCopy) {
      if ((incoming[n.id] ?? 0) === 0) { level[n.id] = 0; queue.push(n.id) }
    }
    while (queue.length) {
      const id = queue.shift() as string
      for (const next of adjacency[id] || []) {
        const nextLevel = (level[id] ?? 0) + 1
        if (level[next] == null || nextLevel > level[next]) {
          level[next] = nextLevel
          queue.push(next)
        }
      }
    }

    const columns: Record<number, string[]> = {}
    for (const n of nodesCopy) {
      const l = level[n.id] ?? 0
      if (!columns[l]) columns[l] = []
      columns[l].push(n.id)
    }

    const xSpacing = 300
    const ySpacing = 132
    const yTopMargin = 40
    const xLeftMargin = 40
    const sorted = Object.keys(columns).map(Number).sort((a, b) => a - b)
    for (const l of sorted) {
      const ids = columns[l]
      ids.forEach((id, idx) => {
        const node = nodesCopy.find(n => n.id === id)!
        node.position = {
          x: xLeftMargin + l * xSpacing,
          y: yTopMargin + idx * ySpacing,
        }
      })
    }
    return nodesCopy
  }, [baseNodes, edges])

  useEffect(() => {
    // ensure the preview always fits within the frame
    const timer = setTimeout(() => {
      try {
        fitView({ padding: 0.15, includeHiddenNodes: true })
      } catch {}
    }, 0)
    return () => clearTimeout(timer)
  }, [fitView, nodes])

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* background effect from Aceternity UI (meteors-inspired) */}
      <MeteorsOverlay count={12} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        panOnScroll={false}
        panOnDrag={false}
        nodesFocusable={false}
        edgesFocusable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        minZoom={0.6}
        maxZoom={1.2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        className="relative z-10 landing-flow cursor-default select-none"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.8} color="rgba(71,85,105,0.5)" />
      </ReactFlow>
      {/* guide */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-6 top-6 rounded-full border bg-white/80 px-2 py-1 text-[10px] text-gray-600 shadow-sm">
          Preview
        </div>
        {/* bottom label removed per request */}
      </div>
    </div>
  )
}

export default function LandingFlowPreview() {
  return (
    <ReactFlowProvider>
      <InnerPreview />
    </ReactFlowProvider>
  )
}


