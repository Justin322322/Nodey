import React from 'react'
import { Clock } from 'lucide-react'
import { ActionType } from '@/types/workflow'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { DelayNodeData } from './DelayNode.types'

interface DelayNodeProps {
  data: DelayNodeData
  selected?: boolean
}

export function DelayNode({ data, selected }: DelayNodeProps) {
  const displayConfig = {
    delayType: data.config?.delayType ?? 'fixed',
    value: data.config?.value ?? 1,
    unit: data.config?.unit ?? 'seconds'
  }

  const delayTypeLabels = {
    fixed: 'Fixed',
    random: 'Random',
    exponential: 'Exponential'
  }

  const unitLabels = {
    milliseconds: 'ms',
    seconds: 's',
    minutes: 'm',
    hours: 'h'
  }

  // Create enhanced data with description for BaseNode
  const enhancedData = {
    ...data,
    description: `${delayTypeLabels[displayConfig.delayType as keyof typeof delayTypeLabels]} • ${displayConfig.value}${unitLabels[displayConfig.unit as keyof typeof unitLabels]} - Wait: ${displayConfig.value} ${displayConfig.unit} (${displayConfig.delayType})`
  }

  return (
    <BaseNode
      nodeId="delay-node"
      data={enhancedData}
      selected={selected}
      icon={<Clock className="h-4 w-4" />}
      color="#3b82f6"
    />
  )
}

// Export the node type for registration
export const DELAY_NODE_TYPE = ActionType.DELAY
