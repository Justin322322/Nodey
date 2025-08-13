"use client"

import React from 'react'
import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow'

/**
 * ElectricEdge – a custom edge with a subtle dashed stroke and a glowing
 * particle that animates along the path ("electricity" effect).
 */
export default function ElectricEdge(props: EdgeProps) {
  const strokeColor = (props.style?.stroke as string) || 'rgba(255,255,255,0.85)'
  const strokeWidth = (props.style?.strokeWidth as number) || 3

  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    curvature: 0.25,
  })

  const markerId = `electric-arrow-${props.id}`
  const pathId = `electric-path-${props.id}`

  const animationDuration = props.selected ? 1.6 : 2.4

  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="6" markerHeight="6" viewBox="0 0 6 6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={strokeColor} />
        </marker>
        <filter id={`electric-blur-${props.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <radialGradient id={`electric-glow-${props.id}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#e0f2ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* soft glow underlay */}
      <path d={edgePath} stroke="rgba(255,255,255,0.18)" strokeWidth={8} filter={`url(#electric-blur-${props.id})`} fill="none" />
      {/* Base edge path */}
      <BaseEdge
        id={props.id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: strokeColor,
          strokeWidth: Math.max(strokeWidth, 3),
          strokeLinecap: 'round',
          ...(props.animated ? { strokeDasharray: '8,4' } : {}),
        }}
      />

      {/* Hidden path for motion reference */}
      <path id={pathId} d={edgePath} fill="none" stroke="none" />

      {/* Animated dash overlay and multiple particles for a lively wire */}
      {props.animated && (
        <>
          <path d={edgePath} fill="none" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.8} strokeDasharray="12 10">
            <animate attributeName="stroke-dashoffset" from="0" to="-44" dur="1.6s" repeatCount="indefinite" />
          </path>
          <circle r={4} fill={`url(#electric-glow-${props.id})`} opacity={0.95}>
            <animateMotion dur={`${animationDuration}s`} repeatCount="indefinite">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
          <circle r={2} fill="#ffffff" opacity={0.95}>
            <animateMotion dur={`${animationDuration}s`} repeatCount="indefinite">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
          <circle r={1.6} fill="#e0f2ff" opacity={0.9}>
            <animateMotion dur={`${animationDuration * 0.85}s`} repeatCount="indefinite" begin="0.4s">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        </>
      )}
    </g>
  )
}


