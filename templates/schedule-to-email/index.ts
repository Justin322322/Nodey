import { v4 as uuidv4 } from 'uuid'
import { NodeType, TriggerType, ActionType, WorkflowEdge, WorkflowNode } from '@/types/workflow'
// All node defaults are now imported directly from node modules
import { EMAIL_NODE_DEFINITION } from '@/nodes/EmailNode'
import { SCHEDULE_NODE_DEFINITION } from '@/nodes/ScheduleNode'
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
        config: SCHEDULE_NODE_DEFINITION.getDefaults(),
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
        config: EMAIL_NODE_DEFINITION.getDefaults(),
      },
    }
    const edges: WorkflowEdge[] = [{ id: uuidv4(), source: triggerId, target: actionId }]
    return { nodes: [trigger, action], edges }
  },
}

export default template


