# Model Context Protocol TypeScript SDK Snippets

This directory contains comprehensive code examples and snippets for the Model Context Protocol (MCP) TypeScript SDK, organized by category for easy reference.

## Directory Structure

```
modelcontextprotocol-typescript-sdk/
├── basic/                  # Basic usage examples
├── server/                 # Server implementation patterns
├── client/                 # Client usage examples
├── muppet/                 # Muppet framework integration
├── transports/             # Transport layer examples
├── tools/                  # Tool implementation examples
├── resources/              # Resource management examples
├── prompts/                # Prompt template examples
├── authentication/         # Auth and security patterns
├── testing/                # Testing strategies and examples
├── configuration/          # Project setup and config files
├── deployment/             # Production deployment examples
├── advanced/               # Advanced patterns and techniques
├── performance/            # Performance optimization
└── security/               # Security best practices
```

## Getting Started

### Quick Start

1. **Basic Server Setup**

   ```bash
   # Create new project
   bun run basic/project-setup.ts my-mcp-server
   cd my-mcp-server
   
   # Start development server
   bun run dev
   ```

2. **Use Example Server**

   ```bash
   # Run basic server example
   bun run basic/simple-server.ts
   
   # In another terminal, test with client
   bun run basic/simple-client.ts
   ```

3. **Muppet Framework**

   ```bash
   # Run modern Muppet server
   bun run muppet/basic-muppet-server.ts
   ```

### Development Workflow

1. **Install Dependencies**

   ```bash
   bun add @modelcontextprotocol/sdk zod
   bun add muppet @hono/standard-validator  # For Muppet framework
   bun add -d @types/bun muppet-kit         # Development tools
   ```

2. **Development Setup**

   ```bash
   # Copy configuration templates
   cp configuration/package-json.json package.json
   cp configuration/tsconfig.json .
   cp configuration/mise.toml .
   
   # Install and run
   bun install
   bun run dev
   ```

3. **Testing**

   ```bash
   # Run comprehensive tests
   bun run testing/comprehensive-tests.ts
   
   # Start MCP Inspector for debugging
   bunx muppet-kit inspector
   ```

## Key Examples

### 🚀 Essential Starting Points

- **[basic/simple-server.ts](basic/simple-server.ts)** - Minimal MCP server with basic tools
- **[basic/simple-client.ts](basic/simple-client.ts)** - Client to connect and interact with servers
- **[muppet/basic-muppet-server.ts](muppet/basic-muppet-server.ts)** - Modern web-standard server with Hono

### 🛠️ Server Development

- **[server/basic-server.ts](server/basic-server.ts)** - Complete server with tools, resources, and prompts
- **[tools/advanced-tools.ts](tools/advanced-tools.ts)** - File system, database, and API integration tools
- **[transports/stdio-transport.ts](transports/stdio-transport.ts)** - Desktop app integration
- **[transports/http-transport.ts](transports/http-transport.ts)** - Web service deployment

### 🧪 Testing & Quality

- **[testing/comprehensive-tests.ts](testing/comprehensive-tests.ts)** - Unit, integration, and performance tests

### 🚢 Production Deployment

- **[deployment/docker-compose.yml](deployment/docker-compose.yml)** - Production setup with monitoring
- **[configuration/](configuration/)** - Project templates and configurations

## Framework Comparison

### Traditional MCP SDK

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.registerTool("hello", {
  title: "Hello Tool",
  description: "Say hello",
  inputSchema: { name: z.string() }
}, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}!` }]
}));
```

### Muppet Framework (Recommended)

```typescript
import { Hono } from "hono";
import { muppet, bridge, describeTool, mValidator } from "muppet";

const app = new Hono();

app.post("/hello",
  describeTool({ name: "hello", description: "Say hello" }),
  mValidator("json", z.object({ name: z.string() })),
  (c) => {
    const { name } = c.req.valid("json");
    return c.json({ content: [{ type: "text", text: `Hello, ${name}!` }] });
  }
);

const mcp = await muppet(app, { name: "my-server", version: "1.0.0" });
bridge({ mcp, transport: new StdioServerTransport() });
```

## Common Patterns

### Tool Registration Patterns

1. **Simple Tools** - Basic input/output with validation
2. **Async Tools** - External API calls and database operations
3. **Error Handling** - Graceful error responses with `isError` flag
4. **Resource Links** - Return references to large data sets

### Resource Management

1. **Static Resources** - Configuration, documentation
2. **Dynamic Resources** - User data, API responses with templates
3. **Resource Completions** - Auto-suggest parameter values

### Transport Selection

- **Stdio** - Desktop applications, CLI tools
- **HTTP** - Web services, cloud deployment
- **SSE** - Real-time updates (legacy, use HTTP streaming)

## Best Practices

### 🔒 Security

- Always validate inputs with Zod schemas
- Enable DNS rebinding protection for HTTP servers
- Use proper error handling without exposing internals
- Implement rate limiting for production deployment

### ⚡ Performance

- Use connection pooling for database operations
- Implement caching for expensive computations
- Use streaming for large data transfers
- Pool MCP sessions in high-traffic scenarios

### 🧪 Testing

- Write unit tests for individual tools
- Integration tests for client-server communication
- Performance tests for concurrent operations
- Mock external dependencies in tests

### 🚀 Deployment

- Use Docker for consistent environments
- Implement health checks and monitoring
- Set up log aggregation and alerting
- Use reverse proxy for load balancing

## Environment Requirements

- **Bun** 1.0+ (recommended runtime)
- **Node.js** 18+ (alternative runtime)
- **TypeScript** 5.6+
- **Operating System** - Windows, macOS, Linux

## Additional Resources

- [MCP TypeScript SDK Reference](../../references/modelcontextprotocol-typescript-sdk.md)
- [Official MCP Documentation](https://spec.modelcontextprotocol.io/)
- [Muppet Framework Docs](https://www.muppet.dev/docs)
- [MCP Inspector Tool](https://github.com/modelcontextprotocol/inspector)

## Contributing

When adding new snippets:

1. Follow the established naming conventions
2. Include comprehensive JSDoc comments
3. Add error handling and validation
4. Include usage examples in comments
5. Test with both Bun and Node.js when possible

## Support

For questions and issues:

- Check the [main reference document](../../references/modelcontextprotocol-typescript-sdk.md)
- Review similar examples in this directory
- Test with the MCP Inspector tool
- Follow the error handling patterns shown in examples
