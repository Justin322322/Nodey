import { v4 as uuidv4 } from 'uuid'
import { WorkflowEdge, WorkflowNode, NodeType, TriggerType, ActionType } from '@/types/workflow'
import { getDefaultConfigForNode } from '@/lib/node-definitions'

export interface WorkflowTemplate {
  key: string
  label: string
  description: string
  buildAt: (position: { x: number; y: number }) => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }
}

const webhookToHttp: WorkflowTemplate = {
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
        config: getDefaultConfigForNode(NodeType.TRIGGER, TriggerType.WEBHOOK) || {},
      },
    }
    const action: WorkflowNode = {
      id: actionId,
      type: 'action',
      position: { x: x, y: y + 140 },
      data: {
        label: 'HTTP Request',
        nodeType: NodeType.ACTION,
        actionType: ActionType.HTTP,
        config: getDefaultConfigForNode(NodeType.ACTION, ActionType.HTTP) || { method: 'GET', url: '' },
      },
    }
    const edges: WorkflowEdge[] = [{ id: uuidv4(), source: triggerId, target: actionId }]
    return { nodes: [trigger, action], edges }
  },
}

const scheduleToEmail: WorkflowTemplate = {
  key: 'schedule-to-email',
  label: 'Schedule → Send Email',
  description: 'Run on a schedule and send an email',
  buildAt: ({ x, y }) => {
    const triggerId = uuidv4()
    const actionId = uuidv4()
    const trigger: WorkflowNode = {
      id: triggerId,
      type: 'trigger',
      position: { x, y },
      data: {
        label: 'Schedule',
        nodeType: NodeType.TRIGGER,
        triggerType: TriggerType.SCHEDULE,
        config: getDefaultConfigForNode(NodeType.TRIGGER, TriggerType.SCHEDULE) || { cron: '0 0 * * *' },
      },
    }
    const action: WorkflowNode = {
      id: actionId,
      type: 'action',
      position: { x: x, y: y + 140 },
      data: {
        label: 'Send Email',
        nodeType: NodeType.ACTION,
        actionType: ActionType.EMAIL,
        config: getDefaultConfigForNode(NodeType.ACTION, ActionType.EMAIL) || { to: [], subject: '', body: '' },
      },
    }
    const edges: WorkflowEdge[] = [{ id: uuidv4(), source: triggerId, target: actionId }]
    return { nodes: [trigger, action], edges }
  },
}

export function getWorkflowTemplates(): WorkflowTemplate[] {
  return [webhookToHttp, scheduleToEmail]
}

export function buildWorkflowTemplateAt(key: string, position: { x: number; y: number }): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null {
  const tpl = getWorkflowTemplates().find((t) => t.key === key)
  if (!tpl) return null
  return tpl.buildAt(position)
}


