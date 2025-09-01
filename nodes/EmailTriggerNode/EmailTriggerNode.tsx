"use client"

import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Mail, Shield, AlertCircle, Inbox } from 'lucide-react'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { WorkflowNodeData } from '@/types/workflow'
import { EmailTriggerData } from './EmailTriggerNode.types'

const EmailTriggerNode = memo(({ id, data, selected }: NodeProps<EmailTriggerData>) => {
  // Extract email trigger configuration for display
  const config = data.config
  const enabled = config?.enabled !== false
  const secure = config?.secure !== false
  const downloadAttachments = config?.downloadAttachments === true
  const mailbox = config?.mailbox || 'INBOX'

  // Generate description based on configuration
  const getEmailDescription = (): string => {
    if (!enabled) {
      return 'Email trigger disabled'
    }

    if (!config?.host) {
      return 'Configure IMAP settings'
    }

    const parts: string[] = []

    if (secure) {
      parts.push('SSL')
    }

    parts.push(`${config.host}:${config.port}`)

    if (mailbox !== 'INBOX') {
      parts.push(mailbox)
    }

    if (downloadAttachments) {
      parts.push('+attachments')
    }

    return parts.join(' • ')
  }

  const description = getEmailDescription()

  // Choose appropriate icon based on configuration
  const getEmailIcon = () => {
    if (!enabled) {
      return <AlertCircle className="w-4 h-4" />
    }

    if (secure) {
      return <Shield className="w-4 h-4" />
    }

    return <Mail className="w-4 h-4" />
  }

  // Determine color based on status and security
  const getEmailColor = (): string => {
    if (!enabled) {
      return '#6b7280' // Gray for disabled
    }

    if (!config?.host) {
      return '#f59e0b' // Yellow for not configured
    }

    if (secure) {
      return '#10b981' // Green for secure connection
    }

    return '#3b82f6' // Blue for standard connection
  }

  // Enhance the data with email-specific description
  const enhancedData: WorkflowNodeData = {
    ...data,
    description: description
  }

  return (
    <BaseNode
      nodeId={id}
      data={enhancedData}
      icon={getEmailIcon()}
      color={getEmailColor()}
      selected={selected}
    />
  )
})

EmailTriggerNode.displayName = 'EmailTriggerNode'

export default EmailTriggerNode
