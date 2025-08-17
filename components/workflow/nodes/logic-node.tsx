"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { GitBranch, Shuffle, RotateCcw, Filter } from 'lucide-react'
import { BaseNode } from './base-node'
import { LogicNodeData, LogicType } from '@/types/workflow'
import { IfNode } from '@/nodes/IfNode'
import { FilterNode } from '@/nodes/FilterNode'

const logicIcons = {
  [LogicType.IF]: <GitBranch className="w-4 h-4" />,
  [LogicType.SWITCH]: <Shuffle className="w-4 h-4" />,
  [LogicType.LOOP]: <RotateCcw className="w-4 h-4" />,
  [LogicType.FILTER]: <Filter className="w-4 h-4" />,
}

export const LogicNode = memo(({ id, data, selected }: NodeProps<LogicNodeData>) => {
  // Route to modular logic nodes
  if (data.logicType === LogicType.IF) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <IfNode {...({ id, data, selected } as any)} />
  }
  
  if (data.logicType === LogicType.FILTER) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <FilterNode {...({ id, data, selected } as any)} />
  }
  
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
