// Typesense Performance Optimization Examples
import { Client } from 'typesense';

const client = new Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || 'localhost',
    port: Number(process.env.TYPESENSE_PORT) || 8108,
    protocol: 'http'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 5, // Optimized for performance
  retryIntervalSeconds: 0.5,
  numRetries: 2
});

// High-performance collection schema with optimized HNSW parameters
const highPerformanceSchema = {
  name: 'high_performance_docs',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'title', type: 'string' as const },
    { name: 'content', type: 'string' as const },
    { name: 'category', type: 'string' as const, facet: true },
    { name: 'date_created', type: 'int64' as const, sort: true },
    { name: 'priority', type: 'int32' as const, sort: true },
    
    // Optimized embedding field for high performance
    { 
      name: 'content_embedding', 
      type: 'float[]' as const, 
      embed: {
        from: ['title', 'content'],
        model_config: {
          model_name: 'ts/e5-small' // Fastest built-in model
        }
      },
      hnsw: {
        ef_construction: 200, // Balance between quality and speed
        M: 16 // Lower M for faster search
      }
    }
  ],
  default_sorting_field: 'priority'
};

// Batch operations for high-throughput indexing
class HighPerformanceBatchIndexer {
  private batchSize: number;
  private maxConcurrentBatches: number;
  private collection: string;

  constructor(collection: string, batchSize = 1000, maxConcurrentBatches = 5) {
    this.collection = collection;
    this.batchSize = batchSize;
    this.maxConcurrentBatches = maxConcurrentBatches;
  }

  async indexDocumentsBatch(documents: any[]): Promise<void> {
    const startTime = Date.now();
    const totalDocs = documents.length;
    
    console.log(`Starting batch indexing of ${totalDocs} documents`);

    // Split documents into batches
    const batches = [];
    for (let i = 0; i < documents.length; i += this.batchSize) {
      batches.push(documents.slice(i, i + this.batchSize));
    }

    // Process batches concurrently with limit
    const results = [];
    for (let i = 0; i < batches.length; i += this.maxConcurrentBatches) {
      const concurrentBatches = batches.slice(i, i + this.maxConcurrentBatches);
      
      const batchPromises = concurrentBatches.map(async (batch, index) => {
        const batchStartTime = Date.now();
        
        try {
          const result = await client.collections(this.collection)
            .documents()
            .import(batch, { action: 'upsert' });
          
          const batchTime = Date.now() - batchStartTime;
          console.log(`Batch ${i + index + 1} completed: ${batch.length} docs in ${batchTime}ms`);
          
          return { success: true, count: batch.length, time: batchTime, result };
        } catch (error) {
          console.error(`Batch ${i + index + 1} failed:`, error);
          return { success: false, error, count: batch.length };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const totalTime = Date.now() - startTime;
    const successfulDocs = results.filter(r => r.success).reduce((sum, r) => sum + r.count, 0);
    const failedDocs = totalDocs - successfulDocs;

    console.log(`Batch indexing completed: ${successfulDocs} successful, ${failedDocs} failed in ${totalTime}ms`);
    console.log(`Throughput: ${Math.round(successfulDocs / (totalTime / 1000))} docs/sec`);
  }
}

// Optimized search with caching and performance monitoring
class OptimizedSearch {
  private cache: Map<string, { result: any; timestamp: number }> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor(private collection: string) {}

  async search(query: string, options: any = {}): Promise<any> {
    const cacheKey = this.generateCacheKey(query, options);
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log('Cache hit for query:', query.substring(0, 50));
      return cached;
    }

    const startTime = Date.now();
    
    try {
      // Optimized search parameters
      const searchParams = {
        q: query,
        query_by: options.query_by || 'title,content',
        // Use vector search for semantic queries
        ...(options.semantic && {
          query_by: 'content_embedding',
          exclude_fields: 'content_embedding'
        }),
        filter_by: options.filter_by || '',
        facet_by: options.facet_by || '',
        sort_by: options.sort_by || '_text_match:desc',
        per_page: Math.min(options.per_page || 20, 100), // Limit page size
        page: options.page || 1,
        include_fields: options.include_fields || '',
        exclude_fields: options.exclude_fields || '',
        // Performance optimizations
        use_cache: true,
        cache_ttl: 300, // 5 minutes
        search_cutoff_ms: options.timeout || 3000, // 3 second timeout
        exhaustive_search: false, // Use approximate search for speed
        typo_tokens_threshold: 50, // Limit typo correction for performance
        drop_tokens_threshold: 10
      };

      const result = await client.collections(this.collection)
        .documents()
        .search(searchParams);

      const searchTime = Date.now() - startTime;
      
      // Add performance metadata
      const enhancedResult = {
        ...result,
        performance: {
          search_time_ms: searchTime,
          cached: false,
          total_docs_searched: result.out_of
        }
      };

      // Cache the result
      this.setCachedResult(cacheKey, enhancedResult);
      
      console.log(`Search completed in ${searchTime}ms for: ${query.substring(0, 50)}`);
      return enhancedResult;

    } catch (error) {
      const searchTime = Date.now() - startTime;
      console.error(`Search failed after ${searchTime}ms:`, error);
      throw error;
    }
  }

  // Multi-search for parallel queries
  async multiSearch(queries: Array<{ query: string; options?: any }>): Promise<any> {
    const startTime = Date.now();
    
    const searches = queries.map((q, index) => ({
      collection: this.collection,
      q: q.query,
      query_by: q.options?.query_by || 'title,content',
      filter_by: q.options?.filter_by || '',
      per_page: q.options?.per_page || 10,
      preset: `search_${index}`
    }));

    try {
      const result = await client.multi_search({ searches });
      const totalTime = Date.now() - startTime;
      
      console.log(`Multi-search of ${queries.length} queries completed in ${totalTime}ms`);
      return {
        ...result,
        performance: {
          total_time_ms: totalTime,
          queries_count: queries.length,
          avg_time_per_query: totalTime / queries.length
        }
      };
    } catch (error) {
      console.error('Multi-search failed:', error);
      throw error;
    }
  }

  private generateCacheKey(query: string, options: any): string {
    return `${query}:${JSON.stringify(options)}`;
  }

  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { ...cached.result, performance: { ...cached.result.performance, cached: true } };
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  private setCachedResult(key: string, result: any): void {
    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
    console.log('Search cache cleared');
  }

  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size
    };
  }
}

// Connection pooling and load balancing
class TypesenseConnectionPool {
  private clients: Client[] = [];
  private currentIndex = 0;
  private healthyClients: Set<number> = new Set();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(nodes: Array<{ host: string; port: number; protocol: string }>, apiKey: string) {
    // Create multiple clients for load balancing
    this.clients = nodes.map(node => new Client({
      nodes: [node],
      apiKey,
      connectionTimeoutSeconds: 3,
      retryIntervalSeconds: 0.5,
      numRetries: 1
    }));

    // Initialize health tracking
    this.healthyClients = new Set(this.clients.map((_, i) => i));
    this.startHealthChecks();
  }

  // Round-robin load balancing
  getClient(): Client {
    const healthyClientIndices = Array.from(this.healthyClients);
    if (healthyClientIndices.length === 0) {
      throw new Error('No healthy Typesense clients available');
    }

    // Simple round-robin
    const healthyIndex = healthyClientIndices[this.currentIndex % healthyClientIndices.length];
    this.currentIndex = (this.currentIndex + 1) % healthyClientIndices.length;
    
    return this.clients[healthyIndex];
  }

  // Execute with automatic retry on different nodes
  async executeWithRetry<T>(operation: (client: Client) => Promise<T>): Promise<T> {
    const healthyClientIndices = Array.from(this.healthyClients);
    let lastError: any;

    for (const clientIndex of healthyClientIndices) {
      try {
        const client = this.clients[clientIndex];
        return await operation(client);
      } catch (error) {
        console.warn(`Operation failed on client ${clientIndex}:`, error);
        lastError = error;
        
        // Mark client as potentially unhealthy
        if (this.isConnectionError(error)) {
          this.healthyClients.delete(clientIndex);
        }
      }
    }

    throw new Error(`All clients failed. Last error: ${lastError?.message}`);
  }

  private async startHealthChecks(): Promise<void> {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkClientHealth();
    }, 30000); // Check every 30 seconds
  }

  private async checkClientHealth(): Promise<void> {
    const healthPromises = this.clients.map(async (client, index) => {
      try {
        await client.health.retrieve();
        this.healthyClients.add(index);
        return { index, healthy: true };
      } catch (error) {
        this.healthyClients.delete(index);
        return { index, healthy: false, error };
      }
    });

    const results = await Promise.all(healthPromises);
    const healthyCount = results.filter(r => r.healthy).length;
    
    console.log(`Health check: ${healthyCount}/${this.clients.length} clients healthy`);
  }

  private isConnectionError(error: any): boolean {
    return error.code === 'ECONNREFUSED' || 
           error.code === 'ETIMEDOUT' || 
           error.httpStatus >= 500;
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  getStats(): { totalClients: number; healthyClients: number } {
    return {
      totalClients: this.clients.length,
      healthyClients: this.healthyClients.size
    };
  }
}

// Performance monitoring and analytics
class PerformanceMonitor {
  private metrics: Map<string, Array<{ timestamp: number; duration: number; success: boolean }>> = new Map();

  recordOperation(operation: string, duration: number, success: boolean): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push({
      timestamp: Date.now(),
      duration,
      success
    });

    // Keep only last 1000 records per operation
    if (operationMetrics.length > 1000) {
      operationMetrics.shift();
    }
  }

  getOperationStats(operation: string, timeWindowMs = 300000): {
    avgDuration: number;
    successRate: number;
    totalOperations: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics) return null;

    const cutoffTime = Date.now() - timeWindowMs;
    const recentMetrics = operationMetrics.filter(m => m.timestamp > cutoffTime);
    
    if (recentMetrics.length === 0) return null;

    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successCount = recentMetrics.filter(m => m.success).length;

    return {
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      successRate: successCount / recentMetrics.length,
      totalOperations: recentMetrics.length,
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)]
    };
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getOperationStats(operation);
    }
    return stats;
  }
}

// Memory-efficient document streaming
async function* streamDocuments(collection: string, batchSize = 100): AsyncGenerator<any[], void, unknown> {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const result = await client.collections(collection)
        .documents()
        .search({
          q: '*',
          query_by: 'id',
          per_page: batchSize,
          page,
          include_fields: '*'
        });

      if (result.hits && result.hits.length > 0) {
        yield result.hits.map(hit => hit.document);
        page++;
        hasMore = result.hits.length === batchSize;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error streaming documents at page ${page}:`, error);
      throw error;
    }
  }
}

// Example: Complete performance optimization setup
async function performanceOptimizationExample() {
  console.log('=== Performance Optimization Example ===');

  // 1. Setup high-performance indexer
  const indexer = new HighPerformanceBatchIndexer('high_performance_docs', 500, 3);
  
  // 2. Create optimized search instance
  const optimizedSearch = new OptimizedSearch('high_performance_docs');
  
  // 3. Setup connection pool
  const connectionPool = new TypesenseConnectionPool([
    { host: 'localhost', port: 8108, protocol: 'http' },
    { host: 'localhost', port: 8109, protocol: 'http' } // Additional node for load balancing
  ], 'xyz');
  
  // 4. Setup performance monitoring
  const monitor = new PerformanceMonitor();

  // 5. Create collection with optimized schema
  try {
    await client.collections().create(highPerformanceSchema);
    console.log('High-performance collection created');
  } catch (error: any) {
    if (error.httpStatus === 409) {
      console.log('Collection already exists');
    } else {
      throw error;
    }
  }

  // 6. Benchmark batch indexing
  const sampleDocs = Array.from({ length: 5000 }, (_, i) => ({
    id: `doc_${i}`,
    title: `Document ${i}`,
    content: `This is the content of document ${i} with some sample text for indexing and search testing.`,
    category: `category_${i % 10}`,
    date_created: Date.now() - (i * 1000),
    priority: Math.floor(Math.random() * 100)
  }));

  console.log('\n--- Batch Indexing Performance ---');
  const indexStartTime = Date.now();
  await indexer.indexDocumentsBatch(sampleDocs);
  const indexTime = Date.now() - indexStartTime;
  monitor.recordOperation('batch_index', indexTime, true);

  // 7. Benchmark search performance
  console.log('\n--- Search Performance ---');
  const searchQueries = [
    'document content',
    'sample text',
    'testing indexing',
    'category search',
    'performance benchmark'
  ];

  for (const query of searchQueries) {
    const searchStart = Date.now();
    try {
      const result = await optimizedSearch.search(query, { per_page: 20 });
      const searchTime = Date.now() - searchStart;
      monitor.recordOperation('search', searchTime, true);
      console.log(`Query "${query}": ${result.found} results in ${searchTime}ms`);
    } catch (error) {
      const searchTime = Date.now() - searchStart;
      monitor.recordOperation('search', searchTime, false);
      console.error(`Query "${query}" failed:`, error);
    }
  }

  // 8. Test multi-search performance
  console.log('\n--- Multi-Search Performance ---');
  const multiSearchStart = Date.now();
  const multiResult = await optimizedSearch.multiSearch(
    searchQueries.map(q => ({ query: q, options: { per_page: 10 } }))
  );
  const multiSearchTime = Date.now() - multiSearchStart;
  monitor.recordOperation('multi_search', multiSearchTime, true);
  console.log(`Multi-search: ${searchQueries.length} queries in ${multiSearchTime}ms`);

  // 9. Test semantic search performance
  console.log('\n--- Semantic Search Performance ---');
  const semanticStart = Date.now();
  const semanticResult = await optimizedSearch.search('document about testing', { 
    semantic: true, 
    per_page: 10 
  });
  const semanticTime = Date.now() - semanticStart;
  monitor.recordOperation('semantic_search', semanticTime, true);
  console.log(`Semantic search: ${semanticResult.found} results in ${semanticTime}ms`);

  // 10. Display performance statistics
  console.log('\n--- Performance Statistics ---');
  const allStats = monitor.getAllStats();
  Object.entries(allStats).forEach(([operation, stats]) => {
    if (stats) {
      console.log(`${operation}:`);
      console.log(`  Avg Duration: ${stats.avgDuration.toFixed(2)}ms`);
      console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
      console.log(`  P95: ${stats.p95}ms, P99: ${stats.p99}ms`);
    }
  });

  // 11. Cache statistics
  const cacheStats = optimizedSearch.getCacheStats();
  console.log(`Cache size: ${cacheStats.size} entries`);

  // 12. Connection pool statistics
  const poolStats = connectionPool.getStats();
  console.log(`Connection pool: ${poolStats.healthyClients}/${poolStats.totalClients} healthy`);

  // Cleanup
  connectionPool.destroy();

  console.log('\n=== Performance Optimization Example Complete ===');
}

export {
  highPerformanceSchema,
  HighPerformanceBatchIndexer,
  OptimizedSearch,
  TypesenseConnectionPool,
  PerformanceMonitor,
  streamDocuments,
  performanceOptimizationExample
};