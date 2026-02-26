// Advanced Patterns for Jora Query Language
import jora from 'jora'

// ===== COMPLEX DATA TRANSFORMATIONS =====

// Deep nested data processing
const nestedData = {
  organization: {
    departments: [
      {
        name: 'Engineering',
        teams: [
          {
            name: 'Backend',
            members: [
              { name: 'Alice', role: 'Senior', skills: ['Node.js', 'Python'], projects: 3 },
              { name: 'Bob', role: 'Junior', skills: ['JavaScript'], projects: 1 }
            ]
          },
          {
            name: 'Frontend', 
            members: [
              { name: 'Carol', role: 'Senior', skills: ['React', 'Vue'], projects: 2 }
            ]
          }
        ]
      }
    ]
  }
}

// Advanced nested transformation
const nestedTransform = jora(`
  $allMembers: organization.departments.teams.members...;
  $skillsByRole: $allMembers.group(=> role).map(=> {
    role: key,
    members: value.size(),
    uniqueSkills: value.skills....unique().sort(),
    totalProjects: value.sum(=> projects),
    avgProjectsPerMember: value.avg(=> projects)
  });
  {
    summary: {
      totalMembers: $allMembers.size(),
      totalSkills: $allMembers.skills....unique().size(),
      totalProjects: $allMembers.sum(=> projects)
    },
    byRole: $skillsByRole
  }
`)

console.log(nestedTransform(nestedData))

// ===== RECURSIVE DATA PROCESSING =====

// Tree structure processing
const treeData = {
  name: 'root',
  type: 'folder',
  children: [
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'index.js', type: 'file', size: 1500 },
        { name: 'utils.js', type: 'file', size: 800 }
      ]
    },
    {
      name: 'docs',
      type: 'folder', 
      children: [
        { name: 'README.md', type: 'file', size: 2000 }
      ]
    },
    { name: 'package.json', type: 'file', size: 500 }
  ]
}

// Recursive flattening with custom function
const recursiveFlatten = jora(`
  $flatten: => [
    $,
    children.$flatten()...
  ];
  $flatten()[type = "file"].{ 
    path: name, 
    size,
    directory: $ != @ and $.name or "root"
  }
`)

console.log(recursiveFlatten(treeData))

// Tree statistics
const treeStats = jora(`
  $flatten: => [
    $,
    children.$flatten()...
  ];
  $files: $flatten()[type = "file"];
  $folders: $flatten()[type = "folder"];
  {
    totalFiles: $files.size(),
    totalFolders: $folders.size(),
    totalSize: $files.sum(=> size),
    avgFileSize: $files.avg(=> size),
    largestFile: $files.sort(=> -size)[0].name,
    fileExtensions: $files.name.split(".").[-1].group().map(=> {
      extension: key,
      count: value.size(),
      totalSize: value.sum(=> @.size)
    })
  }
`)

// ===== ADVANCED FILTERING PATTERNS =====

// Multi-condition filtering with variables
const complexData = {
  products: [
    { id: 1, name: 'Laptop', price: 1200, category: 'Electronics', rating: 4.5, inStock: true, tags: ['portable', 'work'] },
    { id: 2, name: 'Phone', price: 800, category: 'Electronics', rating: 4.2, inStock: false, tags: ['mobile', 'communication'] },
    { id: 3, name: 'Desk', price: 300, category: 'Furniture', rating: 4.0, inStock: true, tags: ['office', 'work'] },
    { id: 4, name: 'Chair', price: 200, category: 'Furniture', rating: 4.8, inStock: true, tags: ['office', 'comfort'] }
  ]
}

// Advanced filtering with multiple criteria
const advancedFilter = jora(`
  $minRating: 4.0;
  $maxPrice: 1000;
  $requiredTags: ["work", "office"];
  
  products[
    rating >= $minRating and 
    price <= $maxPrice and 
    inStock and
    tags[$ in $requiredTags].size() > 0
  ].{
    id,
    name,
    price,
    rating,
    matchedTags: tags[$ in $requiredTags],
    priceCategory: price > 500 ? "Premium" : "Budget"
  }.sort(=> -rating)
`)

// ===== AGGREGATION PATTERNS =====

// Multi-level aggregation
const salesData = {
  transactions: [
    { date: '2023-01-15', amount: 100, category: 'Food', region: 'North', customer: { age: 25, type: 'Premium' } },
    { date: '2023-01-15', amount: 200, category: 'Electronics', region: 'South', customer: { age: 35, type: 'Regular' } },
    { date: '2023-01-16', amount: 150, category: 'Food', region: 'North', customer: { age: 45, type: 'Premium' } },
    { date: '2023-01-16', amount: 300, category: 'Electronics', region: 'North', customer: { age: 30, type: 'Premium' } },
  ]
}

const multiLevelAggregation = jora(`
  $byDate: transactions.group(=> date);
  $byDate.map(=> {
    date: key,
    totalAmount: value.sum(=> amount),
    transactionCount: value.size(),
    avgAmount: value.avg(=> amount),
    byCategory: value.group(=> category).map(=> {
      category: key,
      amount: value.sum(=> amount),
      count: value.size()
    }).sort(=> -amount),
    byRegion: value.group(=> region).map(=> {
      region: key,
      amount: value.sum(=> amount),
      customerTypes: value.customer.type.unique()
    }),
    customerDemographics: {
      avgAge: value.avg(=> customer.age),
      premiumCustomers: value[customer.type = "Premium"].size(),
      regularCustomers: value[customer.type = "Regular"].size()
    }
  }).sort(=> date)
`)

// ===== PERFORMANCE OPTIMIZATION PATTERNS =====

// Efficient large dataset processing
const optimizedProcessing = jora(`
  # Process in chunks to avoid memory issues
  $chunkSize: 1000;
  $chunks: [0, 1000, 2000, 3000, 4000].map(=> items[$:$ + $chunkSize]);
  
  $chunks.map(=> 
    [active and category = "important"]
    .{ id, name, priority: priority or 0 }
    .sort(=> -priority)
    [0:10]  # Top 10 from each chunk
  ).....sort(=> -priority)[0:50]  # Final top 50
`)

// Cached computation patterns
const cachedComputation = jora(`
  $expensiveCalc: => {
    # Cache expensive operations by using variables
    complexValue: data.filter(=> complex.condition).sum(=> expensive.calculation),
    processed: processed.data.transform()
  };
  
  items.map(=> {
    id,
    name,
    # Reuse cached calculation
    normalizedValue: value / $expensiveCalc.complexValue,
    category: $expensiveCalc.processed.categories[id]
  })
`)

// ===== DYNAMIC QUERY BUILDING =====

// Query builder pattern
class JoraDynamicQueryBuilder {
  private filters: string[] = []
  private transformations: string[] = []
  private sorts: string[] = []
  private variables: Record<string, unknown> = {}

  addFilter(condition: string): this {
    this.filters.push(condition)
    return this
  }

  addTransformation(transform: string): this {
    this.transformations.push(transform)
    return this
  }

  addSort(sortBy: string): this {
    this.sorts.push(sortBy)
    return this
  }

  setVariable(name: string, value: unknown): this {
    this.variables[name] = value
    return this
  }

  build(): { query: string; context: Record<string, unknown> } {
    let query = 'items'
    
    // Add filters
    if (this.filters.length > 0) {
      query += `[${this.filters.join(' and ')}]`
    }
    
    // Add transformations
    if (this.transformations.length > 0) {
      query += `.{${this.transformations.join(', ')}}`
    }
    
    // Add sorting
    if (this.sorts.length > 0) {
      query += `.sort(=> ${this.sorts.join(', ')})`
    }

    return { query, context: this.variables }
  }
}

// Usage
const dynamicQuery = new JoraDynamicQueryBuilder()
  .setVariable('minAge', 25)
  .setVariable('department', 'Engineering')
  .addFilter('age >= $minAge')
  .addFilter('department = $department')
  .addTransformation('name')
  .addTransformation('age')
  .addTransformation('seniority: age > 30 ? "Senior" : "Junior"')
  .addSort('name')
  .build()

const compiledQuery = jora(dynamicQuery.query)
// Use: compiledQuery(data, dynamicQuery.context)

// ===== PATTERN MATCHING =====

// Complex pattern matching
const patternMatching = jora(`
  items.map(=> 
    type = "user" ? {
      entityType: "user",
      displayName: profile.firstName + " " + profile.lastName,
      permissions: roles.permissions...,
      metadata: { userType: "person" }
    } :
    type = "organization" ? {
      entityType: "organization", 
      displayName: name,
      permissions: defaultPermissions,
      metadata: { userType: "company", size: employees.size() }
    } :
    type = "system" ? {
      entityType: "system",
      displayName: systemName,
      permissions: adminPermissions,
      metadata: { userType: "automated" }
    } :
    {
      entityType: "unknown",
      displayName: name or id,
      permissions: [],
      metadata: { userType: "unknown" }
    }
  )
`)

// ===== ERROR HANDLING PATTERNS =====

// Defensive programming with Jora
const defensiveQuery = jora(`
  # Safe property access with defaults
  users.map(=> {
    id: id or "unknown",
    name: profile.name or firstName + " " + lastName or "Anonymous",
    email: contact.email or emails[0] or "no-email@example.com",
    age: profile.age or birthDate.year ? (2023 - birthDate.year) : null,
    department: department.name or "Unassigned",
    active: active = true,  # Default to true if undefined
    metadata: {
      hasProfile: profile ? true : false,
      contactMethods: [
        contact.email ? "email" : null,
        contact.phone ? "phone" : null,
        contact.address ? "address" : null
      ][],  # Remove nulls
      permissions: permissions.size() or 0
    }
  })
`)

// ===== STATISTICAL ANALYSIS PATTERNS =====

// Advanced statistical operations
const statisticalAnalysis = jora(`
  $values: data.values[$ != null and $ != undefined];
  $sorted: $values.sort();
  $count: $values.size();
  
  {
    descriptiveStats: {
      count: $count,
      sum: $values.sum(),
      mean: $values.avg(),
      min: $values.min(),
      max: $values.max(),
      range: $values.max() - $values.min()
    },
    percentiles: {
      q1: $sorted[($count * 0.25).floor()],
      median: $sorted[($count * 0.5).floor()],
      q3: $sorted[($count * 0.75).floor()],
      p90: $sorted[($count * 0.9).floor()],
      p95: $sorted[($count * 0.95).floor()],
      p99: $sorted[($count * 0.99).floor()]
    },
    distribution: $values.group().map(=> {
      value: key,
      frequency: value.size(),
      percentage: (value.size() / $count * 100).toFixed(2) + "%"
    }).sort(=> -frequency)
  }
`)

// ===== TIME SERIES ANALYSIS =====

// Time-based data analysis
const timeSeriesAnalysis = jora(`
  $parseDate: => new Date($);
  $groupByMonth: => $parseDate().getFullYear() + "-" + ($parseDate().getMonth() + 1).toString().padStart(2, "0");
  
  $timeSeries: events.group($groupByMonth).map(=> {
    period: key,
    events: value.size(),
    uniqueUsers: value.userId.unique().size(),
    totalValue: value.sum(=> amount),
    avgValue: value.avg(=> amount),
    categories: value.group(=> category).map(=> {
      category: key,
      count: value.size(),
      percentage: (value.size() / @.events * 100).toFixed(1) + "%"
    })
  }).sort(=> period);
  
  {
    summary: {
      totalPeriods: $timeSeries.size(),
      totalEvents: $timeSeries.sum(=> events),
      avgEventsPerPeriod: $timeSeries.avg(=> events),
      growthRate: $timeSeries.size() > 1 ? 
        (($timeSeries[-1].events - $timeSeries[0].events) / $timeSeries[0].events * 100).toFixed(2) + "%" :
        "N/A"
    },
    timeSeries: $timeSeries
  }
`)

// ===== EXPORT PATTERNS FOR REUSE =====

export const advancedPatterns = {
  nestedTransform,
  recursiveFlatten,
  treeStats,
  advancedFilter,
  multiLevelAggregation,
  optimizedProcessing,
  cachedComputation,
  patternMatching,
  defensiveQuery,
  statisticalAnalysis,
  timeSeriesAnalysis
}

export {
  JoraDynamicQueryBuilder,
  nestedData,
  treeData,
  complexData,
  salesData
}