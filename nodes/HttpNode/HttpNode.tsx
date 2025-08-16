"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Globe } from 'lucide-react'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { WorkflowNodeData } from '@/types/workflow'
import { HttpNodeData } from './HttpNode.types'

export const HttpNode = memo(({ id, data, selected }: NodeProps<HttpNodeData>) => {
    return (
        <BaseNode
            nodeId={id}
            data={data as unknown as WorkflowNodeData}
            icon={<Globe className="w-4 h-4" />}
            color="#10b981"
            selected={selected}
        />
    )
})

HttpNode.displayName = 'HttpNode'
