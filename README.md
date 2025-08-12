# Nodey - Low-Code Workflow Automation Builder

A simplified n8n-like application for building workflow automations with a visual node-based editor.

## Features

- **Visual Node Editor** - Drag and drop interface for building workflows
- **Multiple Node Types**:
  - **Triggers**: Manual, Webhook, Schedule, Email
  - **Actions**: HTTP Request, Send Email, Database, Transform Data, Delay
  - **Logic**: If/Else, Switch, Loop, Filter
- **Workflow Execution** - Run workflows and see real-time logs
- **Persistence** - Save and manage multiple workflows
- **Integrations** - HTTP webhooks and API calls

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
- **HTTP Request**: Make API calls with configurable method, headers, and body
- **Send Email**: Send emails with to, subject, and body
- **Database**: Query or update database (mock implementation)
- **Transform Data**: Transform data between nodes
- **Delay**: Wait for specified time before continuing

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

### Managing Workflows

- Navigate to `/workflows` to see all saved workflows
- Edit, delete, or export workflows as JSON
- Import workflows using the Import button on the workflows page

## Architecture

- **Frontend**: Next.js 14 with App Router, React Flow for node editor
- **State Management**: Zustand for workflow state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Persistence**: LocalStorage (can be extended to database)
- **Execution**: Server-side workflow executor with real-time logging

## Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build
```

## Limitations

This is a simplified version for demonstration:
- Workflow persistence uses LocalStorage
- Email and database nodes are mocked
- No authentication or multi-user support
- Limited error handling and validation

## Future Enhancements

- Database integration for persistence
- Real email service integration
- More node types and integrations
- User authentication and permissions
- Workflow versioning and history
- Advanced scheduling with timezone support
- Webhook response customization
