"use client"

import { AlertCircle, CheckCircle, Info, XCircle, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MobileSheet } from '@/components/ui/mobile-sheet'

export function ExecutionLog() {
  const { 
    executionLogs, 
    currentExecution, 
    isLogsDialogOpen, 
    setLogsDialogOpen,
    isLogsPanelCollapsed,
    setLogsPanelCollapsed 
  } = useWorkflowStore()
  const hasAny = Boolean(currentExecution) || executionLogs.length > 0
  
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
            {Boolean(log.data) && (
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
        {/* Collapse Toggle Button - Always Visible */}
        <div className="flex items-center justify-between px-2 py-2 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 border-b border-gray-500">
          {!isLogsPanelCollapsed && (
            <div className="flex-1">
              <h3 className="font-medium text-white text-sm">Execution Log</h3>
              {currentExecution && (
                <p className="text-xs text-white/70">
                  Started: {new Date(currentExecution.startedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
          {!isLogsPanelCollapsed && currentExecution && (
            <div className="mr-2">
              {getStatusBadge()}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLogsPanelCollapsed(!isLogsPanelCollapsed)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 text-white border-0 flex-shrink-0 group"
            title={isLogsPanelCollapsed ? "Expand execution logs" : "Collapse execution logs"}
          >
            <div className="w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/30 transition-all duration-200 flex items-center justify-center">
              {isLogsPanelCollapsed ? (
                <ChevronLeft className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
              )}
            </div>
          </Button>
        </div>

        {/* Panel Content - Hidden when collapsed */}
        {!isLogsPanelCollapsed && (
          <>
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
          </>
        )}

        {/* Collapsed State - Show minimal info vertically */}
        {isLogsPanelCollapsed && hasAny && (
          <div className="flex-1 flex flex-col items-center justify-start pt-4 space-y-2">
            {/* Status indicator when collapsed */}
            {currentExecution && (
              <div className="transform rotate-90 origin-center">
                <div className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  currentExecution.status === 'running' && 'bg-blue-100 text-blue-700',
                  currentExecution.status === 'completed' && 'bg-green-100 text-green-700',
                  currentExecution.status === 'failed' && 'bg-red-100 text-red-700',
                  currentExecution.status === 'cancelled' && 'bg-gray-100 text-gray-700'
                )}>
                  {currentExecution.status.slice(0, 3).toUpperCase()}
                </div>
              </div>
            )}
            {/* Log count indicator */}
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs text-white font-medium">{executionLogs.length}</span>
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
        onClick={() => setLogsDialogOpen(true)}
      >
        <List className="w-4 h-4 mr-1" /> Logs
      </Button>

      {/* Mobile Sheet */}
      <div className="sm:hidden">
        <MobileSheet 
          open={isLogsDialogOpen}
          onOpenChange={setLogsDialogOpen}
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
