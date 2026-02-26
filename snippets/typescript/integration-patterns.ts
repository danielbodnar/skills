// TypeScript Integration Patterns
// Type-safe patterns for integrating with external systems

// ✅ API Client with Type Safety
interface ApiClient {
  get<T>(url: string): Promise<T>;
  post<T, U>(url: string, data: U): Promise<T>;
  put<T, U>(url: string, data: U): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

class TypedApiClient implements ApiClient {
  constructor(private baseUrl: string, private headers: Record<string, string> = {}) {}
  
  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'GET',
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async post<T, U>(url: string, data: U): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async put<T, U>(url: string, data: U): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async delete<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// ✅ Database Integration with Type Safety
interface Database {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface CreateUserInput {
  name: string;
  email: string;
}

class UserRepository {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<User | null> {
    const users = await this.db.query<User>(
      'SELECT id, name, email, created_at as createdAt FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }
  
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.db.query<User>(
      'SELECT id, name, email, created_at as createdAt FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }
  
  async create(input: CreateUserInput): Promise<User> {
    const id = crypto.randomUUID();
    const createdAt = new Date();
    
    await this.db.execute(
      'INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)',
      [id, input.name, input.email, createdAt]
    );
    
    return {
      id,
      name: input.name,
      email: input.email,
      createdAt,
    };
  }
  
  async update(id: string, input: Partial<CreateUserInput>): Promise<User | null> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      return null;
    }
    
    const updates: string[] = [];
    const params: unknown[] = [];
    
    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    
    if (input.email !== undefined) {
      updates.push('email = ?');
      params.push(input.email);
    }
    
    if (updates.length === 0) {
      return existingUser;
    }
    
    params.push(id);
    
    await this.db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    return this.findById(id);
  }
  
  async delete(id: string): Promise<boolean> {
    const result = await this.db.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return true; // In a real implementation, check affected rows
  }
}

// ✅ Event System with Type Safety
interface EventMap {
  'user.created': { user: User };
  'user.updated': { user: User; changes: Partial<CreateUserInput> };
  'user.deleted': { userId: string };
  'system.error': { error: Error; context: string };
}

type EventName = keyof EventMap;
type EventData<T extends EventName> = EventMap[T];
type EventHandler<T extends EventName> = (data: EventData<T>) => void | Promise<void>;

class TypedEventEmitter {
  private listeners: {
    [K in EventName]?: EventHandler<K>[];
  } = {};
  
  on<T extends EventName>(event: T, handler: EventHandler<T>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);
  }
  
  off<T extends EventName>(event: T, handler: EventHandler<T>): void {
    const handlers = this.listeners[event];
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  async emit<T extends EventName>(event: T, data: EventData<T>): Promise<void> {
    const handlers = this.listeners[event];
    if (handlers) {
      await Promise.all(handlers.map(handler => handler(data)));
    }
  }
  
  once<T extends EventName>(event: T, handler: EventHandler<T>): void {
    const onceHandler: EventHandler<T> = (data) => {
      this.off(event, onceHandler);
      return handler(data);
    };
    this.on(event, onceHandler);
  }
}

// ✅ Cache Interface with Type Safety
interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

class MemoryCache implements Cache {
  private cache = new Map<string, { value: unknown; expires: number }>();
  private defaultTtl = 60000; // 1 minute
  
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }
  
  async set<T>(key: string, value: T, ttl: number = this.defaultTtl): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// ✅ Service Layer with Dependency Injection
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

class ConsoleLogger implements Logger {
  info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[INFO] ${message}`, meta);
  }
  
  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, error, meta);
  }
  
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, meta);
  }
  
  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${message}`, meta);
  }
}

interface UserServiceDependencies {
  userRepository: UserRepository;
  eventEmitter: TypedEventEmitter;
  cache: Cache;
  logger: Logger;
}

class UserService {
  constructor(private deps: UserServiceDependencies) {}
  
  async createUser(input: CreateUserInput): Promise<User> {
    this.deps.logger.info('Creating user', { email: input.email });
    
    // Check if user already exists
    const existingUser = await this.deps.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Create user
    const user = await this.deps.userRepository.create(input);
    
    // Cache user
    await this.deps.cache.set(`user:${user.id}`, user, 300000); // 5 minutes
    
    // Emit event
    await this.deps.eventEmitter.emit('user.created', { user });
    
    this.deps.logger.info('User created successfully', { userId: user.id });
    
    return user;
  }
  
  async getUserById(id: string): Promise<User | null> {
    // Try cache first
    const cachedUser = await this.deps.cache.get<User>(`user:${id}`);
    if (cachedUser) {
      this.deps.logger.debug('User found in cache', { userId: id });
      return cachedUser;
    }
    
    // Fetch from database
    const user = await this.deps.userRepository.findById(id);
    if (user) {
      await this.deps.cache.set(`user:${id}`, user, 300000);
      this.deps.logger.debug('User fetched from database', { userId: id });
    }
    
    return user;
  }
  
  async updateUser(id: string, input: Partial<CreateUserInput>): Promise<User | null> {
    this.deps.logger.info('Updating user', { userId: id });
    
    const originalUser = await this.getUserById(id);
    if (!originalUser) {
      return null;
    }
    
    const updatedUser = await this.deps.userRepository.update(id, input);
    if (updatedUser) {
      // Update cache
      await this.deps.cache.set(`user:${id}`, updatedUser, 300000);
      
      // Emit event
      await this.deps.eventEmitter.emit('user.updated', {
        user: updatedUser,
        changes: input,
      });
      
      this.deps.logger.info('User updated successfully', { userId: id });
    }
    
    return updatedUser;
  }
  
  async deleteUser(id: string): Promise<boolean> {
    this.deps.logger.info('Deleting user', { userId: id });
    
    const success = await this.deps.userRepository.delete(id);
    if (success) {
      // Remove from cache
      await this.deps.cache.delete(`user:${id}`);
      
      // Emit event
      await this.deps.eventEmitter.emit('user.deleted', { userId: id });
      
      this.deps.logger.info('User deleted successfully', { userId: id });
    }
    
    return success;
  }
}

// ✅ Configuration Management
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface CacheConfig {
  type: 'memory' | 'redis';
  host?: string;
  port?: number;
  ttl: number;
}

interface AppConfig {
  port: number;
  env: 'development' | 'production' | 'test';
  database: DatabaseConfig;
  cache: CacheConfig;
  api: {
    baseUrl: string;
    timeout: number;
  };
}

class ConfigManager {
  private config: AppConfig;
  
  constructor() {
    this.config = this.loadConfig();
  }
  
  private loadConfig(): AppConfig {
    return {
      port: parseInt(process.env.PORT || '3000', 10),
      env: (process.env.NODE_ENV as AppConfig['env']) || 'development',
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'myapp',
        username: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
      },
      cache: {
        type: (process.env.CACHE_TYPE as CacheConfig['type']) || 'memory',
        host: process.env.CACHE_HOST,
        port: process.env.CACHE_PORT ? parseInt(process.env.CACHE_PORT, 10) : undefined,
        ttl: parseInt(process.env.CACHE_TTL || '300000', 10),
      },
      api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        timeout: parseInt(process.env.API_TIMEOUT || '5000', 10),
      },
    };
  }
  
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }
  
  getAll(): AppConfig {
    return { ...this.config };
  }
}

// ✅ Dependency Injection Container
class DIContainer {
  private services = new Map<string, unknown>();
  private factories = new Map<string, () => unknown>();
  
  register<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
  }
  
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }
  
  get<T>(name: string): T {
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }
    
    const factory = this.factories.get(name);
    if (factory) {
      const instance = factory();
      this.services.set(name, instance);
      return instance as T;
    }
    
    throw new Error(`Service not found: ${name}`);
  }
  
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

// ✅ Application Bootstrap
class Application {
  private container: DIContainer;
  private config: ConfigManager;
  
  constructor() {
    this.container = new DIContainer();
    this.config = new ConfigManager();
    this.setupServices();
  }
  
  private setupServices(): void {
    // Register config
    this.container.registerInstance('config', this.config);
    
    // Register logger
    this.container.register('logger', () => new ConsoleLogger());
    
    // Register cache
    this.container.register('cache', () => new MemoryCache());
    
    // Register event emitter
    this.container.register('eventEmitter', () => new TypedEventEmitter());
    
    // Register database (would be implemented with actual database)
    this.container.register('database', () => {
      // Mock implementation
      return {
        query: async () => [],
        execute: async () => {},
        transaction: async <T>(fn: (db: Database) => Promise<T>) => {
          return fn(this.container.get<Database>('database'));
        },
      } as Database;
    });
    
    // Register user repository
    this.container.register('userRepository', () => {
      return new UserRepository(this.container.get<Database>('database'));
    });
    
    // Register user service
    this.container.register('userService', () => {
      return new UserService({
        userRepository: this.container.get<UserRepository>('userRepository'),
        eventEmitter: this.container.get<TypedEventEmitter>('eventEmitter'),
        cache: this.container.get<Cache>('cache'),
        logger: this.container.get<Logger>('logger'),
      });
    });
    
    // Register API client
    this.container.register('apiClient', () => {
      const config = this.container.get<ConfigManager>('config');
      return new TypedApiClient(config.get('api').baseUrl);
    });
  }
  
  getService<T>(name: string): T {
    return this.container.get<T>(name);
  }
  
  async start(): Promise<void> {
    const logger = this.container.get<Logger>('logger');
    const config = this.container.get<ConfigManager>('config');
    
    logger.info('Starting application', {
      env: config.get('env'),
      port: config.get('port'),
    });
    
    // Setup event handlers
    const eventEmitter = this.container.get<TypedEventEmitter>('eventEmitter');
    
    eventEmitter.on('user.created', async ({ user }) => {
      logger.info('User created event received', { userId: user.id });
    });
    
    eventEmitter.on('user.updated', async ({ user, changes }) => {
      logger.info('User updated event received', { userId: user.id, changes });
    });
    
    eventEmitter.on('user.deleted', async ({ userId }) => {
      logger.info('User deleted event received', { userId });
    });
    
    eventEmitter.on('system.error', async ({ error, context }) => {
      logger.error('System error event received', error, { context });
    });
    
    logger.info('Application started successfully');
  }
  
  async stop(): Promise<void> {
    const logger = this.container.get<Logger>('logger');
    logger.info('Stopping application');
    
    // Cleanup resources
    this.container.clear();
    
    logger.info('Application stopped');
  }
}

// ✅ Usage Example
async function integrationExample(): Promise<void> {
  const app = new Application();
  await app.start();
  
  const userService = app.getService<UserService>('userService');
  
  // Create a user
  const user = await userService.createUser({
    name: 'John Doe',
    email: 'john@example.com',
  });
  
  console.log('Created user:', user);
  
  // Get user by ID
  const fetchedUser = await userService.getUserById(user.id);
  console.log('Fetched user:', fetchedUser);
  
  // Update user
  const updatedUser = await userService.updateUser(user.id, {
    name: 'John Smith',
  });
  console.log('Updated user:', updatedUser);
  
  // Delete user
  const deleted = await userService.deleteUser(user.id);
  console.log('User deleted:', deleted);
  
  await app.stop();
}

export {
  // Interfaces
  type ApiClient,
  type Database,
  type Cache,
  type Logger,
  type EventMap,
  type EventName,
  type EventData,
  type EventHandler,
  type User,
  type CreateUserInput,
  type UserServiceDependencies,
  type DatabaseConfig,
  type CacheConfig,
  type AppConfig,
  
  // Classes
  TypedApiClient,
  UserRepository,
  TypedEventEmitter,
  MemoryCache,
  ConsoleLogger,
  UserService,
  ConfigManager,
  DIContainer,
  Application,
  
  // Functions
  integrationExample,
};