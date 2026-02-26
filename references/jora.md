# Jora Reference

**Always remember to reference ./references/jora.md and look for snippets and examples in ./snippets/jora/**

## Quick Reference

- Installation: `bun add jora`
- CLI Tool: `bun add -g jora-cli`
- Import: `import jora from 'jora'`
- Documentation: <https://discoveryjs.github.io/jora/>
- GitHub: <https://github.com/discoveryjs/jora>
- Package: <https://www.npmjs.com/package/jora>

## Default Usage Patterns

Jora is a JavaScript object query language designed for JSON data processing with:

- **Tolerant Querying**: Graceful handling of complex data structures
- **Compact Syntax**: Concise expressions for common data operations
- **Functional Approach**: Supports filtering, mapping, and aggregation
- **JSON5 Extension**: Extended JSON syntax with JavaScript-like features
- **Variable Support**: Define and reuse variables within queries
- **Custom Functions**: Create domain-specific functions using arrow syntax

## Resources and Documentation

- [Jora Documentation](https://discoveryjs.github.io/jora/)
  - [Getting Started](https://discoveryjs.github.io/jora/)
  - [Syntax Reference](https://discoveryjs.github.io/jora/)
  - [Built-in Methods](https://discoveryjs.github.io/jora/)
- [GitHub Repository](https://github.com/discoveryjs/jora)
  - [README](https://github.com/discoveryjs/jora#readme)
  - [Examples](https://github.com/discoveryjs/jora/tree/master/examples)
  - [Tests](https://github.com/discoveryjs/jora/tree/master/test)
- [Related Projects](https://github.com/discoveryjs)
  - [jora-cli](https://github.com/discoveryjs/jora-cli) - Command-line interface
  - [Discovery](https://github.com/discoveryjs/discovery) - Data analysis framework
  - [discovery-cli](https://github.com/discoveryjs/discovery-cli) - CLI for Discovery framework
  - [JsonDiscovery](https://github.com/discoveryjs/browser-extension-json-discovery) - Browser extension

## Core Concepts

### Query Language Features

- **Tolerant to data structure queries** - Returns nothing for unreachable paths instead of errors
- **Eliminates duplicates by default** - Automatic deduplication in results
- **Compact syntax** - Minimal code for common data transformations
- **Stat collecting** - Performance and usage statistics
- **Editor suggestions** - Support for development tooling

### Data Processing Capabilities

- JSON-like data structure querying
- Array and object manipulation
- Filtering, mapping, and reducing operations
- Grouping and aggregation functions
- Sorting and ordering operations
- Recursive data traversal

## Core API

### Basic Usage

```typescript
import jora from 'jora'

// Create query
const query = jora('users.name.sort()')

// Execute query
const data = { users: [{ name: 'Bob' }, { name: 'Alice' }] }
const result = query(data) // ['Alice', 'Bob']
```

### Query Creation

```typescript
// Simple property access
const getNames = jora('users.name')

// With context
const query = jora('users[id=$userId].name')
const result = query(data, { userId: 123 })
```

### Advanced Queries

```typescript
// Complex filtering and transformation
const complexQuery = jora(`
  $activeUsers: users[status = "active"];
  $activeUsers.{
    name,
    email,
    joinDate: created.toISOString()
  }.sort(=> name)
`)
```

## Syntax Patterns

### Property Access

```typescript
// Dot notation
'user.profile.name'

// Bracket notation  
'user["profile"]["name"]'

// Safe navigation (returns nothing if path doesn't exist)
'user.profile?.avatar?.url'
```

### Array Operations

```typescript
// Array filtering
'users[age > 18]'

// Array mapping
'users.name'

// Array slicing
'users[0:5]'  // First 5 items
'users[-3:]'  // Last 3 items
```

### Built-in Methods

```typescript
// Filtering
'users.filter(=> age >= 21)'

// Mapping
'users.map(=> { name, email })'

// Sorting
'users.sort(=> name)'
'users.sort(=> -age)'  // Descending

// Grouping
'users.group(=> department)'

// Reducing
'users.reduce(=> sum + age, 0)'

// Aggregation
'sales.sum(=> amount)'
'products.avg(=> price)'
'items.count()'
```

### Variables and Functions

```typescript
// Variable definition
'$totalSales: sales.sum(=> amount); $totalSales / users.size()'

// Custom functions
'$formatUser: => { fullName: name + " " + surname, age }; users.$formatUser()'

// Arrow functions
'users.filter(=> age > 18 and status = "active")'
```

### Operators

```typescript
// Arithmetic
'price * quantity'
'total - discount'

// Comparison  
'age >= 18'
'status = "active"'
'price != 0'

// Logical
'age > 18 and status = "active"'
'category = "premium" or vip = true'
'not deleted'

// String operations
'name + " " + surname'
'description ~= /pattern/i'  // Regex match
```

## CLI Usage (jora-cli)

### Installation

```bash
# Global installation
bun add -g jora-cli

# Local installation
bun add jora-cli
```

### Basic Commands

```bash
# Query from file
jora -i data.json -q 'users.name'

# Query from stdin
cat data.json | jora 'users[age > 18].name'

# Output to file
jora -i input.json -o output.json -q 'users.filter(=> active)'

# Pretty print
jora -p -q 'users.group(=> department)' < data.json
```

### Advanced Options

```bash
# Compressed input/output
jora -i data.json.gz -o result.json.gz -c gzip -q 'processed.data'

# Different encoding formats
jora -e jsonxl -q 'large.dataset' < big-data.json

# Count items
jora -q 'users.size()' < data.json

# Complex aggregation
jora -q 'sales.group(=> month).map(=> { month: key, total: value.sum(=> amount) })' < sales.json
```

## Discovery.js Integration

### Framework Usage

Discovery.js is a companion framework for ad hoc JSON data analysis that uses Jora as its query engine:

```typescript
// Using Discovery for data exploration
import { createApp } from '@discoveryjs/discovery'

const app = createApp({
  name: 'Data Explorer',
  data: myJsonData,
  queries: {
    users: 'users',
    activeUsers: 'users[status = "active"]',
    usersByDepartment: 'users.group(=> department)'
  }
})
```

## Performance Patterns

### Efficient Queries

```typescript
// Good: Filter early
'users[active].name.sort()'

// Less efficient: Sort then filter
'users.name.sort()[$ in activeUserNames]'

// Good: Use built-in aggregations
'sales.sum(=> amount)'

// Less efficient: Manual reduce
'sales.reduce(=> sum + amount, 0)'
```

### Memory Optimization

```typescript
// Process in chunks for large datasets
'largeArray[0:1000].process().concat(largeArray[1000:2000].process())'

// Use streaming for CLI operations
'cat huge-file.json | jora "items.filter(=> important)" > filtered.json'
```

## Error Handling

### Tolerant Querying

```typescript
// Jora handles missing properties gracefully
'users.profile.avatar.url'  // Returns nothing if any property is missing

// Safe array access
'items[999].name'  // Returns nothing instead of error

// Optional chaining equivalent
'data?.deeply?.nested?.value'
```

### Debugging Queries

```typescript
// Use stat collecting for performance analysis
const query = jora('complex.query.here', { stat: true })
const result = query(data)
console.log(query.stat)  // Performance statistics
```

## Code Examples Location

Comprehensive examples available in `./snippets/jora/`:

- Basic query patterns
- Data transformation examples
- CLI usage scenarios
- Discovery.js integration
- Performance optimization techniques
- Real-world use cases
- Error handling strategies
- Testing patterns

## Linting and Formatting

Configuration files available in `./snippets/jora/linting/`

## Use Cases and Patterns

### Data Analysis

- JSON log file analysis
- API response processing
- Configuration file querying
- Database result transformation

### Reporting

- Generate summaries from large datasets
- Extract metrics and KPIs
- Create data aggregations
- Filter and format data for presentation

### Development Tools

- Bundle analysis (webpack, rollup)
- Package.json dependency analysis
- Test result processing
- Build artifact inspection

### Content Management

- Process CMS data exports
- Transform content structures
- Generate sitemaps and indexes
- Validate data consistency

## Migration and Integration

### From Other Query Languages

```typescript
// JSONPath equivalent
// JSONPath: $.store.book[*].author
// Jora: 'store.book.author'

// jq equivalent  
// jq: '.users | map(select(.age > 18)) | sort_by(.name)'
// Jora: 'users[age > 18].sort(=> name)'
```

### Integration with Node.js Applications

```typescript
import jora from 'jora'
import fs from 'node:fs'

// Load and process JSON data
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'))
const query = jora('users[active].{ name, email, department }')
const activeUsers = query(data)

// Use in Express.js API
app.get('/api/users/:filter', (req, res) => {
  const filterQuery = jora(`users[${req.params.filter}]`)
  res.json(filterQuery(userData))
})
```

### Browser Integration

```html
<script type="module">
import jora from 'https://cdn.skypack.dev/jora'

const query = jora('items.filter(=> category = "featured")')
const featuredItems = query(window.appData)
</script>
```

## Advanced Features

### Custom Function Definition

```typescript
// Define reusable functions
const customQuery = jora(`
  $formatPrice: => "$" + ($ / 100).toFixed(2);
  $isExpensive: => $ > 10000;
  
  products[$isExpensive()].{
    name,
    price: price.$formatPrice(),
    category
  }
`)
```

### Complex Data Transformations

```typescript
// Nested grouping and aggregation
const complexTransform = jora(`
  $byCategory: items.group(=> category);
  $byCategory.map(=> {
    category: key,
    items: value,
    totalValue: value.sum(=> price * quantity),
    itemCount: value.size(),
    avgPrice: value.avg(=> price)
  }).sort(=> -totalValue)
`)
```

### Recursive Processing

```typescript
// Process nested tree structures
const treeQuery = jora(`
  $flatten: => [
    $,
    children.$flatten()...
  ];
  
  root.$flatten()[type = "file"]
`)
```
