"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { GitBranch, Shuffle, RotateCcw, Filter } from 'lucide-react'
import { BaseNode } from './base-node'
import { LogicNodeData, LogicType } from '@/types/workflow'

const logicIcons = {
  [LogicType.IF]: <GitBranch className="w-4 h-4" />,
  [LogicType.SWITCH]: <Shuffle className="w-4 h-4" />,
  [LogicType.LOOP]: <RotateCcw className="w-4 h-4" />,
  [LogicType.FILTER]: <Filter className="w-4 h-4" />,
}

export const LogicNode = memo(({ id, data, selected }: NodeProps<LogicNodeData>) => {
  const icon = logicIcons[data.logicType] || <GitBranch className="w-4 h-4" />
  
  return (
    <BaseNode
      nodeId={id}
      data={data}
      icon={icon}
      color="#f59e0b"
      selected={selected}
    />
  )
})

LogicNode.displayName = 'LogicNode'
