// Real-World Examples for Jora Query Language
import jora from 'jora'
import type { JoraQuery } from 'jora'

// ===== BOOKMARK MANAGEMENT SYSTEM =====

// Perfect for the current bookmarks project context
interface Bookmark {
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

const bookmarksData = {
  bookmarks: [
    {
      id: '1',
      title: 'Jora Documentation',
      url: 'https://discoveryjs.github.io/jora/',
      category: ['Development', 'Documentation'],
      tags: ['javascript', 'query', 'json'],
      dateAdded: '2023-01-15',
      dateModified: '2023-01-15',
      visited: true,
      rating: 5,
      folder: 'dev-tools'
    },
    {
      id: '2', 
      title: 'TypeScript Handbook',
      url: 'https://www.typescriptlang.org/docs/',
      category: ['Development', 'Documentation'],
      tags: ['typescript', 'documentation'],
      dateAdded: '2023-01-10',
      dateModified: '2023-01-10',
      visited: false,
      folder: 'dev-tools'
    }
  ] as Bookmark[]
}

// Bookmark analysis queries
const bookmarkQueries = {
  // Find bookmarks by category
  byCategory: jora('bookmarks[category[$ = $targetCategory]]'),
  
  // Get unvisited bookmarks
  unvisited: jora('bookmarks[visited = false].{ title, url, category }'),
  
  // Bookmark statistics
  statistics: jora(`{
    total: bookmarks.size(),
    visited: bookmarks[visited].size(),
    unvisited: bookmarks[visited = false].size(),
    categoryCounts: bookmarks.category....group().map(=> { 
      category: key, 
      count: value.size() 
    }).sort(=> -count),
    topTags: bookmarks.tags....group().map(=> {
      tag: key,
      count: value.size()
    }).sort(=> -count)[0:10],
    recentlyAdded: bookmarks.sort(=> -dateAdded)[0:5].{ title, dateAdded }
  }`),
  
  // Find similar bookmarks
  findSimilar: jora(`
    $targetTags: bookmarks[id = $bookmarkId].tags[0];
    bookmarks[
      id != $bookmarkId and 
      tags[$ in $targetTags].size() > 0
    ].{
      title,
      url,
      commonTags: tags[$ in $targetTags],
      similarity: tags[$ in $targetTags].size() / tags.size()
    }.sort(=> -similarity)
  `),
  
  // Cleanup suggestions
  duplicateUrls: jora(`
    bookmarks.group(=> url).map(=> {
      url: key,
      count: value.size(),
      bookmarks: value.{ id, title, folder }
    })[count > 1]
  `)
}

// ===== PACKAGE.JSON ANALYSIS =====

// Analyze Node.js/Bun project dependencies
const packageJsonData = {
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "jora": "^1.0.0-beta.15",
    "express": "^4.18.2",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist",
    "test": "vitest"
  }
}

const packageAnalysis = {
  // Dependency analysis
  depAnalysis: jora(`{
    totalDeps: dependencies.keys().size() + devDependencies.keys().size(),
    prodDeps: dependencies.keys().size(),
    devDeps: devDependencies.keys().size(),
    allPackages: [
      dependencies.keys().map(=> { name: $, type: "production", version: dependencies[$] }),
      devDependencies.keys().map(=> { name: $, type: "development", version: devDependencies[$] })
    ]...,
    hasTypeScript: devDependencies.typescript ? true : false,
    hasTests: scripts.test ? true : false
  }`),
  
  // Security audit helper
  potentialIssues: jora(`{
    oldVersions: [
      dependencies.keys().map(=> { package: $, version: dependencies[$] }),
      devDependencies.keys().map(=> { package: $, version: devDependencies[$] })
    ]...[version ~= /\\^[0-3]\\./],
    scriptsWithSudo: scripts.keys()[scripts[$] ~= /sudo/]
  }`)
}

// ===== LOG FILE ANALYSIS =====

// Application log processing
const logData = {
  entries: [
    { timestamp: '2023-12-01T10:00:00Z', level: 'info', message: 'Server started', module: 'app', userId: null },
    { timestamp: '2023-12-01T10:01:00Z', level: 'error', message: 'Database connection failed', module: 'db', userId: null, stack: 'ConnectionError...' },
    { timestamp: '2023-12-01T10:02:00Z', level: 'warn', message: 'Deprecated API used', module: 'api', userId: 'user123' },
    { timestamp: '2023-12-01T10:03:00Z', level: 'info', message: 'User logged in', module: 'auth', userId: 'user456' }
  ]
}

const logAnalysis = {
  // Error analysis
  errors: jora('entries[level = "error"].{ timestamp, message, module, stack }'),
  
  // User activity summary
  userActivity: jora(`
    entries[userId].group(=> userId).map(=> {
      userId: key,
      actions: value.size(),
      lastActivity: value.sort(=> -timestamp)[0].timestamp,
      errorCount: value[level = "error"].size()
    })
  `),
  
  // Performance metrics
  performance: jora(`{
    totalEntries: entries.size(),
    errorRate: (entries[level = "error"].size() / entries.size() * 100).toFixed(2) + "%",
    warningRate: (entries[level = "warn"].size() / entries.size() * 100).toFixed(2) + "%",
    moduleStats: entries.group(=> module).map(=> {
      module: key,
      entries: value.size(),
      errors: value[level = "error"].size(),
      errorRate: value.size() > 0 ? (value[level = "error"].size() / value.size() * 100).toFixed(1) + "%" : "0%"
    }).sort(=> -errors),
    timeRange: {
      start: entries.min(=> timestamp),
      end: entries.max(=> timestamp)
    }
  }`)
}

// ===== E-COMMERCE DATA ANALYSIS =====

// Online store analytics
const ecommerceData = {
  orders: [
    {
      id: 'ord_1',
      customerId: 'cust_123', 
      date: '2023-12-01',
      status: 'completed',
      total: 150.00,
      items: [
        { productId: 'prod_1', name: 'T-Shirt', quantity: 2, price: 25.00, category: 'Clothing' },
        { productId: 'prod_2', name: 'Jeans', quantity: 1, price: 100.00, category: 'Clothing' }
      ]
    },
    {
      id: 'ord_2',
      customerId: 'cust_456',
      date: '2023-12-02', 
      status: 'pending',
      total: 75.00,
      items: [
        { productId: 'prod_3', name: 'Book', quantity: 3, price: 25.00, category: 'Books' }
      ]
    }
  ],
  customers: [
    { id: 'cust_123', name: 'Alice Johnson', email: 'alice@example.com', segment: 'premium', registrationDate: '2023-01-15' },
    { id: 'cust_456', name: 'Bob Smith', email: 'bob@example.com', segment: 'regular', registrationDate: '2023-06-01' }
  ]
}

const ecommerceAnalysis = {
  // Sales analytics
  salesStats: jora(`{
    totalRevenue: orders[status = "completed"].sum(=> total),
    avgOrderValue: orders[status = "completed"].avg(=> total),
    totalOrders: orders.size(),
    completedOrders: orders[status = "completed"].size(),
    conversionRate: (orders[status = "completed"].size() / orders.size() * 100).toFixed(2) + "%",
    topCategories: orders[status = "completed"].items....group(=> category).map(=> {
      category: key,
      revenue: value.sum(=> price * quantity),
      itemsSold: value.sum(=> quantity)
    }).sort(=> -revenue)
  }`),
  
  // Customer insights
  customerInsights: jora(`
    $ordersByCustomer: orders.group(=> customerId);
    customers.map(=> {
      id,
      name,
      segment,
      orderCount: $ordersByCustomer[id].size() or 0,
      totalSpent: $ordersByCustomer[id][status = "completed"].sum(=> total) or 0,
      avgOrderValue: $ordersByCustomer[id][status = "completed"].avg(=> total) or 0,
      lastOrderDate: $ordersByCustomer[id].max(=> date)
    }).sort(=> -totalSpent)
  `),
  
  // Product performance
  productPerformance: jora(`
    orders[status = "completed"].items....group(=> productId).map(=> {
      productId: key,
      name: value[0].name,
      category: value[0].category,
      unitsSold: value.sum(=> quantity),
      revenue: value.sum(=> price * quantity),
      avgPrice: value.avg(=> price),
      orderFrequency: value.size()
    }).sort(=> -revenue)
  `)
}

// ===== API RESPONSE PROCESSING =====

// GitHub API response analysis
const githubApiResponse = {
  repositories: [
    {
      name: 'jora',
      full_name: 'discoveryjs/jora',
      description: 'JavaScript object query language',
      stargazers_count: 123,
      forks_count: 15,
      language: 'JavaScript',
      created_at: '2019-05-01T10:00:00Z',
      updated_at: '2023-11-01T15:30:00Z',
      topics: ['javascript', 'query-language', 'json'],
      license: { name: 'MIT License' },
      open_issues_count: 5
    },
    {
      name: 'discovery',
      full_name: 'discoveryjs/discovery', 
      description: 'Framework for data analysis',
      stargazers_count: 456,
      forks_count: 45,
      language: 'JavaScript',
      created_at: '2018-03-15T14:20:00Z',
      updated_at: '2023-10-15T09:15:00Z',
      topics: ['data-analysis', 'visualization', 'json'],
      license: { name: 'MIT License' },
      open_issues_count: 12
    }
  ]
}

const githubAnalysis = {
  // Repository insights
  repoStats: jora(`{
    totalRepos: repositories.size(),
    totalStars: repositories.sum(=> stargazers_count),
    totalForks: repositories.sum(=> forks_count),
    avgStars: repositories.avg(=> stargazers_count),
    languages: repositories.language.group().map(=> {
      language: key,
      count: value.size(),
      totalStars: repositories[language = key].sum(=> stargazers_count)
    }),
    topicCloud: repositories.topics....group().map(=> {
      topic: key,
      count: value.size(),
      repos: repositories[topics[$ = key]].name
    }).sort(=> -count),
    activeRepos: repositories.sort(=> -updated_at)[0:5].{
      name,
      updated_at,
      stars: stargazers_count
    }
  }`),
  
  // Quality metrics
  qualityMetrics: jora(`
    repositories.{
      name,
      qualityScore: (
        (stargazers_count > 100 ? 25 : stargazers_count * 0.25) +
        (forks_count > 10 ? 25 : forks_count * 2.5) +
        (description ? 25 : 0) +
        (license ? 25 : 0)
      ),
      maintenance: {
        hasDescription: description ? true : false,
        hasLicense: license ? true : false,
        recentlyUpdated: updated_at > "2023-01-01T00:00:00Z",
        lowIssueCount: open_issues_count < 10
      }
    }.sort(=> -qualityScore)
  `)
}

// ===== CONFIGURATION FILE PROCESSING =====

// Process application configuration
const appConfig = {
  server: {
    port: 3000,
    host: '0.0.0.0',
    ssl: {
      enabled: false,
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem'
    }
  },
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    name: 'myapp',
    pool: {
      min: 2,
      max: 10
    }
  },
  features: {
    authentication: { enabled: true, provider: 'oauth2' },
    analytics: { enabled: false, provider: 'ga4' },
    caching: { enabled: true, provider: 'redis', ttl: 3600 }
  },
  environments: {
    development: { debug: true, logLevel: 'debug' },
    production: { debug: false, logLevel: 'error' }
  }
}

const configAnalysis = {
  // Security audit
  securityAudit: jora(`{
    sslEnabled: server.ssl.enabled,
    debugMode: environments.production.debug,
    defaultPorts: [
      server.port = 3000 ? { service: "server", port: server.port, default: true } : null,
      database.port = 5432 ? { service: "database", port: database.port, default: true } : null
    ][],
    enabledFeatures: features.keys()[features[$].enabled],
    securityIssues: [
      server.ssl.enabled = false ? "SSL not enabled" : null,
      environments.production.debug = true ? "Debug enabled in production" : null,
      server.host = "0.0.0.0" ? "Server binding to all interfaces" : null
    ][]
  }`),
  
  // Environment comparison
  envComparison: jora(`
    environments.keys().map(=> {
      environment: $,
      config: environments[$],
      features: features.keys()[features[$].enabled].size(),
      isProduction: $ = "production"
    })
  `)
}

// ===== PERFORMANCE MONITORING DATA =====

// Application performance metrics
const performanceData = {
  metrics: [
    { timestamp: '2023-12-01T10:00:00Z', endpoint: '/api/users', responseTime: 120, status: 200, memoryUsage: 45.2 },
    { timestamp: '2023-12-01T10:01:00Z', endpoint: '/api/users', responseTime: 95, status: 200, memoryUsage: 46.1 },
    { timestamp: '2023-12-01T10:02:00Z', endpoint: '/api/orders', responseTime: 250, status: 200, memoryUsage: 48.5 },
    { timestamp: '2023-12-01T10:03:00Z', endpoint: '/api/orders', responseTime: 180, status: 500, memoryUsage: 50.2 }
  ]
}

const performanceAnalysis = {
  // Endpoint performance
  endpointStats: jora(`
    metrics.group(=> endpoint).map(=> {
      endpoint: key,
      totalRequests: value.size(),
      avgResponseTime: value.avg(=> responseTime),
      minResponseTime: value.min(=> responseTime),
      maxResponseTime: value.max(=> responseTime),
      errorRate: (value[status >= 400].size() / value.size() * 100).toFixed(2) + "%",
      p95ResponseTime: value.sort(=> responseTime)[(value.size() * 0.95).floor()].responseTime
    }).sort(=> -avgResponseTime)
  `),
  
  // System health
  systemHealth: jora(`{
    avgMemoryUsage: metrics.avg(=> memoryUsage),
    peakMemoryUsage: metrics.max(=> memoryUsage),
    totalRequests: metrics.size(),
    errorCount: metrics[status >= 400].size(),
    overallErrorRate: (metrics[status >= 400].size() / metrics.size() * 100).toFixed(2) + "%",
    slowRequests: metrics[responseTime > 200].size(),
    performance: {
      fast: metrics[responseTime < 100].size(),
      medium: metrics[responseTime >= 100 and responseTime < 200].size(), 
      slow: metrics[responseTime >= 200].size()
    }
  }`)
}

// ===== EXPORT ALL EXAMPLES =====

export {
  // Data structures
  bookmarksData,
  packageJsonData,
  logData,
  ecommerceData,
  githubApiResponse,
  appConfig,
  performanceData,
  
  // Query collections
  bookmarkQueries,
  packageAnalysis,
  logAnalysis,
  ecommerceAnalysis,
  githubAnalysis,
  configAnalysis,
  performanceAnalysis,
  
  // Types
  type Bookmark
}

// ===== USAGE EXAMPLES =====

/*
// Example usage in a bookmarks application:
const unvisitedBookmarks = bookmarkQueries.unvisited(bookmarksData)
const stats = bookmarkQueries.statistics(bookmarksData)

// Find similar bookmarks
const similar = bookmarkQueries.findSimilar(bookmarksData, { bookmarkId: '1' })

// Package.json analysis
const depStats = packageAnalysis.depAnalysis(packageJsonData)
const issues = packageAnalysis.potentialIssues(packageJsonData)

// Log monitoring
const errors = logAnalysis.errors(logData)
const metrics = logAnalysis.performance(logData)

// E-commerce reporting
const salesReport = ecommerceAnalysis.salesStats(ecommerceData)
const customerReport = ecommerceAnalysis.customerInsights(ecommerceData)

// GitHub repository analysis
const repoInsights = githubAnalysis.repoStats(githubApiResponse)
const quality = githubAnalysis.qualityMetrics(githubApiResponse)
*/