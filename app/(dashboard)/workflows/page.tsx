"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit3, Trash2, FileJson, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Workflow } from '@/types/workflow'
import { useToast } from '@/components/ui/toaster'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function WorkflowsPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const { toast } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null)
  
  useEffect(() => {
    // Load workflows from localStorage
    const savedWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]')
    setWorkflows(savedWorkflows)
  }, [])
  
  const handleCreateNew = () => {
    router.push('/')
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
        const imported = JSON.parse(text)
        // Basic validation
        if (!imported || typeof imported !== 'object' || !imported.nodes || !imported.edges) {
          alert('Invalid workflow file')
          return
        }
        // Ensure required fields
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
        const existing = JSON.parse(localStorage.getItem('workflows') || '[]')
        const exists = existing.some((w: Workflow) => w.id === workflow.id)
        if (exists) {
          workflow.id = crypto.randomUUID()
          workflow.name = `${workflow.name} (copy)`
        }
        const updated = [...existing, workflow]
        localStorage.setItem('workflows', JSON.stringify(updated))
        setWorkflows(updated)
        toast({ title: 'Workflow imported', description: workflow.name, variant: 'success' })
      } catch (e) {
        toast({ title: 'Failed to import workflow', variant: 'destructive' })
      }
    }
    input.click()
  }
  
  const handleEdit = (workflowId: string) => {
    router.push(`/?workflowId=${workflowId}`)
  }
  
  const requestDelete = (workflow: Workflow) => setDeleteTarget(workflow)

  const confirmDelete = () => {
    if (!deleteTarget) return
    try {
      const updatedWorkflows = workflows.filter(w => w.id !== deleteTarget.id)
      localStorage.setItem('workflows', JSON.stringify(updatedWorkflows))
      setWorkflows(updatedWorkflows)
      toast({ title: 'Workflow deleted', description: deleteTarget.name, variant: 'success' })
    } catch (e) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Workflows
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your automation workflows
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Workflow
                </Button>
                <Button variant="outline" onClick={handleImportClick}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </div>
          
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <FileJson className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new workflow.
              </p>
              <div className="mt-6">
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Workflow
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <li key={workflow.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {workflow.name}
                        </p>
                        {workflow.description && (
                          <p className="text-sm text-gray-500">
                            {workflow.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {workflow.nodes.length} nodes • {workflow.edges.length} connections
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(workflow.id)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(workflow)}
                      >
                        <FileJson className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestDelete(workflow)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workflow?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            {deleteTarget ? (
              <>
                This will permanently delete "{deleteTarget.name}" and cannot be undone.
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
