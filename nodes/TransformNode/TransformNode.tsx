import React from 'react'
import { Shuffle } from 'lucide-react'
import { ActionType } from '@/types/workflow'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { TransformNodeData } from './TransformNode.types'

interface TransformNodeProps {
  data: TransformNodeData
  selected?: boolean
}

export function TransformNode({ data, selected }: TransformNodeProps) {
  const displayConfig = {
    operation: data.config?.operation || 'map',
    language: data.config?.language || 'javascript'
  }

  const operationLabels = {
    map: 'Map',
    filter: 'Filter', 
    reduce: 'Reduce',
    sort: 'Sort',
    group: 'Group',
    merge: 'Merge'
  }

  // Create enhanced data with description for BaseNode
  const enhancedData = {
    ...data,
    description: `${operationLabels[displayConfig.operation as keyof typeof operationLabels]} • ${displayConfig.language} - Script: ${data.config?.script?.substring(0, 30) || 'Not configured'}${(data.config?.script?.length || 0) > 30 ? '...' : ''}`
  }

  return (
    <BaseNode
      nodeId="transform-node"
      data={enhancedData}
      selected={selected}
      icon={<Shuffle className="h-4 w-4" />}
      color="#f97316"
    />
  )
}

// Export the node type for registration
export const TRANSFORM_NODE_TYPE = ActionType.TRANSFORM
