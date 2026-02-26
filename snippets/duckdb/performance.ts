// DuckDB Performance Optimization Patterns

import { DuckDBInstance } from '@duckdb/node-api';

// Performance-optimized configuration
const createPerformanceOptimizedInstance = async (dbPath: string) => {
  return await DuckDBInstance.create(dbPath, {
    threads: String(Math.max(1, Math.floor(require('os').cpus().length * 0.75))),
    max_memory: '75%', // Use 75% of available memory
    memory_limit: '75%',
    enable_object_cache: 'true',
    checkpoint_threshold: '64MB',
    wal_autocheckpoint: '1000',
    temp_directory: '/tmp/duckdb',
    default_order: 'ASC',
    preserve_insertion_order: 'false' // Better performance for analytical queries
  });
};

// Batch insertion for optimal performance
const optimizedBatchInsert = async (connection: any, tableName: string, data: any[]) => {
  const batchSize = 10000;
  const startTime = performance.now();
  
  // Use appender for best performance
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const appender = await connection.createAppender(tableName);
    
    for (const row of batch) {
      for (const value of Object.values(row)) {
        appender.appendValue(value);
      }
      appender.endRow();
    }
    
    await appender.flushAsync();
    await appender.close();
    
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, rows ${i + 1} to ${Math.min(i + batchSize, data.length)}`);
  }
  
  const endTime = performance.now();
  console.log(`Batch insert completed in ${endTime - startTime}ms`);
  console.log(`Rate: ${Math.round(data.length / ((endTime - startTime) / 1000))} rows/second`);
};

// Optimized table creation with proper types
const createOptimizedTable = async (connection: any) => {
  await connection.run(`
    CREATE TABLE analytics_optimized (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      event_timestamp TIMESTAMP NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      session_id VARCHAR(36) NOT NULL,
      properties JSON,
      amount DECIMAL(10,2),
      category_id SMALLINT,
      is_premium BOOLEAN DEFAULT FALSE
    )
  `);
  
  // Create indexes for common query patterns
  await connection.run('CREATE INDEX idx_user_id ON analytics_optimized(user_id)');
  await connection.run('CREATE INDEX idx_timestamp ON analytics_optimized(event_timestamp)');
  await connection.run('CREATE INDEX idx_event_type ON analytics_optimized(event_type)');
  await connection.run('CREATE INDEX idx_session_id ON analytics_optimized(session_id)');
  
  // Composite index for common filtering
  await connection.run('CREATE INDEX idx_user_timestamp ON analytics_optimized(user_id, event_timestamp)');
};

// Memory-efficient streaming for large datasets
const streamLargeDataset = async (connection: any, query: string) => {
  const startTime = performance.now();
  let processedRows = 0;
  let memoryUsage = process.memoryUsage();
  
  console.log('Initial memory usage:', memoryUsage);
  
  const stream = await connection.stream(query);
  
  try {
    while (true) {
      const chunk = await stream.readChunk(5000); // Read in chunks of 5000 rows
      
      if (chunk.length === 0) break;
      
      // Process chunk (example: aggregate calculations)
      const processedChunk = chunk.map(row => ({
        // Minimal processing to demonstrate
        id: row[0],
        processed: true,
        timestamp: new Date()
      }));
      
      processedRows += processedChunk.length;
      
      // Log progress and memory usage
      if (processedRows % 50000 === 0) {
        const currentMemory = process.memoryUsage();
        console.log(`Processed ${processedRows} rows`);
        console.log(`Memory delta: ${(currentMemory.heapUsed - memoryUsage.heapUsed) / 1024 / 1024} MB`);
        memoryUsage = currentMemory;
      }
      
      // Force garbage collection periodically
      if (global.gc && processedRows % 100000 === 0) {
        global.gc();
      }
    }
  } finally {
    await stream.close();
  }
  
  const endTime = performance.now();
  console.log(`Streaming completed: ${processedRows} rows in ${endTime - startTime}ms`);
  console.log(`Rate: ${Math.round(processedRows / ((endTime - startTime) / 1000))} rows/second`);
  
  return processedRows;
};

// Query optimization techniques
const optimizedQueries = async (connection: any) => {
  // Use column pruning - only select needed columns
  const efficientQuery1 = await connection.runAndReadAll(`
    SELECT 
      user_id,
      COUNT(*) as event_count,
      MAX(event_timestamp) as last_event
    FROM analytics_optimized
    WHERE event_timestamp >= '2024-01-01'
    GROUP BY user_id
    HAVING COUNT(*) > 10
    ORDER BY event_count DESC
    LIMIT 1000
  `);
  
  // Use EXISTS instead of IN for better performance
  const efficientQuery2 = await connection.runAndReadAll(`
    SELECT DISTINCT user_id
    FROM analytics_optimized a1
    WHERE EXISTS (
      SELECT 1 FROM analytics_optimized a2
      WHERE a2.user_id = a1.user_id 
      AND a2.event_type = 'purchase'
    )
  `);
  
  // Use window functions efficiently
  const efficientQuery3 = await connection.runAndReadAll(`
    SELECT 
      user_id,
      event_timestamp,
      amount,
      SUM(amount) OVER (
        PARTITION BY user_id 
        ORDER BY event_timestamp 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) as running_total,
      ROW_NUMBER() OVER (
        PARTITION BY user_id 
        ORDER BY event_timestamp DESC
      ) as recency_rank
    FROM analytics_optimized
    WHERE amount IS NOT NULL
    QUALIFY recency_rank <= 10  -- Only last 10 events per user
  `);
  
  return { query1: efficientQuery1, query2: efficientQuery2, query3: efficientQuery3 };
};

// Parallel processing with multiple connections
const parallelProcessing = async (dbPath: string, totalRows: number) => {
  const numWorkers = Math.min(4, require('os').cpus().length);
  const rowsPerWorker = Math.ceil(totalRows / numWorkers);
  
  const workers = Array.from({ length: numWorkers }, async (_, index) => {
    const instance = await createPerformanceOptimizedInstance(dbPath);
    const connection = await instance.connect();
    
    const startRow = index * rowsPerWorker;
    const endRow = Math.min(startRow + rowsPerWorker, totalRows);
    
    try {
      const result = await connection.runAndReadAll(`
        SELECT 
          user_id,
          COUNT(*) as events,
          AVG(amount) as avg_amount
        FROM analytics_optimized
        WHERE id BETWEEN ${startRow} AND ${endRow}
        GROUP BY user_id
      `);
      
      console.log(`Worker ${index + 1} processed rows ${startRow} to ${endRow}`);
      return result.getRows();
    } finally {
      await connection.close();
      await instance.close();
    }
  });
  
  const results = await Promise.all(workers);
  
  // Combine results
  const combined = results.flat();
  console.log(`Parallel processing completed: ${combined.length} aggregated results`);
  
  return combined;
};

// Connection pooling for high concurrency
class PerformanceOptimizedPool {
  private connections: any[] = [];
  private inUse: Set<any> = new Set();
  private maxSize: number;
  private dbPath: string;
  private config: any;

  constructor(dbPath: string, maxSize: number = 10) {
    this.dbPath = dbPath;
    this.maxSize = maxSize;
    this.config = {
      threads: '2', // Lower per connection, more connections
      max_memory: '500MB',
      enable_object_cache: 'true'
    };
  }

  async getConnection(): Promise<any> {
    // Return available connection
    const available = this.connections.find(conn => !this.inUse.has(conn));
    if (available) {
      this.inUse.add(available);
      return available;
    }

    // Create new connection if under limit
    if (this.connections.length < this.maxSize) {
      const instance = await DuckDBInstance.create(this.dbPath, this.config);
      const connection = await instance.connect();
      const connInfo = { instance, connection };
      
      this.connections.push(connInfo);
      this.inUse.add(connInfo);
      return connInfo;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      const checkAvailable = () => {
        const available = this.connections.find(conn => !this.inUse.has(conn));
        if (available) {
          this.inUse.add(available);
          resolve(available);
        } else {
          setTimeout(checkAvailable, 10);
        }
      };
      checkAvailable();
    });
  }

  releaseConnection(connInfo: any) {
    this.inUse.delete(connInfo);
  }

  async closeAll() {
    const closePromises = this.connections.map(async ({ connection, instance }) => {
      try {
        await connection.close();
        await instance.close();
      } catch (error) {
        console.warn('Error closing connection:', error);
      }
    });

    await Promise.allSettled(closePromises);
    this.connections = [];
    this.inUse.clear();
  }
}

// Performance monitoring utilities
const measureQueryPerformance = async (connection: any, name: string, query: string, params?: any[]) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  try {
    const result = await connection.runAndReadAll(query, params);
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    
    console.log(`Query "${name}" performance:`, {
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      rowCount: result.getRows().length,
      memoryDelta: `${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
      ratePerSecond: Math.round(result.getRows().length / ((endTime - startTime) / 1000))
    });
    
    return result;
  } catch (error: any) {
    const endTime = performance.now();
    console.error(`Query "${name}" failed after ${(endTime - startTime).toFixed(2)}ms:`, error.message);
    throw error;
  }
};

// Cache optimization
const implementQueryCache = () => {
  const cache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  
  return {
    async getCachedResult(key: string, queryFn: () => Promise<any>, ttlMs: number = 300000) {
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log(`Cache hit for key: ${key}`);
        return cached.result;
      }
      
      console.log(`Cache miss for key: ${key}, executing query`);
      const result = await queryFn();
      
      cache.set(key, {
        result,
        timestamp: Date.now(),
        ttl: ttlMs
      });
      
      return result;
    },
    
    clearCache() {
      cache.clear();
    },
    
    getCacheStats() {
      return {
        size: cache.size,
        keys: Array.from(cache.keys())
      };
    }
  };
};

export {
  createPerformanceOptimizedInstance,
  optimizedBatchInsert,
  createOptimizedTable,
  streamLargeDataset,
  optimizedQueries,
  parallelProcessing,
  PerformanceOptimizedPool,
  measureQueryPerformance,
  implementQueryCache
};