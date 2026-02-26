/**
 * HTTP Transport Examples
 * 
 * Demonstrates how to use HTTP transports for web services and cloud deployments
 * with both Bun.serve and Express.js examples.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";

// === BUN HTTP SERVER ===

export class BunHTTPMCPServer {
  private server: McpServer;
  private port: number;

  constructor(name: string, version: string, port = 3000) {
    this.server = new McpServer({ name, version });
    this.port = port;
    this.setupDefaultTools();
  }

  private setupDefaultTools() {
    // HTTP-specific system info
    this.server.registerTool(
      "server-status",
      {
        title: "Server Status",
        description: "Get HTTP server status information",
        inputSchema: {}
      },
      async () => ({
        content: [{
          type: "text",
          text: JSON.stringify({
            serverName: this.server.name,
            version: this.server.version,
            port: this.port,
            transport: "HTTP",
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      })
    );

    // Request info tool (will be enhanced with request context)
    this.server.registerTool(
      "request-info",
      {
        title: "Request Information",
        description: "Get information about the current HTTP request",
        inputSchema: {}
      },
      async (_, context) => {
        // In a real implementation, context would contain request information
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              method: "POST",
              path: "/mcp",
              headers: "Available in transport context",
              clientIP: "Available in transport context"
            }, null, 2)
          }]
        };
      }
    );
  }

  public registerTool(name: string, config: any, handler: any) {
    this.server.registerTool(name, config, handler);
  }

  public async start() {
    console.log(`Starting MCP HTTP server on port ${this.port}`);

    const server = Bun.serve({
      port: this.port,
      async fetch(req: Request) {
        const url = new URL(req.url);
        
        // Handle CORS preflight
        if (req.method === "OPTIONS") {
          return new Response(null, {
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, mcp-session-id"
            }
          });
        }

        // MCP endpoint
        if (url.pathname === "/mcp") {
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            enableDnsRebindingProtection: true,
            allowedHosts: ['127.0.0.1', 'localhost'],
            allowedOrigins: ['http://localhost:3000']
          });

          // Connect server to transport
          await this.server.connect(transport);
          
          // Handle the request
          const response = await transport.handleRequest(req);
          
          // Add CORS headers
          response.headers.set("Access-Control-Allow-Origin", "*");
          response.headers.set("Access-Control-Expose-Headers", "mcp-session-id");
          
          return response;
        }

        // Health check endpoint
        if (url.pathname === "/health") {
          return new Response(JSON.stringify({
            status: "healthy",
            server: this.server.name,
            timestamp: new Date().toISOString()
          }), {
            headers: { "Content-Type": "application/json" }
          });
        }

        // API documentation
        if (url.pathname === "/") {
          return new Response(`
            <html>
              <head><title>MCP HTTP Server</title></head>
              <body>
                <h1>MCP HTTP Server</h1>
                <p>Server: ${this.server.name}</p>
                <p>Endpoints:</p>
                <ul>
                  <li><code>POST /mcp</code> - MCP protocol endpoint</li>
                  <li><code>GET /health</code> - Health check</li>
                  <li><code>GET /</code> - This documentation</li>
                </ul>
              </body>
            </html>
          `, {
            headers: { "Content-Type": "text/html" }
          });
        }

        return new Response("Not Found", { status: 404 });
      }
    });

    console.log(`MCP HTTP server listening on http://localhost:${this.port}`);
    console.log(`Health check: http://localhost:${this.port}/health`);
    console.log(`MCP endpoint: http://localhost:${this.port}/mcp`);
    
    return server;
  }
}

// === EXPRESS.JS HTTP SERVER ===

export class ExpressMCPServer {
  private server: McpServer;
  private transports = new Map<string, StreamableHTTPServerTransport>();

  constructor(name: string, version: string) {
    this.server = new McpServer({ name, version });
    this.setupDefaultTools();
  }

  private setupDefaultTools() {
    this.server.registerTool(
      "session-info",
      {
        title: "Session Information",
        description: "Get current session information",
        inputSchema: {}
      },
      async () => ({
        content: [{
          type: "text",
          text: JSON.stringify({
            totalSessions: this.transports.size,
            activeSessions: Array.from(this.transports.keys())
          }, null, 2)
        }]
      })
    );
  }

  public createExpressApp() {
    // Note: This is a conceptual example - you'd need to install express
    // bun add express @types/express
    
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    // CORS middleware
    app.use((req: any, res: any, next: any) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
      res.header('Access-Control-Expose-Headers', 'mcp-session-id');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // MCP endpoint
    app.post('/mcp', async (req: any, res: any) => {
      const sessionId = req.headers['mcp-session-id'];
      let transport: StreamableHTTPServerTransport;

      if (sessionId && this.transports.has(sessionId)) {
        transport = this.transports.get(sessionId)!;
      } else {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            this.transports.set(id, transport);
          },
          enableDnsRebindingProtection: true,
          allowedHosts: ['127.0.0.1', 'localhost']
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            this.transports.delete(transport.sessionId);
          }
        };

        await this.server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    });

    // Server-sent events for notifications
    app.get('/mcp', async (req: any, res: any) => {
      const sessionId = req.headers['mcp-session-id'];
      const transport = this.transports.get(sessionId);
      
      if (transport) {
        await transport.handleRequest(req, res);
      } else {
        res.status(400).send('Invalid session ID');
      }
    });

    // Session termination
    app.delete('/mcp', async (req: any, res: any) => {
      const sessionId = req.headers['mcp-session-id'];
      const transport = this.transports.get(sessionId);
      
      if (transport) {
        await transport.handleRequest(req, res);
        this.transports.delete(sessionId);
      } else {
        res.status(400).send('Invalid session ID');
      }
    });

    // Health check
    app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        server: this.server.name,
        sessions: this.transports.size,
        timestamp: new Date().toISOString()
      });
    });

    return app;
  }
}

// === HTTP CLIENT ===

export class HTTPMCPClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport | null = null;

  constructor(name: string, version: string) {
    this.client = new Client({ name, version });
  }

  public async connect(baseUrl: string) {
    this.transport = new StreamableHTTPClientTransport(new URL(baseUrl));
    await this.client.connect(this.transport);
    console.log(`Connected to MCP HTTP server at ${baseUrl}`);
  }

  public async listTools() {
    return await this.client.listTools();
  }

  public async callTool(name: string, arguments: any) {
    return await this.client.callTool({ name, arguments });
  }

  public async close() {
    await this.client.close();
    console.log("Disconnected from MCP HTTP server");
  }
}

// === USAGE EXAMPLES ===

// Example: Start Bun HTTP server
export async function startBunServer() {
  const server = new BunHTTPMCPServer("bun-http-server", "1.0.0", 3000);
  
  // Add custom tool
  server.registerTool(
    "timestamp",
    {
      title: "Current Timestamp", 
      description: "Get current timestamp in various formats",
      inputSchema: {
        format: z.enum(["iso", "unix", "locale"]).default("iso")
      }
    },
    async ({ format }) => {
      const now = new Date();
      let timestamp: string;

      switch (format) {
        case "unix":
          timestamp = Math.floor(now.getTime() / 1000).toString();
          break;
        case "locale":
          timestamp = now.toLocaleString();
          break;
        default:
          timestamp = now.toISOString();
      }

      return {
        content: [{
          type: "text",
          text: `Current time (${format}): ${timestamp}`
        }]
      };
    }
  );

  await server.start();
}

// Example: Start Express server
export async function startExpressServer() {
  const mcpServer = new ExpressMCPServer("express-mcp-server", "1.0.0");
  const app = mcpServer.createExpressApp();
  
  const PORT = process.env.PORT || 3001;
  
  app.listen(PORT, () => {
    console.log(`Express MCP server listening on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`MCP: http://localhost:${PORT}/mcp`);
  });
}

// Example: HTTP client usage
export async function httpClientExample() {
  const client = new HTTPMCPClient("http-client", "1.0.0");
  
  try {
    await client.connect("http://localhost:3000/mcp");
    
    const tools = await client.listTools();
    console.log("Available tools:", tools.tools.map(t => t.name));
    
    const result = await client.callTool("server-status", {});
    console.log("Server status:", result.content[0].text);
    
  } catch (error) {
    console.error("HTTP client error:", error);
  } finally {
    await client.close();
  }
}

// === ADVANCED FEATURES ===

// Rate limiting middleware
export function createRateLimitedServer(name: string, version: string) {
  const server = new McpServer({ name, version });
  const rateLimiter = new Map<string, { count: number; resetTime: number }>();
  const maxRequests = 100;
  const windowMs = 60000; // 1 minute

  const checkRateLimit = (clientIP: string): boolean => {
    const now = Date.now();
    const limit = rateLimiter.get(clientIP);
    
    if (!limit || now > limit.resetTime) {
      rateLimiter.set(clientIP, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (limit.count >= maxRequests) {
      return false;
    }
    
    limit.count++;
    return true;
  };

  // Wrap tools with rate limiting
  const originalRegisterTool = server.registerTool.bind(server);
  server.registerTool = (name: string, config: any, handler: any) => {
    const wrappedHandler = async (args: any, context: any) => {
      const clientIP = context?.request?.headers?.['x-forwarded-for'] || 
                      context?.request?.connection?.remoteAddress || 
                      'unknown';
      
      if (!checkRateLimit(clientIP)) {
        return {
          content: [{
            type: "text",
            text: "Rate limit exceeded. Please try again later."
          }],
          isError: true
        };
      }
      
      return await handler(args, context);
    };
    
    return originalRegisterTool(name, config, wrappedHandler);
  };

  return server;
}

// Run examples if this file is executed directly
if (import.meta.main) {
  const mode = process.argv[2] || "bun";
  
  if (mode === "bun") {
    startBunServer().catch(console.error);
  } else if (mode === "express") {
    startExpressServer().catch(console.error);
  } else if (mode === "client") {
    // Wait a bit for server to start, then run client
    setTimeout(() => {
      httpClientExample().catch(console.error);
    }, 2000);
  } else {
    console.log("Usage: bun run http-transport.ts [bun|express|client]");
  }
}