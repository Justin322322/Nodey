"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit3, Trash2, FileJson, Upload, ArrowLeft } from 'lucide-react'
import { Button, landingButtonVariants } from '@/components/ui/button'
import { Workflow } from '@/types/workflow'
import { useToast } from '@/components/ui/toaster'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'
import { WorkflowsSkeleton } from '@/components/loading/workflows-skeleton'

function WorkflowsInner() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const { toast } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null)
  
  
  useEffect(() => {
    const savedWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]') as Workflow[]
    setWorkflows(savedWorkflows)
  }, [])
  
  
  
  const handleCreateNew = () => {
    router.push('/editor')
  }
  
  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const imported = JSON.parse(text) as unknown
        
        // Type guard for imported workflow
        const isValidWorkflow = (obj: unknown): obj is Partial<Workflow> => {
          return typeof obj === 'object' && obj !== null && 
                 'nodes' in obj && 'edges' in obj
        }
        
        if (!isValidWorkflow(imported)) {
          alert('Invalid workflow file')
          return
        }
        
        const workflow: Workflow = {
          id: imported.id || crypto.randomUUID(),
          name: imported.name || 'Imported Workflow',
          description: imported.description,
          nodes: imported.nodes || [],
          edges: imported.edges || [],
          variables: imported.variables || {},
          createdAt: imported.createdAt ? new Date(imported.createdAt) : new Date(),
          updatedAt: new Date(),
          isActive: !!imported.isActive,
        }
        const existing = JSON.parse(localStorage.getItem('workflows') || '[]') as Workflow[]
        const exists = existing.some((w: Workflow) => w.id === workflow.id)
        if (exists) {
          workflow.id = crypto.randomUUID()
          workflow.name = `${workflow.name} (copy)`
        }
        const updated = [...existing, workflow]
        localStorage.setItem('workflows', JSON.stringify(updated))
        setWorkflows(updated)
        toast({ title: 'Workflow imported', description: workflow.name, variant: 'success' })
      } catch {
        toast({ title: 'Failed to import workflow', variant: 'destructive' })
      }
    }
    input.click()
  }
  
  const handleEdit = (workflowId: string) => {
    router.push(`/editor?workflowId=${workflowId}`)
  }
  
  const requestDelete = (workflow: Workflow) => setDeleteTarget(workflow)

  const confirmDelete = () => {
    if (!deleteTarget) return
    try {
      const updatedWorkflows = workflows.filter(w => w.id !== deleteTarget.id)
      localStorage.setItem('workflows', JSON.stringify(updatedWorkflows))
      setWorkflows(updatedWorkflows)
      toast({ title: 'Workflow deleted', description: deleteTarget.name, variant: 'success' })
    } catch {
      toast({ title: 'Failed to delete workflow', variant: 'destructive' })
    } finally {
      setDeleteTarget(null)
    }
  }
  
  const handleExport = (workflow: Workflow) => {
    const dataStr = JSON.stringify(workflow, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }
  
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className={`relative z-10`}>
        <div className={`container mx-auto px-6 py-24`}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="mx-auto max-w-5xl">
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold text-white">Workflows</h1>
                  <p className="mt-1 text-white/70">Manage your automation workflows</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCreateNew}
                    className={landingButtonVariants({ intent: 'primary', size: 'md' })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> New Workflow
                  </button>
                  <button
                    onClick={handleImportClick}
                    className={landingButtonVariants({ intent: 'secondary', size: 'md' })}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Import
                  </button>
                </div>
              </div>
            </div>

            {workflows.length === 0 ? (
              <div className="text-center py-20">
                <div className="relative mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur">
                  <div className="absolute inset-0 glass-card-shimmer pointer-events-none opacity-0" />
                  <FileJson className="h-16 w-16 text-white/50 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-white mb-2">No workflows yet</h3>
                  <p className="text-white/70 mb-8">Create your first workflow to get started</p>
                  <button
                    onClick={handleCreateNew}
                    className={landingButtonVariants({ intent: 'primary', size: 'md' })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create Workflow
                  </button>
                </div>
              </div>
            ) : (
              <div className={`mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`}>
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="group relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                    <div className="absolute inset-0 glass-card-shimmer pointer-events-none opacity-0 group-hover:opacity-100" />

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl border border-white/15 bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Edit3 className="w-5 h-5 text-white/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white truncate">{workflow.name}</h3>
                        <p className="mt-1 text-xs text-white/70 line-clamp-2">
                          {workflow.description || 'Automate processes with visual workflow design. Connect nodes and control data flow seamlessly.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${workflow.isActive ? 'bg-green-400' : 'bg-white/40'}`} />
                        <span className={workflow.isActive ? 'text-green-300' : 'text-white/60'}>
                          {workflow.isActive ? 'active' : 'inactive'}
                        </span>
                      </div>
                      <div className="text-white/50">#{workflow.id.slice(0, 8)}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-white/60 mb-1">Nodes</div>
                        <div className="text-white font-semibold">{workflow.nodes.length}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-white/60 mb-1">Connections</div>
                        <div className="text-white font-semibold">{workflow.edges.length}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-white/60 mb-1">Updated</div>
                        <div className="text-white font-semibold">{new Date(workflow.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2 pt-4 border-t border-white/10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(workflow.id)}
                        className="border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white text-xs flex-1"
                      >
                        <Edit3 className="w-3 h-3 mr-2" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(workflow)}
                        className="border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white text-xs"
                        aria-label="Export"
                      >
                        <FileJson className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestDelete(workflow)}
                        className="border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 text-xs"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-md sm:!top-1/3 sm:!left-1/2 sm:!-translate-x-1/2 sm:!translate-y-0">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Delete workflow?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            {deleteTarget ? (
              <>{`This will permanently delete "${deleteTarget.name}" and cannot be undone.`}</>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 min-h-[44px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-500 text-white border-red-500 min-h-[44px] touch-manipulation"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<WorkflowsSkeleton />}>
      <WorkflowsInner />
    </Suspense>
  )
}
