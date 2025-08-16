import webhookToHttp from '@/templates/webhook-to-http'
import manualToHttp from '@/templates/manual-to-http'
import scheduleToEmail from '@/templates/schedule-to-email'
import webhookConditionalEmail from '@/templates/webhook-conditional-email'
import scheduleFilterEmail from '@/templates/schedule-filter-email'
import type { WorkflowTemplate } from '@/templates/types'

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  webhookToHttp,
  manualToHttp,
  scheduleToEmail,
  webhookConditionalEmail,
  scheduleFilterEmail,
]

export function getWorkflowTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES
}

export function buildWorkflowTemplateAt(key: string, position: { x: number; y: number }) {
  const tpl = WORKFLOW_TEMPLATES.find((t) => t.key === key)
  if (!tpl) return null
  return tpl.buildAt(position)
}


