# Bun Reference

**Always remember to reference @$HOME/.claude/references/bun.md and look for snippets and examples in @$HOME/.claude/snippets/bun/**

## Quick Reference

- Installation: `curl -fsSL https://bun.sh/install | bash` or `npm install -g bun`
- Current Version: Bun 1.2+ (2024-2025)
- TypeScript support: `bun add -d @types/bun`
- Shell Commands: `import { $ } from "bun"; await $\`echo "Hello"\``
- Documentation: <https://bun.sh/docs/>
- GitHub: <https://github.com/oven-sh/bun>
- Package: <https://www.npmjs.com/package/bun>

## Resources and Documentation

- [Bun Documentation](https://bun.sh/docs/)
  - [Installation](https://bun.sh/docs/installation)
  - [Quick Start](https://bun.sh/docs/quickstart)
  - [Runtime](https://bun.sh/docs/runtime)
    - [TypeScript](https://bun.sh/docs/runtime/typescript)
    - [WebSockets](https://bun.sh/docs/api/websockets)
    - [HTTP Server](https://bun.sh/docs/api/http)
    - [File I/O](https://bun.sh/docs/api/file-io)
    - [SQLite](https://bun.sh/docs/api/sqlite)
    - [Shell](https://bun.sh/docs/runtime/shell)
  - [Package Manager](https://bun.sh/docs/cli/install)
    - [Configuration](https://bun.sh/docs/runtime/bunfig)
    - [Workspaces](https://bun.sh/docs/install/workspaces)
  - [Bundler](https://bun.sh/docs/bundler)
    - [API](https://bun.sh/docs/bundler/index)
    - [Plugins](https://bun.sh/docs/bundler/plugins)
    - [Loaders](https://bun.sh/docs/bundler/loaders)
    - [Executables](https://bun.sh/docs/bundler/executables)
  - [Test Runner](https://bun.sh/docs/cli/test)
    - [Writing Tests](https://bun.sh/docs/test/writing)
    - [Mocking](https://bun.sh/docs/test/mocks)
    - [Lifecycle Hooks](https://bun.sh/docs/test/lifecycle)
  - [API Reference](https://bun.sh/docs/api)
    - [Globals](https://bun.sh/docs/api/globals)
    - [Built-in Modules](https://bun.sh/docs/api/builtins)
- [Community Resources](https://bun.sh/community)
  - [Discord](https://bun.sh/discord)
  - [GitHub Discussions](https://github.com/oven-sh/bun/discussions)
  - [Examples Repository](https://github.com/oven-sh/bun/tree/main/examples)

## Core Features

### Runtime

- **JavaScript/TypeScript Execution**: Native support for `.js`, `.jsx`, `.ts`, `.tsx`
- **Hot Reloading**: `bun --hot <file>` for development
- **Environment Variables**: Automatic `.env` file loading
- **Web APIs**: Built-in `fetch`, `WebSocket`, `crypto`, and more
- **Node.js Compatibility**: 98%+ compatibility on macOS/Linux, Windows support
- **Shell Integration**: Cross-platform Bun Shell with `$` template literals
- **Content-Addressable Cache**: 2x faster startup for CLI tools (50KB+ files)
- **Memory Optimization**: 10-30% less idle memory usage (Bun 1.2+)

### Package Manager

- **Installation**: `bun install` (up to 29x faster than npm)
- **Adding Packages**: `bun add <package>` or `bun add -d <package>`
- **Global Packages**: `bun install -g <package>`
- **Lockfile**: `bun.lockb` (binary format for speed)
- **Workspaces**: Monorepo support with workspace configuration
- **Windows Performance**: 18x faster than yarn, 30x faster than npm
- **Lifecycle Scripts**: Complete overhaul with Windows support via Bun Shell
- **Cross-Platform**: Full compatibility on Windows, macOS, and Linux

### Bundler

- **Zero Config**: Works out of the box for most projects
- **Multiple Formats**: ESM, CommonJS, IIFE
- **Code Splitting**: Automatic chunk optimization
- **Tree Shaking**: Dead code elimination
- **Minification**: Built-in minifier
- **Source Maps**: Support for debugging

### Test Runner

- **Jest Compatible**: Drop-in replacement for Jest
- **Built-in Mocking**: Mock functions and modules
- **Coverage**: Code coverage reporting
- **Watch Mode**: Automatic test re-running

## Installation Methods

### Official Installer (Recommended)

```bash
curl -fsSL https://bun.sh/install | bash
```

### Package Managers

```bash
# npm
npm install -g bun

# Homebrew (macOS/Linux)
brew install bun

# Scoop (Windows)
scoop install bun

# Chocolatey (Windows)
choco install bun

# AUR (Arch Linux)
yay -S bun-bin

# Docker
docker pull oven/bun:latest
docker pull oven/bun:1.2
```

### Upgrade

```bash
bun upgrade          # Latest stable version
bun upgrade --canary # Latest canary build
bun --version        # Check current version

# Specific version
curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.0"
```

## Configuration Files

### bunfig.toml

- **Location**: Project root or `~/.bunfig.toml`
- **Purpose**: Configure package manager, test runner, and build settings
- **Schema**: Available at `@$HOME/.claude/snippets/bun/schemas/bunfig.schema.json`

### tsconfig.json

- **Recommended**: Optimized for Bun's TypeScript support
- **Template**: Available at `@$HOME/.claude/snippets/bun/schemas/tsconfig.bun.json`

### package.json

- **Scripts**: Use `bun run <script>` instead of `npm run`
- **Dependencies**: Managed with `bun add/remove`

## Default Usage Patterns

Default to using Bun instead of Node.js:

- Use `bun add <package>` instead of `npm install <package>` (29x faster)
- Use `bun add -d @types/bun` for TypeScript support
- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest` (10x faster)
- Use `bun build <file>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>`
- Use `bunx <package>` instead of `npx <package>`
- Use `import { $ } from "bun"` for shell commands instead of `child_process`
- Bun automatically loads .env files, so don't use dotenv
- Use `bun --hot <file>` for development with hot reloading
- Use `Bun.spawn()` for advanced subprocess management
- Consider `@effect/platform-bun` for production Effect-TS applications

**Effect-TS Integration**: Use Effect-TS for production applications with functional effect systems:

- Use `bun add effect @effect/platform-bun` for Effect-TS with Bun platform support
- Use `@effect/platform-bun` for HTTP servers, file operations, and process management
- Use `BunRuntime.runMain()` for Effect-TS program execution
- Use `BunContext.layer` for Bun-specific service dependencies

## Bun Shell

Bun Shell is a **cross-platform bash-like shell** built into Bun, written in Zig with its own lexer, parser, and interpreter. It provides secure shell scripting with JavaScript/TypeScript integration.

### Core Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Template Literals**: Use `$` tagged templates for shell commands
- **Security**: Automatic escaping prevents shell injection attacks
- **JavaScript Interop**: Seamless integration with JS objects and APIs
- **Subprocess Management**: Advanced process control with `Bun.spawn()`

### Basic Shell Usage

#### Template Literal API

```typescript
import { $ } from "bun";

// Simple command execution
await $`echo "Hello World!"`;  // Prints to stdout

// Get output as text
const result = await $`echo "Hello World!" | wc -w`.text();
console.log(result); // "2"

// Quiet execution (no output)
await $`echo "Hello World!"`.quiet();

// Variable interpolation (safe by default)
const name = "World";
await $`echo "Hello ${name}!"`;  // Hello World!

// Environment variables
await $`echo $FOO`.env({ ...process.env, FOO: "bar" });
```

#### Security Features

```typescript
// Automatic escaping prevents injection
const userInput = "file.txt; rm -rf /";
await $`cat ${userInput}`;  // Safe: treats as literal filename

// Use raw interpolation only when necessary (unsafe)
const command = "ls -la";
await $`${command}`.raw();  // Only use with trusted input
```

#### Advanced Shell Operations

```typescript
// Command chaining and pipes
const result = await $`ls -la | grep ".ts" | wc -l`.text();

// Working with files
const content = await $`cat package.json`.json();  // Parse as JSON
const lines = await $`cat file.txt`.lines();       // Get as array

// Conditional execution
const exitCode = await $`test -f package.json`.exitCode;
if (exitCode === 0) {
  console.log("package.json exists");
}
```

### Subprocess Management with Bun.spawn()

#### Basic Spawn Usage

```typescript
// Simple subprocess
const proc = Bun.spawn(["bun", "--version"]);
console.log(await proc.exited); // Exit code: 0

// Get output
const text = await proc.stdout.text();
console.log(text); // "1.2.18\n"
```

#### Advanced Configuration

```typescript
const proc = Bun.spawn({
  cmd: ["node", "script.js"],
  cwd: "/path/to/directory",
  env: { ...process.env, NODE_ENV: "production" },
  stdin: "inherit",   // or "pipe", "ignore", or a Blob/Response
  stdout: "pipe",     // or "inherit", "ignore"
  stderr: "pipe",
  onExit: (exitCode, signalCode, error) => {
    console.log(`Process exited with code ${exitCode}`);
  }
});
```

#### Input/Output Management

```typescript
// Provide input from various sources
const proc1 = Bun.spawn(["cat"], {
  stdin: "Hello World!",  // String input
});

const proc2 = Bun.spawn(["cat"], {
  stdin: await fetch("https://example.com/data"),  // Fetch response
});

const proc3 = Bun.spawn(["cat"], {
  stdin: Bun.file("input.txt"),  // File input
});

// Read output streams
const stdout = await proc1.stdout.text();
const stderr = await proc1.stderr.text();
```

#### Inter-Process Communication (IPC)

```typescript
// Parent process
const proc = Bun.spawn({
  cmd: ["bun", "child.js"],
  ipc: (message) => {
    console.log("Received from child:", message);
  }
});

// Send message to child
proc.send({ type: "greeting", data: "Hello from parent!" });

// child.js
process.on("message", (message) => {
  console.log("Child received:", message);
  process.send({ type: "response", data: "Hello from child!" });
});
```

### Shell Integration Patterns

#### File Operations

```typescript
// Check if file exists
const exists = await $`test -f package.json`.exitCode === 0;

// Create directories
await $`mkdir -p src/components`;

// Copy files with progress
await $`cp -r src dist`;

// Archive and compress
await $`tar -czf backup.tar.gz src/`;
```

#### Process Management

```typescript
// Background processes
const server = $`bun run server.js`.spawn();
// Do other work...
server.kill(); // Stop the server

// Process monitoring
const processes = await $`ps aux | grep node`.lines();
console.log(`Found ${processes.length} Node processes`);
```

#### System Information

```typescript
// Get system info
const platform = await $`uname -s`.text();
const cpuCount = await $`nproc`.text();
const memInfo = await $`free -h`.text();

// Network operations
const ip = await $`curl -s ifconfig.me`.text();
const ports = await $`netstat -tulnp`.text();
```

### Error Handling

```typescript
try {
  const result = await $`nonexistent-command`;
} catch (error) {
  console.error("Command failed:", error.message);
  console.error("Exit code:", error.exitCode);
  console.error("Signal:", error.signalCode);
}

// Handle specific exit codes
const result = await $`grep "pattern" file.txt`.nothrow();
if (result.exitCode === 1) {
  console.log("Pattern not found");
} else if (result.exitCode === 0) {
  console.log("Pattern found:", result.stdout);
}
```

### Performance Considerations

```typescript
// Use spawn for long-running processes
const longRunning = Bun.spawn(["some-long-process"], {
  stdout: "pipe",
  onExit: () => console.log("Process completed")
});

// Use $ for simple commands
const quickResult = await $`date`.text();

// Batch operations efficiently
const results = await Promise.all([
  $`command1`.text(),
  $`command2`.text(),
  $`command3`.text()
]);
```

## Key APIs

### Effect-TS with Bun Platform (Recommended)

- `@effect/platform-bun` for Effect-TS integration with Bun runtime
- `BunHttpServer.layer()` for HTTP servers with Effect-TS
- `BunFileSystem` for file operations with Effect-TS
- `BunRuntime.runMain()` for executing Effect-TS programs
- `BunContext.layer` for Bun-specific service dependencies

### Native Bun APIs (Alternative)

- `Bun.serve()` for HTTP servers with WebSockets, routing, and static files. Don't use `express`.
- `bun:sqlite` for SQLite databases. Don't use `better-sqlite3`.
- `Bun.spawn()` for process execution. Don't use `child_process` or `execa`.
- `Bun.file()` for file operations. Prefer over `node:fs` methods.
- `Bun.write()` for writing files efficiently
- `Bun.build()` for bundling applications
- `Bun.password.hash()` and `Bun.password.verify()` for password hashing
- `Bun.$` or `$` for shell commands with template literals (cross-platform)
- Built-in `fetch`, `WebSocket`, `crypto` APIs
- `bun:test` module for testing with Jest-compatible API
- **New in 1.2+**: Built-in PostgreSQL support with Bun SQL API
- **New in 1.2+**: S3 object storage support with file-like APIs

## Performance Characteristics

### Speed Comparisons

- **Startup**: ~10x faster than Node.js, 2x faster for CLI tools with caching
- **Package Installation**: Up to 29x faster than npm, 18x faster than yarn (Windows)
- **Bundling**: ~10-100x faster than Webpack
- **Testing**: ~10x faster than Jest
- **HTTP Server**: 3x more requests/second than Node.js Express
- **File Downloads**: Up to 5x faster than leading npm packages for S3 operations

### Memory Usage

- **Lower Memory Footprint**: Uses ~50% less memory than Node.js
- **Idle Memory Optimization**: 10-30% reduction in JavaScript idle memory (Bun 1.2+)
- **Efficient Garbage Collection**: Based on JavaScriptCore engine
- **Streaming**: Built-in streaming for large files
- **Content-Addressable Cache**: Avoids re-transpiling files >50KB

## Platform Support

### Supported Platforms

- **macOS**: x64 and Apple Silicon (M1/M2/M3)
- **Linux**: x64 and ARM64
- **Windows**: Native support (Windows 10+) - passes 98% of test suite
- **Docker**: Official `oven/bun` images available
- **CI/CD**: GitHub Actions, GitLab CI, and other platforms supported

### Browser Compatibility

- **Target**: Modern browsers (ES2020+)
- **Polyfills**: Minimal polyfills required
- **Bundle Size**: Optimized output

## Best Practices

### Development Workflow

1. **Initialize**: `bun init` for new projects
2. **Install Dependencies**: `bun install`
3. **Add Effect-TS**: `bun add effect @effect/platform-bun` (for production apps)
4. **Development**: `bun --hot src/index.ts`
5. **Testing**: `bun test --watch`
6. **Linting**: `bunx biome check --write`
7. **Building**: `bun build src/index.ts --outdir dist`

### Production Deployment

1. **Dockerfile**: Multi-stage builds with `oven/bun` images
2. **Lockfile**: Commit `bun.lockb` for reproducible builds
3. **Environment**: Use environment variables for configuration
4. **Health Checks**: Implement `/health` endpoints
5. **Monitoring**: Use built-in performance APIs

### Security Considerations

- **Dependencies**: Regularly update with `bun update`
- **Audit**: Use `bun audit` (when available)
- **Environment**: Never commit secrets to `.env` files
- **Headers**: Set security headers in production
- **HTTPS**: Use TLS in production environments

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/bun/`:

- **Basic Usage**: `basic-usage.ts` - Getting started examples
- **Configuration**: `configuration.ts` - Setup and config patterns
- **API Examples**: `api-examples.ts` - Core API usage
- **Testing**: `testing.ts` - Test patterns and mocking
- **Integration**: `integration.ts` - Framework integrations
- **Advanced Patterns**: `advanced-patterns.ts` - Complex use cases
- **Error Handling**: `error-handling.ts` - Error management
- **Performance**: `performance.ts` - Optimization techniques
- **Deployment**: `deployment.ts` - Production deployment

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/bun/schemas/`:

- **bunfig.schema.json**: Complete bunfig.toml schema
- **tsconfig.bun.json**: Optimized TypeScript configuration

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/bun/linting/`:

- **biome.json**: Complete Biome configuration for Bun projects

## Common Issues and Solutions

### TypeScript Errors

- **Solution**: Install `@types/bun` with `bun add -d @types/bun`
- **Import Errors**: Use `moduleResolution: "bundler"` in tsconfig.json

### Module Resolution

- **Path Mapping**: Configure `paths` in tsconfig.json
- **Extensions**: Enable `allowImportingTsExtensions`

### Performance Issues

- **Large Projects**: Use code splitting with `Bun.build`
- **Memory**: Monitor with built-in performance APIs
- **Bundling**: Optimize with tree shaking and minification

### Platform-Specific

- **Windows**: Some features require WSL
- **ARM**: Most features supported on ARM64
- **Docker**: Use official `oven/bun` images

## Migration Guides

### From Node.js

1. **Replace Commands**: `node` → `bun`, `npm` → `bun`
2. **Update Scripts**: Change package.json scripts
3. **Dependencies**: Install `@types/bun` for TypeScript
4. **APIs**: Replace Node.js APIs with Bun equivalents
5. **Shell Scripts**: Replace `child_process` with `$` template literals
6. **Performance**: Expect 10x faster startup, 29x faster installs
7. **Compatibility**: 98% Node.js compatibility on macOS/Linux, Windows supported

### From Webpack/Vite

1. **Bundling**: Use `Bun.build()` API
2. **Dev Server**: Use `Bun.serve()` with hot reloading
3. **Plugins**: Migrate to Bun plugin system
4. **Configuration**: Simplify build configuration

### From Jest/Vitest

1. **Tests**: Import from `bun:test` instead of Jest (10x faster)
2. **Mocking**: Use Bun's built-in mocking system
3. **Configuration**: Update test configuration in bunfig.toml
4. **Coverage**: Use Bun's coverage reporting
5. **Compatibility**: Jest-compatible API with better performance
6. **Watch Mode**: Built-in watch mode with fast file detection

## Bun Create - Project Templating

Bun Create is a powerful templating command for scaffolding new projects from various sources with `bun create`.

### Core Features

- **React Component Templates**: Turn existing components into full dev environments
- **npm Package Templates**: Use any `create-*` package from npm
- **GitHub Repository Templates**: Clone and configure from GitHub repos
- **Local Templates**: Create and use custom local templates
- **Automatic Detection**: Auto-configures TailwindCSS, shadcn/ui, and framework requirements

### Usage Patterns

#### From React Components

```bash
# Turn a React component into a complete development environment
bun create ./MyComponent.tsx
bun create ./components/Button.jsx

# Provides hot reload, production builds, and development server
```

#### From npm Packages

```bash
# Use any create-* package from npm
bun create remix
bun create next-app
bun create vite
bun create astro

# Equivalent to running create-* packages
# bunx create-remix, bunx create-next-app, etc.
```

#### From GitHub Repositories

```bash
# Clone from GitHub with auto-configuration
bun create <user>/<repo> [destination]
bun create vercel/next.js my-next-app
bun create withastro/astro my-astro-site
bun create github.com/user/repo custom-project

# Works with any public GitHub repository
```

#### From Local Templates

Templates can be stored in two locations:

- **Global**: `$HOME/.bun-create/<template-name>`
- **Project-local**: `<project-root>/.bun-create/<template-name>`

```bash
# Use local template
bun create my-custom-template ./new-project

# Templates are automatically detected and configured
```

### Template Configuration

#### package.json Configuration

Configure template behavior in `package.json`:

```json
{
  "name": "my-template",
  "bun-create": {
    "preinstall": "echo 'Setting up template...'",
    "postinstall": [
      "echo 'Template created successfully!'",
      "echo 'Run: bun run dev to start development'"
    ],
    "start": "bun run echo 'Hello from template!'"
  }
}
```

#### Advanced Template Features

- **Variable Substitution**: Template files can use `{{variable}}` syntax
- **Conditional Files**: Include/exclude files based on user input
- **Directory Structure**: Maintain complex directory hierarchies
- **Binary Files**: Support for images, fonts, and other assets

### CLI Options

#### Essential Flags

```bash
# Force overwrite existing files
bun create template-name --force

# Skip dependency installation
bun create template-name --no-install

# Skip git repository initialization
bun create template-name --no-git

# Start dev server and open in browser after creation
bun create template-name --open
```

#### Advanced Options

```bash
# Specify destination directory
bun create template-name custom-directory

# Use specific template version (GitHub)
bun create user/repo#branch-or-tag

# Combine multiple options
bun create my-template --force --no-git --open
```

### Environment Variables

#### GitHub Integration

```bash
# Authenticate for private repositories
export GITHUB_TOKEN=ghp_your_token_here

# Use custom GitHub domain (GitHub Enterprise)
export GITHUB_API_DOMAIN=github.company.com
```

#### Template Configuration

```bash
# Override default template directory
export BUN_CREATE_DIR=/custom/template/path

# Set default project author
export BUN_CREATE_AUTHOR="Your Name"
```

### Automatic Framework Detection

Bun Create automatically detects and configures:

#### React Frameworks

- **Next.js**: Automatic configuration for routing, styling, and deployment
- **Create React App**: Development server and build optimization
- **Remix**: Server-side rendering and routing setup

#### Vue/Nuxt Frameworks

- **Nuxt**: Full-stack configuration with SSR, routing, and modules
- **Vue CLI**: Component-based development with hot reload

#### Other Frameworks

- **Astro**: Static site generation with component islands
- **SvelteKit**: Full-stack Svelte with file-based routing
- **Solid**: Reactive framework with optimized bundling

#### UI Libraries

- **TailwindCSS**: Automatic installation and configuration
- **shadcn/ui**: Component library setup with theme configuration
- **Chakra UI**: Design system with theme customization
- **Material-UI**: Component library with styling setup

### Creating Custom Templates

#### Basic Template Structure

```
my-template/
├── package.json          # Template configuration
├── template/             # Template files
│   ├── src/
│   │   ├── index.ts      # Main entry point
│   │   └── components/
│   ├── public/           # Static assets
│   └── .gitignore        # Git ignore patterns
├── README.template.md    # Template README
└── bun-create.config.js  # Advanced configuration
```

#### Template Variables

Use variables in template files:

```typescript
// template/src/config.ts
export const config = {
  appName: "{{APP_NAME}}",
  version: "{{VERSION}}",
  author: "{{AUTHOR}}"
};
```

#### Interactive Templates

```javascript
// bun-create.config.js
module.exports = {
  prompts: [
    {
      name: 'appName',
      message: 'What is your app name?',
      default: 'my-app'
    },
    {
      name: 'useTypeScript',
      type: 'confirm',
      message: 'Use TypeScript?',
      default: true
    }
  ],
  actions: [
    {
      type: 'add',
      path: 'src/{{appName}}.{{#if useTypeScript}}ts{{else}}js{{/if}}',
      templateFile: 'templates/main.hbs'
    }
  ]
};
```

### Performance Optimizations

#### Template Caching

- **Local Cache**: Templates are cached locally for faster subsequent use
- **Incremental Updates**: Only download changed files from GitHub
- **Parallel Processing**: Multiple template operations run concurrently

#### Bundle Optimization

- **Tree Shaking**: Remove unused code from templates
- **Asset Optimization**: Compress images and static files
- **Dependency Analysis**: Install only required dependencies

### Best Practices

#### Template Design

1. **Minimal Setup**: Include only essential dependencies
2. **Clear Documentation**: Provide comprehensive README files
3. **Flexible Configuration**: Allow customization through environment variables
4. **Cross-Platform**: Ensure templates work on Windows, macOS, and Linux

#### Development Workflow

1. **Version Control**: Use semantic versioning for templates
2. **Testing**: Test templates on multiple platforms and Node versions
3. **Documentation**: Maintain up-to-date usage examples
4. **Community**: Share templates with the Bun community

### Common Use Cases

#### Microservice Templates

```bash
# Create microservice with Docker, health checks, and monitoring
bun create my-company/microservice-template user-service
```

#### Full-Stack Applications

```bash
# Complete app with frontend, API, and database
bun create my-template/fullstack-app ecommerce-site --open
```

#### Component Libraries

```bash
# UI component library with Storybook and testing
bun create design-system/components my-ui-lib
```

#### CLI Tools

```bash
# Command-line application template with argument parsing
bun create cli-template/tool my-cli-app
```

## Latest Features (Bun 1.2+)

### Built-in Database Support

```typescript
// PostgreSQL support with Bun SQL API
import { Database } from "bun:sqlite";
// PostgreSQL coming soon with similar API

const db = new Database("mydb.sqlite");
const query = db.query("SELECT * FROM users WHERE name = ?");
const results = query.all("John");
```

### S3 Object Storage Integration

```typescript
// Read from S3 with file-like APIs (5x faster than npm packages)
const s3File = Bun.file("s3://bucket/path/file.txt");
const content = await s3File.text();

// Write to S3
await Bun.write("s3://bucket/output.json", JSON.stringify(data));
```

### HTML Imports

```typescript
// Direct HTML import with bundling and minification
import htmlContent from "./template.html";
// HTML is automatically bundled and minified
```

### Performance Improvements

- **Express Compatibility**: 3x more requests/second than Node.js
- **Memory Reduction**: 10-30% less idle JavaScript memory usage
- **File Operations**: Content-addressable cache for 50KB+ files
- **CLI Tools**: Up to 2x faster execution (e.g., TypeScript compiler)

### Windows Native Support

- **Full Compatibility**: 98% test suite pass rate
- **Package Manager**: 18x faster than yarn, 30x faster than npm
- **Cross-Platform Shell**: Bun Shell works identically on all platforms
- **Native Executable**: No WSL required

## Latest Standards Enforcement

### Language Features

- **ES2024/ESNext**: Latest JavaScript features
- **TypeScript 5.6+**: Strict mode enabled
- **Module System**: ES modules preferred
- **Effect-TS**: Functional effect systems for production applications

### Tooling

- **Biome**: Preferred over ESLint + Prettier
- **esbuild/SWC**: Built into Bun bundler
- **Vitest Alternative**: Use Bun's test runner
- **Effect-TS**: Functional programming library for production applications

### Security

- **Dependencies**: Latest versions with security patches
- **Headers**: Security headers in production
- **Validation**: Runtime validation with Effect-TS Schema
- **Authentication**: Secure session management

### Performance

- **Monitoring**: Built-in performance APIs
- **Caching**: Response and asset caching
- **Compression**: Gzip/Brotli compression
- **CDN**: Asset optimization and delivery

## Community and Support

### Getting Help

- **Documentation**: Comprehensive docs at bun.sh
- **Discord**: Active community support
- **GitHub Issues**: Bug reports and feature requests
- **Stack Overflow**: Questions tagged with `bun`

### Contributing

- **Repository**: <https://github.com/oven-sh/bun>
- **Issues**: Bug reports and feature requests
- **Discussions**: Community discussions and Q&A
- **Examples**: Community-contributed examples
