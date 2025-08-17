"use client"

import { Play, Save, Plus, Settings, StopCircle, List, PlayCircle, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { useToast } from '@/components/ui/toaster'
import { MobileActionSheet } from '@/components/ui/mobile-sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SecurityStatus } from '@/components/ui/security-status'
import { useState } from 'react'

export function WorkflowToolbar() {
  const router = useRouter()
  const { 
    workflow, 
    createNewWorkflow, 
    saveWorkflow, 
    executeWorkflow, 
    stopExecution,
    isExecuting,
    selectedNodeId,
    setLogsDialogOpen
  } = useWorkflowStore()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNewWorkflowDialog, setShowNewWorkflowDialog] = useState(false)
  
  const handleNew = () => {
    setShowNewWorkflowDialog(true)
  }

  const handleConfirmNewWorkflow = () => {
    createNewWorkflow()
    setShowNewWorkflowDialog(false)
    toast({ title: 'New workflow created', variant: 'success' })
  }

  const handleCancelNewWorkflow = () => {
    setShowNewWorkflowDialog(false)
  }
  
  const handleViewList = () => {
    router.push('/workflows')
  }
  
  const handleSave = async () => {
    await saveWorkflow()
    toast({ title: 'Workflow saved', description: workflow?.name, variant: 'success' })
  }
  
  const handleExecute = async () => {
    toast({ title: 'Execution started' })
    const result = await executeWorkflow()
    if (!result) return
    const status = result.status
    if (status === 'completed') {
      toast({ 
        title: 'Execution completed', 
        description: 'Workflow executed successfully',
        variant: 'success',
        clickable: true,
        onClick: () => setLogsDialogOpen(true)
      })
    } else if (status === 'failed') {
      toast({ 
        title: 'Execution failed', 
        description: result.error || 'Check logs for details',
        variant: 'destructive',
        clickable: true,
        onClick: () => setLogsDialogOpen(true)
      })
    } else if (status === 'cancelled') {
      toast({ 
        title: 'Execution cancelled',
        clickable: true,
        onClick: () => setLogsDialogOpen(true)
      })
    }
  }
  
  const handleRunFromSelected = async () => {
    if (!selectedNodeId) return
    toast({ title: 'Execution started from selected node' })
    const result = await executeWorkflow({ startNodeId: selectedNodeId })
    if (!result) return
    const status = result.status
    if (status === 'completed') {
      toast({ 
        title: 'Execution completed', 
        description: 'Workflow executed successfully from selected node',
        variant: 'success',
        clickable: true,
        onClick: () => setLogsDialogOpen(true)
      })
    } else if (status === 'failed') {
      toast({ 
        title: 'Execution failed', 
        description: result.error || 'Check logs for details',
        variant: 'destructive',
        clickable: true,
        onClick: () => setLogsDialogOpen(true)
      })
    } else if (status === 'cancelled') {
      toast({ 
        title: 'Execution cancelled',
        clickable: true,
        onClick: () => setLogsDialogOpen(true)
      })
    }
  }
  
  return (
    <div className="h-16 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
        <button className="hover:text-gray-900 transition-colors hidden sm:inline" onClick={handleViewList}>Workflows</button>
        <ChevronRight className="w-4 h-4 text-gray-400 hidden sm:block" />
        <span className="text-gray-900 font-medium truncate max-w-[60vw] sm:max-w-none">{workflow?.name || 'Untitled Workflow'}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewList}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 hidden sm:inline-flex"
          aria-label="All Workflows"
        >
          <List className="w-4 h-4 mr-1" />
          All Workflows
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNew}
          disabled={isExecuting}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 hidden sm:inline-flex"
          aria-label="Create New Workflow"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isExecuting || !workflow}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 hidden sm:inline-flex"
          aria-label="Save Workflow"
        >
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          disabled={!workflow}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 hidden sm:inline-flex"
          aria-label="Workflow Settings"
        >
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
        
        {isExecuting ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              const ok = await stopExecution()
              if (ok) {
                toast({ title: 'Execution stopped' })
              } else {
                toast({ title: 'Failed to stop execution', variant: 'destructive' })
              }
            }}
            className=""
            aria-label="Stop Execution"
          >
            <StopCircle className="w-4 h-4 mr-1" />
            Stop
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleExecute}
            disabled={!workflow || (workflow.nodes.length === 0)}
            className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500 disabled:opacity-50"
            aria-label="Run Workflow"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
        )}

        {/* Mobile quick Save */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleSave}
          disabled={isExecuting || !workflow}
          className="sm:hidden border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          aria-label="Save Workflow"
        >
          <Save className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRunFromSelected}
          disabled={!workflow || !selectedNodeId || isExecuting}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 hidden sm:inline-flex"
          aria-label="Run from selected node"
        >
          <PlayCircle className="w-4 h-4 mr-1" />
          Run from node
        </Button>

        {/* Security Status */}
        <div className="hidden sm:block">
          <SecurityStatus className="ml-2" />
        </div>

        <MobileActionSheet 
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          title="Actions"
          trigger={
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              aria-label="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          }
          actions={[
            {
              label: 'All Workflows',
              icon: <List className="w-4 h-4" />,
              onClick: handleViewList
            },
            {
              label: 'New Workflow',
              icon: <Plus className="w-4 h-4" />,
              onClick: handleNew,
              disabled: isExecuting
            },
            {
              label: 'Save',
              icon: <Save className="w-4 h-4" />,
              onClick: handleSave,
              disabled: isExecuting || !workflow
            },
            {
              label: 'View Logs',
              icon: <List className="w-4 h-4" />,
              onClick: () => setLogsDialogOpen(true)
            },
            {
              label: 'Run from Node',
              icon: <PlayCircle className="w-4 h-4" />,
              onClick: handleRunFromSelected,
              disabled: !workflow || !selectedNodeId || isExecuting
            },
            {
              label: 'Settings',
              icon: <Settings className="w-4 h-4" />,
              onClick: () => {},
              disabled: !workflow
            }
          ]}
        />
      </div>

      {/* New Workflow Confirmation Dialog */}
      <Dialog open={showNewWorkflowDialog} onOpenChange={setShowNewWorkflowDialog}>
        <DialogContent className="bg-white border border-gray-200 sm:max-w-md sm:!top-1/3 sm:!left-1/2 sm:!-translate-x-1/2 sm:!translate-y-0">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create New Workflow</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            Create a new workflow? Any unsaved changes will be lost.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelNewWorkflow}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 min-h-[44px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmNewWorkflow}
              className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] touch-manipulation"
            >
              Create New Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
