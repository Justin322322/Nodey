"use client"

import { Play, Save, Plus, Settings, StopCircle, List, PlayCircle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { useToast } from '@/components/ui/toaster'

export function WorkflowToolbar() {
  const router = useRouter()
  const { 
    workflow, 
    createNewWorkflow, 
    saveWorkflow, 
    executeWorkflow, 
    stopExecution,
    isExecuting,
    selectedNodeId
  } = useWorkflowStore()
  const { toast } = useToast()
  
  const handleNew = () => {
    if (confirm('Create a new workflow? Any unsaved changes will be lost.')) {
      createNewWorkflow()
      toast({ title: 'New workflow created', variant: 'success' })
    }
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
      toast({ title: 'Execution completed', variant: 'success' })
    } else if (status === 'failed') {
      toast({ title: 'Execution failed', description: result.error || undefined, variant: 'destructive' })
    } else if (status === 'cancelled') {
      toast({ title: 'Execution cancelled' })
    }
  }
  
  const handleRunFromSelected = async () => {
    if (!selectedNodeId) return
    toast({ title: 'Execution started from selected node' })
    const result = await executeWorkflow({ startNodeId: selectedNodeId } as any)
    if (!result) return
    const status = result.status
    if (status === 'completed') {
      toast({ title: 'Execution completed', variant: 'success' })
    } else if (status === 'failed') {
      toast({ title: 'Execution failed', description: result.error || undefined, variant: 'destructive' })
    } else if (status === 'cancelled') {
      toast({ title: 'Execution cancelled' })
    }
  }
  
  return (
    <div className="h-16 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button className="hover:text-gray-900 transition-colors" onClick={handleViewList}>Workflows</button>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900 font-medium">{workflow?.name || 'Untitled Workflow'}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewList}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          <List className="w-4 h-4 mr-1" />
          All Workflows
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNew}
          disabled={isExecuting}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isExecuting || !workflow}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          disabled={!workflow}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
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
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleRunFromSelected}
          disabled={!workflow || !selectedNodeId || isExecuting}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4 mr-1" />
          Run from node
        </Button>
      </div>
    </div>
  )
}
