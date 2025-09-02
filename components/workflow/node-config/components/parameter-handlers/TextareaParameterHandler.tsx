import { FieldLabel } from '../shared/FieldLabel'
import { ExtendedParameterDefinition, getParamPath } from '../../utils/parameter-utils'
import { getParamValue, getParameterDescription } from '../../utils/config-utils'

interface TextareaParameterHandlerProps {
  param: ExtendedParameterDefinition
  config: Record<string, unknown>
  onConfigChange: (path: string, value: unknown) => void
}

export function TextareaParameterHandler({ param, config, onConfigChange }: TextareaParameterHandlerProps) {
  const paramPath = getParamPath(param)
  const value = getParamValue(config, paramPath, 'string', param.default)
  const description = getParameterDescription(param.description)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onConfigChange(paramPath, e.target.value)
  }

  return (
    <div key={paramPath} className="space-y-2">
      <FieldLabel text={param.label} description={description} htmlFor={paramPath} />
      <textarea
        className="w-full p-3 border rounded-md bg-white text-gray-900 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
        rows={4}
        value={String(value)}
        onChange={handleChange}
        placeholder={description}
      />
    </div>
  )
}
