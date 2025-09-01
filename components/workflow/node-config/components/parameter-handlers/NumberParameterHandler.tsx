import { Input } from '@/components/ui/input'
import { FieldLabel } from '../shared/FieldLabel'
import { ExtendedParameterDefinition, getParamPath } from '../../utils/parameter-utils'
import { getParamValue, getParameterDescription } from '../../utils/config-utils'

interface NumberParameterHandlerProps {
  param: ExtendedParameterDefinition
  config: Record<string, unknown>
  onConfigChange: (path: string, value: unknown) => void
}

export function NumberParameterHandler({ param, config, onConfigChange }: NumberParameterHandlerProps) {
  const paramPath = getParamPath(param)
  const value = getParamValue(config, paramPath, 'number', param.default)
  const description = getParameterDescription(param.description)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = Number(e.target.value || 0)
    onConfigChange(paramPath, numValue)
  }

  return (
    <div key={paramPath} className="space-y-2">
      <FieldLabel text={param.label} description={description} htmlFor={paramPath} />
      <Input
        type="number"
        value={value === 0 ? '' : String(value)}
        onChange={handleChange}
        placeholder={description}
        className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}
