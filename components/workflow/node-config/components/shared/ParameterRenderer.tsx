import { ExtendedParameterDefinition, isValidParameter, shouldShowParameter } from '../../utils/parameter-utils'
import { SelectParameterHandler } from '../parameter-handlers/SelectParameterHandler'
import { TextParameterHandler } from '../parameter-handlers/TextParameterHandler'
import { TextareaParameterHandler } from '../parameter-handlers/TextareaParameterHandler'
import { BooleanParameterHandler } from '../parameter-handlers/BooleanParameterHandler'
import { JsonParameterHandler } from '../parameter-handlers/JsonParameterHandler'
import { NumberParameterHandler } from '../parameter-handlers/NumberParameterHandler'
import { EmailParameterHandler } from '../parameter-handlers/EmailParameterHandler'
import { PasswordParameterHandler } from '../parameter-handlers/PasswordParameterHandler'
import { UrlParameterHandler } from '../parameter-handlers/UrlParameterHandler'
import { CredentialParameterHandler } from '../parameter-handlers/CredentialParameterHandler'
import { StringListParameterHandler } from '../parameter-handlers/StringListParameterHandler'
import { KvRow } from '../../hooks/useParameterState'

interface ParameterRendererProps {
  parameters: unknown[]
  config: Record<string, unknown>
  onConfigChange: (path: string, value: unknown) => void
  jsonTextByPath?: Record<string, string>
  kvStateByPath?: Record<string, KvRow[]>
  onJsonTextChange?: (path: string, text: string) => void
  onKvStateChange?: (path: string, rows: KvRow[]) => void
}

export function ParameterRenderer({
  parameters,
  config,
  onConfigChange,
  jsonTextByPath = {},
  kvStateByPath = {},
  onJsonTextChange = () => {},
  onKvStateChange = () => {}
}: ParameterRendererProps) {
  const validParameters = parameters.filter(isValidParameter) as ExtendedParameterDefinition[]

  return (
    <>
      {validParameters.map((param) => {
        if (!shouldShowParameter(param, config)) return null

        switch (param.type) {
          case 'select':
            return (
              <SelectParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          case 'string':
          case 'text':
            return (
              <TextParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          case 'textarea':
            return (
              <TextareaParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          case 'boolean':
            return (
              <BooleanParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          case 'json':
            return (
              <JsonParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
                jsonTextByPath={jsonTextByPath}
                kvStateByPath={kvStateByPath}
                onJsonTextChange={onJsonTextChange}
                onKvStateChange={onKvStateChange}
              />
            )
          case 'number':
            return (
              <NumberParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          case 'email':
            return (
              <EmailParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          case 'password':
            return (
              <PasswordParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          case 'url':
            return (
              <UrlParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          case 'credential':
            return (
              <CredentialParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          case 'stringList':
            return (
              <StringListParameterHandler
                key={param.path || param.name}
                param={param}
                config={config}
                onConfigChange={onConfigChange}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
