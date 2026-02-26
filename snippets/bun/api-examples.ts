// Bun API Examples

// 0. Project Creation with bun create
import { $ } from "bun";

// Create different types of projects programmatically
export const createProjects = async () => {
  // API server template
  await $`bun create hono my-api --no-git --no-install`;
  
  // Full-stack application
  await $`bun create astro my-fullstack-app --no-git --no-install`;
  
  // React component to full project
  await $`bun create ./Button.tsx button-project --no-git --no-install`;
  
  // From GitHub template
  await $`bun create user/bun-api-template my-custom-api --no-git --no-install`;
};

// 1. HTTP Server with Bun.serve
export default {
  port: 3000,
  fetch(request: Request) {
    const url = new URL(request.url);
    
    if (url.pathname === "/api/hello") {
      return new Response(JSON.stringify({ message: "Hello World!" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response("Not Found", { status: 404 });
  },
};

// 2. WebSocket Server
Bun.serve({
  port: 3001,
  fetch(req, server) {
    // Upgrade to WebSocket
    if (server.upgrade(req)) {
      return; // Handled by WebSocket
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
      ws.subscribe("global");
    },
    message(ws, message) {
      console.log("Received:", message);
      ws.publish("global", `Echo: ${message}`);
    },
    close(ws) {
      console.log("Client disconnected");
    },
  },
});

// 3. File Operations
async function fileOperations() {
  // Read file
  const content = await Bun.file("./package.json").text();
  const json = await Bun.file("./package.json").json();
  
  // Write file
  await Bun.write("output.txt", "Hello, Bun!");
  await Bun.write("data.json", JSON.stringify({ key: "value" }));
  
  // Stream file
  const file = Bun.file("large-file.txt");
  const stream = file.stream();
  
  for await (const chunk of stream) {
    console.log(new TextDecoder().decode(chunk));
  }
}

// 4. Process Spawning
async function processOperations() {
  // Simple command
  const proc = Bun.spawn(["ls", "-la"]);
  const output = await new Response(proc.stdout).text();
  console.log(output);
  
  // With options
  const proc2 = Bun.spawn(["git", "status"], {
    cwd: "./my-project",
    env: { ...process.env, GIT_AUTHOR_NAME: "Bun User" },
    stdout: "pipe",
    stderr: "pipe",
  });
  
  const [stdout, stderr] = await Promise.all([
    new Response(proc2.stdout).text(),
    new Response(proc2.stderr).text(),
  ]);
}

// 5. Build API
async function buildExample() {
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    target: "bun",
    minify: true,
    sourcemap: "external",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  });
  
  if (!result.success) {
    console.error("Build failed:");
    for (const message of result.logs) {
      console.error(message);
    }
  }
  
  console.log("Build artifacts:");
  for (const output of result.outputs) {
    console.log(`- ${output.path} (${output.kind})`);
  }
}

// 6. Transpiler API
const transpiler = new Bun.Transpiler({
  loader: "tsx",
  target: "bun",
  minifyWhitespace: true,
});

const code = transpiler.transformSync(`
  const Component = () => <div>Hello!</div>;
`);
console.log(code);

// 7. SQLite Integration
import { Database } from "bun:sqlite";

const db = new Database("mydb.sqlite");

// Create table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )
`);

// Insert data
const insert = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
insert.run("John Doe", "john@example.com");

// Query data
const query = db.prepare("SELECT * FROM users WHERE name = ?");
const user = query.get("John Doe");
console.log(user);

// 8. Testing API
import { test, expect, describe, beforeAll, afterAll } from "bun:test";

describe("Math operations", () => {
  beforeAll(() => {
    console.log("Setting up tests");
  });
  
  test("addition", () => {
    expect(2 + 2).toBe(4);
  });
  
  test("async operation", async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
  
  afterAll(() => {
    console.log("Cleaning up tests");
  });
});

// 9. Environment Variables (auto-loaded from .env)
console.log(process.env.DATABASE_URL);
console.log(process.env.API_KEY);

// 10. Crypto and Hashing
const hasher = new Bun.CryptoHasher("sha256");
hasher.update("hello");
hasher.update("world");
const hash = hasher.digest("hex");
console.log(hash);

// 11. Password Hashing
const password = "user-password";
const hash2 = await Bun.password.hash(password);
const isValid = await Bun.password.verify(password, hash2);
console.log(isValid);

// 12. WASM Support
const wasmModule = await WebAssembly.instantiateStreaming(
  fetch("./module.wasm")
);
const result = wasmModule.instance.exports.add(5, 3);

// 13. DNS Resolution
import { resolve } from "bun:dns";

const addresses = await resolve("example.com", "A");
console.log(addresses);

// 14. Shell Integration
import { $ } from "bun";

const output = await $`ls -la`.text();
console.log(output);

// Multiple commands
await $`mkdir -p ./dist && echo "Directory created"`;

// With error handling
try {
  await $`some-command-that-might-fail`;
} catch (error) {
  console.log("Command failed:", error.exitCode);
}

// 15. File System Router
import { FileSystemRouter } from "bun";

const router = new FileSystemRouter({
  style: "nextjs",
  dir: "./pages",
});

const route = router.match("/users/123");
console.log(route); // { filePath: "./pages/users/[id].tsx", params: { id: "123" } }

// 16. S3 Object Storage Integration (Bun 1.2+)
async function s3Operations() {
  // Read from S3 using file-like API (5x faster than npm packages)
  const s3File = Bun.file("s3://my-bucket/data.json");
  const content = await s3File.text();
  const data = await s3File.json();
  
  // Write to S3
  await Bun.write("s3://my-bucket/output.txt", "Hello S3!");
  await Bun.write("s3://my-bucket/data.json", JSON.stringify({ key: "value" }));
  
  // Stream from S3
  const largeFile = Bun.file("s3://my-bucket/large-dataset.csv");
  const stream = largeFile.stream();
  
  for await (const chunk of stream) {
    // Process chunk
    console.log(`Processing ${chunk.length} bytes`);
  }
}

// 17. HTML Import Support (Bun 1.2+)
// Direct HTML imports with automatic bundling and minification
import htmlTemplate from "./template.html"; // Automatically bundled

function renderTemplate(data: Record<string, any>): string {
  let html = htmlTemplate;
  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return html;
}

// 18. Enhanced PostgreSQL Support (Bun 1.2+)
// Note: PostgreSQL support is coming with the Bun SQL API
async function postgresExample() {
  // Future PostgreSQL integration will look like this:
  // import { Database } from "bun:postgres";
  // const db = new Database("postgresql://user:pass@localhost/db");
  
  // For now, use existing libraries with Bun
  console.log("PostgreSQL support coming in future Bun versions");
}

// 19. Performance-Optimized HTTP Server (Bun 1.2+)
// 3x more requests/second than Node.js Express
const highPerformanceServer = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    
    // Fast JSON responses
    if (url.pathname === "/api/data") {
      return Response.json({ 
        timestamp: Date.now(),
        version: Bun.version,
        memory: process.memoryUsage()
      });
    }
    
    // Static file serving with caching
    if (url.pathname.startsWith("/static/")) {
      const file = Bun.file(`.${url.pathname}`);
      return new Response(file, {
        headers: {
          "Cache-Control": "public, max-age=3600",
          "Content-Type": file.type || "application/octet-stream"
        }
      });
    }
    
    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response("OK", { 
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    return new Response("Not Found", { status: 404 });
  },
  error(error) {
    console.error("Server error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

// 20. Memory-Optimized Operations (Bun 1.2+)
// 10-30% less idle JavaScript memory usage
async function memoryOptimizedOperations() {
  // Content-addressable cache for files >50KB
  const largeFile = Bun.file("./large-bundle.js");
  const content = await largeFile.text(); // Cached automatically
  
  // Efficient streaming for large data
  const csvFile = Bun.file("./large-dataset.csv");
  const lines = [];
  
  for await (const line of csvFile.stream().pipeThrough(new TextDecoderStream()).pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim()) controller.enqueue(line);
        }
      }
    })
  )) {
    lines.push(line);
    
    // Process in batches to manage memory
    if (lines.length >= 1000) {
      await processBatch(lines.splice(0, 1000));
    }
  }
}

async function processBatch(lines: string[]) {
  // Process batch of lines
  console.log(`Processing batch of ${lines.length} lines`);
}

// 21. Cross-Platform Shell with Advanced Features
async function advancedShellOperations() {
  // Multi-platform file operations
  const platform = process.platform;
  
  if (platform === "win32") {
    await $`dir /b *.ts`;
  } else {
    await $`ls *.ts`;
  }
  
  // Parallel command execution
  const results = await Promise.all([
    $`echo "Task 1"`.text(),
    $`echo "Task 2"`.text(),
    $`echo "Task 3"`.text()
  ]);
  
  console.log("Parallel results:", results.map(r => r.trim()));
  
  // Command with timeout using spawn
  const proc = Bun.spawn({
    cmd: ["ping", "-c", "1", "8.8.8.8"],
    stdout: "pipe"
  });
  
  // Race between command completion and timeout
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout")), 5000)
  );
  
  try {
    const output = await Promise.race([
      proc.stdout.text(),
      timeoutPromise
    ]);
    console.log("Ping result:", output);
  } catch (error) {
    proc.kill();
    console.log("Command timed out");
  }
}

export { 
  fileOperations, 
  processOperations, 
  buildExample, 
  s3Operations,
  memoryOptimizedOperations,
  advancedShellOperations 
};