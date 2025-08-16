import { NodeType, TriggerType } from '@/types/workflow'
import { ScheduleNodeConfig } from './ScheduleNode.types'

interface ParameterDefinition {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'email' | 'url'
  required?: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  description?: string
}

interface NodeDefinition {
  nodeType: NodeType
  subType: TriggerType
  label: string
  description: string
  parameters: ParameterDefinition[]
  validate: (config: Record<string, unknown>) => string[]
  getDefaults: () => ScheduleNodeConfig
}

export const SCHEDULE_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.TRIGGER,
  subType: TriggerType.SCHEDULE,
  label: 'Schedule',
  description: 'Run workflow on a recurring schedule using cron expressions',
  parameters: [
    {
      name: 'cron',
      label: 'Cron Expression',
      type: 'text',
      required: true,
      defaultValue: '0 0 * * *',
      description: 'Cron expression defining when to run (e.g., "0 0 * * *" for daily at midnight)',
      placeholder: '0 0 * * *'
    },
    {
      name: 'timezone',
      label: 'Timezone',
      type: 'select',
      required: false,
      defaultValue: 'UTC',
      description: 'Timezone for the schedule',
      options: [
        { label: 'UTC', value: 'UTC' },
        { label: 'America/New_York', value: 'America/New_York' },
        { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
        { label: 'America/Chicago', value: 'America/Chicago' },
        { label: 'Europe/London', value: 'Europe/London' },
        { label: 'Europe/Paris', value: 'Europe/Paris' },
        { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
        { label: 'Asia/Shanghai', value: 'Asia/Shanghai' },
        { label: 'Australia/Sydney', value: 'Australia/Sydney' }
      ]
    },
    {
      name: 'enabled',
      label: 'Enabled',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Whether the schedule is active'
    }
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = []
    const typed = config as unknown as ScheduleNodeConfig
    
    if (!typed.cron || typeof typed.cron !== 'string' || typed.cron.trim().length === 0) {
      errors.push('Cron expression is required')
    } else if (!isValidCronExpression(typed.cron.trim())) {
      errors.push('Invalid cron expression format')
    }
    
    if (typed.timezone && typeof typed.timezone === 'string' && !isValidTimezone(typed.timezone)) {
      errors.push('Invalid timezone')
    }
    
    return errors
  },
  getDefaults: (): ScheduleNodeConfig => ({
    cron: '0 0 * * *',
    timezone: 'UTC',
    enabled: true
  })
}

/**
 * Validates a cron expression format
 * Basic validation for standard 5-field cron expressions (minute hour day month weekday)
 */
function isValidCronExpression(cron: string): boolean {
  const parts = cron.split(/\s+/)
  if (parts.length !== 5) {
    return false
  }
  
  // Validate each part
  const [minute, hour, day, month, weekday] = parts
  
  return (
    isValidCronField(minute, 0, 59) &&
    isValidCronField(hour, 0, 23) &&
    isValidCronField(day, 1, 31) &&
    isValidCronField(month, 1, 12) &&
    isValidCronField(weekday, 0, 6)
  )
}

/**
 * Validates a single cron field
 */
function isValidCronField(field: string, min: number, max: number): boolean {
  if (field === '*') return true
  
  // Handle step values (*/n)
  if (field.startsWith('*/')) {
    const step = parseInt(field.substring(2), 10)
    return !isNaN(step) && step > 0 && step <= max
  }
  
  // Handle ranges (n-m)
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(num => parseInt(num, 10))
    return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end
  }
  
  // Handle lists (n,m,o)
  if (field.includes(',')) {
    const values = field.split(',').map(num => parseInt(num, 10))
    return values.every(val => !isNaN(val) && val >= min && val <= max)
  }
  
  // Handle single values
  const value = parseInt(field, 10)
  return !isNaN(value) && value >= min && value <= max
}

/**
 * Basic timezone validation
 */
function isValidTimezone(timezone: string): boolean {
  const validTimezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles', 
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ]
  
  return validTimezones.includes(timezone)
}
