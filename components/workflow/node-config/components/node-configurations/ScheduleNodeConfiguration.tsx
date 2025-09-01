import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ScheduleNodeConfig } from '@/types/workflow'

interface ScheduleNodeConfigurationProps {
  config: ScheduleNodeConfig
  onConfigChange: (path: string, value: unknown) => void
}

export function ScheduleNodeConfiguration({ config, onConfigChange }: ScheduleNodeConfigurationProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Cron Expression</Label>
        <Input
          value={config.cron || ''}
          onChange={(e) => onConfigChange('cron', e.target.value)}
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
          onChange={(e) => onConfigChange('timezone', e.target.value)}
          placeholder="UTC"
          className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
        />
      </div>
    </>
  )
}
