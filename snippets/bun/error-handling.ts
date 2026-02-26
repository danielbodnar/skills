// Error Handling Patterns in Bun

// 1. Custom Error Classes
class BunError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "BunError";
  }
}

class ValidationError extends BunError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

class DatabaseError extends BunError {
  constructor(message: string, details?: any) {
    super(message, "DATABASE_ERROR", 500, details);
    this.name = "DatabaseError";
  }
}

class NotFoundError extends BunError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

class AuthenticationError extends BunError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

// 2. Error Handler Middleware
function errorHandler(error: Error): Response {
  console.error("Error occurred:", error);
  
  // Handle known error types
  if (error instanceof BunError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }
  
  // Handle validation errors from libraries like Zod
  if (error.name === "ZodError") {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: (error as any).errors,
        },
      },
      { status: 400 }
    );
  }
  
  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    return Response.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Invalid JSON format",
        },
      },
      { status: 400 }
    );
  }
  
  // Generic error response
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal error occurred",
      },
    },
    { status: 500 }
  );
}

// 3. Async Error Wrapper
function asyncHandler(fn: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      return await fn(req, ...args);
    } catch (error) {
      return errorHandler(error as Error);
    }
  };
}

// 4. Server with Error Handling
export default {
  async fetch(req: Request) {
    try {
      const url = new URL(req.url);
      
      // Route handling with error boundaries
      switch (url.pathname) {
        case "/api/users":
          return await handleUsers(req);
        
        case "/api/health":
          return await handleHealth(req);
        
        default:
          throw new NotFoundError("Route");
      }
    } catch (error) {
      return errorHandler(error as Error);
    }
  },
};

// 5. Database Operations with Error Handling
async function withDatabaseTransaction<T>(
  callback: (db: any) => Promise<T>
): Promise<T> {
  const { Database } = await import("bun:sqlite");
  const db = new Database(":memory:");
  
  try {
    db.run("BEGIN TRANSACTION");
    const result = await callback(db);
    db.run("COMMIT");
    return result;
  } catch (error) {
    db.run("ROLLBACK");
    
    if (error instanceof Error) {
      throw new DatabaseError(
        `Database operation failed: ${error.message}`,
        { originalError: error.message }
      );
    }
    
    throw new DatabaseError("Unknown database error");
  } finally {
    db.close();
  }
}

// 6. File Operations with Error Handling
async function safeFileOperation<T>(
  operation: () => Promise<T>,
  filePath?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific file errors
      if (error.message.includes("ENOENT")) {
        throw new NotFoundError(`File${filePath ? ` '${filePath}'` : ""}`);
      }
      
      if (error.message.includes("EACCES")) {
        throw new BunError(
          `Permission denied${filePath ? ` for file '${filePath}'` : ""}`,
          "PERMISSION_DENIED",
          403
        );
      }
      
      if (error.message.includes("ENOSPC")) {
        throw new BunError(
          "No space left on device",
          "DISK_FULL",
          507
        );
      }
    }
    
    throw new BunError(
      `File operation failed${filePath ? ` for '${filePath}'` : ""}`,
      "FILE_ERROR",
      500,
      { originalError: error }
    );
  }
}

// 7. HTTP Request Error Handling
async function safeHttpRequest(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      throw new BunError(
        `HTTP request failed: ${response.status} ${response.statusText}`,
        "HTTP_ERROR",
        response.status
      );
    }
    
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new BunError(
          "Request timeout",
          "TIMEOUT_ERROR",
          408
        );
      }
      
      if (error.message.includes("fetch failed")) {
        throw new BunError(
          "Network error",
          "NETWORK_ERROR",
          503
        );
      }
    }
    
    throw error;
  }
}

// 8. Input Validation with Error Handling
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  age: z.number().min(0).max(150, "Age must be between 0 and 150"),
});

function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Invalid input data",
        error.errors.map(err => ({
          field: err.path.join("."),
          message: err.message,
          value: err.received,
        }))
      );
    }
    throw error;
  }
}

// 9. WebSocket Error Handling
const webSocketServer = {
  websocket: {
    open(ws: any) {
      try {
        console.log("WebSocket connection opened");
        ws.subscribe("global");
      } catch (error) {
        console.error("Error in WebSocket open:", error);
        ws.close(1011, "Internal error");
      }
    },
    
    message(ws: any, message: string | Buffer) {
      try {
        const data = JSON.parse(message.toString());
        
        // Validate message structure
        if (!data.type || !data.payload) {
          throw new ValidationError("Invalid message format");
        }
        
        // Handle different message types
        switch (data.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            break;
          
          case "chat":
            ws.publish("global", JSON.stringify({
              type: "chat",
              payload: data.payload,
              timestamp: Date.now(),
            }));
            break;
          
          default:
            throw new ValidationError(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        
        if (error instanceof ValidationError) {
          ws.send(JSON.stringify({
            type: "error",
            payload: {
              code: error.code,
              message: error.message,
            },
          }));
        } else {
          ws.close(1011, "Internal error");
        }
      }
    },
    
    error(ws: any, error: Error) {
      console.error("WebSocket error:", error);
    },
    
    close(ws: any, code: number, reason: string) {
      console.log(`WebSocket closed: ${code} ${reason}`);
    },
  },
};

// 10. Process Error Handling
async function safeProcessExecution(command: string[], options?: any): Promise<string> {
  try {
    const proc = Bun.spawn(command, {
      stdout: "pipe",
      stderr: "pipe",
      ...options,
    });
    
    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    
    const exitCode = await proc.exited;
    
    if (exitCode !== 0) {
      throw new BunError(
        `Process failed with exit code ${exitCode}`,
        "PROCESS_ERROR",
        500,
        { command, exitCode, stderr }
      );
    }
    
    return stdout;
  } catch (error) {
    if (error instanceof BunError) {
      throw error;
    }
    
    throw new BunError(
      `Failed to execute process: ${command.join(" ")}`,
      "PROCESS_EXECUTION_ERROR",
      500,
      { command, originalError: error }
    );
  }
}

// 11. Graceful Shutdown Handler
class GracefulShutdown {
  private shutdownHandlers: (() => Promise<void>)[] = [];
  private isShuttingDown = false;
  
  addHandler(handler: () => Promise<void>) {
    this.shutdownHandlers.push(handler);
  }
  
  async shutdown(signal: string) {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log(`Received ${signal}, starting graceful shutdown...`);
    
    const shutdownPromises = this.shutdownHandlers.map(async (handler, index) => {
      try {
        await handler();
        console.log(`Shutdown handler ${index + 1} completed`);
      } catch (error) {
        console.error(`Shutdown handler ${index + 1} failed:`, error);
      }
    });
    
    try {
      await Promise.allSettled(shutdownPromises);
      console.log("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  }
  
  register() {
    process.on("SIGTERM", () => this.shutdown("SIGTERM"));
    process.on("SIGINT", () => this.shutdown("SIGINT"));
    
    process.on("uncaughtException", (error) => {
      console.error("Uncaught exception:", error);
      this.shutdown("uncaughtException").finally(() => process.exit(1));
    });
    
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled rejection at:", promise, "reason:", reason);
      this.shutdown("unhandledRejection").finally(() => process.exit(1));
    });
  }
}

// 12. Circuit Breaker Pattern
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private retryDelay: number = 10000
  ) {}
  
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime < this.retryDelay) {
        throw new BunError(
          "Circuit breaker is OPEN",
          "CIRCUIT_BREAKER_OPEN",
          503
        );
      }
      this.state = "HALF_OPEN";
    }
    
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), this.timeout)
        ),
      ]);
      
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Example usage functions
async function handleUsers(req: Request): Promise<Response> {
  if (req.method === "POST") {
    const data = await req.json();
    const validatedData = validateInput(userSchema, data);
    
    return await withDatabaseTransaction(async (db) => {
      // Database operations here
      return Response.json({ success: true, user: validatedData });
    });
  }
  
  throw new BunError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}

async function handleHealth(req: Request): Promise<Response> {
  try {
    // Perform health checks
    const dbStatus = await withDatabaseTransaction(async () => true);
    
    return Response.json({
      status: "healthy",
      timestamp: Date.now(),
      checks: {
        database: dbStatus,
      },
    });
  } catch (error) {
    throw new BunError("Health check failed", "HEALTH_CHECK_FAILED", 503);
  }
}

// Initialize graceful shutdown
const gracefulShutdown = new GracefulShutdown();
gracefulShutdown.register();

// Add cleanup handlers
gracefulShutdown.addHandler(async () => {
  console.log("Closing database connections...");
  // Close database connections
});

gracefulShutdown.addHandler(async () => {
  console.log("Saving application state...");
  // Save any pending data
});

export {
  BunError,
  ValidationError,
  DatabaseError,
  NotFoundError,
  AuthenticationError,
  errorHandler,
  asyncHandler,
  withDatabaseTransaction,
  safeFileOperation,
  safeHttpRequest,
  validateInput,
  safeProcessExecution,
  GracefulShutdown,
  CircuitBreaker,
  webSocketServer,
  gracefulShutdown,
};