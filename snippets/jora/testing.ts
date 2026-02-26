// Testing Examples for Jora Query Language
import { describe, test, it, expect, beforeEach, afterEach } from 'bun:test'
import jora from 'jora'
import type { JoraQuery } from 'jora'

// ===== TEST DATA SETUP =====

const createTestData = () => ({
  users: [
    { id: 1, name: 'Alice', age: 30, department: 'Engineering', active: true, salary: 90000, skills: ['JavaScript', 'TypeScript'] },
    { id: 2, name: 'Bob', age: 25, department: 'Engineering', active: true, salary: 70000, skills: ['Python', 'Go'] },
    { id: 3, name: 'Carol', age: 35, department: 'Marketing', active: false, salary: 80000, skills: ['Marketing', 'Analytics'] },
    { id: 4, name: 'Dave', age: 28, department: 'Sales', active: true, salary: 60000, skills: ['Sales', 'CRM'] }
  ],
  projects: [
    { id: 1, name: 'Project Alpha', status: 'active', teamSize: 3, budget: 100000, deadline: '2024-06-01' },
    { id: 2, name: 'Project Beta', status: 'completed', teamSize: 2, budget: 50000, deadline: '2023-12-01' },
    { id: 3, name: 'Project Gamma', status: 'planning', teamSize: 5, budget: 150000, deadline: '2024-09-01' }
  ],
  metadata: {
    lastUpdated: '2023-12-01T10:00:00Z',
    version: '1.0.0'
  }
})

// ===== BASIC QUERY TESTING =====

describe('Jora Basic Queries', () => {
  let testData: ReturnType<typeof createTestData>

  beforeEach(() => {
    testData = createTestData()
  })

  test('should access basic properties', () => {
    const query = jora('users.name')
    const result = query(testData)
    
    expect(result).toEqual(['Alice', 'Bob', 'Carol', 'Dave'])
  })

  test('should filter arrays', () => {
    const query = jora('users[active = true]')
    const result = query(testData)
    
    expect(result).toHaveLength(3)
    expect(result.every((user: any) => user.active)).toBe(true)
  })

  test('should handle array slicing', () => {
    const query = jora('users[0:2].name')
    const result = query(testData)
    
    expect(result).toEqual(['Alice', 'Bob'])
  })

  test('should sort arrays', () => {
    const query = jora('users.sort(=> name).name')
    const result = query(testData)
    
    expect(result).toEqual(['Alice', 'Bob', 'Carol', 'Dave'])
  })

  test('should sort in descending order', () => {
    const query = jora('users.sort(=> -age).name')
    const result = query(testData)
    
    expect(result).toEqual(['Carol', 'Alice', 'Dave', 'Bob'])
  })
})

// ===== AGGREGATION TESTING =====

describe('Jora Aggregation Functions', () => {
  let testData: ReturnType<typeof createTestData>

  beforeEach(() => {
    testData = createTestData()
  })

  test('should count items', () => {
    const query = jora('users.size()')
    const result = query(testData)
    
    expect(result).toBe(4)
  })

  test('should sum values', () => {
    const query = jora('users.sum(=> salary)')
    const result = query(testData)
    
    expect(result).toBe(300000) // 90000 + 70000 + 80000 + 60000
  })

  test('should calculate average', () => {
    const query = jora('users.avg(=> age)')
    const result = query(testData)
    
    expect(result).toBe(29.5) // (30 + 25 + 35 + 28) / 4
  })

  test('should find minimum', () => {
    const query = jora('users.min(=> salary)')
    const result = query(testData)
    
    expect(result).toBe(60000)
  })

  test('should find maximum', () => {
    const query = jora('users.max(=> salary)')
    const result = query(testData)
    
    expect(result).toBe(90000)
  })
})

// ===== GROUPING TESTING =====

describe('Jora Grouping Operations', () => {
  let testData: ReturnType<typeof createTestData>

  beforeEach(() => {
    testData = createTestData()
  })

  test('should group by department', () => {
    const query = jora('users.group(=> department)')
    const result = query(testData)
    
    expect(result).toHaveProperty('Engineering')
    expect(result).toHaveProperty('Marketing') 
    expect(result).toHaveProperty('Sales')
    expect(result.Engineering).toHaveLength(2)
  })

  test('should create grouped statistics', () => {
    const query = jora(`
      users.group(=> department).map(=> {
        department: key,
        count: value.size(),
        avgSalary: value.avg(=> salary)
      })
    `)
    const result = query(testData)
    
    expect(result).toHaveLength(3)
    const engineering = result.find((dept: any) => dept.department === 'Engineering')
    expect(engineering.count).toBe(2)
    expect(engineering.avgSalary).toBe(80000) // (90000 + 70000) / 2
  })
})

// ===== TRANSFORMATION TESTING =====

describe('Jora Data Transformation', () => {
  let testData: ReturnType<typeof createTestData>

  beforeEach(() => {
    testData = createTestData()
  })

  test('should transform objects', () => {
    const query = jora('users.{ id, name, isAdult: age >= 18 }')
    const result = query(testData)
    
    expect(result).toHaveLength(4)
    expect(result[0]).toMatchObject({
      id: 1,
      name: 'Alice',
      isAdult: true
    })
  })

  test('should handle nested transformations', () => {
    const query = jora(`
      users.{
        id,
        name,
        department,
        profile: {
          age,
          seniority: age > 30 ? "Senior" : "Junior",
          active
        }
      }
    `)
    const result = query(testData)
    
    expect(result[0].profile).toMatchObject({
      age: 30,
      seniority: 'Junior',
      active: true
    })
    expect(result[2].profile.seniority).toBe('Senior') // Carol, age 35
  })
})

// ===== CONTEXT VARIABLE TESTING =====

describe('Jora Context Variables', () => {
  let testData: ReturnType<typeof createTestData>

  beforeEach(() => {
    testData = createTestData()
  })

  test('should use context variables in queries', () => {
    const query = jora('users[age > $minAge].name')
    const result = query(testData, { minAge: 27 })
    
    expect(result).toEqual(['Alice', 'Carol', 'Dave'])
  })

  test('should use multiple context variables', () => {
    const query = jora('users[age > $minAge and department = $dept].name')
    const result = query(testData, { minAge: 25, dept: 'Engineering' })
    
    expect(result).toEqual(['Alice'])
  })

  test('should handle missing context variables gracefully', () => {
    const query = jora('users[salary > $minSalary or $minSalary = undefined].name')
    const result = query(testData, {})
    
    expect(result).toEqual(['Alice', 'Bob', 'Carol', 'Dave']) // All users when undefined
  })
})

// ===== ERROR HANDLING TESTING =====

describe('Jora Error Handling', () => {
  let testData: ReturnType<typeof createTestData>

  beforeEach(() => {
    testData = createTestData()
  })

  test('should handle missing properties gracefully', () => {
    const query = jora('users.profile.avatar.url')
    const result = query(testData)
    
    expect(result).toEqual([]) // Returns empty array instead of error
  })

  test('should handle array access out of bounds', () => {
    const query = jora('users[999].name')
    const result = query(testData)
    
    expect(result).toBeUndefined() // Returns undefined instead of error
  })

  test('should handle null/undefined data', () => {
    const query = jora('users.name')
    const result = query({ users: null })
    
    expect(result).toEqual([])
  })

  test('should handle invalid syntax gracefully', () => {
    expect(() => {
      jora('users[invalid > syntax')
    }).toThrow()
  })
})

// ===== COMPLEX QUERY TESTING =====

describe('Jora Complex Queries', () => {
  let testData: ReturnType<typeof createTestData>

  beforeEach(() => {
    testData = createTestData()
  })

  test('should handle complex filtering and transformation', () => {
    const query = jora(`
      users[active and age > 25].{
        name,
        department,
        skills: skills.size(),
        salaryGrade: salary > 75000 ? "High" : "Standard"
      }.sort(=> -salary)
    `)
    const result = query(testData)
    
    expect(result).toHaveLength(2) // Alice and Dave
    expect(result[0].name).toBe('Alice') // Highest salary
    expect(result[0].salaryGrade).toBe('High')
  })

  test('should handle multi-level grouping', () => {
    const query = jora(`
      users.group(=> department).map(=> {
        department: key,
        stats: {
          count: value.size(),
          avgAge: value.avg(=> age),
          totalSalary: value.sum(=> salary)
        },
        activeCount: value[active].size()
      })
    `)
    const result = query(testData)
    
    const engineering = result.find((dept: any) => dept.department === 'Engineering')
    expect(engineering.stats.count).toBe(2)
    expect(engineering.activeCount).toBe(2)
  })
})

// ===== PERFORMANCE TESTING =====

describe('Jora Performance Tests', () => {
  test('should handle large datasets efficiently', () => {
    // Create large test dataset
    const largeData = {
      items: Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: Math.random() * 100,
        category: `category_${i % 10}`,
        active: Math.random() > 0.5
      }))
    }

    const query = jora('items[active and value > 50].{ id, value, category }.sort(=> -value)[0:100]')
    
    const start = performance.now()
    const result = query(largeData)
    const end = performance.now()
    
    expect(result.length).toBeLessThanOrEqual(100)
    expect(end - start).toBeLessThan(100) // Should complete within 100ms
  })

  test('should cache compiled queries for reuse', () => {
    const queryString = 'users[active].name.sort()'
    const compiledQuery = jora(queryString)
    const testData = createTestData()
    
    const iterations = 1000
    const start = performance.now()
    
    for (let i = 0; i < iterations; i++) {
      compiledQuery(testData)
    }
    
    const end = performance.now()
    const avgTime = (end - start) / iterations
    
    expect(avgTime).toBeLessThan(1) // Should average less than 1ms per query
  })
})

// ===== CUSTOM TEST UTILITIES =====

// Test helper for creating query test cases
interface QueryTestCase {
  name: string
  query: string
  data?: unknown
  context?: Record<string, unknown>
  expected: unknown
}

function createQueryTests(testCases: QueryTestCase[]) {
  return testCases.forEach(({ name, query, data, context, expected }) => {
    test(name, () => {
      const joraQuery = jora(query)
      const result = joraQuery(data || createTestData(), context)
      expect(result).toEqual(expected)
    })
  })
}

// Example test cases
const queryTestCases: QueryTestCase[] = [
  {
    name: 'should filter and count active users',
    query: 'users[active].size()',
    expected: 3
  },
  {
    name: 'should get user names in Engineering',
    query: 'users[department = "Engineering"].name',
    expected: ['Alice', 'Bob']
  },
  {
    name: 'should calculate total project budget',
    query: 'projects.sum(=> budget)',
    expected: 300000
  }
]

describe('Query Test Cases', () => {
  createQueryTests(queryTestCases)
})

// ===== MOCK DATA GENERATOR =====

// Utility for generating test data
export const createMockData = (userCount = 10, projectCount = 5) => ({
  users: Array.from({ length: userCount }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    age: Math.floor(Math.random() * 40) + 20,
    department: ['Engineering', 'Marketing', 'Sales', 'HR'][i % 4],
    active: Math.random() > 0.3,
    salary: Math.floor(Math.random() * 50000) + 50000,
    skills: [`Skill ${i}`, `Skill ${i + 1}`]
  })),
  projects: Array.from({ length: projectCount }, (_, i) => ({
    id: i + 1,
    name: `Project ${String.fromCharCode(65 + i)}`,
    status: ['active', 'completed', 'planning'][i % 3],
    teamSize: Math.floor(Math.random() * 8) + 2,
    budget: Math.floor(Math.random() * 200000) + 50000,
    deadline: `2024-${String(i % 12 + 1).padStart(2, '0')}-01`
  }))
})

// ===== REGRESSION TESTING =====

describe('Jora Regression Tests', () => {
  test('should maintain consistent behavior across versions', () => {
    const testData = createTestData()
    
    // Test cases that should remain consistent
    const regressionTests = [
      { query: 'users.size()', expected: 4 },
      { query: 'users[active].size()', expected: 3 },
      { query: 'users.name.sort()[0]', expected: 'Alice' },
      { query: 'projects[status = "active"].size()', expected: 1 }
    ]
    
    regressionTests.forEach(({ query, expected }) => {
      const result = jora(query)(testData)
      expect(result).toBe(expected)
    })
  })
})

// ===== INTEGRATION TESTING WITH MOCK APIs =====

describe('Jora API Integration Tests', () => {
  const mockApiResponse = {
    data: {
      users: [
        { id: 1, name: 'Alice', profile: { age: 30, active: true } },
        { id: 2, name: 'Bob', profile: { age: 25, active: false } }
      ]
    },
    meta: { total: 2, page: 1 }
  }

  test('should process API responses correctly', () => {
    const query = jora('data.users.{ id, name, age: profile.age, active: profile.active }')
    const result = query(mockApiResponse)
    
    expect(result).toEqual([
      { id: 1, name: 'Alice', age: 30, active: true },
      { id: 2, name: 'Bob', age: 25, active: false }
    ])
  })

  test('should extract metadata', () => {
    const query = jora('{ userCount: data.users.size(), pagination: meta }')
    const result = query(mockApiResponse)
    
    expect(result).toEqual({
      userCount: 2,
      pagination: { total: 2, page: 1 }
    })
  })
})

// ===== EXPORT TEST UTILITIES =====

export {
  createTestData,
  createMockData,
  createQueryTests,
  queryTestCases,
  type QueryTestCase
}