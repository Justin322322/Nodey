import { v4 as uuidv4 } from 'uuid'
import { NodeType, TriggerType, ActionType, LogicType, WorkflowEdge, WorkflowNode } from '@/types/workflow'
import { SCHEDULE_NODE_DEFINITION } from '@/nodes/ScheduleNode'
import { FILTER_NODE_DEFINITION } from '@/nodes/FilterNode'
import { EMAIL_NODE_DEFINITION } from '@/nodes/EmailNode'
import type { WorkflowTemplate } from '@/templates/types'

const template: WorkflowTemplate = {
  key: 'schedule-filter-email',
  label: 'Schedule → Filter Active → Email',
  description: 'Run on schedule, filter active items, and email results',
  buildAt: ({ x, y }) => {
    const scheduleId = uuidv4()
    const filterId = uuidv4()
    const emailId = uuidv4()
    
    const schedule: WorkflowNode = {
      id: scheduleId,
      type: 'trigger',
      position: { x, y },
      data: {
        label: 'Daily Report',
        nodeType: NodeType.TRIGGER,
        triggerType: TriggerType.SCHEDULE,
        config: {
          ...SCHEDULE_NODE_DEFINITION.getDefaults(),
          cron: '0 9 * * *', // Daily at 9 AM
          timezone: 'UTC'
        },
      },
    }
    
    const filter: WorkflowNode = {
      id: filterId,
      type: 'logic',
      position: { x, y: y + 140 },
      data: {
        label: 'Filter Active Items',
        nodeType: NodeType.LOGIC,
        logicType: LogicType.FILTER,
        config: {
          condition: {
            field: 'status',
            operator: 'equals',
            value: 'active'
          }
        },
      },
    }
    
    const email: WorkflowNode = {
      id: emailId,
      type: 'action',
      position: { x, y: y + 280 },
      data: {
        label: 'Send Report',
        nodeType: NodeType.ACTION,
        actionType: ActionType.EMAIL,
        config: {
          ...EMAIL_NODE_DEFINITION.getDefaults(),
          to: ['reports@example.com'],
          subject: 'Daily Active Items Report',
          body: 'Here are the active items from today\'s report.'
        },
      },
    }
    
    const edges: WorkflowEdge[] = [
      { id: uuidv4(), source: scheduleId, target: filterId },
      { id: uuidv4(), source: filterId, target: emailId }
    ]
    
    return { nodes: [schedule, filter, email], edges }
  },
}

export default template
