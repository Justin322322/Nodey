"use client"

import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { cn } from '@/lib/utils'

export function ExecutionLog() {
  const { executionLogs, currentExecution } = useWorkflowStore()
  
  if (!currentExecution && executionLogs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-white/50">
        <div className="text-center">
          <Info className="w-12 h-12 mx-auto mb-2 text-white/30" />
          <p>No execution logs yet</p>
          <p className="text-sm text-white/40">Run a workflow to see logs here</p>
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
      running: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      completed: 'bg-green-500/20 text-green-300 border border-green-500/30',
      failed: 'bg-red-500/20 text-red-300 border border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
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
    <div className="h-full flex flex-col">
      {currentExecution && (
        <div className="px-4 py-3 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 border-b border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Execution Log</h3>
              <p className="text-sm text-white/70">
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
              className="flex items-start gap-2 p-3 bg-gradient-to-r from-gray-600/30 via-gray-700/40 to-gray-800/50 backdrop-blur rounded-lg border border-gray-600/30"
            >
              {getLogIcon(log.level)}
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium text-white">{log.message}</span>
                </div>
                <div className="text-xs text-white/50">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                {log.data && (
                  <pre className="mt-2 text-xs bg-gradient-to-r from-gray-800/60 via-gray-900/70 to-black/60 text-white/80 p-2 rounded overflow-x-auto border border-gray-600/40">
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
