# MCP TypeScript SDK Quick Reference

> Model Context Protocol SDK for building AI tool servers and clients

## Installation

```bash
bun add @modelcontextprotocol/sdk zod
# Modern framework (recommended)
bun add muppet @hono/standard-validator
```

## Key Concepts

- **Tools**: Functions LLMs can call (validated inputs, structured outputs)
- **Resources**: Data sources exposed via URIs
- **Prompts**: Reusable message templates with validation

## Essential Patterns

### Create MCP Server (Muppet)

```typescript
import { createMuppet, z } from "muppet";

const mcp = createMuppet({ name: "my-server", version: "1.0.0" });

mcp.tool("greet", { name: z.string() }, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}!` }],
}));

export default mcp.handler();
```

### Create MCP Server (Classic)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({ name: "my-server", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{ name: "example", description: "Example tool", inputSchema: { type: "object" } }],
}));

await server.connect(new StdioServerTransport());
```

### Define Resources

```typescript
mcp.resource("config://settings", async () => ({
  contents: [{ uri: "config://settings", text: JSON.stringify(config), mimeType: "application/json" }],
}));
```

## Common Gotchas

- Always use Zod schemas for input validation
- Return `content` array with typed items (`text`, `image`, `resource`)
- Use `StdioServerTransport` for Claude Desktop integration
- Test with `@modelcontextprotocol/inspector`

## Links

- **Official Docs**: https://modelcontextprotocol.io/docs
- **SDK GitHub**: https://github.com/modelcontextprotocol/typescript-sdk
- **Muppet Framework**: https://github.com/muppetjs/muppet
- **MCP Specification**: https://spec.modelcontextprotocol.io
