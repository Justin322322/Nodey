import { Input } from '@/components/ui/input'
import { FieldLabel } from '../shared/FieldLabel'
import { ExtendedParameterDefinition, getParamPath } from '../../utils/parameter-utils'
import { getArrayValue, getParameterDescription } from '../../utils/config-utils'

interface StringListParameterHandlerProps {
  param: ExtendedParameterDefinition
  config: Record<string, unknown>
  onConfigChange: (path: string, value: unknown) => void
}

export function StringListParameterHandler({ param, config, onConfigChange }: StringListParameterHandlerProps) {
  const paramPath = getParamPath(param)
  const arrayValue = getArrayValue<string>(config, paramPath, [])
  const description = getParameterDescription(param.description)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const items = value.split(',').map(s => s.trim()).filter(Boolean)
    onConfigChange(paramPath, items)
  }

  return (
    <div key={paramPath} className="space-y-2">
      <FieldLabel text={param.label} description={description} htmlFor={paramPath} />
      <Input
        value={arrayValue.map(String).join(', ')}
        onChange={handleChange}
        placeholder={description || 'first@email.com, next@email.com'}
        className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}
