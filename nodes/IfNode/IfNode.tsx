"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { GitBranch } from 'lucide-react'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { WorkflowNodeData } from '@/types/workflow'
import { IfNodeData } from './IfNode.types'
import { IfNodeService } from './IfNode.service'

const IfNode = memo(({ id, data, selected }: NodeProps<IfNodeData>) => {
    // Get display information for the condition
    const displayInfo = IfNodeService.getDisplayInfo(data.config)
    
    // Enhance the data with IF-specific description
    const enhancedData: WorkflowNodeData = {
        ...data,
        description: displayInfo.description
    }

    return (
        <BaseNode
            nodeId={id}
            data={enhancedData}
            icon={<GitBranch className="w-4 h-4" />}
            color="#8b5cf6" // Purple color for logic nodes
            handles={{ target: true, source: true }}
            selected={selected}
        />
    )
})

IfNode.displayName = 'IfNode'

export default IfNode
