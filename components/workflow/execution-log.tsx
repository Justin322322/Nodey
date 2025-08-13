"use client"

import { AlertCircle, CheckCircle, Info, XCircle, List } from 'lucide-react'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MobileSheet } from '@/components/ui/mobile-sheet'

export function ExecutionLog() {
  const { executionLogs, currentExecution, isLogsDialogOpen, setLogsDialogOpen } = useWorkflowStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const hasAny = Boolean(currentExecution) || executionLogs.length > 0
  
  useEffect(() => {
    setMobileOpen(isLogsDialogOpen)
  }, [isLogsDialogOpen])
  useEffect(() => {
    if (mobileOpen !== isLogsDialogOpen) setLogsDialogOpen(mobileOpen)
  }, [mobileOpen])
  
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
      running: 'bg-blue-100 text-blue-700 border border-blue-200',
      completed: 'bg-green-100 text-green-700 border border-green-200',
      failed: 'bg-red-100 text-red-700 border border-red-200',
      cancelled: 'bg-gray-100 text-gray-700 border border-gray-200',
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
  
  const renderLogsList = () => (
    <div className="space-y-2">
      {executionLogs.map((log, index) => (
        <div
          key={index}
          className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          {getLogIcon(log.level)}
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              <span className="font-medium text-gray-900">{log.message}</span>
            </div>
            <div className="text-xs text-gray-600">
              {new Date(log.timestamp).toLocaleTimeString()}
            </div>
            {log.data && (
              <pre className="mt-2 text-xs bg-gray-100 text-gray-800 p-2 rounded overflow-x-auto border border-gray-200">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  )
  
  return (
    <>
      {/* Desktop Panel */}
      <div className="hidden sm:flex h-full flex-col">
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
        {hasAny ? (
          <div className="flex-1 overflow-y-auto p-4">{renderLogsList()}</div>
        ) : (
          <div className="h-full flex items-center justify-center text-white/50">
            <div className="text-center">
              <Info className="w-12 h-12 mx-auto mb-2 text-white/30" />
              <p>No execution logs yet</p>
              <p className="text-sm text-white/40">Run a workflow to see logs here</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Floating Button */}
      <Button
        variant="default"
        size="sm"
        className="fixed bottom-20 right-4 z-50 sm:hidden bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
        aria-label="Open execution logs"
        onClick={() => setMobileOpen(true)}
      >
        <List className="w-4 h-4 mr-1" /> Logs
      </Button>

      {/* Mobile Sheet */}
      <div className="sm:hidden">
        <MobileSheet 
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          title="Execution Log"
        >
        {currentExecution && (
          <div className="pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {getStatusBadge()}
              <p className="text-xs text-gray-600">
                Started: {new Date(currentExecution.startedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
        <div className="pb-4">
          {hasAny ? (
            renderLogsList()
          ) : (
            <div className="text-center text-gray-600 py-8">
              <Info className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p>No execution logs yet</p>
              <p className="text-sm text-gray-500 mt-1">Run a workflow to see logs here</p>
            </div>
          )}
        </div>
      </MobileSheet>
      </div>
    </>
  )
}
