"use client"

import { Play, Save, Plus, Settings, StopCircle, List } from 'lucide-react'
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
    isExecuting 
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
  
  return (
    <div className="h-16 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">
          {workflow?.name || 'Untitled Workflow'}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewList}
        >
          <List className="w-4 h-4 mr-1" />
          All Workflows
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNew}
          disabled={isExecuting}
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isExecuting || !workflow}
        >
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          disabled={!workflow}
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
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
        )}
      </div>
    </div>
  )
}
