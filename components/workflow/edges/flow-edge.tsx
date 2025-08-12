"use client"

import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow'

export function FlowEdge(props: EdgeProps) {
  const stroke = (props.style?.stroke as string) || (props.selected ? '#2563eb' : '#94a3b8')
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    curvature: 0.35,
  })

  const markerId = `arrow-${props.id}`

  return (
    <>
      <defs>
        <marker id={markerId} markerWidth="6" markerHeight="6" viewBox="0 0 6 6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={stroke} />
        </marker>
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
    </>
  )
}

export default FlowEdge


