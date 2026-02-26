// Integration Examples for Jora Query Language
import jora from 'jora'
import type { JoraQuery } from 'jora'

// ===== DISCOVERY.JS FRAMEWORK INTEGRATION =====

// Discovery.js is a companion framework for JSON data analysis
interface DiscoveryConfig {
  name: string
  data: unknown
  queries?: Record<string, string>
  views?: Array<{
    name: string
    query: string
    view: string
  }>
}

// Example Discovery.js configuration
export const discoveryConfig: DiscoveryConfig = {
  name: 'Data Explorer',
  data: {}, // Your JSON data here
  queries: {
    // Predefined queries for common operations
    allUsers: 'users',
    activeUsers: 'users[active = true]',
    usersByDepartment: 'users.group(=> department)',
    recentActivity: 'activities[date > "2023-01-01"].sort(=> -date)',
    
    // Complex analytical queries
    departmentStats: `
      users.group(=> department).map(=> {
        department: key,
        userCount: value.size(),
        avgAge: value.avg(=> age),
        avgSalary: value.avg(=> salary),
        activePercentage: (value[active].size() / value.size() * 100).toFixed(1) + "%"
      }).sort(=> -userCount)
    `,
    
    // Performance metrics
    performanceMetrics: `
      {
        totalUsers: users.size(),
        activeUsers: users[active].size(),
        departments: users.department.unique().size(),
        avgAge: users.avg(=> age),
        salaryRange: {
          min: users.min(=> salary),
          max: users.max(=> salary),
          avg: users.avg(=> salary)
        }
      }
    `
  },
  views: [
    {
      name: 'User List',
      query: 'users[active]',
      view: 'table'
    },
    {
      name: 'Department Chart', 
      query: 'users.group(=> department)',
      view: 'pie-chart'
    }
  ]
}

// ===== NODE.JS APPLICATION INTEGRATION =====

// Express.js API with Jora queries
import express from 'express'

const app = express()

// Sample data store
const dataStore = {
  users: [
    { id: 1, name: 'Alice', department: 'Engineering', active: true, salary: 90000 },
    { id: 2, name: 'Bob', department: 'Marketing', active: true, salary: 70000 },
    { id: 3, name: 'Carol', department: 'Sales', active: false, salary: 80000 }
  ],
  projects: [
    { id: 1, name: 'Project A', status: 'active', teamSize: 5, budget: 100000 },
    { id: 2, name: 'Project B', status: 'completed', teamSize: 3, budget: 50000 }
  ]
}

// Compiled queries for better performance
const compiledQueries = {
  allUsers: jora('users'),
  activeUsers: jora('users[active = true]'),
  usersByDept: jora('users.group(=> department)'),
  projectStats: jora(`{
    total: projects.size(),
    active: projects[status = "active"].size(),
    totalBudget: projects.sum(=> budget),
    avgTeamSize: projects.avg(=> teamSize)
  }`)
}

// API endpoints using Jora
app.get('/api/users', (req, res) => {
  const { active, department } = req.query
  
  let query = 'users'
  const context: Record<string, unknown> = {}
  
  if (active !== undefined) {
    query += '[active = $active]'
    context.active = active === 'true'
  }
  
  if (department) {
    query += department ? '[department = $dept]' : ''
    context.dept = department
  }
  
  const joraQuery = jora(query)
  const result = joraQuery(dataStore, context)
  res.json(result)
})

app.get('/api/analytics', (req, res) => {
  const analytics = jora(`
    {
      users: {
        total: users.size(),
        active: users[active].size(),
        byDepartment: users.group(=> department).map(=> {
          department: key,
          count: value.size(),
          avgSalary: value.avg(=> salary)
        })
      },
      projects: {
        total: projects.size(),
        active: projects[status = "active"].size(),
        totalBudget: projects.sum(=> budget)
      }
    }
  `)(dataStore)
  
  res.json(analytics)
})

// ===== REAL-TIME DATA PROCESSING =====

import { EventEmitter } from 'node:events'

class DataProcessor extends EventEmitter {
  private data: unknown[] = []
  private queries: Map<string, JoraQuery> = new Map()

  constructor() {
    super()
    this.setupQueries()
  }

  private setupQueries() {
    // Precompile frequently used queries
    this.queries.set('recent', jora('data[-10:]'))
    this.queries.set('errors', jora('data[level = "error"]'))
    this.queries.set('stats', jora(`{
      total: data.size(),
      errors: data[level = "error"].size(),
      warnings: data[level = "warning"].size(),
      lastUpdate: data[-1].timestamp
    }`))
  }

  addData(newData: unknown) {
    this.data.push(newData)
    
    // Trigger real-time analysis
    this.analyzeData()
  }

  private analyzeData() {
    const stats = this.queries.get('stats')!({ data: this.data })
    this.emit('stats', stats)
    
    // Check for errors
    const errors = this.queries.get('errors')!({ data: this.data })
    if (Array.isArray(errors) && errors.length > 0) {
      this.emit('errors', errors)
    }
  }

  query(queryName: string) {
    const query = this.queries.get(queryName)
    return query ? query({ data: this.data }) : null
  }

  customQuery(queryString: string, context?: Record<string, unknown>) {
    const query = jora(queryString)
    return query({ data: this.data }, context)
  }
}

// Usage
const processor = new DataProcessor()
processor.on('stats', (stats) => console.log('Stats updated:', stats))
processor.on('errors', (errors) => console.log('New errors:', errors))

// ===== BROWSER INTEGRATION =====

// Client-side data processing with Jora
const clientSideExample = `
<!DOCTYPE html>
<html>
<head>
  <title>Jora Browser Example</title>
  <script type="module">
    import jora from 'https://cdn.skypack.dev/jora'
    
    // Fetch and process API data
    async function loadAndProcessData() {
      const response = await fetch('/api/data')
      const data = await response.json()
      
      // Process with Jora
      const processed = jora(\`
        items[active].{
          id,
          name,
          category,
          lastUpdate: updated.toISOString()
        }.sort(=> name)
      \`)(data)
      
      displayResults(processed)
    }
    
    function displayResults(data) {
      const container = document.getElementById('results')
      container.innerHTML = data.map(item => \`
        <div class="item">
          <h3>\${item.name}</h3>
          <p>Category: \${item.category}</p>
          <p>Updated: \${item.lastUpdate}</p>
        </div>
      \`).join('')
    }
    
    // Interactive query builder
    function updateQuery() {
      const filterInput = document.getElementById('filter')
      const sortInput = document.getElementById('sort')
      
      let query = 'items'
      if (filterInput.value) {
        query += \`[name ~= /\${filterInput.value}/i]\`
      }
      if (sortInput.value) {
        query += \`.sort(=> \${sortInput.value})\`
      }
      
      const result = jora(query)(window.appData)
      displayResults(result)
    }
    
    // Load data on page load
    loadAndProcessData()
  </script>
</head>
<body>
  <div>
    <input type="text" id="filter" placeholder="Filter by name" onchange="updateQuery()">
    <select id="sort" onchange="updateQuery()">
      <option value="">No sorting</option>
      <option value="name">Sort by name</option>
      <option value="-updated">Sort by date (newest first)</option>
    </select>
  </div>
  <div id="results"></div>
</body>
</html>
`

// ===== TESTING INTEGRATION =====

// Unit testing with Jora queries
import { describe, it, expect } from 'bun:test'

describe('Jora Query Integration', () => {
  const testData = {
    users: [
      { id: 1, name: 'Alice', age: 30, active: true },
      { id: 2, name: 'Bob', age: 25, active: false },
      { id: 3, name: 'Carol', age: 35, active: true }
    ]
  }

  it('should filter active users', () => {
    const query = jora('users[active = true]')
    const result = query(testData)
    
    expect(result).toHaveLength(2)
    expect(result.every((user: any) => user.active)).toBe(true)
  })

  it('should calculate average age', () => {
    const query = jora('users.avg(=> age)')
    const result = query(testData)
    
    expect(result).toBe(30) // (30 + 25 + 35) / 3
  })

  it('should transform user data', () => {
    const query = jora('users.{ id, name, isAdult: age >= 18 }')
    const result = query(testData)
    
    expect(result).toHaveLength(3)
    expect(result.every((user: any) => user.isAdult)).toBe(true)
  })

  it('should handle context variables', () => {
    const query = jora('users[age > $minAge].name')
    const result = query(testData, { minAge: 28 })
    
    expect(result).toEqual(['Alice', 'Carol'])
  })
})

// ===== PERFORMANCE MONITORING =====

// Performance monitoring wrapper
class JoraPerformanceMonitor {
  private metrics: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map()

  wrapQuery(name: string, query: JoraQuery): JoraQuery {
    return (data: unknown, context?: Record<string, unknown>) => {
      const start = performance.now()
      const result = query(data, context)
      const end = performance.now()
      
      this.recordMetric(name, end - start)
      return result
    }
  }

  private recordMetric(name: string, time: number) {
    const existing = this.metrics.get(name) || { count: 0, totalTime: 0, avgTime: 0 }
    existing.count++
    existing.totalTime += time
    existing.avgTime = existing.totalTime / existing.count
    
    this.metrics.set(name, existing)
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  reset() {
    this.metrics.clear()
  }
}

// Usage
const monitor = new JoraPerformanceMonitor()
const monitoredQuery = monitor.wrapQuery('user-filter', jora('users[active]'))

// ===== CACHING LAYER =====

// Query result caching
class JoraCache {
  private cache = new Map<string, { result: unknown; timestamp: number; ttl: number }>()

  constructor(private defaultTTL = 5 * 60 * 1000) {} // 5 minutes default

  getCachedQuery(query: JoraQuery, queryString: string, ttl?: number): JoraQuery {
    return (data: unknown, context?: Record<string, unknown>) => {
      const cacheKey = this.generateKey(queryString, data, context)
      const cached = this.cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.result
      }
      
      const result = query(data, context)
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL
      })
      
      return result
    }
  }

  private generateKey(query: string, data: unknown, context?: Record<string, unknown>): string {
    // Simple hash-based key generation
    const dataHash = JSON.stringify(data).length // Simplified
    const contextHash = context ? JSON.stringify(context) : ''
    return `${query}:${dataHash}:${contextHash}`
  }

  clear() {
    this.cache.clear()
  }

  size() {
    return this.cache.size
  }
}

// ===== CONFIGURATION MANAGEMENT =====

// Configuration-driven query system
interface QueryConfig {
  name: string
  query: string
  cache?: boolean
  ttl?: number
  monitor?: boolean
}

class JoraQueryManager {
  private queries = new Map<string, JoraQuery>()
  private cache = new JoraCache()
  private monitor = new JoraPerformanceMonitor()

  constructor(configs: QueryConfig[]) {
    this.loadQueries(configs)
  }

  private loadQueries(configs: QueryConfig[]) {
    for (const config of configs) {
      let query = jora(config.query)
      
      if (config.monitor) {
        query = this.monitor.wrapQuery(config.name, query)
      }
      
      if (config.cache) {
        query = this.cache.getCachedQuery(query, config.query, config.ttl)
      }
      
      this.queries.set(config.name, query)
    }
  }

  execute(name: string, data: unknown, context?: Record<string, unknown>) {
    const query = this.queries.get(name)
    if (!query) {
      throw new Error(`Query '${name}' not found`)
    }
    return query(data, context)
  }

  getMetrics() {
    return this.monitor.getMetrics()
  }
}

// Configuration example
const queryConfigs: QueryConfig[] = [
  {
    name: 'active-users',
    query: 'users[active = true]',
    cache: true,
    monitor: true,
    ttl: 2 * 60 * 1000 // 2 minutes
  },
  {
    name: 'user-stats',
    query: `{
      total: users.size(),
      active: users[active].size(),
      avgAge: users.avg(=> age)
    }`,
    cache: true,
    monitor: true
  },
  {
    name: 'recent-activity', 
    query: 'activities.sort(=> -timestamp)[0:10]',
    monitor: true
  }
]

const queryManager = new JoraQueryManager(queryConfigs)

// ===== EXPORT FOR USE =====

export {
  discoveryConfig,
  DataProcessor,
  JoraPerformanceMonitor,
  JoraCache,
  JoraQueryManager,
  queryManager,
  compiledQueries,
  clientSideExample,
  type QueryConfig,
  type DiscoveryConfig
}