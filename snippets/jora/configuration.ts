// Configuration Examples for Jora Query Language
import jora from 'jora'
import type { JoraQuery, JoraOptions } from 'jora'

// ===== BASIC CONFIGURATION =====

// Create query with basic options
const basicQuery = jora('users.name', {
  // Enable statistics collection
  stat: true,
  // Provide suggestions for development
  suggestions: true
})

// ===== QUERY OPTIONS =====

interface QueryOptions {
  // Collect statistics about query execution
  stat?: boolean
  // Enable query suggestions
  suggestions?: boolean
  // Define context variables
  context?: Record<string, unknown>
}

// Query with context
const contextualQuery = jora('users[age > $minAge]', {
  context: { minAge: 18 }
})

// ===== ADVANCED CONFIGURATION =====

// Custom query builder with configuration
class JoraQueryBuilder {
  private options: QueryOptions = {}

  constructor(options: QueryOptions = {}) {
    this.options = options
  }

  // Enable statistics
  withStats(): this {
    this.options.stat = true
    return this
  }

  // Enable suggestions
  withSuggestions(): this {
    this.options.suggestions = true
    return this
  }

  // Add context variables
  withContext(context: Record<string, unknown>): this {
    this.options.context = { ...this.options.context, ...context }
    return this
  }

  // Build the query
  build(queryString: string): JoraQuery {
    return jora(queryString, this.options)
  }
}

// Usage example
const builder = new JoraQueryBuilder()
const optimizedQuery = builder
  .withStats()
  .withSuggestions()
  .withContext({ department: 'Engineering' })
  .build('users[department = $department].name')

// ===== PERFORMANCE CONFIGURATION =====

// Configuration for large datasets
const performanceConfig: QueryOptions = {
  stat: true, // Monitor performance
  suggestions: false // Disable for production
}

const largeDataQuery = jora(`
  $chunks: items[0:1000], items[1000:2000], items[2000:3000];
  $chunks....filter(=> active).name
`, performanceConfig)

// ===== ENVIRONMENT-SPECIFIC CONFIGURATIONS =====

// Development configuration
const devConfig: QueryOptions = {
  stat: true,
  suggestions: true
}

// Production configuration  
const prodConfig: QueryOptions = {
  stat: false,
  suggestions: false
}

const isDev = process.env.NODE_ENV === 'development'
const config = isDev ? devConfig : prodConfig

const environmentQuery = jora('users[active].profile', config)

// ===== REUSABLE QUERY CONFIGURATIONS =====

// Base configurations for different use cases
const configurations = {
  // For data analysis and exploration
  analytics: {
    stat: true,
    suggestions: true,
    context: {
      today: new Date().toISOString(),
      version: '1.0.0'
    }
  },

  // For API endpoints (performance focused)
  api: {
    stat: false,
    suggestions: false
  },

  // For debugging and development
  debug: {
    stat: true,
    suggestions: true
  },

  // For batch processing
  batch: {
    stat: true,
    suggestions: false
  }
} as const

// Factory function for creating configured queries
function createQuery(
  queryString: string, 
  configType: keyof typeof configurations = 'api'
): JoraQuery {
  return jora(queryString, configurations[configType])
}

// Usage examples
const analyticsQuery = createQuery(`
  users.group(=> department).map(=> {
    department: key,
    count: value.size(),
    avgSalary: value.avg(=> salary),
    lastUpdated: $today
  })
`, 'analytics')

const apiQuery = createQuery('users[active].{ id, name, email }', 'api')

// ===== QUERY CACHING CONFIGURATION =====

// Simple query cache implementation
class QueryCache {
  private cache = new Map<string, JoraQuery>()
  private config: QueryOptions

  constructor(config: QueryOptions = {}) {
    this.config = config
  }

  get(queryString: string): JoraQuery {
    if (!this.cache.has(queryString)) {
      this.cache.set(queryString, jora(queryString, this.config))
    }
    return this.cache.get(queryString)!
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Usage
const queryCache = new QueryCache(configurations.api)
const cachedQuery = queryCache.get('users[active].name')

// ===== VALIDATION AND ERROR HANDLING CONFIG =====

// Configuration with error handling
interface SafeQueryOptions extends QueryOptions {
  onError?: (error: Error) => void
  defaultValue?: unknown
}

function createSafeQuery(
  queryString: string, 
  options: SafeQueryOptions = {}
): (data: unknown, context?: Record<string, unknown>) => unknown {
  const query = jora(queryString, options)
  
  return (data: unknown, context?: Record<string, unknown>) => {
    try {
      return query(data, context)
    } catch (error) {
      options.onError?.(error as Error)
      return options.defaultValue ?? null
    }
  }
}

// Usage
const safeQuery = createSafeQuery('users[invalid > syntax]', {
  onError: (error) => console.warn('Query failed:', error.message),
  defaultValue: []
})

// ===== TYPESCRIPT CONFIGURATION =====

// Type-safe query configuration
interface TypedQueryConfig<T = unknown> {
  query: string
  options?: QueryOptions
  validator?: (result: unknown) => result is T
}

function createTypedQuery<T>(config: TypedQueryConfig<T>) {
  const query = jora(config.query, config.options)
  
  return (data: unknown, context?: Record<string, unknown>): T | null => {
    const result = query(data, context)
    
    if (config.validator && !config.validator(result)) {
      return null
    }
    
    return result as T
  }
}

// Usage with type validation
interface User {
  id: number
  name: string
  email: string
}

const isUserArray = (value: unknown): value is User[] => {
  return Array.isArray(value) && 
         value.every(item => 
           typeof item === 'object' && 
           item !== null &&
           'id' in item && 
           'name' in item && 
           'email' in item
         )
}

const typedUserQuery = createTypedQuery<User[]>({
  query: 'users[active].{ id, name, email }',
  options: configurations.api,
  validator: isUserArray
})

// ===== EXPORTED CONFIGURATIONS =====

export {
  JoraQueryBuilder,
  configurations,
  createQuery,
  QueryCache,
  createSafeQuery,
  createTypedQuery,
  type QueryOptions,
  type SafeQueryOptions,
  type TypedQueryConfig
}

// ===== EXAMPLE USAGE IN APPLICATION =====

/*
// In your application setup:
import { createQuery, configurations } from './jora-config'

// Create queries for different purposes
const userListQuery = createQuery('users[active].{ id, name, email }', 'api')
const analyticsQuery = createQuery(`
  users.group(=> department).map(=> {
    department: key,
    userCount: value.size(),
    avgAge: value.avg(=> age)
  })
`, 'analytics')

// Use in your application
export const getUserList = (data: unknown) => userListQuery(data)
export const getDepartmentStats = (data: unknown) => analyticsQuery(data)
*/