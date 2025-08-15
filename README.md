# Nodey - Low-Code Workflow Automation Builder

A modern, simplified n8n-like application for building workflow automations with a visual node-based editor. Built with Next.js 15, TypeScript, and React Flow.

<img width="1919" height="917" alt="Nodey Workflow Editor" src="https://github.com/user-attachments/assets/90fbbb54-87ff-4a30-9a5a-89d47e4c1a9e" />
<img width="1919" height="920" alt="Nodey Node Configuration" src="https://github.com/user-attachments/assets/77a3d5c9-cfca-46ef-af56-40fbf127b216" />




## Features

- **Visual Node Editor** - Drag and drop interface for building workflows with React Flow
- **Modular Node Architecture** - Self-contained nodes with their own schemas, services, and tests
- **Multiple Node Types**:
  - **Triggers**: Manual, Webhook, Schedule
  - **Actions**: HTTP Request (fully implemented), Send Email (modular implementation)
  - **Logic**: If/Else, Switch, Loop, Filter
- **Advanced HTTP Node** - Complete HTTP client with authentication (Bearer, Basic, API Key), all methods, headers, and body support
- **Workflow Execution** - Server-side execution with real-time logging and error handling
- **Smart UI** - Conditional parameter visibility with OR logic for mutually exclusive options
- **Comprehensive Testing** - Full test coverage for node validation and execution
- **Type Safety** - Full TypeScript implementation with strict type checking

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start building workflows.

## Usage

### Creating a Workflow

1. **Add Nodes**: Drag nodes from the left panel onto the canvas
2. **Connect Nodes**: Click and drag from output to input handles
3. **Configure Nodes**: Click on a node to open configuration panel
4. **Save Workflow**: Click Save button in the toolbar
5. **Run Workflow**: Click Run button to execute

### Node Types

#### Triggers
- **Manual**: Start workflow manually with Run button
- **Webhook**: Trigger via HTTP POST to `/api/webhooks/[workflowId]`
- **Schedule**: Run on cron schedule (e.g., `0 0 * * *` for daily)
- **Email**: Trigger when email is received (mock implementation)

#### Actions
- **HTTP Request**: Full-featured HTTP client with:
  - All HTTP methods (GET, POST, PUT, DELETE, PATCH)
  - Authentication support (Bearer tokens, Basic auth, API keys)
  - Custom headers and JSON body support
  - Comprehensive error handling and validation
  - Network timeout and abort signal support
- **Send Email**: Send emails with configurable recipients, subject, and body
- **Database**: Query or update database (planned with Supabase integration)
- **Transform Data**: Transform data between nodes (planned)
- **Delay**: Wait for specified time before continuing (planned)

#### Logic
- **If/Else**: Conditional branching based on data
- **Switch**: Multiple condition branches
- **Loop**: Iterate over array items
- **Filter**: Filter array based on conditions

### Webhook Integration

Workflows can be triggered via webhooks:

```bash
curl -X POST http://localhost:3000/api/webhooks/[workflowId] \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"key": "value"}}'
```

Note: Save your workflow from the editor at least once to sync it to the server registry so webhooks can trigger it.

### Managing Workflows

- Navigate to `/workflows` to see all saved workflows
- Edit, delete, or export workflows as JSON
- Import workflows using the Import button on the workflows page

## Architecture

### Frontend
- **Framework**: Next.js 15 with App Router and React 18
- **Node Editor**: React Flow for visual workflow building
- **State Management**: Zustand for workflow state management
- **Styling**: Tailwind CSS with shadcn/ui components
- **Type Safety**: Full TypeScript with strict mode

### Backend
- **Execution Engine**: Server-side workflow executor with real-time logging
- **Node System**: Modular architecture with self-contained nodes
- **Validation**: Comprehensive validation with fallback mechanisms
- **API**: RESTful endpoints for workflow management and webhook triggers

### Database (Supabase Integration Planned)
- **Primary Database**: Supabase (PostgreSQL) for production-ready persistence
- **Authentication**: Supabase Auth for user management and security
- **Real-time**: Supabase Realtime for collaborative workflow editing
- **Storage**: Supabase Storage for file handling and assets
- **Features**: 
  - Workflow storage and versioning
  - User authentication and authorization
  - Real-time subscriptions for collaborative editing
  - Row-level security for multi-tenant support
  - Automatic backups and point-in-time recovery
- **Current**: LocalStorage for development and demo purposes

#### Planned Database Schema
```sql
-- Users table (handled by Supabase Auth)
-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions table
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  logs JSONB DEFAULT '[]',
  node_outputs JSONB DEFAULT '{}'
);
```

## Development

### Scripts
```bash
# Development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test

# Run specific test file
npm test -- --run nodes/HttpNode/HttpNode.test.ts

# Build for production
npm run build
```

### Project Structure
```
├── components/          # Reusable UI components
│   └── workflow/       # Workflow-specific components
├── nodes/              # Modular node implementations
│   ├── types.ts        # Shared node execution interfaces
│   ├── HttpNode/       # HTTP node implementation
│   │   ├── HttpNode.tsx           # React component
│   │   ├── HttpNode.service.ts    # Business logic
│   │   ├── HttpNode.schema.ts     # Schema and validation
│   │   ├── HttpNode.types.ts      # TypeScript interfaces
│   │   ├── HttpNode.test.ts       # Comprehensive tests
│   │   └── index.ts              # Exports
│   └── EmailNode/      # Email node implementation
├── lib/                # Utility functions and legacy code
├── types/              # Global TypeScript definitions
└── app/                # Next.js app router pages
```

### Testing Strategy
- **Unit Tests**: Comprehensive test coverage for all node services
- **Integration Tests**: Validation and schema testing
- **Type Safety**: TypeScript strict mode with full type checking
- **Test Framework**: Vitest for fast, modern testing
- **Coverage**: Aim for >90% test coverage on critical paths

Example test structure:
```typescript
describe('NodeName', () => {
  describe('executeNode', () => {
    it('should handle success cases')
    it('should handle error cases')
    it('should validate configuration')
    it('should handle abort signals')
  })
  
  describe('schema validation', () => {
    it('should validate required fields')
    it('should provide correct defaults')
    it('should handle edge cases')
  })
})
```

### Adding New Nodes
1. Create a new directory in `nodes/` (e.g., `nodes/DatabaseNode/`)
2. Implement the required files following the HttpNode pattern:
   - `NodeName.tsx` - React component using BaseNode
   - `NodeName.service.ts` - Business logic with execute function
   - `NodeName.schema.ts` - Schema definition and validation
   - `NodeName.types.ts` - TypeScript interfaces
   - `NodeName.test.ts` - Comprehensive test suite
   - `index.ts` - Clean exports
3. Add validation fallback in `lib/node-definitions.ts` if needed
4. Export from `nodes/index.ts`
5. Write comprehensive tests covering all functionality

## Current Limitations

- **Persistence**: Uses LocalStorage (Supabase integration planned)
- **Authentication**: No user management (planned with Supabase Auth)
- **Email Service**: Mock implementation (real service integration planned)
- **Database Nodes**: Not yet implemented (Supabase integration planned)
- **Collaboration**: Single-user only (real-time collaboration planned)

## Roadmap & Future Enhancements

### Phase 1: Database Integration (Next Priority)
- **Supabase Integration**: 
  - PostgreSQL database for workflow persistence
  - User authentication and authorization
  - Row-level security for multi-tenant support
  - Real-time subscriptions for collaborative features
- **Migration**: Seamless migration from LocalStorage to database
- **Backup & Export**: Workflow backup and restore functionality

### Phase 2: Enhanced Node Ecosystem
- **Database Node**: Full CRUD operations with Supabase
- **Transform Node**: Data transformation and mapping
- **Delay Node**: Time-based workflow pauses
- **File Node**: File upload, download, and processing
- **Notification Node**: Slack, Discord, Teams integrations

### Phase 3: Advanced Features
- **User Management**: Multi-user support with permissions
- **Workflow Versioning**: Git-like versioning and history
- **Advanced Scheduling**: Timezone support and complex cron expressions
- **Webhook Customization**: Custom response handling and headers
- **Monitoring**: Workflow analytics and performance metrics
- **API Management**: Rate limiting and API key management

### Phase 4: Enterprise Features
- **Team Collaboration**: Real-time collaborative editing
- **Workflow Templates**: Shareable workflow templates
- **Custom Nodes**: Plugin system for custom node development
- **Advanced Security**: Encryption, audit logs, compliance features
- **Scalability**: Horizontal scaling and load balancing

## Contributing

Contributions are welcome! Please read the contribution guidelines and policies:

- See `CONTRIBUTING.md` for how to set up your environment, development guidelines, and PR process
- See `CODE_OF_CONDUCT.md` for community standards
- See `SECURITY.md` for reporting vulnerabilities
