import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldLabel } from '../shared/FieldLabel'
import { ExtendedParameterDefinition, getParamPath } from '../../utils/parameter-utils'
import { getObjectValue, getParameterDescription } from '../../utils/config-utils'
import { KvRow } from '../../hooks/useParameterState'

interface JsonParameterHandlerProps {
  param: ExtendedParameterDefinition
  config: Record<string, unknown>
  onConfigChange: (path: string, value: unknown) => void
  jsonTextByPath: Record<string, string>
  kvStateByPath: Record<string, KvRow[]>
  onJsonTextChange: (path: string, text: string) => void
  onKvStateChange: (path: string, rows: KvRow[]) => void
}

export function JsonParameterHandler({
  param,
  config,
  onConfigChange,
  jsonTextByPath,
  kvStateByPath,
  onJsonTextChange,
  onKvStateChange
}: JsonParameterHandlerProps) {
  const paramPath = getParamPath(param)
  const defaultValue = getObjectValue(config, paramPath, {})
  const description = getParameterDescription(param.description)

  // Friendly editors for headers/body
  const isHeaders = paramPath === 'headers'
  const isBody = paramPath === 'body'

  if (isHeaders || isBody) {
    const objectValue = getObjectValue<Record<string, string>>(config, paramPath, {})
    const existingKvState = kvStateByPath[paramPath]
    const initialRows = Array.isArray(existingKvState)
      ? existingKvState
      : Object.entries(objectValue).map(([k, v]) => ({ id: `${k}-${Math.random().toString(36).slice(2)}`, key: k, value: String(v) }))

    let rows = initialRows
    if (!rows || rows.length === 0) {
      rows = [{ id: 'new', key: '', value: '' }]
    }

    const setRows = (next: KvRow[]) => {
      onKvStateChange(paramPath, next)
      const obj: Record<string, string> = {}
      next.forEach((r) => {
        const k = r.key.trim()
        if (k) obj[k] = r.value
      })
      onConfigChange(paramPath, obj)
    }

    const addRow = () => setRows([...(rows || []), { id: Math.random().toString(36).slice(2), key: '', value: '' }])
    const removeRow = (id: string) => setRows((rows || []).filter((r) => r.id !== id))
    const updateRow = (id: string, patch: Partial<KvRow>) => setRows((rows || []).map((r) => (r.id === id ? { ...r, ...patch } : r)))

    const previewObj: Record<string, string> = {}
    ;(rows || []).forEach((r) => {
      const k = r.key.trim()
      if (k) previewObj[k] = r.value
    })

    const copyToClipboard = async () => {
      const textToCopy = JSON.stringify(previewObj, null, 2)
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(textToCopy)
        } else {
          const textarea = document.createElement('textarea')
          textarea.value = textToCopy
          textarea.style.position = 'fixed'
          textarea.style.left = '-999999px'
          textarea.style.top = '-999999px'
          document.body.appendChild(textarea)
          textarea.focus()
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
      } catch (err) {
        console.error('Copy failed:', err)
      }
    }

    return (
      <div key={paramPath} className="space-y-1.5 sm:space-y-2">
        <FieldLabel text={param.label} description={description} />
        <div className="space-y-2">
          {(rows || []).map((row) => (
            <div key={row.id} className="flex gap-2">
              <input
                type="text"
                placeholder={isHeaders ? 'Header name' : 'Field name'}
                value={row.key}
                onChange={(e) => updateRow(row.id, { key: e.target.value })}
                className="flex-1 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder={isHeaders ? 'Header value' : 'Field value'}
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: e.target.value })}
                className="flex-1 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                className="inline-flex items-center justify-center px-2 text-gray-500 hover:text-gray-700"
                onClick={() => removeRow(row.id)}
                aria-label="Remove"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              Add {isHeaders ? 'Header' : 'Field'}
            </Button>
          </div>
          <div className="pt-1">
            <FieldLabel text="JSON preview" />
            <div className="relative">
              <pre className="w-full p-2 border rounded-md text-xs font-mono bg-gray-50 text-gray-800 border-gray-200 overflow-x-auto">
                {JSON.stringify(previewObj, null, 2)}
              </pre>
              <button
                type="button"
                className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                onClick={copyToClipboard}
                aria-label="Copy JSON"
                title="Copy JSON"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const existingJsonText = jsonTextByPath[paramPath]
  const displayText = typeof existingJsonText === 'string'
    ? existingJsonText
    : JSON.stringify(defaultValue, null, 2)

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    onJsonTextChange(paramPath, text)
    try {
      const parsed = JSON.parse(text) as unknown
      onConfigChange(paramPath, parsed)
    } catch {
      // Keep editing buffer until valid
    }
  }

  return (
    <div key={paramPath} className="space-y-1.5 sm:space-y-2">
      <FieldLabel text={param.label} description={description} />
      <textarea
        className="w-full p-2 border rounded-md text-sm font-mono bg-white text-gray-900 border-gray-300"
        rows={6}
        value={displayText}
        onChange={handleJsonChange}
        placeholder={description || '{}'}
      />
    </div>
  )
}
