export async function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export function parseCronExpression(cron: string): string {
  // Basic validation of cron expression
  const cronParts = cron.split(' ')
  if (cronParts.length !== 5) {
    throw new Error('Invalid cron expression. Expected 5 parts: minute hour day month weekday')
  }
  
  // Return human-readable description (simplified)
  const [minute, hour, day, month, weekday] = cronParts
  
  if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return 'Every minute'
  }
  
  if (minute === '0' && hour === '0' && day === '*' && month === '*' && weekday === '*') {
    return 'Daily at midnight'
  }
  
  if (minute === '0' && hour === '9' && day === '*' && month === '*' && weekday === '1-5') {
    return 'Weekdays at 9 AM'
  }
  
  if (minute.startsWith('*/')) {
    const interval = minute.substring(2)
    return `Every ${interval} minutes`
  }
  
  return `Custom schedule: ${cron}`
}

export function getNextRunTime(cron: string): Date {
  // Simplified next run time calculation
  // In a real implementation, use a library like node-cron or cron-parser
  const now = new Date()
  const [minute] = cron.split(' ')
  
  if (minute.startsWith('*/')) {
    const interval = parseInt(minute.substring(2))
    const nextMinute = Math.ceil(now.getMinutes() / interval) * interval
    const nextRun = new Date(now)
    nextRun.setMinutes(nextMinute)
    nextRun.setSeconds(0)
    nextRun.setMilliseconds(0)
    
    if (nextRun <= now) {
      nextRun.setMinutes(nextRun.getMinutes() + interval)
    }
    
    return nextRun
  }
  
  // Default to next hour for other patterns
  const nextRun = new Date(now)
  nextRun.setHours(now.getHours() + 1)
  nextRun.setMinutes(0)
  nextRun.setSeconds(0)
  nextRun.setMilliseconds(0)
  
  return nextRun
}
