// TypeScript Type Definitions for Jora Query Language

// ===== CORE JORA TYPES =====

declare module 'jora' {
  // Main query function type
  export interface JoraQuery<T = unknown, R = unknown> {
    (data: T, context?: Record<string, unknown>): R
    stat?: QueryStatistics
  }

  // Query compilation options
  export interface JoraOptions {
    stat?: boolean
    suggestions?: boolean
    context?: Record<string, unknown>
  }

  // Query statistics (when stat: true)
  export interface QueryStatistics {
    time: number
    calls: number
    nodes: number
  }

  // Main jora function
  function jora<T = unknown, R = unknown>(
    query: string,
    options?: JoraOptions
  ): JoraQuery<T, R>

  export default jora
}

// ===== QUERY BUILDER TYPES =====

// Dynamic query builder interface
export interface QueryBuilder {
  addFilter(condition: string): QueryBuilder
  addTransformation(transform: string): QueryBuilder
  addSort(sortBy: string): QueryBuilder
  setVariable(name: string, value: unknown): QueryBuilder
  build(): { query: string; context: Record<string, unknown> }
}

// Query configuration
export interface QueryConfig {
  name: string
  query: string
  cache?: boolean
  ttl?: number
  monitor?: boolean
  description?: string
}

// ===== JORA SYNTAX TYPES =====

// Built-in method signatures (for documentation)
export interface JoraBuiltinMethods {
  // Array methods
  size(): number
  sort(compareFn?: string): unknown[]
  filter(predicate: string): unknown[]
  map(transform: string): unknown[]
  reduce(reducer: string, initial?: unknown): unknown
  
  // Aggregation methods
  sum(accessor?: string): number
  avg(accessor?: string): number
  min(accessor?: string): number
  max(accessor?: string): number
  
  // Grouping methods
  group(keySelector: string): Record<string, unknown[]>
  unique(): unknown[]
  
  // Utility methods
  toArray(): unknown[]
  keys(): string[]
  values(): unknown[]
}

// ===== DATA STRUCTURE TYPES =====

// Common data structures used with Jora
export interface JoraDataStructure {
  [key: string]: unknown
}

// Bookmark data structure (from real-world examples)
export interface BookmarkData {
  id: string
  title: string
  url: string
  category: string[]
  tags: string[]
  dateAdded: string
  dateModified: string
  visited: boolean
  rating?: number
  notes?: string
  folder: string
}

// Log entry structure
export interface LogEntry {
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  module: string
  userId?: string
  stack?: string
}

// User data structure
export interface UserData {
  id: number | string
  name: string
  age: number
  department: string
  active: boolean
  salary?: number
  skills?: string[]
  profile?: {
    email?: string
    phone?: string
    avatar?: string
  }
}

// Project data structure
export interface ProjectData {
  id: number | string
  name: string
  status: 'active' | 'completed' | 'planning' | 'cancelled'
  teamSize: number
  budget: number
  deadline?: string
  description?: string
}

// ===== QUERY RESULT TYPES =====

// Generic query result type
export type QueryResult<T> = T extends unknown[] ? T : T extends object ? T : unknown

// Statistics aggregation result
export interface AggregationResult {
  count: number
  sum?: number
  avg?: number
  min?: number
  max?: number
}

// Grouping result
export interface GroupingResult<T = unknown> {
  [key: string]: T[]
}

// Transformation result
export interface TransformationResult {
  [key: string]: unknown
}

// ===== PERFORMANCE MONITORING TYPES =====

// Performance metric
export interface PerformanceMetric {
  queryName: string
  executionTime: number
  dataSize: number
  resultSize: number
  timestamp: number
}

// Query cache entry
export interface CacheEntry<T = unknown> {
  result: T
  timestamp: number
  ttl: number
  hits: number
}

// ===== ERROR TYPES =====

// Jora query error
export class JoraQueryError extends Error {
  constructor(
    message: string,
    public query: string,
    public position?: number
  ) {
    super(message)
    this.name = 'JoraQueryError'
  }
}

// Jora syntax error
export class JoraSyntaxError extends JoraQueryError {
  constructor(
    message: string,
    query: string,
    position: number
  ) {
    super(message, query, position)
    this.name = 'JoraSyntaxError'
  }
}

// ===== UTILITY TYPES =====

// Context variable type
export type ContextVariables = Record<string, unknown>

// Query string template type
export type QueryTemplate = string

// Jora function signature
export type JoraFunction = (data: unknown, context?: ContextVariables) => unknown

// ===== ADVANCED TYPES =====

// Type-safe query creation
export interface TypedQuery<TInput, TOutput> {
  (data: TInput, context?: ContextVariables): TOutput
}

// Query validator function
export type QueryValidator<T> = (result: unknown) => result is T

// Type-safe query builder
export interface TypedQueryBuilder<TInput, TOutput> {
  query: string
  options?: JoraOptions
  validator?: QueryValidator<TOutput>
  execute: (data: TInput, context?: ContextVariables) => TOutput | null
}

// ===== DISCOVERY.JS INTEGRATION TYPES =====

// Discovery.js configuration
export interface DiscoveryConfig {
  name: string
  data: unknown
  queries?: Record<string, string>
  views?: Array<{
    name: string
    query: string
    view: string
  }>
}

// Discovery view types
export type DiscoveryViewType = 'table' | 'list' | 'tree' | 'pie-chart' | 'bar-chart' | 'line-chart'

// ===== CLI INTEGRATION TYPES =====

// CLI options for jora-cli
export interface JoraCliOptions {
  input?: string
  output?: string
  query?: string
  pretty?: boolean
  encoding?: 'json' | 'jsonxl'
  compression?: 'gzip' | 'deflate'
}

// CLI result
export interface JoraCliResult {
  stdout: string
  stderr: string
  exitCode: number
}

// ===== VALIDATION TYPES =====

// Schema validation for Jora input/output
export interface JoraSchema {
  input?: {
    type: 'object' | 'array'
    properties?: Record<string, unknown>
    required?: string[]
  }
  output?: {
    type: 'object' | 'array' | 'primitive'
    properties?: Record<string, unknown>
  }
}

// ===== EXTENSION TYPES =====

// Custom function definition
export interface JoraCustomFunction {
  name: string
  implementation: string
  description?: string
  examples?: string[]
}

// Plugin interface
export interface JoraPlugin {
  name: string
  version: string
  functions?: JoraCustomFunction[]
  operators?: Record<string, string>
  methods?: Record<string, string>
}

// ===== TESTING TYPES =====

// Test case structure
export interface JoraTestCase {
  name: string
  query: string
  data: unknown
  context?: ContextVariables
  expected: unknown
  description?: string
}

// Test suite
export interface JoraTestSuite {
  name: string
  description?: string
  setup?: () => unknown
  teardown?: () => void
  cases: JoraTestCase[]
}

// Mock data generator options
export interface MockDataOptions {
  userCount?: number
  projectCount?: number
  includeInactive?: boolean
  randomSeed?: number
}

// ===== EXPORT TYPES =====

export {
  JoraQuery,
  JoraOptions,
  QueryStatistics,
  QueryBuilder,
  QueryConfig,
  JoraBuiltinMethods,
  JoraDataStructure,
  BookmarkData,
  LogEntry,
  UserData,
  ProjectData,
  QueryResult,
  AggregationResult,
  GroupingResult,
  TransformationResult,
  PerformanceMetric,
  CacheEntry,
  JoraQueryError,
  JoraSyntaxError,
  ContextVariables,
  QueryTemplate,
  JoraFunction,
  TypedQuery,
  QueryValidator,
  TypedQueryBuilder,
  DiscoveryConfig,
  DiscoveryViewType,
  JoraCliOptions,
  JoraCliResult,
  JoraSchema,
  JoraCustomFunction,
  JoraPlugin,
  JoraTestCase,
  JoraTestSuite,
  MockDataOptions
}