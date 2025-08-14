"use client"

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MobileSheet } from '@/components/ui/mobile-sheet'
import { useToast } from '@/components/ui/toaster'
import { WorkflowNode, NodeType, ActionType, TriggerType, HttpNodeConfig, EmailNodeConfig, ScheduleNodeConfig } from '@/types/workflow'

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, setSelectedNodeId, updateNode, deleteNode, pendingDeleteNodeId, clearPendingDelete } = useWorkflowStore()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState<boolean>(false)

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640) // 640px is the 'sm' breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Open confirm dialog if a delete was requested from node header
  useEffect(() => {
    // If delete was requested from node header, force-close config panel selection and open only dialog
    if (pendingDeleteNodeId) {
      if (selectedNodeId && selectedNodeId !== pendingDeleteNodeId) {
        setSelectedNodeId(null)
      }
      setConfirmOpen(true)
      return
    }
  }, [pendingDeleteNodeId])
  
  // If a delete has been requested, show dialog only and no side panel
  if (pendingDeleteNodeId) {
    return (
      <Dialog open={true} onOpenChange={(open) => { if (!open) { setConfirmOpen(false); clearPendingDelete() } }}>
        <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-md sm:!top-1/3 sm:!left-1/2 sm:!-translate-x-1/2 sm:!translate-y-0">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Delete node?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            This will remove the node and its connections. This action cannot be undone.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setConfirmOpen(false); clearPendingDelete() }}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 min-h-[44px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (pendingDeleteNodeId) deleteNode(pendingDeleteNodeId); clearPendingDelete(); toast({ title: 'Node deleted', description: 'The node and its connections were removed.', variant: 'success' }) }}
              className="bg-red-600 hover:bg-red-500 text-white border-red-500 min-h-[44px] touch-manipulation"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  if (!selectedNodeId && !pendingDeleteNodeId) return null
  
  const nodeId = selectedNodeId ?? pendingDeleteNodeId!
  const selectedNode = nodes.find(n => n.id === nodeId) as WorkflowNode | undefined
  if (!selectedNode) return null
  
  const handleClose = () => { setSelectedNodeId(null); clearPendingDelete() }
  const handleDelete = () => {
    if (!nodeId) return
    deleteNode(nodeId)
    setSelectedNodeId(null)
    setConfirmOpen(false)
    clearPendingDelete()
    toast({
      title: 'Node deleted',
      description: 'The node and its connections were removed.',
      variant: 'success',
    })
  }
  
  const handleConfigChange = (key: string, value: unknown) => {
    updateNode(nodeId, {
      config: {
        ...selectedNode.data.config,
        [key]: value
      }
    })
  }
  
  const renderConfig = () => {
    const { data } = selectedNode
    
    // HTTP Request configuration
    if (data.nodeType === NodeType.ACTION && data.actionType === ActionType.HTTP) {
      const config = data.config as unknown as HttpNodeConfig
      
      return (
        <>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select
              value={config.method || 'GET'}
              onValueChange={(value) => handleConfigChange('method', value)}
            >
              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={config.url || ''}
              onChange={(e) => handleConfigChange('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label>Authentication</Label>
            <Select
              value={config.authentication?.type || 'none'}
              onValueChange={(value) =>
                handleConfigChange('authentication', {
                  type: value as NonNullable<HttpNodeConfig['authentication']>['type'],
                  value: config.authentication?.value,
                })
              }
            >
              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="basic">Basic (Base64 user:pass)</SelectItem>
                <SelectItem value="apiKey">API Key (Header)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.authentication?.type && config.authentication.type !== 'none' && (
            <div className="space-y-2">
              <Label>Auth Value</Label>
              <Input
                value={config.authentication?.value || ''}
                onChange={(e) =>
                  handleConfigChange('authentication', {
                    type: config.authentication?.type,
                    value: e.target.value,
                  })
                }
                placeholder={
                  config.authentication.type === 'bearer'
                    ? 'Bearer token'
                    : config.authentication.type === 'basic'
                    ? 'Base64 encoded user:pass'
                    : 'API Key'
                }
                className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Headers (JSON)</Label>
            <textarea
              className="w-full p-2 border rounded-md text-sm font-mono bg-white text-gray-900 border-gray-300"
              rows={4}
              value={JSON.stringify(config.headers || {}, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value)
                  handleConfigChange('headers', headers)
                } catch {
                  // no-op
                }
              }}
              placeholder='{"Content-Type": "application/json"}'
            />
          </div>
          
          {config.method !== 'GET' && (
            <div className="space-y-2">
              <Label>Body (JSON)</Label>
              <textarea
                className="w-full p-2 border rounded-md text-sm font-mono bg-white text-gray-900 border-gray-300"
                rows={6}
                value={JSON.stringify(config.body || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const body = JSON.parse(e.target.value)
                    handleConfigChange('body', body)
                  } catch {
                    // no-op
                  }
                }}
                placeholder='{}'
              />
            </div>
          )}
        </>
      )
    }
    
    // Email configuration
    if (data.nodeType === NodeType.ACTION && data.actionType === ActionType.EMAIL) {
      const config = data.config as unknown as EmailNodeConfig
      
      return (
        <>
          <div className="space-y-2">
            <Label>To (comma separated)</Label>
            <Input
              value={config.to?.join(', ') || ''}
              onChange={(e) => handleConfigChange('to', e.target.value.split(',').map(s => s.trim()))}
              placeholder="user@example.com, another@example.com"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={config.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
              placeholder="Email subject"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Body</Label>
            <textarea
              className="w-full p-2 border rounded-md bg-white text-gray-900 border-gray-300"
              rows={6}
              value={config.body || ''}
              onChange={(e) => handleConfigChange('body', e.target.value)}
              placeholder="Email body content..."
            />
          </div>
        </>
      )
    }
    
    // Schedule configuration
    if (data.nodeType === NodeType.TRIGGER && data.triggerType === TriggerType.SCHEDULE) {
      const config = data.config as unknown as ScheduleNodeConfig
      
      return (
        <>
          <div className="space-y-2">
            <Label>Cron Expression</Label>
            <Input
              value={config.cron || ''}
              onChange={(e) => handleConfigChange('cron', e.target.value)}
              placeholder="0 0 * * *"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
            <p className="text-xs text-gray-500">
              Examples: "0 0 * * *" (daily at midnight), "*/5 * * * *" (every 5 minutes)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input
              value={config.timezone || 'UTC'}
              onChange={(e) => handleConfigChange('timezone', e.target.value)}
              placeholder="UTC"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>
        </>
      )
    }
    
    // Default message for unconfigured nodes
    return (
      <div className="text-sm text-gray-500">
        No configuration options available for this node type.
      </div>
    )
  }
  
  const renderConfigContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Node Name</Label>
        <Input
          value={selectedNode.data.label}
          onChange={(e) => updateNode(nodeId, { label: e.target.value })}
          className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={selectedNode.data.description || ''}
          onChange={(e) => updateNode(nodeId, { description: e.target.value })}
          placeholder="Optional description"
          className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
        />
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Node Configuration</h4>
        {renderConfig()}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Execution Settings</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Timeout (ms)</Label>
            <Input
              type="number"
              value={selectedNode.data.runSettings?.timeoutMs ?? ''}
              onChange={(e) => updateNode(nodeId, {
                runSettings: {
                  ...selectedNode.data.runSettings,
                  timeoutMs: Number(e.target.value || 0) || undefined,
                },
              })}
              placeholder="30000"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>
          <div className="space-y-1">
            <Label>Retries</Label>
            <Input
              type="number"
              value={selectedNode.data.runSettings?.retryCount ?? ''}
              onChange={(e) => updateNode(nodeId, {
                runSettings: {
                  ...selectedNode.data.runSettings,
                  retryCount: Number(e.target.value || 0) || undefined,
                },
              })}
              placeholder="0"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>
          <div className="space-y-1">
            <Label>Retry delay (ms)</Label>
            <Input
              type="number"
              value={selectedNode.data.runSettings?.retryDelayMs ?? ''}
              onChange={(e) => updateNode(nodeId, {
                runSettings: {
                  ...selectedNode.data.runSettings,
                  retryDelayMs: Number(e.target.value || 0) || undefined,
                },
              })}
              placeholder="0"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              id="continueOnFail"
              type="checkbox"
              className="h-4 w-4"
              checked={Boolean(selectedNode.data.runSettings?.continueOnFail)}
              onChange={(e) => updateNode(nodeId, {
                runSettings: {
                  ...selectedNode.data.runSettings,
                  continueOnFail: e.target.checked,
                },
              })}
            />
            <Label htmlFor="continueOnFail">Continue on fail</Label>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Use labels "true" and "false" on connections from IF nodes to control branching.
        </p>
      </div>

      {/* Mobile Actions */}
      <div className="border-t pt-4 sm:hidden">
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex-1"
            onClick={() => setConfirmOpen(true)}
          >
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sheet - Only render on mobile */}
      {isMobile && (
        <MobileSheet 
          open={Boolean(selectedNodeId) && !pendingDeleteNodeId}
          onOpenChange={(open) => !open && handleClose()}
          title="Configure Node"
          description={selectedNode?.data.label}
        >
          {renderConfigContent()}
        </MobileSheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && selectedNodeId && !pendingDeleteNodeId && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white text-gray-900 border-l border-gray-200 shadow-lg overflow-y-auto z-50">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">Configure Node</h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setConfirmOpen(true)}
              >
                Delete
              </Button>
              <button
                onClick={handleClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-transparent focus:bg-transparent focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">{selectedNode.data.label}</p>
        </div>
        
        <div className="p-4">
          {renderConfigContent()}
        </div>
      </div>
      )}

      {/* Shared Delete Confirmation Dialog */}
      <Dialog open={confirmOpen || Boolean(pendingDeleteNodeId)} onOpenChange={(open) => { setConfirmOpen(open); if (!open) clearPendingDelete() }}>
        <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-md sm:!top-1/3 sm:!left-1/2 sm:!-translate-x-1/2 sm:!translate-y-0">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Delete node?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            This will remove the node and its connections. This action cannot be undone.
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { setConfirmOpen(false); clearPendingDelete() }} 
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 min-h-[44px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="min-h-[44px] touch-manipulation"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
