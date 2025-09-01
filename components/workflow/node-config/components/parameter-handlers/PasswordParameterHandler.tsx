import { Input } from '@/components/ui/input'
import { FieldLabel } from '../shared/FieldLabel'
import { ExtendedParameterDefinition, getParamPath } from '../../utils/parameter-utils'
import { getParamValue, getParameterDescription, getParameterPlaceholder } from '../../utils/config-utils'

interface PasswordParameterHandlerProps {
  param: ExtendedParameterDefinition
  config: Record<string, unknown>
  onConfigChange: (path: string, value: unknown) => void
}

export function PasswordParameterHandler({ param, config, onConfigChange }: PasswordParameterHandlerProps) {
  const paramPath = getParamPath(param)
  const value = getParamValue(config, paramPath, 'string', param.default)
  const description = getParameterDescription(param.description)
  const placeholder = getParameterPlaceholder(param.placeholder)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange(paramPath, e.target.value)
  }

  return (
    <div key={paramPath} className="space-y-2">
      <FieldLabel text={param.label} description={description} htmlFor={paramPath} />
      <Input
        type="password"
        value={String(value)}
        onChange={handleChange}
        placeholder={placeholder || 'Enter password'}
        className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}
