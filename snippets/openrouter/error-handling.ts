/**
 * OpenRouter Error Handling Examples
 * 
 * This file demonstrates comprehensive error handling patterns
 * for OpenRouter API integration including retries, fallbacks, and monitoring.
 */

import OpenAI from 'openai';

// Custom error classes
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code?: number,
    public type?: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class RateLimitError extends OpenRouterError {
  constructor(message: string, retryAfter?: number) {
    super(message, 429, 'rate_limit_error', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
  retryAfter?: number;
}

export class ModelUnavailableError extends OpenRouterError {
  constructor(message: string, model: string) {
    super(message, 503, 'model_unavailable', 503);
    this.name = 'ModelUnavailableError';
    this.model = model;
  }
  model: string;
}

export class InsufficientCreditsError extends OpenRouterError {
  constructor(message: string) {
    super(message, 402, 'insufficient_credits', 402);
    this.name = 'InsufficientCreditsError';
  }
}

// Error detection and classification
export const classifyError = (error: any): OpenRouterError => {
  const status = error.status || error.response?.status;
  const message = error.message || 'Unknown error';
  const errorData = error.response?.data?.error;

  switch (status) {
    case 400:
      return new OpenRouterError(
        `Bad Request: ${errorData?.message || message}`,
        400,
        'invalid_request_error',
        400,
        error.response
      );
    
    case 401:
      return new OpenRouterError(
        `Unauthorized: ${errorData?.message || 'Invalid API key'}`,
        401,
        'authentication_error',
        401,
        error.response
      );
    
    case 402:
      return new InsufficientCreditsError(
        errorData?.message || 'Insufficient credits'
      );
    
    case 403:
      return new OpenRouterError(
        `Forbidden: ${errorData?.message || 'Request blocked by moderation'}`,
        403,
        'moderation_error',
        403,
        error.response
      );
    
    case 408:
      return new OpenRouterError(
        `Request Timeout: ${errorData?.message || 'Request timed out'}`,
        408,
        'timeout_error',
        408,
        error.response
      );
    
    case 429:
      const retryAfter = error.response?.headers?.['retry-after'];
      return new RateLimitError(
        errorData?.message || 'Rate limit exceeded',
        retryAfter ? parseInt(retryAfter) : undefined
      );
    
    case 502:
      return new ModelUnavailableError(
        errorData?.message || 'Model provider error',
        errorData?.model || 'unknown'
      );
    
    case 503:
      return new ModelUnavailableError(
        errorData?.message || 'No available model provider',
        errorData?.model || 'unknown'
      );
    
    default:
      return new OpenRouterError(
        message,
        status,
        'api_error',
        status,
        error.response
      );
  }
};

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: number[];
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: [408, 429, 502, 503, 504],
};

// Exponential backoff with jitter
export const calculateDelay = (
  attempt: number,
  config: RetryConfig
): number => {
  const exponentialDelay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay
  );

  if (config.jitter) {
    // Add random jitter (±25%)
    const jitterRange = exponentialDelay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, exponentialDelay + jitter);
  }

  return exponentialDelay;
};

// Robust client with error handling and retries
export class RobustOpenRouterClient {
  private client: OpenAI;
  private retryConfig: RetryConfig;

  constructor(
    apiKey: string,
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.SITE_URL,
        'X-Title': process.env.APP_NAME,
      },
    });

    this.retryConfig = { ...defaultRetryConfig, ...retryConfig };
  }

  // Generic retry wrapper
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const classifiedError = classifyError(error);
        lastError = classifiedError;

        // Don't retry on non-retryable errors
        if (!this.retryConfig.retryableErrors.includes(classifiedError.statusCode || 0)) {
          throw classifiedError;
        }

        // Don't retry on last attempt
        if (attempt > this.retryConfig.maxRetries) {
          break;
        }

        // Calculate delay for next attempt
        const delay = calculateDelay(attempt, this.retryConfig);
        
        console.warn(
          `${context} attempt ${attempt} failed: ${classifiedError.message}. ` +
          `Retrying in ${Math.round(delay)}ms...`
        );

        // Special handling for rate limits
        if (classifiedError instanceof RateLimitError && classifiedError.retryAfter) {
          const rateLimitDelay = classifiedError.retryAfter * 1000;
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  // Chat completion with error handling
  async chatCompletion(params: any): Promise<any> {
    return this.withRetry(
      () => this.client.chat.completions.create(params),
      'Chat completion'
    );
  }

  // Streaming with error handling
  async streamCompletion(params: any): Promise<AsyncIterable<any>> {
    return this.withRetry(
      () => this.client.chat.completions.create({ ...params, stream: true }),
      'Stream completion'
    );
  }
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime < this.resetTimeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailTime: this.lastFailTime,
    };
  }
}

// Model fallback handler
export class ModelFallbackHandler {
  private client: RobustOpenRouterClient;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(apiKey: string) {
    this.client = new RobustOpenRouterClient(apiKey);
  }

  private getCircuitBreaker(model: string): CircuitBreaker {
    if (!this.circuitBreakers.has(model)) {
      this.circuitBreakers.set(model, new CircuitBreaker());
    }
    return this.circuitBreakers.get(model)!;
  }

  async completionWithFallback(
    params: any,
    fallbackModels: string[] = []
  ): Promise<{ result: any; modelUsed: string; attempts: Array<{ model: string; error?: string }> }> {
    const models = [params.model, ...fallbackModels];
    const attempts: Array<{ model: string; error?: string }> = [];

    for (const model of models) {
      const circuitBreaker = this.getCircuitBreaker(model);
      
      try {
        const result = await circuitBreaker.execute(async () => {
          return await this.client.chatCompletion({ ...params, model });
        });

        attempts.push({ model });
        return { result, modelUsed: model, attempts };
      } catch (error: any) {
        const errorMessage = error.message;
        attempts.push({ model, error: errorMessage });
        
        console.warn(`Model ${model} failed: ${errorMessage}`);
        
        // If it's a non-retryable error (like insufficient credits), 
        // don't try other models
        if (error instanceof InsufficientCreditsError) {
          throw error;
        }
      }
    }

    throw new Error(`All models failed. Attempts: ${JSON.stringify(attempts)}`);
  }
}

// Health check and monitoring
export class OpenRouterHealthMonitor {
  private client: OpenAI;
  private healthMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    errorsByType: new Map<string, number>(),
    modelHealth: new Map<string, { success: number; total: number }>(),
  };

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    const checks = [
      this.checkApiConnection(),
      this.checkCredits(),
      this.checkModelAvailability(),
    ];

    const results = await Promise.allSettled(checks);
    const failures = results.filter(r => r.status === 'rejected').length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failures === 0) {
      status = 'healthy';
    } else if (failures < results.length) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      details: {
        apiConnection: results[0],
        credits: results[1],
        modelAvailability: results[2],
        metrics: this.getMetrics(),
      },
    };
  }

  private async checkApiConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.client.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      throw new Error('API connection failed');
    }
  }

  private async checkCredits(): Promise<{ credits: number; warning: boolean }> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/credits', {
        headers: {
          'Authorization': `Bearer ${this.client.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Credits check failed');
      }

      const data = await response.json();
      const credits = data.data?.credits || 0;

      return {
        credits,
        warning: credits < 1, // Warn if less than $1
      };
    } catch (error) {
      throw new Error('Credits check failed');
    }
  }

  private async checkModelAvailability(): Promise<{ availableModels: number }> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.client.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Models endpoint failed');
      }

      const data = await response.json();
      return { availableModels: data.data?.length || 0 };
    } catch (error) {
      throw new Error('Model availability check failed');
    }
  }

  recordRequest(model: string, success: boolean, latency: number, error?: Error) {
    this.healthMetrics.totalRequests++;
    
    if (success) {
      this.healthMetrics.successfulRequests++;
    } else {
      this.healthMetrics.failedRequests++;
      
      if (error) {
        const errorType = error.constructor.name;
        this.healthMetrics.errorsByType.set(
          errorType,
          (this.healthMetrics.errorsByType.get(errorType) || 0) + 1
        );
      }
    }

    // Update average latency
    this.healthMetrics.averageLatency = 
      (this.healthMetrics.averageLatency * (this.healthMetrics.totalRequests - 1) + latency) /
      this.healthMetrics.totalRequests;

    // Update model health
    const modelHealth = this.healthMetrics.modelHealth.get(model) || { success: 0, total: 0 };
    modelHealth.total++;
    if (success) modelHealth.success++;
    this.healthMetrics.modelHealth.set(model, modelHealth);
  }

  getMetrics() {
    const errorsByTypeObj = Object.fromEntries(this.healthMetrics.errorsByType);
    const modelHealthObj = Object.fromEntries(
      Array.from(this.healthMetrics.modelHealth.entries()).map(([model, health]) => [
        model,
        {
          ...health,
          successRate: health.total > 0 ? health.success / health.total : 0,
        },
      ])
    );

    return {
      ...this.healthMetrics,
      successRate: this.healthMetrics.totalRequests > 0 
        ? this.healthMetrics.successfulRequests / this.healthMetrics.totalRequests 
        : 0,
      errorsByType: errorsByTypeObj,
      modelHealth: modelHealthObj,
    };
  }
}

// Usage examples
export const errorHandlingExamples = {
  // Basic error handling
  basicExample: async () => {
    const client = new RobustOpenRouterClient(process.env.OPENROUTER_API_KEY!);

    try {
      const result = await client.chatCompletion({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello!' }],
      });
      
      console.log('Success:', result.choices[0]?.message?.content);
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.log(`Rate limited. Retry after: ${error.retryAfter}s`);
      } else if (error instanceof InsufficientCreditsError) {
        console.log('Need to add more credits');
      } else if (error instanceof ModelUnavailableError) {
        console.log(`Model ${error.model} is unavailable`);
      } else {
        console.log(`Error: ${error.message}`);
      }
    }
  },

  // Model fallback example
  fallbackExample: async () => {
    const fallbackHandler = new ModelFallbackHandler(process.env.OPENROUTER_API_KEY!);

    try {
      const { result, modelUsed, attempts } = await fallbackHandler.completionWithFallback(
        {
          model: 'openai/gpt-4o',
          messages: [{ role: 'user', content: 'Hello!' }],
        },
        ['anthropic/claude-3.5-sonnet', 'openai/gpt-3.5-turbo']
      );

      console.log(`Success with ${modelUsed}`);
      console.log('Attempts:', attempts);
    } catch (error) {
      console.log('All models failed:', error);
    }
  },

  // Health monitoring example
  healthMonitoringExample: async () => {
    const monitor = new OpenRouterHealthMonitor(process.env.OPENROUTER_API_KEY!);

    const health = await monitor.healthCheck();
    console.log('Health status:', health.status);
    console.log('Health details:', JSON.stringify(health.details, null, 2));
  },
};

// Export everything for use
export {
  RobustOpenRouterClient,
  ModelFallbackHandler,
  OpenRouterHealthMonitor,
  CircuitBreaker,
  calculateDelay,
  classifyError,
};