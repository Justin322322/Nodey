"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Filter } from 'lucide-react'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { WorkflowNodeData } from '@/types/workflow'
import { FilterNodeData } from './FilterNode.types'
import { FilterNodeService } from './FilterNode.service'

const FilterNode = memo(({ id, data, selected }: NodeProps<FilterNodeData>) => {
    // Get display information for the condition
    const displayInfo = FilterNodeService.getDisplayInfo(data.config)
    
    // Enhance the data with Filter-specific description
    const enhancedData: WorkflowNodeData = {
        ...data,
        description: displayInfo.description
    }

    return (
        <BaseNode
            nodeId={id}
            data={enhancedData}
            icon={<Filter className="w-4 h-4" />}
            color="#8b5cf6" // Purple color for logic nodes
            handles={{ target: true, source: true }}
            selected={selected}
        />
    )
})

FilterNode.displayName = 'FilterNode'

export default FilterNode
