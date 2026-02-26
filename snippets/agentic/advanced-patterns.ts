// Advanced Patterns for Agentic SDKs

import { createAISDKTools } from '@agentic/ai-sdk'
import { createLangChainTools } from '@agentic/langchain'
import { AgenticToolClient } from '@agentic/platform-tool-client'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import { z } from 'zod'
import { Effect, pipe, Schedule, Duration } from 'effect'
import { Schema } from '@effect/schema'

// ==========================================
// Tool Orchestration Patterns
// ==========================================

// Chain of Responsibility Pattern
export class ToolChain {
  private handlers: Array<{
    condition: (query: string) => boolean
    tool: any
    fallback?: any
  }> = []

  add(condition: (query: string) => boolean, toolId: string, fallbackId?: string) {
    this.handlers.push({
      condition,
      tool: toolId,
      fallback: fallbackId
    })
    return this
  }

  async execute(query: string) {
    for (const handler of this.handlers) {
      if (handler.condition(query)) {
        try {
          const tool = await AgenticToolClient.fromIdentifier(handler.tool)
          return await this.runTool(tool, query)
        } catch (error) {
          if (handler.fallback) {
            const fallbackTool = await AgenticToolClient.fromIdentifier(handler.fallback)
            return await this.runTool(fallbackTool, query)
          }
          throw error
        }
      }
    }
    
    // Default handler
    const defaultTool = await AgenticToolClient.fromIdentifier('@agentic/search')
    return await this.runTool(defaultTool, query)
  }

  private async runTool(tool: any, query: string) {
    const openai = createOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: 'strict' 
    })

    return await generateText({
      model: openai('gpt-4o-mini'),
      tools: createAISDKTools(tool),
      prompt: query,
      temperature: 0
    })
  }
}

// Usage
export const toolChainExample = async () => {
  const chain = new ToolChain()
    .add(q => q.includes('weather'), '@agentic/weather', '@agentic/search')
    .add(q => q.includes('calculate'), '@agentic/calculator')
    .add(q => q.includes('search'), '@agentic/search')

  const result = await chain.execute('What is the weather in Tokyo?')
  return result
}

// ==========================================
// Retry and Circuit Breaker Patterns
// ==========================================

export class ResilientToolClient {
  private failures = new Map<string, number>()
  private lastFailureTime = new Map<string, number>()
  private circuitBreakerThreshold = 5
  private circuitBreakerTimeout = 60000 // 1 minute

  async executeWithRetry(
    toolId: string, 
    query: string, 
    maxRetries = 3,
    backoffMs = 1000
  ) {
    // Check circuit breaker
    if (this.isCircuitOpen(toolId)) {
      throw new Error(`Circuit breaker open for ${toolId}`)
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
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

        // Reset failure count on success
        this.failures.delete(toolId)
        return result
        
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error)
        
        // Record failure
        const currentFailures = (this.failures.get(toolId) || 0) + 1
        this.failures.set(toolId, currentFailures)
        this.lastFailureTime.set(toolId, Date.now())

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = backoffMs * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          throw error
        }
      }
    }
  }

  private isCircuitOpen(toolId: string): boolean {
    const failures = this.failures.get(toolId) || 0
    const lastFailure = this.lastFailureTime.get(toolId) || 0

    if (failures >= this.circuitBreakerThreshold) {
      const timeSinceLastFailure = Date.now() - lastFailure
      if (timeSinceLastFailure < this.circuitBreakerTimeout) {
        return true
      } else {
        // Reset circuit breaker
        this.failures.delete(toolId)
        this.lastFailureTime.delete(toolId)
      }
    }

    return false
  }
}

// ==========================================
// Tool Composition with Effect-TS
// ==========================================

// Define tool effects
const loadToolEffect = (identifier: string) =>
  Effect.tryPromise({
    try: () => AgenticToolClient.fromIdentifier(identifier),
    catch: (error) => ({ type: 'ToolLoadError', identifier, error })
  })

const executeToolEffect = (tool: any, query: string) =>
  Effect.gen(function* () {
    const openai = createOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: 'strict' 
    })

    const result = yield* Effect.tryPromise({
      try: () => generateText({
        model: openai('gpt-4o-mini'),
        tools: createAISDKTools(tool),
        prompt: query,
        temperature: 0
      }),
      catch: (error) => ({ type: 'ExecutionError', error })
    })

    return result
  })

// Composed workflow with retry and timeout
export const robustToolExecution = (toolId: string, query: string) =>
  pipe(
    loadToolEffect(toolId),
    Effect.flatMap(tool => executeToolEffect(tool, query)),
    Effect.retry(
      Schedule.exponential(Duration.seconds(1)).pipe(
        Schedule.jittered,
        Schedule.whileInput((error: any) => error.type !== 'ToolLoadError'),
        Schedule.upTo(Duration.seconds(30))
      )
    ),
    Effect.timeout(Duration.seconds(60)),
    Effect.catchAll((error) =>
      Effect.succeed({
        text: 'Failed to execute tool, providing fallback response',
        error
      })
    )
  )

// ==========================================
// Caching and Memoization
// ==========================================

export class CachedToolExecutor {
  private cache = new Map<string, { result: any; timestamp: number }>()
  private ttl = 300000 // 5 minutes

  async execute(toolId: string, query: string, forceRefresh = false) {
    const cacheKey = `${toolId}:${query}`
    
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.ttl) {
        console.log('Returning cached result')
        return cached.result
      }
    }

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

    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    })

    // Clean old entries
    this.cleanCache()

    return result
  }

  private cleanCache() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }

  clearCache() {
    this.cache.clear()
  }
}

// ==========================================
// Parallel Tool Execution
// ==========================================

export class ParallelToolExecutor {
  async executeParallel(queries: Array<{ toolId: string; query: string }>) {
    const openai = createOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: 'strict' 
    })

    const executions = queries.map(async ({ toolId, query }) => {
      try {
        const tool = await AgenticToolClient.fromIdentifier(toolId)
        const result = await generateText({
          model: openai('gpt-4o-mini'),
          tools: createAISDKTools(tool),
          prompt: query,
          temperature: 0
        })
        
        return { 
          success: true, 
          toolId, 
          query, 
          result: result.text 
        }
      } catch (error) {
        return { 
          success: false, 
          toolId, 
          query, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    })

    return await Promise.all(executions)
  }

  async raceTools(toolIds: string[], query: string) {
    const openai = createOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: 'strict' 
    })

    const executions = toolIds.map(async (toolId) => {
      const tool = await AgenticToolClient.fromIdentifier(toolId)
      return generateText({
        model: openai('gpt-4o-mini'),
        tools: createAISDKTools(tool),
        prompt: query,
        temperature: 0
      })
    })

    return await Promise.race(executions)
  }
}

// ==========================================
// Tool Pipeline Builder
// ==========================================

export class ToolPipeline {
  private steps: Array<{
    name: string
    toolId: string
    transform?: (input: any) => string
    validate?: (output: any) => boolean
  }> = []

  addStep(
    name: string, 
    toolId: string, 
    options?: {
      transform?: (input: any) => string
      validate?: (output: any) => boolean
    }
  ) {
    this.steps.push({
      name,
      toolId,
      ...options
    })
    return this
  }

  async execute(initialInput: string) {
    const results: any[] = []
    let currentInput = initialInput

    for (const step of this.steps) {
      console.log(`Executing step: ${step.name}`)
      
      // Transform input if needed
      if (step.transform) {
        currentInput = step.transform(currentInput)
      }

      // Execute tool
      const tool = await AgenticToolClient.fromIdentifier(step.toolId)
      const openai = createOpenAI({ 
        apiKey: process.env.OPENAI_API_KEY,
        compatibility: 'strict' 
      })

      const result = await generateText({
        model: openai('gpt-4o-mini'),
        tools: createAISDKTools(tool),
        prompt: currentInput,
        temperature: 0
      })

      // Validate output
      if (step.validate && !step.validate(result)) {
        throw new Error(`Validation failed at step: ${step.name}`)
      }

      results.push({
        step: step.name,
        input: currentInput,
        output: result.text
      })

      // Use output as input for next step
      currentInput = result.text
    }

    return {
      finalOutput: currentInput,
      steps: results
    }
  }
}

// Usage example
export const pipelineExample = async () => {
  const pipeline = new ToolPipeline()
    .addStep('search', '@agentic/search')
    .addStep('summarize', '@agentic/search', {
      transform: (input) => `Summarize this: ${input}`
    })
    .addStep('translate', '@agentic/search', {
      transform: (input) => `Translate to Spanish: ${input}`,
      validate: (output) => output.text.length > 0
    })

  const result = await pipeline.execute('Latest news about TypeScript')
  return result
}

// ==========================================
// Dynamic Tool Selection
// ==========================================

export class DynamicToolSelector {
  private toolScores = new Map<string, number>()

  async selectBestTool(query: string, candidateTools: string[]) {
    const openai = createOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: 'strict' 
    })

    // Ask AI to select the best tool
    const selectionPrompt = `
      Given the query: "${query}"
      And these available tools: ${candidateTools.join(', ')}
      Which tool would be most appropriate? Respond with just the tool name.
    `

    const selection = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: selectionPrompt,
      temperature: 0
    })

    const selectedTool = candidateTools.find(tool => 
      selection.text.toLowerCase().includes(tool.toLowerCase())
    ) || candidateTools[0]

    // Update tool scores based on selection
    const currentScore = this.toolScores.get(selectedTool) || 0
    this.toolScores.set(selectedTool, currentScore + 1)

    return selectedTool
  }

  getToolStatistics() {
    return Array.from(this.toolScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tool, score]) => ({ tool, score }))
  }
}