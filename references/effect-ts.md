# Effect-TS Reference

**Always remember to reference @$HOME/.claude/references/effect-ts.md and look for snippets and examples in @$HOME/.claude/snippets/effect-ts/**

## Quick Reference

- Installation: `bun add effect @effect/schema`
- Import: `import { Effect } from "effect"` and `import { Schema } from "@effect/schema"`
- Documentation: <https://effect.website/docs/>
- GitHub: <https://github.com/Effect-TS/effect>
- Package: <https://www.npmjs.com/package/effect>

## Default Usage Patterns

Default to using Effect-TS for building production-ready TypeScript applications with functional effect systems:

- **Effect-TS**: Powerful TypeScript library for type-safe, composable, concurrent, and resource-safe applications
- **Effect-TS Schema**: Runtime validation and type-safe data transformations (preferred over Zod)
- **Functional Programming**: Built on functional programming principles with advanced error handling
- **Fiber-based Concurrency**: Lightweight cooperative threads for scalable concurrent programming
- **Resource Safety**: Automatic resource management and cleanup
- **Type Safety**: Strong type inference and compile-time safety guarantees
- **Observability**: Built-in tracing, metrics, and logging capabilities

## Resources and Documentation

- [Effect Website](https://effect.website/)
  - [Getting Started](https://effect.website/docs/getting-started/)
  - [API Reference](https://effect.website/docs/api/)
    - [Core APIs](https://effect.website/docs/api/effect/)
    - [Platform APIs](https://effect.website/docs/api/platform/)
    - [SQL APIs](https://effect.website/docs/api/sql/)
    - [CLI APIs](https://effect.website/docs/api/cli/)
    - [RPC APIs](https://effect.website/docs/api/rpc/)
  - [Examples](https://effect.website/docs/getting-started/examples)
  - [Migration Guides](https://effect.website/docs/migration/)
- [Community Resources](https://effect.website/docs/community/)
  - [Discord Community](https://discord.gg/hdt7t7jpvn)
  - [Tutorials](https://effect.website/docs/tutorials/)
  - [Blog Posts](https://effect.website/blog/)

## Core Concepts

### Effect Type

- `Effect<A, E, R>` - Represents an effectful computation
  - `A` - Success type
  - `E` - Error type  
  - `R` - Requirements/Context type

### Fiber-based Concurrency

- Lightweight cooperative threads
- Non-blocking concurrent execution
- Structured concurrency patterns
- Resource-safe concurrent operations

### Functional Error Handling

- Type-safe error management
- Composable error handling strategies
- Structured error causes and diagnostics
- Retry and recovery mechanisms

### Resource Safety

- Automatic resource cleanup
- Scoped resource management
- Safe resource acquisition and release
- Prevention of resource leaks

### Dependency Injection

- Layer-based dependency injection
- Type-safe service resolution
- Composable service layers
- Environment management

## Core APIs

### Effect Creation

```typescript
Effect.succeed(value)           // Success effect
Effect.fail(error)             // Failing effect
Effect.die(defect)             // Defect (unrecoverable error)
Effect.sync(() => computation)  // Synchronous effect
Effect.async(callback)         // Asynchronous effect
Effect.promise(() => promise)  // Promise-based effect
Effect.tryPromise(options)     // Safe promise wrapping
```

### Effect Execution

```typescript
Effect.runPromise(effect)      // Execute as Promise
Effect.runSync(effect)         // Execute synchronously
Effect.runFork(effect)         // Execute in background fiber
Effect.runPromiseExit(effect)  // Execute with Exit result
```

### Effect Composition

```typescript
Effect.gen(function*)          // Generator-based composition
Effect.map(effect, fn)         // Transform success value
Effect.flatMap(effect, fn)     // Chain effects
Effect.andThen(effect1, effect2) // Sequential execution
Effect.tap(effect, fn)         // Side effects
Effect.as(effect, value)       // Replace success value
```

### Concurrency

```typescript
Effect.fork(effect)            // Fork into new fiber
Effect.race(effect1, effect2)  // Race effects
Effect.all(effects, options)   // Combine effects
Effect.forEach(collection, fn, options) // Iterate concurrently
Effect.zip(effect1, effect2, options)   // Combine two effects
Fiber.join(fiber)              // Wait for fiber completion
Fiber.interrupt(fiber)         // Interrupt fiber
```

### Error Handling

```typescript
Effect.catchAll(effect, handler)     // Catch all errors
Effect.catchSome(effect, handler)    // Catch specific errors
Effect.catchTags(effect, handlers)   // Catch tagged errors
Effect.retry(effect, schedule)       // Retry with schedule
Effect.timeout(effect, duration)     // Add timeout
Effect.sandbox(effect)               // Expose full causes
Effect.unsandbox(effect)             // Restore error channel
```

### Resource Management

```typescript
Effect.acquireRelease(acquire, release) // Safe resource management
Effect.scoped(effect)                   // Scoped resource handling
Effect.addFinalizer(finalizer)          // Add cleanup finalizer
Effect.ensuring(effect, finalizer)      // Ensure finalizer runs
```

### Layer and Services

```typescript
Layer.succeed(service)         // Create service layer
Layer.effect(tag, effect)      // Effect-based layer
Layer.provide(layer)           // Provide layer to effect
Context.Tag()                  // Service tag definition
Effect.service(tag)            // Access service
```

## Platform Integration

### Bun Platform

```typescript
import { BunContext, BunRuntime } from "@effect/platform-bun"
import { BunHttpServer } from "@effect/platform-bun"

// Use BunRuntime for execution
BunRuntime.runMain(effect)

// Provide Bun context
Effect.provide(BunContext.layer)

// Bun HTTP server
BunHttpServer.layer({ port: 3000 })
```

### Node.js Platform

```typescript
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { NodeHttpServer } from "@effect/platform-node"

// Use NodeRuntime for execution
NodeRuntime.runMain(effect)

// Provide Node context
Effect.provide(NodeContext.layer)

// Node HTTP server
NodeHttpServer.layer(createServer, { port: 3000 })
```

### HTTP APIs

```typescript
import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"

// Define API structure
const api = HttpApi.make("MyApi")
  .add(HttpApiGroup.make("Users")
    .add(HttpApiEndpoint.get("getUser")`/user/${idParam}`)
  )

// Implement handlers
const implementation = HttpApiBuilder.group(api, "Users", handlers =>
  handlers.handle("getUser", ({ path }) => 
    Effect.succeed(`User ${path.id}`)
  )
)

// Serve API
HttpApiBuilder.serve().pipe(
  Layer.provide(implementation)
)
```

### Database Integration with Schema Validation

```typescript
import { SqlClient } from "@effect/sql"
import { PgClient } from "@effect/sql-pg"
import { Schema } from "@effect/schema"

// Define schema for database entities
const UserSchema = Schema.Struct({
  id: Schema.String.pipe(Schema.brand('UserId')),
  username: Schema.String,
  email: Schema.String.pipe(Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/)),
  createdAt: Schema.DateFromString
})

type User = Schema.Type<typeof UserSchema>

// Configure database layer
const SqlLive = PgClient.layer({
  database: "mydb",
  host: "localhost",
  port: 5432
})

// Use SQL client with schema validation
const program = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const rawUsers = yield* sql`SELECT * FROM users`
  const users = yield* Effect.forEach(rawUsers, (user) =>
    Schema.decodeUnknown(UserSchema)(user)
  )
  return users
})
```

## Testing Patterns

### Unit Testing

```typescript
import { it } from "@effect/vitest"
import { Effect } from "effect"

it.effect("should handle success", () =>
  Effect.gen(function* () {
    const result = yield* myEffect()
    expect(result).toBe(expected)
  })
)
```

### Mock Services

```typescript
const MockUserService = Layer.succeed(
  UserService,
  UserService.of({
    getUser: (id) => Effect.succeed({ id, name: "Mock User" })
  })
)

const test = program.pipe(
  Effect.provide(MockUserService)
)
```

## Performance Patterns

### Batching

```typescript
// Batch operations for efficiency
Effect.all(operations, { 
  concurrency: 10,
  batching: true 
})
```

### Streaming

```typescript
import { Stream } from "effect"

// Process large datasets with streams
Stream.make(1, 2, 3, 4, 5).pipe(
  Stream.mapEffect(processItem, { concurrency: 4 }),
  Stream.runCollect
)
```

### Memoization

```typescript
// Cache expensive computations
const memoized = Effect.memoize(expensiveComputation)
```

## Advanced Patterns

### Custom Error Types with Schema Validation

```typescript
import { Data } from "effect"
import { Schema } from "@effect/schema"

class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly userId: string
}> {}

class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly cause: unknown
}> {}

class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly errors: Schema.ParseError
}> {}

// Schema-validated data processing
const processUserData = (rawData: unknown) =>
  Effect.gen(function* () {
    const userData = yield* Schema.decodeUnknown(UserSchema)(rawData)
      .pipe(Effect.catchAll((error) => 
        Effect.fail(new ValidationError({ errors: error }))
      ))
    
    return yield* processValidatedUser(userData)
  })
```

### Resource Pools

```typescript
import { Pool } from "effect"

const connectionPool = Pool.make({
  acquire: createConnection,
  size: 10
})

const withConnection = <A, E>(
  f: (conn: Connection) => Effect.Effect<A, E>
) => Pool.get(connectionPool).pipe(
  Effect.flatMap(f),
  Effect.scoped
)
```

### Supervision

```typescript
import { Supervisor } from "effect"

const supervisor = Supervisor.track
const program = effect.pipe(
  Effect.supervised(supervisor)
)
```

## Effect-TS Schema Integration

### Schema Definition and Validation

```typescript
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"

// Define schemas with advanced validation
const UserCreateSchema = Schema.Struct({
  username: Schema.String.pipe(Schema.minLength(3)),
  email: Schema.String.pipe(Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/)),
  age: Schema.Number.pipe(Schema.between(13, 120)),
  preferences: Schema.optional(Schema.Record(Schema.String, Schema.Unknown))
})

// Transform and validate data
const createUser = (rawData: unknown) =>
  pipe(
    Schema.decodeUnknown(UserCreateSchema)(rawData),
    Effect.map((data) => ({ ...data, id: crypto.randomUUID() })),
    Effect.flatMap((user) => saveUserToDatabase(user))
  )

// JSON Schema generation for APIs
const generateApiSchema = () => {
  const { JSONSchema } = require("@effect/schema")
  return JSONSchema.make(UserCreateSchema)
}
```

### Schema Equivalence and Comparisons

```typescript
import { Schema } from "@effect/schema"

// Create equivalence for value comparison
const UserEquivalence = Schema.equivalence(UserSchema)

// Compare users based on schema definition
const areUsersEqual = (user1: User, user2: User) =>
  UserEquivalence(user1, user2)

// Custom equivalence logic
const CustomUserSchema = Schema.String.annotations({
  equivalence: (s1, s2) => s1.toLowerCase() === s2.toLowerCase()
})
```

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/effect-ts/`:

- Basic usage patterns
- Advanced concurrency patterns  
- HTTP server implementations
- Database integration examples
- Schema validation patterns
- Error handling strategies
- Resource management patterns
- Testing utilities and mocks
- Performance optimization techniques

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/effect-ts/schemas/`

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/effect-ts/linting/`

## Migration Guides

### From Promise-based Code

```typescript
// Before (Promise)
const fetchUser = async (id: string) => {
  try {
    const response = await fetch(`/users/${id}`)
    return await response.json()
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error}`)
  }
}

// After (Effect)
const fetchUser = (id: string) =>
  Effect.tryPromise({
    try: () => fetch(`/users/${id}`).then(res => res.json()),
    catch: (error) => new UserFetchError({ id, error })
  })
```

### From Callback-based Code

```typescript
// Before (Callback)
const readFile = (path: string, callback: (err: Error | null, data?: string) => void) => {
  fs.readFile(path, 'utf8', callback)
}

// After (Effect)
const readFile = (path: string) =>
  Effect.async<string, Error>((resume) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) resume(Effect.fail(err))
      else resume(Effect.succeed(data))
    })
  })
```

## Common Patterns

### Request-Response Pattern

```typescript
const apiCall = <A>(request: Request) =>
  Effect.gen(function* () {
    const response = yield* fetch(request)
    if (!response.ok) {
      yield* Effect.fail(new ApiError({ status: response.status }))
    }
    return yield* Effect.tryPromise({
      try: () => response.json() as Promise<A>,
      catch: () => new ParseError()
    })
  })
```

### Retry with Exponential Backoff

```typescript
import { Schedule } from "effect"

const withRetry = <A, E>(effect: Effect.Effect<A, E>) =>
  effect.pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(
        Schedule.jittered,
        Schedule.withMaxElapsed("5 seconds")
      )
    )
  )
```

### Circuit Breaker Pattern

```typescript
import { CircuitBreaker } from "effect"

const circuitBreaker = CircuitBreaker.make({
  maxFailures: 5,
  resetTimeout: "30 seconds"
})

const protectedCall = (request: Request) =>
  CircuitBreaker.withCircuitBreaker(
    circuitBreaker,
    apiCall(request)
  )
```
