// Basic Bun Usage Examples

// 1. Running TypeScript/JavaScript files directly
// bun index.ts | bun index.js | bun index.tsx | bun index.jsx

// 2. Package management
// bun install
// bun add react
// bun add -d @types/bun
// bun remove lodash

// 3. Script execution
// bun run start
// bun run dev
// bun run build

// 4. Global execution
// bunx cowsay "Hello, Bun!"
// bunx create-react-app my-app

// 4.1. Project creation with bun create
// bun create astro my-astro-site
// bun create remix my-remix-app
// bun create ./MyComponent.tsx my-component-project
// bun create user/repo my-github-project

// 5. Basic TypeScript setup
console.log("Hello from Bun!");
console.log(`Bun version: ${Bun.version}`);

// 6. Import JSON and TOML directly
import pkg from "./package.json";
import config from "./bunfig.toml";

console.log(pkg.name);
console.log(config.logLevel);

// 7. Environment detection
if (typeof Bun !== "undefined") {
  console.log("Running in Bun!");
}

// 8. Simple file operations
const text = await Bun.file("./example.txt").text();
await Bun.write("output.txt", "Hello, World!");

// 9. Fetch API (built-in)
const response = await fetch("https://api.example.com/data");
const data = await response.json();

// 10. Bun Shell - Cross-platform shell commands
import { $ } from "bun";

// Simple command execution
await $`echo "Hello from Bun Shell!"`;

// Get output as text
const whoami = await $`whoami`.text();
console.log(`Current user: ${whoami.trim()}`);

// Safe variable interpolation
const filename = "example.txt"; 
await $`echo "Content" > ${filename}`;

// Environment variables
await $`echo $HOME`.env({ HOME: "/custom/home" });

// Quiet execution
await $`mkdir -p temp/test`.quiet();

// 11. Subprocess management with Bun.spawn()
const proc = Bun.spawn(["echo", "Hello from spawn!"]);
const output = await proc.stdout.text();
console.log(`Spawn output: ${output.trim()}`);

// 12. Basic server
export default {
  port: 3000,
  fetch(request) {
    return new Response("Hello World!");
  },
};