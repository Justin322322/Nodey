/**
 * Helper utilities for identifying and migrating legacy configurations
 * This can be used by administrators or users to check for and migrate legacy data
 */

import { Workflow, WorkflowNode, ActionType } from '@/types/workflow'
import { DatabaseNodeConfig } from '@/nodes/DatabaseNode/DatabaseNode.types'
import { DelayNodeConfig } from '@/nodes/DelayNode/DelayNode.types'
import { needsDatabaseMigration, needsDelayMigration, migrateWorkflowNode } from './migration-utils'

export interface LegacyConfigReport {
  workflowId: string
  workflowName: string
  nodeId: string
  nodeLabel: string
  configType: 'database' | 'delay' | 'email' | 'other'
  issue: string
  canAutoMigrate: boolean
}

/**
 * Scan a workflow for legacy configurations that need migration
 */
export function scanWorkflowForLegacyConfigs(workflow: Workflow): LegacyConfigReport[] {
  const issues: LegacyConfigReport[] = []
  
  workflow.nodes.forEach(node => {
    const report = scanNodeForLegacyConfigs(workflow.id, workflow.name, node)
    if (report) {
      issues.push(report)
    }
  })
  
  return issues
}

/**
 * Scan a single node for legacy configuration issues
 */
function scanNodeForLegacyConfigs(workflowId: string, workflowName: string, node: WorkflowNode): LegacyConfigReport | null {
  if (node.data.nodeType !== 'action') {
    return null
  }
  
  const actionNode = node.data as { actionType: ActionType; config: Record<string, unknown> }
  
  switch (actionNode.actionType) {
    case ActionType.DATABASE: {
      const config = actionNode.config as DatabaseNodeConfig & Record<string, unknown>
      
      if (needsDatabaseMigration(config)) {
        return {
          workflowId,
          workflowName,
          nodeId: node.id,
          nodeLabel: node.data.label || 'Database Node',
          configType: 'database',
          issue: 'Uses legacy connectionString instead of secure credential reference',
          canAutoMigrate: true
        }
      }
      
      // Check for legacy connectionString that should be cleaned up
      if (config.credentialId && config.connectionString) {
        return {
          workflowId,
          workflowName,
          nodeId: node.id,
          nodeLabel: node.data.label || 'Database Node',
          configType: 'database',
          issue: 'Contains both credentialId and legacy connectionString fields',
          canAutoMigrate: true
        }
      }
      break
    }
    
    case ActionType.DELAY: {
      const config = actionNode.config as DelayNodeConfig & Record<string, unknown>
      
      // Check for legacy delayMs config (inline check to avoid ESLint issues)
      const hasValueAndUnit = typeof config.value === 'number' && config.unit
      const hasLegacyDelayMs = typeof config.delayMs === 'number'
      
      // Needs migration if it has delayMs but missing value/unit
      if (hasLegacyDelayMs && !hasValueAndUnit) {
        return {
          workflowId,
          workflowName,
          nodeId: node.id,
          nodeLabel: node.data.label || 'Delay Node',
          configType: 'delay',
          issue: 'Uses legacy delayMs instead of value+unit pattern',
          canAutoMigrate: true
        }
      }
      
      // Check for legacy delayMs that should be cleaned up
      if (hasValueAndUnit && hasLegacyDelayMs) {
        return {
          workflowId,
          workflowName,
          nodeId: node.id,
          nodeLabel: node.data.label || 'Delay Node',
          configType: 'delay',
          issue: 'Contains both value+unit and legacy delayMs fields',
          canAutoMigrate: true
        }
      }
      break
    }
    
    case ActionType.EMAIL: {
      // Add email legacy config checks here if needed
      break
    }
    
    // Add other action types as needed
  }
  
  return null
}

/**
 * Automatically migrate a workflow's legacy configurations
 */
export function migrateWorkflowLegacyConfigs(workflow: Workflow): {
  migratedWorkflow: Workflow
  migrationsApplied: number
  errors: string[]
} {
  const errors: string[] = []
  let migrationsApplied = 0
  let migratedNodes: WorkflowNode[] = workflow.nodes
  
  try {
    migratedNodes = workflow.nodes.map(node => {
      const originalNode = node
      const migratedNode = migrateWorkflowNode(node)
      
      if (migratedNode !== originalNode) {
        migrationsApplied++
        console.log(`Migrated node ${node.id} (${node.data.label || 'Unnamed'})`)
      }
      
      return migratedNode
    })
    
    const migratedWorkflow: Workflow = {
      ...workflow,
      nodes: migratedNodes,
      updatedAt: new Date()
    }
    
    return {
      migratedWorkflow,
      migrationsApplied,
      errors
    }
  } catch (error) {
    errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      migratedWorkflow: {
        ...workflow,
        nodes: migratedNodes,
        updatedAt: migrationsApplied > 0 ? new Date() : workflow.updatedAt
      },
      migrationsApplied,
      errors
    }
  }
}

/**
 * Generate a migration report for multiple workflows
 */
export function generateMigrationReport(workflows: Workflow[]): {
  totalWorkflows: number
  workflowsWithIssues: number
  totalIssues: number
  issuesByType: Record<string, number>
  canAutoMigrateAll: boolean
  report: LegacyConfigReport[]
} {
  const allIssues: LegacyConfigReport[] = []
  const issuesByType: Record<string, number> = {}
  
  workflows.forEach(workflow => {
    const workflowIssues = scanWorkflowForLegacyConfigs(workflow)
    allIssues.push(...workflowIssues)
  })
  
  // Count issues by type
  allIssues.forEach(issue => {
    issuesByType[issue.configType] = (issuesByType[issue.configType] || 0) + 1
  })
  
  const workflowsWithIssues = new Set(allIssues.map(i => i.workflowId)).size
  const canAutoMigrateAll = allIssues.every(issue => issue.canAutoMigrate)
  
  return {
    totalWorkflows: workflows.length,
    workflowsWithIssues,
    totalIssues: allIssues.length,
    issuesByType,
    canAutoMigrateAll,
    report: allIssues
  }
}

/**
 * Display migration report in a readable format
 */
export function formatMigrationReport(report: ReturnType<typeof generateMigrationReport>): string {
  const lines: string[] = []
  
  lines.push('=== Legacy Configuration Migration Report ===')
  lines.push(`Total workflows scanned: ${report.totalWorkflows}`)
  lines.push(`Workflows with issues: ${report.workflowsWithIssues}`)
  lines.push(`Total issues found: ${report.totalIssues}`)
  lines.push('')
  
  if (report.totalIssues === 0) {
    lines.push('No legacy configurations found. All workflows are up to date!')
    return lines.join('\n')
  }
  
  lines.push('Issues by type:')
  Object.entries(report.issuesByType).forEach(([type, count]) => {
    lines.push(`  - ${type}: ${count} issue(s)`)
  })
  lines.push('')
  
  if (report.canAutoMigrateAll) {
    lines.push('All issues can be automatically migrated.')
  } else {
    lines.push('Some issues require manual intervention.')
  }
  lines.push('')
  
  lines.push('Detailed issues:')
  report.report.forEach((issue, index) => {
    lines.push(`${index + 1}. ${issue.workflowName} > ${issue.nodeLabel}`)
    lines.push(`   Issue: ${issue.issue}`)
    lines.push(`   Auto-migrate: ${issue.canAutoMigrate ? 'Yes' : 'No'}`)
    lines.push('')
  })
  
  return lines.join('\n')
}

/**
 * Get deprecation warnings for direct storage patterns
 */
export function getDeprecationWarnings(): string[] {
  return [
    'DEPRECATED: Direct connectionString storage in database node configurations',
    'Use credentialId references to secure credential store instead',
    'Legacy connectionString values are automatically migrated on workflow load',
    'Update your workflows to use the new credential management system'
  ]
}
