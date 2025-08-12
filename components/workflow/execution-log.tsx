"use client"

import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { cn } from '@/lib/utils'

export function ExecutionLog() {
  const { executionLogs, currentExecution } = useWorkflowStore()
  
  if (!currentExecution && executionLogs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Info className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No execution logs yet</p>
          <p className="text-sm">Run a workflow to see logs here</p>
        </div>
      </div>
    )
  }
  
  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }
  
  const getStatusBadge = () => {
    if (!currentExecution) return null
    
    const statusColors = {
      running: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    }
    
    return (
      <span className={cn(
        'px-2 py-1 rounded text-xs font-medium',
        statusColors[currentExecution.status]
      )}>
        {currentExecution.status.toUpperCase()}
      </span>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {currentExecution && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Execution Log</h3>
              <p className="text-sm text-gray-500">
                Started: {new Date(currentExecution.startedAt).toLocaleTimeString()}
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {executionLogs.map((log, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 bg-white rounded border border-gray-200"
            >
              {getLogIcon(log.level)}
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium">{log.message}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                {log.data && (
                  <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
