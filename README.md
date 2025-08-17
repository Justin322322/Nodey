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

### Database
- **Current**: LocalStorage for development and demo purposes
- **Planned**: Supabase (PostgreSQL) integration for production persistence

## Development

### Scripts
```bash
npm run dev              # Development server
npm run typecheck        # TypeScript validation  
npm run lint             # ESLint check
npm test                 # Run all tests
npm test -- --run nodes/HttpNode/HttpNode.test.ts  # Run specific test
npm run build            # Production build
```

For contributing guidelines, project structure, and detailed development information, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Current Limitations

- **Persistence**: Uses LocalStorage (Supabase integration planned)
- **Authentication**: No user management (planned with Supabase Auth)
- **Email Service**: Mock implementation (real service integration planned)
- **Database Nodes**: Not yet implemented (Supabase integration planned)
- **Collaboration**: Single-user only (real-time collaboration planned)

## Roadmap

- **Database Integration**: Supabase for persistence and authentication
- **Enhanced Node Ecosystem**: Database, Transform, File, and Notification nodes
- **Advanced Features**: User management, versioning, monitoring
- **Enterprise Features**: Team collaboration, custom nodes, advanced security

## Contributing

Contributions are welcome! Please read our comprehensive documentation:

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development setup, contribution guidelines, and code standards
- **[docs/](docs/)** - Complete documentation including TypeScript guidelines and development guides
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community standards and behavior guidelines  
- **[SECURITY.md](SECURITY.md)** - Security policy and vulnerability reporting procedures
