/**
 * MCP Project Setup Script
 * 
 * Automates the setup of a new MCP TypeScript project with Bun.
 * Run with: bun run project-setup.ts
 */

import { $ } from "bun";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const projectName = process.argv[2] || "my-mcp-server";

console.log(`Setting up MCP project: ${projectName}`);

// Create project directory
if (!existsSync(projectName)) {
  await mkdir(projectName, { recursive: true });
}

process.chdir(projectName);

// Initialize Bun project
await $`bun init -y`;

// Install dependencies
console.log("Installing dependencies...");
await $`bun add @modelcontextprotocol/sdk zod`;
await $`bun add -d @types/bun`;

// Create package.json scripts
const packageJson = {
  name: projectName,
  version: "1.0.0",
  description: "MCP Server built with TypeScript and Bun",
  main: "src/server.ts",
  scripts: {
    dev: "bun --hot src/server.ts",
    build: "bun build src/server.ts --outdir dist --target bun",
    start: "bun dist/server.js",
    test: "bun test",
    "test:watch": "bun test --watch"
  },
  keywords: ["mcp", "model-context-protocol", "typescript", "bun"],
  author: "",
  license: "MIT",
  dependencies: {
    "@modelcontextprotocol/sdk": "latest",
    "zod": "latest"
  },
  devDependencies: {
    "@types/bun": "latest"
  }
};

await writeFile("package.json", JSON.stringify(packageJson, null, 2));

// Create TypeScript config
const tsConfig = {
  compilerOptions: {
    lib: ["ESNext"],
    target: "ESNext",
    module: "Preserve", 
    moduleResolution: "bundler",
    allowImportingTsExtensions: true,
    verbatimModuleSyntax: true,
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    types: ["bun-types"]
  },
  include: ["src/**/*", "tests/**/*"],
  exclude: ["node_modules", "dist"]
};

await writeFile("tsconfig.json", JSON.stringify(tsConfig, null, 2));

// Create mise configuration for development
const miseConfig = `[tools]
bun = "latest"
typescript = "latest"

[env]
NODE_ENV = "development"
MCP_SERVER_NAME = "${projectName}"
MCP_SERVER_VERSION = "1.0.0"

[tasks.dev]
run = "bun --hot src/server.ts"
description = "Start MCP server with hot reloading"

[tasks.build]
run = "bun build src/server.ts --outdir dist --target bun"
description = "Build MCP server for production"

[tasks.test]
run = "bun test"
description = "Run tests"

[tasks.typecheck]
run = "bunx tsc --noEmit"
description = "Type check the project"
`;

await writeFile("mise.toml", miseConfig);

// Create source directory
await mkdir("src", { recursive: true });
await mkdir("tests", { recursive: true });

// Create basic server
const serverCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "${projectName}",
  version: "1.0.0"
});

// Example tool
server.registerTool(
  "hello",
  {
    title: "Hello Tool",
    description: "Say hello to someone",
    inputSchema: {
      name: z.string().min(1, "Name is required")
    }
  },
  async ({ name }) => ({
    content: [{
      type: "text",
      text: \`Hello, \${name}! Welcome to \${server.name}.\`
    }]
  })
);

// Connect to stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error(\`\${server.name} v\${server.version} started\`);
`;

await writeFile("src/server.ts", serverCode);

// Create basic test
const testCode = `import { test, expect, describe } from "bun:test";

describe("${projectName}", () => {
  test("basic test", () => {
    expect(1 + 1).toBe(2);
  });
  
  // TODO: Add MCP server tests
});
`;

await writeFile("tests/server.test.ts", testCode);

// Create README
const readme = `# ${projectName}

MCP Server built with TypeScript and Bun.

## Setup

\`\`\`bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production  
bun run build

# Run tests
bun run test
\`\`\`

## Usage

Connect to this MCP server using any MCP client:

\`\`\`bash
# Test with a simple client
bun run src/server.ts
\`\`\`

## Available Tools

- **hello**: Say hello to someone

## Development

This project uses:
- [Bun](https://bun.sh) - JavaScript runtime and package manager
- [TypeScript](https://typescriptlang.org) - Type safety
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Model Context Protocol
- [Zod](https://zod.dev) - Schema validation
`;

await writeFile("README.md", readme);

// Create .gitignore
const gitignore = `node_modules/
dist/
*.log
.DS_Store
.env
.env.local
`;

await writeFile(".gitignore", gitignore);

console.log(`✅ Project ${projectName} created successfully!`);
console.log("\nNext steps:");
console.log(`  cd ${projectName}`);
console.log("  bun run dev");
console.log("\nThe MCP server will start and listen for connections.");