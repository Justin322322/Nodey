import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Workflow } from '@/types/workflow'
import { WorkflowExecutor } from '@/server/services/workflow-executor'
import { saveWorkflowExecution, saveWorkflowToRegistry } from '@/server/services/workflow-registry'

// In-memory executors to allow stop
const executors = new Map<string, WorkflowExecutor>()

const executeBodySchema = z.object({
  workflow: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    createdAt: z.union([z.string(), z.date()]),
    updatedAt: z.union([z.string(), z.date()]),
    isActive: z.boolean().optional(),
  }),
  options: z
    .object({
      startNodeId: z.string().min(1).optional(),
    })
    .optional(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json() as unknown
    const parsed = executeBodySchema.parse(json)
    const workflowRaw = parsed.workflow as Workflow
    const workflow: Workflow = {
      ...workflowRaw,
      createdAt: new Date(workflowRaw.createdAt),
      updatedAt: new Date(workflowRaw.updatedAt),
    }

    // Save latest workflow to registry for webhook-based triggers as well
    saveWorkflowToRegistry(workflow)

    const executor = new WorkflowExecutor(workflow)
    executors.set(workflow.id, executor)
    const execution = await executor.execute(parsed.options)
    executors.delete(workflow.id)

    // persist execution result in memory
    saveWorkflowExecution(workflow.id, execution)

    return NextResponse.json(execution)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: e.errors }, { status: 400 })
    }
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { workflowId } = (await req.json()) as { workflowId: string }
    const executor = executors.get(workflowId)
    if (executor) executor.stop()
    executors.delete(workflowId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


