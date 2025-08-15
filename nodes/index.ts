// Central node registry and exports
import { NodeType } from '@/types/workflow'

// Import all nodes
export * from './EmailNode'

// Base interfaces for all nodes
export interface NodeExecutionContext {
  nodeId: string
  config: Record<string, unknown>
  previousOutput?: unknown
  signal?: AbortSignal
}

export interface NodeExecutionResult {
  success: boolean
  output?: unknown
  error?: string
}

export interface ParameterDefinition {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'email' | 'url'
  required?: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  description?: string
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
  validate: (config: TConfig) => string[]
  
  // Defaults
  getDefaults: () => TConfig
  
  // Execution
  executeNode?: (context: NodeExecutionContext) => Promise<NodeExecutionResult>
}

// Node registry for dynamic discovery
export const NODE_REGISTRY: Map<string, NodeDefinition> = new Map()

// Utility functions for node registry management
export function registerNode(definition: NodeDefinition): void {
  const key = `${definition.nodeType}-${definition.subType}`
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
// Note: EMAIL and HTTP nodes are handled via fallback in lib/node-definitions.ts
// import { EMAIL_NODE_DEFINITION } from './EmailNode'
// import { HTTP_NODE_DEFINITION } from './HttpNode'

// Register all nodes on module load
// registerNode(EMAIL_NODE_DEFINITION)
// registerNode(HTTP_NODE_DEFINITION)

// Export types for external use
export type { NodeType } from '@/types/workflow'