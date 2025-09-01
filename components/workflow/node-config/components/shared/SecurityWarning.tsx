import { ShieldCheck } from 'lucide-react'
import { NodeType, ActionType } from '@/types/workflow'
import { WorkflowNode } from '@/types/workflow'

interface SecurityWarningProps {
  node: WorkflowNode
}

export function SecurityWarning({ node }: SecurityWarningProps) {
  // Only show for Email Action nodes
  if (node.data.nodeType !== NodeType.ACTION ||
      (node.data as { actionType: ActionType }).actionType !== ActionType.EMAIL) {
    return null
  }

  return (
    <div className="mb-4 p-3 border border-gray-300 rounded-md">
      <div className="flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-gray-700">
          <p className="font-medium mb-1">Security Notice</p>
          <ul className="space-y-1 text-xs">
            <li>• Your credentials are encrypted and stored locally on your device only</li>
            <li>• Use app-specific passwords instead of your main email password</li>
            <li>• Data is automatically cleared when you close the browser</li>
            <li>• Only use on trusted devices for maximum security</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
