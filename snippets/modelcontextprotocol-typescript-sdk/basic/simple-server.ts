/**
 * Simple MCP Server with Bun
 * 
 * A minimal example showing how to create an MCP server with basic tools
 * using the official TypeScript SDK and Bun runtime.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "simple-server",
  version: "1.0.0"
});

// Register a basic echo tool
server.registerTool(
  "echo",
  {
    title: "Echo Tool",
    description: "Echo back the provided message",
    inputSchema: {
      message: z.string().min(1, "Message cannot be empty")
    }
  },
  async ({ message }) => ({
    content: [{
      type: "text",
      text: `Echo: ${message}`
    }]
  })
);

// Register a calculator tool
server.registerTool(
  "add",
  {
    title: "Addition Tool",
    description: "Add two numbers together",
    inputSchema: {
      a: z.number(),
      b: z.number()
    }
  },
  async ({ a, b }) => ({
    content: [{
      type: "text",
      text: `${a} + ${b} = ${a + b}`
    }]
  })
);

// Register a system info tool
server.registerTool(
  "system-info",
  {
    title: "System Information",
    description: "Get basic system information",
    inputSchema: {}
  },
  async () => ({
    content: [{
      type: "text",
      text: JSON.stringify({
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        bunVersion: Bun.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }, null, 2)
    }]
  })
);

// Connect to stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Simple MCP server started");