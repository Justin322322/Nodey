import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Nodey API is running',
    endpoints: {
      webhooks: '/api/webhooks/[workflowId]',
      test: '/api/test',
    },
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown
    
    return NextResponse.json({
      message: 'Test endpoint received data',
      received: body,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({
      error: 'Invalid JSON payload',
    }, { status: 400 })
  }
}
