// TypeScript Type Definitions - Common Types
// Global type definitions for TypeScript projects

// ✅ Utility Types
type Exact<T, U> = T extends U ? (U extends T ? T : never) : never;
type Prettify<T> = { [K in keyof T]: T[K] } & {};
type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> };
type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
type DeepRequired<T> = { [K in keyof T]-?: DeepRequired<T[K]> };
type Nullable<T> = { [K in keyof T]: T[K] | null };
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type ValueOf<T> = T[keyof T];

// ✅ Array and Object Utilities
type NonEmptyArray<T> = [T, ...T[]];
type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;
type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer T] ? T : [];
type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;
type Length<T extends readonly unknown[]> = T['length'];

// ✅ String Utilities
type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;
type Uncapitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Lowercase<F>}${R}` : S;
type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${P1}${Capitalize<CamelCase<`${P2}${P3}`>>}`
  : S;
type KebabCase<S extends string> = S extends `${infer C}${infer T}`
  ? `${C extends Capitalize<C> ? `-${Lowercase<C>}` : C}${KebabCase<T>}`
  : S;

// ✅ Function Utilities
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;
type Promisify<T> = T extends Promise<any> ? T : Promise<T>;

// ✅ Branded Types
type Brand<T, B extends string> = T & { __brand: B };
type UserId = Brand<string, 'UserId'>;
type Email = Brand<string, 'Email'>;
type Url = Brand<string, 'Url'>;
type Timestamp = Brand<number, 'Timestamp'>;
type PositiveNumber = Brand<number, 'PositiveNumber'>;

// ✅ API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// ✅ Pagination Types
interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ✅ Common Entity Types
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SoftDeleteEntity extends BaseEntity {
  deletedAt: Date | null;
}

interface TimestampEntity {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ✅ Environment Types
type Environment = 'development' | 'production' | 'test' | 'staging';

interface Config {
  env: Environment;
  port: number;
  database: DatabaseConfig;
  auth: AuthConfig;
  logging: LoggingConfig;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
  };
}

interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destinations: ('console' | 'file' | 'remote')[];
}

// ✅ HTTP Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
type HttpStatus = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 500 | 502 | 503;
type ContentType = 'application/json' | 'application/xml' | 'text/html' | 'text/plain' | 'multipart/form-data';

interface HttpRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

interface HttpResponse<T = unknown> {
  status: HttpStatus;
  headers: Record<string, string>;
  body: T;
}

// ✅ Event Types
interface BaseEvent {
  id: string;
  type: string;
  timestamp: Timestamp;
  source: string;
  version: string;
}

interface DomainEvent<T = unknown> extends BaseEvent {
  aggregateId: string;
  aggregateType: string;
  data: T;
}

// ✅ Error Types
interface SerializableError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  cause?: SerializableError;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

interface BusinessError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

// ✅ Cache Types
interface CacheItem<T> {
  key: string;
  value: T;
  expires: Timestamp;
  tags?: string[];
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
}

// ✅ Authentication Types
interface User {
  id: UserId;
  email: Email;
  name: string;
  roles: Role[];
  permissions: Permission[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

interface AuthContext {
  user: User;
  token: AuthToken;
  isAuthenticated: boolean;
  permissions: string[];
}

// ✅ Database Types
interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  ssl: boolean;
  pool: {
    min: number;
    max: number;
    idle: number;
  };
}

interface QueryOptions {
  timeout?: number;
  retries?: number;
  readonly?: boolean;
}

interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  duration: number;
}

// ✅ File Upload Types
interface FileUpload {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  encoding: string;
}

interface FileMetadata {
  filename: string;
  size: number;
  mimetype: string;
  uploadedAt: Timestamp;
  uploadedBy: UserId;
  checksum: string;
}

// ✅ Search Types
interface SearchQuery {
  q: string;
  filters?: Record<string, unknown>;
  sort?: SortOption[];
  facets?: string[];
  highlight?: boolean;
  page?: number;
  limit?: number;
}

interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

interface SearchResult<T> {
  items: T[];
  total: number;
  facets?: Record<string, FacetResult[]>;
  suggestions?: string[];
  took: number;
}

interface FacetResult {
  value: string;
  count: number;
}

// ✅ Notification Types
interface Notification {
  id: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  recipient: string;
  subject?: string;
  message: string;
  data?: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Timestamp;
  sentAt?: Timestamp;
}

// ✅ Job Queue Types
interface Job<T = unknown> {
  id: string;
  type: string;
  data: T;
  priority: number;
  attempts: number;
  maxAttempts: number;
  delay?: number;
  createdAt: Timestamp;
  processedAt?: Timestamp;
  completedAt?: Timestamp;
  failedAt?: Timestamp;
  error?: string;
}

interface JobOptions {
  priority?: number;
  delay?: number;
  maxAttempts?: number;
  backoff?: 'exponential' | 'linear';
  timeout?: number;
}

// ✅ Audit Types
interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: UserId;
  userEmail: Email;
  timestamp: Timestamp;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
}

// ✅ Feature Flag Types
interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rules: FeatureFlagRule[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FeatureFlagRule {
  id: string;
  conditions: FeatureFlagCondition[];
  enabled: boolean;
  rolloutPercentage: number;
}

interface FeatureFlagCondition {
  attribute: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'nin' | 'contains';
  value: unknown;
}

// ✅ Monitoring Types
interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Timestamp;
  duration: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Timestamp;
  tags?: Record<string, string>;
}

// ✅ Export all utility types
export type {
  // Utility types
  Exact,
  Prettify,
  DeepReadonly,
  DeepPartial,
  DeepRequired,
  Nullable,
  Optional,
  ValueOf,
  NonEmptyArray,
  Head,
  Tail,
  Last,
  Length,
  Capitalize,
  Uncapitalize,
  CamelCase,
  KebabCase,
  Parameters,
  ReturnType,
  AsyncReturnType,
  Promisify,
  
  // Branded types
  Brand,
  UserId,
  Email,
  Url,
  Timestamp,
  PositiveNumber,
  
  // API types
  ApiResponse,
  ApiError,
  ResponseMeta,
  PaginationParams,
  PaginatedResponse,
  
  // Entity types
  BaseEntity,
  SoftDeleteEntity,
  TimestampEntity,
  
  // Config types
  Environment,
  Config,
  DatabaseConfig,
  AuthConfig,
  LoggingConfig,
  
  // HTTP types
  HttpMethod,
  HttpStatus,
  ContentType,
  HttpRequest,
  HttpResponse,
  
  // Event types
  BaseEvent,
  DomainEvent,
  
  // Error types
  SerializableError,
  ValidationError,
  BusinessError,
  
  // Cache types
  CacheItem,
  CacheOptions,
  
  // Auth types
  User,
  Role,
  Permission,
  AuthToken,
  AuthContext,
  
  // Database types
  DatabaseConnection,
  QueryOptions,
  QueryResult,
  
  // File types
  FileUpload,
  FileMetadata,
  
  // Search types
  SearchQuery,
  SortOption,
  SearchResult,
  FacetResult,
  
  // Notification types
  Notification,
  
  // Job types
  Job,
  JobOptions,
  
  // Audit types
  AuditLog,
  
  // Feature flag types
  FeatureFlag,
  FeatureFlagRule,
  FeatureFlagCondition,
  
  // Monitoring types
  HealthCheck,
  Metric,
};