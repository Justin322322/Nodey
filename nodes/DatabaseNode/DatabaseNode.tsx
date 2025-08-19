import React from 'react'
import { Database } from 'lucide-react'
import { ActionType } from '@/types/workflow'
import { BaseNode } from '@/components/workflow/nodes/base-node'
import { DatabaseNodeData } from './DatabaseNode.types'

interface DatabaseNodeProps {
  data: DatabaseNodeData
  selected?: boolean
}

export function DatabaseNode({ data, selected }: DatabaseNodeProps) {
  const displayConfig = {
    operation: data.config?.operation || 'select',
    table: data.config?.table || 'table',
    connectionType: data.config?.connectionString?.includes('postgresql') ? 'PostgreSQL' 
                  : data.config?.connectionString?.includes('mysql') ? 'MySQL'
                  : data.config?.connectionString?.includes('sqlite') ? 'SQLite' 
                  : 'Database'
  }

  // Create enhanced data with description for BaseNode
  const enhancedData = {
    ...data,
    description: `${displayConfig.operation.toUpperCase()} • ${displayConfig.connectionType} - Query: ${data.config?.query?.substring(0, 30) || 'Not configured'}${(data.config?.query?.length || 0) > 30 ? '...' : ''}`
  }

  return (
    <BaseNode
      nodeId="database-node"
      data={enhancedData}
      selected={selected}
      icon={<Database className="h-4 w-4" />}
      color="#a855f7"
    />
  )
}

// Export the node type for registration
export const DATABASE_NODE_TYPE = ActionType.DATABASE
