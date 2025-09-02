import { CredentialSelector } from '@/components/ui/credential-selector'
import { FieldLabel } from '../shared/FieldLabel'
import { ExtendedParameterDefinition, getParamPath } from '../../utils/parameter-utils'
import { getParamValue, getParameterDescription, getParameterPlaceholder } from '../../utils/config-utils'
import { toCredentialType } from '@/types/credentials'

interface CredentialParameterHandlerProps {
  param: ExtendedParameterDefinition
  config: Record<string, unknown>
  onConfigChange: (path: string, value: unknown) => void
}

export function CredentialParameterHandler({ param, config, onConfigChange }: CredentialParameterHandlerProps) {
  const paramPath = getParamPath(param)
  const value = getParamValue(config, paramPath, 'string', param.default)
  const description = getParameterDescription(param.description)
  const placeholder = getParameterPlaceholder(param.placeholder)
  const credentialType = toCredentialType(param.credentialType)

  const handleChange = (credentialId: string) => {
    onConfigChange(paramPath, credentialId)
  }

  return (
    <div key={paramPath} className="space-y-1.5 sm:space-y-2">
      
      <FieldLabel text={param.label} description={description} />
      <CredentialSelector
        value={String(value)}
        onChange={handleChange}
        credentialType={credentialType}
        placeholder={placeholder || 'Select a credential'}
        className="w-full"
      />
    </div>
  )
}
