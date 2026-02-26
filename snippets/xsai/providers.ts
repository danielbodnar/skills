// Provider Examples for xsAI

import { generateText } from '@xsai/generate-text'
import { streamText } from '@xsai/stream-text'
import { generateObject } from '@xsai/generate-object'
import { createOpenAI, createAnthropic, createGoogle, createMistral } from '@xsai-ext/providers-cloud'
import { createOllama, createLlamaCpp } from '@xsai-ext/providers-local'
import { env } from 'node:process'
import * as v from 'valibot'

// ============================================
// 1. OpenAI Provider
// ============================================

export async function openAIProvider() {
  const openai = createOpenAI(env.OPENAI_API_KEY!)
  
  // Using with generateText
  const { text } = await generateText({
    ...openai.chat('gpt-4o'),
    messages: [
      { content: 'You are a helpful assistant.', role: 'system' },
      { content: 'Explain quantum computing in simple terms.', role: 'user' }
    ],
  })
  
  console.log('OpenAI Response:', text)
  return text
}

// ============================================
// 2. Anthropic Claude Provider
// ============================================

export async function anthropicProvider() {
  const anthropic = createAnthropic(env.ANTHROPIC_API_KEY!)
  
  const { text } = await generateText({
    ...anthropic.chat('claude-3-opus-20240229'),
    messages: [
      { content: 'You are a technical writer.', role: 'system' },
      { content: 'Write a brief introduction to TypeScript.', role: 'user' }
    ],
  })
  
  console.log('Claude Response:', text)
  return text
}

// ============================================
// 3. Google Gemini Provider
// ============================================

export async function googleProvider() {
  const google = createGoogle(env.GOOGLE_API_KEY!)
  
  const { text } = await generateText({
    ...google.chat('gemini-pro'),
    messages: [
      { content: 'You are a creative storyteller.', role: 'system' },
      { content: 'Tell me a short story about a time traveler.', role: 'user' }
    ],
  })
  
  console.log('Gemini Response:', text)
  return text
}

// ============================================
// 4. Mistral Provider
// ============================================

export async function mistralProvider() {
  const mistral = createMistral(env.MISTRAL_API_KEY!)
  
  const { text } = await generateText({
    ...mistral.chat('mistral-large-latest'),
    messages: [
      { content: 'You are a code reviewer.', role: 'system' },
      { content: 'Review this code: const add = (a, b) => a + b', role: 'user' }
    ],
  })
  
  console.log('Mistral Response:', text)
  return text
}

// ============================================
// 5. Local Ollama Provider
// ============================================

export async function ollamaProvider() {
  const ollama = createOllama({
    baseURL: 'http://localhost:11434', // Default Ollama URL
  })
  
  const { text } = await generateText({
    ...ollama.chat('llama3.2'),
    messages: [
      { content: 'Why is Rust becoming popular?', role: 'user' }
    ],
  })
  
  console.log('Ollama Response:', text)
  return text
}

// ============================================
// 6. Local LlamaCpp Provider
// ============================================

export async function llamaCppProvider() {
  const llamacpp = createLlamaCpp({
    baseURL: 'http://localhost:8080', // Default llama.cpp server URL
  })
  
  const { text } = await generateText({
    ...llamacpp.chat('local-model'),
    messages: [
      { content: 'Explain the benefits of functional programming.', role: 'user' }
    ],
  })
  
  console.log('LlamaCpp Response:', text)
  return text
}

// ============================================
// 7. Streaming with Providers
// ============================================

export async function streamingWithProviders() {
  const openai = createOpenAI(env.OPENAI_API_KEY!)
  
  const { textStream } = await streamText({
    ...openai.chat('gpt-4o'),
    messages: [
      { content: 'Write a haiku about coding.', role: 'user' }
    ],
  })
  
  console.log('Streaming haiku:')
  for await (const chunk of textStream) {
    process.stdout.write(chunk)
  }
  console.log('\n')
}

// ============================================
// 8. Structured Output with Providers
// ============================================

export async function structuredOutputWithProviders() {
  const openai = createOpenAI(env.OPENAI_API_KEY!)
  
  const RecipeSchema = v.object({
    name: v.string(),
    ingredients: v.array(v.object({
      item: v.string(),
      amount: v.string(),
    })),
    steps: v.array(v.string()),
    prepTime: v.number(),
    cookTime: v.number(),
    servings: v.number(),
  })
  
  const { object } = await generateObject({
    ...openai.chat('gpt-4o'),
    messages: [
      { content: 'Generate a recipe for chocolate chip cookies.', role: 'user' }
    ],
    schema: RecipeSchema,
  })
  
  console.log('Recipe:', object.name)
  console.log('Prep time:', object.prepTime, 'minutes')
  console.log('Ingredients:', object.ingredients.length)
  
  return object
}

// ============================================
// 9. Custom Base URL (OpenAI-Compatible APIs)
// ============================================

export async function customBaseURLProvider() {
  // Example: Using OpenRouter or other OpenAI-compatible APIs
  const customProvider = createOpenAI(env.CUSTOM_API_KEY!, {
    baseURL: 'https://openrouter.ai/api/v1',
  })
  
  const { text } = await generateText({
    ...customProvider.chat('meta-llama/llama-3.1-8b-instruct'),
    messages: [
      { content: 'What are the main principles of clean code?', role: 'user' }
    ],
  })
  
  console.log('Custom Provider Response:', text)
  return text
}

// ============================================
// 10. Provider with Custom Headers
// ============================================

export async function providerWithCustomHeaders() {
  const openai = createOpenAI(env.OPENAI_API_KEY!, {
    headers: {
      'X-Custom-Header': 'custom-value',
      'X-Organization-Id': 'org-123',
    },
  })
  
  const { text } = await generateText({
    ...openai.chat('gpt-4o'),
    messages: [
      { content: 'Hello!', role: 'user' }
    ],
  })
  
  return text
}

// ============================================
// 11. Provider Fallback Strategy
// ============================================

export async function providerFallbackStrategy() {
  const providers = [
    { name: 'primary', provider: createOpenAI(env.OPENAI_API_KEY!) },
    { name: 'fallback1', provider: createAnthropic(env.ANTHROPIC_API_KEY!) },
    { name: 'fallback2', provider: createOllama() },
  ]
  
  let result = null
  let lastError = null
  
  for (const { name, provider } of providers) {
    try {
      console.log(`Trying provider: ${name}`)
      
      const { text } = await generateText({
        ...(name === 'primary' 
          ? provider.chat('gpt-4o')
          : name === 'fallback1'
          ? provider.chat('claude-3-haiku-20240307')
          : provider.chat('llama3.2')),
        messages: [
          { content: 'What is 2 + 2?', role: 'user' }
        ],
        // Add timeout for each provider
        signal: AbortSignal.timeout(5000),
      })
      
      result = text
      console.log(`Success with ${name}:`, text)
      break
    } catch (error) {
      lastError = error
      console.log(`Failed with ${name}:`, error)
      continue
    }
  }
  
  if (!result && lastError) {
    throw lastError
  }
  
  return result
}

// ============================================
// 12. Multi-Provider Comparison
// ============================================

export async function multiProviderComparison() {
  const prompt = 'Write a one-line JavaScript function to reverse a string.'
  const messages = [{ content: prompt, role: 'user' as const }]
  
  const providers = [
    { name: 'OpenAI GPT-4o', config: createOpenAI(env.OPENAI_API_KEY!).chat('gpt-4o') },
    { name: 'Claude Haiku', config: createAnthropic(env.ANTHROPIC_API_KEY!).chat('claude-3-haiku-20240307') },
    { name: 'Local Ollama', config: createOllama().chat('codellama') },
  ]
  
  const results = await Promise.allSettled(
    providers.map(async ({ name, config }) => {
      const { text } = await generateText({
        ...config,
        messages,
      })
      return { name, response: text }
    })
  )
  
  console.log('Provider Comparison Results:')
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`\n${result.value.name}:`)
      console.log(result.value.response)
    } else {
      console.log(`\n${providers[index].name}: Failed`)
      console.log(result.reason)
    }
  })
  
  return results
}

// ============================================
// 13. Provider with Retry Logic
// ============================================

export async function providerWithRetry() {
  const openai = createOpenAI(env.OPENAI_API_KEY!)
  
  async function generateWithRetry(
    messages: any[],
    maxRetries = 3,
    delay = 1000
  ) {
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}`)
        
        const { text } = await generateText({
          ...openai.chat('gpt-4o'),
          messages,
        })
        
        return text
      } catch (error) {
        lastError = error
        console.log(`Attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          console.log(`Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // Exponential backoff
        }
      }
    }
    
    throw lastError
  }
  
  const result = await generateWithRetry([
    { content: 'Tell me a joke about programming.', role: 'user' }
  ])
  
  console.log('Result after retries:', result)
  return result
}

// ============================================
// 14. Provider Configuration Patterns
// ============================================

export async function providerConfigurationPatterns() {
  // Pattern 1: Environment-based configuration
  const getProvider = () => {
    const provider = env.AI_PROVIDER || 'openai'
    
    switch (provider) {
      case 'openai':
        return createOpenAI(env.OPENAI_API_KEY!)
      case 'anthropic':
        return createAnthropic(env.ANTHROPIC_API_KEY!)
      case 'ollama':
        return createOllama()
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }
  
  // Pattern 2: Model selection based on task
  const selectModel = (task: 'creative' | 'analytical' | 'code') => {
    const models = {
      creative: 'gpt-4o',
      analytical: 'claude-3-opus-20240229',
      code: 'codellama',
    }
    return models[task]
  }
  
  // Pattern 3: Cost-optimized provider selection
  const getCostOptimizedProvider = (priority: 'cost' | 'quality' | 'speed') => {
    const configs = {
      cost: createOllama().chat('llama3.2'),
      quality: createOpenAI(env.OPENAI_API_KEY!).chat('gpt-4o'),
      speed: createOpenAI(env.OPENAI_API_KEY!).chat('gpt-3.5-turbo'),
    }
    return configs[priority]
  }
  
  // Example usage
  const provider = getProvider()
  const model = selectModel('code')
  const config = getCostOptimizedProvider('quality')
  
  const { text } = await generateText({
    ...config,
    messages: [
      { content: 'Write a fibonacci function.', role: 'user' }
    ],
  })
  
  return text
}

// ============================================
// Example Runner
// ============================================

export async function runProviderExamples() {
  console.log('Running xsAI Provider Examples...\n')
  
  try {
    // Note: Some examples require API keys and running services
    
    if (env.OPENAI_API_KEY) {
      console.log('1. OpenAI Provider')
      await openAIProvider()
    }
    
    if (env.ANTHROPIC_API_KEY) {
      console.log('\n2. Anthropic Provider')
      await anthropicProvider()
    }
    
    // Check if Ollama is running locally
    try {
      console.log('\n5. Ollama Provider')
      await ollamaProvider()
    } catch (e) {
      console.log('Ollama not available locally')
    }
    
    if (env.OPENAI_API_KEY) {
      console.log('\n7. Streaming with Providers')
      await streamingWithProviders()
      
      console.log('\n8. Structured Output')
      await structuredOutputWithProviders()
    }
    
    console.log('\n14. Provider Configuration Patterns')
    await providerConfigurationPatterns()
    
  } catch (error) {
    console.error('Error running provider examples:', error)
  }
}