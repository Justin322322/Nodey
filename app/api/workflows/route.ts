import { NextRequest, NextResponse } from 'next/server'
import { Workflow } from '@/types/workflow'
import { saveWorkflowToRegistry, getWorkflowById } from '@/server/services/workflow-registry'

export async function POST(req: NextRequest) {
  try {
    const workflow = (await req.json()) as Workflow
    if (!workflow || typeof workflow !== 'object' || !workflow.id) {
      return NextResponse.json({ error: 'Invalid workflow payload' }, { status: 400 })
    }
    saveWorkflowToRegistry(workflow)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  const wf = getWorkflowById(id)
  if (!wf) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }
  return NextResponse.json(wf)
}


