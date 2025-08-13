/**
 * FeatureWorkflowSection - Modern node-based workflow demonstration
 */
"use client"

import React, { useState, useEffect, useMemo } from 'react'
import ReactFlow, { 
  ReactFlowProvider, 
  useReactFlow, 
  Node, 
  Edge, 
  Background, 
  BackgroundVariant,
  Handle,
  Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { cn } from "@/lib/utils"
import { HardDrive, GitBranch, Plug, FileJson, Activity, Puzzle, Play, Pause } from "lucide-react"
import ElectricEdge from "./edges/electric-edge"

interface FeatureNodeData {
  id: string
  title: string
  description: string
  detailedDescription?: string
  icon: React.ReactNode
  color: string
  isStart?: boolean
  isEnd?: boolean
}

// True Glass Panel Node Component
// Glass panel node (original landing look)
function GlassFeatureNode({ data, selected }: { data: FeatureNodeData; selected?: boolean }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "w-96 h-40 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl",
          "transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:shadow-xl",
          "cursor-pointer shadow-sm relative overflow-hidden",
          isHovered && "scale-[1.02] shadow-white/10"
        )}
      >
        {isHovered && <div className="absolute inset-0 glass-card-shimmer pointer-events-none" />}

        <div className="flex items-start gap-3 p-4 h-full">
          <div className="flex-shrink-0 mt-0.5">
            {React.cloneElement(data.icon as React.ReactElement, {
              className: "w-5 h-5 text-white"
            })}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white leading-tight mb-1">
              {data.title}
            </h3>
            <p className="text-[11px] text-white/70 leading-relaxed">
              {data.description}
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-2 flex items-center justify-between text-[10px] text-white/60">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400/40 blur-[2px]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-300" />
            </span>
            <span>active</span>
          </div>
          <div className="opacity-70 truncate">#{data.id}</div>
        </div>
      </div>

      <Handle id="left" type="target" position={Position.Left} className="!bg-white/40 !border-white/60 !w-3 !h-3" />
      <Handle id="right" type="source" position={Position.Right} className="!bg-white/40 !border-white/60 !w-3 !h-3" />
      <Handle id="top" type="target" position={Position.Top} className="!bg-white/40 !border-white/60 !w-3 !h-3" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!bg-white/40 !border-white/60 !w-3 !h-3" />
    </div>
  )
}



// Inner ReactFlow component
function InnerFeatureFlow() {
  const { fitView } = useReactFlow()
  const [isPlaying, setIsPlaying] = useState(true)
  
  const edgeTypes = useMemo(() => ({
    electric: ElectricEdge,
  }), [])
  
  const nodeTypes = useMemo(() => ({
    featureNode: GlassFeatureNode,
  }), [])

  const nodes: Node[] = useMemo(() => [
    {
      id: 'local-first',
      type: 'featureNode',
      position: { x: 0, y: 20 },
      data: {
        id: 'local-first',
        title: 'Local‑first, private by default',
        description: 'Complete privacy with browser-based storage. Your workflows never leave your machine unless you choose to export them.',
        icon: <HardDrive className="h-4 w-4" />,
        color: '#ffffff'
      }
    },
    {
      id: 'visual-editor',
      type: 'featureNode',
      position: { x: 520, y: 0 },
      data: {
        id: 'visual-editor',
        title: 'Visual workflow editor',
        description: 'Intuitive drag-and-drop interface with instant feedback. Build complex automations without writing code.',
        icon: <GitBranch className="h-4 w-4" />,
        color: '#ffffff'
      }
    },
    {
      id: 'universal-connectivity',
      type: 'featureNode',
      position: { x: 1040, y: 20 },
      data: {
        id: 'universal-connectivity',
        title: 'Universal API connectivity',
        description: 'Connect to any HTTP API or webhook. Transform data with built-in logic nodes and control flow.',
        icon: <Plug className="h-4 w-4" />,
        color: '#ffffff'
      }
    },
    {
      id: 'clear-execution',
      type: 'featureNode',
      position: { x: 0, y: 300 },
      data: {
        id: 'clear-execution',
        title: 'Real-time execution logs',
        description: 'Step-by-step execution tracking with detailed logs. Debug issues quickly with complete visibility.',
        icon: <Activity className="h-4 w-4" />,
        color: '#ffffff'
      }
    },
    {
      id: 'portable-json',
      type: 'featureNode',
      position: { x: 520, y: 280 },
      data: {
        id: 'portable-json',
        title: 'Portable JSON workflows',
        description: 'Export workflows as JSON for version control, sharing, or migration. Never get locked into our platform.',
        icon: <FileJson className="h-4 w-4" />,
        color: '#ffffff'
      }
    },
    {
      id: 'extensible-nodes',
      type: 'featureNode',
      position: { x: 1040, y: 300 },
      data: {
        id: 'extensible-nodes',
        title: 'Extensible node system',
        description: 'Add custom node types and integrations. The platform grows with your automation needs.',
        icon: <Puzzle className="h-4 w-4" />,
        color: '#ffffff'
      }
    }
  ], [])

  const edges: Edge[] = useMemo(() => [
    // top row chain (left -> mid -> right)
    {
      id: 'e1-2',
      source: 'local-first',
      target: 'visual-editor',
      type: 'electric',
      animated: isPlaying,
      style: { stroke: 'rgba(255,255,255,0.8)', strokeWidth: 3 }
    },
    {
      id: 'e2-3',
      source: 'visual-editor',
      target: 'universal-connectivity',
      type: 'electric',
      animated: isPlaying,
      style: { stroke: 'rgba(255,255,255,0.8)', strokeWidth: 3 }
    },
    // direct connection from universal-connectivity to extensible-nodes
    {
      id: 'e3-6',
      source: 'universal-connectivity',
      target: 'extensible-nodes',
      type: 'electric',
      animated: isPlaying,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: { stroke: 'rgba(255,255,255,0.8)', strokeWidth: 3 }
    },
    // separate bottom flow
    {
      id: 'e4-5',
      source: 'clear-execution',
      target: 'portable-json',
      type: 'electric',
      animated: isPlaying,
      style: { stroke: 'rgba(255,255,255,0.8)', strokeWidth: 3 }
    }
  ], [isPlaying])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        fitView({ padding: 0.1, includeHiddenNodes: true })
      } catch {}
    }, 100)
    return () => clearTimeout(timer)
  }, [fitView])

  return (
    <div className="relative h-[28rem] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        panOnScroll={false}
        panOnDrag={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        className="feature-workflow-canvas"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={32}
          size={1}
          color="rgba(255, 255, 255, 0.05)"
        />
      </ReactFlow>

      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
            "bg-white/5 backdrop-blur-sm border border-white/10 text-white/70",
            "hover:bg-white/10 hover:border-white/20 hover:text-white",
            "text-xs"
          )}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  )
}

export default function FeatureWorkflowSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h2 className="text-3xl font-bold text-white">From idea to automation</h2>
          <p className="mt-3 text-white/60">
            See how Nodey's features work together seamlessly
          </p>
        </div>

        <div className="relative mx-auto max-w-[90rem] rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
          <ReactFlowProvider>
            <InnerFeatureFlow />
          </ReactFlowProvider>
        </div>
      </div>
    </section>
  )
}
