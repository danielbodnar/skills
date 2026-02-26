// Type Definitions for Agentic SDKs

import type { CoreTool, LanguageModel } from 'ai'
import type { Tool as LangChainTool } from '@langchain/core/tools'

// ==========================================
// Core Agentic Types
// ==========================================

export interface AgenticToolMetadata {
  name: string
  description: string
  version?: string
  category?: string
  parameters?: Record<string, any>
  requiredPermissions?: string[]
  rateLimit?: {
    requests: number
    window: number
  }
}

export interface AgenticTool {
  identifier: string
  metadata: AgenticToolMetadata
  execute: (input: any) => Promise<any>
  validate?: (input: any) => boolean | Promise<boolean>
}

export interface AgenticToolClient {
  fromIdentifier(identifier: string): Promise<AgenticTool>
  list(): Promise<AgenticTool[]>
  search(query: string): Promise<AgenticTool[]>
}

// ==========================================
// AI SDK Integration Types
// ==========================================

export interface AISDKToolConfig {
  tool: AgenticTool
  options?: {
    maxRetries?: number
    timeout?: number
    cache?: boolean
  }
}

export interface AISDKResponse {
  text: string
  toolCalls?: Array<{
    toolName: string
    args: any
    result: any
  }>
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter'
}

export interface AISDKStreamResponse {
  textStream: AsyncIterable<string>
  toolCallStream?: AsyncIterable<any>
  usage: Promise<{
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }>
}

// ==========================================
// LangChain Integration Types
// ==========================================

export interface LangChainToolConfig {
  tool: AgenticTool
  options?: {
    returnDirect?: boolean
    verbose?: boolean
    callbacks?: any[]
  }
}

export interface LangChainAgentConfig {
  llm: any // ChatOpenAI or other LLM
  tools: LangChainTool[]
  prompt?: any // ChatPromptTemplate
  memory?: any // Memory instance
  verbose?: boolean
  maxIterations?: number
  earlyStoppingMethod?: 'force' | 'generate'
}

export interface LangChainExecutorResult {
  output: string
  intermediateSteps?: Array<{
    action: {
      tool: string
      toolInput: any
    }
    observation: any
  }>
}

// ==========================================
// Tool Response Types
// ==========================================

export interface SearchToolResponse {
  results: Array<{
    title: string
    url?: string
    description?: string
    snippet?: string
    relevance?: number
  }>
  metadata?: {
    query: string
    totalResults: number
    searchTime: number
  }
}

export interface CalculatorToolResponse {
  expression: string
  result: number | string
  steps?: Array<{
    operation: string
    operands: number[]
    result: number
  }>
}

export interface WeatherToolResponse {
  location: {
    city: string
    country: string
    coordinates?: {
      lat: number
      lon: number
    }
  }
  current: {
    temperature: number
    feels_like: number
    humidity: number
    wind_speed: number
    description: string
  }
  forecast?: Array<{
    date: string
    high: number
    low: number
    description: string
    precipitation?: number
  }>
}

// ==========================================
// Configuration Types
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
  cache?: {
    enabled: boolean
    ttl: number
    maxSize: number
  }
  monitoring?: {
    enabled: boolean
    endpoint?: string
    apiKey?: string
  }
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'custom'
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  seed?: number
  apiKey?: string
  baseURL?: string
}

// ==========================================
// Error Types
// ==========================================

export interface AgenticErrorDetails {
  code: string
  message: string
  details?: any
  timestamp?: Date
  requestId?: string
}

export interface ErrorResponse {
  success: false
  error: AgenticErrorDetails
  fallback?: any
}

export interface SuccessResponse<T = any> {
  success: true
  data: T
  metadata?: Record<string, any>
}

export type AgenticResponse<T = any> = SuccessResponse<T> | ErrorResponse

// ==========================================
// Event Types
// ==========================================

export interface ToolExecutionEvent {
  type: 'start' | 'complete' | 'error'
  toolId: string
  timestamp: Date
  duration?: number
  input?: any
  output?: any
  error?: any
}

export interface ToolEventHandler {
  onStart?: (event: ToolExecutionEvent) => void
  onComplete?: (event: ToolExecutionEvent) => void
  onError?: (event: ToolExecutionEvent) => void
}

// ==========================================
// Utility Types
// ==========================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type AsyncFunction<T = any, R = any> = (
  ...args: T[]
) => Promise<R>

export type ToolIdentifier = `@agentic/${string}` | string

export interface ToolRegistry {
  register(tool: AgenticTool): void
  unregister(identifier: string): void
  get(identifier: string): AgenticTool | undefined
  list(): AgenticTool[]
  clear(): void
}

// ==========================================
// Builder Pattern Types
// ==========================================

export interface ToolChainBuilder {
  add(tool: AgenticTool | string): this
  addConditional(
    condition: (context: any) => boolean,
    tool: AgenticTool | string
  ): this
  addParallel(tools: Array<AgenticTool | string>): this
  build(): ToolChain
}

export interface ToolChain {
  execute(input: any): Promise<any>
  getSteps(): Array<{
    type: 'sequential' | 'parallel' | 'conditional'
    tools: string[]
  }>
}

// ==========================================
// Advanced Pattern Types
// ==========================================

export interface CircuitBreakerConfig {
  threshold: number
  timeout: number
  resetTimeout: number
}

export interface CacheConfig {
  ttl: number
  maxSize: number
  strategy: 'lru' | 'lfu' | 'fifo'
}

export interface RetryConfig {
  maxAttempts: number
  delay: number
  backoff: 'linear' | 'exponential' | 'fibonacci'
  jitter?: boolean
  shouldRetry?: (error: any) => boolean
}

export interface RateLimiterConfig {
  maxRequests: number
  window: number
  strategy: 'sliding' | 'fixed'
}

// ==========================================
// Testing Types
// ==========================================

export interface MockTool extends AgenticTool {
  mockResponses: Map<string, any>
  addMockResponse(input: any, response: any): void
  clearMocks(): void
  getCallHistory(): Array<{ input: any; response: any; timestamp: Date }>
}

export interface TestFixture {
  tools: Map<string, MockTool>
  config: AgenticConfig
  cleanup(): void
}

// ==========================================
// Export Convenience Types
// ==========================================

export type CreateAISDKTools = (tool: AgenticTool | AgenticTool[]) => CoreTool[]
export type CreateLangChainTools = (tool: AgenticTool | AgenticTool[]) => LangChainTool[]

export interface AgenticSDK {
  createAISDKTools: CreateAISDKTools
  createLangChainTools: CreateLangChainTools
  AgenticToolClient: {
    fromIdentifier(identifier: string): Promise<AgenticTool>
  }
}