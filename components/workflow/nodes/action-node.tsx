"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Globe, Database, Braces, Timer } from 'lucide-react'
import { BaseNode } from './base-node'
import { ActionNodeData, ActionType } from '@/types/workflow'
import { EmailNode } from '@/nodes/EmailNode'

const actionIcons = {
  [ActionType.HTTP]: <Globe className="w-4 h-4" />,
  [ActionType.DATABASE]: <Database className="w-4 h-4" />,
  [ActionType.TRANSFORM]: <Braces className="w-4 h-4" />,
  [ActionType.DELAY]: <Timer className="w-4 h-4" />,
}

export const ActionNode = memo(({ id, data, selected }: NodeProps<ActionNodeData>) => {
  // Route EMAIL actions to the new modular EmailNode
  if (data.actionType === ActionType.EMAIL) {
    return <EmailNode {...({ id, data, selected } as any)} />
  }
  
  const icon = actionIcons[data.actionType] || <Globe className="w-4 h-4" />
  
  return (
    <BaseNode
      nodeId={id}
      data={data}
      icon={icon}
      color="#3b82f6"
      selected={selected}
    />
  )
})

ActionNode.displayName = 'ActionNode'
