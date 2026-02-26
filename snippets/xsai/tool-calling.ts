// Tool Calling Examples for xsAI

import { tool, rawTool } from '@xsai/tool'
import { generateText } from '@xsai/generate-text'
import type { Tool } from '@xsai/shared-chat'
import { env } from 'node:process'
import * as v from 'valibot'
import * as z from 'zod'

// ============================================
// 1. Basic Tool with Valibot Schema
// ============================================

export async function basicToolWithValibot() {
  const weatherTool = await tool({
    description: 'Get the current weather in a location',
    execute: async ({ location, unit = 'celsius' }) => {
      // Simulate API call
      const weather = {
        location,
        temperature: Math.round(Math.random() * 30 + 10),
        unit,
        condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
        humidity: Math.round(Math.random() * 40 + 40),
      }
      return JSON.stringify(weather)
    },
    name: 'get_weather',
    parameters: v.object({
      location: v.pipe(
        v.string(),
        v.description('The city and country, e.g. San Francisco, USA')
      ),
      unit: v.optional(
        v.pipe(
          v.union([v.literal('celsius'), v.literal('fahrenheit')]),
          v.description('Temperature unit')
        )
      ),
    }),
  })

  const { text, steps } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 2,
    messages: [
      {
        content: 'You are a helpful weather assistant.',
        role: 'system'
      },
      {
        content: 'What\'s the weather like in Tokyo, Japan?',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [weatherTool],
  })

  console.log('Response:', text)
  console.log('Tool calls made:', steps)
  return { text, steps }
}

// ============================================
// 2. Tool with Zod Schema
// ============================================

export async function toolWithZodSchema() {
  const calculatorTool = await tool({
    description: 'Perform mathematical calculations',
    execute: ({ operation, a, b }) => {
      let result: number
      switch (operation) {
        case 'add': result = a + b; break
        case 'subtract': result = a - b; break
        case 'multiply': result = a * b; break
        case 'divide': result = b !== 0 ? a / b : NaN; break
        default: result = NaN
      }
      return JSON.stringify({ operation, a, b, result })
    },
    name: 'calculator',
    parameters: z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    }),
  })

  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 3,
    messages: [
      {
        content: 'What is 42 multiplied by 17?',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [calculatorTool],
  })

  return text
}

// ============================================
// 3. Raw Tool with JSON Schema
// ============================================

export async function rawToolExample() {
  const databaseTool = rawTool<{
    action: 'create' | 'read' | 'update' | 'delete'
    table: string
    data?: Record<string, any>
    id?: string
  }>({
    description: 'Interact with a database',
    execute: async ({ action, table, data, id }) => {
      // Simulate database operation
      const response = {
        success: true,
        action,
        table,
        id: id || `generated-${Date.now()}`,
        data,
        timestamp: new Date().toISOString(),
      }
      return JSON.stringify(response)
    },
    name: 'database_operation',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'read', 'update', 'delete'],
          description: 'The database operation to perform',
        },
        table: {
          type: 'string',
          description: 'The database table name',
        },
        data: {
          type: 'object',
          description: 'The data to create or update',
          additionalProperties: true,
        },
        id: {
          type: 'string',
          description: 'The record ID for read, update, or delete operations',
        },
      },
      required: ['action', 'table'],
      additionalProperties: false,
    },
  })

  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 2,
    messages: [
      {
        content: 'Create a new user record with name "Alice" and email "alice@example.com"',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [databaseTool],
  })

  return text
}

// ============================================
// 4. Multiple Tools Working Together
// ============================================

export async function multipleToolsExample() {
  // Search tool
  const searchTool = await tool({
    description: 'Search the web for information',
    execute: async ({ query, limit = 5 }) => {
      const results = Array.from({ length: limit }, (_, i) => ({
        title: `Result ${i + 1} for "${query}"`,
        url: `https://example.com/result${i + 1}`,
        snippet: `This is a snippet about ${query}...`,
      }))
      return JSON.stringify(results)
    },
    name: 'web_search',
    parameters: v.object({
      query: v.string(),
      limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(10))),
    }),
  })

  // Summarize tool
  const summarizeTool = await tool({
    description: 'Summarize text content',
    execute: async ({ text, maxLength = 100 }) => {
      const summary = text.substring(0, maxLength) + '...'
      return JSON.stringify({ summary, originalLength: text.length })
    },
    name: 'summarize',
    parameters: v.object({
      text: v.string(),
      maxLength: v.optional(v.number()),
    }),
  })

  // Email tool
  const emailTool = await tool({
    description: 'Send an email',
    execute: async ({ to, subject, body }) => {
      return JSON.stringify({
        status: 'sent',
        to,
        subject,
        body,
        sentAt: new Date().toISOString(),
      })
    },
    name: 'send_email',
    parameters: v.object({
      to: v.pipe(v.string(), v.email()),
      subject: v.string(),
      body: v.string(),
    }),
  })

  const { text, steps } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 5,
    messages: [
      {
        content: 'Search for information about TypeScript best practices, summarize what you find, and email it to dev@example.com',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [searchTool, summarizeTool, emailTool],
  })

  console.log('Task completed:', text)
  console.log('Steps taken:', steps.length)
  return { text, steps }
}

// ============================================
// 5. Tool as Plain Object (Type-Safe)
// ============================================

export async function toolAsPlainObject() {
  const fileTool = {
    execute: (({ action, path, content }) => {
      const operations: Record<string, any> = {
        read: { content: 'File contents here...', size: 1024 },
        write: { success: true, bytesWritten: content?.length || 0 },
        delete: { success: true, path },
        list: { files: ['file1.txt', 'file2.txt', 'file3.txt'] },
      }
      return JSON.stringify(operations[action] || { error: 'Unknown action' })
    }) as Tool['execute'],
    function: {
      description: 'Perform file system operations',
      name: 'file_system',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['read', 'write', 'delete', 'list'],
            description: 'The file operation to perform',
          },
          path: {
            type: 'string',
            description: 'The file or directory path',
          },
          content: {
            type: 'string',
            description: 'Content to write (for write action)',
          },
        },
        required: ['action', 'path'],
        additionalProperties: false,
      },
      strict: true,
    },
    type: 'function',
  } satisfies Tool

  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 2,
    messages: [
      {
        content: 'List all files in the current directory',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [fileTool],
  })

  return text
}

// ============================================
// 6. Tool with Complex Return Types
// ============================================

export async function complexReturnTypeTool() {
  interface AnalysisResult {
    sentiment: 'positive' | 'negative' | 'neutral'
    score: number
    keywords: string[]
    entities: Array<{ name: string; type: string }>
    summary: string
  }

  const analysisTool = await tool({
    description: 'Analyze text for sentiment, keywords, and entities',
    execute: async ({ text }): Promise<string> => {
      const result: AnalysisResult = {
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
        score: Math.random(),
        keywords: text.split(' ').slice(0, 5),
        entities: [
          { name: 'Example Entity', type: 'ORGANIZATION' },
          { name: 'Another Entity', type: 'PERSON' },
        ],
        summary: text.substring(0, 50) + '...',
      }
      return JSON.stringify(result)
    },
    name: 'text_analysis',
    parameters: v.object({
      text: v.pipe(
        v.string(),
        v.minLength(10),
        v.description('The text to analyze')
      ),
    }),
  })

  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 2,
    messages: [
      {
        content: 'Analyze this text: "The new product launch was incredibly successful, exceeding all our expectations and delighting customers worldwide."',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [analysisTool],
  })

  return text
}

// ============================================
// 7. Tool with Error Handling
// ============================================

export async function toolWithErrorHandling() {
  const apiTool = await tool({
    description: 'Call an external API',
    execute: async ({ endpoint, method, body }) => {
      try {
        // Simulate API call that might fail
        if (Math.random() > 0.7) {
          throw new Error('API temporarily unavailable')
        }
        
        return JSON.stringify({
          success: true,
          endpoint,
          method,
          response: { data: 'API response data' },
        })
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint,
          method,
        })
      }
    },
    name: 'api_call',
    parameters: v.object({
      endpoint: v.string(),
      method: v.pipe(
        v.union([
          v.literal('GET'),
          v.literal('POST'),
          v.literal('PUT'),
          v.literal('DELETE'),
        ]),
        v.description('HTTP method')
      ),
      body: v.optional(v.record(v.string(), v.unknown())),
    }),
  })

  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 3,
    messages: [
      {
        content: 'Call the /users endpoint with GET method',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [apiTool],
    toolChoice: 'required', // Force tool usage
  })

  return text
}

// ============================================
// 8. Parallel Tool Execution
// ============================================

export async function parallelToolExecution() {
  const dataTool = await tool({
    description: 'Fetch data from different sources',
    execute: async ({ source }) => {
      // Simulate different data sources
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))
      
      const data = {
        database: { users: 1000, posts: 5000 },
        cache: { hits: 15000, misses: 500 },
        api: { requests: 25000, errors: 50 },
      }
      
      return JSON.stringify({
        source,
        data: data[source as keyof typeof data] || {},
        timestamp: new Date().toISOString(),
      })
    },
    name: 'fetch_data',
    parameters: v.object({
      source: v.union([
        v.literal('database'),
        v.literal('cache'),
        v.literal('api'),
      ]),
    }),
  })

  const { text, steps } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 5,
    messages: [
      {
        content: 'Fetch data from all available sources (database, cache, and api) and give me a summary',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [dataTool],
  })

  console.log('Summary:', text)
  console.log('Total tool calls:', steps.filter(s => s.type === 'tool-call').length)
  return { text, steps }
}

// ============================================
// Example Runner
// ============================================

export async function runToolExamples() {
  console.log('Running xsAI Tool Calling Examples...\n')
  
  try {
    console.log('1. Basic Tool with Valibot')
    await basicToolWithValibot()
    
    console.log('\n2. Tool with Zod Schema')
    await toolWithZodSchema()
    
    console.log('\n3. Raw Tool Example')
    await rawToolExample()
    
    console.log('\n4. Multiple Tools')
    await multipleToolsExample()
    
    console.log('\n5. Tool as Plain Object')
    await toolAsPlainObject()
    
    console.log('\n6. Complex Return Type')
    await complexReturnTypeTool()
    
    console.log('\n7. Tool with Error Handling')
    await toolWithErrorHandling()
    
    console.log('\n8. Parallel Tool Execution')
    await parallelToolExecution()
    
  } catch (error) {
    console.error('Error running tool examples:', error)
  }
}