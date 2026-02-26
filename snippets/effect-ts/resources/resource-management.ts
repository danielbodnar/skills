// Resource Management Patterns

import { Effect, Layer, Context, Scope } from "effect"

// 1. Basic Resource Acquisition and Release
const basicResourceManagement = Effect.gen(function* () {
  const acquireResource = Effect.gen(function* () {
    yield* Effect.log("Acquiring database connection")
    return {
      id: Math.random(),
      query: (sql: string) => Effect.succeed(`Result of: ${sql}`)
    }
  })
  
  const releaseResource = (connection: any) =>
    Effect.log(`Releasing connection ${connection.id}`)
  
  const useResource = (connection: any) =>
    Effect.gen(function* () {
      const result = yield* connection.query("SELECT * FROM users")
      yield* Effect.log(`Query result: ${result}`)
      return result
    })
  
  // Safe resource management with automatic cleanup
  const result = yield* Effect.acquireRelease(
    acquireResource,
    releaseResource
  ).pipe(
    Effect.flatMap(useResource)
  )
  
  return result
})

// 2. Scoped Resource Management
const scopedResourceManagement = Effect.gen(function* () {
  const DatabaseConnection = Context.GenericTag<{
    query: (sql: string) => Effect.Effect<string>
    close: () => Effect.Effect<void>
  }>("DatabaseConnection")
  
  const acquireConnection = Effect.gen(function* () {
    yield* Effect.log("Opening database connection")
    const connection = {
      query: (sql: string) => Effect.succeed(`Query result: ${sql}`),
      close: () => Effect.log("Closing database connection")
    }
    
    // Add finalizer to scope
    yield* Effect.addFinalizer(() => connection.close())
    
    return connection
  })
  
  const DatabaseLive = Layer.effect(DatabaseConnection, acquireConnection)
  
  const program = Effect.gen(function* () {
    const db = yield* DatabaseConnection
    const users = yield* db.query("SELECT * FROM users")
    const posts = yield* db.query("SELECT * FROM posts")
    
    yield* Effect.log(`Users: ${users}`)
    yield* Effect.log(`Posts: ${posts}`)
    
    return { users, posts }
  })
  
  // Run with scoped resource - connection will be automatically closed
  const result = yield* program.pipe(
    Effect.provide(DatabaseLive),
    Effect.scoped
  )
  
  return result
})

// 3. Resource Pool Management
const resourcePoolManagement = Effect.gen(function* () {
  // Simulate a connection pool
  class ConnectionPool {
    private connections: Array<{ id: number; inUse: boolean }> = []
    private maxSize = 5
    
    acquire = Effect.gen(function* () {
      // Find available connection
      let connection = this.connections.find(c => !c.inUse)
      
      if (!connection && this.connections.length < this.maxSize) {
        // Create new connection
        const id = this.connections.length + 1
        connection = { id, inUse: false }
        this.connections.push(connection)
        yield* Effect.log(`Created new connection ${id}`)
      }
      
      if (!connection) {
        yield* Effect.fail("Pool exhausted")
      }
      
      connection.inUse = true
      yield* Effect.log(`Acquired connection ${connection.id}`)
      return connection
    })
    
    release = (connection: { id: number; inUse: boolean }) =>
      Effect.gen(function* () {
        connection.inUse = false
        yield* Effect.log(`Released connection ${connection.id}`)
      })
    
    close = Effect.gen(function* () {
      yield* Effect.log(`Closing pool with ${this.connections.length} connections`)
      this.connections = []
    })
  }
  
  const pool = new ConnectionPool()
  
  const useConnection = <A>(work: (conn: any) => Effect.Effect<A>) =>
    Effect.acquireRelease(
      pool.acquire,
      pool.release
    ).pipe(
      Effect.flatMap(work)
    )
  
  // Use multiple connections concurrently
  const tasks = Array.from({ length: 3 }, (_, i) =>
    useConnection(conn =>
      Effect.gen(function* () {
        yield* Effect.log(`Task ${i} using connection ${conn.id}`)
        yield* Effect.sleep("1 second")
        return `Task ${i} result`
      })
    )
  )
  
  const results = yield* Effect.all(tasks, { concurrency: "unbounded" })
  yield* pool.close
  
  return results
})

// 4. File System Resource Management
const fileSystemResourceManagement = Effect.gen(function* () {
  const readFile = (path: string) =>
    Effect.acquireRelease(
      Effect.gen(function* () {
        yield* Effect.log(`Opening file: ${path}`)
        return { path, handle: Math.random() }
      }),
      (file) => Effect.log(`Closing file: ${file.path}`)
    ).pipe(
      Effect.flatMap(file =>
        Effect.gen(function* () {
          yield* Effect.sleep("100 millis") // Simulate reading
          return `Content of ${file.path}`
        })
      )
    )
  
  const writeFile = (path: string, content: string) =>
    Effect.acquireRelease(
      Effect.gen(function* () {
        yield* Effect.log(`Opening file for write: ${path}`)
        return { path, handle: Math.random() }
      }),
      (file) => Effect.log(`Closing file: ${file.path}`)
    ).pipe(
      Effect.flatMap(file =>
        Effect.gen(function* () {
          yield* Effect.sleep("200 millis") // Simulate writing
          yield* Effect.log(`Wrote to ${file.path}: ${content}`)
          return "Write successful"
        })
      )
    )
  
  // Multiple file operations
  const content1 = yield* readFile("config.json")
  const content2 = yield* readFile("data.json")
  yield* writeFile("output.json", `${content1} + ${content2}`)
  
  return "File operations completed"
})

// 5. HTTP Client Resource Management
const httpClientResourceManagement = Effect.gen(function* () {
  class HttpClient {
    private baseUrl: string
    
    constructor(baseUrl: string) {
      this.baseUrl = baseUrl
    }
    
    connect = Effect.gen(function* () {
      yield* Effect.log(`Connecting to ${this.baseUrl}`)
      return this
    })
    
    disconnect = Effect.log(`Disconnecting from ${this.baseUrl}`)
    
    get = (path: string) =>
      Effect.gen(function* () {
        yield* Effect.sleep("200 millis") // Simulate network request
        return `Response from ${this.baseUrl}${path}`
      })
  }
  
  const withHttpClient = <A>(
    baseUrl: string,
    work: (client: HttpClient) => Effect.Effect<A>
  ) => {
    const client = new HttpClient(baseUrl)
    
    return Effect.acquireRelease(
      client.connect(),
      (client) => client.disconnect
    ).pipe(
      Effect.flatMap(work)
    )
  }
  
  const result = yield* withHttpClient(
    "https://api.example.com",
    (client) =>
      Effect.gen(function* () {
        const users = yield* client.get("/users")
        const posts = yield* client.get("/posts")
        return { users, posts }
      })
  )
  
  return result
})

// 6. Nested Resource Management
const nestedResourceManagement = Effect.gen(function* () {
  const acquireDatabase = Effect.gen(function* () {
    yield* Effect.log("Acquiring database connection")
    return { type: "database", id: "db-1" }
  })
  
  const acquireCache = Effect.gen(function* () {
    yield* Effect.log("Acquiring cache connection")
    return { type: "cache", id: "cache-1" }
  })
  
  const acquireQueue = Effect.gen(function* () {
    yield* Effect.log("Acquiring message queue connection")
    return { type: "queue", id: "queue-1" }
  })
  
  const releaseResource = (resource: any) =>
    Effect.log(`Releasing ${resource.type} connection ${resource.id}`)
  
  // Nested resource acquisition
  const result = yield* Effect.acquireRelease(
    acquireDatabase,
    releaseResource
  ).pipe(
    Effect.flatMap(database =>
      Effect.acquireRelease(
        acquireCache,
        releaseResource
      ).pipe(
        Effect.flatMap(cache =>
          Effect.acquireRelease(
            acquireQueue,
            releaseResource
          ).pipe(
            Effect.flatMap(queue =>
              Effect.gen(function* () {
                yield* Effect.log("Using all resources together")
                yield* Effect.sleep("500 millis")
                return {
                  database: database.id,
                  cache: cache.id,
                  queue: queue.id
                }
              })
            )
          )
        )
      )
    )
  )
  
  return result
})

// 7. Resource with Error Handling
const resourceWithErrorHandling = Effect.gen(function* () {
  const riskyAcquire = Effect.gen(function* () {
    if (Math.random() < 0.3) {
      yield* Effect.fail("Failed to acquire resource")
    }
    yield* Effect.log("Resource acquired successfully")
    return { id: "resource-1", data: "important data" }
  })
  
  const safeRelease = (resource: any) =>
    Effect.gen(function* () {
      yield* Effect.log(`Safely releasing resource ${resource.id}`)
      // Always succeeds, even if something goes wrong
    }).pipe(
      Effect.catchAll(error => Effect.log(`Release error (ignored): ${error}`))
    )
  
  const riskyUse = (resource: any) =>
    Effect.gen(function* () {
      if (Math.random() < 0.5) {
        yield* Effect.fail("Failed to use resource")
      }
      return `Successfully used ${resource.id}`
    })
  
  const result = yield* Effect.acquireRelease(
    riskyAcquire,
    safeRelease
  ).pipe(
    Effect.flatMap(riskyUse),
    Effect.catchAll(error => 
      Effect.gen(function* () {
        yield* Effect.log(`Handled error: ${error}`)
        return "Fallback result"
      })
    )
  )
  
  return result
})

// 8. Resource Timeout Management
const resourceTimeoutManagement = Effect.gen(function* () {
  const slowAcquire = Effect.gen(function* () {
    yield* Effect.sleep("3 seconds")
    yield* Effect.log("Slow resource acquired")
    return { id: "slow-resource" }
  })
  
  const fastRelease = (resource: any) =>
    Effect.log(`Releasing ${resource.id}`)
  
  const timedResourceUse = Effect.acquireRelease(
    slowAcquire,
    fastRelease
  ).pipe(
    Effect.flatMap(resource =>
      Effect.gen(function* () {
        yield* Effect.log(`Using ${resource.id}`)
        return "Resource used successfully"
      })
    ),
    Effect.timeout("2 seconds")
  )
  
  const result = yield* timedResourceUse.pipe(
    Effect.catchAll(error => 
      Effect.gen(function* () {
        yield* Effect.log(`Resource acquisition timed out: ${error}`)
        return "Using cached resource instead"
      })
    )
  )
  
  return result
})

export {
  basicResourceManagement,
  scopedResourceManagement,
  resourcePoolManagement,
  fileSystemResourceManagement,
  httpClientResourceManagement,
  nestedResourceManagement,
  resourceWithErrorHandling,
  resourceTimeoutManagement
}