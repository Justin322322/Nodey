# Workflow Documentation

This document provides comprehensive information about creating, managing, and executing workflows in Nodey.

## Workflow Architecture

### Core Components

- **Nodes**: Individual units of functionality (triggers, actions, logic)
- **Connections**: Data flow between nodes via input/output handles
- **Execution Engine**: Server-side workflow processor with real-time logging
- **Configuration System**: Modular parameter handling with validation

### Node Categories

#### Triggers
Start workflow execution based on events:
- **Manual**: User-initiated execution
- **Webhook**: HTTP POST triggers
- **Schedule**: Cron-based execution
- **Email**: IMAP email monitoring (fully implemented)

#### Actions
Perform operations and data processing:
- **HTTP Request**: Full-featured HTTP client with authentication
- **Send Email**: Email composition and delivery
- **Database**: Query and update operations
- **Transform**: Data manipulation and formatting

#### Logic
Control flow and conditional execution:
- **If/Else**: Conditional branching
- **Switch**: Multiple condition evaluation
- **Loop**: Array iteration
- **Filter**: Data filtering

## Creating Workflows

### Basic Workflow Creation

1. **Access Editor**: Navigate to `/editor` or click "New Workflow"
2. **Add Nodes**: Drag nodes from the left panel onto the canvas
3. **Connect Nodes**: Click output handles and drag to input handles
4. **Configure**: Click nodes to open configuration panels
5. **Save**: Use toolbar save button to persist workflow
6. **Execute**: Click run button or trigger via webhook/schedule

### Node Configuration

Each node has a comprehensive configuration system:

#### Parameter Types
- **Text/String**: Single-line text input
- **Textarea**: Multi-line text input
- **Number**: Numeric input with validation
- **Boolean**: Toggle switch with visual feedback
- **Select**: Dropdown with predefined options
- **JSON**: Structured data with key-value editor
- **Email**: Email address validation
- **Password**: Masked password input
- **URL**: URL validation and formatting
- **Credential**: Secure credential selection
- **StringList**: Comma-separated list input

#### Advanced Features
- **Conditional Visibility**: Parameters show/hide based on other values
- **Validation**: Real-time parameter validation with error messages
- **Type Safety**: Full TypeScript integration with runtime checks
- **Default Values**: Intelligent defaults based on parameter types

## Execution Engine

### Execution Process

1. **Trigger Activation**: Manual, webhook, schedule, or email trigger
2. **Validation**: Parameter and connection validation
3. **Node Execution**: Sequential processing through connected nodes
4. **Error Handling**: Comprehensive error capture and reporting
5. **Result Storage**: Execution results and logs storage

### Real-time Monitoring

- **Execution Logs**: Live streaming of node execution status
- **Error Tracking**: Detailed error messages and stack traces
- **Performance Metrics**: Execution time and resource usage
- **Debug Information**: Step-by-step execution details

## Webhook Integration

### Setup and Usage

```bash
# Example webhook trigger
curl -X POST http://localhost:3000/api/webhooks/[workflowId] \
  -H "Content-Type: application/json" \
  -d '{"event": "user_signup", "data": {"email": "user@example.com"}}'
```

### Security Features

- **Signature Verification**: HMAC validation for webhook authenticity
- **Rate Limiting**: Built-in protection against abuse
- **Request Validation**: JSON schema validation for webhook payloads
- **Error Handling**: Comprehensive webhook failure management

## Advanced Features

### Modular Architecture

The node configuration system is fully modular:

- **Parameter Handlers**: Individual components for each parameter type
- **Node Configurations**: Specialized configurations per node type
- **Validation System**: Centralized validation with custom rules
- **Type System**: Comprehensive TypeScript integration

### Email Trigger System

Fully implemented IMAP email monitoring:

- **IMAP Connection**: Secure SSL/TLS connections
- **Authentication**: Username/password with app-specific passwords
- **Mailbox Selection**: Configurable inbox/folder monitoring
- **Attachment Support**: Download and processing capabilities
- **Post-processing**: Mark as read or leave unread options
- **Custom Rules**: Advanced IMAP search criteria support

### HTTP Request Node

Comprehensive HTTP client implementation:

- **All Methods**: GET, POST, PUT, DELETE, PATCH support
- **Authentication**: Bearer tokens, Basic auth, API keys
- **Headers**: Custom header support with validation
- **Body**: JSON and form data support
- **Timeout**: Configurable request timeouts
- **Error Handling**: Detailed error reporting and retry logic

## Best Practices

### Workflow Design

- **Start Simple**: Begin with basic trigger → action workflows
- **Error Handling**: Always include error handling nodes
- **Testing**: Test workflows with various input scenarios
- **Documentation**: Document complex workflow logic
- **Version Control**: Save versions as you develop complex workflows

### Performance Optimization

- **Connection Limits**: Avoid excessive parallel connections
- **Timeout Configuration**: Set appropriate timeouts for operations
- **Resource Management**: Monitor memory and CPU usage
- **Caching**: Implement caching for repeated operations
- **Batch Processing**: Use batch operations when possible

### Security Considerations

- **Credential Management**: Use secure credential storage
- **Input Validation**: Validate all external inputs
- **Error Messages**: Avoid exposing sensitive information in errors
- **Rate Limiting**: Implement appropriate rate limiting
- **Access Control**: Restrict workflow access appropriately

## Troubleshooting

### Common Issues

- **Connection Failures**: Check network connectivity and credentials
- **Timeout Errors**: Increase timeout values or optimize operations
- **Validation Errors**: Review parameter configurations
- **Execution Failures**: Check logs for detailed error information

### Debug Tools

- **Execution Logs**: Real-time logging during workflow execution
- **Node Validation**: Parameter validation with detailed error messages
- **Connection Testing**: Test node connections before execution
- **Configuration Preview**: Review all node configurations

## Integration Examples

### Email Processing Workflow
1. Email trigger monitors inbox
2. Filter nodes check sender/keywords
3. HTTP requests process data
4. Email responses sent automatically

### API Integration Workflow
1. Webhook receives API data
2. Transform nodes format data
3. Database nodes store information
4. Notification emails sent on completion

### Scheduled Maintenance Workflow
1. Schedule trigger runs daily
2. Database cleanup operations
3. Health check HTTP requests
4. Status emails sent to administrators

