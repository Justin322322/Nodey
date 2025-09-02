import { FieldLabel } from '../shared/FieldLabel'
import { ExtendedParameterDefinition, getParamPath } from '../../utils/parameter-utils'
import { getParamValue, getParameterDescription } from '../../utils/config-utils'

interface BooleanParameterHandlerProps {
  param: ExtendedParameterDefinition
  config: Record<string, unknown>
  onConfigChange: (path: string, value: unknown) => void
}

export function BooleanParameterHandler({ param, config, onConfigChange }: BooleanParameterHandlerProps) {
  const paramPath = getParamPath(param)
  const value = getParamValue(config, paramPath, 'boolean', param.default)
  const description = getParameterDescription(param.description)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange(paramPath, e.target.checked)
  }

  return (
    <div key={paramPath} className="space-y-2">
      <FieldLabel text={param.label} description={description} />
      <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-gray-300 hover:border-gray-400">
        <input
          id={paramPath}
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          checked={Boolean(value)}
          onChange={handleChange}
        />
        <FieldLabel
          text={value ? 'Enabled' : 'Disabled'}
          htmlFor={paramPath}
          description={description}
        />
      </div>
    </div>
  )
}
