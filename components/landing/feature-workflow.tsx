/**
 * FeatureWorkflowSection - Modern node-based workflow demonstration
 */
"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
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
import RotatingText from "@/components/ui/RotatingText/RotatingText"

interface FeatureNodeData {
  id: string
  title: string
  description: string
  detailedDescription?: string
  icon: React.ReactElement
  color: string
  isStart?: boolean
  isEnd?: boolean
}

// True Glass Panel Node Component
// Glass panel node with watermark design
function GlassFeatureNode({ data }: { data: FeatureNodeData }) {
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
          "cursor-pointer shadow-sm relative overflow-hidden max-w-full",
          isHovered && "scale-[1.02] shadow-white/10"
        )}
      >
        {isHovered && <div className="absolute inset-0 glass-card-shimmer pointer-events-none" />}

        {/* Large watermark icon with energy flowing effects */}
        <div className="absolute -bottom-2 -right-2 opacity-[0.25] pointer-events-none">
          <div className="relative">
            {/* Base icon */}
            <div className="relative">
              {React.cloneElement(data.icon as React.ReactElement<Record<string, unknown>>, {
                className: "w-24 h-24 text-white/60",
                strokeWidth: 1.5
              })}
            </div>

            {/* Single energy trail flowing effect */}
            <div className="absolute inset-0">
              <div className="absolute inset-0">
                {React.cloneElement(data.icon as React.ReactElement<Record<string, unknown>>, {
                  className: "w-24 h-24 text-cyan-300",
                  strokeWidth: 1.5,
                  style: {
                    strokeDasharray: '4 16',
                    strokeDashoffset: '0',
                    animation: 'energyFlow 4s linear infinite',
                    filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6)) brightness(1.4)'
                  }
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Clean content container */}
        <div className="flex flex-col justify-center p-6 h-full relative z-10">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white leading-tight">
              {data.title}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed max-w-[280px]">
              {data.description}
            </p>
          </div>
        </div>

        {/* Active status in top right */}
        <div className="absolute top-4 right-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">active</span>
            <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400/40 blur-[2px] animate-pulse" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-300" />
            </span>
          </div>
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
  const containerRef = useRef<HTMLDivElement>(null)
  
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
        icon: <HardDrive className="w-5 h-5 text-white" />,
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
        icon: <GitBranch className="w-5 h-5 text-white" />,
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
        icon: <Plug className="w-5 h-5 text-white" />,
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
        icon: <Activity className="w-5 h-5 text-white" />,
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
        icon: <FileJson className="w-5 h-5 text-white" />,
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
        icon: <Puzzle className="w-5 h-5 text-white" />,
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
    // Initial fit with longer timeout to ensure layout is complete
    const timer = setTimeout(() => {
      try {
        fitView({ padding: 0.1, includeHiddenNodes: true })
      } catch {
        // no-op
      }
    }, 250)
    
    // Re-fit on window resize
    const handleResize = () => {
      setTimeout(() => {
        try {
          fitView({ padding: 0.1, includeHiddenNodes: true })
        } catch {
          // no-op
        }
      }, 100)
    }
    
    window.addEventListener('resize', handleResize)
    
    // ResizeObserver to detect container size changes
    let resizeObserver: ResizeObserver | null = null
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(containerRef.current)
    }
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [fitView])

  return (
    <div ref={containerRef} className="relative h-[20rem] sm:h-[28rem] w-full overflow-hidden">
      <div className="w-full h-full">
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
          className="feature-workflow-canvas w-full h-full pointer-events-none"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={0.9}
            color="rgba(255, 255, 255, 0.06)"
          />
        </ReactFlow>
      </div>

      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
            "bg-white/5 backdrop-blur-sm border border-white/10 text-white/70",
            "hover:bg-white/10 hover:border-white/20 hover:text-white",
            "text-xs cursor-pointer"
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
    <section className="relative py-20 sm:py-24 lg:py-32 overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 w-full">
        <div className="mx-auto max-w-5xl text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-sans leading-tight">
            <span className="variable-proximity-demo [text-shadow:0_2px_20px_rgba(0,0,0,0.25)]">
              From idea to{" "}
              <RotatingText
                texts={[
                  "AUTOMATION",
                  "INTEGRATION", 
                  "WORKFLOW",
                  "EXECUTION",
                  "DEPLOYMENT",
                  "SOLUTION"
                ]}
                mainClassName="px-4 py-2 bg-white/10 backdrop-blur-xl text-white font-bold tracking-tight rounded-lg border border-white/15 hover:bg-white/15 transition-all duration-300 rotating-border-container"
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden"
                elementLevelClassName="inline-block"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={3000}
                animatePresenceMode="wait"
                splitBy="characters"
              />
            </span>
          </h2>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            {"Experience the power of visual workflow automation with Nodey's intuitive features working seamlessly together"}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-7xl rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/20">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
          
          <ReactFlowProvider>
            <InnerFeatureFlow />
          </ReactFlowProvider>
        </div>
      </div>
    </section>
  )
}
