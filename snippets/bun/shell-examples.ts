// Bun Shell Comprehensive Examples
// Cross-platform shell scripting with JavaScript/TypeScript

import { $ } from "bun";

// =============================================================================
// BASIC SHELL OPERATIONS
// =============================================================================

// Simple command execution
console.log("=== Basic Commands ===");
await $`echo "Hello, Bun Shell!"`;
await $`pwd`;

// Get output as text
const currentDir = await $`pwd`.text();
console.log(`Working directory: ${currentDir.trim()}`);

// Get output as lines array
const files = await $`ls -la`.lines();
console.log(`Found ${files.length} items`);

// Parse JSON output
try {
  const packageInfo = await $`cat package.json`.json();
  console.log(`Package name: ${packageInfo.name}`);
} catch (error) {
  console.log("No package.json found");
}

// =============================================================================
// VARIABLE INTERPOLATION & SECURITY
// =============================================================================

console.log("\n=== Variable Interpolation ===");

// Safe interpolation (automatic escaping)
const fileName = "my file.txt";
const content = "Hello World";
await $`echo ${content} > ${fileName}`;  // Safe, prevents injection

// Unsafe user input example (but still safe with Bun)
const userInput = "file.txt; rm -rf /";
await $`cat ${userInput}`;  // Bun safely escapes this

// Environment variable interpolation
const customPath = "/custom/bin";
await $`echo $PATH`.env({ ...process.env, PATH: customPath });

// =============================================================================
// ADVANCED SHELL OPERATIONS
// =============================================================================

console.log("\n=== Advanced Operations ===");

// Command chaining and pipes
const wordCount = await $`echo "hello world test" | wc -w`.text();
console.log(`Word count: ${wordCount.trim()}`);

// Complex pipe chains
const processCount = await $`ps aux | grep -v grep | grep node | wc -l`.text();
console.log(`Node processes: ${processCount.trim()}`);

// Conditional execution
const packageExists = await $`test -f package.json`.exitCode === 0;
console.log(`package.json exists: ${packageExists}`);

// Error handling with nothrow
const result = await $`grep "nonexistent" package.json`.nothrow();
if (result.exitCode === 0) {
  console.log("Pattern found");
} else {
  console.log("Pattern not found (expected)");
}

// =============================================================================
// FILE AND DIRECTORY OPERATIONS
// =============================================================================

console.log("\n=== File Operations ===");

// Create directory structure
await $`mkdir -p temp/test/nested`.quiet();

// File operations
await $`touch temp/example.txt`.quiet();
await $`echo "Sample content" > temp/example.txt`.quiet();

// Copy and move files
await $`cp temp/example.txt temp/backup.txt`.quiet();
await $`mv temp/backup.txt temp/test/`.quiet();

// Archive operations
await $`tar -czf temp/archive.tar.gz temp/test/`.quiet();

// Check file permissions
const permissions = await $`stat -c "%A" temp/example.txt`.text().catch(() => 
  $`ls -l temp/example.txt | awk '{print $1}'`.text()
);
console.log(`File permissions: ${permissions.trim()}`);

// =============================================================================
// PROCESS MANAGEMENT WITH BUN.SPAWN()
// =============================================================================

console.log("\n=== Process Management ===");

// Basic spawn usage
const echoProc = Bun.spawn(["echo", "Hello from spawn"]);
const echoOutput = await echoProc.stdout.text();
console.log(`Spawn output: ${echoOutput.trim()}`);

// Advanced spawn configuration
const proc = Bun.spawn({
  cmd: ["find", ".", "-name", "*.ts", "-type", "f"],
  cwd: process.cwd(),
  env: { ...process.env },
  stdout: "pipe",
  stderr: "pipe"
});

const findOutput = await proc.stdout.text();
const findError = await proc.stderr.text();
const exitCode = await proc.exited;

console.log(`Find exit code: ${exitCode}`);
if (findOutput) {
  console.log(`TypeScript files found:\n${findOutput}`);
}

// Background process management
const longRunning = Bun.spawn({
  cmd: ["sleep", "5"],
  stdout: "pipe"
});

console.log("Started background process, waiting...");
setTimeout(() => longRunning.kill(), 1000); // Kill after 1 second

// =============================================================================
// SYSTEM INFORMATION
// =============================================================================

console.log("\n=== System Information ===");

// Platform detection
const platform = await $`uname -s`.text().catch(() => "Windows");
console.log(`Platform: ${platform.trim()}`);

// CPU information
const cpuInfo = await $`nproc`.text().catch(() => 
  $`wmic cpu get NumberOfCores /value`.text().catch(() => "Unknown")
);
console.log(`CPU cores: ${cpuInfo.trim()}`);

// Memory information (Linux/macOS)
try {
  const memInfo = await $`free -h | head -2`.text();
  console.log(`Memory info:\n${memInfo}`);
} catch {
  console.log("Memory info not available (Windows or permission issues)");
}

// Network information
try {
  const ip = await $`curl -s ifconfig.me`.text();
  console.log(`Public IP: ${ip.trim()}`);
} catch {
  console.log("Could not fetch public IP");
}

// =============================================================================
// CROSS-PLATFORM COMPATIBILITY
// =============================================================================

console.log("\n=== Cross-Platform Examples ===");

// Platform-specific commands with fallbacks
async function getCPUCount(): Promise<string> {
  try {
    // Unix-like systems
    return await $`nproc`.text();
  } catch {
    try {
      // macOS
      return await $`sysctl -n hw.ncpu`.text();
    } catch {
      try {
        // Windows
        return await $`echo %NUMBER_OF_PROCESSORS%`.text();
      } catch {
        return "Unknown";
      }
    }
  }
}

const cpuCount = await getCPUCount();
console.log(`CPU count (cross-platform): ${cpuCount.trim()}`);

// File listing with cross-platform handling
async function listFiles(path: string): Promise<string[]> {
  try {
    const output = await $`ls -la ${path}`.text();
    return output.split('\n').filter(line => line.trim());
  } catch {
    // Fallback for Windows or when ls is not available
    const output = await $`dir ${path}`.text();
    return output.split('\n').filter(line => line.trim());
  }
}

// =============================================================================
// ERROR HANDLING PATTERNS
// =============================================================================

console.log("\n=== Error Handling ===");

// Try-catch for command failures
try {
  await $`nonexistent-command`;
} catch (error) {
  console.log(`Command failed: ${error.message}`);
  console.log(`Exit code: ${error.exitCode}`);
}

// Using nothrow for graceful handling
const grepResult = await $`grep "test" package.json`.nothrow();
if (grepResult.exitCode === 0) {
  console.log("Found 'test' in package.json");
} else {
  console.log("'test' not found in package.json");
}

// Timeout handling with spawn
const timeoutProc = Bun.spawn({
  cmd: ["sleep", "10"],
  stdout: "pipe"
});

// Kill after 2 seconds
setTimeout(() => {
  timeoutProc.kill();
  console.log("Process killed due to timeout");
}, 2000);

// =============================================================================
// PERFORMANCE CONSIDERATIONS
// =============================================================================

console.log("\n=== Performance Examples ===");

// Batch operations
const batchResults = await Promise.all([
  $`echo "task1"`.text(),
  $`echo "task2"`.text(), 
  $`echo "task3"`.text()
]);
console.log(`Batch results: ${batchResults.join(", ")}`);

// Using spawn for long-running processes
const monitorProc = Bun.spawn({
  cmd: ["ping", "-c", "3", "8.8.8.8"],
  stdout: "pipe"
});

const pingOutput = await monitorProc.stdout.text();
console.log(`Ping results:\n${pingOutput}`);

// =============================================================================
// CLEANUP
// =============================================================================

console.log("\n=== Cleanup ===");

// Clean up temporary files
await $`rm -rf temp/`.quiet();

console.log("Bun Shell examples completed!");