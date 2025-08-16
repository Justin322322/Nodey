# Contributing to Nodey

Thank you for your interest in contributing! This project welcomes bug reports, fixes, features, documentation, and ideas.

By participating in this project, you agree to abide by our Code of Conduct and Security Policy.

- Code of Conduct: CODE_OF_CONDUCT.md
- Security Policy: SECURITY.md

## Getting Started

1. Fork the repository and create a branch:
   - git checkout -b feat/your-feature-name
2. Install and run:
   - npm install
   - npm run dev
3. Run checks before opening a PR:
   - npm run typecheck
   - npm run lint
   - npm test
   - npm run build

## Development Guidelines

- Use TypeScript with explicit types for exported/public APIs; avoid any.
- Prefer small, focused components and functions; handle errors explicitly.
- Keep UI consistent with Tailwind and components in components/ui.
- State lives in hooks/use-workflow-store.ts; keep updates pure and predictable.
- For React Flow, avoid deep prop drilling; encapsulate node UI under components/workflow.
- Accessibility: semantic elements, labels, keyboard interactions where applicable.

## Commit Messages (Conventional Commits)

Examples:
- feat(editor): add email node body field
- fix(flow): prevent delete on configure click
- docs: add contribution guide
- refactor(ui): simplify toolbar buttons

Common types: feat, fix, docs, refactor, chore, test, perf, build.

## Pull Requests

- Keep PRs focused and small where possible.
- Describe the problem and solution clearly; include screenshots/gifs for UI changes.
- Ensure all checks pass before requesting review.
- Link issues (e.g., Closes #123) when applicable.

## Adding Features

- Discuss larger proposals first via an issue.
- When adding new nodes/actions, update types in types/workflow.ts, server logic under server/services, and UI under components/workflow.
- Update docs in docs/ and README.md as needed.

## Creating Workflow Templates

Workflow templates power the Templates section in the editor palette. Put new templates under the `templates/` folder and register them so they appear in the UI.

### Folder structure

```
templates/
  index.ts            # registers all templates
  types.ts            # WorkflowTemplate interface
  <your-template>/
    index.ts          # default export of your WorkflowTemplate
```

### Steps to add a template

1. Create a new folder: `templates/<key-slug>/`.
2. Add `index.ts` that default-exports a `WorkflowTemplate` matching `templates/types.ts`.
3. Register it in `templates/index.ts` by importing it and adding it to `WORKFLOW_TEMPLATES`.
4. Run the app and verify it shows under Templates in the editor palette.

### Minimal example

```ts
// templates/hello-to-http/index.ts
import { v4 as uuidv4 } from 'uuid'
import { NodeType, TriggerType, ActionType, WorkflowEdge, WorkflowNode } from '@/types/workflow'
import { getDefaultConfigForNode } from '@/lib/node-definitions'
import { HTTP_NODE_DEFINITION } from '@/nodes/HttpNode'
import type { WorkflowTemplate } from '@/templates/types'

const template: WorkflowTemplate = {
  key: 'hello-to-http',
  label: 'Manual → HTTP Request',
  description: 'Start manually then call an API',
  buildAt: ({ x, y }) => {
    const triggerId = uuidv4()
    const actionId = uuidv4()

    const trigger: WorkflowNode = {
      id: triggerId,
      type: 'trigger',
      position: { x, y },
      data: {
        label: 'Manual Trigger',
        nodeType: NodeType.TRIGGER,
        triggerType: TriggerType.MANUAL,
        config: getDefaultConfigForNode(NodeType.TRIGGER, TriggerType.MANUAL) || {},
      },
    }

    const action: WorkflowNode = {
      id: actionId,
      type: 'action',
      position: { x, y: y + 140 },
      data: {
        label: 'HTTP Request',
        nodeType: NodeType.ACTION,
        actionType: ActionType.HTTP,
        config: HTTP_NODE_DEFINITION.getDefaults(),
      },
    }

    const edges: WorkflowEdge[] = [{ id: uuidv4(), source: triggerId, target: actionId }]
    return { nodes: [trigger, action], edges }
  },
}

export default template
```

Register it:

```ts
// templates/index.ts
import helloToHttp from '@/templates/hello-to-http'
// ...
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // existing templates...
  helloToHttp,
]
```

### Guidelines

- **key**: unique slug for lookup (e.g., `webhook-to-http`).
- **label/description**: concise, user-facing; keep description under ~80 chars.
- **buildAt(position)**: return nodes and edges positioned relative to `{ x, y }`.
- **IDs**: use `uuidv4()` for node and edge IDs.
- **Defaults**: prefer `getDefaultConfigForNode(...)` for initial config.
- If your template relies on new node types or config fields, also update `types/workflow.ts`, `lib/node-definitions.ts`, and related UI under `components/workflow/`.

## Reporting Bugs

- Use the Bug Report issue template. Include reproduction steps, expected vs actual behavior, and environment details.

## Security

- Do not file public issues for vulnerabilities. See SECURITY.md for private reporting instructions.

## License

By contributing, you agree that your contributions are licensed under the project LICENSE.
