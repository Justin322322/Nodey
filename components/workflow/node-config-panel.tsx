"use client"

import { X } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MobileSheet } from '@/components/ui/mobile-sheet'
import { useToast } from '@/components/ui/toaster'
import { WorkflowNode, NodeType, ActionType, TriggerType, HttpNodeConfig, ScheduleNodeConfig } from '@/types/workflow'
import { EMAIL_NODE_DEFINITION, EmailNodeConfig } from '@/nodes/EmailNode'
import { WebhookNodeConfig } from '@/nodes/WebhookNode'
import { findNodeDefinition } from '@/lib/node-definitions'
import { validateWorkflowId } from '@/lib/workflow-id-validation'

// Import modular components
import {
  ParameterRenderer,
  SecurityWarning,
  HttpNodeConfiguration,
  EmailActionNodeConfiguration,
  ScheduleNodeConfiguration,
  WebhookNodeConfiguration,
  ManualNodeConfiguration,
  useParameterState,
  useNodeConfig
} from './node-config'

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

  // Use modular hooks
  const { jsonTextByPath, kvStateByPath, updateJsonText, updateKvState, resetStates } = useParameterState()
  const { selectedNode, isMobile, confirmOpenedFromPendingRef, handleConfigChange } = useNodeConfig(selectedNodeId)

  // Reset transient JSON editors when switching nodes
  useEffect(() => {
    resetStates()
  }, [selectedNodeId, resetStates])

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
  }, [pendingDeleteNodeId, selectedNodeId, setSelectedNodeId, confirmOpenedFromPendingRef])

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
  const selectedNodeData = nodes.find(n => n.id === nodeId) as WorkflowNode | undefined
  if (!selectedNodeData) return null

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

  // Render configuration based on node type
  const renderConfig = () => {
    const { data } = selectedNodeData
    const def = findNodeDefinition(selectedNodeData)

    // Use parameter renderer for nodes with parameters
    if (def?.parameters && def.parameters.length > 0) {
      return (
        <>
          {/* Security warnings for email credentials */}
          <SecurityWarning node={selectedNodeData} />

          <ParameterRenderer
            parameters={def.parameters}
            config={data.config}
            onConfigChange={handleConfigChange}
            jsonTextByPath={jsonTextByPath}
            kvStateByPath={kvStateByPath}
            onJsonTextChange={updateJsonText}
            onKvStateChange={updateKvState}
          />
        </>
      )
    }

    // Hardcoded configurations for specific node types
    if (data.nodeType === NodeType.ACTION && data.actionType === ActionType.HTTP) {
      const config = data.config as unknown as HttpNodeConfig
      return <HttpNodeConfiguration config={config} onConfigChange={handleConfigChange} />
    }

    if (data.nodeType === NodeType.ACTION && data.actionType === ActionType.EMAIL) {
      const config = data.config as unknown as EmailNodeConfig
      return <EmailActionNodeConfiguration config={config} onConfigChange={handleConfigChange} />
    }

    if (data.nodeType === NodeType.TRIGGER && data.triggerType === TriggerType.SCHEDULE) {
      const config = data.config as unknown as ScheduleNodeConfig
      return <ScheduleNodeConfiguration config={config} onConfigChange={handleConfigChange} />
    }

    if (data.nodeType === NodeType.TRIGGER && data.triggerType === TriggerType.MANUAL) {
      return <ManualNodeConfiguration />
    }

    if (data.nodeType === NodeType.TRIGGER && data.triggerType === TriggerType.WEBHOOK) {
      const config = data.config as unknown as WebhookNodeConfig
      return <WebhookNodeConfiguration config={config} onConfigChange={handleConfigChange} />
    }

    // Default message for unconfigured nodes
    return (
      <div className="text-sm text-gray-500">
        No configuration options available for this node type.
      </div>
    )
  }

  const renderConfigContent = () => (
    <div className="space-y-8">
      {/* Node Identity Section */}
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Node Identity
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Node Name</Label>
              <Input
                value={selectedNodeData.data.label}
                onChange={(e) => updateNode(nodeId, { label: e.target.value })}
                className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <Input
                value={selectedNodeData.data.description || ''}
                onChange={(e) => updateNode(nodeId, { description: e.target.value })}
                placeholder="Optional description"
                className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Node Configuration Section */}
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Node Configuration
          </h3>
          <div className="space-y-4">
            {renderConfig()}
          </div>
        </div>
      </div>

      {/* Execution Settings Section */}
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Execution Settings
          </h3>

          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Timeout (ms)</Label>
                <Input
                  type="number"
                  value={selectedNodeData.data.runSettings?.timeoutMs ?? ''}
                  onChange={(e) => updateNode(nodeId, {
                    runSettings: {
                      ...selectedNodeData.data.runSettings,
                      timeoutMs: Number(e.target.value || 0) || undefined,
                    },
                  })}
                  placeholder="30000"
                  className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Retries</Label>
                <Input
                  type="number"
                  value={selectedNodeData.data.runSettings?.retryCount ?? ''}
                  onChange={(e) => updateNode(nodeId, {
                    runSettings: {
                      ...selectedNodeData.data.runSettings,
                      retryCount: Number(e.target.value || 0) || undefined,
                    },
                  })}
                  placeholder="0"
                  className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Retry Delay (ms)</Label>
                <Input
                  type="number"
                  value={selectedNodeData.data.runSettings?.retryDelayMs ?? ''}
                  onChange={(e) => updateNode(nodeId, {
                    runSettings: {
                      ...selectedNodeData.data.runSettings,
                      retryDelayMs: Number(e.target.value || 0) || undefined,
                    },
                  })}
                  placeholder="0"
                  className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Error Handling</Label>
                <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-gray-300">
                  <input
                    id="continueOnFail"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    checked={Boolean(selectedNodeData.data.runSettings?.continueOnFail)}
                    onChange={(e) => updateNode(nodeId, {
                      runSettings: {
                        ...selectedNodeData.data.runSettings,
                        continueOnFail: e.target.checked,
                      },
                    })}
                  />
                  <Label htmlFor="continueOnFail" className="text-sm text-gray-700 cursor-pointer">
                    Continue on failure
                  </Label>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Use labels &quot;true&quot; and &quot;false&quot; on connections from IF nodes to control branching behavior.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="border-t border-gray-200 pt-6 sm:hidden">
        <div className="flex gap-3">
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600"
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
          description={selectedNodeData?.data.label}
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
          <p className="text-sm text-gray-500 mt-1">{selectedNodeData.data.label}</p>
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
