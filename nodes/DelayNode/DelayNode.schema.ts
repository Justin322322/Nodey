import { NodeType, ActionType } from "@/types/workflow";
import { DelayNodeConfig, getDelayMs } from "./DelayNode.types";

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
  getDefaults: () => DelayNodeConfig;
}

export const DELAY_NODE_DEFINITION: NodeDefinition = {
  nodeType: NodeType.ACTION,
  subType: ActionType.DELAY,
  label: "Delay",
  description: "Add a delay/wait period in workflow execution (placeholder implementation)",
  parameters: [
    {
      name: "delayType",
      label: "Delay Type",
      type: "select",
      required: true,
      defaultValue: "fixed",
      options: [
        { label: "Fixed Duration", value: "fixed" },
        { label: "Random Duration", value: "random" },
        { label: "Exponential Backoff", value: "exponential" },
      ],
      description: "Type of delay to apply",
    },
    {
      name: "value",
      label: "Delay Value",
      type: "number",
      required: true,
      defaultValue: 1,
      placeholder: "5",
      description: "Duration value for the delay",
    },
    {
      name: "unit",
      label: "Time Unit",
      type: "select",
      required: true,
      defaultValue: "seconds",
      options: [
        { label: "Milliseconds", value: "milliseconds" },
        { label: "Seconds", value: "seconds" },
        { label: "Minutes", value: "minutes" },
        { label: "Hours", value: "hours" },
      ],
      description: "Time unit for the delay value",
    },
    {
      name: "maxDelayMs",
      label: "Max Delay (ms)",
      type: "number",
      required: false,
      placeholder: "60000",
      description: "Maximum delay in milliseconds (for random/exponential)",
      showIf: [
        { path: "delayType", equals: "random" },
        { path: "delayType", equals: "exponential" },
      ],
    },
    {
      name: "passthrough",
      label: "Pass Through Data",
      type: "boolean",
      required: false,
      defaultValue: true,
      description: "Whether to pass input data through to the output",
    },
  ],
  validate: (config: Record<string, unknown>): string[] => {
    const errors: string[] = [];
    const typed = config as unknown as DelayNodeConfig;

    // Validate delay type
    const validDelayTypes = ["fixed", "random", "exponential"];
    if (!typed.delayType || !validDelayTypes.includes(typed.delayType)) {
      errors.push("Valid delay type is required");
    }

    // Validate delay value
    if (typeof typed.value !== "number" || typed.value < 0) {
      errors.push("Delay value must be a non-negative number");
    }

    // Validate unit
    const validUnits = ["milliseconds", "seconds", "minutes", "hours"];
    if (!typed.unit || !validUnits.includes(typed.unit)) {
      errors.push("Valid time unit is required");
    }

    // Calculate delay in milliseconds for validation
    if (typeof typed.value === "number" && typed.unit) {
      try {
        const delayMs = getDelayMs({ value: typed.value, unit: typed.unit });
        
        // Validate reasonable delay limits
        if (delayMs > 24 * 60 * 60 * 1000) { // 24 hours
          errors.push("Delay cannot exceed 24 hours");
        }
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error.message);
        }
      }
    }

    // Validate max delay for random/exponential types
    if (typed.delayType === "random" || typed.delayType === "exponential") {
      if (typed.maxDelayMs !== undefined && typed.maxDelayMs !== null) {
        if (typeof typed.maxDelayMs !== "number" || typed.maxDelayMs <= 0) {
          errors.push("Max delay must be a positive number");
        }
      }
    }

    return errors;
  },
  getDefaults: (): DelayNodeConfig => ({
    delayType: "fixed",
    unit: "seconds",
    value: 1,
    passthrough: true,
  }),
};
