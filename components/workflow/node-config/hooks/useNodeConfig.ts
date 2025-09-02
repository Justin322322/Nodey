import { useEffect, useRef, useState } from 'react'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { WorkflowNode } from '@/types/workflow'

/**
 * Hook for managing node configuration state and effects
 */
export function useNodeConfig(selectedNodeId: string | null) {
  const { nodes, setSelectedNodeId, updateNode } = useWorkflowStore()
  const [isMobile, setIsMobile] = useState<boolean>(false)

  // Track whether confirm dialog was opened due to a pending delete request
  const confirmOpenedFromPendingRef = useRef<boolean>(false)

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640) // 640px is the 'sm' breakpoint
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Get the selected node
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) as WorkflowNode | undefined : undefined

  // Handle config changes
  const handleConfigChange = (path: string, value: unknown) => {
    if (!selectedNodeId) return

    const setDeep = (obj: Record<string, unknown>, p: string, v: unknown): Record<string, unknown> => {
      const parts = p.split('.')

      // Validate path segments to prevent prototype pollution
      const dangerousSegments = ['__proto__', 'constructor', 'prototype']
      for (const part of parts) {
        if (dangerousSegments.includes(part.toLowerCase())) {
          throw new Error(`Invalid path segment: "${part}" - potential prototype pollution attempt`)
        }
      }

      // Type guard to check if value is a valid object
      const isValidObject = (val: unknown): val is Record<string, unknown> => {
        return val !== null && typeof val === 'object' && !Array.isArray(val)
      }

      // Create a safe clone using Object.create(null) for the root to avoid prototype chain
      const clone = Object.create(null) as Record<string, unknown>

      // Safely copy properties from the original object
      for (const [key, val] of Object.entries(obj)) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          clone[key] = val
        }
      }

      let cur: Record<string, unknown> = clone
      for (let i = 0; i < parts.length - 1; i += 1) {
        const key = parts[i]
        const next = cur[key]
        if (!isValidObject(next)) {
          cur[key] = Object.create(null) as Record<string, unknown>
        } else {
          // Safely clone the nested object
          const nestedClone = Object.create(null) as Record<string, unknown>
          for (const [nestedKey, nestedVal] of Object.entries(next)) {
            if (Object.prototype.hasOwnProperty.call(next, nestedKey)) {
              nestedClone[nestedKey] = nestedVal
            }
          }
          cur[key] = nestedClone
        }
        cur = cur[key] as Record<string, unknown>
      }

      // Set the final value only if the key is safe
      const finalKey = parts[parts.length - 1]
      cur[finalKey] = v

      return clone
    }

    const nextConfig = setDeep((selectedNode!.data.config as Record<string, unknown>) || {}, path, value)
    updateNode(selectedNodeId, {
      config: nextConfig,
    })
  }

  return {
    selectedNode,
    isMobile,
    confirmOpenedFromPendingRef,
    handleConfigChange
  }
}
