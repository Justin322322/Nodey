import { NextRequest, NextResponse } from 'next/server'
import { Workflow } from '@/types/workflow'
import { WorkflowExecutor } from '@/server/services/workflow-executor'

// In-memory executors to allow stop
const executors = new Map<string, WorkflowExecutor>()

export async function POST(req: NextRequest) {
  try {
    const { workflow } = (await req.json()) as { workflow: Workflow }
    if (!workflow || !workflow.id) {
      return NextResponse.json({ error: 'Invalid workflow' }, { status: 400 })
    }
    const executor = new WorkflowExecutor(workflow)
    executors.set(workflow.id, executor)
    const execution = await executor.execute()
    executors.delete(workflow.id)
    return NextResponse.json(execution)
  } catch (e) {
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


