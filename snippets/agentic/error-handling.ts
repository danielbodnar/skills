// Error Handling Patterns for Agentic SDKs

import { createAISDKTools } from '@agentic/ai-sdk'
import { AgenticToolClient } from '@agentic/platform-tool-client'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'

// ==========================================
// Custom Error Classes
// ==========================================

export class AgenticError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AgenticError'
  }
}

export class ToolLoadError extends AgenticError {
  constructor(toolId: string, cause?: Error) {
    super(
      `Failed to load tool: ${toolId}`,
      'TOOL_LOAD_ERROR',
      { toolId, cause: cause?.message }
    )
  }
}

export class ToolExecutionError extends AgenticError {
  constructor(toolId: string, query: string, cause?: Error) {
    super(
      `Tool execution failed for ${toolId}`,
      'TOOL_EXECUTION_ERROR',
      { toolId, query, cause: cause?.message }
    )
  }
}

export class AuthenticationError extends AgenticError {
  constructor(service: string) {
    super(
      `Authentication failed for ${service}`,
      'AUTH_ERROR',
      { service }
    )
  }
}

export class RateLimitError extends AgenticError {
  constructor(retryAfter?: number) {
    super(
      'Rate limit exceeded',
      'RATE_LIMIT',
      { retryAfter }
    )
  }
}

export class ValidationError extends AgenticError {
  constructor(errors: z.ZodError) {
    super(
      'Validation failed',
      'VALIDATION_ERROR',
      { errors: errors.errors }
    )
  }
}

// ==========================================
// Error Handler Wrapper
// ==========================================

export class SafeToolExecutor {
  private errorHandlers = new Map<string, (error: any) => any>()

  registerErrorHandler(errorCode: string, handler: (error: any) => any) {
    this.errorHandlers.set(errorCode, handler)
    return this
  }

  async execute(toolId: string, query: string) {
    try {
      // Validate inputs
      this.validateInputs(toolId, query)
      
      // Load tool with error handling
      const tool = await this.loadToolSafely(toolId)
      
      // Execute with timeout
      const result = await this.executeWithTimeout(tool, query, 30000)
      
      return { success: true, data: result }
      
    } catch (error) {
      return this.handleError(error)
    }
  }

  private validateInputs(toolId: string, query: string) {
    const schema = z.object({
      toolId: z.string().min(1),
      query: z.string().min(1).max(1000)
    })

    try {
      schema.parse({ toolId, query })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error)
      }
      throw error
    }
  }

  private async loadToolSafely(toolId: string) {
    try {
      return await AgenticToolClient.fromIdentifier(toolId)
    } catch (error) {
      throw new ToolLoadError(toolId, error as Error)
    }
  }

  private async executeWithTimeout(tool: any, query: string, timeoutMs: number) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const openai = createOpenAI({ 
        apiKey: process.env.OPENAI_API_KEY,
        compatibility: 'strict' 
      })

      const result = await generateText({
        model: openai('gpt-4o-mini'),
        tools: createAISDKTools(tool),
        prompt: query,
        temperature: 0,
        abortSignal: controller.signal
      })

      return result
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AgenticError('Request timeout', 'TIMEOUT', { timeoutMs })
      }
      throw new ToolExecutionError(tool.identifier, query, error)
    } finally {
      clearTimeout(timeout)
    }
  }

  private handleError(error: any) {
    // Check for registered handlers
    if (error instanceof AgenticError) {
      const handler = this.errorHandlers.get(error.code)
      if (handler) {
        return handler(error)
      }
    }

    // Default error handling
    console.error('Tool execution error:', error)
    
    return {
      success: false,
      error: {
        message: error.message || 'Unknown error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || {}
      }
    }
  }
}

// ==========================================
// Graceful Degradation
// ==========================================

export class GracefulToolExecutor {
  private fallbackStrategies = new Map<string, () => Promise<any>>()

  setFallback(toolId: string, strategy: () => Promise<any>) {
    this.fallbackStrategies.set(toolId, strategy)
    return this
  }

  async execute(toolId: string, query: string) {
    try {
      // Primary execution
      const tool = await AgenticToolClient.fromIdentifier(toolId)
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
      
    } catch (primaryError) {
      console.warn(`Primary execution failed for ${toolId}:`, primaryError)
      
      // Try fallback strategy
      const fallback = this.fallbackStrategies.get(toolId)
      if (fallback) {
        try {
          console.log(`Executing fallback for ${toolId}`)
          return await fallback()
        } catch (fallbackError) {
          console.error(`Fallback also failed for ${toolId}:`, fallbackError)
          throw new AgenticError(
            'Both primary and fallback execution failed',
            'TOTAL_FAILURE',
            { primaryError, fallbackError }
          )
        }
      }
      
      // No fallback available
      throw primaryError
    }
  }
}

// Usage example
export const gracefulExample = async () => {
  const executor = new GracefulToolExecutor()
    .setFallback('@agentic/search', async () => ({
      text: 'Search is currently unavailable. Please try again later.',
      cached: true
    }))
    .setFallback('@agentic/calculator', async () => ({
      text: 'Calculator is offline. Using basic math fallback.',
      cached: true
    }))

  const result = await executor.execute('@agentic/search', 'test query')
  return result
}

// ==========================================
// Error Recovery Strategies
// ==========================================

export class ErrorRecovery {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number
      delay?: number
      backoff?: 'linear' | 'exponential'
      shouldRetry?: (error: any) => boolean
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 'exponential',
      shouldRetry = () => true
    } = options

    let lastError: any

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (!shouldRetry(error) || attempt === maxAttempts - 1) {
          throw error
        }

        const waitTime = backoff === 'exponential' 
          ? delay * Math.pow(2, attempt)
          : delay * (attempt + 1)

        console.log(`Retry attempt ${attempt + 1} after ${waitTime}ms`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    throw lastError
  }

  static async withFallback<T>(
    operations: Array<() => Promise<T>>
  ): Promise<T> {
    const errors: any[] = []

    for (const operation of operations) {
      try {
        return await operation()
      } catch (error) {
        errors.push(error)
        continue
      }
    }

    throw new AgenticError(
      'All operations failed',
      'ALL_FALLBACKS_FAILED',
      { errors }
    )
  }

  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new AgenticError('Operation timeout', 'TIMEOUT', { timeoutMs })),
          timeoutMs
        )
      )
    ])
  }
}

// ==========================================
// Error Logging and Monitoring
// ==========================================

export class ErrorMonitor {
  private errors: Array<{
    timestamp: Date
    error: any
    context: any
  }> = []

  logError(error: any, context: any = {}) {
    const errorEntry = {
      timestamp: new Date(),
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack,
        details: error.details
      },
      context
    }

    this.errors.push(errorEntry)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorEntry)
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorEntry)
    }
  }

  private sendToMonitoringService(errorEntry: any) {
    // Implement integration with monitoring service
    // e.g., Sentry, LogRocket, DataDog, etc.
    console.log('Would send to monitoring service:', errorEntry)
  }

  getErrorStats() {
    const stats = new Map<string, number>()
    
    for (const entry of this.errors) {
      const code = entry.error.code || 'UNKNOWN'
      stats.set(code, (stats.get(code) || 0) + 1)
    }

    return Array.from(stats.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
  }

  clearErrors() {
    this.errors = []
  }
}

// ==========================================
// Complete Error Handling Example
// ==========================================

export const completeErrorHandlingExample = async () => {
  const monitor = new ErrorMonitor()
  const executor = new SafeToolExecutor()
    .registerErrorHandler('RATE_LIMIT', (error) => ({
      success: false,
      error: 'Rate limit reached. Please try again later.',
      retryAfter: error.details.retryAfter
    }))
    .registerErrorHandler('AUTH_ERROR', (error) => ({
      success: false,
      error: 'Authentication failed. Please check your API keys.'
    }))
    .registerErrorHandler('VALIDATION_ERROR', (error) => ({
      success: false,
      error: 'Invalid input',
      validationErrors: error.details.errors
    }))

  try {
    // Execute with all error handling
    const result = await ErrorRecovery.withRetry(
      async () => {
        const response = await ErrorRecovery.withTimeout(
          () => executor.execute('@agentic/search', 'test query'),
          30000
        )
        
        if (!response.success) {
          throw new Error(response.error.message)
        }
        
        return response
      },
      {
        maxAttempts: 3,
        backoff: 'exponential',
        shouldRetry: (error) => {
          // Don't retry on validation errors
          return !(error instanceof ValidationError)
        }
      }
    )

    return result
    
  } catch (error) {
    monitor.logError(error, {
      toolId: '@agentic/search',
      query: 'test query'
    })
    
    // Return graceful error response
    return {
      success: false,
      error: 'Service temporarily unavailable',
      errorId: crypto.randomUUID()
    }
  }
}