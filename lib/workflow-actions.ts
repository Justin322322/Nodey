// Client-safe wrappers that call server actions through route handlers if needed
// For now, we directly re-export server actions to keep the demo simple.
// Next.js allows importing server files in client code only if the functions
// are called on the server. To avoid that, we expose a small fetch-based shim.

import { Workflow, WorkflowExecution } from '@/types/workflow'

export async function executeWorkflow(workflow: Workflow, options?: { startNodeId?: string }): Promise<WorkflowExecution> {
  // Call a serverless route to execute workflow to avoid importing server code in client
  // Also sync the latest workflow to server registry so webhooks can find it
  try {
    await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    })
  } catch {
    // no-op
  }
  const response = await fetch('/api/execute-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow, options }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to execute workflow')
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return response.json()
}

export async function stopWorkflowExecution(workflowId: string): Promise<void> {
  await fetch('/api/execute-workflow', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowId }),
  })
}


