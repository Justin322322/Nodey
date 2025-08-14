import { v4 as uuidv4 } from 'uuid'
import { NodeType, TriggerType, ActionType, WorkflowEdge, WorkflowNode } from '@/types/workflow'
import { getDefaultConfigForNode } from '@/lib/node-definitions'
import type { WorkflowTemplate } from '@/templates/types'

const template: WorkflowTemplate = {
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
      position: { x, y: y + 140 },
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

export default template


