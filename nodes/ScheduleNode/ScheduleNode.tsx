"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Clock } from 'lucide-react'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { WorkflowNodeData } from '@/types/workflow'
import { ScheduleNodeData } from './ScheduleNode.types'

const ScheduleNode = memo(({ id, data, selected }: NodeProps<ScheduleNodeData>) => {
    // Extract cron expression for display
    const cronExpression = data.config?.cron || 'Not configured'
    const timezone = data.config?.timezone || 'UTC'
    const enabled = data.config?.enabled !== false
    
    // Generate a simple description of the schedule
    const getScheduleDescription = (cron: string): string => {
        switch (cron) {
            case '0 0 * * *': return 'Daily at midnight'
            case '0 12 * * *': return 'Daily at noon'
            case '0 0 * * 0': return 'Weekly on Sunday'
            case '0 0 1 * *': return 'Monthly on the 1st'
            case '*/5 * * * *': return 'Every 5 minutes'
            case '0 */2 * * *': return 'Every 2 hours'
            default: return cron
        }
    }

    const scheduleDescription = cronExpression !== 'Not configured' 
        ? getScheduleDescription(cronExpression)
        : 'Schedule not configured'

    // Enhance the data with schedule-specific description
    const enhancedData: WorkflowNodeData = {
        ...data,
        description: enabled 
            ? `${scheduleDescription} (${timezone})`
            : `${scheduleDescription} (Disabled)`
    }

    return (
        <BaseNode
            nodeId={id}
            data={enhancedData}
            icon={<Clock className="w-4 h-4" />}
            color="#f59e0b" // Amber color for schedule triggers
            handles={{ target: false, source: true }}
            selected={selected}
        />
    )
})

ScheduleNode.displayName = 'ScheduleNode'

export default ScheduleNode
