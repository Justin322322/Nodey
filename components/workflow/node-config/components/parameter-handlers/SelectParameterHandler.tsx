import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldLabel } from '../shared/FieldLabel'
import { ExtendedParameterDefinition, getParamPath } from '../../utils/parameter-utils'
import { getParamValue, getParameterDescription, getParameterDefault } from '../../utils/config-utils'
import { getValueAtPath } from '../../utils/parameter-utils'

interface SelectParameterHandlerProps {
  param: ExtendedParameterDefinition
  config: Record<string, unknown>
  onConfigChange: (path: string, value: unknown) => void
}

export function SelectParameterHandler({ param, config, onConfigChange }: SelectParameterHandlerProps) {
  const paramPath = getParamPath(param)
  const currentValue = getValueAtPath(config, paramPath)
  const defaultVal = getParameterDefault(param.default, 'string')
  const value = typeof currentValue === 'string' ? currentValue : String(defaultVal || '')
  const description = getParameterDescription(param.description)

  const handleValueChange = (newValue: string) => {
    onConfigChange(paramPath, newValue)
  }

  return (
    <div key={paramPath} className="space-y-2">
      <FieldLabel text={param.label} description={description} />
      <Select
        value={value}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="bg-white text-gray-900 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(typeof param.options === 'function' ? param.options() : param.options || []).map((opt: { label: string; value: string }) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
