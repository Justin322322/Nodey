"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Mail } from 'lucide-react'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { WorkflowNodeData } from '@/types/workflow'
import { EmailNodeData } from './EmailNode.types'

const EmailNode = memo(({ id, data, selected }: NodeProps<EmailNodeData>) => {
    return (
        <BaseNode
            nodeId={id}
            data={data as WorkflowNodeData}
            icon={<Mail className="w-4 h-4" />}
            color="#3b82f6"
            selected={selected}
        />
    )
})

EmailNode.displayName = 'EmailNode'

export default EmailNode