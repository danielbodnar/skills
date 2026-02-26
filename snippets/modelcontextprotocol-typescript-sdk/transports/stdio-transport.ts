/**
 * Stdio Transport Examples
 * 
 * Demonstrates how to use the stdio transport for desktop applications
 * and command-line integrations.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";

// === SERVER SIDE ===

export class StdioMCPServer {
  private server: McpServer;
  private transport: StdioServerTransport;

  constructor(name: string, version: string) {
    this.server = new McpServer({ name, version });
    this.transport = new StdioServerTransport();
    
    this.setupErrorHandling();
    this.registerDefaultTools();
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("MCP Server error:", error);
    };

    this.transport.onerror = (error) => {
      console.error("Stdio transport error:", error);
    };

    // Handle process signals
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  private registerDefaultTools() {
    // Process information tool
    this.server.registerTool(
      "process-info",
      {
        title: "Process Information",
        description: "Get current process information",
        inputSchema: {}
      },
      async () => ({
        content: [{
          type: "text",
          text: JSON.stringify({
            pid: process.pid,
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            argv: process.argv,
            cwd: process.cwd(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
          }, null, 2)
        }]
      })
    );

    // Environment variables tool
    this.server.registerTool(
      "env-var",
      {
        title: "Environment Variable",
        description: "Get or list environment variables",
        inputSchema: {
          name: z.string().optional(),
          list: z.boolean().default(false)
        }
      },
      async ({ name, list }) => {
        if (list) {
          // List all environment variables (filtered for security)
          const safeEnvVars = Object.fromEntries(
            Object.entries(process.env).filter(([key]) => 
              !key.toLowerCase().includes('password') &&
              !key.toLowerCase().includes('secret') &&
              !key.toLowerCase().includes('token') &&
              !key.toLowerCase().includes('key')
            )
          );
          
          return {
            content: [{
              type: "text", 
              text: JSON.stringify(safeEnvVars, null, 2)
            }]
          };
        }

        if (name) {
          const value = process.env[name];
          return {
            content: [{
              type: "text",
              text: value ? `${name}=${value}` : `Environment variable '${name}' not found`
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: "Please specify either a variable name or set list=true"
          }],
          isError: true
        };
      }
    );

    // File system operations
    this.server.registerTool(
      "fs-stat",
      {
        title: "File System Stats",
        description: "Get file or directory statistics",
        inputSchema: {
          path: z.string().min(1, "Path is required")
        }
      },
      async ({ path }) => {
        try {
          const stat = await Bun.file(path).exists();
          if (!stat) {
            return {
              content: [{
                type: "text",
                text: `Path does not exist: ${path}`
              }],
              isError: true
            };
          }

          const file = Bun.file(path);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                path,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error accessing path: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );
  }

  public registerTool(name: string, config: any, handler: any) {
    this.server.registerTool(name, config, handler);
  }

  public registerResource(name: string, uri: any, config: any, handler: any) {
    this.server.registerResource(name, uri, config, handler);
  }

  public registerPrompt(name: string, config: any, handler: any) {
    this.server.registerPrompt(name, config, handler);
  }

  public async start() {
    await this.server.connect(this.transport);
    console.error(`MCP Server ${this.server.name} started on stdio`);
  }

  private async shutdown() {
    console.error("Shutting down MCP server...");
    await this.server.close();
    process.exit(0);
  }
}

// === CLIENT SIDE ===

export class StdioMCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;

  constructor(name: string, version: string) {
    this.client = new Client({ name, version });
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.client.onerror = (error) => {
      console.error("MCP Client error:", error);
    };
  }

  public async connect(command: string, args: string[] = [], options: any = {}) {
    this.transport = new StdioClientTransport({
      command,
      args,
      env: { ...process.env, ...options.env },
      cwd: options.cwd
    });

    this.transport.onerror = (error) => {
      console.error("Stdio transport error:", error);
    };

    await this.client.connect(this.transport);
    console.log(`Connected to MCP server: ${command} ${args.join(' ')}`);
  }

  public async listTools() {
    return await this.client.listTools();
  }

  public async callTool(name: string, arguments: any) {
    return await this.client.callTool({ name, arguments });
  }

  public async listResources() {
    return await this.client.listResources();
  }

  public async readResource(uri: string) {
    return await this.client.readResource({ uri });
  }

  public async listPrompts() {
    return await this.client.listPrompts();
  }

  public async getPrompt(name: string, arguments: any) {
    return await this.client.getPrompt({ name, arguments });
  }

  public async close() {
    await this.client.close();
    console.log("Disconnected from MCP server");
  }
}

// === USAGE EXAMPLES ===

// Example: Start a simple server
export async function startExampleServer() {
  const server = new StdioMCPServer("stdio-example", "1.0.0");
  
  // Add custom tool
  server.registerTool(
    "echo-advanced",
    {
      title: "Advanced Echo",
      description: "Echo with formatting options",
      inputSchema: {
        message: z.string(),
        format: z.enum(["plain", "json", "xml"]).default("plain"),
        repeat: z.number().int().min(1).max(10).default(1)
      }
    },
    async ({ message, format, repeat }) => {
      let output = message;
      
      switch (format) {
        case "json":
          output = JSON.stringify({ message, timestamp: new Date().toISOString() });
          break;
        case "xml":
          output = `<message timestamp="${new Date().toISOString()}">${message}</message>`;
          break;
      }
      
      const repeated = Array(repeat).fill(output).join('\n');
      
      return {
        content: [{
          type: "text",
          text: repeated
        }]
      };
    }
  );

  await server.start();
}

// Example: Client interaction
export async function clientExample() {
  const client = new StdioMCPClient("stdio-client", "1.0.0");
  
  try {
    // Connect to server (replace with actual server command)
    await client.connect("bun", ["run", "stdio-server.ts"]);
    
    // List available tools
    const tools = await client.listTools();
    console.log("Available tools:", tools.tools.map(t => t.name));
    
    // Call a tool
    const result = await client.callTool("echo-advanced", {
      message: "Hello from stdio client!",
      format: "json",
      repeat: 2
    });
    
    console.log("Tool result:", result.content[0].text);
    
  } catch (error) {
    console.error("Client error:", error);
  } finally {
    await client.close();
  }
}

// Run server if this file is executed directly
if (import.meta.main) {
  startExampleServer().catch(console.error);
}