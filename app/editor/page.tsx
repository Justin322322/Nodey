"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { WorkflowEditorProvider, WorkflowEditor } from '@/components/workflow/workflow-editor'
import { WorkflowToolbar } from '@/components/workflow/workflow-toolbar'
import { ExecutionLog } from '@/components/workflow/execution-log'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { Workflow } from '@/types/workflow'
import { EditorSkeleton } from '@/components/loading/editor-skeleton'


function EditorInner() {
  const searchParams = useSearchParams()
  const workflowId = searchParams.get('workflowId')
  const [mounted, setMounted] = useState(false)
  const { createNewWorkflow, setWorkflow } = useWorkflowStore()
  
  useEffect(() => {
    const load = () => {
      const draftRaw = typeof window !== 'undefined' ? localStorage.getItem('workflowDraft') : null
      const lastId = typeof window !== 'undefined' ? localStorage.getItem('lastOpenedWorkflowId') : null
      const parsedDraft: Workflow | null = draftRaw ? (() => { try { return JSON.parse(draftRaw) } catch { return null } })() : null
      if (parsedDraft && (!workflowId || workflowId === lastId)) {
        setWorkflow({ ...parsedDraft, createdAt: new Date(parsedDraft.createdAt || new Date()), updatedAt: new Date(parsedDraft.updatedAt || new Date()) })
        return
      }
      if (workflowId) {
        const workflows = JSON.parse(localStorage.getItem('workflows') || '[]')
        const workflow = workflows.find((w: Workflow) => w.id === workflowId)
        if (workflow) {
          setWorkflow(workflow)
        } else {
          createNewWorkflow()
        }
      } else {
        createNewWorkflow()
      }
    }
    load()
  }, [workflowId, createNewWorkflow, setWorkflow])

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  
  return (
    <div className="h-screen bg-white flex flex-col">
        <WorkflowToolbar />
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 border-r border-gray-200">
            <WorkflowEditorProvider>
              <WorkflowEditor />
            </WorkflowEditorProvider>
          </div>
          <div className="hidden sm:block w-96 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 border-l border-gray-600">
            <ExecutionLog />
          </div>
        </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorInner />
    </Suspense>
  )
}


