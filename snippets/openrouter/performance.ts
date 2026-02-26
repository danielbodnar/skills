/**
 * OpenRouter Performance Optimization Examples
 * 
 * This file demonstrates performance optimization techniques including
 * caching, connection pooling, request batching, and monitoring.
 */

import OpenAI from 'openai';

// Response caching with TTL
export class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(defaultTtl = 300000) { // 5 minutes default
    this.defaultTtl = defaultTtl;
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private defaultTtl: number;

  private generateKey(model: string, messages: any[], params: any = {}): string {
    const keyData = {
      model,
      messages,
      temperature: params.temperature,
      max_tokens: params.max_tokens,
      tools: params.tools,
      // Only include deterministic parameters
    };
    return JSON.stringify(keyData);
  }

  get(model: string, messages: any[], params: any = {}): any | null {
    const key = this.generateKey(model, messages, params);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(model: string, messages: any[], response: any, params: any = {}, ttl?: number): void {
    const key = this.generateKey(model, messages, params);
    this.cache.set(key, {
      data: response,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size,
      // Hit rate would need additional tracking
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Connection pooling and request optimization
export class OptimizedOpenRouterClient {
  private client: OpenAI;
  private cache: ResponseCache;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private concurrencyLimit = 10;
  private activeRequests = 0;
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageLatency: 0,
    requestsByModel: new Map<string, number>(),
  };

  constructor(
    apiKey: string,
    options: {
      cacheEnabled?: boolean;
      cacheTtl?: number;
      concurrencyLimit?: number;
      siteUrl?: string;
      appName?: string;
    } = {}
  ) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': options.siteUrl || process.env.SITE_URL,
        'X-Title': options.appName || process.env.APP_NAME,
      },
      timeout: 30000, // 30 second timeout
    });

    this.cache = new ResponseCache(options.cacheTtl);
    this.concurrencyLimit = options.concurrencyLimit || 10;
  }

  // Cached completion
  async cachedCompletion(params: any, cacheOptions?: { ttl?: number; useCache?: boolean }): Promise<any> {
    const useCache = cacheOptions?.useCache !== false;
    const startTime = Date.now();

    // Check cache first
    if (useCache && params.temperature <= 0.1) { // Only cache deterministic responses
      const cached = this.cache.get(params.model, params.messages, params);
      if (cached) {
        this.metrics.cacheHits++;
        this.recordMetrics(params.model, Date.now() - startTime, true);
        return cached;
      }
    }

    this.metrics.cacheMisses++;

    // Make request with concurrency control
    const response = await this.throttledRequest(() => 
      this.client.chat.completions.create(params)
    );

    // Cache response if appropriate
    if (useCache && params.temperature <= 0.1) {
      this.cache.set(params.model, params.messages, response, params, cacheOptions?.ttl);
    }

    this.recordMetrics(params.model, Date.now() - startTime, true);
    return response;
  }

  // Throttled request execution
  private async throttledRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.activeRequests >= this.concurrencyLimit) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0 && this.activeRequests < this.concurrencyLimit) {
      const request = this.requestQueue.shift();
      if (request) {
        this.activeRequests++;
        request().finally(() => {
          this.activeRequests--;
          this.processQueue(); // Process next request
        });
      }
    }

    this.isProcessing = false;
  }

  // Batch multiple requests
  async batchRequests(requests: Array<{ params: any; id?: string }>): Promise<Array<{ id?: string; result?: any; error?: any }>> {
    const promises = requests.map(async (request) => {
      try {
        const result = await this.cachedCompletion(request.params);
        return { id: request.id, result };
      } catch (error) {
        return { id: request.id, error };
      }
    });

    return Promise.all(promises);
  }

  // Streaming with optimization
  async optimizedStream(params: any): Promise<AsyncIterable<any>> {
    // Don't cache streaming responses
    return this.throttledRequest(() => 
      this.client.chat.completions.create({ ...params, stream: true })
    );
  }

  // Preload common responses
  async preloadResponses(commonPrompts: Array<{ model: string; messages: any[]; params?: any }>): Promise<void> {
    console.log(`Preloading ${commonPrompts.length} common responses...`);
    
    const batchRequests = commonPrompts.map((prompt, index) => ({
      id: `preload-${index}`,
      params: {
        model: prompt.model,
        messages: prompt.messages,
        temperature: 0, // Deterministic for caching
        max_tokens: 100, // Short responses for preloading
        ...prompt.params,
      },
    }));

    await this.batchRequests(batchRequests);
    console.log('Preloading complete');
  }

  private recordMetrics(model: string, latency: number, success: boolean): void {
    this.metrics.totalRequests++;
    
    // Update average latency
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency) /
      this.metrics.totalRequests;

    // Track requests by model
    this.metrics.requestsByModel.set(
      model,
      (this.metrics.requestsByModel.get(model) || 0) + 1
    );
  }

  getMetrics() {
    return {
      ...this.metrics,
      cache: this.cache.getStats(),
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      cacheHitRate: this.metrics.totalRequests > 0 
        ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
        : 0,
    };
  }

  destroy(): void {
    this.cache.destroy();
  }
}

// Request deduplication
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  private generateKey(params: any): string {
    // Create a hash of the request parameters
    return JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.max_tokens,
      tools: params.tools,
    });
  }

  async deduplicate<T>(
    params: any,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const key = this.generateKey(params);
    
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Start new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private measurements: Array<{
    operation: string;
    duration: number;
    timestamp: number;
    success: boolean;
    model?: string;
    tokens?: number;
  }> = [];

  private maxMeasurements = 1000;

  startMeasurement(operation: string): () => void {
    const startTime = performance.now();
    
    return (success = true, metadata: { model?: string; tokens?: number } = {}) => {
      const duration = performance.now() - startTime;
      
      this.measurements.push({
        operation,
        duration,
        timestamp: Date.now(),
        success,
        ...metadata,
      });

      // Keep only recent measurements
      if (this.measurements.length > this.maxMeasurements) {
        this.measurements.splice(0, this.measurements.length - this.maxMeasurements);
      }
    };
  }

  getStats(timeWindow = 300000): { // 5 minutes default
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    successRate: number;
    throughput: number;
    tokenThroughput: number;
    byModel: Record<string, any>;
  } {
    const cutoff = Date.now() - timeWindow;
    const recent = this.measurements.filter(m => m.timestamp > cutoff);
    
    if (recent.length === 0) {
      return {
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        successRate: 0,
        throughput: 0,
        tokenThroughput: 0,
        byModel: {},
      };
    }

    const durations = recent.map(m => m.duration).sort((a, b) => a - b);
    const successful = recent.filter(m => m.success);
    const totalTokens = recent.reduce((sum, m) => sum + (m.tokens || 0), 0);
    
    // Group by model
    const byModel: Record<string, any> = {};
    recent.forEach(m => {
      if (m.model) {
        if (!byModel[m.model]) {
          byModel[m.model] = { count: 0, totalDuration: 0, totalTokens: 0 };
        }
        byModel[m.model].count++;
        byModel[m.model].totalDuration += m.duration;
        byModel[m.model].totalTokens += m.tokens || 0;
      }
    });

    // Calculate model averages
    Object.keys(byModel).forEach(model => {
      const stats = byModel[model];
      stats.averageLatency = stats.totalDuration / stats.count;
      stats.tokensPerSecond = stats.totalTokens / (stats.totalDuration / 1000);
    });

    return {
      averageLatency: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95Latency: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Latency: durations[Math.floor(durations.length * 0.99)] || 0,
      successRate: successful.length / recent.length,
      throughput: recent.length / (timeWindow / 1000), // requests per second
      tokenThroughput: totalTokens / (timeWindow / 1000), // tokens per second
      byModel,
    };
  }
}

// Intelligent model selection based on performance
export class ModelSelector {
  private performanceHistory = new Map<string, Array<{ latency: number; success: boolean; timestamp: number }>>();
  private modelCapabilities = new Map<string, { contextLength: number; pricing: number; specialty: string[] }>();

  constructor() {
    // Initialize with known model capabilities
    this.modelCapabilities.set('openai/gpt-4o', {
      contextLength: 128000,
      pricing: 0.005,
      specialty: ['reasoning', 'coding', 'analysis'],
    });
    
    this.modelCapabilities.set('anthropic/claude-3.5-sonnet', {
      contextLength: 200000,
      pricing: 0.003,
      specialty: ['writing', 'analysis', 'reasoning'],
    });
    
    this.modelCapabilities.set('openai/gpt-3.5-turbo', {
      contextLength: 16385,
      pricing: 0.0005,
      specialty: ['general', 'fast'],
    });
  }

  recordPerformance(model: string, latency: number, success: boolean): void {
    if (!this.performanceHistory.has(model)) {
      this.performanceHistory.set(model, []);
    }

    const history = this.performanceHistory.get(model)!;
    history.push({ latency, success, timestamp: Date.now() });

    // Keep only recent history (last 100 measurements)
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  selectBestModel(
    requirements: {
      taskType?: string;
      maxLatency?: number;
      maxCost?: number;
      contextNeeded?: number;
      prioritizeSpeed?: boolean;
      prioritizeCost?: boolean;
    } = {}
  ): string {
    const candidates = Array.from(this.modelCapabilities.keys());
    
    // Filter by requirements
    const qualified = candidates.filter(model => {
      const capabilities = this.modelCapabilities.get(model)!;
      
      if (requirements.maxCost && capabilities.pricing > requirements.maxCost) {
        return false;
      }
      
      if (requirements.contextNeeded && capabilities.contextLength < requirements.contextNeeded) {
        return false;
      }
      
      if (requirements.taskType && !capabilities.specialty.includes(requirements.taskType)) {
        // Don't strictly filter, but prefer matching specialties
      }
      
      return true;
    });

    if (qualified.length === 0) {
      return 'openai/gpt-4o'; // Fallback
    }

    // Score models based on performance and requirements
    const scored = qualified.map(model => {
      const capabilities = this.modelCapabilities.get(model)!;
      const history = this.performanceHistory.get(model) || [];
      
      // Calculate recent performance
      const recentHistory = history.filter(h => Date.now() - h.timestamp < 3600000); // Last hour
      const avgLatency = recentHistory.length > 0
        ? recentHistory.reduce((sum, h) => sum + h.latency, 0) / recentHistory.length
        : 1000; // Default assumption
      
      const successRate = recentHistory.length > 0
        ? recentHistory.filter(h => h.success).length / recentHistory.length
        : 0.95; // Default assumption

      let score = successRate * 100; // Base score from success rate

      // Adjust for latency
      if (requirements.prioritizeSpeed) {
        score -= (avgLatency / 1000) * 10; // Penalize high latency
      }

      // Adjust for cost
      if (requirements.prioritizeCost) {
        score -= capabilities.pricing * 1000; // Penalize high cost
      }

      // Bonus for specialty match
      if (requirements.taskType && capabilities.specialty.includes(requirements.taskType)) {
        score += 20;
      }

      // Penalty for latency requirements
      if (requirements.maxLatency && avgLatency > requirements.maxLatency) {
        score -= 50;
      }

      return { model, score, avgLatency, successRate };
    });

    // Sort by score and return best
    scored.sort((a, b) => b.score - a.score);
    return scored[0].model;
  }

  getModelStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.performanceHistory.forEach((history, model) => {
      const recent = history.filter(h => Date.now() - h.timestamp < 3600000);
      
      if (recent.length > 0) {
        stats[model] = {
          samples: recent.length,
          averageLatency: recent.reduce((sum, h) => sum + h.latency, 0) / recent.length,
          successRate: recent.filter(h => h.success).length / recent.length,
          capabilities: this.modelCapabilities.get(model),
        };
      }
    });

    return stats;
  }
}

// Usage examples
export const performanceExamples = {
  // Optimized client usage
  optimizedClientExample: async () => {
    const client = new OptimizedOpenRouterClient(process.env.OPENROUTER_API_KEY!, {
      cacheEnabled: true,
      cacheTtl: 600000, // 10 minutes
      concurrencyLimit: 5,
    });

    // Preload common responses
    await client.preloadResponses([
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello!' }],
      },
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'What is AI?' }],
      },
    ]);

    // Make requests that benefit from caching
    const response1 = await client.cachedCompletion({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello!' }],
      temperature: 0,
    });

    const response2 = await client.cachedCompletion({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello!' }],
      temperature: 0,
    }); // This should be cached

    console.log('Metrics:', client.getMetrics());
    client.destroy();
  },

  // Performance monitoring
  monitoringExample: async () => {
    const monitor = new PerformanceMonitor();
    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Measure request performance
    const endMeasurement = monitor.startMeasurement('chat_completion');
    
    try {
      const response = await client.chat.completions.create({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      const tokens = response.usage?.total_tokens || 0;
      endMeasurement(true, { model: 'openai/gpt-3.5-turbo', tokens });
    } catch (error) {
      endMeasurement(false);
    }

    // Get performance stats
    const stats = monitor.getStats();
    console.log('Performance stats:', stats);
  },

  // Model selection
  modelSelectionExample: async () => {
    const selector = new ModelSelector();
    
    // Record some performance data
    selector.recordPerformance('openai/gpt-4o', 2000, true);
    selector.recordPerformance('openai/gpt-3.5-turbo', 800, true);
    selector.recordPerformance('anthropic/claude-3.5-sonnet', 1500, true);

    // Select best model for different scenarios
    const speedOptimized = selector.selectBestModel({ prioritizeSpeed: true });
    const costOptimized = selector.selectBestModel({ prioritizeCost: true });
    const codingTask = selector.selectBestModel({ taskType: 'coding' });

    console.log('Speed optimized model:', speedOptimized);
    console.log('Cost optimized model:', costOptimized);
    console.log('Coding task model:', codingTask);
    console.log('Model stats:', selector.getModelStats());
  },
};

// Export all classes
export {
  ResponseCache,
  OptimizedOpenRouterClient,
  RequestDeduplicator,
  PerformanceMonitor,
  ModelSelector,
};