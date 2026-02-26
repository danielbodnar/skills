// Bun Performance Optimization Examples

// 1. Memory Management and Object Pooling
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;
  
  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }
  
  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }
  
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }
  
  size(): number {
    return this.pool.length;
  }
}

// Usage example
const bufferPool = new ObjectPool(
  () => new ArrayBuffer(1024),
  (buffer) => new Uint8Array(buffer).fill(0),
  50
);

// 2. Efficient String Operations
class StringBuilder {
  private chunks: string[] = [];
  private length = 0;
  
  append(str: string): this {
    this.chunks.push(str);
    this.length += str.length;
    return this;
  }
  
  toString(): string {
    const result = this.chunks.join("");
    this.clear();
    return result;
  }
  
  clear(): void {
    this.chunks.length = 0;
    this.length = 0;
  }
  
  getLength(): number {
    return this.length;
  }
}

// Fast string operations
function fastStringConcat(strings: string[]): string {
  // Bun optimizes array.join() better than string concatenation
  return strings.join("");
}

function fastStringReplace(str: string, search: string, replace: string): string {
  // Use split/join for simple replacements (faster than regex for simple cases)
  return str.split(search).join(replace);
}

// 3. Optimized File Operations
async function readFileChunked(filePath: string, chunkSize = 64 * 1024): Promise<void> {
  const file = Bun.file(filePath);
  const stream = file.stream();
  const reader = stream.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Process chunk without loading entire file into memory
      await processChunk(value);
    }
  } finally {
    reader.releaseLock();
  }
}

async function processChunk(chunk: Uint8Array): Promise<void> {
  // Process data in chunks to avoid memory spikes
  console.log(`Processing chunk of ${chunk.length} bytes`);
}

// Efficient file writing with streaming
async function writeFileStream(filePath: string, data: AsyncIterable<Uint8Array>): Promise<void> {
  const writer = Bun.file(filePath).writer();
  
  try {
    for await (const chunk of data) {
      await writer.write(chunk);
    }
  } finally {
    await writer.end();
  }
}

// 4. Database Connection Optimization
class OptimizedDatabase {
  private connections: any[] = [];
  private busyConnections = new Set<any>();
  private maxConnections: number;
  private preparedStatements = new Map<string, any>();
  
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
  }
  
  async getConnection(): Promise<any> {
    // Reuse existing idle connection
    const idle = this.connections.find(conn => !this.busyConnections.has(conn));
    if (idle) {
      this.busyConnections.add(idle);
      return idle;
    }
    
    // Create new connection if under limit
    if (this.connections.length < this.maxConnections) {
      const { Database } = await import("bun:sqlite");
      const conn = new Database(":memory:");
      this.connections.push(conn);
      this.busyConnections.add(conn);
      return conn;
    }
    
    // Wait for available connection
    return new Promise((resolve) => {
      const checkConnection = () => {
        const available = this.connections.find(conn => !this.busyConnections.has(conn));
        if (available) {
          this.busyConnections.add(available);
          resolve(available);
        } else {
          setTimeout(checkConnection, 1);
        }
      };
      checkConnection();
    });
  }
  
  releaseConnection(connection: any): void {
    this.busyConnections.delete(connection);
  }
  
  // Prepare statements once and reuse
  prepare(sql: string): any {
    if (!this.preparedStatements.has(sql)) {
      // This would be database-specific
      // this.preparedStatements.set(sql, connection.prepare(sql));
    }
    return this.preparedStatements.get(sql);
  }
}

// 5. HTTP Response Caching
class ResponseCache {
  private cache = new Map<string, { response: Response; expires: number }>();
  private maxSize = 1000;
  
  private generateKey(req: Request): string {
    const url = new URL(req.url);
    return `${req.method}:${url.pathname}${url.search}`;
  }
  
  get(req: Request): Response | null {
    const key = this.generateKey(req);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    
    // Clone response to avoid consuming the stream
    return cached.response.clone();
  }
  
  set(req: Request, response: Response, ttlMs = 300000): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expires - b[1].expires);
      
      const toRemove = Math.floor(this.maxSize * 0.1); // Remove 10%
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
    
    const key = this.generateKey(req);
    this.cache.set(key, {
      response: response.clone(),
      expires: Date.now() + ttlMs,
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// 6. Optimized JSON Operations
class JSONOptimizer {
  private stringifyCache = new Map<string, string>();
  private parseCache = new Map<string, any>();
  
  // Cache small, frequently used JSON objects
  stringify(obj: any, useCache = true): string {
    if (!useCache) return JSON.stringify(obj);
    
    const key = this.getObjectKey(obj);
    if (this.stringifyCache.has(key)) {
      return this.stringifyCache.get(key)!;
    }
    
    const result = JSON.stringify(obj);
    
    // Only cache small objects
    if (result.length < 1000) {
      this.stringifyCache.set(key, result);
    }
    
    return result;
  }
  
  parse(json: string, useCache = true): any {
    if (!useCache) return JSON.parse(json);
    
    if (this.parseCache.has(json)) {
      return this.parseCache.get(json);
    }
    
    const result = JSON.parse(json);
    
    // Only cache small objects
    if (json.length < 1000) {
      this.parseCache.set(json, result);
    }
    
    return result;
  }
  
  private getObjectKey(obj: any): string {
    // Simple hash for object key
    return JSON.stringify(obj);
  }
  
  clearCache(): void {
    this.stringifyCache.clear();
    this.parseCache.clear();
  }
}

// 7. Batch Operations
class BatchProcessor<T, R> {
  private batch: T[] = [];
  private batchSize: number;
  private flushInterval: number;
  private processingFn: (items: T[]) => Promise<R[]>;
  private timer?: Timer;
  private pendingPromises: Array<{ resolve: (value: R) => void; reject: (error: any) => void }> = [];
  
  constructor(
    processingFn: (items: T[]) => Promise<R[]>,
    batchSize = 100,
    flushInterval = 1000
  ) {
    this.processingFn = processingFn;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
  }
  
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item);
      this.pendingPromises.push({ resolve, reject });
      
      if (this.batch.length >= this.batchSize) {
        this.flush();
      } else {
        this.scheduleFlush();
      }
    });
  }
  
  private scheduleFlush(): void {
    if (this.timer) return;
    
    this.timer = setTimeout(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    
    const currentBatch = this.batch.splice(0);
    const currentPromises = this.pendingPromises.splice(0);
    
    try {
      const results = await this.processingFn(currentBatch);
      
      for (let i = 0; i < currentPromises.length; i++) {
        currentPromises[i].resolve(results[i]);
      }
    } catch (error) {
      for (const promise of currentPromises) {
        promise.reject(error);
      }
    }
  }
  
  async forceFlush(): Promise<void> {
    await this.flush();
  }
}

// 8. Memory Monitoring
class MemoryMonitor {
  private maxHeapUsed = 0;
  private samples: number[] = [];
  private sampleInterval: number;
  private timer?: Timer;
  
  constructor(sampleInterval = 5000) {
    this.sampleInterval = sampleInterval;
  }
  
  start(): void {
    this.timer = setInterval(() => {
      this.takeSample();
    }, this.sampleInterval);
  }
  
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
  
  private takeSample(): void {
    const usage = process.memoryUsage();
    this.samples.push(usage.heapUsed);
    
    if (usage.heapUsed > this.maxHeapUsed) {
      this.maxHeapUsed = usage.heapUsed;
    }
    
    // Keep only last 100 samples
    if (this.samples.length > 100) {
      this.samples.shift();
    }
    
    // Warn if memory usage is high
    if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn(`High memory usage: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
    }
  }
  
  getStats() {
    const current = process.memoryUsage();
    const avg = this.samples.length > 0 
      ? this.samples.reduce((a, b) => a + b, 0) / this.samples.length 
      : 0;
    
    return {
      current: current.heapUsed,
      max: this.maxHeapUsed,
      average: avg,
      samples: this.samples.length,
    };
  }
  
  forceGC(): void {
    if (global.gc) {
      global.gc();
    } else {
      console.warn("Garbage collection not exposed. Run with --expose-gc");
    }
  }
}

// 9. Performance Profiler
class PerformanceProfiler {
  private measurements = new Map<string, number[]>();
  
  time<T>(name: string, fn: () => T): T;
  time<T>(name: string, fn: () => Promise<T>): Promise<T>;
  time<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        this.recordTime(name, performance.now() - start);
      });
    } else {
      this.recordTime(name, performance.now() - start);
      return result;
    }
  }
  
  private recordTime(name: string, duration: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    
    const times = this.measurements.get(name)!;
    times.push(duration);
    
    // Keep only last 1000 measurements
    if (times.length > 1000) {
      times.shift();
    }
  }
  
  getStats(name: string) {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return null;
    
    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    
    return {
      count: times.length,
      avg,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
  
  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name] of this.measurements) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }
  
  clear(): void {
    this.measurements.clear();
  }
}

// 10. Request Processing Optimization
async function optimizedRequestHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Early return for preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
  
  // Use streaming for large requests
  if (req.headers.get("content-length")) {
    const contentLength = parseInt(req.headers.get("content-length")!);
    if (contentLength > 1024 * 1024) { // 1MB
      return await handleLargeRequest(req);
    }
  }
  
  // Cache static resources
  if (url.pathname.startsWith("/static/")) {
    return await handleStaticResource(req);
  }
  
  // Regular request processing
  return new Response("OK");
}

async function handleLargeRequest(req: Request): Promise<Response> {
  // Process request body in chunks
  const reader = req.body?.getReader();
  if (!reader) return new Response("No body", { status: 400 });
  
  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      totalSize += value.length;
      
      // Prevent memory exhaustion
      if (totalSize > 10 * 1024 * 1024) { // 10MB limit
        throw new Error("Request too large");
      }
    }
    
    // Process the complete data
    const data = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    
    return Response.json({ size: totalSize });
  } finally {
    reader.releaseLock();
  }
}

async function handleStaticResource(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const filePath = `.${url.pathname}`;
  
  try {
    const file = Bun.file(filePath);
    const exists = await file.exists();
    
    if (!exists) {
      return new Response("Not Found", { status: 404 });
    }
    
    // Set appropriate cache headers
    return new Response(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000", // 1 year
        "ETag": `"${await file.lastModified()}"`,
      },
    });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Usage examples
const responseCache = new ResponseCache();
const jsonOptimizer = new JSONOptimizer();
const memoryMonitor = new MemoryMonitor();
const profiler = new PerformanceProfiler();

// Start monitoring
memoryMonitor.start();

// Example batch processor for database operations
const dbBatchProcessor = new BatchProcessor(
  async (queries: string[]) => {
    // Process multiple queries at once
    console.log(`Processing batch of ${queries.length} queries`);
    return queries.map(() => ({ success: true }));
  },
  50, // batch size
  1000 // flush interval
);

export {
  ObjectPool,
  StringBuilder,
  fastStringConcat,
  fastStringReplace,
  readFileChunked,
  writeFileStream,
  OptimizedDatabase,
  ResponseCache,
  JSONOptimizer,
  BatchProcessor,
  MemoryMonitor,
  PerformanceProfiler,
  optimizedRequestHandler,
  handleLargeRequest,
  handleStaticResource,
  responseCache,
  jsonOptimizer,
  memoryMonitor,
  profiler,
  dbBatchProcessor,
  bufferPool,
};