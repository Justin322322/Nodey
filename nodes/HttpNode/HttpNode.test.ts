import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { executeHttpNode } from "./HttpNode.service";
import { NodeExecutionContext } from "../types";
import { HTTP_NODE_DEFINITION } from "./HttpNode.schema";
import { HttpNodeConfig } from "./HttpNode.types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("HttpNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("executeHttpNode", () => {
    const createContext = (
      config: Partial<HttpNodeConfig>
    ): NodeExecutionContext => ({
      nodeId: "test-node",
      workflowId: "test-workflow",
      config: config as Record<string, unknown>,
      input: {},
      previousNodes: [],
      executionId: "test-execution",
      signal: undefined,
    });

    it("should successfully execute a GET request", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({ success: true }),
      };
      mockResponse.headers.forEach = vi.fn((callback: (value: string, key: string) => void) => {
        callback("application/json", "content-type");
      });
      mockFetch.mockResolvedValue(mockResponse);

      const context = createContext({
        method: "GET",
        url: "https://api.example.com/test",
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({
        status: 200,
        data: { success: true },
        url: "https://api.example.com/test",
        method: "GET",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "User-Agent": "Workflow-Engine/1.0",
          }) as Record<string, string>,
        })
      );
    });

    it("should successfully execute a POST request with JSON body", async () => {
      const mockResponse = {
        status: 201,
        statusText: "Created",
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({ id: 123 }),
      };
      mockResponse.headers.forEach = vi.fn((callback: (value: string, key: string) => void) => {
        callback("application/json", "content-type");
      });
      mockFetch.mockResolvedValue(mockResponse);

      const context = createContext({
        method: "POST",
        url: "https://api.example.com/create",
        body: '{"name": "test"}',
        headers: { "Custom-Header": "value" },
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({
        status: 201,
        data: { id: 123 },
        method: "POST",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/create",
        expect.objectContaining({
          method: "POST",
          body: '{"name": "test"}',
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "Custom-Header": "value",
          }) as Record<string, string>,
        })
      );
    });

    it("should handle bearer token authentication", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: new Map(),
        text: vi.fn().mockResolvedValue("success"),
      };
      mockResponse.headers.forEach = vi.fn();
      mockFetch.mockResolvedValue(mockResponse);

      const context = createContext({
        method: "GET",
        url: "https://api.example.com/protected",
        authentication: {
          type: "bearer",
          value: "secret-token",
        },
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/protected",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer secret-token",
          }) as Record<string, string>,
        })
      );
    });

    it("should handle basic authentication", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: new Map(),
        text: vi.fn().mockResolvedValue("success"),
      };
      mockResponse.headers.forEach = vi.fn();
      mockFetch.mockResolvedValue(mockResponse);

      const context = createContext({
        method: "GET",
        url: "https://api.example.com/protected",
        authentication: {
          type: "basic",
          value: "dXNlcjpwYXNz", // base64 encoded user:pass
        },
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/protected",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Basic dXNlcjpwYXNz",
          }) as Record<string, string>,
        })
      );
    });

    it("should handle API key authentication", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: new Map(),
        text: vi.fn().mockResolvedValue("success"),
      };
      mockResponse.headers.forEach = vi.fn();
      mockFetch.mockResolvedValue(mockResponse);

      const context = createContext({
        method: "GET",
        url: "https://api.example.com/protected",
        authentication: {
          type: "apiKey",
          value: "api-key-123",
        },
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/protected",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-API-Key": "api-key-123",
          }) as Record<string, string>,
        })
      );
    });

    it("should return error for missing URL", async () => {
      const context = createContext({
        method: "GET",
        url: "",
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("URL is required");
    });

    it("should return error for invalid URL", async () => {
      const context = createContext({
        method: "GET",
        url: "not-a-valid-url",
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid URL format");
    });

    it("should return error for invalid JSON body", async () => {
      const context = createContext({
        method: "POST",
        url: "https://api.example.com/test",
        body: '{"invalid": json}',
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid body JSON format");
    });

    it("should return error for invalid JSON headers", async () => {
      const context = createContext({
        method: "GET",
        url: "https://api.example.com/test",
        headers: '{"invalid": json}' as unknown as Record<string, string>,
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid headers JSON format");
    });

    it("should handle HTTP error responses", async () => {
      const mockResponse = {
        status: 404,
        statusText: "Not Found",
        headers: new Map(),
        text: vi.fn().mockResolvedValue("Not found"),
      };
      mockResponse.headers.forEach = vi.fn();
      mockFetch.mockResolvedValue(mockResponse);

      const context = createContext({
        method: "GET",
        url: "https://api.example.com/notfound",
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("HTTP 404: Not Found");
      expect(result.output).toMatchObject({
        status: 404,
        data: "Not found",
      });
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const context = createContext({
        method: "GET",
        url: "https://api.example.com/test",
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error: Unable to reach the server");
    });

    it("should handle abort signal", async () => {
      const abortController = new AbortController();
      abortController.abort();

      const context = createContext({
        method: "GET",
        url: "https://api.example.com/test",
      });
      context.signal = abortController.signal;

      const result = await executeHttpNode(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Execution was cancelled");
    });

    it("should handle abort during request", async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      mockFetch.mockRejectedValue(abortError);

      const context = createContext({
        method: "GET",
        url: "https://api.example.com/test",
      });

      const result = await executeHttpNode(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Request was cancelled");
    });
  });

  describe("HTTP_NODE_DEFINITION", () => {
    describe("validation", () => {
      it("should validate required URL", () => {
        const errors = HTTP_NODE_DEFINITION.validate({});
        expect(errors).toContain("URL is required");
      });

      it("should validate URL format", () => {
        const errors = HTTP_NODE_DEFINITION.validate({ url: "not-a-url" });
        expect(errors).toContain("Invalid URL format");
      });

      it("should validate HTTP method", () => {
        const errors = HTTP_NODE_DEFINITION.validate({
          url: "https://example.com",
          method: "INVALID",
        });
        expect(errors).toContain("Invalid HTTP method: INVALID");
      });

      it("should validate authentication value when auth type is not none", () => {
        const errors = HTTP_NODE_DEFINITION.validate({
          url: "https://example.com",
          authentication: { type: "bearer", value: "" },
        });
        expect(errors).toContain(
          "Authentication value is required for selected auth type"
        );
      });

      it("should validate JSON headers", () => {
        const errors = HTTP_NODE_DEFINITION.validate({
          url: "https://example.com",
          headers: '{"invalid": json}',
        });
        expect(errors).toContain("Headers must be valid JSON");
      });

      it("should validate JSON body", () => {
        const errors = HTTP_NODE_DEFINITION.validate({
          url: "https://example.com",
          body: '{"invalid": json}',
        });
        expect(errors).toContain("Body must be valid JSON");
      });

      it("should pass validation for valid configuration", () => {
        const errors = HTTP_NODE_DEFINITION.validate({
          url: "https://api.example.com",
          method: "POST",
          headers: '{"Content-Type": "application/json"}',
          body: '{"key": "value"}',
          authentication: { type: "bearer", value: "token" },
        });
        expect(errors).toHaveLength(0);
      });
    });

    describe("getDefaults", () => {
      it("should return correct default configuration", () => {
        const defaults = HTTP_NODE_DEFINITION.getDefaults();
        expect(defaults).toEqual({
          method: "GET",
          url: "",
          headers: undefined,
          body: undefined,
          authentication: {
            type: "none",
            value: undefined,
          },
        });
      });
    });

    describe("schema properties", () => {
      it("should have correct node type and subtype", () => {
        expect(HTTP_NODE_DEFINITION.nodeType).toBe("action");
        expect(HTTP_NODE_DEFINITION.subType).toBe("http");
      });

      it("should have descriptive label and description", () => {
        expect(HTTP_NODE_DEFINITION.label).toBe("HTTP Request");
        expect(HTTP_NODE_DEFINITION.description).toBe(
          "Make an HTTP request to an external API"
        );
      });

      it("should have all required parameters", () => {
        const paramNames = HTTP_NODE_DEFINITION.parameters.map((p) => p.name);
        expect(paramNames).toContain("method");
        expect(paramNames).toContain("url");
        expect(paramNames).toContain("authentication.type");
        expect(paramNames).toContain("authentication.value");
        expect(paramNames).toContain("headers");
        expect(paramNames).toContain("body");
      });

      it("should have correct showIf conditions for conditional parameters", () => {
        const authValueParam = HTTP_NODE_DEFINITION.parameters.find(
          (p) => p.name === "authentication.value"
        );
        const bodyParam = HTTP_NODE_DEFINITION.parameters.find(
          (p) => p.name === "body"
        );

        // Auth value should show for bearer, basic, or apiKey (OR logic)
        expect(authValueParam?.showIf).toEqual([
          { path: "authentication.type", equals: "bearer" },
          { path: "authentication.type", equals: "basic" },
          { path: "authentication.type", equals: "apiKey" },
        ]);

        // Body should show for POST, PUT, or PATCH (OR logic)
        expect(bodyParam?.showIf).toEqual([
          { path: "method", equals: "POST" },
          { path: "method", equals: "PUT" },
          { path: "method", equals: "PATCH" },
        ]);

        // Note: UI uses OR logic (.some()) by default for showIf conditions
        // This allows mutually exclusive values to properly show conditional parameters
      });

      it("should have parameters without showIf conditions visible by default", () => {
        const methodParam = HTTP_NODE_DEFINITION.parameters.find(
          (p) => p.name === "method"
        );
        const urlParam = HTTP_NODE_DEFINITION.parameters.find(
          (p) => p.name === "url"
        );
        const authTypeParam = HTTP_NODE_DEFINITION.parameters.find(
          (p) => p.name === "authentication.type"
        );

        // These parameters should not have showIf conditions (always visible)
        expect(methodParam?.showIf).toBeUndefined();
        expect(urlParam?.showIf).toBeUndefined();
        expect(authTypeParam?.showIf).toBeUndefined();
      });
    });
  });
});
