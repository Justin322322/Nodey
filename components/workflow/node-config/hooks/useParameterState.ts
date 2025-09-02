import { useState, useCallback } from 'react'

export interface KvRow {
  id: string
  key: string
  value: string
}

/**
 * Hook for managing JSON editor state and key-value pair state
 */
export function useParameterState() {
  const [jsonTextByPath, setJsonTextByPath] = useState<Record<string, string>>({})
  const [kvStateByPath, setKvStateByPath] = useState<Record<string, KvRow[]>>({})

  const updateJsonText = useCallback((path: string, text: string) => {
    setJsonTextByPath(prev => ({ ...prev, [path]: text }))
  }, [])

  const updateKvState = useCallback((path: string, rows: KvRow[]) => {
    setKvStateByPath(prev => ({ ...prev, [path]: rows }))
  }, [])

  const resetStates = useCallback(() => {
    setJsonTextByPath({})
    setKvStateByPath({})
  }, [])

  return {
    jsonTextByPath,
    kvStateByPath,
    updateJsonText,
    updateKvState,
    resetStates
  }
}
