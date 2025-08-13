"use client"

import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow'

const FlowEdge = (props: EdgeProps) => {
  const stroke = (props.style?.stroke as string) || (props.selected ? '#0f172a' : '#475569')
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
     curvature: 0.25,
  })

  const markerId = `arrow-${props.id}`
  const pathId = `edge-path-${props.id}`
  const duration = props.selected ? 1.8 : 2.6

  return (
    <>
      <defs>
        <marker id={markerId} markerWidth="6" markerHeight="6" viewBox="0 0 6 6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={stroke} />
        </marker>
        <radialGradient id={`edge-glow-${props.id}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <BaseEdge
        id={props.id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
         style={{
           stroke,
           strokeWidth: props.selected ? 2.5 : 2,
           strokeLinecap: 'round',
         }}
      />
      <path id={pathId} d={edgePath} fill="none" stroke="none" />
      {props.animated && (
        <>
          <circle r={3.5} fill={`url(#edge-glow-${props.id})`} opacity={0.85}>
            <animateMotion dur={`${duration}s`} repeatCount="indefinite">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
          <circle r={1.4} fill="#fff" opacity={0.95}>
            <animateMotion dur={`${duration}s`} repeatCount="indefinite">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        </>
      )}
    </>
  )
}

export default FlowEdge


