// Integration Examples with Other Libraries and Frameworks

import { createAISDKTools } from '@agentic/ai-sdk'
import { createLangChainTools } from '@agentic/langchain'
import { AgenticToolClient } from '@agentic/platform-tool-client'
import { Effect, pipe } from 'effect'
import { Schema } from '@effect/schema'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import type { Context } from 'hono'

// ==========================================
// Effect-TS Integration
// ==========================================

// Define schemas for validation
const SearchRequestSchema = Schema.Struct({
  query: Schema.String.pipe(Schema.minLength(1)),
  maxResults: Schema.optional(Schema.Number.pipe(Schema.between(1, 100)))
})

const SearchResponseSchema = Schema.Struct({
  results: Schema.Array(Schema.Struct({
    title: Schema.String,
    url: Schema.String,
    description: Schema.optional(Schema.String)
  })),
  timestamp: Schema.DateFromString
})

type SearchRequest = Schema.Type<typeof SearchRequestSchema>
type SearchResponse = Schema.Type<typeof SearchResponseSchema>

// Effect-TS wrapper for Agentic tools
export const agenticEffect = (toolIdentifier: string) =>
  Effect.gen(function* () {
    // Load tool with Effect error handling
    const tool = yield* Effect.tryPromise({
      try: () => AgenticToolClient.fromIdentifier(toolIdentifier),
      catch: (error) => new Error(`Failed to load tool: ${error}`)
    })

    // Create execution function with validation
    const execute = (request: unknown) =>
      pipe(
        // Validate input
        Schema.decodeUnknown(SearchRequestSchema)(request),
        Effect.flatMap((validRequest) =>
          // Execute tool
          Effect.tryPromise({
            try: () => tool.execute(validRequest),
            catch: (error) => new Error(`Tool execution failed: ${error}`)
          })
        ),
        // Validate output
        Effect.flatMap((response) =>
          Schema.decodeUnknown(SearchResponseSchema)(response)
        )
      )

    return { tool, execute }
  })

// Usage example with Effect-TS
export const effectExample = async () => {
  const program = pipe(
    agenticEffect('@agentic/search'),
    Effect.flatMap(({ execute }) =>
      execute({ query: 'TypeScript Effect-TS', maxResults: 10 })
    ),
    Effect.map((results) => {
      console.log(`Found ${results.results.length} results`)
      return results
    }),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error('Search failed:', error)
        return { results: [], timestamp: new Date() }
      })
    )
  )

  return await Effect.runPromise(program)
}

// ==========================================
// Hono Web Framework Integration
// ==========================================

export const createAgenticAPI = () => {
  const app = new Hono()

  // Middleware
  app.use('*', cors())
  app.use('*', logger())

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok' }))

  // Search endpoint
  app.post('/api/search', async (c: Context) => {
    try {
      const body = await c.req.json()
      const { query, model = 'gpt-4o-mini' } = body

      if (!query) {
        return c.json({ error: 'Query is required' }, 400)
      }

      // Load search tool
      const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
      const openai = createOpenAI({ 
        apiKey: process.env.OPENAI_API_KEY,
        compatibility: 'strict' 
      })

      // Generate response with search
      const result = await generateText({
        model: openai(model),
        tools: createAISDKTools(searchTool),
        prompt: query,
        temperature: 0
      })

      return c.json({
        response: result.text,
        usage: result.usage,
        model
      })
    } catch (error) {
      console.error('Search error:', error)
      return c.json({ error: 'Search failed' }, 500)
    }
  })

  // Stream endpoint
  app.post('/api/stream', async (c: Context) => {
    const body = await c.req.json()
    const { query, model = 'gpt-4o-mini' } = body

    const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
    const openai = createOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: 'strict' 
    })

    const stream = await streamText({
      model: openai(model),
      tools: createAISDKTools(searchTool),
      prompt: query,
      temperature: 0
    })

    // Return SSE stream
    return c.stream(async (stream) => {
      for await (const chunk of stream.textStream) {
        await stream.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
      }
      await stream.write('data: [DONE]\n\n')
    })
  })

  // Multi-tool endpoint
  app.post('/api/multi-tool', async (c: Context) => {
    const body = await c.req.json()
    const { query, tools = ['search', 'calculator'] } = body

    // Load requested tools
    const loadedTools = await Promise.all(
      tools.map((t: string) => 
        AgenticToolClient.fromIdentifier(`@agentic/${t}`)
      )
    )

    const openai = createOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: 'strict' 
    })

    const allTools = loadedTools.flatMap(tool => createAISDKTools(tool))

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      tools: allTools,
      prompt: query,
      temperature: 0
    })

    return c.json({
      response: result.text,
      toolsUsed: result.toolCalls?.map(tc => tc.toolName) || []
    })
  })

  return app
}

// ==========================================
// Vue 3 Composable Integration
// ==========================================

export const useAgenticTools = () => {
  const { ref, computed, watch } = await import('vue')
  
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const result = ref<any>(null)
  const tools = ref<Map<string, any>>(new Map())

  const loadTool = async (identifier: string) => {
    try {
      loading.value = true
      error.value = null
      
      const tool = await AgenticToolClient.fromIdentifier(identifier)
      tools.value.set(identifier, tool)
      
      return tool
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }

  const executeQuery = async (query: string, toolId = '@agentic/search') => {
    try {
      loading.value = true
      error.value = null
      
      let tool = tools.value.get(toolId)
      if (!tool) {
        tool = await loadTool(toolId)
      }

      const openai = createOpenAI({ 
        apiKey: process.env.OPENAI_API_KEY,
        compatibility: 'strict' 
      })

      const response = await generateText({
        model: openai('gpt-4o-mini'),
        tools: createAISDKTools(tool),
        prompt: query,
        temperature: 0
      })

      result.value = response
      return response
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearTools = () => {
    tools.value.clear()
  }

  return {
    loading,
    error,
    result,
    tools: computed(() => Array.from(tools.value.keys())),
    loadTool,
    executeQuery,
    clearTools
  }
}

// ==========================================
// Astro Integration
// ==========================================

// Astro API Route Handler
export const astroAPIRoute = {
  async POST({ request }: { request: Request }) {
    const body = await request.json()
    const { query, toolId = '@agentic/search' } = body

    try {
      const tool = await AgenticToolClient.fromIdentifier(toolId)
      const openai = createOpenAI({ 
        apiKey: process.env.OPENAI_API_KEY,
        compatibility: 'strict' 
      })

      const result = await generateText({
        model: openai('gpt-4o-mini'),
        tools: createAISDKTools(tool),
        prompt: query,
        temperature: 0
      })

      return new Response(JSON.stringify({
        success: true,
        data: result.text
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

// ==========================================
// Bun Server Integration
// ==========================================

export const bunServer = () => {
  return Bun.serve({
    port: 3000,
    async fetch(req) {
      const url = new URL(req.url)
      
      if (url.pathname === '/api/agentic' && req.method === 'POST') {
        const body = await req.json()
        const { query, toolId = '@agentic/search' } = body

        try {
          const tool = await AgenticToolClient.fromIdentifier(toolId)
          const openai = createOpenAI({ 
            apiKey: process.env.OPENAI_API_KEY,
            compatibility: 'strict' 
          })

          const result = await generateText({
            model: openai('gpt-4o-mini'),
            tools: createAISDKTools(tool),
            prompt: query,
            temperature: 0
          })

          return Response.json({
            success: true,
            data: result.text
          })
        } catch (error) {
          return Response.json(
            { success: false, error: 'Query failed' },
            { status: 500 }
          )
        }
      }

      return new Response('Not Found', { status: 404 })
    }
  })
}

// ==========================================
// Database Integration Example
// ==========================================

import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { sql } from 'drizzle-orm'

export const databaseIntegration = async () => {
  const sqlite = new Database('agentic.db')
  const db = drizzle(sqlite)

  // Store tool execution history
  const storeExecution = async (toolId: string, query: string, response: string) => {
    await db.run(sql`
      INSERT INTO tool_executions (tool_id, query, response, created_at)
      VALUES (${toolId}, ${query}, ${response}, ${new Date().toISOString()})
    `)
  }

  // Query with caching
  const cachedQuery = async (query: string, toolId = '@agentic/search') => {
    // Check cache
    const cached = await db.get(sql`
      SELECT response FROM tool_executions 
      WHERE tool_id = ${toolId} AND query = ${query}
      AND created_at > datetime('now', '-1 hour')
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (cached) {
      return JSON.parse(cached.response)
    }

    // Execute fresh query
    const tool = await AgenticToolClient.fromIdentifier(toolId)
    const openai = createOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: 'strict' 
    })

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      tools: createAISDKTools(tool),
      prompt: query,
      temperature: 0
    })

    // Store in cache
    await storeExecution(toolId, query, JSON.stringify(result))

    return result
  }

  return { storeExecution, cachedQuery }
}