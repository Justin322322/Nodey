import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { EmailNodeConfig } from '@/nodes/EmailNode'

interface EmailActionNodeConfigurationProps {
  config: EmailNodeConfig
  onConfigChange: (path: string, value: unknown) => void
}

export function EmailActionNodeConfiguration({ config, onConfigChange }: EmailActionNodeConfigurationProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>To (comma separated)</Label>
        <Input
          value={config.to?.join(', ') || ''}
          onChange={(e) => onConfigChange('to', e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0))}
          placeholder="user@example.com, another@example.com"
          className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
        />
      </div>

      <div className="space-y-2">
        <Label>Subject</Label>
        <Input
          value={config.subject || ''}
          onChange={(e) => onConfigChange('subject', e.target.value)}
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
          onChange={(e) => onConfigChange('body', e.target.value)}
          placeholder="Email body content..."
        />
      </div>

      <div className="space-y-2">
        <Label>From (optional)</Label>
        <Input
          value={config.from || ''}
          onChange={(e) => onConfigChange('from', e.target.value)}
          placeholder="sender@example.com"
          className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
        />
      </div>
    </>
  )
}
