import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkflowById } from '@/server/services/workflow-registry'
import { WorkflowExecutor } from '@/server/services/workflow-executor'
import { saveWorkflowExecution } from '@/server/services/workflow-registry'

// In-memory storage for webhook data (in production, use a database)
type StoredWebhook = {
  id: string
  workflowId: string
  receivedAt: string
  headers: Record<string, string>
  event?: string
  data: unknown
  timestamp?: string
}
const webhookData = new Map<string, StoredWebhook[]>()

// Schema for webhook payload validation
const webhookPayloadSchema = z.object({
  event: z.string().optional(),
  data: z.any(),
  timestamp: z.string().datetime().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await params
    
    // Parse request body
    const body = await req.json() as unknown
    
    // Validate payload
    const validatedData = webhookPayloadSchema.parse(body)
    
    // Store webhook data
    const existingData = webhookData.get(workflowId) || []
    const webhookEntry: StoredWebhook = {
      id: crypto.randomUUID(),
      workflowId,
      receivedAt: new Date().toISOString(),
      headers: Object.fromEntries(req.headers.entries()),
      event: validatedData.event,
      data: validatedData.data,
      timestamp: validatedData.timestamp,
    }
    
    existingData.push(webhookEntry)
    webhookData.set(workflowId, existingData)
    
    // Attempt to load workflow and kick off execution asynchronously
    const workflow = getWorkflowById(workflowId)
    if (workflow) {
      // Fire-and-forget execution (no streaming)
      ;(async () => {
        const executor = new WorkflowExecutor(workflow)
        const execution = await executor.execute()
        saveWorkflowExecution(workflowId, execution)
      })().catch(() => {})
    }
    
    return NextResponse.json({
      success: true,
      message: workflow ? 'Webhook received; execution started' : 'Webhook received; no workflow registered',
      id: webhookEntry.id,
    }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payload',
        details: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params
  const data = webhookData.get(workflowId) || []
  
  return NextResponse.json({
    workflowId,
    webhooks: data,
    count: data.length,
  })
}
