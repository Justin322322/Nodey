import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// In-memory storage for webhook data (in production, use a database)
const webhookData = new Map<string, any[]>()

// Schema for webhook payload validation
const webhookPayloadSchema = z.object({
  event: z.string().optional(),
  data: z.any(),
  timestamp: z.string().datetime().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const { workflowId } = params
    
    // Parse request body
    const body = await req.json()
    
    // Validate payload
    const validatedData = webhookPayloadSchema.parse(body)
    
    // Store webhook data
    const existingData = webhookData.get(workflowId) || []
    const webhookEntry = {
      id: crypto.randomUUID(),
      workflowId,
      receivedAt: new Date().toISOString(),
      headers: Object.fromEntries(req.headers.entries()),
      ...validatedData,
    }
    
    existingData.push(webhookEntry)
    webhookData.set(workflowId, existingData)
    
    // In a real implementation, this would trigger workflow execution
    // For now, just acknowledge receipt
    
    return NextResponse.json({
      success: true,
      message: 'Webhook received',
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
  { params }: { params: { workflowId: string } }
) {
  const { workflowId } = params
  const data = webhookData.get(workflowId) || []
  
  return NextResponse.json({
    workflowId,
    webhooks: data,
    count: data.length,
  })
}
