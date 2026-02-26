// Type Definitions for xsAI

import type { z } from 'zod'
import type * as v from 'valibot'

// ============================================
// Core Types
// ============================================

export interface GenerateTextOptions {
  apiKey: string
  baseURL: string
  model: string
  messages: Message[]
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  seed?: number
  stop?: string | string[]
  tools?: Tool[]
  toolChoice?: 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } }
  maxSteps?: number
  signal?: AbortSignal
  fetch?: typeof fetch
  headers?: Record<string, string>
}

export interface StreamTextOptions extends GenerateTextOptions {
  onChunk?: (chunk: string) => void
  onComplete?: (text: string) => void
  onError?: (error: Error) => void
}

export interface GenerateObjectOptions<T = any> extends Omit<GenerateTextOptions, 'messages'> {
  messages: Message[]
  schema: v.BaseSchema<T> | z.ZodSchema<T> | any
  output?: 'object' | 'array'
  mode?: 'json' | 'tool' | 'auto'
}

export interface StreamObjectOptions<T = any> extends GenerateObjectOptions<T> {
  onPartial?: (partial: Partial<T>) => void
  onComplete?: (object: T) => void
  onError?: (error: Error) => void
}

// ============================================
// Message Types
// ============================================

export type Role = 'system' | 'user' | 'assistant' | 'function' | 'tool'

export interface TextContent {
  type: 'text'
  text: string
}

export interface ImageContent {
  type: 'image_url'
  image_url: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

export interface AudioContent {
  type: 'input_audio'
  input_audio: {
    data: string // base64 encoded
    format: 'wav' | 'mp3' | 'flac' | 'webm' | 'ogg'
  }
}

export type MessageContent = string | TextContent | ImageContent | AudioContent | Array<TextContent | ImageContent | AudioContent>

export interface Message {
  role: Role
  content: MessageContent
  name?: string
  function_call?: {
    name: string
    arguments: string
  }
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
}

// ============================================
// Tool Types
// ============================================

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: JsonSchema | any
    strict?: boolean
  }
  execute: (args: any) => string | Promise<string>
}

export interface JsonSchema {
  type: 'object'
  properties: Record<string, any>
  required?: string[]
  additionalProperties?: boolean
  description?: string
}

// ============================================
// Response Types
// ============================================

export interface GenerateTextResponse {
  text: string
  usage?: Usage
  finishReason?: FinishReason
  steps?: Step[]
}

export interface StreamTextResponse {
  textStream: AsyncIterable<string>
  usage?: Promise<Usage>
  controller?: AbortController
}

export interface GenerateObjectResponse<T> {
  object: T
  usage?: Usage
  finishReason?: FinishReason
}

export interface StreamObjectResponse<T> {
  partialObjectStream: AsyncIterable<Partial<T>>
  elementStream?: AsyncIterable<T> // For array output
  object: Promise<T>
  usage?: Promise<Usage>
}

export interface Usage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export type FinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call'

export interface Step {
  type: 'text-generation' | 'tool-call' | 'tool-result'
  text?: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: any
}

export interface ToolResult {
  id: string
  result: string
  error?: string
}

// ============================================
// Embedding Types
// ============================================

export interface EmbedOptions {
  apiKey: string
  baseURL: string
  model: string
  input: string
  dimensions?: number
  user?: string
}

export interface EmbedManyOptions extends Omit<EmbedOptions, 'input'> {
  input: string[]
}

export interface EmbedResponse {
  embedding: number[]
  usage?: Usage
}

export interface EmbedManyResponse {
  embeddings: number[][]
  usage?: Usage
}

// ============================================
// Model Types
// ============================================

export interface ListModelsOptions {
  apiKey: string
  baseURL: string
}

export interface RetrieveModelOptions extends ListModelsOptions {
  model: string
}

export interface Model {
  id: string
  object: 'model'
  created: number
  owned_by: string
  permission?: any[]
  root?: string
  parent?: string
}

// ============================================
// Transcription Types
// ============================================

export interface GenerateTranscriptionOptions {
  apiKey: string
  baseURL: string
  file: Blob | File
  fileName: string
  model: string
  language?: string
  prompt?: string
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  temperature?: number
  timestampGranularities?: 'word' | 'segment' | Array<'word' | 'segment'>
}

export interface TranscriptionResponse {
  text: string
  language?: string
  duration?: number
  words?: Array<{
    word: string
    start: number
    end: number
  }>
  segments?: Array<{
    id: number
    seek: number
    start: number
    end: number
    text: string
    tokens: number[]
    temperature: number
    avg_logprob: number
    compression_ratio: number
    no_speech_prob: number
  }>
}

// ============================================
// Speech Types
// ============================================

export interface GenerateSpeechOptions {
  apiKey: string
  baseURL?: string
  model: 'tts-1' | 'tts-1-hd'
  input: string
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'
  speed?: number // 0.25 to 4.0
}

export interface SpeechResponse {
  audio: ArrayBuffer
  contentType: string
}

// ============================================
// Image Types
// ============================================

export interface GenerateImageOptions {
  apiKey: string
  baseURL: string
  model: string
  prompt: string
  n?: number // Number of images
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  responseFormat?: 'url' | 'b64_json'
  user?: string
}

export interface ImageResponse {
  created: number
  data: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

// ============================================
// Provider Types
// ============================================

export interface ProviderConfig {
  apiKey?: string
  baseURL?: string
  headers?: Record<string, string>
  defaultModel?: string
  organization?: string
}

export interface CloudProvider {
  chat: (model: string) => {
    apiKey: string
    baseURL: string
    model: string
    headers?: Record<string, string>
  }
  completion?: (model: string) => any
  embedding?: (model: string) => any
}

export interface LocalProvider extends CloudProvider {
  baseURL: string
}

// ============================================
// Schema Types
// ============================================

export interface SchemaValidationResult<T> {
  success: boolean
  data?: T
  error?: any
}

export interface JsonSchemaOptions {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  properties?: Record<string, any>
  items?: any
  required?: string[]
  additionalProperties?: boolean
  description?: string
  enum?: any[]
  const?: any
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
}

// ============================================
// Utility Types
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ReasoningExtraction {
  reasoning: string | null
  text: string
}

export interface StreamSimulationOptions<T> {
  chunks: T[]
  chunkDelay?: number
  initialDelay?: number
}

export interface FetchOptions {
  retry?: number
  retryDelay?: number
  retryOn?: number[]
  timeout?: number
}

// ============================================
// MCP Integration Types
// ============================================

export interface MCPTool {
  name: string
  description: string
  inputSchema: JsonSchema
}

export interface MCPServer {
  name: string
  version: string
  tools: MCPTool[]
}

// ============================================
// Composio Integration Types
// ============================================

export interface ComposioAction {
  name: string
  description: string
  parameters: JsonSchema
  appName?: string
}

export interface ComposioFilters {
  apps?: string[]
  actions?: string[]
  tags?: string[]
  useCase?: string
  useCaseLimit?: number
}

// ============================================
// Error Types
// ============================================

export class XSAIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'XSAIError'
  }
}

export class APIError extends XSAIError {
  constructor(message: string, statusCode: number, details?: any) {
    super(message, 'API_ERROR', statusCode, details)
    this.name = 'APIError'
  }
}

export class ValidationError extends XSAIError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends XSAIError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429, { retryAfter })
    this.name = 'RateLimitError'
  }
}

// ============================================
// Config Types
// ============================================

export interface XSAIConfig {
  providers?: Record<string, ProviderConfig>
  defaultProvider?: string
  defaultModel?: string
  retry?: {
    maxAttempts?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
  }
  rateLimit?: {
    maxRequests?: number
    windowMs?: number
  }
  cache?: {
    enabled?: boolean
    ttl?: number
    maxSize?: number
  }
  logging?: {
    enabled?: boolean
    level?: 'debug' | 'info' | 'warn' | 'error'
    destination?: 'console' | 'file' | 'custom'
  }
}