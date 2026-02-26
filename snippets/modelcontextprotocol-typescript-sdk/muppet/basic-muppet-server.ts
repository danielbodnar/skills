/**
 * Basic Muppet MCP Server
 * 
 * Demonstrates how to create an MCP server using the modern Muppet framework
 * with Hono for web-standard HTTP endpoints.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Hono } from "hono";
import { 
  bridge, 
  muppet, 
  describeTool, 
  describePrompt,
  registerResources,
  mValidator,
  type MuppetEnv,
  type ToolResponseType,
  type PromptResponseType 
} from "muppet";
import { z } from "zod";

const app = new Hono<{ Bindings: { muppet: MuppetEnv } }>();

// === TOOLS AS HTTP ENDPOINTS ===

// Simple greeting tool
app.post(
  "/hello",
  describeTool({
    name: "hello",
    description: "Generate a personalized greeting"
  }),
  mValidator("json", z.object({
    name: z.string().min(1, "Name is required"),
    language: z.enum(["en", "es", "fr", "de"]).default("en")
  })),
  (c) => {
    const { name, language } = c.req.valid("json");
    
    const greetings = {
      en: `Hello, ${name}! Welcome to our Muppet MCP server.`,
      es: `¡Hola, ${name}! Bienvenido a nuestro servidor MCP Muppet.`,
      fr: `Bonjour, ${name}! Bienvenue sur notre serveur MCP Muppet.`,
      de: `Hallo, ${name}! Willkommen auf unserem Muppet MCP Server.`
    };
    
    return c.json<ToolResponseType>({
      content: [{
        type: "text",
        text: greetings[language]
      }]
    });
  }
);

// File system operations
app.post(
  "/file-info",
  describeTool({
    name: "file-info", 
    description: "Get information about a file"
  }),
  mValidator("json", z.object({
    path: z.string().min(1, "File path is required")
  })),
  async (c) => {
    const { path } = c.req.valid("json");
    
    try {
      const file = Bun.file(path);
      const exists = await file.exists();
      
      if (!exists) {
        return c.json<ToolResponseType>({
          content: [{
            type: "text",
            text: `File does not exist: ${path}`
          }],
          isError: true
        });
      }
      
      const size = file.size;
      const type = file.type;
      
      return c.json<ToolResponseType>({
        content: [{
          type: "text",
          text: JSON.stringify({
            path,
            size,
            type,
            exists
          }, null, 2)
        }]
      });
    } catch (error) {
      return c.json<ToolResponseType>({
        content: [{
          type: "text",
          text: `Error reading file: ${error.message}`
        }],
        isError: true
      });
    }
  }
);

// Weather simulation tool
app.post(
  "/weather",
  describeTool({
    name: "weather",
    description: "Get simulated weather information"
  }),
  mValidator("json", z.object({
    city: z.string().min(1, "City name is required"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius")
  })),
  (c) => {
    const { city, units } = c.req.valid("json");
    
    // Simulate weather data
    const tempC = Math.floor(Math.random() * 40) - 10; // -10 to 30°C
    const temp = units === "fahrenheit" ? (tempC * 9/5) + 32 : tempC;
    const conditions = ["sunny", "cloudy", "rainy", "snowy"][Math.floor(Math.random() * 4)];
    const humidity = Math.floor(Math.random() * 100);
    
    return c.json<ToolResponseType>({
      content: [{
        type: "text",
        text: `Weather in ${city}:\nTemperature: ${temp}°${units === "fahrenheit" ? "F" : "C"}\nConditions: ${conditions}\nHumidity: ${humidity}%`
      }]
    });
  }
);

// === PROMPTS ===

app.post(
  "/explain-concept",
  describePrompt({
    name: "explain-concept",
    description: "Generate a prompt to explain a concept",
    completion: ({ name, value }) => {
      if (name === "level") {
        return ["beginner", "intermediate", "advanced", "expert"];
      }
      if (name === "subject") {
        return ["programming", "science", "mathematics", "history", "philosophy"];
      }
      return [];
    }
  }),
  mValidator("json", z.object({
    concept: z.string().min(1, "Concept is required"),
    level: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("beginner"),
    subject: z.string().optional()
  })),
  (c) => {
    const { concept, level, subject } = c.req.valid("json");
    
    const levelDescriptions = {
      beginner: "in simple terms that anyone can understand",
      intermediate: "with moderate detail and some technical terms",
      advanced: "with comprehensive detail and technical depth", 
      expert: "with full technical precision and advanced concepts"
    };
    
    const subjectContext = subject ? ` in the context of ${subject}` : "";
    
    return c.json<PromptResponseType>([
      {
        role: "user",
        content: {
          type: "text",
          text: `Please explain the concept of "${concept}"${subjectContext} ${levelDescriptions[level]}.`
        }
      }
    ]);
  }
);

// === RESOURCES ===

// Static resources
app.post(
  "/resources/static",
  registerResources((c) => [
    {
      uri: "muppet://server/info",
      name: "Server Information",
      mimeType: "application/json"
    },
    {
      uri: "muppet://server/capabilities", 
      name: "Server Capabilities",
      mimeType: "application/json"
    }
  ])
);

// Dynamic resources with completions
app.post(
  "/resources/dynamic",
  registerResources((c) => [
    {
      type: "template",
      uri: "muppet://data/{category}/{id}",
      name: "Dynamic Data Resource",
      mimeType: "application/json",
      completion: ({ name, value }) => {
        if (name === "category") {
          return ["users", "products", "orders", "analytics"];
        }
        if (name === "id") {
          return ["1", "2", "3", "test", "demo"];
        }
        return [];
      }
    }
  ])
);

// === RESOURCE FETCHERS ===

muppet(app, {
  name: "muppet-server",
  version: "1.0.0",
  resources: {
    muppet: async (uri) => {
      const path = uri.pathname;
      
      if (path === "/server/info") {
        return [{
          uri: uri.href,
          text: JSON.stringify({
            name: "muppet-server",
            version: "1.0.0",
            framework: "Muppet + Hono",
            runtime: "Bun",
            startTime: new Date().toISOString(),
            endpoints: ["/hello", "/file-info", "/weather"],
            prompts: ["explain-concept"],
            resources: ["server/info", "server/capabilities", "data/{category}/{id}"]
          }, null, 2),
          mimeType: "application/json"
        }];
      }
      
      if (path === "/server/capabilities") {
        return [{
          uri: uri.href,
          text: JSON.stringify({
            tools: true,
            resources: true,
            prompts: true,
            streaming: false,
            authentication: false
          }, null, 2),
          mimeType: "application/json"
        }];
      }
      
      // Handle dynamic data resources
      const dataMatch = path.match(/^\/data\/(\w+)\/(\w+)$/);
      if (dataMatch) {
        const [, category, id] = dataMatch;
        
        // Mock data based on category
        const mockData = {
          users: { id, name: `User ${id}`, email: `user${id}@example.com` },
          products: { id, name: `Product ${id}`, price: Math.random() * 100 },
          orders: { id, userId: "1", productId: id, status: "pending" },
          analytics: { id, views: Math.floor(Math.random() * 1000), date: new Date().toISOString() }
        };
        
        return [{
          uri: uri.href,
          text: JSON.stringify(mockData[category as keyof typeof mockData] || { error: "Unknown category" }, null, 2),
          mimeType: "application/json"
        }];
      }
      
      throw new Error(`Unknown resource: ${path}`);
    }
  }
}).then((mcp) => {
  if (!mcp) {
    throw new Error("Failed to initialize Muppet");
  }

  // Bridge to stdio transport
  bridge({
    mcp,
    transport: new StdioServerTransport()
  });
  
  console.error("Muppet MCP server started with Hono endpoints");
}).catch(error => {
  console.error("Failed to start Muppet server:", error);
  process.exit(1);
});