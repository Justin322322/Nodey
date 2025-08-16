"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Webhook, Globe, Shield, AlertCircle } from 'lucide-react'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { WorkflowNodeData } from '@/types/workflow'
import { WebhookNodeData } from './WebhookNode.types'

const WebhookNode = memo(({ id, data, selected }: NodeProps<WebhookNodeData>) => {
    // Extract webhook configuration for display
    const method = data.config?.method || 'POST'
    const hasSecret = !!(data.config?.secret)
    const enabled = data.config?.enabled !== false
    const responseMode = data.config?.responseMode || 'async'
    
    // Generate description based on configuration
    const getWebhookDescription = (): string => {
        if (!enabled) {
            return 'Webhook disabled'
        }
        
        const parts: string[] = [method]
        
        if (hasSecret) {
            parts.push('(secured)')
        }
        
        if (responseMode === 'sync') {
            parts.push('sync response')
        }
        
        return parts.join(' ')
    }

    const description = getWebhookDescription()
    
    // Choose appropriate icon based on configuration
    const getWebhookIcon = () => {
        if (!enabled) {
            return <AlertCircle className="w-4 h-4" />
        }
        
        if (hasSecret) {
            return <Shield className="w-4 h-4" />
        }
        
        return <Webhook className="w-4 h-4" />
    }

    // Determine color based on status and security
    const getWebhookColor = (): string => {
        if (!enabled) {
            return '#6b7280' // Gray for disabled
        }
        
        if (hasSecret) {
            return '#10b981' // Green for secured webhooks
        }
        
        return '#3b82f6' // Blue for standard webhooks
    }

    // Enhance the data with webhook-specific description
    const enhancedData: WorkflowNodeData = {
        ...data,
        description: description
    }

    return (
        <BaseNode
            nodeId={id}
            data={enhancedData}
            icon={getWebhookIcon()}
            color={getWebhookColor()}
            handles={{ target: false, source: true }}
            selected={selected}
        />
    )
})

WebhookNode.displayName = 'WebhookNode'

export default WebhookNode
