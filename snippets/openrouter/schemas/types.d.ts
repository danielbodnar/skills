/**
 * OpenRouter API TypeScript Definitions
 * 
 * Complete type definitions for OpenRouter API requests and responses
 */

// Core message types
export type TextContent = {
  type: 'text';
  text: string;
};

export type ImageContentPart = {
  type: 'image_url';
  image_url: {
    url: string; // URL or base64 encoded image data
    detail?: string; // Optional, defaults to "auto"
  };
};

export type ContentPart = TextContent | ImageContentPart;

export type Message =
  | {
      role: 'user' | 'assistant' | 'system';
      // ContentParts are only for the "user" role:
      content: string | ContentPart[];
      // If "name" is included, it will be prepended like this
      // for non-OpenAI models: `{name}: {content}`
      name?: string;
    }
  | {
      role: 'tool';
      content: string;
      tool_call_id: string;
      name?: string;
    };

// Function calling types
export type FunctionDescription = {
  description?: string;
  name: string;
  parameters: object; // JSON Schema object
};

export type Tool = {
  type: 'function';
  function: FunctionDescription;
};

export type ToolChoice =
  | 'none'
  | 'auto'
  | {
      type: 'function';
      function: {
        name: string;
      };
    };

export type ToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
};

// Provider routing types
export type ProviderPreferences = {
  sort?: 'price' | 'throughput' | 'quality';
  only?: string[];
  ignore?: string[];
  quantizations?: ('int4' | 'int8' | 'fp8' | 'fp16' | 'bf16')[];
  prefer?: string[];
};

// Response format types
export type ResponseFormat =
  | { type: 'json_object' }
  | {
      type: 'json_schema';
      json_schema: {
        name: string;
        strict?: boolean;
        schema: object; // JSON Schema
      };
    };

// Main request type
export type ChatCompletionRequest = {
  // Either "messages" or "prompt" is required
  messages?: Message[];
  prompt?: string;

  // If "model" is unspecified, uses the user's default
  model?: string; // See "Supported Models" section

  // Allows to force the model to produce specific output format
  response_format?: ResponseFormat;

  stop?: string | string[];
  stream?: boolean; // Enable streaming

  // LLM Parameters
  max_tokens?: number; // Range: [1, context_length)
  temperature?: number; // Range: [0, 2]

  // Tool calling
  tools?: Tool[];
  tool_choice?: ToolChoice;

  // Advanced optional parameters
  seed?: number; // Integer only
  top_p?: number; // Range: (0, 1]
  top_k?: number; // Range: [1, Infinity) Not available for OpenAI models
  frequency_penalty?: number; // Range: [-2, 2]
  presence_penalty?: number; // Range: [-2, 2]
  repetition_penalty?: number; // Range: (0, 2]
  logit_bias?: { [key: number]: number };
  top_logprobs?: number; // Integer only
  min_p?: number; // Range: [0, 1]
  top_a?: number; // Range: [0, 1]

  // Reduce latency by providing the model with a predicted output
  prediction?: { type: 'content'; content: string };

  // OpenRouter-only parameters
  transforms?: string[];
  models?: string[];
  route?: 'fallback';
  provider?: ProviderPreferences;
  user?: string; // A stable identifier for your end-users
};

// Response types
export type ResponseUsage = {
  /** Including images and tools if any */
  prompt_tokens: number;
  /** The tokens generated */
  completion_tokens: number;
  /** Sum of the above two fields */
  total_tokens: number;
};

export type ErrorResponse = {
  code: number;
  message: string;
  metadata?: Record<string, unknown>;
};

export type NonChatChoice = {
  finish_reason: string | null;
  text: string;
  error?: ErrorResponse;
};

export type NonStreamingChoice = {
  finish_reason: string | null;
  native_finish_reason: string | null;
  message: {
    content: string | null;
    role: string;
    tool_calls?: ToolCall[];
  };
  error?: ErrorResponse;
};

export type StreamingChoice = {
  finish_reason: string | null;
  native_finish_reason: string | null;
  delta: {
    content: string | null;
    role?: string;
    tool_calls?: ToolCall[];
  };
  error?: ErrorResponse;
};

export type ChatCompletionResponse = {
  id: string;
  choices: (NonStreamingChoice | StreamingChoice | NonChatChoice)[];
  created: number; // Unix timestamp
  model: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  system_fingerprint?: string;
  usage?: ResponseUsage;
};

// Model information types
export type Architecture = {
  input_modalities: string[];
  output_modalities: string[];
  tokenizer: string;
  instruct_type?: string;
};

export type Pricing = {
  prompt: string; // Cost per input token
  completion: string; // Cost per output token
  request: string; // Fixed cost per API request
  image: string; // Cost per image input
  web_search: string; // Cost per web search operation
  internal_reasoning: string; // Cost for internal reasoning tokens
  input_cache_read: string; // Cost per cached input token read
  input_cache_write: string; // Cost per cached input token write
};

export type TopProvider = {
  is_moderated: boolean;
};

export type ModelInfo = {
  id: string;
  canonical_slug: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: Architecture;
  pricing: Pricing;
  top_provider: TopProvider;
  per_request_limits: object | null;
  supported_parameters: string[];
};

export type ModelsResponse = {
  data: ModelInfo[];
};

// Provider information types
export type ProviderInfo = {
  name: string;
  slug: string;
  may_log_prompts: boolean;
  may_train_on_data: boolean;
  moderated_by_openrouter: boolean;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  status_page_url?: string;
};

export type ProvidersResponse = {
  data: ProviderInfo[];
};

// Credits and account types
export type CreditsResponse = {
  data: {
    credits: number;
    usage: number;
  };
};

export type KeyInfo = {
  data: {
    label: string;
    usage: number;
    limit: number | null;
    is_free_tier: boolean;
  };
};

// API Key management types
export type CreateApiKeyRequest = {
  name: string;
  limit?: number;
};

export type CreateApiKeyResponse = {
  data: {
    name: string;
    label: string;
    limit: number;
    disabled: boolean;
    created_at: string;
    updated_at: string;
    hash: string;
  };
  key: string;
};

export type ListApiKeysResponse = {
  data: Array<{
    name: string;
    label: string;
    limit: number;
    disabled: boolean;
    created_at: string;
    updated_at: string;
    hash: string;
  }>;
};

// OAuth types
export type OAuthTokenExchangeRequest = {
  code: string;
  code_verifier?: string;
  code_challenge_method?: string;
};

export type OAuthTokenExchangeResponse = {
  key: string;
  data: {
    name: string;
    label: string;
    limit: number;
    disabled: boolean;
    created_at: string;
    updated_at: string;
    hash: string;
  };
};

// Generation stats types
export type GenerationStats = {
  id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  provider: string;
  created_at: string;
};

// Utility types
export type ModelShortcuts = 'floor' | 'nitro'; // :floor for cheapest, :nitro for fastest

export type SupportedParameter = 
  | 'tools'
  | 'tool_choice'
  | 'max_tokens'
  | 'temperature'
  | 'top_p'
  | 'reasoning'
  | 'include_reasoning'
  | 'structured_outputs'
  | 'response_format'
  | 'stop'
  | 'frequency_penalty'
  | 'presence_penalty'
  | 'seed';

// Client configuration
export type OpenRouterClientConfig = {
  apiKey: string;
  baseURL?: string;
  siteUrl?: string;
  appName?: string;
  timeout?: number;
  maxRetries?: number;
};

// Error types
export type OpenRouterError = {
  code: number;
  message: string;
  type: 'invalid_request_error' | 'authentication_error' | 'permission_error' | 'not_found_error' | 'rate_limit_error' | 'api_error';
  param?: string;
};

// Webhook types (if supported)
export type WebhookEvent = {
  id: string;
  object: string;
  created: number;
  type: string;
  data: object;
};

// Constants
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const HTTP_STATUS_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const POPULAR_MODELS = {
  GPT_4O: 'openai/gpt-4o',
  GPT_4_TURBO: 'openai/gpt-4-turbo',
  GPT_35_TURBO: 'openai/gpt-3.5-turbo',
  CLAUDE_35_SONNET: 'anthropic/claude-3.5-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  GEMINI_PRO: 'google/gemini-pro',
  GEMINI_FLASH: 'google/gemini-1.5-flash',
  LLAMA_31_70B: 'meta-llama/llama-3.1-70b-instruct',
  LLAMA_31_8B: 'meta-llama/llama-3.1-8b-instruct',
  CODELLAMA_34B: 'meta-llama/codellama-34b-instruct',
} as const;

// Re-export commonly used types
export type { 
  ChatCompletionRequest as OpenRouterRequest,
  ChatCompletionResponse as OpenRouterResponse,
  ModelInfo as OpenRouterModel,
  ProviderInfo as OpenRouterProvider
};