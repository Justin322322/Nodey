# Contributing to Nodey

Thank you for your interest in contributing! This project welcomes bug reports, fixes, features, documentation, and ideas.

By participating in this project, you agree to abide by our Code of Conduct and Security Policy.

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

## Quick Start

1. **Fork and clone** the repository
2. **Create a feature branch**: `git checkout -b feat/your-feature-name`
3. **Install dependencies**: `npm install`
4. **Start development**: `npm run dev`
5. **Run quality checks**: `npm run typecheck && npm run lint && npm test && npm run build`

For detailed setup instructions, see the [README.md](README.md).

## Project Structure

Understanding the codebase structure is crucial for effective contributions:

```
├── app/                    # Next.js 15 App Router
│   ├── (dashboard)/       # Dashboard pages (workflows list)
│   ├── api/               # API routes (execute, webhooks)
│   ├── editor/            # Workflow editor page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   ├── workflow/          # Workflow-specific components
│   ├── landing/           # Landing page components
│   └── loading/           # Loading states
├── nodes/                 # Modular node system
│   ├── HttpNode/          # Example: Complete HTTP node
│   │   ├── HttpNode.tsx           # React component
│   │   ├── HttpNode.service.ts    # Business logic
│   │   ├── HttpNode.schema.ts     # Validation schema
│   │   ├── HttpNode.types.ts      # TypeScript interfaces
│   │   ├── HttpNode.test.ts       # Test suite
│   │   └── index.ts              # Clean exports
│   ├── EmailNode/         # Email node implementation
│   ├── types.ts           # Shared node interfaces
│   └── index.ts           # Node registry
├── server/                # Server-side services
│   └── services/
│       ├── workflow-executor.ts   # Execution engine
│       ├── workflow-registry.ts   # In-memory storage
│       └── http-client.ts         # HTTP utilities
├── templates/             # Workflow templates
├── hooks/                 # React hooks (Zustand store)
├── lib/                   # Utilities and legacy code
├── types/                 # Global TypeScript definitions
└── styles/                # Global CSS and Tailwind
```

## Architecture Patterns

### Component Patterns
- **"use client"** directive for client components
- **Compound components** for complex UI (workflow editor)
- **Custom hooks** for state management (Zustand)
- **Render props** for flexible component composition
- **TypeScript interfaces** for all component props

### State Management
- **Global state**: Zustand store (`hooks/use-workflow-store.ts`)
- **Local state**: React useState for component-specific state
- **Server state**: Server-side execution and storage
- **Pure updates**: No side effects in state updates

### Code Organization
- **Feature-based folders** for nodes (`nodes/NodeName/`)
- **UI components** in `components/ui/` (shadcn/ui pattern)
- **Business logic** separated from UI components
- **Barrel exports** (`index.ts`) for clean imports

## Testing Standards

### Test Structure
```typescript
describe('NodeName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('executeNode', () => {
    it('should handle success cases', async () => {
      // Arrange
      const context = createMockContext(config)
      
      // Act
      const result = await executeNode(context)
      
      // Assert
      expect(result).toMatchObject(expectedOutput)
    })

    it('should handle error cases', async () => {
      // Test error scenarios
    })

    it('should validate configuration', () => {
      // Test schema validation
    })

    it('should handle abort signals', async () => {
      // Test cancellation
    })
  })

  describe('schema validation', () => {
    it('should validate required fields')
    it('should provide correct defaults')
    it('should handle edge cases')
  })
})
```

### Testing Patterns
- **Vitest** for unit and integration tests
- **Mock external dependencies** (fetch, APIs)
- **Test both happy and error paths**
- **Validate TypeScript interfaces**
- **Test async operations with proper cleanup**

### Coverage Goals
- **>90% coverage** for critical business logic
- **100% coverage** for node execution functions
- **Integration tests** for API routes
- **E2E tests** for user workflows (planned)

## Code Style & Standards

### TypeScript Guidelines

This project enforces strict TypeScript practices. See [docs/typescript-development-guide.md](docs/typescript-development-guide.md) for comprehensive guidelines including:

- Zero-tolerance `any` type policy
- Type safety requirements
- Best practices and patterns
- Automated prevention system

### React Component Guidelines
```typescript
// Good: Interface for props
interface ComponentProps {
  title: string
  onSubmit: (data: FormData) => void
  isLoading?: boolean
}

// Good: Named function component
export function ComponentName({ title, onSubmit, isLoading = false }: ComponentProps) {
  // Component logic
}

// Good: Custom hooks for logic
function useWorkflowLogic() {
  const store = useWorkflowStore()
  // Hook logic
  return { /* exposed API */ }
}
```

### CSS/Styling Guidelines
- **Tailwind CSS** for all styling
- **Component-specific styles** in component files
- **Design system** from `components/ui/`
- **Responsive design** with mobile-first approach
- **Accessibility** considerations (semantic HTML, ARIA)

## Adding New Nodes

New nodes are the most common contribution. Follow this pattern:

### 1. Create Node Directory
```bash
mkdir nodes/YourNode
cd nodes/YourNode
```

### 2. Implement Required Files

#### `YourNode.types.ts`
```typescript
export interface YourNodeConfig {
  // Configuration interface
  setting1: string
  setting2?: number
}

export interface YourNodeOutput {
  // Output interface
  result: unknown
  metadata?: Record<string, unknown>
}
```

#### `YourNode.schema.ts`
```typescript
import { z } from 'zod'
import { NodeDefinition } from '@/lib/node-definitions'

export const YOUR_NODE_SCHEMA = z.object({
  setting1: z.string().min(1, 'Setting1 is required'),
  setting2: z.number().optional().default(10),
})

export const YOUR_NODE_DEFINITION: NodeDefinition = {
  schema: YOUR_NODE_SCHEMA,
  getDefaults: () => ({
    setting1: '',
    setting2: 10,
  }),
  description: 'Brief description of what this node does',
}
```

#### `YourNode.service.ts`
```typescript
import { NodeExecutionContext } from '../types'
import { YourNodeConfig, YourNodeOutput } from './YourNode.types'

export async function executeYourNode(
  context: NodeExecutionContext
): Promise<YourNodeOutput> {
  const config = context.config as YourNodeConfig
  
  try {
    // Business logic here
    const result = await performOperation(config)
    
    return {
      result,
      metadata: { executedAt: new Date().toISOString() }
    }
  } catch (error) {
    throw new Error(`YourNode execution failed: ${error.message}`)
  }
}
```

#### `YourNode.tsx`
```typescript
import { BaseNode } from './base-node'
import { NodeType, ActionType } from '@/types/workflow'

export function YourNode(props: any) {
  return (
    <BaseNode
      {...props}
      nodeType={NodeType.ACTION}
      actionType={ActionType.YOUR_ACTION}
      title="Your Node"
      description="Brief description"
    />
  )
}
```

#### `YourNode.test.ts`
```typescript
import { describe, it, expect, vi } from 'vitest'
import { executeYourNode } from './YourNode.service'
import { YOUR_NODE_DEFINITION } from './YourNode.schema'

describe('YourNode', () => {
  describe('executeYourNode', () => {
    it('should execute successfully with valid config', async () => {
      const context = {
        nodeId: 'test',
        config: { setting1: 'test', setting2: 5 },
        previousOutput: undefined,
        signal: undefined,
      }
      
      const result = await executeYourNode(context)
      
      expect(result).toMatchObject({
        result: expect.any(Object),
        metadata: expect.objectContaining({
          executedAt: expect.any(String)
        })
      })
    })

    it('should handle errors gracefully', async () => {
      // Error case tests
    })
  })

  describe('schema validation', () => {
    it('should validate configuration', () => {
      const validConfig = { setting1: 'test' }
      const result = YOUR_NODE_DEFINITION.schema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })
  })
})
```

#### `index.ts`
```typescript
export { YourNode } from './YourNode'
export { executeYourNode } from './YourNode.service'
export { YOUR_NODE_DEFINITION, YOUR_NODE_SCHEMA } from './YourNode.schema'
export type { YourNodeConfig, YourNodeOutput } from './YourNode.types'
```

### 3. Register Your Node
```typescript
// nodes/index.ts
export * from './YourNode'

// types/workflow.ts - Add to ActionType enum
export enum ActionType {
  // existing types...
  YOUR_ACTION = 'your_action',
}

// lib/node-definitions.ts - Add fallback validation
```

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>[optional scope]: <description>

# Examples
feat(editor): add drag and drop for node templates
fix(http-node): resolve authentication header encoding
docs(readme): update installation instructions
refactor(ui): simplify button component variants
test(workflow): add integration tests for execution
chore(deps): update React to v19
perf(editor): optimize node rendering performance
build(ci): add automated testing workflow
```

### Commit Types
- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation only
- **refactor**: Code refactoring (no new features/fixes)
- **test**: Adding or updating tests
- **chore**: Maintenance (deps, configs)
- **perf**: Performance improvements
- **build**: Build system or CI changes

## Pull Request Guidelines

### Before Submitting
- [ ] Run all quality checks (`typecheck`, `lint`, `test`, `build`)
- [ ] Write tests for new functionality
- [ ] Update documentation if needed
- [ ] Follow conventional commit messages
- [ ] Keep PRs focused and reasonably sized

### PR Template
```markdown
## What
Brief description of changes

## Why
Context and motivation

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No TypeScript errors

## Screenshots
(For UI changes)

## Breaking Changes
(If any)
```

### Review Process
1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Manual testing** for UI changes
4. **Documentation** review if applicable

## Development Scripts

See [README.md](README.md) for complete script documentation. Key commands:

```bash
npm run dev        # Development server
npm run typecheck  # TypeScript validation
npm run lint       # ESLint check
npm test          # Run tests
npm run build     # Production build
```

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

- Use the Bug Report issue template
- Include reproduction steps
- Provide expected vs actual behavior
- Include environment details (OS, Node.js version, browser)

## Security

- Do not file public issues for vulnerabilities
- See [SECURITY.md](SECURITY.md) for private reporting instructions

## License

By contributing, you agree that your contributions are licensed under the project [LICENSE](LICENSE).
