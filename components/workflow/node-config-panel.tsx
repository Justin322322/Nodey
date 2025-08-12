"use client"

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toaster'
import { WorkflowNode, NodeType, ActionType, TriggerType, HttpNodeConfig, EmailNodeConfig, ScheduleNodeConfig } from '@/types/workflow'

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, setSelectedNodeId, updateNode, deleteNode } = useWorkflowStore()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = (require('react').useState as typeof import('react').useState<boolean>)(false)
  
  if (!selectedNodeId) return null
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId) as WorkflowNode | undefined
  if (!selectedNode) return null
  
  const handleClose = () => setSelectedNodeId(null)
  const handleDelete = () => {
    if (!selectedNodeId) return
    deleteNode(selectedNodeId)
    setSelectedNodeId(null)
    setConfirmOpen(false)
    toast({
      title: 'Node deleted',
      description: 'The node and its connections were removed.',
      variant: 'success',
    })
  }
  
  const handleConfigChange = (key: string, value: any) => {
    updateNode(selectedNodeId, {
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
      const config = data.config as HttpNodeConfig
      
      return (
        <>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select
              value={config.method || 'GET'}
              onValueChange={(value) => handleConfigChange('method', value)}
            >
              <SelectTrigger>
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
              <SelectTrigger>
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
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Headers (JSON)</Label>
            <textarea
              className="w-full p-2 border rounded-md text-sm font-mono"
              rows={4}
              value={JSON.stringify(config.headers || {}, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value)
                  handleConfigChange('headers', headers)
                } catch {}
              }}
              placeholder='{"Content-Type": "application/json"}'
            />
          </div>
          
          {config.method !== 'GET' && (
            <div className="space-y-2">
              <Label>Body (JSON)</Label>
              <textarea
                className="w-full p-2 border rounded-md text-sm font-mono"
                rows={6}
                value={JSON.stringify(config.body || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const body = JSON.parse(e.target.value)
                    handleConfigChange('body', body)
                  } catch {}
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
      const config = data.config as EmailNodeConfig
      
      return (
        <>
          <div className="space-y-2">
            <Label>To (comma separated)</Label>
            <Input
              value={config.to?.join(', ') || ''}
              onChange={(e) => handleConfigChange('to', e.target.value.split(',').map(s => s.trim()))}
              placeholder="user@example.com, another@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={config.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
              placeholder="Email subject"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Body</Label>
            <textarea
              className="w-full p-2 border rounded-md"
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
      const config = data.config as ScheduleNodeConfig
      
      return (
        <>
          <div className="space-y-2">
            <Label>Cron Expression</Label>
            <Input
              value={config.cron || ''}
              onChange={(e) => handleConfigChange('cron', e.target.value)}
              placeholder="0 0 * * *"
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
  
  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Configure Node</h3>
          <div className="flex items-center gap-2">
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Delete</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete node?</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-gray-600">
                  This will remove the node and its connections. This action cannot be undone.
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">{selectedNode.data.label}</p>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>Node Name</Label>
          <Input
            value={selectedNode.data.label}
            onChange={(e) => updateNode(selectedNodeId, { label: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={selectedNode.data.description || ''}
            onChange={(e) => updateNode(selectedNodeId, { description: e.target.value })}
            placeholder="Optional description"
          />
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Node Configuration</h4>
          {renderConfig()}
        </div>
      </div>
    </div>
  )
}
