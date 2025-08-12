"use client"

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { WorkflowEditorProvider, WorkflowEditor } from '@/components/workflow/workflow-editor'
import { WorkflowToolbar } from '@/components/workflow/workflow-toolbar'
import { ExecutionLog } from '@/components/workflow/execution-log'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { Workflow } from '@/types/workflow'

function HomeInner() {
  const searchParams = useSearchParams()
  const workflowId = searchParams.get('workflowId')
  const { createNewWorkflow, setWorkflow } = useWorkflowStore()
  
  useEffect(() => {
    if (workflowId) {
      // Load existing workflow
      const workflows = JSON.parse(localStorage.getItem('workflows') || '[]')
      const workflow = workflows.find((w: Workflow) => w.id === workflowId)
      
      if (workflow) {
        setWorkflow(workflow)
      } else {
        createNewWorkflow()
      }
    } else {
      // Create a new workflow on first load
      createNewWorkflow()
    }
  }, [workflowId])
  
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <WorkflowToolbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <WorkflowEditorProvider>
            <WorkflowEditor />
          </WorkflowEditorProvider>
        </div>
        <div className="w-96 border-l border-gray-200">
          <ExecutionLog />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <HomeInner />
    </Suspense>
  )
}
