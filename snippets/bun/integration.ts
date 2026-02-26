// Bun Integration Examples

// 1. React Integration
import { serve } from "bun";
import indexHtml from "./index.html";

// Server with HTML imports
serve({
  routes: {
    "/": indexHtml,
    "/api/*": {
      GET: (req) => {
        const url = new URL(req.url);
        return Response.json({ path: url.pathname });
      },
    },
  },
  development: {
    hmr: true, // Hot module reloading
    console: true,
  },
});

// 2. Next.js-style File System Routing
import { FileSystemRouter } from "bun";

const router = new FileSystemRouter({
  style: "nextjs",
  dir: "./pages",
});

export default {
  fetch(req) {
    const match = router.match(req.url);
    if (!match) return new Response("Not Found", { status: 404 });
    
    // Import and execute the page component
    const { filePath, params } = match;
    // Handle the route based on filePath and params
    return new Response(`Route: ${filePath}, Params: ${JSON.stringify(params)}`);
  },
};

// 3. Express.js Migration Pattern
// Instead of Express.js:
/*
const express = require('express');
const app = express();

app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});

app.listen(3000);
*/

// Use Bun.serve with routing:
export const expressLikeServer = {
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    
    // Route: /api/users/:id
    if (pathParts[1] === 'api' && pathParts[2] === 'users' && pathParts[3]) {
      return Response.json({ id: pathParts[3] });
    }
    
    return new Response("Not Found", { status: 404 });
  },
};

// 4. Database Integration with Drizzle ORM
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const sqlite = new Database("./database.db");
const db = drizzle(sqlite);

// Define schema
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

// Usage
const newUser = await db.insert(users).values({
  name: "John Doe",
  email: "john@example.com",
}).returning();

// 5. Prisma Integration
/*
// Install: bun add prisma @prisma/client
// Setup: bunx prisma init
// Generate: bunx prisma generate
*/

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function prismaExample() {
  const user = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
    },
  });
  
  const users = await prisma.user.findMany();
  return users;
}

// 6. tRPC Integration
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

const appRouter = t.router({
  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name}!` };
    }),
});

export type AppRouter = typeof appRouter;

// 7. WebSocket with Socket.IO style
class WebSocketManager {
  private connections = new Set<any>();
  
  handleConnection(ws: any) {
    this.connections.add(ws);
    
    ws.subscribe("global");
    
    ws.on("message", (data: string) => {
      const message = JSON.parse(data);
      
      // Broadcast to all connections
      for (const conn of this.connections) {
        conn.publish("global", JSON.stringify({
          type: "broadcast",
          data: message,
        }));
      }
    });
    
    ws.on("close", () => {
      this.connections.delete(ws);
    });
  }
}

// 8. Middleware Pattern
type Middleware = (req: Request, next: () => Response | Promise<Response>) => Response | Promise<Response>;

class BunApp {
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }
  
  async handle(req: Request): Promise<Response> {
    let index = 0;
    
    const next = (): Response | Promise<Response> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        return middleware(req, next);
      }
      return new Response("Not Found", { status: 404 });
    };
    
    return await next();
  }
}

// Usage
const app = new BunApp();

app.use((req, next) => {
  console.log(`${req.method} ${req.url}`);
  return next();
});

app.use((req, next) => {
  if (req.url.includes("/api/")) {
    return Response.json({ message: "API response" });
  }
  return next();
});

// 9. GraphQL Integration
import { buildSchema, graphql } from "graphql";

const schema = buildSchema(`
  type Query {
    hello(name: String!): String
  }
`);

const rootValue = {
  hello: ({ name }: { name: string }) => `Hello ${name}!`,
};

export default {
  async fetch(req) {
    if (req.method === "POST" && new URL(req.url).pathname === "/graphql") {
      const { query, variables } = await req.json();
      const result = await graphql({
        schema,
        source: query,
        rootValue,
        variableValues: variables,
      });
      
      return Response.json(result);
    }
    
    return new Response("Not Found", { status: 404 });
  },
};

// 10. Authentication Middleware
import { sign, verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function authMiddleware(req: Request, next: () => Response): Response {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  try {
    const token = authHeader.slice(7);
    const decoded = verify(token, JWT_SECRET);
    
    // Add user to request context (would need custom implementation)
    return next();
  } catch (error) {
    return new Response("Invalid token", { status: 401 });
  }
}

// 11. File Upload Handling
export const fileUploadServer = {
  async fetch(req: Request) {
    if (req.method === "POST" && new URL(req.url).pathname === "/upload") {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return new Response("No file uploaded", { status: 400 });
      }
      
      // Save file
      const fileName = `uploads/${Date.now()}-${file.name}`;
      await Bun.write(fileName, await file.arrayBuffer());
      
      return Response.json({ 
        message: "File uploaded successfully",
        fileName,
        size: file.size,
        type: file.type,
      });
    }
    
    return new Response("Not Found", { status: 404 });
  },
};

// 12. Docker Integration
/*
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bun run build

# Production stage
FROM oven/bun:1 AS production
WORKDIR /app

COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/bun.lockb ./

RUN bun install --production --frozen-lockfile

EXPOSE 3000
CMD ["bun", "dist/index.js"]
*/

// 13. Environment Configuration
interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  redis: {
    host: string;
    port: number;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || "3000"),
  databaseUrl: process.env.DATABASE_URL || "sqlite://./dev.db",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
};

// 14. Testing Integration with Supertest-like functionality
export async function testRequest(app: any, method: string, path: string, body?: any) {
  const url = `http://localhost${path}`;
  const request = new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  });
  
  return await app.fetch(request);
}

// Usage in tests:
/*
test("API endpoint", async () => {
  const response = await testRequest(app, "GET", "/api/users");
  expect(response.status).toBe(200);
  
  const data = await response.json();
  expect(data).toHaveProperty("users");
});
*/

// 15. Production Deployment Script
const deploymentScript = `#!/bin/bash
# Build application
bun run build

# Install production dependencies
bun install --production

# Run database migrations
bun run migrate

# Start application with PM2-like process management
bun run start
`;

export { 
  expressLikeServer, 
  prismaExample, 
  WebSocketManager, 
  BunApp, 
  authMiddleware,
  fileUploadServer,
  config,
  testRequest 
};