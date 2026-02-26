// Bun Configuration Examples

// 1. bunfig.toml - Main configuration file
/*
[install]
# Package manager configuration
registry = "https://registry.npmjs.org/"
scopes = { "@myorg" = "https://registry.myorg.com/" }
cache = { dir = "~/.bun/install/cache" }
auto = true
exact = false
dev = true
optional = true
peer = true
production = false
globalDir = "~/.bun/install/global"
globalBinDir = "~/.bun/bin"

[run]
# Runtime configuration
bun = true
silent = false
shell = "bash"

[test]
# Test configuration
coverage = false
preload = ["./test-setup.ts"]
smol = false
timeout = 5000

[build]
# Build configuration
minify = true
sourcemap = "linked"
splitting = true
*/

// 2. tsconfig.json - Recommended TypeScript configuration
export const tsconfigRecommended = {
  compilerOptions: {
    // Environment setup & latest features
    lib: ["ESNext"],
    target: "ESNext",
    module: "Preserve",
    moduleDetection: "force",
    jsx: "react-jsx",
    allowJs: true,

    // Bundler mode
    moduleResolution: "bundler",
    allowImportingTsExtensions: true,
    verbatimModuleSyntax: true,
    noEmit: true,

    // Best practices
    strict: true,
    skipLibCheck: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedIndexedAccess: true,
    noImplicitOverride: true,

    // Some stricter flags (disabled by default)
    noUnusedLocals: false,
    noUnusedParameters: false,
    noPropertyAccessFromIndexSignature: false,

    // Path mapping
    baseUrl: "./src",
    paths: {
      "@/*": ["./src/*"],
      "~/components/*": ["./src/components/*"],
      "~/utils/*": ["./src/utils/*"],
    },
  },
};

// 3. package.json scripts for Bun
export const packageJsonScripts = {
  scripts: {
    dev: "bun --hot index.ts",
    build: "bun build index.ts --outdir ./dist --target bun",
    start: "bun dist/index.js",
    test: "bun test",
    "test:watch": "bun test --watch",
    lint: "bunx @biomejs/biome check --write",
    format: "bunx @biomejs/biome format --write",
    clean: "rm -rf dist node_modules",
    typecheck: "bunx tsc --noEmit",
  },
  devDependencies: {
    "@types/bun": "latest",
    "@biomejs/biome": "latest",
    typescript: "latest",
  },
};

// 4. VS Code launch.json for debugging
export const vscodeDebugConfig = {
  version: "0.2.0",
  configurations: [
    {
      type: "bun",
      request: "launch",
      name: "Debug Bun",
      program: "${file}",
      args: [],
      cwd: "${workspaceFolder}",
      env: {},
      strictEnv: false,
      watchMode: false,
      stopOnEntry: false,
      noDebug: false,
      runtime: "bun",
      runtimeArgs: [],
    },
    {
      type: "bun",
      request: "attach",
      name: "Attach to Bun",
      url: "ws://localhost:6499/",
    },
  ],
};

// 5. Environment variables handling
// Bun automatically loads .env files
console.log(process.env.NODE_ENV);
console.log(process.env.DATABASE_URL);

// 6. Bun runtime configuration
export default {
  // Server configuration
  port: process.env.PORT || 3000,
  hostname: process.env.HOSTNAME || "localhost",
  
  // Development configuration
  development: process.env.NODE_ENV === "development",
  
  fetch(request: Request) {
    return new Response("Hello World!");
  },
};

// 7. Bun.build configuration
export const buildConfig = {
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  minify: true,
  sourcemap: "external",
  splitting: true,
  plugins: [],
  external: ["@types/bun"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  banner: "// Built with Bun",
  footer: "// End of bundle",
};