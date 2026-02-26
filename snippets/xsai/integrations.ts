// Integration Examples for xsAI

import { generateText } from '@xsai/generate-text'
import { tool } from '@xsai/tool'
import type { Tool } from '@xsai/shared-chat'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { ComposioToolSet } from 'composio-core'
import { Agent, Mastra } from '@mastra/core'
import { createOpenAI } from '@xsai-ext/providers-cloud'
import { env } from 'node:process'
import * as v from 'valibot'
import * as z from 'zod'

// ============================================
// 1. Model Context Protocol (MCP) Integration
// ============================================

export async function mcpIntegration() {
  // Set up MCP client
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./mcp-server.js']
  })
  
  const client = new Client({
    name: 'xsai-client',
    version: '1.0.0'
  })
  
  await client.connect(transport)
  
  // Convert MCP tools to xsAI format
  const getTools = async (mcpClient: Client): Promise<Tool[]> => {
    const { tools } = await mcpClient.listTools()
    
    return tools.map(({ description, inputSchema, name }) => ({
      execute: async (args: unknown) => {
        const result = await mcpClient.callTool({
          arguments: args as Record<string, unknown>,
          name,
        })
        return JSON.stringify(result)
      },
      function: {
        description,
        name,
        parameters: inputSchema,
        strict: true,
      },
      type: 'function',
    } satisfies Tool))
  }
  
  const tools = await getTools(client)
  
  // Use MCP tools with xsAI
  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 3,
    messages: [
      {
        content: 'Use the available tools to help me with my task.',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools,
  })
  
  await client.close()
  
  console.log('MCP Integration Result:', text)
  return text
}

// ============================================
// 2. Multiple MCP Servers Integration
// ============================================

export async function multipleMCPServers() {
  // Connect to multiple MCP servers
  const servers = {
    filesystem: new Client({ name: 'xsai-fs', version: '1.0.0' }),
    database: new Client({ name: 'xsai-db', version: '1.0.0' }),
    api: new Client({ name: 'xsai-api', version: '1.0.0' }),
  }
  
  // Connect all servers
  await Promise.all([
    servers.filesystem.connect(new StdioClientTransport({
      command: 'node',
      args: ['./mcp-filesystem.js']
    })),
    servers.database.connect(new StdioClientTransport({
      command: 'node',
      args: ['./mcp-database.js']
    })),
    servers.api.connect(new StdioClientTransport({
      command: 'node',
      args: ['./mcp-api.js']
    })),
  ])
  
  // Get tools from all servers
  const getAllTools = async (): Promise<Tool[]> => {
    const toolPromises = Object.entries(servers).map(async ([serverName, client]) => {
      const { tools } = await client.listTools()
      
      return tools.map(({ description, inputSchema, name }) => ({
        execute: async (args: unknown) => {
          const result = await client.callTool({
            arguments: args as Record<string, unknown>,
            name,
          })
          return JSON.stringify(result)
        },
        function: {
          description,
          name: `${serverName}_${name}`, // Namespace tools by server
          parameters: inputSchema,
          strict: true,
        },
        type: 'function',
      } satisfies Tool))
    })
    
    const allTools = await Promise.all(toolPromises)
    return allTools.flat()
  }
  
  const tools = await getAllTools()
  
  const { text, steps } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 5,
    messages: [
      {
        content: 'Read data from the database, process it, and save to a file.',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools,
  })
  
  // Close all connections
  await Promise.all(Object.values(servers).map(s => s.close()))
  
  console.log('Multi-MCP Result:', text)
  console.log('Steps taken:', steps.length)
  return { text, steps }
}

// ============================================
// 3. Composio Integration
// ============================================

export class XSAIComposioToolSet extends ComposioToolSet {
  constructor(config: {
    apiKey?: string | null
    baseUrl?: string | null
    entityId?: string
  } = {}) {
    super({
      apiKey: config.apiKey ?? null,
      baseUrl: config.baseUrl ?? null,
      entityId: config.entityId ?? 'default',
      runtime: null,
    })
  }
  
  async getXSAITools(filters: {
    apps?: string[]
    actions?: string[]
    tags?: string[]
  }): Promise<Tool[]> {
    const actionsList = await this.getToolsSchema(filters)
    
    return actionsList.map(schema => ({
      execute: async (params) => {
        const result = await this.executeToolCall(
          {
            arguments: JSON.stringify(params),
            name: schema.name,
          },
          this.entityId
        )
        return JSON.stringify(result)
      },
      function: {
        description: schema.description,
        name: schema.name,
        parameters: schema.parameters,
        strict: true,
      },
      type: 'function',
    } satisfies Tool))
  }
}

export async function composioIntegration() {
  const toolset = new XSAIComposioToolSet({
    apiKey: env.COMPOSIO_API_KEY,
  })
  
  // Get GitHub tools
  const tools = await toolset.getXSAITools({
    apps: ['github'],
    actions: ['github_star_repo', 'github_create_issue', 'github_get_repo'],
  })
  
  const { text, steps } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 5,
    messages: [
      {
        content: 'Star the moeru-ai/xsai repository on GitHub',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools,
    toolChoice: 'required',
  })
  
  console.log('Composio Result:', text)
  console.log('Actions performed:', steps.filter(s => s.type === 'tool-call').length)
  return { text, steps }
}

// ============================================
// 4. Mastra.ai Integration
// ============================================

export async function mastraIntegration() {
  const openai = createOpenAI(env.OPENAI_API_KEY!)
  
  // Create tools for Mastra
  const weatherTool = {
    description: 'Get current weather for a location',
    execute: async ({ location }: { location: string }) => {
      // Simulate weather API
      const weather = {
        location,
        temperature: 22,
        condition: 'partly cloudy',
        humidity: 65,
        windSpeed: 10,
      }
      return weather
    },
    inputSchema: z.object({
      location: z.string().describe('City name'),
    }),
    name: 'get_weather',
  }
  
  const newsT tool = {
    description: 'Get latest news headlines',
    execute: async ({ category }: { category?: string }) => {
      // Simulate news API
      const headlines = [
        'Tech company announces breakthrough',
        'Market reaches new highs',
        'Scientific discovery changes understanding',
      ]
      return {
        category: category || 'general',
        headlines,
        timestamp: new Date().toISOString(),
      }
    },
    inputSchema: z.object({
      category: z.optional(z.string()),
    }),
    name: 'get_news',
  }
  
  // Create Mastra agent
  const assistantAgent = new Agent({
    instructions: `You are a helpful assistant that can provide weather information and news updates.
    
    When asked about weather, use the get_weather tool.
    When asked about news, use the get_news tool.
    Be concise but informative in your responses.`,
    model: openai.chat('gpt-4o'),
    name: 'Assistant Agent',
    tools: { weatherTool, newsTool },
  })
  
  // Create Mastra instance
  const mastra = new Mastra({
    agents: { assistantAgent },
  })
  
  // Use the agent
  const agent = await mastra.getAgent('assistantAgent')
  const result = await agent.generate('What\'s the weather in London and what are the latest tech news?')
  
  console.log('Mastra Agent Response:', result.text)
  return result
}

// ============================================
// 5. Custom Tool Adapter Pattern
// ============================================

export function createToolAdapter<T extends Record<string, any>>(
  externalTool: {
    name: string
    description: string
    parameters: any
    handler: (params: T) => Promise<any>
  }
): Tool {
  return {
    execute: async (params: unknown) => {
      const result = await externalTool.handler(params as T)
      return typeof result === 'string' ? result : JSON.stringify(result)
    },
    function: {
      description: externalTool.description,
      name: externalTool.name,
      parameters: externalTool.parameters,
      strict: true,
    },
    type: 'function',
  }
}

export async function customToolAdapterExample() {
  // Example: Adapt a custom API client
  const customAPITool = {
    name: 'custom_api',
    description: 'Call custom internal API',
    parameters: {
      type: 'object',
      properties: {
        endpoint: { type: 'string' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
        data: { type: 'object', additionalProperties: true },
      },
      required: ['endpoint', 'method'],
    },
    handler: async ({ endpoint, method, data }: {
      endpoint: string
      method: string
      data?: any
    }) => {
      // Simulate API call
      console.log(`Calling ${method} ${endpoint}`)
      return {
        status: 200,
        response: { message: 'Success', data },
      }
    },
  }
  
  const adaptedTool = createToolAdapter(customAPITool)
  
  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 2,
    messages: [
      {
        content: 'Call the /users endpoint with GET method',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [adaptedTool],
  })
  
  return text
}

// ============================================
// 6. LangChain to xsAI Bridge
// ============================================

export function langChainToXSAITool(langChainTool: {
  name: string
  description: string
  schema: z.ZodSchema<any>
  func: (input: any) => Promise<string>
}): Tool {
  return {
    execute: async (params: unknown) => {
      const validatedParams = langChainTool.schema.parse(params)
      return await langChainTool.func(validatedParams)
    },
    function: {
      description: langChainTool.description,
      name: langChainTool.name,
      parameters: zodToJsonSchema(langChainTool.schema), // Would need implementation
      strict: true,
    },
    type: 'function',
  }
}

// ============================================
// 7. Function Calling with Retry and Fallback
// ============================================

export async function toolCallingWithRetry() {
  const unreliableTool = await tool({
    description: 'An unreliable tool that sometimes fails',
    execute: async ({ input }) => {
      // 50% chance of failure
      if (Math.random() > 0.5) {
        throw new Error('Tool execution failed')
      }
      return JSON.stringify({ success: true, result: `Processed: ${input}` })
    },
    name: 'unreliable_tool',
    parameters: v.object({
      input: v.string(),
    }),
  })
  
  // Wrapper with retry logic
  const reliableTool: Tool = {
    ...unreliableTool,
    execute: async (params: unknown) => {
      let lastError
      const maxRetries = 3
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          console.log(`Attempt ${i + 1}/${maxRetries}`)
          return await unreliableTool.execute(params)
        } catch (error) {
          lastError = error
          console.log(`Attempt ${i + 1} failed:`, error)
          await new Promise(r => setTimeout(r, 1000 * (i + 1))) // Exponential backoff
        }
      }
      
      // Fallback response
      return JSON.stringify({
        success: false,
        error: 'Tool failed after retries',
        fallback: true,
      })
    },
  }
  
  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 2,
    messages: [
      {
        content: 'Process this input: "Hello World"',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [reliableTool],
  })
  
  return text
}

// ============================================
// 8. Tool Orchestration Pattern
// ============================================

export async function toolOrchestration() {
  // Define a workflow of tools
  const dataFetchTool = await tool({
    description: 'Fetch data from a source',
    execute: async ({ source }) => {
      const data = { source, items: [1, 2, 3, 4, 5], timestamp: Date.now() }
      return JSON.stringify(data)
    },
    name: 'fetch_data',
    parameters: v.object({ source: v.string() }),
  })
  
  const processDataTool = await tool({
    description: 'Process fetched data',
    execute: async ({ data, operation }) => {
      const parsed = JSON.parse(data)
      const result = {
        ...parsed,
        processed: true,
        operation,
        itemCount: parsed.items?.length || 0,
      }
      return JSON.stringify(result)
    },
    name: 'process_data',
    parameters: v.object({
      data: v.string(),
      operation: v.union([v.literal('sum'), v.literal('average'), v.literal('count')]),
    }),
  })
  
  const saveResultTool = await tool({
    description: 'Save processed result',
    execute: async ({ result, destination }) => {
      console.log(`Saving to ${destination}:`, result)
      return JSON.stringify({ saved: true, destination, size: result.length })
    },
    name: 'save_result',
    parameters: v.object({
      result: v.string(),
      destination: v.string(),
    }),
  })
  
  const { text, steps } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    maxSteps: 5,
    messages: [
      {
        content: 'Fetch data from "database", process it with "count" operation, and save to "output.json"',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    tools: [dataFetchTool, processDataTool, saveResultTool],
  })
  
  console.log('Orchestration complete:', text)
  console.log('Workflow steps:', steps.map(s => s.type))
  return { text, steps }
}

// ============================================
// Helper Functions
// ============================================

function zodToJsonSchema(schema: z.ZodSchema<any>): any {
  // Simplified implementation - would need full conversion logic
  return {
    type: 'object',
    properties: {},
    additionalProperties: false,
  }
}

// ============================================
// Example Runner
// ============================================

export async function runIntegrationExamples() {
  console.log('Running xsAI Integration Examples...\n')
  
  try {
    // Note: Many of these require external services to be running
    
    console.log('5. Custom Tool Adapter')
    await customToolAdapterExample()
    
    console.log('\n7. Tool Calling with Retry')
    await toolCallingWithRetry()
    
    console.log('\n8. Tool Orchestration')
    await toolOrchestration()
    
    // Examples that require external services:
    // - mcpIntegration() - requires MCP server
    // - composioIntegration() - requires Composio API key
    // - mastraIntegration() - requires Mastra setup
    
  } catch (error) {
    console.error('Error running integration examples:', error)
  }
}