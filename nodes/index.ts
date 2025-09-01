// Central node registry and exports
import { NodeType } from '../types/workflow'
import { CredentialType } from '../types/credentials'
import type { NodeExecutionContext, NodeExecutionResult } from './types'

// Import all nodes
export * from './EmailNode'
export * from './EmailTriggerNode'
export * from './HttpNode'
export * from './ScheduleNode'
export * from './WebhookNode'
export * from './ManualNode'
export * from './IfNode'
export * from './FilterNode'
export * from './DatabaseNode'
export * from './TransformNode'
export * from './DelayNode'

// Base interfaces for all nodes
export type { NodeExecutionContext, NodeExecutionResult } from './types'

// Discriminated union to require exactly one of 'path' or 'name'
export type ParameterAddress = 
  | { path: string; name?: never }
  | { name: string; path?: never }

// Discriminated union for showIf conditions to require exactly one of 'path' or 'name'
export type ShowIfCondition = 
  | { path: string; name?: never; equals: string | number | boolean }
  | { name: string; path?: never; equals: string | number | boolean }

export type ParameterDefinition = ParameterAddress & {
  label: string
  type: 'string' | 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'email' | 'url' | 'json' | 'password' | 'credential' | 'stringList'
  required?: boolean
  // Default value for this parameter
  default?: unknown
  // Legacy support for defaultValue
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }> | (() => Array<{ label: string; value: string }>)
  placeholder?: string
  description?: string
  showIf?: ShowIfCondition[]
  // For credential type parameters
  credentialType?: CredentialType
}

import type { ReactNode } from 'react'

export interface NodeDefinition<TConfig = Record<string, unknown>> {
  // Metadata
  nodeType: NodeType
  subType: string | number  // Allow both string and enum values
  label: string
  description: string
  
  // UI Configuration
  icon?: ReactNode
  color?: string
  
  // Parameter Schema
  parameters: ParameterDefinition[]
  
  // Validation
  validate: (config: Record<string, unknown>) => string[]
  
  // Defaults
  getDefaults: () => TConfig
  
  // Execution
  executeNode?: (context: NodeExecutionContext) => Promise<NodeExecutionResult>
  
  // Runtime Environment
  serverSideOnly?: boolean
}

// Node registry for dynamic discovery
export const NODE_REGISTRY: Map<string, NodeDefinition> = new Map()

// Runtime validation helpers
function validateParameterAddress(param: ParameterDefinition, paramIndex: number): void {
  const hasPath = 'path' in param && param.path !== undefined && param.path !== null
  const hasName = 'name' in param && param.name !== undefined && param.name !== null
  
  if (!hasPath && !hasName) {
    throw new Error(`Parameter at index ${paramIndex} must have either 'path' or 'name' defined, but has neither`)
  }
  
  if (hasPath && hasName) {
    throw new Error(`Parameter at index ${paramIndex} cannot have both 'path' and 'name' defined, must have exactly one`)
  }
}

function validateShowIfCondition(condition: ShowIfCondition, paramIndex: number, conditionIndex: number): void {
  const hasPath = 'path' in condition && condition.path !== undefined && condition.path !== null
  const hasName = 'name' in condition && condition.name !== undefined && condition.name !== null
  
  if (!hasPath && !hasName) {
    throw new Error(`ShowIf condition at index ${conditionIndex} for parameter at index ${paramIndex} must have either 'path' or 'name' defined, but has neither`)
  }
  
  if (hasPath && hasName) {
    throw new Error(`ShowIf condition at index ${conditionIndex} for parameter at index ${paramIndex} cannot have both 'path' and 'name' defined, must have exactly one`)
  }
}

// Utility functions for node registry management
export function registerNode(definition: NodeDefinition): void {
  const key = `${definition.nodeType}-${definition.subType}`
  
  // Runtime validation of parameter definitions
  definition.parameters.forEach((param, paramIndex) => {
    validateParameterAddress(param, paramIndex)
    
    // Validate showIf conditions if present
    if (param.showIf) {
      param.showIf.forEach((condition, conditionIndex) => {
        validateShowIfCondition(condition, paramIndex, conditionIndex)
      })
    }
  })
  
  if (NODE_REGISTRY.has(key)) {
    console.warn(`Warning: Overwriting existing node definition for key "${key}"`)
  }
  NODE_REGISTRY.set(key, definition)
}

export function getNodeDefinition(nodeType: NodeType, subType: string): NodeDefinition | undefined {
  const key = `${nodeType}-${subType}`
  return NODE_REGISTRY.get(key)
}

export function getAllNodeDefinitions(): NodeDefinition[] {
  return Array.from(NODE_REGISTRY.values())
}

export function getNodesByType(nodeType: NodeType): NodeDefinition[] {
  return Array.from(NODE_REGISTRY.values()).filter(def => def.nodeType === nodeType)
}

export function isNodeRegistered(nodeType: NodeType, subType: string | number): boolean {
  const key = `${nodeType}-${subType}`
  return NODE_REGISTRY.has(key)
}

export function unregisterNode(nodeType: NodeType, subType: string | number): boolean {
  const key = `${nodeType}-${subType}`
  return NODE_REGISTRY.delete(key)
}

export function clearRegistry(): void {
  NODE_REGISTRY.clear()
}

// Helper function to generate registry key
export function getRegistryKey(nodeType: NodeType, subType: string | number): string {
  return `${nodeType}-${subType}`
}

// Auto-register nodes
import { EMAIL_NODE_DEFINITION } from './EmailNode'
import { EMAIL_TRIGGER_NODE_DEFINITION } from './EmailTriggerNode'
import { HTTP_NODE_DEFINITION } from './HttpNode'
import { SCHEDULE_NODE_DEFINITION } from './ScheduleNode'
import { WEBHOOK_NODE_DEFINITION } from './WebhookNode'
import { MANUAL_NODE_DEFINITION } from './ManualNode'
import { IF_NODE_DEFINITION } from './IfNode'
import { FILTER_NODE_DEFINITION } from './FilterNode'
import { DATABASE_NODE_DEFINITION } from './DatabaseNode'
import { TRANSFORM_NODE_DEFINITION } from './TransformNode'
import { DELAY_NODE_DEFINITION } from './DelayNode'

// Register all nodes on module load
registerNode(EMAIL_NODE_DEFINITION)
registerNode(EMAIL_TRIGGER_NODE_DEFINITION)
registerNode(HTTP_NODE_DEFINITION)
registerNode(SCHEDULE_NODE_DEFINITION)
registerNode(WEBHOOK_NODE_DEFINITION)
registerNode(MANUAL_NODE_DEFINITION)
registerNode(IF_NODE_DEFINITION)
registerNode(FILTER_NODE_DEFINITION)
registerNode(DATABASE_NODE_DEFINITION)
registerNode(TRANSFORM_NODE_DEFINITION)
registerNode(DELAY_NODE_DEFINITION)

// Export types for external use
export type { NodeType } from '../types/workflow'