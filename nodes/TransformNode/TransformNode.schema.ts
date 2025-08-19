import { NodeType, ActionType } from "@/types/workflow";
import { TransformNodeConfig } from "./TransformNode.types";
import { parse } from "espree";

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
    | "password";
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
  getDefaults: () => TransformNodeConfig;
}

export const TRANSFORM_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.ACTION,
  subType: ActionType.TRANSFORM,
  label: "Data Transform",
  description: "Transform data using JavaScript or JSONPath (placeholder implementation)",
  parameters: [
    {
      name: "operation",
      label: "Operation",
      type: "select",
      required: true,
      defaultValue: "map",
      options: [
        { label: "Map (Transform each item)", value: "map" },
        { label: "Filter (Select items)", value: "filter" },
        { label: "Reduce (Aggregate data)", value: "reduce" },
        { label: "Sort (Order items)", value: "sort" },
        { label: "Group (Group by key)", value: "group" },
        { label: "Merge (Combine objects)", value: "merge" },
      ],
      description: "Type of data transformation to perform",
    },
    {
      name: "language",
      label: "Script Language",
      type: "select",
      required: true,
      defaultValue: "javascript",
      options: [
        { label: "JavaScript", value: "javascript" },
        { label: "JSONPath", value: "jsonpath" },
      ],
      description: "Language for transformation script",
    },
    {
      name: "script",
      label: "Transformation Script",
      type: "textarea",
      required: true,
      defaultValue: "",
      placeholder: "// For map operation:\nreturn { ...item, processed: true }",
      description: "Script to transform the data",
    },
    {
      name: "inputPath",
      label: "Input Path",
      type: "text",
      required: false,
      defaultValue: "",
      placeholder: "data.items",
      description: "JSONPath to extract input data (optional)",
    },
    {
      name: "outputPath",
      label: "Output Path",
      type: "text",
      required: false,
      defaultValue: "",
      placeholder: "result.transformed",
      description: "Path to store transformed data (optional)",
    },
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = [];
    const typed = config as unknown as TransformNodeConfig;

    // Validate operation
    const validOperations = ["map", "filter", "reduce", "sort", "group", "merge"];
    if (!typed.operation || !validOperations.includes(typed.operation)) {
      errors.push("Valid operation is required");
    }

    // Validate language
    const validLanguages = ["javascript", "jsonpath"];
    if (!typed.language || !validLanguages.includes(typed.language)) {
      errors.push("Valid script language is required");
    }

    // Validate script
    if (!typed.script || typeof typed.script !== "string" || typed.script.trim().length === 0) {
      errors.push("Transformation script is required");
    }

    // Safe JavaScript syntax validation using static parser
    if (typed.language === "javascript" && typed.script) {
      try {
        // Parse the script using espree - this only validates syntax without execution
        // Wrap in a function context to validate it as a function body
        const wrappedScript = `function transform(item, index, array) {\n${typed.script}\n}`;
        parse(wrappedScript, {
          ecmaVersion: 2020,
          sourceType: "script"
        });
      } catch (parseError: unknown) {
        const errorMessage = parseError instanceof Error ? parseError.message : "Unknown parsing error";
        errors.push(`Invalid JavaScript syntax in transformation script: ${errorMessage}`);
      }
    }
    
    // Note: For production environments, consider additional server-side validation 
    // using a secure sandbox for extra safety when executing user scripts

    return errors;
  },
  getDefaults: (): TransformNodeConfig => ({
    operation: "map",
    language: "javascript",
    script: "",
    inputPath: "",
    outputPath: "",
  }),
};
