// Chrome Gemini Nano - Performance Optimization Examples
// Patterns for optimizing AI performance and resource usage

// Performance monitoring and metrics
interface PerformanceMetrics {
  responseTime: number;
  tokensPerSecond: number;
  memoryUsage: number;
  sessionCount: number;
  errorRate: number;
  averageRequestSize: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private currentSessions = 0;
  private totalRequests = 0;
  private totalErrors = 0;
  
  startRequest(): { end: () => PerformanceMetrics } {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    return {
      end: () => {
        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();
        
        this.totalRequests++;
        
        const metrics: PerformanceMetrics = {
          responseTime: endTime - startTime,
          tokensPerSecond: 0, // Would need token counting
          memoryUsage: endMemory - startMemory,
          sessionCount: this.currentSessions,
          errorRate: this.totalErrors / this.totalRequests,
          averageRequestSize: 0 // Would need request size tracking
        };
        
        this.metrics.push(metrics);
        
        // Keep only last 100 metrics
        if (this.metrics.length > 100) {
          this.metrics.shift();
        }
        
        return metrics;
      }
    };
  }
  
  recordError(): void {
    this.totalErrors++;
  }
  
  sessionCreated(): void {
    this.currentSessions++;
  }
  
  sessionDestroyed(): void {
    this.currentSessions = Math.max(0, this.currentSessions - 1);
  }
  
  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length;
  }
  
  getP95ResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    const sorted = this.metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || 0;
  }
  
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
  
  getReport(): {
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    activeSessions: number;
    totalRequests: number;
  } {
    return {
      avgResponseTime: this.getAverageResponseTime(),
      p95ResponseTime: this.getP95ResponseTime(),
      errorRate: this.totalErrors / Math.max(1, this.totalRequests),
      activeSessions: this.currentSessions,
      totalRequests: this.totalRequests
    };
  }
}

// Session pooling for better resource management
class SessionPool {
  private pool: Map<string, any[]> = new Map();
  private monitor = new PerformanceMonitor();
  private maxPoolSize = 5;
  private maxIdleTime = 300000; // 5 minutes
  
  async getSession(configKey: string, config: any): Promise<any> {
    let sessions = this.pool.get(configKey) || [];
    
    // Try to get an existing session
    const availableSession = sessions.find(s => !s.inUse);
    
    if (availableSession) {
      availableSession.inUse = true;
      availableSession.lastUsed = Date.now();
      return availableSession.session;
    }
    
    // Create new session if pool not full
    if (sessions.length < this.maxPoolSize) {
      const session = await (window as any).ai.languageModel.create(config);
      
      const pooledSession = {
        session,
        inUse: true,
        created: Date.now(),
        lastUsed: Date.now(),
        configKey
      };
      
      sessions.push(pooledSession);
      this.pool.set(configKey, sessions);
      this.monitor.sessionCreated();
      
      return session;
    }
    
    // Wait for a session to become available
    return await this.waitForAvailableSession(configKey);
  }
  
  releaseSession(session: any, configKey: string): void {
    const sessions = this.pool.get(configKey) || [];
    const pooledSession = sessions.find(s => s.session === session);
    
    if (pooledSession) {
      pooledSession.inUse = false;
      pooledSession.lastUsed = Date.now();
    }
  }
  
  private async waitForAvailableSession(configKey: string, timeout = 30000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const sessions = this.pool.get(configKey) || [];
      const availableSession = sessions.find(s => !s.inUse);
      
      if (availableSession) {
        availableSession.inUse = true;
        availableSession.lastUsed = Date.now();
        return availableSession.session;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Timeout waiting for available session');
  }
  
  cleanup(): void {
    const now = Date.now();
    
    for (const [configKey, sessions] of this.pool.entries()) {
      const activeSessions = sessions.filter(s => {
        const isIdle = !s.inUse && (now - s.lastUsed) > this.maxIdleTime;
        
        if (isIdle) {
          try {
            s.session.destroy();
            this.monitor.sessionDestroyed();
          } catch (error) {
            console.warn('Error destroying idle session:', error);
          }
          return false;
        }
        
        return true;
      });
      
      if (activeSessions.length === 0) {
        this.pool.delete(configKey);
      } else {
        this.pool.set(configKey, activeSessions);
      }
    }
  }
  
  getPoolStats(): Record<string, {total: number, active: number, idle: number}> {
    const stats: Record<string, {total: number, active: number, idle: number}> = {};
    
    for (const [configKey, sessions] of this.pool.entries()) {
      const active = sessions.filter(s => s.inUse).length;
      const idle = sessions.length - active;
      
      stats[configKey] = {
        total: sessions.length,
        active,
        idle
      };
    }
    
    return stats;
  }
}

// Request batching for efficiency
class RequestBatcher {
  private batches: Map<string, {
    requests: Array<{
      prompt: string;
      resolve: (value: string) => void;
      reject: (error: Error) => void;
    }>;
    timer: NodeJS.Timeout;
  }> = new Map();
  
  private batchDelay = 100; // ms
  private maxBatchSize = 10;
  
  async prompt(session: any, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const sessionKey = this.getSessionKey(session);
      
      let batch = this.batches.get(sessionKey);
      
      if (!batch) {
        batch = {
          requests: [],
          timer: setTimeout(() => this.processBatch(sessionKey), this.batchDelay)
        };
        this.batches.set(sessionKey, batch);
      }
      
      batch.requests.push({ prompt, resolve, reject });
      
      // Process immediately if batch is full
      if (batch.requests.length >= this.maxBatchSize) {
        clearTimeout(batch.timer);
        this.processBatch(sessionKey);
      }
    });
  }
  
  private async processBatch(sessionKey: string): Promise<void> {
    const batch = this.batches.get(sessionKey);
    if (!batch) return;
    
    this.batches.delete(sessionKey);
    
    // For simplicity, process requests sequentially
    // In practice, you might want to combine prompts or use parallel processing
    for (const request of batch.requests) {
      try {
        // This would need access to the actual session
        // For now, this is a placeholder
        const response = await this.processRequest(request.prompt);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }
    }
  }
  
  private async processRequest(prompt: string): Promise<string> {
    // Placeholder - would need actual session
    return `Processed: ${prompt}`;
  }
  
  private getSessionKey(session: any): string {
    // Generate a key to identify the session
    return session.toString();
  }
}

// Caching for repeated requests
class ResponseCache {
  private cache: Map<string, {
    response: string;
    timestamp: number;
    hits: number;
  }> = new Map();
  
  private maxAge = 600000; // 10 minutes
  private maxSize = 1000;
  
  get(prompt: string, config: any): string | null {
    const key = this.generateKey(prompt, config);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    cached.hits++;
    return cached.response;
  }
  
  set(prompt: string, config: any, response: string): void {
    const key = this.generateKey(prompt, config);
    
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hits: 0
    });
  }
  
  private generateKey(prompt: string, config: any): string {
    const configStr = JSON.stringify({
      temperature: config.temperature,
      topK: config.topK,
      systemPrompt: config.systemPrompt
    });
    
    return `${prompt}:${configStr}`;
  }
  
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  getCacheStats(): {
    size: number;
    hitRate: number;
    avgAge: number;
  } {
    const now = Date.now();
    let totalHits = 0;
    let totalRequests = 0;
    let totalAge = 0;
    
    for (const value of this.cache.values()) {
      totalHits += value.hits;
      totalRequests += value.hits + 1; // +1 for initial set
      totalAge += now - value.timestamp;
    }
    
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      avgAge: this.cache.size > 0 ? totalAge / this.cache.size : 0
    };
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Optimized AI service combining all performance features
class OptimizedAIService {
  private sessionPool = new SessionPool();
  private monitor = new PerformanceMonitor();
  private cache = new ResponseCache();
  private batcher = new RequestBatcher();
  
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // Regular cleanup of idle sessions
    this.cleanupInterval = setInterval(() => {
      this.sessionPool.cleanup();
    }, 60000); // Every minute
  }
  
  async prompt(prompt: string, config: any = {}): Promise<string> {
    const metric = this.monitor.startRequest();
    
    try {
      // Check cache first
      const cached = this.cache.get(prompt, config);
      if (cached) {
        metric.end();
        return cached;
      }
      
      // Get session from pool
      const configKey = JSON.stringify(config);
      const session = await this.sessionPool.getSession(configKey, config);
      
      try {
        // Use batcher for efficiency
        const response = await this.batcher.prompt(session, prompt);
        
        // Cache the response
        this.cache.set(prompt, config, response);
        
        const metrics = metric.end();
        console.log(`Request completed in ${metrics.responseTime.toFixed(2)}ms`);
        
        return response;
      } finally {
        this.sessionPool.releaseSession(session, configKey);
      }
    } catch (error) {
      this.monitor.recordError();
      metric.end();
      throw error;
    }
  }
  
  async *promptStreaming(prompt: string, config: any = {}): AsyncGenerator<string, void, unknown> {
    const metric = this.monitor.startRequest();
    
    try {
      const configKey = JSON.stringify(config);
      const session = await this.sessionPool.getSession(configKey, config);
      
      try {
        const stream = session.promptStreaming(prompt);
        
        for await (const chunk of stream) {
          yield chunk;
        }
        
        metric.end();
      } finally {
        this.sessionPool.releaseSession(session, configKey);
      }
    } catch (error) {
      this.monitor.recordError();
      metric.end();
      throw error;
    }
  }
  
  getPerformanceReport(): {
    monitor: any;
    poolStats: any;
    cacheStats: any;
  } {
    return {
      monitor: this.monitor.getReport(),
      poolStats: this.sessionPool.getPoolStats(),
      cacheStats: this.cache.getCacheStats()
    };
  }
  
  clearCache(): void {
    this.cache.clear();
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.sessionPool.cleanup();
    this.cache.clear();
  }
}

// Resource usage optimization
class ResourceOptimizer {
  static optimizeForLowMemory(): any {
    return {
      temperature: 0.5,
      topK: 3,
      // Use shorter system prompts
      systemPrompt: 'Be concise.',
      // Shorter timeouts
      timeout: 15000
    };
  }
  
  static optimizeForSpeed(): any {
    return {
      temperature: 0.3,
      topK: 2,
      // Minimize processing
      systemPrompt: 'Answer briefly.',
      timeout: 10000
    };
  }
  
  static optimizeForAccuracy(): any {
    return {
      temperature: 0.2,
      topK: 1,
      systemPrompt: 'Provide accurate, well-reasoned responses.',
      timeout: 45000
    };
  }
  
  static adaptToDevice(): any {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    if (memory < 4 || cores < 4) {
      return this.optimizeForLowMemory();
    } else if (memory >= 8 && cores >= 8) {
      return this.optimizeForAccuracy();
    } else {
      return this.optimizeForSpeed();
    }
  }
}

// Usage example
async function demonstrateOptimization(): Promise<void> {
  const aiService = new OptimizedAIService();
  
  try {
    // Use device-optimized configuration
    const config = ResourceOptimizer.adaptToDevice();
    
    // Make several requests to test caching and pooling
    const responses = await Promise.all([
      aiService.prompt('What is machine learning?', config),
      aiService.prompt('Explain neural networks', config),
      aiService.prompt('What is machine learning?', config) // Should hit cache
    ]);
    
    console.log('Responses:', responses);
    
    // Get performance report
    const report = aiService.getPerformanceReport();
    console.log('Performance Report:', report);
    
  } catch (error) {
    console.error('Optimization demo error:', error);
  } finally {
    aiService.destroy();
  }
}

export {
  PerformanceMonitor,
  SessionPool,
  RequestBatcher,
  ResponseCache,
  OptimizedAIService,
  ResourceOptimizer,
  demonstrateOptimization
};