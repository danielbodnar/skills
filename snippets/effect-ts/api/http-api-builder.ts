// HTTP API Builder Patterns

import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
  OpenApi
} from "@effect/platform"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer, Schema, Data, DateTime } from "effect"

// 1. Define API Schema and Models
const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.DateTimeUtc
})

const CreateUserRequest = Schema.Struct({
  name: Schema.String,
  email: Schema.String
})

const Post = Schema.Struct({
  id: Schema.Number,
  title: Schema.String,
  content: Schema.String,
  authorId: Schema.Number,
  createdAt: Schema.DateTimeUtc
})

const CreatePostRequest = Schema.Struct({
  title: Schema.String,
  content: Schema.String,
  authorId: Schema.Number
})

// Error types
class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly userId: number
}> {}

class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string
  readonly message: string
}> {}

// 2. Define API Structure
const UsersApi = HttpApiGroup.make("Users")
  .add(
    HttpApiEndpoint.get("getAllUsers")`/users`
      .addSuccess(Schema.Array(User))
      .annotate(OpenApi.Summary, "Get all users")
      .annotate(OpenApi.Description, "Retrieve a list of all users in the system")
  )
  .add(
    HttpApiEndpoint.get("getUserById")`/users/${HttpApiSchema.param("id", Schema.NumberFromString)}`
      .addSuccess(User)
      .addError(UserNotFoundError)
      .annotate(OpenApi.Summary, "Get user by ID")
      .annotate(OpenApi.Description, "Retrieve a specific user by their ID")
  )
  .add(
    HttpApiEndpoint.post("createUser")`/users`
      .addSuccess(User, { status: 201 })
      .addError(ValidationError)
      .setPayload(CreateUserRequest)
      .annotate(OpenApi.Summary, "Create new user")
      .annotate(OpenApi.Description, "Create a new user in the system")
  )
  .add(
    HttpApiEndpoint.put("updateUser")`/users/${HttpApiSchema.param("id", Schema.NumberFromString)}`
      .addSuccess(User)
      .addError(UserNotFoundError)
      .addError(ValidationError)
      .setPayload(CreateUserRequest)
      .annotate(OpenApi.Summary, "Update user")
      .annotate(OpenApi.Description, "Update an existing user's information")
  )
  .add(
    HttpApiEndpoint.del("deleteUser")`/users/${HttpApiSchema.param("id", Schema.NumberFromString)}`
      .addSuccess(Schema.Void, { status: 204 })
      .addError(UserNotFoundError)
      .annotate(OpenApi.Summary, "Delete user")
      .annotate(OpenApi.Description, "Remove a user from the system")
  )

const PostsApi = HttpApiGroup.make("Posts")
  .add(
    HttpApiEndpoint.get("getAllPosts")`/posts`
      .addSuccess(Schema.Array(Post))
      .annotate(OpenApi.Summary, "Get all posts")
  )
  .add(
    HttpApiEndpoint.get("getPostById")`/posts/${HttpApiSchema.param("id", Schema.NumberFromString)}`
      .addSuccess(Post)
      .annotate(OpenApi.Summary, "Get post by ID")
  )
  .add(
    HttpApiEndpoint.post("createPost")`/posts`
      .addSuccess(Post, { status: 201 })
      .setPayload(CreatePostRequest)
      .annotate(OpenApi.Summary, "Create new post")
  )
  .add(
    HttpApiEndpoint.get("getPostsByUser")`/users/${HttpApiSchema.param("userId", Schema.NumberFromString)}/posts`
      .addSuccess(Schema.Array(Post))
      .annotate(OpenApi.Summary, "Get posts by user")
  )

// 3. Main API Definition
const MyApi = HttpApi.make("BlogAPI")
  .add(UsersApi)
  .add(PostsApi)
  .annotate(OpenApi.Title, "Blog API")
  .annotate(OpenApi.Description, "A RESTful API for a blogging platform")
  .annotate(OpenApi.Version, "1.0.0")
  .annotate(OpenApi.License, { 
    name: "MIT", 
    url: "https://opensource.org/licenses/MIT" 
  })
  .prefix("/api/v1")

// 4. In-memory Data Store
let users: Array<typeof User.Type> = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    createdAt: DateTime.unsafeNow()
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    createdAt: DateTime.unsafeNow()
  }
]

let posts: Array<typeof Post.Type> = [
  {
    id: 1,
    title: "First Post",
    content: "This is the first post content",
    authorId: 1,
    createdAt: DateTime.unsafeNow()
  },
  {
    id: 2,
    title: "Second Post",
    content: "This is the second post content",
    authorId: 2,
    createdAt: DateTime.unsafeNow()
  }
]

// 5. Implement Users API Handlers
const UsersApiLive = HttpApiBuilder.group(MyApi, "Users", (handlers) =>
  handlers
    .handle("getAllUsers", () => Effect.succeed(users))
    
    .handle("getUserById", ({ path: { id } }) =>
      Effect.gen(function* () {
        const user = users.find(u => u.id === id)
        if (!user) {
          yield* Effect.fail(new UserNotFoundError({ userId: id }))
        }
        return user
      })
    )
    
    .handle("createUser", ({ payload }) =>
      Effect.gen(function* () {
        // Validate email uniqueness
        const existingUser = users.find(u => u.email === payload.email)
        if (existingUser) {
          yield* Effect.fail(new ValidationError({
            field: "email",
            message: "Email already exists"
          }))
        }
        
        const newUser = {
          id: Math.max(...users.map(u => u.id), 0) + 1,
          ...payload,
          createdAt: DateTime.unsafeNow()
        }
        
        users.push(newUser)
        return newUser
      })
    )
    
    .handle("updateUser", ({ path: { id }, payload }) =>
      Effect.gen(function* () {
        const userIndex = users.findIndex(u => u.id === id)
        if (userIndex === -1) {
          yield* Effect.fail(new UserNotFoundError({ userId: id }))
        }
        
        // Check email uniqueness (excluding current user)
        const existingUser = users.find(u => u.email === payload.email && u.id !== id)
        if (existingUser) {
          yield* Effect.fail(new ValidationError({
            field: "email",
            message: "Email already exists"
          }))
        }
        
        users[userIndex] = {
          ...users[userIndex],
          ...payload
        }
        
        return users[userIndex]
      })
    )
    
    .handle("deleteUser", ({ path: { id } }) =>
      Effect.gen(function* () {
        const userIndex = users.findIndex(u => u.id === id)
        if (userIndex === -1) {
          yield* Effect.fail(new UserNotFoundError({ userId: id }))
        }
        
        users.splice(userIndex, 1)
        // Also delete user's posts
        posts = posts.filter(p => p.authorId !== id)
        
        return undefined as void
      })
    )
)

// 6. Implement Posts API Handlers
const PostsApiLive = HttpApiBuilder.group(MyApi, "Posts", (handlers) =>
  handlers
    .handle("getAllPosts", () => Effect.succeed(posts))
    
    .handle("getPostById", ({ path: { id } }) =>
      Effect.gen(function* () {
        const post = posts.find(p => p.id === id)
        if (!post) {
          yield* Effect.fail(new Error("Post not found"))
        }
        return post
      })
    )
    
    .handle("createPost", ({ payload }) =>
      Effect.gen(function* () {
        // Verify author exists
        const author = users.find(u => u.id === payload.authorId)
        if (!author) {
          yield* Effect.fail(new ValidationError({
            field: "authorId",
            message: "Author not found"
          }))
        }
        
        const newPost = {
          id: Math.max(...posts.map(p => p.id), 0) + 1,
          ...payload,
          createdAt: DateTime.unsafeNow()
        }
        
        posts.push(newPost)
        return newPost
      })
    )
    
    .handle("getPostsByUser", ({ path: { userId } }) =>
      Effect.gen(function* () {
        const userPosts = posts.filter(p => p.authorId === userId)
        return userPosts
      })
    )
)

// 7. API Middleware
const LoggingMiddleware = HttpMiddleware.make((app) =>
  Effect.gen(function* () {
    const request = yield* import("@effect/platform").then(m => m.HttpServerRequest.HttpServerRequest)
    const start = Date.now()
    
    yield* Effect.log(`${request.method} ${request.url} - Started`)
    
    const response = yield* app
    
    const duration = Date.now() - start
    yield* Effect.log(`${request.method} ${request.url} - ${duration}ms`)
    
    return response
  })
)

const CorsMiddleware = HttpMiddleware.make((app) =>
  Effect.gen(function* () {
    const response = yield* app
    
    return response.pipe(
      import("@effect/platform").then(m => m.HttpServerResponse.setHeaders({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }))
    )
  })
)

// 8. Combine API Implementation
const ApiLive = HttpApiBuilder.api(MyApi).pipe(
  Layer.provide(UsersApiLive),
  Layer.provide(PostsApiLive)
)

// 9. Server Configuration
const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()), // Auto-generated Swagger docs
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(BunHttpServer.layer({ port: 3000 }))
)

// 10. Additional API Features

// Health Check Endpoint
const HealthApi = HttpApiGroup.make("Health")
  .add(
    HttpApiEndpoint.get("health")`/health`
      .addSuccess(Schema.Struct({
        status: Schema.Literal("ok"),
        timestamp: Schema.String,
        uptime: Schema.Number
      }))
      .annotate(OpenApi.Summary, "Health check")
  )

const startTime = Date.now()

const HealthApiLive = HttpApiBuilder.group(MyApi, "Health", (handlers) =>
  handlers.handle("health", () =>
    Effect.succeed({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime
    })
  )
)

// API with Versioning
const VersionedApi = HttpApi.make("BlogAPI")
  .add(UsersApi.prefix("/v1"))
  .add(PostsApi.prefix("/v1"))
  .add(HealthApi)
  .prefix("/api")

// 11. Launch Server
const launchServer = () => {
  console.log("Starting Blog API server...")
  console.log("API Documentation available at: http://localhost:3000/docs")
  console.log("Health check available at: http://localhost:3000/api/health")
  
  return BunRuntime.runMain(Layer.launch(ServerLive))
}

// 12. API Client Generation (for consumption)
const createApiClient = () => {
  const baseUrl = "http://localhost:3000/api/v1"
  
  return {
    users: {
      getAll: () => fetch(`${baseUrl}/users`).then(r => r.json()),
      getById: (id: number) => fetch(`${baseUrl}/users/${id}`).then(r => r.json()),
      create: (user: typeof CreateUserRequest.Type) =>
        fetch(`${baseUrl}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user)
        }).then(r => r.json()),
      update: (id: number, user: typeof CreateUserRequest.Type) =>
        fetch(`${baseUrl}/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user)
        }).then(r => r.json()),
      delete: (id: number) =>
        fetch(`${baseUrl}/users/${id}`, { method: "DELETE" })
    },
    posts: {
      getAll: () => fetch(`${baseUrl}/posts`).then(r => r.json()),
      getById: (id: number) => fetch(`${baseUrl}/posts/${id}`).then(r => r.json()),
      create: (post: typeof CreatePostRequest.Type) =>
        fetch(`${baseUrl}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(post)
        }).then(r => r.json()),
      getByUser: (userId: number) =>
        fetch(`${baseUrl}/users/${userId}/posts`).then(r => r.json())
    }
  }
}

export {
  MyApi,
  UsersApi,
  PostsApi,
  HealthApi,
  ApiLive,
  ServerLive,
  launchServer,
  createApiClient,
  User,
  Post,
  CreateUserRequest,
  CreatePostRequest,
  UserNotFoundError,
  ValidationError
}