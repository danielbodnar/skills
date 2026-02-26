// Orama Performance Optimization Examples
// Comprehensive guide to optimizing search performance

import { create, insert, search, insertMultiple, remove } from '@orama/orama'
import { performance } from 'perf_hooks'

// Performance Measurement Utilities
class PerformanceTracker {
  private metrics: Record<string, number[]> = {}

  startTimer(name: string): string {
    const id = `${name}_${Date.now()}_${Math.random()}`
    performance.mark(`${id}_start`)
    return id
  }

  endTimer(id: string): number {
    performance.mark(`${id}_end`)
    performance.measure(id, `${id}_start`, `${id}_end`)
    
    const measure = performance.getEntriesByName(id)[0]
    const duration = measure.duration
    
    const baseName = id.split('_')[0]
    if (!this.metrics[baseName]) this.metrics[baseName] = []
    this.metrics[baseName].push(duration)
    
    // Cleanup
    performance.clearMarks(`${id}_start`)
    performance.clearMarks(`${id}_end`)
    performance.clearMeasures(id)
    
    return duration
  }

  getStats(name: string) {
    const values = this.metrics[name] || []
    if (values.length === 0) return null
    
    const sorted = [...values].sort((a, b) => a - b)
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }

  printStats() {
    console.log('\n📊 Performance Statistics:')
    Object.keys(this.metrics).forEach(name => {
      const stats = this.getStats(name)
      if (stats) {
        console.log(`${name}:`)
        console.log(`  Avg: ${stats.avg.toFixed(2)}ms (${stats.count} samples)`)
        console.log(`  P50: ${stats.p50.toFixed(2)}ms | P95: ${stats.p95.toFixed(2)}ms | P99: ${stats.p99.toFixed(2)}ms`)
        console.log(`  Range: ${stats.min.toFixed(2)}ms - ${stats.max.toFixed(2)}ms`)
      }
    })
  }
}

const tracker = new PerformanceTracker()

// Optimized Database Schema for Performance
const optimizedSchema = {
  // Use specific types for better performance
  id: 'string',           // Primary key - indexed
  title: 'string',        // Searchable text
  content: 'string',      // Main content
  category: 'enum',       // Limited values - faster filtering
  priority: 'number',     // Numeric for range queries
  isActive: 'boolean',    // Boolean for exact matches
  tags: 'string[]',       // Array for contains queries
  
  // Nested objects - use sparingly for performance
  metadata: {
    created: 'string',
    views: 'number'
  }
} as const

// Create optimized database
const optimizedDB = create({
  schema: optimizedSchema,
  components: {
    tokenizer: {
      // Performance optimizations
      caseSensitive: false,
      stemming: true,
      normalization: true,
      
      // Limit processing overhead
      maxTokenLength: 50,
      
      // Custom stopwords - smaller set for better performance
      stopwords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    }
  }
})

// Generate Test Data for Performance Testing
function generateTestData(count: number) {
  const categories = ['tech', 'health', 'finance', 'education', 'entertainment']
  const titles = [
    'Understanding Machine Learning',
    'Web Development Best Practices', 
    'Investment Strategies for Beginners',
    'Health and Wellness Tips',
    'Educational Technology Trends'
  ]
  
  const data = []
  
  for (let i = 0; i < count; i++) {
    data.push({
      id: `doc_${i}`,
      title: `${titles[i % titles.length]} ${i}`,
      content: `This is content for document ${i}. It contains relevant information about ${categories[i % categories.length]} topics and provides valuable insights for readers interested in learning more about this subject matter.`,
      category: categories[i % categories.length],
      priority: Math.floor(Math.random() * 10) + 1,
      isActive: Math.random() > 0.2, // 80% active
      tags: [`tag${i % 5}`, `category${i % 3}`, `type${i % 4}`],
      metadata: {
        created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        views: Math.floor(Math.random() * 1000)
      }
    })
  }
  
  return data
}

// Batch Insert Performance Test
async function testBatchInsert(sizes: number[]) {
  console.log('🚀 Testing batch insert performance...')
  
  for (const size of sizes) {
    const testDB = create({ schema: optimizedSchema })
    const testData = generateTestData(size)
    
    // Single inserts
    const singleTimer = tracker.startTimer(`single_insert_${size}`)
    for (const doc of testData) {
      insert(testDB, doc)
    }
    tracker.endTimer(singleTimer)
    
    // Batch insert
    const batchDB = create({ schema: optimizedSchema })
    const batchTimer = tracker.startTimer(`batch_insert_${size}`)
    insertMultiple(batchDB, testData)
    tracker.endTimer(batchTimer)
    
    console.log(`${size} documents:`)
    console.log(`  Single: ${tracker.getStats(`single_insert_${size}`)?.avg.toFixed(2)}ms`)
    console.log(`  Batch: ${tracker.getStats(`batch_insert_${size}`)?.avg.toFixed(2)}ms`)
  }
}

// Search Performance Optimization
function optimizedSearch(db: any, query: string, filters: any = {}) {
  // Use specific properties for better performance
  const searchConfig = {
    term: query,
    properties: ['title^2', 'content'], // Boost title, search content
    where: {
      isActive: true, // Pre-filter inactive documents
      ...filters
    },
    limit: 20, // Reasonable limit for UI
    
    // Avoid expensive operations when not needed
    facets: Object.keys(filters).length > 0 ? {
      category: { limit: 5 },
      priority: {
        ranges: [
          { from: 1, to: 3 },
          { from: 4, to: 7 },
          { from: 8, to: 10 }
        ]
      }
    } : undefined
  }
  
  return search(db, searchConfig)
}

// Search Performance Tests
async function testSearchPerformance() {
  console.log('🔍 Testing search performance...')
  
  // Setup test database with various sizes
  const sizes = [1000, 5000, 10000]
  
  for (const size of sizes) {
    const testDB = create({ schema: optimizedSchema })
    const testData = generateTestData(size)
    insertMultiple(testDB, testData)
    
    // Test different search scenarios
    const scenarios = [
      { name: 'simple', query: 'machine learning', filters: {} },
      { name: 'filtered', query: 'development', filters: { category: 'tech' } },
      { name: 'complex', query: 'best practices', filters: { 
        category: { in: ['tech', 'education'] },
        priority: { gte: 5 }
      }}
    ]
    
    console.log(`\nDatabase size: ${size} documents`)
    
    for (const scenario of scenarios) {
      // Warm up
      optimizedSearch(testDB, scenario.query, scenario.filters)
      
      // Performance test
      const timer = tracker.startTimer(`search_${scenario.name}_${size}`)
      const results = optimizedSearch(testDB, scenario.query, scenario.filters)
      const duration = tracker.endTimer(timer)
      
      console.log(`  ${scenario.name}: ${duration.toFixed(2)}ms (${results.count} results)`)
    }
  }
}

// Memory Usage Monitoring
function getMemoryUsage() {
  const usage = process.memoryUsage()
  return {
    rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(usage.external / 1024 / 1024 * 100) / 100
  }
}

// Memory Efficiency Test
async function testMemoryEfficiency() {
  console.log('💾 Testing memory efficiency...')
  
  const initialMemory = getMemoryUsage()
  console.log('Initial memory:', initialMemory)
  
  // Create database and insert data
  const memoryDB = create({ schema: optimizedSchema })
  const testData = generateTestData(10000)
  
  const beforeInsert = getMemoryUsage()
  insertMultiple(memoryDB, testData)
  const afterInsert = getMemoryUsage()
  
  console.log('Memory after 10K inserts:', afterInsert)
  console.log('Memory increase:', {
    rss: afterInsert.rss - beforeInsert.rss,
    heapUsed: afterInsert.heapUsed - beforeInsert.heapUsed
  })
  
  // Test search memory usage
  const beforeSearch = getMemoryUsage()
  for (let i = 0; i < 100; i++) {
    search(memoryDB, { term: `query ${i}`, limit: 20 })
  }
  const afterSearch = getMemoryUsage()
  
  console.log('Memory after 100 searches:', afterSearch)
  console.log('Search memory impact:', {
    rss: afterSearch.rss - beforeSearch.rss,
    heapUsed: afterSearch.heapUsed - beforeSearch.heapUsed
  })
}

// Index Optimization Strategies
const indexOptimizedDB = create({
  schema: optimizedSchema,
  components: {
    tokenizer: {
      // Optimize for your specific use case
      stemming: true,
      caseSensitive: false,
      normalization: true,
      
      // Custom tokenizer for better performance
      customTokenizer: (text: string) => {
        return text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Keep hyphens, remove other punctuation
          .split(/\s+/)
          .filter(token => token.length >= 2 && token.length <= 50)
          .slice(0, 100) // Limit tokens per field
      }
    }
  }
})

// Query Optimization Patterns
const optimizedQueries = {
  // Fast exact matches
  exactMatch: (db: any, field: string, value: any) => {
    return search(db, {
      term: '',
      where: { [field]: value },
      limit: 100
    })
  },
  
  // Efficient range queries
  rangeQuery: (db: any, field: string, min: number, max: number) => {
    return search(db, {
      term: '',
      where: { [field]: { gte: min, lte: max } },
      limit: 100
    })
  },
  
  // Optimized text search with boosting
  textSearchOptimized: (db: any, query: string) => {
    return search(db, {
      term: query,
      properties: ['title^3', 'content^1'], // Heavy boost for titles
      threshold: 0.7, // Filter low-relevance results
      limit: 20,
      boost: {
        title: 3.0,
        content: 1.0
      }
    })
  },
  
  // Faceted search with minimal overhead
  facetedSearchOptimized: (db: any, query: string) => {
    return search(db, {
      term: query,
      properties: ['title', 'content'],
      facets: {
        // Limit facet results to reduce computation
        category: { limit: 5 },
        priority: { 
          ranges: [
            { from: 1, to: 5 },
            { from: 6, to: 10 }
          ]
        }
      },
      limit: 20
    })
  }
}

// Caching Strategy for Better Performance
class SearchCache {
  private cache = new Map<string, { result: any; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(params: any): string {
    return JSON.stringify(params)
  }

  get(params: any) {
    const key = this.getCacheKey(params)
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.result
    }
    
    this.cache.delete(key)
    return null
  }

  set(params: any, result: any) {
    const key = this.getCacheKey(params)
    this.cache.set(key, {
      result: JSON.parse(JSON.stringify(result)), // Deep clone
      timestamp: Date.now()
    })
    
    // Cleanup old entries
    if (this.cache.size > 1000) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, 100)
      oldestKeys.forEach(k => this.cache.delete(k))
    }
  }
}

const searchCache = new SearchCache()

function cachedSearch(db: any, params: any) {
  const cached = searchCache.get(params)
  if (cached) return cached
  
  const result = search(db, params)
  searchCache.set(params, result)
  return result
}

// Performance Testing Runner
export async function runPerformanceTests() {
  console.log('🏁 Starting Orama performance tests...')
  
  await testBatchInsert([100, 500, 1000, 2000])
  await testSearchPerformance()
  await testMemoryEfficiency()
  
  tracker.printStats()
}

// Best Practices Summary
export const performanceTips = {
  schema: [
    'Use specific data types (enum vs string for limited values)',
    'Avoid deep nesting in schema when possible',
    'Use vectors only when needed for semantic search'
  ],
  
  indexing: [
    'Use insertMultiple for batch operations',
    'Configure tokenizer for your specific use case',
    'Limit token length to reduce memory usage'
  ],
  
  searching: [
    'Use specific properties instead of searching all fields',
    'Apply filters early to reduce search scope',
    'Set reasonable limits for pagination',
    'Use boosting strategically, not excessively'
  ],
  
  memory: [
    'Monitor memory usage in production',
    'Implement search result caching for repeated queries',
    'Use pagination to limit result set sizes',
    'Clean up unused database instances'
  ]
}

// Export utilities
export {
  PerformanceTracker,
  optimizedDB,
  generateTestData,
  optimizedSearch,
  optimizedQueries,
  SearchCache,
  cachedSearch,
  getMemoryUsage
}

console.log('⚡ Performance optimization examples loaded')
console.log('💡 Tips:', performanceTips)

// Example usage
if (require.main === module) {
  // runPerformanceTests()
}