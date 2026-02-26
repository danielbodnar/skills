/**
 * Simple MCP Client with Bun
 * 
 * A basic example showing how to connect to an MCP server and interact with it
 * using the official TypeScript SDK.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Create client instance
const client = new Client({
  name: "simple-client", 
  version: "1.0.0"
});

// Create transport - connects to server via stdio
const transport = new StdioClientTransport({
  command: "bun",
  args: ["run", "simple-server.ts"]
});

try {
  // Connect to the server
  await client.connect(transport);
  console.log("Connected to MCP server");

  // Discover available tools
  const toolsResponse = await client.listTools();
  console.log("Available tools:", toolsResponse.tools.map(t => t.name));

  // Call the echo tool
  const echoResult = await client.callTool({
    name: "echo",
    arguments: {
      message: "Hello from MCP client!"
    }
  });
  console.log("Echo result:", echoResult.content[0].text);

  // Call the addition tool
  const addResult = await client.callTool({
    name: "add", 
    arguments: {
      a: 15,
      b: 27
    }
  });
  console.log("Addition result:", addResult.content[0].text);

  // Call the system info tool
  const sysInfoResult = await client.callTool({
    name: "system-info",
    arguments: {}
  });
  console.log("System info:");
  console.log(sysInfoResult.content[0].text);

  // Discover resources (if any)
  const resourcesResponse = await client.listResources();
  console.log("Available resources:", resourcesResponse.resources.length);

  // Discover prompts (if any)
  const promptsResponse = await client.listPrompts();
  console.log("Available prompts:", promptsResponse.prompts.length);

} catch (error) {
  console.error("Error:", error);
} finally {
  // Clean up
  await client.close();
  console.log("Disconnected from MCP server");
}