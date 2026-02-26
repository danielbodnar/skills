// Advanced Bun Patterns

// 1. Plugin System for Bun.build
import type { BunPlugin } from "bun";

const customPlugin: BunPlugin = {
  name: "custom-plugin",
  setup(build) {
    // Handle YAML files
    build.onLoad({ filter: /\.ya?ml$/ }, async (args) => {
      const text = await Bun.file(args.path).text();
      const yaml = await import("js-yaml");
      const parsed = yaml.load(text);
      
      return {
        contents: `export default ${JSON.stringify(parsed)}`,
        loader: "js",
      };
    });
    
    // Transform imports
    build.onResolve({ filter: /^virtual:/ }, (args) => {
      return {
        path: args.path,
        namespace: "virtual",
      };
    });
    
    build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
      return {
        contents: `export const virtualModule = "${args.path}";`,
        loader: "js",
      };
    });
  },
};

// 2. Advanced Server with Routing and Middleware
class Router {
  private routes: Map<string, Map<string, Function>> = new Map();
  
  addRoute(method: string, pattern: string, handler: Function) {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(pattern, handler);
  }
  
  get(pattern: string, handler: Function) {
    this.addRoute("GET", pattern, handler);
  }
  
  post(pattern: string, handler: Function) {
    this.addRoute("POST", pattern, handler);
  }
  
  put(pattern: string, handler: Function) {
    this.addRoute("PUT", pattern, handler);
  }
  
  delete(pattern: string, handler: Function) {
    this.addRoute("DELETE", pattern, handler);
  }
  
  match(method: string, path: string) {
    const methodRoutes = this.routes.get(method);
    if (!methodRoutes) return null;
    
    for (const [pattern, handler] of methodRoutes) {
      const params = this.matchPattern(pattern, path);
      if (params !== null) {
        return { handler, params };
      }
    }
    
    return null;
  }
  
  private matchPattern(pattern: string, path: string) {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");
    
    if (patternParts.length !== pathParts.length) return null;
    
    const params: Record<string, string> = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(":")) {
        params[patternPart.slice(1)] = pathPart;
      } else if (patternPart !== pathPart) {
        return null;
      }
    }
    
    return params;
  }
}

// 3. Database Connection Pool
class DatabasePool {
  private connections: any[] = [];
  private maxConnections: number;
  private currentConnections = 0;
  
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
  }
  
  async getConnection() {
    if (this.connections.length > 0) {
      return this.connections.pop();
    }
    
    if (this.currentConnections < this.maxConnections) {
      this.currentConnections++;
      const { Database } = await import("bun:sqlite");
      return new Database(":memory:");
    }
    
    // Wait for a connection to be available
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.connections.length > 0) {
          resolve(this.connections.pop());
        } else {
          setTimeout(checkConnection, 10);
        }
      };
      checkConnection();
    });
  }
  
  releaseConnection(connection: any) {
    this.connections.push(connection);
  }
  
  async withConnection<T>(callback: (db: any) => Promise<T>): Promise<T> {
    const connection = await this.getConnection();
    try {
      return await callback(connection);
    } finally {
      this.releaseConnection(connection);
    }
  }
}

// 4. Advanced WebSocket Manager with Rooms
class WebSocketRoomManager {
  private rooms: Map<string, Set<any>> = new Map();
  private connectionRooms: Map<any, Set<string>> = new Map();
  
  joinRoom(ws: any, room: string) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    
    this.rooms.get(room)!.add(ws);
    
    if (!this.connectionRooms.has(ws)) {
      this.connectionRooms.set(ws, new Set());
    }
    
    this.connectionRooms.get(ws)!.add(room);
    ws.subscribe(room);
  }
  
  leaveRoom(ws: any, room: string) {
    this.rooms.get(room)?.delete(ws);
    this.connectionRooms.get(ws)?.delete(room);
    ws.unsubscribe(room);
  }
  
  broadcastToRoom(room: string, message: any) {
    const connections = this.rooms.get(room);
    if (connections) {
      for (const ws of connections) {
        ws.send(JSON.stringify(message));
      }
    }
  }
  
  removeConnection(ws: any) {
    const rooms = this.connectionRooms.get(ws);
    if (rooms) {
      for (const room of rooms) {
        this.leaveRoom(ws, room);
      }
    }
    this.connectionRooms.delete(ws);
  }
  
  getRoomSize(room: string): number {
    return this.rooms.get(room)?.size || 0;
  }
  
  getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}

// 5. Cache Layer with TTL
class CacheManager {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  private defaultTTL: number;
  
  constructor(defaultTTL = 60000) { // 1 minute default
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries every 30 seconds
    setInterval(() => this.cleanup(), 30000);
  }
  
  set(key: string, value: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expires });
  }
  
  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    this.cleanup();
    return this.cache.size;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// 6. Event Emitter for Pub/Sub
class EventEmitter {
  private events: Map<string, Function[]> = new Map();
  
  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }
  
  once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    this.on(event, onceWrapper);
  }
  
  off(event: string, listener: Function): void {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (!listeners || listeners.length === 0) {
      return false;
    }
    
    for (const listener of listeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
    
    return true;
  }
  
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
  
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }
}

// 7. Rate Limiter
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove requests outside the current window
    while (userRequests.length > 0 && userRequests[0] < windowStart) {
      userRequests.shift();
    }
    
    // Check if under the limit
    if (userRequests.length < this.maxRequests) {
      userRequests.push(now);
      return true;
    }
    
    return false;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(identifier) || [];
    
    const validRequests = userRequests.filter(time => time >= windowStart);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
  
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time >= windowStart);
      
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// 8. Background Job Queue
class JobQueue {
  private jobs: Array<{ id: string; data: any; retries: number }> = [];
  private processing = false;
  private maxRetries: number;
  
  constructor(maxRetries = 3) {
    this.maxRetries = maxRetries;
  }
  
  async add(jobData: any): Promise<string> {
    const id = crypto.randomUUID();
    this.jobs.push({ id, data: jobData, retries: 0 });
    
    if (!this.processing) {
      this.processJobs();
    }
    
    return id;
  }
  
  private async processJobs(): Promise<void> {
    this.processing = true;
    
    while (this.jobs.length > 0) {
      const job = this.jobs.shift()!;
      
      try {
        await this.executeJob(job.data);
        console.log(`Job ${job.id} completed successfully`);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        
        if (job.retries < this.maxRetries) {
          job.retries++;
          this.jobs.push(job);
          console.log(`Job ${job.id} will be retried (attempt ${job.retries})`);
        } else {
          console.error(`Job ${job.id} failed permanently after ${this.maxRetries} retries`);
        }
      }
      
      // Add a small delay between jobs
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.processing = false;
  }
  
  private async executeJob(data: any): Promise<void> {
    // Override this method in subclasses
    throw new Error("executeJob method must be implemented");
  }
  
  getQueueLength(): number {
    return this.jobs.length;
  }
  
  isProcessing(): boolean {
    return this.processing;
  }
}

// 9. Configuration Manager
class ConfigManager {
  private config: any = {};
  private watchers: Function[] = [];
  
  constructor(configPath?: string) {
    if (configPath) {
      this.loadFromFile(configPath);
    }
    this.loadFromEnv();
  }
  
  private async loadFromFile(path: string): Promise<void> {
    try {
      const content = await Bun.file(path).text();
      const parsed = path.endsWith('.json') 
        ? JSON.parse(content)
        : (await import('js-yaml')).load(content);
      
      this.merge(parsed);
    } catch (error) {
      console.warn(`Failed to load config from ${path}:`, error);
    }
  }
  
  private loadFromEnv(): void {
    const envConfig: any = {};
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('APP_')) {
        const configKey = key.slice(4).toLowerCase().replace(/_/g, '.');
        this.setNestedValue(envConfig, configKey, value);
      }
    }
    
    this.merge(envConfig);
  }
  
  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  get(key: string, defaultValue?: any): any {
    const parts = key.split('.');
    let current = this.config;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }
  
  set(key: string, value: any): void {
    this.setNestedValue(this.config, key, value);
    this.notifyWatchers();
  }
  
  merge(newConfig: any): void {
    this.config = { ...this.config, ...newConfig };
    this.notifyWatchers();
  }
  
  watch(callback: Function): void {
    this.watchers.push(callback);
  }
  
  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      try {
        watcher(this.config);
      } catch (error) {
        console.error('Error in config watcher:', error);
      }
    }
  }
}

// 10. Health Check System
class HealthChecker {
  private checks: Map<string, Function> = new Map();
  
  addCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.checks.set(name, checkFn);
  }
  
  async runChecks(): Promise<{ status: string; checks: Record<string, any> }> {
    const results: Record<string, any> = {};
    let overallStatus = 'healthy';
    
    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const start = Date.now();
        const result = await Promise.race([
          checkFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        const duration = Date.now() - start;
        
        results[name] = {
          status: result ? 'pass' : 'fail',
          duration: `${duration}ms`,
        };
        
        if (!result) {
          overallStatus = 'unhealthy';
        }
      } catch (error) {
        results[name] = {
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        overallStatus = 'unhealthy';
      }
    }
    
    return { status: overallStatus, checks: results };
  }
}

// Usage Examples
const router = new Router();
const dbPool = new DatabasePool();
const wsManager = new WebSocketRoomManager();
const cache = new CacheManager();
const events = new EventEmitter();
const rateLimiter = new RateLimiter();
const config = new ConfigManager('./config.yaml');
const healthChecker = new HealthChecker();

// Add health checks
healthChecker.addCheck('database', async () => {
  return await dbPool.withConnection(async (db) => {
    try {
      db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  });
});

healthChecker.addCheck('memory', async () => {
  const usage = process.memoryUsage();
  return usage.heapUsed < 500 * 1024 * 1024; // Less than 500MB
});

export {
  customPlugin,
  Router,
  DatabasePool,
  WebSocketRoomManager,
  CacheManager,
  EventEmitter,
  RateLimiter,
  JobQueue,
  ConfigManager,
  HealthChecker,
  router,
  dbPool,
  wsManager,
  cache,
  events,
  rateLimiter,
  config,
  healthChecker,
};