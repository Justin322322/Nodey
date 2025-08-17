"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Play, Webhook, Clock, Mail } from 'lucide-react'
import { BaseNode } from './base-node'
import { TriggerNodeData, TriggerType } from '@/types/workflow'
import { ScheduleNode } from '@/nodes/ScheduleNode'
import { WebhookNode } from '@/nodes/WebhookNode'
import { ManualNode } from '@/nodes/ManualNode'

const triggerIcons = {
  [TriggerType.MANUAL]: <Play className="w-4 h-4" />,
  [TriggerType.WEBHOOK]: <Webhook className="w-4 h-4" />,
  [TriggerType.SCHEDULE]: <Clock className="w-4 h-4" />,
  [TriggerType.EMAIL]: <Mail className="w-4 h-4" />,
}

export const TriggerNode = memo(({ id, data, selected }: NodeProps<TriggerNodeData>) => {
  // Route to modular trigger nodes
  if (data.triggerType === TriggerType.SCHEDULE) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <ScheduleNode {...({ id, data, selected } as any)} />
  }
  
  if (data.triggerType === TriggerType.WEBHOOK) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <WebhookNode {...({ id, data, selected } as any)} />
  }
  
  if (data.triggerType === TriggerType.MANUAL) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <ManualNode {...({ id, data, selected } as any)} />
  }
  
  const icon = triggerIcons[data.triggerType] || <Play className="w-4 h-4" />
  
  return (
    <BaseNode
      nodeId={id}
      data={data}
      icon={icon}
      color="#10b981"
      handles={{ target: false, source: true }}
      selected={selected}
    />
  )
})

TriggerNode.displayName = 'TriggerNode'
