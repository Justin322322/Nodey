"use client"

import { X, Info, Copy } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MobileSheet } from '@/components/ui/mobile-sheet'
import { useToast } from '@/components/ui/toaster'
import { WorkflowNode, NodeType, ActionType, TriggerType, HttpNodeConfig, ScheduleNodeConfig } from '@/types/workflow'
import { EMAIL_NODE_DEFINITION, EmailNodeConfig } from '@/nodes/EmailNode'
import { findNodeDefinition } from '@/lib/node-definitions'

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, isConfigPanelOpen, setConfigPanelOpen, setSelectedNodeId, updateNode, deleteNode, pendingDeleteNodeId, clearPendingDelete } = useWorkflowStore()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [jsonTextByPath, setJsonTextByPath] = useState<Record<string, string>>({})
  const [kvStateByPath, setKvStateByPath] = useState<Record<string, { id: string; key: string; value: string }[]>>({})

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640) // 640px is the 'sm' breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Reset transient JSON editors when switching nodes
  useEffect(() => {
    setJsonTextByPath({})
    setKvStateByPath({})
  }, [selectedNodeId])

  // Track whether confirm dialog was opened due to a pending delete request from node header
  const confirmOpenedFromPendingRef = useRef<boolean>(false)

  // Open confirm dialog if a delete was requested from node header
  useEffect(() => {
    if (pendingDeleteNodeId) {
      if (selectedNodeId && selectedNodeId !== pendingDeleteNodeId) {
        setSelectedNodeId(null)
      }
      setConfirmOpen(true)
      confirmOpenedFromPendingRef.current = true
      return
    }
    // If the dialog was opened due to pending delete, close it once pending clears
    if (!pendingDeleteNodeId && confirmOpenedFromPendingRef.current) {
      setConfirmOpen(false)
      confirmOpenedFromPendingRef.current = false
    }
  }, [pendingDeleteNodeId, selectedNodeId, setSelectedNodeId])
  
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
  
  const handleClose = () => { setSelectedNodeId(null); setConfigPanelOpen(false); clearPendingDelete() }
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
  
  const handleConfigChange = (path: string, value: unknown) => {
    const setDeep = (obj: Record<string, unknown>, p: string, v: unknown) => {
      const parts = p.split('.')
      const clone: Record<string, unknown> = { ...obj }
      let cur: Record<string, unknown> = clone
      for (let i = 0; i < parts.length - 1; i += 1) {
        const key = parts[i]
        const next = cur[key]
        if (typeof next !== 'object' || next === null) {
          cur[key] = {}
        } else {
          cur[key] = { ...(next as Record<string, unknown>) }
        }
        cur = cur[key] as Record<string, unknown>
      }
      cur[parts[parts.length - 1]] = v
      return clone
    }
    const nextConfig = setDeep((selectedNode.data.config as Record<string, unknown>) || {}, path, value)
    updateNode(nodeId, {
      config: nextConfig,
    })
  }

  const getValueAtPath = (obj: Record<string, unknown> | undefined, path: string): unknown => {
    if (!obj) return undefined
    return path.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part]
      }
      return undefined
    }, obj)
  }
  
  const renderConfig = () => {
    const { data } = selectedNode
    const def = findNodeDefinition(selectedNode)
    if (def?.parameters && def.parameters.length > 0) {
      const FieldLabel = ({ text, description, htmlFor }: { text: string; description?: string; htmlFor?: string }) => (
        <div className="inline-flex items-center gap-1">
          <Label htmlFor={htmlFor}>{text}</Label>
          {description ? (
            <button
              type="button"
              className="inline-flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              title={description}
              aria-label="Info"
              tabIndex={-1}
            >
              <Info className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      )
      return (
        <>
          {def.parameters.map((param) => {
            const shouldShow = (param.showIf || []).some((cond) => getValueAtPath(data.config as Record<string, unknown>, cond.path) === cond.equals)
            if (!shouldShow) return null
            const value = getValueAtPath(data.config as Record<string, unknown>, param.path)
            switch (param.type) {
              case 'select':
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={param.description} />
            <Select
              value={(value as string) ?? (param.default as string) ?? ''}
              onValueChange={(v) => handleConfigChange(param.path, v)}
            >
              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(param.options || []).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              case 'string':
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={param.description} htmlFor={param.path} />
                    <Input
                      value={typeof value === 'string' ? value : (param.default as string) ?? ''}
                      onChange={(e) => handleConfigChange(param.path, e.target.value)}
                      placeholder={param.description}
                      className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                    />
                  </div>
                )
              case 'textarea':
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={param.description} htmlFor={param.path} />
                    <textarea
                      className="w-full p-2 border rounded-md bg-white text-gray-900 border-gray-300"
                      rows={6}
                      value={typeof value === 'string' ? value : (param.default as string) ?? ''}
                      onChange={(e) => handleConfigChange(param.path, e.target.value)}
                      placeholder={param.description}
                    />
                  </div>
                )
              case 'json': {
                const path = param.path
                // Friendly editors for headers/body
                const isHeaders = path === 'headers'
                const isBody = path === 'body'
                if (isHeaders || isBody) {
                  const initialRows = Array.isArray(kvStateByPath[path])
                    ? kvStateByPath[path]
                    : Object.entries(((value as Record<string, string>) || {})).map(([k, v]) => ({ id: `${k}-${Math.random().toString(36).slice(2)}`, key: k, value: String(v) }))
                  let rows = initialRows
                  if (!rows || rows.length === 0) {
                    rows = [{ id: 'new', key: '', value: '' }]
                  }
                  const setRows = (next: { id: string; key: string; value: string }[]) => {
                    setKvStateByPath((s) => ({ ...s, [path]: next }))
                    const obj: Record<string, string> = {}
                    next.forEach((r) => {
                      const k = r.key.trim()
                      if (k) obj[k] = r.value
                    })
                    handleConfigChange(path, obj)
                  }
                  const addRow = () => setRows([...(rows || []), { id: Math.random().toString(36).slice(2), key: '', value: '' }])
                  const removeRow = (id: string) => setRows((rows || []).filter((r) => r.id !== id))
                  const updateRow = (id: string, patch: Partial<{ key: string; value: string }>) => setRows((rows || []).map((r) => (r.id === id ? { ...r, ...patch } : r)))
                  const previewObj: Record<string, string> = {}
                  ;(rows || []).forEach((r) => {
                    const k = r.key.trim()
                    if (k) previewObj[k] = r.value
                  })
                  return (
                    <div key={param.path} className="space-y-1.5 sm:space-y-2">
                      <FieldLabel text={param.label} description={param.description} />
                      <div className="space-y-2">
                        {(rows || []).map((row) => (
                          <div key={row.id} className="flex gap-2">
                            <Input
                              placeholder={isHeaders ? 'Header name' : 'Field name'}
                              value={row.key}
                              onChange={(e) => updateRow(row.id, { key: e.target.value })}
                              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                            />
                            <Input
                              placeholder={isHeaders ? 'Header value' : 'Field value'}
                              value={row.value}
                              onChange={(e) => updateRow(row.id, { value: e.target.value })}
                              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                            />
                            <button
                              type="button"
                              className="inline-flex items-center justify-center px-2 text-gray-500 hover:text-gray-700"
                              onClick={() => removeRow(row.id)}
                              aria-label="Remove"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addRow}
                            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Add {isHeaders ? 'Header' : 'Field'}
                          </Button>
                        </div>
                        <div className="pt-1">
                          <FieldLabel text="JSON preview" />
                          <div className="relative">
                            <pre className="w-full p-2 border rounded-md text-xs font-mono bg-gray-50 text-gray-800 border-gray-200 overflow-x-auto">
{JSON.stringify(previewObj, null, 2)}
                            </pre>
                            <button
                              type="button"
                              className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); try { navigator.clipboard?.writeText(JSON.stringify(previewObj, null, 2)) } catch (err) { console.debug('copy failed', err) } }}
                              aria-label="Copy JSON"
                              title="Copy JSON"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
                const displayText =
                  typeof jsonTextByPath[path] === 'string'
                    ? jsonTextByPath[path]
                    : JSON.stringify(value ?? param.default ?? {}, null, 2)
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={param.description} />
                    <textarea
                      className="w-full p-2 border rounded-md text-sm font-mono bg-white text-gray-900 border-gray-300"
                      rows={6}
                      value={displayText}
                      onChange={(e) => {
                        const text = e.target.value
                        setJsonTextByPath((s) => ({ ...s, [path]: text }))
                        try {
                          const parsed = JSON.parse(text)
                          handleConfigChange(path, parsed)
                        } catch {
                          // Keep editing buffer until valid
                        }
                      }}
                      placeholder={param.description || '{}'}
                    />
                  </div>
                )
              }
              case 'stringList':
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={param.description} htmlFor={param.path} />
                    <Input
                      value={Array.isArray(value) ? (value as string[]).join(', ') : ''}
                      onChange={(e) => handleConfigChange(param.path, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                      placeholder={param.description || 'first@email.com, next@email.com'}
                      className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                    />
                  </div>
                )
              case 'number':
                return (
                  <div key={param.path} className="space-y-2">
                    <FieldLabel text={param.label} description={param.description} htmlFor={param.path} />
                    <Input
                      type="number"
                      value={typeof value === 'number' ? value : ''}
                      onChange={(e) => handleConfigChange(param.path, Number(e.target.value || 0))}
                      placeholder={param.description}
                      className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                    />
                  </div>
                )
              case 'boolean':
                return (
                  <div key={param.path} className="flex items-center gap-2">
                    <input
                      id={param.path}
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(value)}
                      onChange={(e) => handleConfigChange(param.path, e.target.checked)}
                    />
                    <FieldLabel text={param.label} description={param.description} htmlFor={param.path} />
                  </div>
                )
              default:
                return null
            }
          })}
        </>
      )
    }
    
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
    
    // Email configuration - using new modular EmailNode
    if (data.nodeType === NodeType.ACTION && data.actionType === ActionType.EMAIL) {
      const config = data.config as unknown as EmailNodeConfig
      
      return (
        <>
          <div className="space-y-2">
            <Label>To (comma separated)</Label>
            <Input
              value={config.to?.join(', ') || ''}
              onChange={(e) => handleConfigChange('to', e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0))}
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
          
          <div className="space-y-2">
            <Label>From (optional)</Label>
            <Input
              value={config.from || ''}
              onChange={(e) => handleConfigChange('from', e.target.value)}
              placeholder="sender@example.com"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
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
              {"Examples: \"0 0 * * *\" (daily at midnight), \"*/5 * * * *\" (every 5 minutes)"}
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

    // Manual Trigger (no parameters, show helpful info)
    if (data.nodeType === NodeType.TRIGGER && data.triggerType === TriggerType.MANUAL) {
      return (
        <div className="text-sm text-gray-600">
          This trigger has no configuration. Use the Run button in the toolbar to start the workflow manually.
        </div>
      )
    }

    // Webhook Trigger helper info
    if (data.nodeType === NodeType.TRIGGER && data.triggerType === TriggerType.WEBHOOK) {
      return (
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            Configure accepted HTTP method and optional secret. Send requests to:
          </p>
          <pre className="text-xs bg-gray-100 text-gray-800 p-2 rounded border border-gray-200 overflow-x-auto">
            {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('workflowId') || '<workflowId>') : '<workflowId>'}`}
          </pre>
          <p className="text-xs text-gray-500">{"Use the \"GET\" button to preview received webhooks in the registry endpoint."}</p>
        </div>
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
          {"Use labels \"true\" and \"false\" on connections from IF nodes to control branching."}
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
          open={Boolean(selectedNodeId) && !pendingDeleteNodeId && isConfigPanelOpen}
          onOpenChange={(open) => !open && handleClose()}
          title="Configure Node"
          description={selectedNode?.data.label}
        >
          {renderConfigContent()}
        </MobileSheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && selectedNodeId && !pendingDeleteNodeId && isConfigPanelOpen && (
        <div className="absolute top-0 right-0 w-96 h-full bg-white text-gray-900 border-l border-gray-200 shadow-lg overflow-y-auto z-50">
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
