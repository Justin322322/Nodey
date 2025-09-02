import { Info } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface FieldLabelProps {
  text: string
  description?: string
  htmlFor?: string
}

export function FieldLabel({ text, description, htmlFor }: FieldLabelProps) {
  return (
    <div className="inline-flex items-center gap-1">
      <Label htmlFor={htmlFor}>{text}</Label>
      {description ? (
        <button
          type="button"
          className="inline-flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          title={description}
          aria-label="Info"
          tabIndex={-1}
        >
          <Info className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  )
}
