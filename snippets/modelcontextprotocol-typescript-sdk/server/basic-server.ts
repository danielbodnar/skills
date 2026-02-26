/**
 * Basic MCP Server with Multiple Components
 * 
 * Demonstrates how to create a complete MCP server with tools, resources, 
 * and prompts using the TypeScript SDK.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "basic-server",
  version: "1.0.0"
});

// === TOOLS ===

// Math operations tool with error handling
server.registerTool(
  "calculate",
  {
    title: "Calculator",
    description: "Perform basic mathematical operations",
    inputSchema: {
      operation: z.enum(["add", "subtract", "multiply", "divide", "power", "sqrt"]),
      a: z.number(),
      b: z.number().optional()
    }
  },
  async ({ operation, a, b }) => {
    let result: number;
    
    try {
      switch (operation) {
        case "add":
          if (b === undefined) throw new Error("Second number required for addition");
          result = a + b;
          break;
        case "subtract":
          if (b === undefined) throw new Error("Second number required for subtraction");
          result = a - b;
          break;
        case "multiply":
          if (b === undefined) throw new Error("Second number required for multiplication");
          result = a * b;
          break;
        case "divide":
          if (b === undefined) throw new Error("Second number required for division");
          if (b === 0) throw new Error("Cannot divide by zero");
          result = a / b;
          break;
        case "power":
          if (b === undefined) throw new Error("Exponent required for power operation");
          result = Math.pow(a, b);
          break;
        case "sqrt":
          if (a < 0) throw new Error("Cannot take square root of negative number");
          result = Math.sqrt(a);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        content: [{
          type: "text",
          text: `Result: ${result}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Text processing tool
server.registerTool(
  "text-transform",
  {
    title: "Text Transformer",
    description: "Transform text in various ways",
    inputSchema: {
      text: z.string().min(1, "Text cannot be empty"),
      transform: z.enum(["uppercase", "lowercase", "reverse", "word-count", "char-count"])
    }
  },
  async ({ text, transform }) => {
    let result: string;

    switch (transform) {
      case "uppercase":
        result = text.toUpperCase();
        break;
      case "lowercase":
        result = text.toLowerCase();
        break;
      case "reverse":
        result = text.split("").reverse().join("");
        break;
      case "word-count":
        result = `Word count: ${text.split(/\s+/).filter(word => word.length > 0).length}`;
        break;
      case "char-count":
        result = `Character count: ${text.length}`;
        break;
      default:
        result = text;
    }

    return {
      content: [{
        type: "text",
        text: result
      }]
    };
  }
);

// === RESOURCES ===

// Static configuration resource
server.registerResource(
  "config",
  "config://server",
  {
    title: "Server Configuration",
    description: "Current server configuration and status",
    mimeType: "application/json"
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify({
        serverName: server.name,
        serverVersion: server.version,
        startTime: new Date().toISOString(),
        platform: process.platform,
        nodeVersion: process.version,
        bunVersion: Bun.version
      }, null, 2),
      mimeType: "application/json"
    }]
  })
);

// Dynamic user data resource
server.registerResource(
  "user-data",
  new ResourceTemplate("user://{userId}", { list: undefined }),
  {
    title: "User Data",
    description: "Mock user data for testing"
  },
  async (uri, { userId }) => {
    // Mock user database
    const users = {
      "1": { id: "1", name: "Alice", role: "admin", active: true },
      "2": { id: "2", name: "Bob", role: "user", active: true },
      "3": { id: "3", name: "Charlie", role: "user", active: false }
    };

    const user = users[userId as keyof typeof users];
    
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(user, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

// === PROMPTS ===

// Code review prompt
server.registerPrompt(
  "code-review",
  {
    title: "Code Review",
    description: "Generate a code review prompt",
    argsSchema: {
      language: z.string(),
      code: z.string(),
      focus: z.enum(["security", "performance", "readability", "best-practices"]).optional()
    }
  },
  ({ language, code, focus }) => {
    const focusText = focus ? ` with a focus on ${focus}` : "";
    
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please review this ${language} code${focusText}:\n\n\`\`\`${language}\n${code}\n\`\`\``
        }
      }]
    };
  }
);

// Documentation prompt
server.registerPrompt(
  "document-function",
  {
    title: "Function Documentation",
    description: "Generate documentation for a function",
    argsSchema: {
      functionName: z.string(),
      functionCode: z.string(),
      style: z.enum(["jsdoc", "typescript", "markdown"]).default("jsdoc")
    }
  },
  ({ functionName, functionCode, style }) => {
    const styleInstructions = {
      jsdoc: "Generate JSDoc comments",
      typescript: "Generate TypeScript documentation comments",
      markdown: "Generate markdown documentation"
    };

    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `${styleInstructions[style]} for this function:\n\nFunction name: ${functionName}\n\n\`\`\`\n${functionCode}\n\`\`\``
        }
      }]
    };
  }
);

// === ERROR HANDLING ===

server.onerror = (error) => {
  console.error("Server error:", error);
};

// === START SERVER ===

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Basic MCP server started with tools, resources, and prompts");