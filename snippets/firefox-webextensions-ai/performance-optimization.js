// Performance Optimization for WebExtensions AI

// 1. Engine Pooling and Reuse
class AIEnginePool {
  constructor() {
    this.engines = new Map();
    this.engineUsage = new Map();
    this.maxEngines = 3; // Firefox limitation
    this.creationQueue = [];
  }

  async getEngine(taskName, config = {}) {
    const key = this.generateEngineKey(taskName, config);
    
    if (this.engines.has(key)) {
      this.updateUsage(key);
      return this.engines.get(key);
    }
    
    // Check if we can create a new engine
    if (this.engines.size >= this.maxEngines) {
      await this.evictLeastUsedEngine();
    }
    
    const engine = await this.createEngine(taskName, config);
    this.engines.set(key, engine);
    this.engineUsage.set(key, { count: 1, lastUsed: Date.now() });
    
    return engine;
  }

  generateEngineKey(taskName, config) {
    return `${taskName}_${config.modelHub || 'huggingface'}_${config.modelId || 'default'}`;
  }

  async createEngine(taskName, config) {
    const engineConfig = {
      modelHub: config.modelHub || "huggingface",
      taskName: taskName,
      device: config.device || "wasm",
      quantization: config.quantization || "int8",
      ...config
    };
    
    return await browser.trial.ml.createEngine(engineConfig);
  }

  updateUsage(key) {
    const usage = this.engineUsage.get(key);
    if (usage) {
      usage.count++;
      usage.lastUsed = Date.now();
    }
  }

  async evictLeastUsedEngine() {
    let leastUsedKey = null;
    let leastUsedTime = Infinity;
    
    for (const [key, usage] of this.engineUsage.entries()) {
      if (usage.lastUsed < leastUsedTime) {
        leastUsedTime = usage.lastUsed;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.engines.delete(leastUsedKey);
      this.engineUsage.delete(leastUsedKey);
      console.log(`Evicted engine: ${leastUsedKey}`);
    }
  }

  clearAll() {
    this.engines.clear();
    this.engineUsage.clear();
  }

  getStats() {
    return {
      activeEngines: this.engines.size,
      maxEngines: this.maxEngines,
      usage: Array.from(this.engineUsage.entries())
    };
  }
}

// 2. Input Preprocessing and Optimization
class InputOptimizer {
  constructor() {
    this.maxInputLengths = {
      summarization: 4000,
      'text-classification': 2000,
      translation: 3000,
      'text-generation': 1500,
      'question-answering': 2500
    };
  }

  optimizeInput(taskName, input) {
    const maxLength = this.maxInputLengths[taskName] || 2000;
    
    if (typeof input === 'string') {
      return this.optimizeText(input, maxLength);
    } else if (Array.isArray(input)) {
      return input.map(item => this.optimizeText(item, maxLength));
    } else if (typeof input === 'object') {
      return this.optimizeObject(input, maxLength);
    }
    
    return input;
  }

  optimizeText(text, maxLength) {
    if (text.length <= maxLength) return text;
    
    // Smart truncation: try to break at sentence boundaries
    const sentences = text.split(/[.!?]+\s+/);
    let result = '';
    
    for (const sentence of sentences) {
      if (result.length + sentence.length + 1 <= maxLength) {
        result += sentence + '. ';
      } else {
        break;
      }
    }
    
    // If no complete sentences fit, truncate at word boundary
    if (result.length === 0) {
      const words = text.split(' ');
      result = words.slice(0, Math.floor(maxLength / 10)).join(' ');
    }
    
    return result.trim();
  }

  optimizeObject(obj, maxLength) {
    const result = { ...obj };
    
    if (result.context) {
      result.context = this.optimizeText(result.context, maxLength * 0.7);
    }
    if (result.question) {
      result.question = this.optimizeText(result.question, maxLength * 0.3);
    }
    
    return result;
  }

  // Batch processing for multiple inputs
  batchOptimize(taskName, inputs) {
    return inputs.map(input => this.optimizeInput(taskName, input));
  }
}

// 3. Result Caching System
class ResultCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100;
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
  }

  generateCacheKey(taskName, input) {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    return `${taskName}_${this.hashString(inputStr)}`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  get(taskName, input) {
    const key = this.generateCacheKey(taskName, input);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  set(taskName, input, result) {
    const key = this.generateCacheKey(taskName, input);
    
    // Evict oldest if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      result: result,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.calculateHitRate()
    };
  }

  calculateHitRate() {
    // This would require tracking hits/misses
    return 0; // Placeholder
  }
}

// 4. Optimized AI Service
class OptimizedAIService {
  constructor() {
    this.enginePool = new AIEnginePool();
    this.inputOptimizer = new InputOptimizer();
    this.resultCache = new ResultCache();
    this.requestQueue = [];
    this.isProcessing = false;
  }

  async performTask(taskName, input, config = {}) {
    // Check cache first
    const cachedResult = this.resultCache.get(taskName, input);
    if (cachedResult && !config.bypassCache) {
      console.log('Cache hit for', taskName);
      return cachedResult;
    }

    // Optimize input
    const optimizedInput = this.inputOptimizer.optimizeInput(taskName, input);
    
    // Get engine from pool
    const engine = await this.enginePool.getEngine(taskName, config);
    
    // Perform inference
    const result = await browser.trial.ml.runEngine({
      args: [optimizedInput]
    });
    
    // Cache result
    this.resultCache.set(taskName, input, result);
    
    return result;
  }

  // Batch processing with queue management
  async processBatch(tasks) {
    const results = [];
    
    for (const task of tasks) {
      try {
        const result = await this.performTask(task.taskName, task.input, task.config);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Preload common engines
  async preloadEngines() {
    const commonTasks = [
      { taskName: 'summarization', config: { device: 'wasm' } },
      { taskName: 'text-classification', config: { device: 'wasm' } }
    ];
    
    for (const task of commonTasks) {
      try {
        await this.enginePool.getEngine(task.taskName, task.config);
        console.log(`Preloaded engine for ${task.taskName}`);
      } catch (error) {
        console.warn(`Failed to preload ${task.taskName}:`, error);
      }
    }
  }

  getPerformanceStats() {
    return {
      enginePool: this.enginePool.getStats(),
      cache: this.resultCache.getStats(),
      queueSize: this.requestQueue.length
    };
  }
}

// 5. Memory Management
class MemoryManager {
  constructor() {
    this.memoryThreshold = 512 * 1024 * 1024; // 512MB
    this.checkInterval = 30000; // 30 seconds
    this.monitoringEnabled = false;
  }

  startMonitoring() {
    if (this.monitoringEnabled) return;
    
    this.monitoringEnabled = true;
    this.monitorInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkInterval);
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitoringEnabled = false;
    }
  }

  async checkMemoryUsage() {
    try {
      if (performance.memory) {
        const usage = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        
        console.log(`Memory usage: ${Math.round(usage / 1024 / 1024)}MB / ${Math.round(limit / 1024 / 1024)}MB`);
        
        // If memory usage is high, clear caches
        if (usage > this.memoryThreshold) {
          await this.freeMemory();
        }
      }
    } catch (error) {
      console.warn('Memory monitoring failed:', error);
    }
  }

  async freeMemory() {
    console.log('High memory usage detected, freeing memory...');
    
    // Clear AI caches
    if (window.aiService) {
      window.aiService.resultCache.clear();
      window.aiService.enginePool.clearAll();
    }
    
    // Clear browser caches if possible
    try {
      await browser.trial.ml.deleteCachedModels();
    } catch (error) {
      console.warn('Failed to clear model cache:', error);
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }
}

// 6. Performance Monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      taskTimes: new Map(),
      errorRates: new Map(),
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  startTask(taskName) {
    const startTime = performance.now();
    return {
      taskName,
      startTime,
      end: () => {
        const duration = performance.now() - startTime;
        this.recordTaskTime(taskName, duration);
        return duration;
      }
    };
  }

  recordTaskTime(taskName, duration) {
    if (!this.metrics.taskTimes.has(taskName)) {
      this.metrics.taskTimes.set(taskName, []);
    }
    
    const times = this.metrics.taskTimes.get(taskName);
    times.push(duration);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
  }

  recordError(taskName) {
    const current = this.metrics.errorRates.get(taskName) || 0;
    this.metrics.errorRates.set(taskName, current + 1);
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  getMetrics() {
    const stats = {};
    
    // Calculate average times
    for (const [task, times] of this.metrics.taskTimes.entries()) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      stats[task] = {
        averageTime: Math.round(avg),
        samples: times.length,
        min: Math.min(...times),
        max: Math.max(...times)
      };
    }
    
    // Calculate cache hit rate
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 
      ? (this.metrics.cacheHits / totalCacheRequests) * 100 
      : 0;
    
    return {
      taskStats: stats,
      cacheHitRate: Math.round(cacheHitRate),
      errorRates: Object.fromEntries(this.metrics.errorRates)
    };
  }
}

// 7. Complete Optimized AI Extension
class OptimizedAIExtension {
  constructor() {
    this.aiService = new OptimizedAIService();
    this.memoryManager = new MemoryManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Start monitoring
      this.memoryManager.startMonitoring();
      
      // Preload common engines
      await this.aiService.preloadEngines();
      
      this.isInitialized = true;
      console.log('Optimized AI Extension initialized');
    } catch (error) {
      console.error('Initialization failed:', error);
      throw error;
    }
  }

  async performOptimizedTask(taskName, input, config = {}) {
    if (!this.isInitialized) await this.initialize();
    
    const monitor = this.performanceMonitor.startTask(taskName);
    
    try {
      const result = await this.aiService.performTask(taskName, input, config);
      monitor.end();
      return result;
    } catch (error) {
      this.performanceMonitor.recordError(taskName);
      monitor.end();
      throw error;
    }
  }

  getPerformanceReport() {
    return {
      ai: this.aiService.getPerformanceStats(),
      monitor: this.performanceMonitor.getMetrics()
    };
  }

  async cleanup() {
    this.memoryManager.stopMonitoring();
    this.aiService.resultCache.clear();
    this.aiService.enginePool.clearAll();
    
    try {
      await browser.trial.ml.deleteCachedModels();
    } catch (error) {
      console.warn('Failed to clear models during cleanup:', error);
    }
  }
}

// Initialize global instances
const globalAIService = new OptimizedAIService();
const globalMemoryManager = new MemoryManager();
const globalPerformanceMonitor = new PerformanceMonitor();

// Export classes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AIEnginePool,
    InputOptimizer,
    ResultCache,
    OptimizedAIService,
    MemoryManager,
    PerformanceMonitor,
    OptimizedAIExtension,
    globalAIService,
    globalMemoryManager,
    globalPerformanceMonitor
  };
}