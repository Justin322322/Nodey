## Current Task

Add small UX improvements and tracking docs without changing architecture:

- Import Workflow feature on workflows list page
- HTTP node configuration: add authentication options (None, Bearer, Basic, API Key)
- Create this document to track TODOs for later

## What changed in this task

- app/(dashboard)/workflows/page.tsx: Added Import button and file JSON ingestion
- components/workflow/node-config-panel.tsx: Added authentication selector and value input for HTTP nodes
- README.md: Updated Managing Workflows with new Import path
- AI_RULES.md: Added note to maintain docs/workflow.md

## Verified

- Typecheck OK (npm run typecheck)
- Build OK (npm run build)

## TODO (deferred)

- Type consistency for dates crossing the network:
  - Consider `string | Date` or client hydration for `WorkflowExecution.startedAt/completedAt`
- Webhook to execution bridge:
  - Trigger workflow execution on POST /api/webhooks/[workflowId]
- Error boundaries:
  - Add segment-level `error.tsx` and `not-found.tsx` where meaningful
- Persistence backend:
  - Replace LocalStorage with server persistence
- Tests:
  - Add unit tests for import and HTTP auth config changes; integration smoke


