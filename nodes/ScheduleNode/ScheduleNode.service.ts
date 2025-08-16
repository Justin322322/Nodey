import { NodeExecutionContext, NodeExecutionResult } from '@/nodes/types'
import { ScheduleNodeConfig, ScheduleExecutionResult, CronParseResult, ScheduleValidationResult } from './ScheduleNode.types'

export class ScheduleNodeService {
  /**
   * Execute the schedule node - this typically doesn't "execute" in the traditional sense
   * but validates the configuration and provides information about the schedule
   */
  static async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    try {
      const config = context.config as ScheduleNodeConfig
      
      // Check if schedule is disabled
      if (config.enabled === false) {
        const result: ScheduleExecutionResult = {
          triggered: false,
          reason: 'Schedule disabled',
          cronExpression: config.cron,
          timezone: config.timezone || 'UTC',
          timestamp: new Date()
        }

        return {
          success: true,
          output: result
        }
      }
      
      // Validate the schedule configuration
      const validation = this.validateSchedule(config)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Schedule validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Parse the cron expression
      const cronResult = this.parseCronExpression(config.cron, config.timezone)
      if (!cronResult.isValid) {
        return {
          success: false,
          error: `Invalid cron expression: ${cronResult.error}`
        }
      }

      const result: ScheduleExecutionResult = {
        triggered: true,
        cronExpression: config.cron,
        nextRun: cronResult.nextExecution,
        timezone: config.timezone || 'UTC',
        timestamp: new Date()
      }

      return {
        success: true,
        output: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Validate the schedule configuration
   */
  static validateSchedule(config: ScheduleNodeConfig): ScheduleValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate cron expression
    if (!config.cron || typeof config.cron !== 'string') {
      errors.push('Cron expression is required')
    } else {
      const cronValidation = this.validateCronExpression(config.cron.trim())
      if (!cronValidation.isValid) {
        errors.push(cronValidation.error || 'Invalid cron expression')
      }
    }

    // Validate timezone
    if (config.timezone && !this.isValidTimezone(config.timezone)) {
      errors.push(`Invalid timezone: ${config.timezone}`)
    }

    // Check if schedule is too frequent (warning)
    if (config.cron && this.isHighFrequencySchedule(config.cron)) {
      warnings.push('Schedule runs very frequently (more than once per minute). Consider if this is necessary.')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Parse a cron expression and calculate next execution time
   */
  static parseCronExpression(cron: string, timezone = 'UTC'): CronParseResult {
    try {
      // Basic cron validation
      const validation = this.validateCronExpression(cron)
      if (!validation.isValid) {
        return {
          isValid: false,
          error: validation.error
        }
      }

      // Calculate next execution time
      const nextExecution = this.calculateNextExecution(cron, timezone)
      const description = this.describeCronExpression(cron)

      return {
        isValid: true,
        nextExecution,
        description
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to parse cron expression'
      }
    }
  }

  /**
   * Validate cron expression format
   */
  private static validateCronExpression(cron: string): { isValid: boolean; error?: string } {
    if (!cron || typeof cron !== 'string') {
      return { isValid: false, error: 'Cron expression is required' }
    }

    const trimmed = cron.trim()
    const parts = trimmed.split(/\s+/)

    if (parts.length !== 5) {
      return { isValid: false, error: 'Cron expression must have exactly 5 fields (minute hour day month weekday)' }
    }

    const [minute, hour, day, month, weekday] = parts

    // Validate each field
    if (!this.validateCronField(minute, 0, 59)) {
      return { isValid: false, error: 'Invalid minute field (0-59)' }
    }
    if (!this.validateCronField(hour, 0, 23)) {
      return { isValid: false, error: 'Invalid hour field (0-23)' }
    }
    if (!this.validateCronField(day, 1, 31)) {
      return { isValid: false, error: 'Invalid day field (1-31)' }
    }
    if (!this.validateCronField(month, 1, 12)) {
      return { isValid: false, error: 'Invalid month field (1-12)' }
    }
    if (!this.validateCronField(weekday, 0, 6)) {
      return { isValid: false, error: 'Invalid weekday field (0-6)' }
    }

    return { isValid: true }
  }

  /**
   * Validate a single cron field
   */
  private static validateCronField(field: string, min: number, max: number): boolean {
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
   * Check if timezone is valid
   */
  private static isValidTimezone(timezone: string): boolean {
    try {
      // Throws if timezone is invalid
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if schedule runs more than once per minute
   */
  private static isHighFrequencySchedule(cron: string): boolean {
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) return false
    
    const [minute] = parts

    // Every minute
    if (minute === '*') return true

    // Step values (*/n) — consider <= 5 minutes as high frequency
    if (minute.startsWith('*/')) {
      const step = parseInt(minute.substring(2), 10)
      return !isNaN(step) && step > 0 && step <= 5
    }

    // Multiple specific minutes (comma-separated). Consider 2+ per hour as high frequency.
    if (minute.includes(',')) {
      const values = minute.split(',').map(v => v.trim()).filter(Boolean)
      return values.length >= 2
    }

    return false
  }

  /**
   * Calculate the next execution time for a cron expression
   * This is a simplified implementation - in production, you'd use a proper cron library
   */
  private static calculateNextExecution(cron: string, timezone: string): Date {
    // This is a simplified implementation
    // In a real application, you'd use a library like 'node-cron' or 'cron-parser'
    
    const now = new Date()
    const nextRun = new Date(now)
    
    // For now, just add an hour as a placeholder
    // In production, this would properly parse the cron expression
    nextRun.setHours(nextRun.getHours() + 1)
    
    return nextRun
  }

  /**
   * Generate a human-readable description of a cron expression
   */
  private static describeCronExpression(cron: string): string {
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) return 'Invalid cron expression'
    
    const [minute, hour, day, month, weekday] = parts
    
    // Handle some common patterns
    if (cron === '0 0 * * *') return 'Daily at midnight'
    if (cron === '0 12 * * *') return 'Daily at noon'
    if (cron === '0 0 * * 0') return 'Weekly on Sunday at midnight'
    if (cron === '0 0 1 * *') return 'Monthly on the 1st at midnight'
    if (cron === '*/5 * * * *') return 'Every 5 minutes'
    if (cron === '0 */2 * * *') return 'Every 2 hours'
    
    // Build a basic description
    let description = 'At '
    
    if (minute === '*') description += 'every minute'
    else if (minute.startsWith('*/')) description += `every ${minute.substring(2)} minutes`
    else description += `minute ${minute}`
    
    if (hour !== '*') {
      if (hour.startsWith('*/')) description += ` of every ${hour.substring(2)} hours`
      else description += ` of hour ${hour}`
    }
    
    if (day !== '*') {
      description += ` on day ${day} of the month`
    }
    
    if (month !== '*') {
      description += ` in month ${month}`
    }
    
    if (weekday !== '*') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      if (!isNaN(parseInt(weekday))) {
        description += ` on ${days[parseInt(weekday)]}`
      }
    }
    
    return description
  }
}
