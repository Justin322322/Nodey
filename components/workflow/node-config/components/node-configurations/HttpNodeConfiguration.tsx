import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HttpNodeConfig } from '@/types/workflow'

interface HttpNodeConfigurationProps {
  config: HttpNodeConfig
  onConfigChange: (path: string, value: unknown) => void
}

export function HttpNodeConfiguration({ config, onConfigChange }: HttpNodeConfigurationProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Method</Label>
        <Select
          value={config.method || 'GET'}
          onValueChange={(value) => onConfigChange('method', value)}
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
          onChange={(e) => onConfigChange('url', e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
        />
      </div>

      <div className="space-y-2">
        <Label>Authentication</Label>
        <Select
          value={config.authentication?.type || 'none'}
          onValueChange={(value) =>
            onConfigChange('authentication', {
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
              onConfigChange('authentication', {
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
              onConfigChange('headers', headers)
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
                onConfigChange('body', body)
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
