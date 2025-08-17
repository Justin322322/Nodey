"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Play } from 'lucide-react'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { WorkflowNodeData } from '@/types/workflow'
import { ManualNodeData } from './ManualNode.types'

const ManualNode = memo(({ id, data, selected }: NodeProps<ManualNodeData>) => {
    // Enhance the data with manual-specific description
    const enhancedData: WorkflowNodeData = {
        ...data,
        description: 'Click to start workflow manually'
    }

    return (
        <BaseNode
            nodeId={id}
            data={enhancedData}
            icon={<Play className="w-4 h-4" />}
            color="#10b981" // Green color for manual triggers
            handles={{ target: false, source: true }}
            selected={selected}
        />
    )
})

ManualNode.displayName = 'ManualNode'

export default ManualNode
