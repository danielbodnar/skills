# Block Goose MCP Server Examples

## Basic MCP Server Setup

### Python FastMCP Server
```python
from mcp.server.fastmcp import FastMCP
from mcp.server.stdio import stdio_server

mcp = FastMCP("Extension Name")

if __name__ == "__main__":
    mcp.run()
```

### Complete Python MCP Server Example
```python
from mcp.server.fastmcp import FastMCP
from mcp.server.stdio import stdio_server

# Initialize MCP server
mcp = FastMCP("My Custom Extension")

# Add tools
@mcp.tool()
def search_database(query: str) -> str:
    """Search the database for information"""
    # Implementation here
    return f"Search results for: {query}"

@mcp.tool()
def update_record(id: str, data: dict) -> str:
    """Update a record in the database"""
    # Implementation here
    return f"Updated record {id}"

# Add resources
@mcp.resource()
def get_schema() -> str:
    """Get database schema"""
    return "Database schema information"

if __name__ == "__main__":
    mcp.run()
```

## TypeScript MCP Server

### Basic TypeScript Setup
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "Extension Name",
  version: "1.0.0",
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Complete TypeScript MCP Server
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "My Custom Extension",
  version: "1.0.0",
});

// Add tool handlers
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "search_api",
        description: "Search external API",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query"
            }
          },
          required: ["query"]
        }
      }
    ]
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "search_api") {
    const result = await searchAPI(args.query);
    return {
      content: [
        {
          type: "text",
          text: result
        }
      ]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Add resource handlers
server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "schema://database",
        name: "Database Schema",
        description: "Current database schema"
      }
    ]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);

async function searchAPI(query: string): Promise<string> {
  // Implementation here
  return `Search results for: ${query}`;
}
```

## Kotlin MCP Server

### Basic Kotlin Setup
```kotlin
import io.modelcontextprotocol.kotlin.sdk.server.Server
import io.modelcontextprotocol.kotlin.sdk.server.StdioServerTransport

val server = Server(
    serverInfo = Implementation(
        name = "Extension Name",
        version = "1.0.0"
    )
)

val transport = StdioServerTransport()
server.connect(transport)
```

## Tool Definition Schema

### Tool Structure
```json
{
  "name": "search_web",
  "description": "Searches the internet for information based on a query",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query"
      }
    },
    "required": ["query"]
  }
}
```

## Configuration Examples

### MCP Server Configuration in Goose
```bash
# Command to run MCP server
uv run /full/path/to/mcp-wiki/.venv/bin/mcp-wiki

# Or using npx
npx -y @modelcontextprotocol/server-example
```

### Environment Setup
```bash
# Create Python virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install mcp
```

## Recipe Configuration

### YAML Recipe with MCP Extensions
```yaml
extensions:
  - type: stdio
    name: codesearch
    cmd: uvx
    args:
      - mcp_codesearch@latest
    timeout: 300
    bundled: true
    description: "Query https://codesearch.sqprod.co/ directly from goose"
  
  - type: stdio
    name: presidio
    timeout: 300
    cmd: uvx
    args:
      - 'mcp_presidio@latest'
    description: "For searching logs using Presidio"
```

## Extension Allowlist

### Allowlist Configuration
```yaml
extensions:
  - id: slack
    command: uvx mcp_slack
  - id: github
    command: uvx mcp_github
  - id: jira
    command: uvx mcp_jira
```