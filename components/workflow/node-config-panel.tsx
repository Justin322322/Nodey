"use client"

import { X, Info, Copy, ShieldCheck } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CredentialSelector } from '@/components/ui/credential-selector'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MobileSheet } from '@/components/ui/mobile-sheet'
import { useToast } from '@/components/ui/toaster'
import { WorkflowNode, NodeType, ActionType, TriggerType, HttpNodeConfig, ScheduleNodeConfig } from '@/types/workflow'
import { EMAIL_NODE_DEFINITION, EmailNodeConfig } from '@/nodes/EmailNode'
import { CredentialType, toCredentialType } from '@/types/credentials'
import { WebhookNodeConfig } from '@/nodes/WebhookNode'
import { findNodeDefinition } from '@/lib/node-definitions'
import { SECURITY_WARNINGS, getSecurityStatus } from '@/lib/security'
import { getArrayValue, getObjectValue, pathValueEquals, getTypedParameterValue, getSafeDescription, getSafePlaceholder, getValueAtPath, getSafeDefaultValue } from '@/lib/type-safe-utils'

/**
 * Validates and sanitizes a workflowId parameter
 * @param workflowId - The workflowId to validate
 * @returns A safe workflowId string or '<workflowId>' fallback
 */
function validateWorkflowId(workflowId: string | null): string {
  if (!workflowId) {
    return '<workflowId>'
  }
  
  // Trim whitespace from input
  const trimmed = workflowId.trim()
  
  // Check if empty after trimming
  if (!trimmed) {
    return '<workflowId>'
  }
  
  // Check length constraints (min 3, max 64 characters)
  if (trimmed.length < 3 || trimmed.length > 64) {
    return '<workflowId>'
  }
  
  // Reserved names to disallow
  const reservedNames = new Set([
    'api', 'app', 'www', 'admin', 'root', 'test', 'demo', 'config', 'settings',
    'system', 'public', 'private', 'static', 'assets', 'lib', 'src', 'node_modules',
    'null', 'undefined', 'true', 'false', 'new', 'delete', 'edit', 'create'
  ])
  
  // Check for reserved names (case-insensitive)
  if (reservedNames.has(trimmed.toLowerCase())) {
    return '<workflowId>'
  }
  
  // Comprehensive regex validation (browser-compatible):
  // - Must start and end with alphanumeric character
  // - Can contain alphanumeric, dash, or underscore in the middle
  // - No consecutive special characters (-- __ -_ _-)
  // - Uses negative lookaheads instead of lookbehind for browser compatibility
  const validPattern = /^(?!.*[_-]{2})(?![_-])(?!.*[_-]$)[a-zA-Z0-9_-]+$/
  
  if (!validPattern.test(trimmed)) {
    return '<workflowId>'
  }
  
  return trimmed
}

/**
 * Safely gets the workflowId from URL search params
 * @returns A validated and URI-encoded workflowId
 */
function getSafeWorkflowIdFromUrl(): string {
  if (typeof window === 'undefined') {
    return encodeURIComponent('<workflowId>')
  }
  
  const urlParams = new URLSearchParams(window.location.search)
  const workflowId = urlParams.get('workflowId')
  const validatedWorkflowId = validateWorkflowId(workflowId)
  
  return encodeURIComponent(validatedWorkflowId)
}

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
    const setDeep = (obj: Record<string, unknown>, p: string, v: unknown): Record<string, unknown> => {
      const parts = p.split('.')
      
      // Validate path segments to prevent prototype pollution
      const dangerousSegments = ['__proto__', 'constructor', 'prototype']
      for (const part of parts) {
        if (dangerousSegments.includes(part.toLowerCase())) {
          throw new Error(`Invalid path segment: "${part}" - potential prototype pollution attempt`)
        }
      }
      
      // Type guard to check if value is a valid object  
      const isValidObject = (val: unknown): val is Record<string, unknown> => {
        return val !== null && typeof val === 'object' && !Array.isArray(val)
      }
      
      // Create a safe clone using Object.create(null) for the root to avoid prototype chain
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Object.create(null) creates object without prototype
      const clone: Record<string, unknown> = Object.create(null)
      
      // Safely copy properties from the original object
      for (const [key, val] of Object.entries(obj)) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          clone[key] = val
        }
      }
      
      let cur: Record<string, unknown> = clone
      for (let i = 0; i < parts.length - 1; i += 1) {
        const key = parts[i]
        const next = cur[key]
        if (!isValidObject(next)) {
          // Create safe object without prototype chain
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Object.create(null) creates object without prototype
          cur[key] = Object.create(null)
        } else {
          // Safely clone the nested object
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Object.create(null) creates object without prototype
          const nestedClone: Record<string, unknown> = Object.create(null)
          for (const [nestedKey, nestedVal] of Object.entries(next)) {
            if (Object.prototype.hasOwnProperty.call(next, nestedKey)) {
              nestedClone[nestedKey] = nestedVal
            }
          }
          cur[key] = nestedClone
        }
        cur = cur[key] as Record<string, unknown>
      }
      
      // Set the final value only if the key is safe
      const finalKey = parts[parts.length - 1]
      cur[finalKey] = v
      
      return clone
    }
    const nextConfig = setDeep((selectedNode.data.config as Record<string, unknown>) || {}, path, value)
    updateNode(nodeId, {
      config: nextConfig,
    })
  }

  // Type-safe path utilities are now imported from lib/type-safe-utils
  
  // Inline type-safe parameter helpers to avoid ESLint unsafe operations
  const safeString = (value: unknown): string => typeof value === 'string' ? value : ''
  const safeNumber = (value: unknown): number => typeof value === 'number' ? value : 0
  const safeBoolean = (value: unknown): boolean => typeof value === 'boolean' ? value : false
  const safeObject = (value: unknown): Record<string, unknown> => 
    (value && typeof value === 'object' && !Array.isArray(value)) ? value as Record<string, unknown> : {}
  
  const getParamValue = (path: string, paramType: 'string' | 'number' | 'boolean', defaultVal: unknown): string | number | boolean => {
    const config = (selectedNode.data.config as Record<string, unknown>) || {}
    try {
      if (paramType === 'string') {
        return getTypedParameterValue(config, path, defaultVal, 'string')
      } else if (paramType === 'number') {
        return getTypedParameterValue(config, path, defaultVal, 'number')
      } else {
        return getTypedParameterValue(config, path, defaultVal, 'boolean')
      }
    } catch {
      // Fallback for type safety
      switch (paramType) {
        case 'string':
          return ''
        case 'number':
          return 0
        case 'boolean':
          return false
        default:
          return ''
      }
    }
  }
  
  const renderConfig = () => {
    const { data } = selectedNode
    const def = findNodeDefinition(selectedNode)
    if (def?.parameters && def.parameters.length > 0) {
      // Define a proper interface for parameter definition
      interface ExtendedParameterDefinition {
        type: string
        label: string
        path: string
        default?: unknown
        description?: unknown
        placeholder?: unknown
        options?: Array<{ label: string; value: string }> | (() => Array<{ label: string; value: string }>)
        showIf?: Array<{ path?: string; name?: string; equals: string | number | boolean }>
        credentialType?: CredentialType
      }
      
      // Type guard function to check if parameter has required properties
      const isValidParameter = (param: unknown): param is ExtendedParameterDefinition => {
        if (!param || typeof param !== 'object') return false
        const p = param as Record<string, unknown>
        return typeof p.type === 'string' && 
               typeof p.label === 'string' && 
               typeof p.path === 'string'
      }
      
      const parameters = def.parameters.filter(isValidParameter) as ExtendedParameterDefinition[]
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
          {/* Security warnings for email credentials */}
          {selectedNode.data.nodeType === NodeType.ACTION && 
           (selectedNode.data as { actionType: ActionType }).actionType === ActionType.EMAIL && (
            <div className="mb-4 p-3 border border-gray-300 rounded-md">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Security Notice</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Your credentials are encrypted and stored locally on your device only</li>
                    <li>• Use app-specific passwords instead of your main email password</li>
                    <li>• Data is automatically cleared when you close the browser</li>
                    <li>• Only use on trusted devices for maximum security</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {parameters.map((param) => {
            // Type-safe showIf condition checking with runtime guards
            const shouldShow = (() => {
              // Check if showIf exists and is an array
              if (!Array.isArray(param.showIf) || param.showIf.length === 0) {
                return true
              }
              
              // Safely assert selectedNode.data.config exists
              const config = selectedNode?.data?.config
              if (!config || typeof config !== 'object') {
                return true // Show by default if config is invalid
              }
              
              // Check if any condition matches with safe predicate
              return param.showIf.some((cond) => {
                // Verify cond is an object and has required properties
                if (!cond || typeof cond !== 'object') {
                  return false
                }
                
                // Type guard for condition structure
                const isValidCondition = (c: unknown): c is { path?: string; name?: string; equals: string | number | boolean } => {
                  if (!c || typeof c !== 'object') return false
                  const condition = c as Record<string, unknown>
                  
                  // Must have either path or name (but not both) as strings
                  const hasPath = typeof condition.path === 'string'
                  const hasName = typeof condition.name === 'string'
                  const hasEquals = condition.equals !== undefined
                  
                  return (hasPath || hasName) && hasEquals && !(hasPath && hasName)
                }
                
                if (!isValidCondition(cond)) {
                  return false
                }
                
                // Extract the path or name safely
                const pathToCheck = cond.path || cond.name || ''
                if (!pathToCheck) {
                  return false
                }
                
                return pathValueEquals(config as Record<string, unknown>, pathToCheck, cond.equals)
              })
            })()
            
            if (!shouldShow) return null
            switch (param.type) {
              case 'select': {
                const config = (selectedNode.data.config as Record<string, unknown>) || {}
                const paramPath = param.path
                const currentValue = getValueAtPath(config, paramPath)
                const defaultVal = getSafeDefaultValue(param.default, 'string')
                const value = typeof currentValue === 'string' ? currentValue : defaultVal
                const description = getSafeDescription(param.description)
                return (
                  <div key={paramPath} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={description} />
            <Select
              value={value}
              onValueChange={(v) => handleConfigChange(paramPath, v)}
            >
              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(typeof param.options === 'function' ? param.options() : param.options || []).map((opt: { label: string; value: string }) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              }
              case 'string':
              case 'text': {
                // Allow both 'string' and 'text' parameter types for compatibility
                const paramPath = param.path
                const value = getParamValue(paramPath, 'string', param.default)
                const description = getSafeDescription(param.description)
                return (
                  <div key={paramPath} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={description} htmlFor={paramPath} />
                    <Input
                      value={String(value)}
                      onChange={(e) => handleConfigChange(paramPath, e.target.value)}
                      placeholder={description}
                      className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                    />
                  </div>
                )
              }
              case 'textarea': {
                const value = getParamValue(param.path, 'string', param.default)
                const description = getSafeDescription(param.description)
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={description} htmlFor={param.path} />
                    <textarea
                      className="w-full p-2 border rounded-md bg-white text-gray-900 border-gray-300"
                      rows={6}
                      value={String(value)}
                      onChange={(e) => handleConfigChange(param.path, e.target.value)}
                      placeholder={description}
                    />
                  </div>
                )
              }
              case 'json': {
                const paramPath = param.path
                // Friendly editors for headers/body
                const isHeaders = paramPath === 'headers'
                const isBody = paramPath === 'body'
                if (isHeaders || isBody) {
                  const objectValue = getObjectValue<Record<string, string>>(selectedNode.data.config as Record<string, unknown>, param.path, {})
                  const existingKvState = kvStateByPath[paramPath as keyof typeof kvStateByPath]
                  const initialRows = Array.isArray(existingKvState)
                    ? existingKvState
                    : Object.entries(objectValue).map(([k, v]) => ({ id: `${k}-${Math.random().toString(36).slice(2)}`, key: k, value: String(v) }))
                  let rows = initialRows
                  if (!rows || rows.length === 0) {
                    rows = [{ id: 'new', key: '', value: '' }]
                  }
                  const setRows = (next: { id: string; key: string; value: string }[]) => {
                    setKvStateByPath((s) => ({ ...s, [paramPath]: next }))
                    const obj: Record<string, string> = {}
                    next.forEach((r) => {
                      const k = r.key.trim()
                      if (k) obj[k] = r.value
                    })
                    handleConfigChange(paramPath, obj)
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
                      <FieldLabel text={param.label} description={getSafeDescription(param.description)} />
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
                              onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                
                                const textToCopy = JSON.stringify(previewObj, null, 2)
                                
                                try {
                                  // Try modern clipboard API first
                                  if (navigator.clipboard && window.isSecureContext) {
                                    await navigator.clipboard.writeText(textToCopy)
                                    toast({ 
                                      title: 'Copied to clipboard', 
                                      description: 'JSON data copied successfully',
                                      variant: 'success' 
                                    })
                                  } else {
                                    // Fallback to document.execCommand for older browsers or non-secure contexts
                                    const textarea = document.createElement('textarea')
                                    textarea.value = textToCopy
                                    textarea.style.position = 'fixed'
                                    textarea.style.left = '-999999px'
                                    textarea.style.top = '-999999px'
                                    document.body.appendChild(textarea)
                                    textarea.focus()
                                    textarea.select()
                                    
                                    if (document.execCommand('copy')) {
                                      toast({ 
                                        title: 'Copied to clipboard', 
                                        description: 'JSON data copied successfully',
                                        variant: 'success' 
                                      })
                                    } else {
                                      throw new Error('Fallback copy method failed')
                                    }
                                    
                                    document.body.removeChild(textarea)
                                  }
                                } catch (err) {
                                  console.error('Copy failed:', err)
                                  toast({ 
                                    title: 'Copy failed', 
                                    description: 'Unable to copy JSON data to clipboard',
                                    variant: 'destructive' 
                                  })
                                }
                              }}
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
                const defaultValue = getSafeDefaultValue(param.default, 'object')
                const jsonValue = getObjectValue(selectedNode.data.config as Record<string, unknown>, param.path, defaultValue)
                const existingJsonText = jsonTextByPath[paramPath as keyof typeof jsonTextByPath]
                const displayText =
                  typeof existingJsonText === 'string'
                    ? existingJsonText
                    : JSON.stringify(jsonValue, null, 2)
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={getSafeDescription(param.description)} />
                    <textarea
                      className="w-full p-2 border rounded-md text-sm font-mono bg-white text-gray-900 border-gray-300"
                      rows={6}
                      value={displayText}
                      onChange={(e) => {
                        const text = e.target.value
                        setJsonTextByPath((s) => ({ ...s, [paramPath]: text }))
                        try {
                          const parsed = JSON.parse(text) as unknown
                          handleConfigChange(paramPath, parsed)
                        } catch {
                          // Keep editing buffer until valid
                        }
                      }}
                      placeholder={getSafeDescription(param.description) || '{}'}
                    />
                  </div>
                )
              }
              case 'stringList': {
                const arrayValue = getArrayValue<string>(selectedNode.data.config as Record<string, unknown>, param.path, [])
                const description = getSafeDescription(param.description)
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={description} htmlFor={param.path} />
                    <Input
                      value={arrayValue.map(String).join(', ')}
                      onChange={(e) => handleConfigChange(param.path, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                      placeholder={description || 'first@email.com, next@email.com'}
                      className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                    />
                  </div>
                )
              }
              case 'number': {
                const numberValue = getParamValue(param.path, 'number', param.default)
                const description = getSafeDescription(param.description)
                return (
                  <div key={param.path} className="space-y-2">
                    <FieldLabel text={param.label} description={description} htmlFor={param.path} />
                    <Input
                      type="number"
                      value={numberValue === 0 ? '' : String(numberValue)}
                      onChange={(e) => handleConfigChange(param.path, Number(e.target.value || 0))}
                      placeholder={description}
                      className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                    />
                  </div>
                )
              }
              case 'boolean': {
                const booleanValue = getParamValue(param.path, 'boolean', param.default)
                const description = getSafeDescription(param.description)
                return (
                  <div key={param.path} className="flex items-center gap-2">
                    <input
                      id={param.path}
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(booleanValue)}
                      onChange={(e) => handleConfigChange(param.path, e.target.checked)}
                    />
                    <FieldLabel text={param.label} description={description} htmlFor={param.path} />
                  </div>
                )
              }
              case 'email': {
                const emailValue = getParamValue(param.path, 'string', param.default)
                const description = getSafeDescription(param.description)
                const placeholder = getSafePlaceholder(param.placeholder)
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={description} htmlFor={param.path} />
                    <Input
                      type="email"
                      value={String(emailValue)}
                      onChange={(e) => handleConfigChange(param.path, e.target.value)}
                      placeholder={placeholder || 'Enter email address'}
                      className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                    />
                  </div>
                )
              }
              case 'password': {
                const passwordValue = getParamValue(param.path, 'string', param.default)
                const description = getSafeDescription(param.description)
                const placeholder = getSafePlaceholder(param.placeholder)
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={description} htmlFor={param.path} />
                    <Input
                      type="password"
                      value={String(passwordValue)}
                      onChange={(e) => handleConfigChange(param.path, e.target.value)}
                      placeholder={placeholder || 'Enter password'}
                      className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                    />
                  </div>
                )
              }
              case 'url': {
                const urlValue = getParamValue(param.path, 'string', param.default)
                const description = getSafeDescription(param.description)
                const placeholder = getSafePlaceholder(param.placeholder)
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={description} htmlFor={param.path} />
                    <Input
                      type="url"
                      value={String(urlValue)}
                      onChange={(e) => handleConfigChange(param.path, e.target.value)}
                      placeholder={placeholder || 'Enter URL'}
                      className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                    />
                  </div>
                )
              }

              case 'credential': {
                const credentialValue = getParamValue(param.path, 'string', param.default)
                const description = getSafeDescription(param.description)
                const placeholder = getSafePlaceholder(param.placeholder)
                const credentialType = toCredentialType(param.credentialType)
                return (
                  <div key={param.path} className="space-y-1.5 sm:space-y-2">
                    <FieldLabel text={param.label} description={description} />
                    <CredentialSelector
                      value={String(credentialValue)}
                      onChange={(credentialId) => handleConfigChange(param.path, credentialId)}
                      credentialType={credentialType}
                      placeholder={placeholder || 'Select a credential'}
                      className="w-full"
                    />
                  </div>
                )
              }
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
                  const headers = JSON.parse(e.target.value) as Record<string, string>
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
                    const body = JSON.parse(e.target.value) as unknown
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

    // Webhook configuration
    if (data.nodeType === NodeType.TRIGGER && data.triggerType === TriggerType.WEBHOOK) {
      const config = data.config as unknown as WebhookNodeConfig
      
      return (
        <>
          <div className="space-y-2">
            <Label>HTTP Method</Label>
            <Select
              value={config.method || 'POST'}
              onValueChange={(value) => handleConfigChange('method', value)}
            >
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Webhook Secret (Optional)</Label>
            <Input
              type="password"
              value={config.secret || ''}
              onChange={(e) => handleConfigChange('secret', e.target.value)}
              placeholder="Leave empty to disable signature verification"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
            <p className="text-xs text-gray-500">
              Used for HMAC signature verification. Recommended for security.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Signature Header</Label>
            <Input
              value={config.signatureHeader || 'x-webhook-signature'}
              onChange={(e) => handleConfigChange('signatureHeader', e.target.value)}
              placeholder="x-webhook-signature"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
            <p className="text-xs text-gray-500">
              Header name where signature will be sent (only used if secret is set).
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Response Mode</Label>
            <Select
              value={config.responseMode || 'async'}
              onValueChange={(value) => handleConfigChange('responseMode', value)}
            >
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Select response mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="async">Asynchronous (Immediate Response)</SelectItem>
                <SelectItem value="sync">Synchronous (Wait for Completion)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Response Status Code</Label>
            <Input
              type="number"
              value={config.responseCode || 200}
              onChange={(e) => handleConfigChange('responseCode', parseInt(e.target.value) || 200)}
              placeholder="200"
              min="100"
              max="599"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Response Body (JSON)</Label>
            <textarea
              value={config.responseBody || '{"success": true, "message": "Webhook received"}'}
              onChange={(e) => handleConfigChange('responseBody', e.target.value)}
              placeholder='{"success": true, "message": "Webhook received"}'
              className="w-full h-20 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-500">
              JSON response body to return on successful webhook.
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <p className="font-medium">Webhook URL:</p>
            <pre className="text-xs bg-white text-gray-800 p-2 rounded border overflow-x-auto">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${getSafeWorkflowIdFromUrl()}`}
            </pre>
            <p className="text-xs text-gray-500">
              Send {config.method || 'POST'} requests to this URL to trigger the workflow.
            </p>
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
        
        <div className="px-3 py-4">
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
