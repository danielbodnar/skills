# Effect-TS Style Guide

## Imports

```typescript
import { Effect, pipe, Schema, Layer, Context } from "effect"
```

Always import from `effect` directly. Avoid deep imports.

## Effect Creation

```typescript
// Sync computation
Effect.sync(() => computation())

// Async/Promise
Effect.tryPromise({
  try: () => fetch(url),
  catch: (error) => new FetchError({ cause: error }),
})

// Never: Effect.promise(() => ...) without error mapping
```

## Generator Syntax

Prefer `Effect.gen` for sequential composition:

```typescript
const program = Effect.gen(function* () {
  const user = yield* fetchUser(id)
  const posts = yield* fetchPosts(user.id)
  return { user, posts }
})
```

## Error Types

Use `Data.TaggedError` for typed errors:

```typescript
import { Data } from "effect"

class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resource: string
  readonly id: string
}> {}
```

## Schema Validation

```typescript
import { Schema } from "effect"

const UserSchema = Schema.Struct({
  id: Schema.String.pipe(Schema.brand("UserId")),
  email: Schema.String.pipe(Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/)),
  age: Schema.Number.pipe(Schema.between(0, 150)),
})

type User = typeof UserSchema.Type
```

## Service Pattern

```typescript
class UserService extends Context.Tag("UserService")<
  UserService,
  { readonly getUser: (id: string) => Effect.Effect<User, NotFoundError> }
>() {}

const UserServiceLive = Layer.succeed(UserService, {
  getUser: (id) => Effect.gen(function* () { ... }),
})
```

## Pipeline Style

```typescript
// Prefer pipe for transformations
pipe(
  fetchUser(id),
  Effect.flatMap((user) => enrichUser(user)),
  Effect.tap((user) => logAccess(user)),
  Effect.catchTag("NotFoundError", () => Effect.succeed(defaultUser)),
)
```

## Testing

```typescript
import { it } from "@effect/vitest"

it.effect("fetches user", () =>
  Effect.gen(function* () {
    const result = yield* program.pipe(Effect.provide(TestLayer))
    expect(result.name).toBe("Test User")
  })
)
```
