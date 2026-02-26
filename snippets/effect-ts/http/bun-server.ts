// Bun HTTP Server with Effect-TS

import { 
  HttpRouter, 
  HttpServer, 
  HttpServerResponse, 
  HttpServerRequest,
  HttpMiddleware
} from "@effect/platform"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Layer, Effect, Schema } from "effect"

// 1. Basic HTTP Server
const basicServer = () => {
  const router = HttpRouter.empty.pipe(
    HttpRouter.get("/", HttpServerResponse.text("Hello World")),
    HttpRouter.get("/json", HttpServerResponse.json({ message: "Hello JSON" })),
    HttpRouter.post("/echo", 
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const body = yield* request.json
        return HttpServerResponse.json({ echo: body })
      })
    )
  )
  
  const app = router.pipe(
    HttpServer.serve(),
    HttpServer.withLogAddress
  )
  
  const ServerLive = BunHttpServer.layer({ port: 3000 })
  
  return BunRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)))
}

// 2. HTTP Server with Middleware
const serverWithMiddleware = () => {
  // Custom logging middleware
  const loggingMiddleware = HttpMiddleware.make((app) =>
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const start = Date.now()
      
      yield* Effect.log(`${request.method} ${request.url} - Started`)
      
      const response = yield* app
      
      const duration = Date.now() - start
      yield* Effect.log(`${request.method} ${request.url} - ${duration}ms`)
      
      return response
    })
  )
  
  // CORS middleware
  const corsMiddleware = HttpMiddleware.make((app) =>
    Effect.gen(function* () {
      const response = yield* app
      
      return response.pipe(
        HttpServerResponse.setHeaders({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        })
      )
    })
  )
  
  const router = HttpRouter.empty.pipe(
    HttpRouter.get("/", HttpServerResponse.text("Server with middleware")),
    HttpRouter.get("/api/health", HttpServerResponse.json({ status: "ok" })),
    HttpRouter.post("/api/data", 
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const body = yield* request.json
        yield* Effect.log(`Received data: ${JSON.stringify(body)}`)
        return HttpServerResponse.json({ received: true, data: body })
      })
    ),
    // Apply middleware to entire router
    HttpRouter.use(loggingMiddleware),
    HttpRouter.use(corsMiddleware)
  )
  
  const app = router.pipe(HttpServer.serve())
  const ServerLive = BunHttpServer.layer({ port: 3001 })
  
  return BunRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)))
}

// 3. RESTful API Server
const restApiServer = () => {
  // Sample data store
  let users = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" }
  ]
  
  const UserSchema = Schema.Struct({
    name: Schema.String,
    email: Schema.String
  })
  
  const router = HttpRouter.empty.pipe(
    // GET /users - List all users
    HttpRouter.get("/users", 
      HttpServerResponse.json(users)
    ),
    
    // GET /users/:id - Get specific user
    HttpRouter.get("/users/:id",
      Effect.gen(function* () {
        const { params } = yield* HttpServerRequest.HttpServerRequest
        const id = parseInt(params.id)
        const user = users.find(u => u.id === id)
        
        if (!user) {
          return HttpServerResponse.json(
            { error: "User not found" }, 
            { status: 404 }
          )
        }
        
        return HttpServerResponse.json(user)
      })
    ),
    
    // POST /users - Create new user
    HttpRouter.post("/users",
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const body = yield* request.json
        
        // Validate request body
        const validatedUser = yield* Schema.decodeUnknown(UserSchema)(body)
        
        const newUser = {
          id: Math.max(...users.map(u => u.id)) + 1,
          ...validatedUser
        }
        
        users.push(newUser)
        
        return HttpServerResponse.json(newUser, { status: 201 })
      }).pipe(
        Effect.catchAll(error => 
          Effect.succeed(HttpServerResponse.json(
            { error: "Invalid user data", details: String(error) },
            { status: 400 }
          ))
        )
      )
    ),
    
    // PUT /users/:id - Update user
    HttpRouter.put("/users/:id",
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const { params } = request
        const id = parseInt(params.id)
        const body = yield* request.json
        
        const userIndex = users.findIndex(u => u.id === id)
        if (userIndex === -1) {
          return HttpServerResponse.json(
            { error: "User not found" },
            { status: 404 }
          )
        }
        
        const validatedUser = yield* Schema.decodeUnknown(UserSchema)(body)
        users[userIndex] = { id, ...validatedUser }
        
        return HttpServerResponse.json(users[userIndex])
      }).pipe(
        Effect.catchAll(error =>
          Effect.succeed(HttpServerResponse.json(
            { error: "Invalid user data", details: String(error) },
            { status: 400 }
          ))
        )
      )
    ),
    
    // DELETE /users/:id - Delete user
    HttpRouter.delete("/users/:id",
      Effect.gen(function* () {
        const { params } = yield* HttpServerRequest.HttpServerRequest
        const id = parseInt(params.id)
        
        const userIndex = users.findIndex(u => u.id === id)
        if (userIndex === -1) {
          return HttpServerResponse.json(
            { error: "User not found" },
            { status: 404 }
          )
        }
        
        users.splice(userIndex, 1)
        return HttpServerResponse.json({ message: "User deleted" })
      })
    )
  )
  
  const app = router.pipe(HttpServer.serve())
  const ServerLive = BunHttpServer.layer({ port: 3002 })
  
  return BunRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)))
}

// 4. WebSocket Server
const webSocketServer = () => {
  const router = HttpRouter.empty.pipe(
    HttpRouter.get("/", HttpServerResponse.text("WebSocket Server")),
    
    HttpRouter.get("/ws",
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        
        // Upgrade to WebSocket
        return HttpServerResponse.webSocket((ws) =>
          Effect.gen(function* () {
            yield* Effect.log("WebSocket connection established")
            
            // Send welcome message
            yield* ws.send("Welcome to Effect WebSocket!")
            
            // Handle incoming messages
            yield* ws.run((message) =>
              Effect.gen(function* () {
                yield* Effect.log(`Received: ${message}`)
                yield* ws.send(`Echo: ${message}`)
              })
            )
          }).pipe(
            Effect.catchAll(error => Effect.log(`WebSocket error: ${error}`))
          )
        )
      })
    )
  )
  
  const app = router.pipe(HttpServer.serve())
  const ServerLive = BunHttpServer.layer({ port: 3003 })
  
  return BunRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)))
}

// 5. Static File Server
const staticFileServer = () => {
  const router = HttpRouter.empty.pipe(
    HttpRouter.get("/", HttpServerResponse.text("Static File Server")),
    
    // Serve static files from public directory
    HttpRouter.get("/static/*",
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const filePath = request.url.replace("/static/", "")
        
        try {
          const file = Bun.file(`./public/${filePath}`)
          const exists = yield* Effect.promise(() => file.exists())
          
          if (!exists) {
            return HttpServerResponse.text("File not found", { status: 404 })
          }
          
          const content = yield* Effect.promise(() => file.arrayBuffer())
          
          return HttpServerResponse.raw(new Uint8Array(content), {
            headers: {
              "Content-Type": file.type || "application/octet-stream",
              "Cache-Control": "public, max-age=3600"
            }
          })
        } catch (error) {
          return HttpServerResponse.text("Error reading file", { status: 500 })
        }
      })
    )
  )
  
  const app = router.pipe(HttpServer.serve())
  const ServerLive = BunHttpServer.layer({ port: 3004 })
  
  return BunRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)))
}

// 6. Server with Authentication
const authenticatedServer = () => {
  // Simple token validation
  const authMiddleware = HttpMiddleware.make((app) =>
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const authHeader = request.headers.authorization
      
      if (request.url.startsWith("/api/protected")) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return HttpServerResponse.json(
            { error: "Authorization required" },
            { status: 401 }
          )
        }
        
        const token = authHeader.slice(7)
        if (token !== "valid-token") {
          return HttpServerResponse.json(
            { error: "Invalid token" },
            { status: 403 }
          )
        }
      }
      
      return yield* app
    })
  )
  
  const router = HttpRouter.empty.pipe(
    HttpRouter.get("/", HttpServerResponse.text("Authenticated Server")),
    
    HttpRouter.post("/auth/login",
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const { username, password } = yield* request.json
        
        if (username === "admin" && password === "secret") {
          return HttpServerResponse.json({ token: "valid-token" })
        }
        
        return HttpServerResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        )
      })
    ),
    
    HttpRouter.get("/api/protected/data",
      HttpServerResponse.json({ secret: "This is protected data" })
    ),
    
    HttpRouter.use(authMiddleware)
  )
  
  const app = router.pipe(HttpServer.serve())
  const ServerLive = BunHttpServer.layer({ port: 3005 })
  
  return BunRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)))
}

// Helper function to create a reusable server configuration
const createServer = (
  router: typeof HttpRouter.empty,
  port: number
) => {
  const app = router.pipe(
    HttpServer.serve(),
    HttpServer.withLogAddress
  )
  
  const ServerLive = BunHttpServer.layer({ port })
  
  return Layer.launch(Layer.provide(app, ServerLive))
}

export {
  basicServer,
  serverWithMiddleware,
  restApiServer,
  webSocketServer,
  staticFileServer,
  authenticatedServer,
  createServer
}