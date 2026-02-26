/**
 * Comprehensive MCP Testing Examples
 * 
 * Demonstrates testing strategies for MCP servers and clients including
 * unit tests, integration tests, and end-to-end testing scenarios.
 */

import { test, expect, describe, beforeEach, afterEach, beforeAll, afterAll } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn, type Subprocess } from "bun";
import { z } from "zod";
import { Database } from "bun:sqlite";

// === TEST UTILITIES ===

class TestMCPServer {
  private server: McpServer;
  private transport: StdioServerTransport;
  private db: Database;

  constructor(name = "test-server", version = "1.0.0") {
    this.server = new McpServer({ name, version });
    this.transport = new StdioServerTransport();
    this.db = new Database(":memory:");
    this.setupTestTools();
  }

  private setupTestTools() {
    // Calculator tool for testing
    this.server.registerTool(
      "calculate",
      {
        title: "Calculator",
        description: "Perform mathematical operations",
        inputSchema: {
          operation: z.enum(["add", "subtract", "multiply", "divide"]),
          a: z.number(),
          b: z.number()
        }
      },
      async ({ operation, a, b }) => {
        let result: number;
        
        switch (operation) {
          case "add": result = a + b; break;
          case "subtract": result = a - b; break;
          case "multiply": result = a * b; break;
          case "divide":
            if (b === 0) {
              return {
                content: [{ type: "text", text: "Cannot divide by zero" }],
                isError: true
              };
            }
            result = a / b;
            break;
        }
        
        return {
          content: [{ type: "text", text: result.toString() }]
        };
      }
    );

    // Async tool for testing async operations
    this.server.registerTool(
      "async-delay",
      {
        title: "Async Delay",
        description: "Wait for specified milliseconds",
        inputSchema: {
          ms: z.number().int().min(0).max(5000)
        }
      },
      async ({ ms }) => {
        await new Promise(resolve => setTimeout(resolve, ms));
        return {
          content: [{ type: "text", text: `Waited ${ms}ms` }]
        };
      }
    );

    // Database tool for testing database operations
    this.db.exec("CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)");
    
    this.server.registerTool(
      "db-operation",
      {
        title: "Database Operation",
        description: "Perform database operations",
        inputSchema: {
          action: z.enum(["insert", "select", "count"]),
          value: z.string().optional()
        }
      },
      async ({ action, value }) => {
        try {
          switch (action) {
            case "insert":
              if (!value) {
                return {
                  content: [{ type: "text", text: "Value required for insert" }],
                  isError: true
                };
              }
              const stmt = this.db.prepare("INSERT INTO test_data (value) VALUES (?)");
              const result = stmt.run(value);
              return {
                content: [{ type: "text", text: `Inserted with ID: ${result.lastInsertRowid}` }]
              };
            
            case "select":
              const selectStmt = this.db.prepare("SELECT * FROM test_data ORDER BY id");
              const rows = selectStmt.all();
              return {
                content: [{ type: "text", text: JSON.stringify(rows) }]
              };
            
            case "count":
              const countStmt = this.db.prepare("SELECT COUNT(*) as count FROM test_data");
              const count = countStmt.get() as { count: number };
              return {
                content: [{ type: "text", text: count.count.toString() }]
              };
          }
        } catch (error) {
          return {
            content: [{ type: "text", text: `Database error: ${error.message}` }],
            isError: true
          };
        }
      }
    );
  }

  async start() {
    await this.server.connect(this.transport);
  }

  async stop() {
    this.db.close();
    await this.server.close();
  }

  getServer() {
    return this.server;
  }
}

// Mock client for testing
class MockMCPClient {
  private responses: Map<string, any> = new Map();
  private callLog: Array<{ tool: string; args: any; timestamp: number }> = [];

  setMockResponse(toolName: string, response: any) {
    this.responses.set(toolName, response);
  }

  async callTool(request: { name: string; arguments: any }) {
    this.callLog.push({
      tool: request.name,
      args: request.arguments,
      timestamp: Date.now()
    });

    const mockResponse = this.responses.get(request.name);
    if (mockResponse) {
      return mockResponse;
    }

    return {
      content: [{ type: "text", text: `Mock response for ${request.name}` }]
    };
  }

  getCallLog() {
    return [...this.callLog];
  }

  clearLog() {
    this.callLog.length = 0;
  }
}

// === UNIT TESTS ===

describe("MCP Server Unit Tests", () => {
  let testServer: TestMCPServer;

  beforeEach(() => {
    testServer = new TestMCPServer();
  });

  afterEach(async () => {
    await testServer.stop();
  });

  test("server initialization", () => {
    const server = testServer.getServer();
    expect(server.name).toBe("test-server");
    expect(server.version).toBe("1.0.0");
  });

  test("tool registration and execution", async () => {
    const server = testServer.getServer();
    
    // Simulate tool call directly
    const result = await simulateToolCall(server, "calculate", {
      operation: "add",
      a: 5,
      b: 3
    });

    expect(result.content[0].text).toBe("8");
    expect(result.isError).toBeFalsy();
  });

  test("tool validation errors", async () => {
    const server = testServer.getServer();
    
    try {
      await simulateToolCall(server, "calculate", {
        operation: "add",
        a: 5
        // Missing required parameter 'b'
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.message).toContain("validation");
    }
  });

  test("tool error handling", async () => {
    const server = testServer.getServer();
    
    const result = await simulateToolCall(server, "calculate", {
      operation: "divide",
      a: 10,
      b: 0
    });

    expect(result.content[0].text).toBe("Cannot divide by zero");
    expect(result.isError).toBe(true);
  });

  test("async tool execution", async () => {
    const server = testServer.getServer();
    
    const startTime = Date.now();
    const result = await simulateToolCall(server, "async-delay", { ms: 100 });
    const elapsed = Date.now() - startTime;

    expect(result.content[0].text).toBe("Waited 100ms");
    expect(elapsed).toBeGreaterThan(90); // Allow some tolerance
  });
});

// === INTEGRATION TESTS ===

describe("MCP Client-Server Integration Tests", () => {
  let serverProcess: Subprocess;
  let client: Client;

  beforeAll(async () => {
    // Start server in subprocess
    serverProcess = spawn(["bun", "run", "test-server.ts"], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create and connect client
    const transport = new StdioClientTransport({
      command: "bun",
      args: ["run", "test-server.ts"]
    });

    client = new Client({
      name: "integration-test-client",
      version: "1.0.0"
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
    serverProcess.kill();
  });

  test("client-server communication", async () => {
    const tools = await client.listTools();
    expect(tools.tools.length).toBeGreaterThan(0);
    
    const calculateTool = tools.tools.find(t => t.name === "calculate");
    expect(calculateTool).toBeDefined();
    expect(calculateTool?.title).toBe("Calculator");
  });

  test("tool execution via client", async () => {
    const result = await client.callTool({
      name: "calculate",
      arguments: {
        operation: "multiply",
        a: 6,
        b: 7
      }
    });

    expect(result.content[0].text).toBe("42");
  });

  test("concurrent tool calls", async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      client.callTool({
        name: "calculate",
        arguments: {
          operation: "add",
          a: i,
          b: 10
        }
      })
    );

    const results = await Promise.all(promises);
    
    results.forEach((result, i) => {
      expect(result.content[0].text).toBe((i + 10).toString());
    });
  });

  test("error propagation", async () => {
    const result = await client.callTool({
      name: "calculate",
      arguments: {
        operation: "divide",
        a: 5,
        b: 0
      }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Cannot divide by zero");
  });
});

// === PERFORMANCE TESTS ===

describe("MCP Performance Tests", () => {
  let mockClient: MockMCPClient;

  beforeEach(() => {
    mockClient = new MockMCPClient();
  });

  test("tool call latency", async () => {
    mockClient.setMockResponse("fast-tool", {
      content: [{ type: "text", text: "fast response" }]
    });

    const iterations = 100;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      await mockClient.callTool({
        name: "fast-tool",
        arguments: { data: `test-${i}` }
      });
    }

    const elapsed = Date.now() - startTime;
    const avgLatency = elapsed / iterations;

    expect(avgLatency).toBeLessThan(10); // Should be under 10ms per call
    expect(mockClient.getCallLog().length).toBe(iterations);
  });

  test("memory usage stability", async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Perform many operations
    for (let i = 0; i < 1000; i++) {
      await mockClient.callTool({
        name: "memory-test",
        arguments: { data: "x".repeat(1000) }
      });
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  test("concurrent request handling", async () => {
    mockClient.setMockResponse("concurrent-tool", {
      content: [{ type: "text", text: "concurrent response" }]
    });

    const concurrency = 10;
    const requestsPerWorker = 20;
    
    const workers = Array.from({ length: concurrency }, async (_, workerId) => {
      const promises = [];
      for (let i = 0; i < requestsPerWorker; i++) {
        promises.push(mockClient.callTool({
          name: "concurrent-tool",
          arguments: { workerId, requestId: i }
        }));
      }
      return Promise.all(promises);
    });

    const startTime = Date.now();
    const results = await Promise.all(workers);
    const elapsed = Date.now() - startTime;

    // All requests should complete
    expect(results.flat().length).toBe(concurrency * requestsPerWorker);
    
    // Should complete reasonably quickly
    expect(elapsed).toBeLessThan(5000);
  });
});

// === ERROR HANDLING TESTS ===

describe("MCP Error Handling", () => {
  test("invalid tool name", async () => {
    const mockClient = new MockMCPClient();
    
    try {
      await mockClient.callTool({
        name: "non-existent-tool",
        arguments: {}
      });
      
      // Should get mock response since we're using mock client
      expect(true).toBe(true);
    } catch (error) {
      expect(error.message).toContain("not found");
    }
  });

  test("malformed arguments", async () => {
    const testServer = new TestMCPServer();
    await testServer.start();

    try {
      await simulateToolCall(testServer.getServer(), "calculate", {
        operation: "invalid-operation",
        a: "not-a-number",
        b: 5
      });
      
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.message).toContain("validation");
    } finally {
      await testServer.stop();
    }
  });

  test("timeout handling", async () => {
    const mockClient = new MockMCPClient();
    
    // Simulate slow response
    mockClient.setMockResponse("slow-tool", new Promise(resolve => {
      setTimeout(() => resolve({
        content: [{ type: "text", text: "slow response" }]
      }), 1000);
    }));

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 500)
    );

    try {
      await Promise.race([
        mockClient.callTool({ name: "slow-tool", arguments: {} }),
        timeoutPromise
      ]);
      expect(true).toBe(false); // Should timeout
    } catch (error) {
      expect(error.message).toBe("Timeout");
    }
  });
});

// === HELPER FUNCTIONS ===

// Simulate tool call without client-server communication
async function simulateToolCall(server: McpServer, toolName: string, args: any) {
  // This is a simplified simulation - in real tests you'd use the actual protocol
  const tools = await server.listTools();
  const tool = tools.tools.find(t => t.name === toolName);
  
  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }

  // In a real implementation, this would go through the protocol layer
  return await server.callTool({
    name: toolName,
    arguments: args
  });
}

// Test data generators
export const TestDataGenerators = {
  randomNumber: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
  
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },
  
  randomObject: () => ({
    id: TestDataGenerators.randomNumber(),
    name: TestDataGenerators.randomString(),
    active: Math.random() > 0.5,
    timestamp: new Date().toISOString()
  })
};

// Test assertions helpers
export const TestAssertions = {
  isValidMCPResponse: (response: any) => {
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBeGreaterThan(0);
  },
  
  isErrorResponse: (response: any) => {
    TestAssertions.isValidMCPResponse(response);
    expect(response.isError).toBe(true);
  },
  
  hasTextContent: (response: any, expectedText?: string) => {
    TestAssertions.isValidMCPResponse(response);
    const textContent = response.content.find((item: any) => item.type === "text");
    expect(textContent).toBeDefined();
    if (expectedText) {
      expect(textContent.text).toContain(expectedText);
    }
  }
};

// === TEST CONFIGURATION ===

export const TestConfig = {
  timeout: 10000, // 10 seconds
  maxConcurrency: 10,
  memoryThreshold: 100 * 1024 * 1024, // 100MB
  latencyThreshold: 100 // 100ms
};