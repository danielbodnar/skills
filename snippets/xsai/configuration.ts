// Configuration Examples for xsAI

import { generateText } from '@xsai/generate-text'
import { createFetch } from 'xsfetch'
import { createOpenAI } from '@xsai-ext/providers-cloud'
import { env } from 'node:process'

// ============================================
// 1. Basic Configuration
// ============================================

export const basicConfig = {
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  seed: 42, // For reproducible outputs
}

// ============================================
// 2. Environment-Based Configuration
// ============================================

export function getEnvironmentConfig() {
  const environment = env.NODE_ENV || 'development'
  
  const configs = {
    development: {
      apiKey: env.DEV_OPENAI_API_KEY || env.OPENAI_API_KEY!,
      baseURL: env.DEV_API_URL || 'https://api.openai.com/v1/',
      model: 'gpt-3.5-turbo', // Cheaper model for dev
      maxTokens: 500,
      temperature: 0.9, // More creative in dev
      debug: true,
    },
    staging: {
      apiKey: env.STAGING_OPENAI_API_KEY || env.OPENAI_API_KEY!,
      baseURL: env.STAGING_API_URL || 'https://api.openai.com/v1/',
      model: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.7,
      debug: false,
    },
    production: {
      apiKey: env.PROD_OPENAI_API_KEY || env.OPENAI_API_KEY!,
      baseURL: env.PROD_API_URL || 'https://api.openai.com/v1/',
      model: 'gpt-4o',
      maxTokens: 2000,
      temperature: 0.5, // More consistent in production
      debug: false,
    },
  }
  
  return configs[environment as keyof typeof configs] || configs.development
}

// ============================================
// 3. Provider Configuration Factory
// ============================================

export function createProviderConfig(provider: string) {
  switch (provider) {
    case 'openai':
      return {
        apiKey: env.OPENAI_API_KEY!,
        baseURL: 'https://api.openai.com/v1/',
        defaultModel: 'gpt-4o',
        headers: {
          'OpenAI-Organization': env.OPENAI_ORG_ID,
        },
      }
      
    case 'anthropic':
      return {
        apiKey: env.ANTHROPIC_API_KEY!,
        baseURL: 'https://api.anthropic.com/v1/',
        defaultModel: 'claude-3-opus-20240229',
        headers: {
          'anthropic-version': '2024-02-29',
        },
      }
      
    case 'openrouter':
      return {
        apiKey: env.OPENROUTER_API_KEY!,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultModel: 'openai/gpt-4o',
        headers: {
          'HTTP-Referer': env.APP_URL || 'http://localhost:3000',
          'X-Title': env.APP_NAME || 'xsAI App',
        },
      }
      
    case 'local':
      return {
        apiKey: 'not-required',
        baseURL: env.LOCAL_LLM_URL || 'http://localhost:11434/v1/',
        defaultModel: 'llama3.2',
        headers: {},
      }
      
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

// ============================================
// 4. Request Configuration with Retry
// ============================================

export function createRequestConfig() {
  const fetch = createFetch({
    retry: 3,
    retryDelay: 1000,
    retryOn: [429, 500, 502, 503, 504], // Retry on these status codes
  })
  
  return {
    fetch,
    timeout: 30000, // 30 seconds
    signal: AbortSignal.timeout(60000), // 60 seconds absolute timeout
    headers: {
      'User-Agent': 'xsAI-Client/1.0',
      'X-Request-ID': crypto.randomUUID(),
    },
  }
}

// ============================================
// 5. Model Selection Configuration
// ============================================

export const modelConfigs = {
  fast: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 500,
    description: 'Fast responses, lower cost',
  },
  balanced: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
    description: 'Balance of speed and quality',
  },
  quality: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.5,
    maxTokens: 2000,
    description: 'Highest quality responses',
  },
  creative: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.9,
    maxTokens: 2000,
    topP: 0.95,
    description: 'Creative and diverse outputs',
  },
  deterministic: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0,
    maxTokens: 1000,
    seed: 12345,
    description: 'Consistent, reproducible outputs',
  },
  local: {
    provider: 'ollama',
    model: 'llama3.2',
    temperature: 0.7,
    maxTokens: 1000,
    description: 'Local model, no API costs',
  },
}

export function selectModelConfig(priority: keyof typeof modelConfigs) {
  return modelConfigs[priority]
}

// ============================================
// 6. Rate Limiting Configuration
// ============================================

export class RateLimitedConfig {
  private requestCount = 0
  private resetTime = Date.now() + 60000 // Reset every minute
  
  constructor(
    private maxRequests = 60,
    private windowMs = 60000
  ) {}
  
  async checkLimit(): Promise<void> {
    const now = Date.now()
    
    if (now > this.resetTime) {
      this.requestCount = 0
      this.resetTime = now + this.windowMs
    }
    
    if (this.requestCount >= this.maxRequests) {
      const waitTime = this.resetTime - now
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.requestCount = 0
      this.resetTime = Date.now() + this.windowMs
    }
    
    this.requestCount++
  }
  
  async generateText(config: any) {
    await this.checkLimit()
    return generateText(config)
  }
}

// ============================================
// 7. Multi-Tenant Configuration
// ============================================

export class TenantConfig {
  private tenants = new Map<string, any>()
  
  registerTenant(tenantId: string, config: {
    apiKey: string
    model?: string
    maxTokens?: number
    rateLimit?: number
  }) {
    this.tenants.set(tenantId, {
      apiKey: config.apiKey,
      model: config.model || 'gpt-3.5-turbo',
      maxTokens: config.maxTokens || 500,
      rateLimit: config.rateLimit || 100,
      usage: 0,
    })
  }
  
  getTenantConfig(tenantId: string) {
    const config = this.tenants.get(tenantId)
    if (!config) {
      throw new Error(`Tenant ${tenantId} not found`)
    }
    return config
  }
  
  async generateForTenant(tenantId: string, messages: any[]) {
    const config = this.getTenantConfig(tenantId)
    
    // Check usage limits
    if (config.usage >= config.rateLimit) {
      throw new Error(`Rate limit exceeded for tenant ${tenantId}`)
    }
    
    config.usage++
    
    return generateText({
      apiKey: config.apiKey,
      baseURL: 'https://api.openai.com/v1/',
      model: config.model,
      maxTokens: config.maxTokens,
      messages,
    })
  }
}

// ============================================
// 8. Configuration Validation
// ============================================

export function validateConfig(config: any) {
  const errors: string[] = []
  
  // Required fields
  if (!config.apiKey) {
    errors.push('API key is required')
  }
  
  if (!config.baseURL) {
    errors.push('Base URL is required')
  }
  
  if (!config.model) {
    errors.push('Model is required')
  }
  
  // Valid ranges
  if (config.temperature !== undefined) {
    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2')
    }
  }
  
  if (config.topP !== undefined) {
    if (config.topP < 0 || config.topP > 1) {
      errors.push('Top P must be between 0 and 1')
    }
  }
  
  if (config.maxTokens !== undefined) {
    if (config.maxTokens < 1 || config.maxTokens > 128000) {
      errors.push('Max tokens must be between 1 and 128000')
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
  }
  
  return true
}

// ============================================
// 9. Configuration Presets
// ============================================

export const configPresets = {
  chatbot: {
    temperature: 0.7,
    maxTokens: 500,
    topP: 0.9,
    presencePenalty: 0.6,
    frequencyPenalty: 0.3,
    systemPrompt: 'You are a helpful and friendly chatbot assistant.',
  },
  
  codeGeneration: {
    temperature: 0.3,
    maxTokens: 2000,
    topP: 0.95,
    systemPrompt: 'You are an expert programmer. Generate clean, well-commented code.',
  },
  
  contentWriting: {
    temperature: 0.8,
    maxTokens: 1500,
    topP: 0.9,
    presencePenalty: 0.5,
    frequencyPenalty: 0.5,
    systemPrompt: 'You are a professional content writer. Create engaging and informative content.',
  },
  
  dataExtraction: {
    temperature: 0,
    maxTokens: 1000,
    topP: 1,
    systemPrompt: 'Extract and structure data precisely as requested. Be accurate and consistent.',
  },
  
  translation: {
    temperature: 0.3,
    maxTokens: 2000,
    topP: 1,
    systemPrompt: 'You are a professional translator. Maintain the original meaning and tone.',
  },
  
  summarization: {
    temperature: 0.5,
    maxTokens: 500,
    topP: 1,
    systemPrompt: 'Provide concise, accurate summaries that capture key points.',
  },
}

// ============================================
// 10. Dynamic Configuration Builder
// ============================================

export class ConfigBuilder {
  private config: any = {
    baseURL: 'https://api.openai.com/v1/',
  }
  
  withApiKey(apiKey: string) {
    this.config.apiKey = apiKey
    return this
  }
  
  withModel(model: string) {
    this.config.model = model
    return this
  }
  
  withTemperature(temperature: number) {
    this.config.temperature = temperature
    return this
  }
  
  withMaxTokens(maxTokens: number) {
    this.config.maxTokens = maxTokens
    return this
  }
  
  withSystemPrompt(prompt: string) {
    if (!this.config.messages) {
      this.config.messages = []
    }
    this.config.messages.unshift({
      role: 'system',
      content: prompt,
    })
    return this
  }
  
  withRetry(retries: number, delay: number) {
    this.config.fetch = createFetch({
      retry: retries,
      retryDelay: delay,
    })
    return this
  }
  
  withTimeout(timeout: number) {
    this.config.signal = AbortSignal.timeout(timeout)
    return this
  }
  
  withHeaders(headers: Record<string, string>) {
    this.config.headers = { ...this.config.headers, ...headers }
    return this
  }
  
  build() {
    validateConfig(this.config)
    return this.config
  }
}

// ============================================
// Usage Examples
// ============================================

export async function configurationExamples() {
  // Example 1: Using environment config
  const envConfig = getEnvironmentConfig()
  console.log('Environment config:', envConfig)
  
  // Example 2: Using config builder
  const customConfig = new ConfigBuilder()
    .withApiKey(env.OPENAI_API_KEY!)
    .withModel('gpt-4o')
    .withTemperature(0.7)
    .withMaxTokens(1000)
    .withSystemPrompt('You are a helpful assistant.')
    .withRetry(3, 1000)
    .withTimeout(30000)
    .build()
  
  console.log('Custom config built:', customConfig)
  
  // Example 3: Using preset
  const chatbotConfig = {
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    model: 'gpt-4o',
    ...configPresets.chatbot,
  }
  
  const { text } = await generateText({
    ...chatbotConfig,
    messages: [
      { role: 'system', content: chatbotConfig.systemPrompt },
      { role: 'user', content: 'Hello! How are you?' },
    ],
  })
  
  console.log('Chatbot response:', text)
  
  // Example 4: Rate-limited configuration
  const rateLimited = new RateLimitedConfig(10, 60000) // 10 requests per minute
  
  const result = await rateLimited.generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Test message' }],
  })
  
  return result
}