import { v4 as uuidv4 } from 'uuid'
import { NodeType, TriggerType, ActionType, WorkflowEdge, WorkflowNode } from '@/types/workflow'
import { HTTP_NODE_DEFINITION } from '@/nodes/HttpNode'
import { WEBHOOK_NODE_DEFINITION } from '@/nodes/WebhookNode'
import type { WorkflowTemplate } from '@/templates/types'

const template: WorkflowTemplate = {
  key: 'webhook-to-http',
  label: 'Webhook → HTTP Request',
  description: 'Receive a webhook then call an external API',
  buildAt: ({ x, y }) => {
    const triggerId = uuidv4()
    const actionId = uuidv4()
    const trigger: WorkflowNode = {
      id: triggerId,
      type: 'trigger',
      position: { x, y },
      data: {
        label: 'Webhook',
        nodeType: NodeType.TRIGGER,
        triggerType: TriggerType.WEBHOOK,
        config: WEBHOOK_NODE_DEFINITION.getDefaults(),
      },
    }
    const action: WorkflowNode = {
      id: actionId,
      type: 'action',
      position: { x, y: y + 140 },
      data: {
        label: 'HTTP Request',
        nodeType: NodeType.ACTION,
        actionType: ActionType.HTTP,
        config: HTTP_NODE_DEFINITION.getDefaults() as unknown as Record<string, unknown>,
      },
    }
    const edges: WorkflowEdge[] = [{ id: uuidv4(), source: triggerId, target: actionId }]
    return { nodes: [trigger, action], edges }
  },
}

export default template


