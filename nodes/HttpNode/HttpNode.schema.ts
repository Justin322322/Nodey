import { NodeType, ActionType } from "@/types/workflow";
import { HttpNodeConfig } from "./HttpNode.types";

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
    | "json";
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  description?: string;
  showIf?: Array<{ path: string; equals: string | number | boolean }>;
}

interface NodeDefinition {
  nodeType: NodeType;
  subType: ActionType;
  label: string;
  description: string;
  parameters: ParameterDefinition[];
  validate: (config: Record<string, unknown>) => string[];
  getDefaults: () => HttpNodeConfig;
}

export const HTTP_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.ACTION,
  subType: ActionType.HTTP,
  label: "HTTP Request",
  description: "Make an HTTP request to an external API",
  parameters: [
    {
      name: "method",
      label: "Method",
      type: "select",
      required: true,
      defaultValue: "GET",
      options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
        { label: "PATCH", value: "PATCH" },
      ],
      description: "HTTP method to use for the request",
    },
    {
      name: "url",
      label: "URL",
      type: "url",
      required: true,
      defaultValue: "",
      placeholder: "https://api.example.com/endpoint",
      description: "Full URL to request",
    },
    {
      name: "authentication.type",
      label: "Authentication",
      type: "select",
      required: false,
      defaultValue: "none",
      options: [
        { label: "None", value: "none" },
        { label: "Bearer Token", value: "bearer" },
        { label: "Basic (Base64 user:pass)", value: "basic" },
        { label: "API Key (Header)", value: "apiKey" },
      ],
      description: "Authentication method to use",
    },
    {
      name: "authentication.value",
      label: "Auth Value",
      type: "text",
      required: false,
      placeholder: "Enter token, credentials, or API key",
      description: "Authentication value (token, credentials, or API key)",
      showIf: [
        { path: "authentication.type", equals: "bearer" },
        { path: "authentication.type", equals: "basic" },
        { path: "authentication.type", equals: "apiKey" },
      ],
    },
    {
      name: "headers",
      label: "Headers (JSON)",
      type: "json",
      required: false,
      placeholder: '{"Content-Type": "application/json"}',
      description: "Additional headers to include in the request",
    },
    {
      name: "body",
      label: "Body (JSON)",
      type: "json",
      required: false,
      placeholder: '{"key": "value"}',
      description: "Request body data",
      showIf: [
        { path: "method", equals: "POST" },
        { path: "method", equals: "PUT" },
        { path: "method", equals: "PATCH" },
      ],
    },
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = [];
    const typed = config as unknown as HttpNodeConfig;

    // Validate URL
    if (
      !typed.url ||
      typeof typed.url !== "string" ||
      typed.url.trim().length === 0
    ) {
      errors.push("URL is required");
    } else {
      try {
        const url = new URL(typed.url);
        // Ensure HTTPS in production
        if (
          process.env.NODE_ENV === "production" &&
          url.protocol !== "https:"
        ) {
          errors.push("HTTPS is required for production requests");
        }
      } catch {
        errors.push("Invalid URL format");
      }
    }

    // Validate HTTP method
    const method = (typed.method as string) || "GET";
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    if (!validMethods.includes(method)) {
      errors.push(`Invalid HTTP method: ${method}`);
    }

    // Validate authentication
    if (typed.authentication && typed.authentication.type !== "none") {
      if (
        !typed.authentication.value ||
        typeof typed.authentication.value !== "string" ||
        typed.authentication.value.trim().length === 0
      ) {
        errors.push("Authentication value is required for selected auth type");
      }
    }

    // Validate headers JSON if provided
    if (typed.headers && typeof typed.headers === "string") {
      try {
        JSON.parse(typed.headers);
      } catch {
        errors.push("Headers must be valid JSON");
      }
    }

    // Validate body JSON if provided
    if (typed.body && typeof typed.body === "string") {
      try {
        const parsed = JSON.parse(typed.body) as unknown;
        // Check size limit (e.g., 1MB)
        if (JSON.stringify(parsed).length > 1024 * 1024) {
          errors.push("Request body exceeds 1MB limit");
        }
      } catch {
        errors.push("Body must be valid JSON");
      }
    }

    return errors;
  },
  getDefaults: (): HttpNodeConfig => ({
    method: "GET",
    url: "",
    headers: undefined,
    body: undefined,
    authentication: {
      type: "none",
      value: undefined,
    },
  }),
};
