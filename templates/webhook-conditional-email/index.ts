import { v4 as uuidv4 } from 'uuid'
import { NodeType, TriggerType, ActionType, LogicType, WorkflowEdge, WorkflowNode } from '@/types/workflow'
import { WEBHOOK_NODE_DEFINITION } from '@/nodes/WebhookNode'
import { IF_NODE_DEFINITION } from '@/nodes/IfNode'
import { EMAIL_NODE_DEFINITION } from '@/nodes/EmailNode'
import type { WorkflowTemplate } from '@/templates/types'

const template: WorkflowTemplate = {
  key: 'webhook-conditional-email',
  label: 'Webhook → If Priority → Email',
  description: 'Receive webhook and send email only for high priority items',
  buildAt: ({ x, y }) => {
    const webhookId = uuidv4()
    const ifId = uuidv4()
    const emailId = uuidv4()
    
    const webhook: WorkflowNode = {
      id: webhookId,
      type: 'trigger',
      position: { x, y },
      data: {
        label: 'Webhook',
        nodeType: NodeType.TRIGGER,
        triggerType: TriggerType.WEBHOOK,
        config: WEBHOOK_NODE_DEFINITION.getDefaults(),
      },
    }
    
    const ifNode: WorkflowNode = {
      id: ifId,
      type: 'logic',
      position: { x, y: y + 140 },
      data: {
        label: 'Check Priority',
        nodeType: NodeType.LOGIC,
        logicType: LogicType.IF,
        config: {
          condition: {
            field: 'priority',
            operator: 'equals',
            value: 'high'
          }
        },
      },
    }
    
    const email: WorkflowNode = {
      id: emailId,
      type: 'action',
      position: { x, y: y + 280 },
      data: {
        label: 'Send Alert Email',
        nodeType: NodeType.ACTION,
        actionType: ActionType.EMAIL,
        config: {
          ...EMAIL_NODE_DEFINITION.getDefaults(),
          to: ['admin@example.com'],
          subject: 'High Priority Alert',
          body: 'A high priority item was received via webhook.'
        },
      },
    }
    
    const edges: WorkflowEdge[] = [
      { id: uuidv4(), source: webhookId, target: ifId },
      { id: uuidv4(), source: ifId, target: emailId, sourceHandle: 'true' } // Only follow true branch
    ]
    
    return { nodes: [webhook, ifNode, email], edges }
  },
}

export default template
