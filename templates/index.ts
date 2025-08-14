import webhookToHttp from '@/templates/webhook-to-http'
import manualToHttp from '@/templates/manual-to-http'
import scheduleToEmail from '@/templates/schedule-to-email'
import type { WorkflowTemplate } from '@/templates/types'

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  webhookToHttp,
  manualToHttp,
  scheduleToEmail,
]

export function getWorkflowTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES
}

export function buildWorkflowTemplateAt(key: string, position: { x: number; y: number }) {
  const tpl = WORKFLOW_TEMPLATES.find((t) => t.key === key)
  if (!tpl) return null
  return tpl.buildAt(position)
}


