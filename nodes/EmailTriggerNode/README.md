# Email Trigger Node

The Email Trigger Node is a workflow trigger that monitors an IMAP email server for new messages and can automatically start workflows when emails are received. This node is particularly useful for automating email-based workflows, such as processing incoming support requests, order confirmations, or any email-triggered automation.

## Overview

The Email Trigger Node connects to an IMAP server and continuously monitors for new emails. When new messages arrive, it can trigger workflows and provide the email content, metadata, and attachments to subsequent nodes in the workflow.

## Features

- **IMAP Server Connection**: Connect to any standard IMAP server (Gmail, Outlook, custom servers)
- **Flexible Email Filtering**: Use built-in criteria or custom IMAP search rules
- **Attachment Handling**: Optionally download and process email attachments
- **Multiple Output Formats**: Choose between simple, resolved, or raw email formats
- **Post-Processing Actions**: Automatically mark emails as read or leave them unread
- **Connection Management**: Automatic reconnection and error handling
- **Security Options**: Support for self-signed certificates and custom TLS configuration

## Configuration

### Basic Connection Settings

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `host` | string | Yes | - | IMAP server hostname or IP address |
| `port` | number | Yes | - | IMAP server port (usually 993 for SSL, 143 for non-SSL) |
| `secure` | boolean | Yes | - | Whether to use SSL/TLS encryption |
| `user` | string | Yes | - | Email account username/email address |
| `password` | string | Yes | - | Email account password or app-specific password |
| `mailbox` | string | No | "INBOX" | Mailbox to monitor (e.g., "INBOX", "Sent", "Drafts") |

### Advanced Settings

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `enabled` | boolean | No | true | Whether the trigger is active |
| `postProcessAction` | string | No | "nothing" | Action after processing: "read" or "nothing" |
| `downloadAttachments` | boolean | No | false | Whether to download email attachments |
| `format` | string | No | "simple" | Output format: "simple", "resolved", or "raw" |
| `attachmentPrefix` | string | No | "attachment_" | Prefix for attachment filenames |
| `trackLastMessageId` | boolean | No | true | Whether to track the last processed message ID |
| `allowUnauthorizedCerts` | boolean | No | false | Allow self-signed or invalid SSL certificates |
| `reconnectIntervalMinutes` | number | No | 5 | Minutes between reconnection attempts |
| `customEmailRules` | string | No | - | JSON string of custom IMAP search criteria |

## Usage Examples

### Basic Gmail Setup

```json
{
  "host": "imap.gmail.com",
  "port": 993,
  "secure": true,
  "user": "your-email@gmail.com",
  "password": "your-app-password",
  "mailbox": "INBOX",
  "postProcessAction": "read",
  "downloadAttachments": true
}
```

### Custom Email Filtering

```json
{
  "host": "mail.company.com",
  "port": 993,
  "secure": true,
  "user": "support@company.com",
  "password": "password123",
  "mailbox": "INBOX",
  "customEmailRules": "[\"FROM\", \"customer@example.com\", \"SUBJECT\", \"urgent\"]",
  "postProcessAction": "nothing",
  "format": "resolved"
}
```

### Office 365/Outlook Setup

```json
{
  "host": "outlook.office365.com",
  "port": 993,
  "secure": true,
  "user": "user@company.onmicrosoft.com",
  "password": "password123",
  "mailbox": "INBOX",
  "allowUnauthorizedCerts": false,
  "trackLastMessageId": true
}
```

## Output Data

When an email is triggered, the node provides the following data structure:

### Email Message Object

```typescript
interface EmailMessage {
  id: string;                    // Unique message identifier
  uid: number;                   // IMAP UID
  subject: string;               // Email subject line
  from: EmailAddress[];          // Sender information
  to: EmailAddress[];            // Recipient information
  cc: EmailAddress[];            // CC recipients
  bcc: EmailAddress[];           // BCC recipients
  date: Date;                    // Email timestamp
  text: string;                  // Plain text content
  html: string;                  // HTML content
  attachments: EmailAttachment[]; // File attachments
  headers: Record<string, string>; // Email headers
  raw?: string;                  // Base64 encoded raw email (if format="raw")
}
```

### Email Address Object

```typescript
interface EmailAddress {
  name?: string;     // Display name
  address: string;   // Email address
}
```

### Attachment Object

```typescript
interface EmailAttachment {
  filename: string;      // Attachment filename
  contentType: string;   // MIME type
  size: number;          // File size in bytes
  content: Buffer;       // File content as Buffer
}
```

## IMAP Search Criteria

The `customEmailRules` parameter accepts IMAP search criteria as a JSON array. Common criteria include:

- `"FROM"` - Search by sender
- `"TO"` - Search by recipient
- `"SUBJECT"` - Search in subject line
- `"SINCE"` - Messages since a date
- `"BEFORE"` - Messages before a date
- `"LARGER"` - Messages larger than size
- `"SMALLER"` - Messages smaller than size
- `"UNSEEN"` - Unread messages
- `"SEEN"` - Read messages

### Example Search Criteria

```json
[
  "FROM", "support@example.com",
  "SUBJECT", "urgent",
  "SINCE", "1-Jan-2024",
  "UNSEEN"
]
```

## Security Considerations

- **App Passwords**: For Gmail and other providers, use app-specific passwords instead of your main password
- **SSL/TLS**: Always enable SSL/TLS for production use
- **Certificate Validation**: Only disable certificate validation (`allowUnauthorizedCerts: true`) in development/testing environments
- **Credential Storage**: Store credentials securely using environment variables or secure configuration management

## Troubleshooting

### Common Connection Issues

1. **Authentication Failed**: Verify username/password and check if app-specific passwords are required
2. **Connection Refused**: Check if the port is correct and firewall settings
3. **SSL Certificate Errors**: Use `allowUnauthorizedCerts: true` for self-signed certificates (development only)
4. **IMAP Not Enabled**: Ensure IMAP is enabled in your email provider settings

### Performance Tips

- Use specific search criteria to reduce the number of emails processed
- Set appropriate reconnection intervals for your use case
- Consider using dedicated email accounts for automation to avoid conflicts
- Monitor memory usage when downloading large attachments

## Dependencies

- `imap-simple`: IMAP client library for Node.js
- `mailparser`: Email parsing and attachment extraction
- `@types/imap-simple`: TypeScript definitions for imap-simple
- `@types/mailparser`: TypeScript definitions for mailparser

## Related Nodes

- **Email Node**: Send emails as part of workflows
- **HTTP Node**: Make API calls based on email content
- **Logic Nodes**: Process email data and make decisions
- **Action Nodes**: Perform actions based on email triggers

## License

This node is part of the Nodey workflow engine and follows the same licensing terms as the main project.