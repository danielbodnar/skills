// SQL Database Integration with Effect-TS

import { Effect, Layer, Schema, Data } from "effect"
import { SqlClient, SqlError } from "@effect/sql"
import { PgClient } from "@effect/sql-pg"

// 1. Database Configuration
const DatabaseConfig = {
  host: "localhost",
  port: 5432,
  database: "blog_db",
  username: "postgres",
  password: "password"
}

// Live database layer
const SqlLive = PgClient.layer(DatabaseConfig)

// Test database layer
const SqlTestLive = PgClient.layer({
  ...DatabaseConfig,
  database: "blog_db_test"
})

// 2. Domain Models
const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})

const Post = Schema.Struct({
  id: Schema.Number,
  title: Schema.String,
  content: Schema.String,
  author_id: Schema.Number,
  published: Schema.Boolean,
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})

const Comment = Schema.Struct({
  id: Schema.Number,
  post_id: Schema.Number,
  author_name: Schema.String,
  content: Schema.String,
  created_at: Schema.DateTimeUtc
})

// Input types
const CreateUser = Schema.Struct({
  name: Schema.String,
  email: Schema.String
})

const CreatePost = Schema.Struct({
  title: Schema.String,
  content: Schema.String,
  author_id: Schema.Number,
  published: Schema.Boolean
})

const CreateComment = Schema.Struct({
  post_id: Schema.Number,
  author_name: Schema.String,
  content: Schema.String
})

// 3. Custom Error Types
class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly userId: number
}> {}

class PostNotFoundError extends Data.TaggedError("PostNotFoundError")<{
  readonly postId: number
}> {}

class EmailAlreadyExistsError extends Data.TaggedError("EmailAlreadyExistsError")<{
  readonly email: string
}> {}

// 4. User Repository
const UserRepository = {
  // Create a new user
  create: (userData: typeof CreateUser.Type) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      // Check if email already exists
      const existingUser = yield* sql<{ count: number }>`
        SELECT COUNT(*) as count FROM users WHERE email = ${userData.email}
      `
      
      if (existingUser[0].count > 0) {
        yield* Effect.fail(new EmailAlreadyExistsError({ email: userData.email }))
      }
      
      const result = yield* sql<typeof User.Type>`
        INSERT INTO users (name, email, created_at, updated_at)
        VALUES (${userData.name}, ${userData.email}, NOW(), NOW())
        RETURNING *
      `
      
      return result[0]
    }),
  
  // Find user by ID
  findById: (id: number) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      const users = yield* sql<typeof User.Type>`
        SELECT * FROM users WHERE id = ${id}
      `
      
      if (users.length === 0) {
        yield* Effect.fail(new UserNotFoundError({ userId: id }))
      }
      
      return users[0]
    }),
  
  // Find user by email
  findByEmail: (email: string) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      const users = yield* sql<typeof User.Type>`
        SELECT * FROM users WHERE email = ${email}
      `
      
      return users[0] ?? null
    }),
  
  // Get all users with pagination
  findAll: (limit = 10, offset = 0) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      const users = yield* sql<typeof User.Type>`
        SELECT * FROM users 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      
      const totalCount = yield* sql<{ count: number }>`
        SELECT COUNT(*) as count FROM users
      `
      
      return {
        users,
        total: totalCount[0].count,
        limit,
        offset
      }
    }),
  
  // Update user
  update: (id: number, userData: Partial<typeof CreateUser.Type>) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      // Check if user exists
      yield* UserRepository.findById(id)
      
      // Check email uniqueness if email is being updated
      if (userData.email) {
        const existingUser = yield* sql<{ count: number }>`
          SELECT COUNT(*) as count FROM users 
          WHERE email = ${userData.email} AND id != ${id}
        `
        
        if (existingUser[0].count > 0) {
          yield* Effect.fail(new EmailAlreadyExistsError({ email: userData.email }))
        }
      }
      
      const updates = []
      const values = []
      
      if (userData.name) {
        updates.push("name = ?")
        values.push(userData.name)
      }
      
      if (userData.email) {
        updates.push("email = ?")
        values.push(userData.email)
      }
      
      if (updates.length === 0) {
        return yield* UserRepository.findById(id)
      }
      
      const result = yield* sql<typeof User.Type>`
        UPDATE users 
        SET ${sql.raw(updates.join(", "))}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      return result[0]
    }),
  
  // Delete user
  delete: (id: number) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      // Check if user exists
      yield* UserRepository.findById(id)
      
      // Delete user's posts and comments first (cascade)
      yield* sql`DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE author_id = ${id})`
      yield* sql`DELETE FROM posts WHERE author_id = ${id}`
      yield* sql`DELETE FROM users WHERE id = ${id}`
      
      return true
    })
}

// 5. Post Repository
const PostRepository = {
  // Create a new post
  create: (postData: typeof CreatePost.Type) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      // Verify author exists
      yield* UserRepository.findById(postData.author_id)
      
      const result = yield* sql<typeof Post.Type>`
        INSERT INTO posts (title, content, author_id, published, created_at, updated_at)
        VALUES (${postData.title}, ${postData.content}, ${postData.author_id}, ${postData.published}, NOW(), NOW())
        RETURNING *
      `
      
      return result[0]
    }),
  
  // Find post by ID
  findById: (id: number) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      const posts = yield* sql<typeof Post.Type>`
        SELECT * FROM posts WHERE id = ${id}
      `
      
      if (posts.length === 0) {
        yield* Effect.fail(new PostNotFoundError({ postId: id }))
      }
      
      return posts[0]
    }),
  
  // Get all posts with author information
  findAllWithAuthor: (limit = 10, offset = 0, publishedOnly = false) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      const whereClause = publishedOnly ? "WHERE p.published = true" : ""
      
      const posts = yield* sql<{
        id: number
        title: string
        content: string
        published: boolean
        created_at: Date
        author_id: number
        author_name: string
        author_email: string
      }>`
        SELECT 
          p.*,
          u.name as author_name,
          u.email as author_email
        FROM posts p
        JOIN users u ON p.author_id = u.id
        ${sql.raw(whereClause)}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      
      return posts
    }),
  
  // Get posts by author
  findByAuthor: (authorId: number, publishedOnly = false) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      const whereClause = publishedOnly 
        ? "WHERE author_id = ? AND published = true"
        : "WHERE author_id = ?"
      
      const posts = yield* sql<typeof Post.Type>`
        SELECT * FROM posts 
        WHERE author_id = ${authorId} 
        ${sql.raw(publishedOnly ? "AND published = true" : "")}
        ORDER BY created_at DESC
      `
      
      return posts
    }),
  
  // Update post
  update: (id: number, postData: Partial<typeof CreatePost.Type>) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      // Check if post exists
      yield* PostRepository.findById(id)
      
      const updates = []
      
      if (postData.title !== undefined) {
        updates.push(`title = '${postData.title}'`)
      }
      
      if (postData.content !== undefined) {
        updates.push(`content = '${postData.content}'`)
      }
      
      if (postData.published !== undefined) {
        updates.push(`published = ${postData.published}`)
      }
      
      if (updates.length === 0) {
        return yield* PostRepository.findById(id)
      }
      
      const result = yield* sql<typeof Post.Type>`
        UPDATE posts 
        SET ${sql.raw(updates.join(", "))}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      return result[0]
    }),
  
  // Delete post
  delete: (id: number) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      // Check if post exists
      yield* PostRepository.findById(id)
      
      // Delete comments first
      yield* sql`DELETE FROM comments WHERE post_id = ${id}`
      yield* sql`DELETE FROM posts WHERE id = ${id}`
      
      return true
    })
}

// 6. Comment Repository
const CommentRepository = {
  // Create a new comment
  create: (commentData: typeof CreateComment.Type) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      // Verify post exists
      yield* PostRepository.findById(commentData.post_id)
      
      const result = yield* sql<typeof Comment.Type>`
        INSERT INTO comments (post_id, author_name, content, created_at)
        VALUES (${commentData.post_id}, ${commentData.author_name}, ${commentData.content}, NOW())
        RETURNING *
      `
      
      return result[0]
    }),
  
  // Get comments for a post
  findByPost: (postId: number) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      const comments = yield* sql<typeof Comment.Type>`
        SELECT * FROM comments 
        WHERE post_id = ${postId}
        ORDER BY created_at ASC
      `
      
      return comments
    }),
  
  // Delete comment
  delete: (id: number) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      
      const result = yield* sql`DELETE FROM comments WHERE id = ${id}`
      
      return true
    })
}

// 7. Database Migrations
const runMigrations = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  // Create users table
  yield* sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  
  // Create posts table
  yield* sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES users(id),
      published BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  
  // Create comments table
  yield* sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id),
      author_name VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  
  // Create indexes
  yield* sql`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`
  yield* sql`CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published)`
  yield* sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`
  
  yield* Effect.log("Database migrations completed successfully")
})

// 8. Transaction Examples
const createUserWithPost = (
  userData: typeof CreateUser.Type,
  postData: Omit<typeof CreatePost.Type, "author_id">
) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    
    // Run in transaction
    yield* sql.withTransaction(
      Effect.gen(function* () {
        const user = yield* UserRepository.create(userData)
        const post = yield* PostRepository.create({
          ...postData,
          author_id: user.id
        })
        
        return { user, post }
      })
    )
  })

// 9. Complex Queries
const getPostsWithCommentCount = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  const result = yield* sql<{
    id: number
    title: string
    author_name: string
    comment_count: number
    created_at: Date
  }>`
    SELECT 
      p.id,
      p.title,
      u.name as author_name,
      COUNT(c.id) as comment_count,
      p.created_at
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.published = true
    GROUP BY p.id, p.title, u.name, p.created_at
    ORDER BY p.created_at DESC
  `
  
  return result
})

const getUserStats = (userId: number) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    
    const stats = yield* sql<{
      total_posts: number
      published_posts: number
      total_comments: number
    }>`
      SELECT 
        COUNT(p.id) as total_posts,
        COUNT(CASE WHEN p.published THEN 1 END) as published_posts,
        COALESCE(comment_stats.total_comments, 0) as total_comments
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN (
        SELECT p.author_id, COUNT(c.id) as total_comments
        FROM posts p
        LEFT JOIN comments c ON p.id = c.post_id
        GROUP BY p.author_id
      ) comment_stats ON u.id = comment_stats.author_id
      WHERE u.id = ${userId}
      GROUP BY u.id, comment_stats.total_comments
    `
    
    return stats[0] || { total_posts: 0, published_posts: 0, total_comments: 0 }
  })

// 10. Testing Utilities
const clearDatabase = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  yield* sql`TRUNCATE TABLE comments CASCADE`
  yield* sql`TRUNCATE TABLE posts CASCADE`
  yield* sql`TRUNCATE TABLE users CASCADE`
  
  yield* Effect.log("Database cleared for testing")
})

const seedDatabase = Effect.gen(function* () {
  const testUser = yield* UserRepository.create({
    name: "Test User",
    email: "test@example.com"
  })
  
  const testPost = yield* PostRepository.create({
    title: "Test Post",
    content: "This is a test post content",
    author_id: testUser.id,
    published: true
  })
  
  const testComment = yield* CommentRepository.create({
    post_id: testPost.id,
    author_name: "Commenter",
    content: "This is a test comment"
  })
  
  yield* Effect.log("Database seeded with test data")
  
  return { testUser, testPost, testComment }
})

export {
  SqlLive,
  SqlTestLive,
  UserRepository,
  PostRepository,
  CommentRepository,
  runMigrations,
  createUserWithPost,
  getPostsWithCommentCount,
  getUserStats,
  clearDatabase,
  seedDatabase,
  User,
  Post,
  Comment,
  CreateUser,
  CreatePost,
  CreateComment,
  UserNotFoundError,
  PostNotFoundError,
  EmailAlreadyExistsError
}