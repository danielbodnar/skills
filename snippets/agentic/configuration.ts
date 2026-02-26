// Configuration Examples for Agentic SDKs

import { createAISDKTools } from '@agentic/ai-sdk'
import { createLangChainTools } from '@agentic/langchain'
import { AgenticToolClient } from '@agentic/platform-tool-client'
import { createOpenAI } from '@ai-sdk/openai'
import { ChatOpenAI } from '@langchain/openai'
import type { CoreTool } from 'ai'

// ==========================================
// AI SDK Configuration Options
// ==========================================

export const aiSDKConfiguration = {
  // OpenAI Model Configuration
  openAIConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL, // Optional custom endpoint
    organization: process.env.OPENAI_ORG_ID, // Optional org ID
    compatibility: 'strict' as const, // Recommended for Agentic
    defaultHeaders: {
      'X-Custom-Header': 'value' // Optional custom headers
    }
  },

  // Model Parameters
  modelParams: {
    model: 'gpt-4o-mini', // or 'gpt-4o', 'gpt-3.5-turbo'
    temperature: 0, // 0-2, lower = more deterministic
    maxTokens: 1000, // Maximum response length
    topP: 1, // Nucleus sampling
    frequencyPenalty: 0, // -2 to 2
    presencePenalty: 0, // -2 to 2
    stopSequences: ['END'], // Optional stop sequences
    seed: 12345 // For reproducible outputs
  },

  // Tool Configuration
  toolConfig: {
    toolChoice: 'auto' as const, // 'auto', 'required', 'none', or specific tool
    parallel_tool_calls: true, // Allow parallel tool execution
  },

  // System Prompts
  systemPrompts: {
    concise: 'You are a helpful assistant. Be as concise as possible.',
    detailed: 'You are a comprehensive assistant. Provide detailed, well-structured answers.',
    technical: 'You are a technical expert. Use precise terminology and provide code examples.',
    creative: 'You are a creative assistant. Think outside the box and provide innovative solutions.'
  }
}

// ==========================================
// LangChain Configuration Options
// ==========================================

export const langChainConfiguration = {
  // LLM Configuration
  llmConfig: {
    model: 'gpt-4o-mini',
    temperature: 0,
    maxTokens: 1000,
    apiKey: process.env.OPENAI_API_KEY,
    streaming: false,
    verbose: true, // Enable debug logging
    maxRetries: 3,
    timeout: 30000, // 30 seconds
    cache: true, // Enable response caching
  },

  // Agent Configuration
  agentConfig: {
    returnIntermediateSteps: true, // Return tool calls in response
    maxIterations: 5, // Maximum agent iterations
    earlyStoppingMethod: 'generate' as const,
    handleParsingErrors: true,
    verbose: true
  },

  // Memory Configuration (for conversational agents)
  memoryConfig: {
    returnMessages: true,
    memoryKey: 'chat_history',
    inputKey: 'input',
    outputKey: 'output'
  }
}

// ==========================================
// Tool Client Configuration
// ==========================================

export interface AgenticConfig {
  apiKey?: string
  baseURL?: string
  timeout?: number
  retryConfig?: {
    maxRetries: number
    retryDelay: number
    retryOn: number[]
  }
}

export const toolClientConfiguration: AgenticConfig = {
  apiKey: process.env.AGENTIC_API_KEY,
  baseURL: 'https://api.agentic.so', // Default API endpoint
  timeout: 30000,
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryOn: [429, 500, 502, 503, 504]
  }
}

// ==========================================
// Advanced Configuration Factory
// ==========================================

export class AgenticConfigBuilder {
  private config: any = {}

  setModel(model: string) {
    this.config.model = model
    return this
  }

  setTemperature(temp: number) {
    this.config.temperature = temp
    return this
  }

  setSystemPrompt(prompt: string) {
    this.config.system = prompt
    return this
  }

  enableStreaming() {
    this.config.streaming = true
    return this
  }

  setTools(tools: any[]) {
    this.config.tools = tools
    return this
  }

  build() {
    return this.config
  }
}

// ==========================================
// Environment-based Configuration
// ==========================================

export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  
  const configs = {
    development: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 500,
      verbose: true,
      cache: false
    },
    staging: {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 1000,
      verbose: true,
      cache: true
    },
    production: {
      model: 'gpt-4o',
      temperature: 0,
      maxTokens: 2000,
      verbose: false,
      cache: true
    }
  }

  return configs[env as keyof typeof configs] || configs.development
}

// ==========================================
// Tool Registry Configuration
// ==========================================

export class ToolRegistry {
  private tools: Map<string, any> = new Map()

  async register(identifier: string, config?: AgenticConfig) {
    const tool = await AgenticToolClient.fromIdentifier(identifier)
    this.tools.set(identifier, tool)
    return tool
  }

  get(identifier: string) {
    return this.tools.get(identifier)
  }

  getAll() {
    return Array.from(this.tools.values())
  }

  // Convert all tools for AI SDK
  getAISDKTools(): CoreTool[] {
    const allTools = this.getAll()
    return allTools.map(tool => createAISDKTools(tool)).flat()
  }

  // Convert all tools for LangChain
  getLangChainTools() {
    const allTools = this.getAll()
    return allTools.map(tool => createLangChainTools(tool)).flat()
  }
}

// ==========================================
// Configuration Validation
// ==========================================

export const validateConfiguration = (config: any) => {
  const errors: string[] = []

  // Check required fields
  if (!config.model) errors.push('Model is required')
  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    errors.push('Temperature must be between 0 and 2')
  }
  if (config.maxTokens !== undefined && config.maxTokens < 1) {
    errors.push('maxTokens must be positive')
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`)
  }

  return true
}

// ==========================================
// Usage Example
// ==========================================

export const configuredExample = async () => {
  // Create tool registry
  const registry = new ToolRegistry()
  await registry.register('@agentic/search')
  await registry.register('@agentic/calculator')

  // Build configuration
  const config = new AgenticConfigBuilder()
    .setModel('gpt-4o-mini')
    .setTemperature(0)
    .setSystemPrompt('You are a helpful research assistant.')
    .setTools(registry.getAISDKTools())
    .build()

  // Validate configuration
  validateConfiguration(config)

  // Use environment-based config
  const envConfig = getEnvironmentConfig()
  console.log('Using environment config:', envConfig)

  return { config, registry }
}