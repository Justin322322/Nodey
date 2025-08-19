import { NodeType, ActionType } from "@/types/workflow";
import { DatabaseNodeConfig } from "./DatabaseNode.types";
import { credentialStore, migrateConnectionStringToCredential } from "@/lib/credential-store";
import { validateDatabaseNodeConfig, migrateDatabaseNodeConfig } from "@/lib/migration-utils";
import { CredentialType } from "@/types/credentials";

interface ParameterDefinition {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "boolean"
    | "email"
    | "url"
    | "json"
    | "password"
    | "credential";
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }> | (() => Array<{ label: string; value: string }>);
  placeholder?: string;
  description?: string;
  showIf?: Array<{ path: string; equals: string | number | boolean }>;
  credentialType?: CredentialType;
}

/**
 * Type guard to validate if an object is a valid DatabaseNodeConfig
 */
function isDatabaseNodeConfig(obj: Record<string, unknown>): obj is DatabaseNodeConfig & Record<string, unknown> {
  // Check if obj is an object and not null
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // Check operation field
  const validOperations = ["select", "insert", "update", "delete"] as const;
  if (typeof obj.operation !== 'string' || !validOperations.includes(obj.operation as DatabaseNodeConfig['operation'])) {
    return false;
  }

  // Check credentialId field (new) or connectionString field (legacy)
  const hasCredentialId = typeof obj.credentialId === 'string' && obj.credentialId.trim().length > 0;
  const hasConnectionString = typeof obj.connectionString === 'string' && obj.connectionString.trim().length > 0;
  
  if (!hasCredentialId && !hasConnectionString) {
    return false;
  }

  // Check query field
  if (typeof obj.query !== 'string') {
    return false;
  }

  // Check optional parameters field
  if (obj.parameters !== undefined && 
      (typeof obj.parameters !== 'string' && (typeof obj.parameters !== 'object' || obj.parameters === null || Array.isArray(obj.parameters)))) {
    return false;
  }

  // Check optional schema field
  if (obj.schema !== undefined && typeof obj.schema !== 'string') {
    return false;
  }

  // Check optional table field
  if (obj.table !== undefined && typeof obj.table !== 'string') {
    return false;
  }

  return true;
}

// nodes/DatabaseNode/DatabaseNode.schema.ts

interface NodeDefinition<T = Record<string, unknown>> {
  nodeType: NodeType;
  subType: ActionType;
  label: string;
  description: string;
  parameters: ParameterDefinition[];
  validate: (config: T) => string[];
  getDefaults: () => DatabaseNodeConfig;
}

export const DATABASE_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.ACTION,
  subType: ActionType.DATABASE,
  label: "Database Query",
  description: "Execute database queries (placeholder implementation)",
  parameters: [
    {
      name: "operation",
      label: "Operation",
      type: "select",
      required: true,
      defaultValue: "select",
      options: [
        { label: "Select", value: "select" },
        { label: "Insert", value: "insert" },
        { label: "Update", value: "update" },
        { label: "Delete", value: "delete" },
      ],
      description: "Database operation to perform",
    },
    {
      name: "credentialId",
      label: "Database Credential",
      type: "credential",
      credentialType: "database",
      required: true,
      defaultValue: "",
      placeholder: "Select or create a database credential",
      description: "Secure database connection credential",
      options: () => {
        const credentials = credentialStore.getCredentialsByType('database') || [];
        return credentials.map(cred => ({
          label: `${cred.name} (${cred.description || 'No description'})`,
          value: cred.id
        }));
      },
    },
    {
      name: "query",
      label: "SQL Query",
      type: "textarea",
      required: true,
      defaultValue: "",
      placeholder: "SELECT * FROM users WHERE id = $1",
      description: "SQL query to execute",
    },
    {
      name: "parameters",
      label: "Parameters (JSON)",
      type: "json",
      required: false,
      placeholder: '{"param1": "value1"}',
      description: "Query parameters as JSON object",
    },
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = [];

    // First check if the config structure is valid using type guard
    if (!isDatabaseNodeConfig(config)) {
      errors.push("Invalid configuration structure");
      return errors; // Return early if structure is invalid
    }

    // Now we can safely use config as DatabaseNodeConfig
    const typed = config as DatabaseNodeConfig & Record<string, unknown>;

    // Validate operation (additional business logic validation)
    if (!typed.operation || typed.operation.trim().length === 0) {
      errors.push("Valid operation is required");
    }

    // Use migration utilities for credential validation
    const credentialErrors = validateDatabaseNodeConfig(typed);
    errors.push(...credentialErrors);

    // Validate query (additional business logic validation)
    if (!typed.query || typed.query.trim().length === 0) {
      errors.push("SQL query is required");
    }

    // Additional validation for parameters content if provided
    if (typed.parameters !== undefined && typed.parameters !== null) {
      let parsedParameters: unknown;
      
      // Check if parameters is a string and attempt JSON parsing
      if (typeof typed.parameters === 'string') {
        try {
          parsedParameters = JSON.parse(typed.parameters);
        } catch (e) {
          errors.push("Invalid parameters JSON: Unable to parse JSON string");
          return errors; // Return early if JSON parsing fails
        }
      } else {
        parsedParameters = typed.parameters;
      }
      
      // Validate that the parsed/provided value is a proper object
      if (parsedParameters === null) {
        errors.push("Parameters cannot be null");
      } else if (Array.isArray(parsedParameters)) {
        errors.push("Parameters must be an object, not an array");
      } else if (typeof parsedParameters !== 'object') {
        errors.push("Parameters must be an object");
      } else {
        // If we parsed from string, replace the original value for subsequent validation
        if (typeof typed.parameters === 'string') {
          typed.parameters = parsedParameters as Record<string, unknown>;
        }
      }
    }

    return errors;
  },
  getDefaults: (): DatabaseNodeConfig => ({
    operation: "select",
    credentialId: "",
    query: "",
    parameters: {},
  }),
};
