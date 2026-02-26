// Basic Usage Examples for Jora Query Language
import jora from 'jora'

// ===== INSTALLATION =====
// bun add jora
// bun add -g jora-cli  # For CLI usage

// ===== BASIC QUERY CREATION =====

// Simple property access
const getNames = jora('users.name')
const data = { 
  users: [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ]
}
console.log(getNames(data)) // ['Alice', 'Bob']

// Bracket notation
const getBracket = jora('users["name"]')
console.log(getBracket(data)) // ['Alice', 'Bob']

// ===== ARRAY OPERATIONS =====

// Array filtering
const adults = jora('users[age >= 18]')
console.log(adults(data)) // Both users (ages 30, 25)

// Array slicing
const firstUser = jora('users[0:1]')
console.log(firstUser(data)) // [{ name: 'Alice', age: 30 }]

// Last n items
const lastUser = jora('users[-1:]')
console.log(lastUser(data)) // [{ name: 'Bob', age: 25 }]

// ===== OBJECT TRANSFORMATION =====

// Create new object structure
const transform = jora('users.{ name, isAdult: age >= 18 }')
console.log(transform(data))
// [
//   { name: 'Alice', isAdult: true },
//   { name: 'Bob', isAdult: true }
// ]

// ===== SORTING =====

// Sort by name
const sortedByName = jora('users.sort(=> name)')
console.log(sortedByName(data))

// Sort by age (descending)
const sortedByAge = jora('users.sort(=> -age)')
console.log(sortedByAge(data))

// ===== BUILT-IN METHODS =====

// Count items
const userCount = jora('users.size()')
console.log(userCount(data)) // 2

// Sum values
const totalAge = jora('users.sum(=> age)')
console.log(totalAge(data)) // 55

// Average
const avgAge = jora('users.avg(=> age)')
console.log(avgAge(data)) // 27.5

// ===== VARIABLES =====

// Define and reuse variables
const withVariables = jora(`
  $minAge: 20;
  users[age >= $minAge].name
`)
console.log(withVariables(data)) // ['Alice', 'Bob']

// ===== CONTEXT USAGE =====

// Query with context parameters
const contextQuery = jora('users[age > $minAge].name')
const result = contextQuery(data, { minAge: 25 })
console.log(result) // ['Alice']

// ===== ERROR HANDLING (TOLERANT QUERIES) =====

// Safe property access - returns nothing if property doesn't exist
const safeAccess = jora('users.profile.avatar.url')
console.log(safeAccess(data)) // [] (empty array, no error)

// Safe array access
const safeIndex = jora('users[99].name')
console.log(safeIndex(data)) // nothing/undefined (no error)

// ===== CHAINING OPERATIONS =====

// Complex query chain
const complexData = {
  departments: [
    {
      name: 'Engineering',
      employees: [
        { name: 'Alice', role: 'Senior Dev', salary: 90000 },
        { name: 'Bob', role: 'Junior Dev', salary: 60000 }
      ]
    },
    {
      name: 'Marketing', 
      employees: [
        { name: 'Carol', role: 'Manager', salary: 80000 }
      ]
    }
  ]
}

const chainedQuery = jora(`
  departments
    .employees...
    [salary > 70000]
    .{ name, role, salary }
    .sort(=> -salary)
`)
console.log(chainedQuery(complexData))
// [
//   { name: 'Alice', role: 'Senior Dev', salary: 90000 },
//   { name: 'Carol', role: 'Manager', salary: 80000 }
// ]

// ===== GROUPING =====

// Group by property
const employees = [
  { name: 'Alice', department: 'Engineering', salary: 90000 },
  { name: 'Bob', department: 'Engineering', salary: 60000 },
  { name: 'Carol', department: 'Marketing', salary: 80000 }
]

const groupQuery = jora('group(=> department)')
console.log(groupQuery(employees))
// Groups employees by department

// ===== CUSTOM FUNCTIONS =====

// Define custom transformation function
const customFunction = jora(`
  $formatEmployee: => {
    fullName: name,
    dept: department,
    salaryFormatted: "$" + (salary / 1000) + "k"
  };
  $formatEmployee()
`)

console.log(customFunction(employees[0]))
// { fullName: 'Alice', dept: 'Engineering', salaryFormatted: '$90k' }

// ===== PRACTICAL EXAMPLES =====

// Process API response
const apiResponse = {
  data: {
    users: [
      { id: 1, name: 'John', posts: [{ title: 'Hello' }, { title: 'World' }] },
      { id: 2, name: 'Jane', posts: [{ title: 'Jora' }, { title: 'Rocks' }] }
    ]
  },
  meta: { total: 2, page: 1 }
}

const processApi = jora(`
  data.users.{
    id,
    name,
    postCount: posts.size(),
    postTitles: posts.title
  }
`)
console.log(processApi(apiResponse))

// Filter and aggregate
const analytics = jora(`
  $activeUsers: data.users[posts.size() > 0];
  {
    totalUsers: data.users.size(),
    activeUsers: $activeUsers.size(),
    totalPosts: data.users.posts....size(),
    avgPostsPerUser: data.users.posts.size().avg()
  }
`)
console.log(analytics(apiResponse))

export {
  getNames,
  adults,
  transform,
  sortedByName,
  userCount,
  totalAge,
  withVariables,
  contextQuery,
  chainedQuery,
  groupQuery,
  customFunction,
  processApi,
  analytics
}