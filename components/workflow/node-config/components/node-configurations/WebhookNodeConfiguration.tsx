import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WebhookNodeConfig } from '@/nodes/WebhookNode'

interface WebhookNodeConfigurationProps {
  config: WebhookNodeConfig
  onConfigChange: (path: string, value: unknown) => void
}

function getSafeWorkflowIdFromUrl(): string {
  if (typeof window === 'undefined') {
    return encodeURIComponent('<workflowId>')
  }

  const urlParams = new URLSearchParams(window.location.search)
  const workflowId = urlParams.get('workflowId')
  // Assuming validateWorkflowId is imported from utils
  return encodeURIComponent(workflowId || '<workflowId>')
}

export function WebhookNodeConfiguration({ config, onConfigChange }: WebhookNodeConfigurationProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>HTTP Method</Label>
        <Select
          value={config.method || 'POST'}
          onValueChange={(value) => onConfigChange('method', value)}
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
          onChange={(e) => onConfigChange('secret', e.target.value)}
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
          onChange={(e) => onConfigChange('signatureHeader', e.target.value)}
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
          onValueChange={(value) => onConfigChange('responseMode', value)}
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
          onChange={(e) => onConfigChange('responseCode', parseInt(e.target.value) || 200)}
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
          onChange={(e) => onConfigChange('responseBody', e.target.value)}
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
