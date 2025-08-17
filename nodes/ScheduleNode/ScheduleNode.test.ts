import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScheduleNodeService } from './ScheduleNode.service'
import { NodeExecutionContext, createTestContext } from '../types'
import { SCHEDULE_NODE_DEFINITION } from './ScheduleNode.schema'
import { ScheduleNodeConfig, ScheduleExecutionResult } from './ScheduleNode.types'

describe('ScheduleNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Schema Validation', () => {
    it('should validate valid schedule configuration', () => {
      const config: ScheduleNodeConfig = {
        cron: '0 0 * * *',
        timezone: 'UTC',
        enabled: true
      }

      const errors = SCHEDULE_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toHaveLength(0)
    })

    it('should require cron expression', () => {
      const config: ScheduleNodeConfig = {
        cron: '',
        timezone: 'UTC'
      }

      const errors = SCHEDULE_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Cron expression is required')
    })

    it('should validate cron expression format', () => {
      const config: ScheduleNodeConfig = {
        cron: 'invalid-cron',
        timezone: 'UTC'
      }

      const errors = SCHEDULE_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Invalid cron expression format')
    })

    it('should validate timezone', () => {
      const config: ScheduleNodeConfig = {
        cron: '0 0 * * *',
        timezone: 'Invalid/Timezone'
      }

      const errors = SCHEDULE_NODE_DEFINITION.validate(config as Record<string, unknown>)
      expect(errors).toContain('Invalid timezone')
    })

    it('should accept valid cron expressions', () => {
      const validCrons = [
        '0 0 * * *',     // Daily at midnight
        '*/5 * * * *',   // Every 5 minutes
        '0 12 * * 1',    // Mondays at noon
        '30 14 1 * *',   // 1st of month at 2:30 PM
        '0 0 1 1 *',     // New Year's Day at midnight
        '15,45 * * * *', // Every hour at 15 and 45 minutes
        '0 9-17 * * 1-5' // Weekdays 9 AM to 5 PM
      ]

      validCrons.forEach((cron, index) => {
        const config: ScheduleNodeConfig = { cron }
        const errors = SCHEDULE_NODE_DEFINITION.validate(config as Record<string, unknown>)
        expect(errors, `Failed for cron expression: "${cron}" at index ${index}`).toHaveLength(0)
      })
    })

    it('should reject invalid cron expressions', () => {
      const invalidCrons = [
        '',
        'invalid',
        '60 0 * * *',      // Invalid minute (>59)
        '0 25 * * *',      // Invalid hour (>23)
        '0 0 32 * *',      // Invalid day (>31)
        '0 0 * 13 *',      // Invalid month (>12)
        '0 0 * * 7',       // Invalid weekday (>6)
        '0 0 * *',         // Too few fields
        '0 0 * * * *'      // Too many fields
      ]

      invalidCrons.forEach(cron => {
        const config: ScheduleNodeConfig = { cron }
        const errors = SCHEDULE_NODE_DEFINITION.validate(config as Record<string, unknown>)
        expect(errors.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Default Configuration', () => {
    it('should provide correct defaults', () => {
      const defaults = SCHEDULE_NODE_DEFINITION.getDefaults()
      
      expect(defaults).toEqual({
        cron: '0 0 * * *',
        timezone: 'UTC',
        enabled: true
      })
    })
  })

  describe('Service Validation', () => {
    it('should validate schedule with valid configuration', () => {
      const config: ScheduleNodeConfig = {
        cron: '0 0 * * *',
        timezone: 'UTC',
        enabled: true
      }

      const result = ScheduleNodeService.validateSchedule(config)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect high frequency schedules', () => {
      const config: ScheduleNodeConfig = {
        cron: '* * * * *', // Every minute
        timezone: 'UTC'
      }

      const result = ScheduleNodeService.validateSchedule(config)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings).toContain('Schedule runs very frequently (more than once per minute). Consider if this is necessary.')
    })
    it('should reject invalid timezone', () => {
      const config: ScheduleNodeConfig = {
        cron: '0 0 * * *',
        timezone: 'Invalid/Timezone'
      }

      const result = ScheduleNodeService.validateSchedule(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid timezone: Invalid/Timezone')
    })
  })

  describe('Cron Expression Parsing', () => {
    it('should parse valid cron expression', () => {
      const result = ScheduleNodeService.parseCronExpression('0 0 * * *', 'UTC')

      expect(result.isValid).toBe(true)
      expect(result.nextExecution).toBeDefined()
      expect(result.description).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid cron expression', () => {
      const result = ScheduleNodeService.parseCronExpression('invalid-cron', 'UTC')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.nextExecution).toBeUndefined()
    })

    it('should handle missing cron expression', () => {
      const result = ScheduleNodeService.parseCronExpression('', 'UTC')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Cron expression is required')
    })
  })

  describe('Schedule Execution', () => {
    it('should execute schedule successfully with valid configuration', async () => {
      const context = createTestContext({
        config: {
          cron: '0 0 * * *',
          timezone: 'UTC',
          enabled: true
        }
      })

      const result = await ScheduleNodeService.execute(context)

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
      expect(result.error).toBeUndefined()

      const output = result.output as ScheduleExecutionResult
      expect(output.triggered).toBe(true)
      expect(output.cronExpression).toBe('0 0 * * *')
      expect(output.timezone).toBe('UTC')
      expect(output.timestamp).toBeInstanceOf(Date)
    })

    it('should fail with invalid cron expression', async () => {
      const context = createTestContext({
        config: {
          cron: 'invalid-cron',
          timezone: 'UTC'
        }
      })

      const result = await ScheduleNodeService.execute(context)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Schedule validation failed')
      expect(result.output).toBeUndefined()
    })

    it('should fail with missing cron expression', async () => {
      const context = createTestContext({
        config: {
          timezone: 'UTC'
        }
      })

      const result = await ScheduleNodeService.execute(context)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cron expression is required')
    })

    it('should handle execution errors gracefully', async () => {
      // Mock an error by providing invalid config type
      const context = createTestContext({
        config: null as unknown as ScheduleNodeConfig
      })

      const result = await ScheduleNodeService.execute(context)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(typeof result.error).toBe('string')
    })

    it('should use default timezone when not specified', async () => {
      const context = createTestContext({
        config: {
          cron: '0 0 * * *'
        }
      })

      const result = await ScheduleNodeService.execute(context)

      expect(result.success).toBe(true)
      const output = result.output as ScheduleExecutionResult
      expect(output.timezone).toBe('UTC')
    })

    it('should handle different timezones', async () => {
      const context = createTestContext({
        config: {
          cron: '0 0 * * *',
          timezone: 'America/New_York'
        }
      })

      const result = await ScheduleNodeService.execute(context)

      expect(result.success).toBe(true)
      const output = result.output as ScheduleExecutionResult
      expect(output.timezone).toBe('America/New_York')
    })

    it('should short-circuit when schedule is disabled', async () => {
      const context = createTestContext({
        config: {
          cron: '0 0 * * *',
          timezone: 'UTC',
          enabled: false
        }
      })

      const result = await ScheduleNodeService.execute(context)

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
      expect(result.error).toBeUndefined()

      const output = result.output as ScheduleExecutionResult
      expect(output.triggered).toBe(false)
      expect(output.reason).toBe('Schedule disabled')
      expect(output.cronExpression).toBe('0 0 * * *')
      expect(output.timezone).toBe('UTC')
      expect(output.timestamp).toBeInstanceOf(Date)
    })

    it('should handle disabled schedule with custom timezone', async () => {
      const context = createTestContext({
        config: {
          cron: '*/15 * * * *',
          timezone: 'America/Los_Angeles',
          enabled: false
        }
      })

      const result = await ScheduleNodeService.execute(context)

      expect(result.success).toBe(true)
      const output = result.output as ScheduleExecutionResult
      expect(output.triggered).toBe(false)
      expect(output.reason).toBe('Schedule disabled')
      expect(output.cronExpression).toBe('*/15 * * * *')
      expect(output.timezone).toBe('America/Los_Angeles')
    })

    it('should handle disabled schedule with default timezone', async () => {
      const context = createTestContext({
        config: {
          cron: '0 12 * * 1-5',
          enabled: false
        }
      })

      const result = await ScheduleNodeService.execute(context)

      expect(result.success).toBe(true)
      const output = result.output as ScheduleExecutionResult
      expect(output.triggered).toBe(false)
      expect(output.reason).toBe('Schedule disabled')
      expect(output.cronExpression).toBe('0 12 * * 1-5')
      expect(output.timezone).toBe('UTC')
    })
  })

  describe('Cron Field Validation', () => {
    it('should validate minute field correctly', () => {
      // Valid minutes
      expect(ScheduleNodeService.parseCronExpression('0 0 * * *')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('59 0 * * *')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('*/15 0 * * *')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('0,30 0 * * *')).toMatchObject({ isValid: true })
      
      // Invalid minutes
      expect(ScheduleNodeService.parseCronExpression('60 0 * * *')).toMatchObject({ isValid: false })
      expect(ScheduleNodeService.parseCronExpression('-1 0 * * *')).toMatchObject({ isValid: false })
    })

    it('should validate hour field correctly', () => {
      // Valid hours
      expect(ScheduleNodeService.parseCronExpression('0 0 * * *')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('0 23 * * *')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('0 */4 * * *')).toMatchObject({ isValid: true })
      
      // Invalid hours
      expect(ScheduleNodeService.parseCronExpression('0 24 * * *')).toMatchObject({ isValid: false })
      expect(ScheduleNodeService.parseCronExpression('0 -1 * * *')).toMatchObject({ isValid: false })
    })

    it('should validate day field correctly', () => {
      // Valid days
      expect(ScheduleNodeService.parseCronExpression('0 0 1 * *')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('0 0 31 * *')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('0 0 */7 * *')).toMatchObject({ isValid: true })
      
      // Invalid days
      expect(ScheduleNodeService.parseCronExpression('0 0 0 * *')).toMatchObject({ isValid: false })
      expect(ScheduleNodeService.parseCronExpression('0 0 32 * *')).toMatchObject({ isValid: false })
    })

    it('should validate month field correctly', () => {
      // Valid months
      expect(ScheduleNodeService.parseCronExpression('0 0 * 1 *')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('0 0 * 12 *')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('0 0 * */3 *')).toMatchObject({ isValid: true })
      
      // Invalid months
      expect(ScheduleNodeService.parseCronExpression('0 0 * 0 *')).toMatchObject({ isValid: false })
      expect(ScheduleNodeService.parseCronExpression('0 0 * 13 *')).toMatchObject({ isValid: false })
    })

    it('should validate weekday field correctly', () => {
      // Valid weekdays
      expect(ScheduleNodeService.parseCronExpression('0 0 * * 0')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('0 0 * * 6')).toMatchObject({ isValid: true })
      expect(ScheduleNodeService.parseCronExpression('0 0 * * 1-5')).toMatchObject({ isValid: true })
      
      // Invalid weekdays
      expect(ScheduleNodeService.parseCronExpression('0 0 * * 7')).toMatchObject({ isValid: false })
      expect(ScheduleNodeService.parseCronExpression('0 0 * * -1')).toMatchObject({ isValid: false })
    })
  })
})
