// CLI Examples for Jora Query Language (jora-cli)
// These examples demonstrate command-line usage patterns

// ===== INSTALLATION =====
// bun add -g jora-cli
// Or locally: bun add jora-cli

// ===== BASIC CLI USAGE =====

/*
# Basic query from file
jora -i data.json -q 'users.name'

# Query from stdin
cat data.json | jora 'users[age > 18].name'

# Output to file
jora -i input.json -o output.json -q 'users.filter(=> active)'
*/

// ===== SAMPLE DATA FILES =====

// Example data.json
export const sampleData = {
  users: [
    { id: 1, name: 'Alice', age: 30, department: 'Engineering', active: true, salary: 90000 },
    { id: 2, name: 'Bob', age: 25, department: 'Engineering', active: true, salary: 70000 },
    { id: 3, name: 'Carol', age: 35, department: 'Marketing', active: false, salary: 80000 },
    { id: 4, name: 'Dave', age: 28, department: 'Sales', active: true, salary: 60000 }
  ],
  departments: [
    { name: 'Engineering', budget: 500000, headCount: 10 },
    { name: 'Marketing', budget: 200000, headCount: 5 },
    { name: 'Sales', budget: 300000, headCount: 8 }
  ],
  projects: [
    { name: 'Project A', status: 'completed', budget: 50000, team: ['Alice', 'Bob'] },
    { name: 'Project B', status: 'active', budget: 75000, team: ['Carol', 'Dave'] },
    { name: 'Project C', status: 'planning', budget: 100000, team: ['Alice'] }
  ]
}

// ===== COMMAND LINE EXAMPLES =====

// Generate shell scripts for common operations
export const cliCommands = {
  // Basic queries
  basicQueries: [
    'jora -i data.json -q "users.name"',
    'jora -i data.json -q "users[age > 25].name"',
    'jora -i data.json -q "users.{ name, department }"',
    'jora -i data.json -q "users.size()"'
  ],

  // Filtering operations
  filtering: [
    'jora -i data.json -q "users[active]"',
    'jora -i data.json -q "users[department = \\"Engineering\\"]"',
    'jora -i data.json -q "users[salary > 70000].name"',
    'jora -i data.json -q "projects[status != \\"completed\\"]"'
  ],

  // Aggregation and grouping
  aggregation: [
    'jora -i data.json -q "users.sum(=> salary)"',
    'jora -i data.json -q "users.avg(=> age)"',
    'jora -i data.json -q "users.group(=> department)"',
    'jora -i data.json -q "users.group(=> department).map(=> { dept: key, count: value.size() })"'
  ],

  // Sorting operations
  sorting: [
    'jora -i data.json -q "users.sort(=> name)"',
    'jora -i data.json -q "users.sort(=> -salary)"',
    'jora -i data.json -q "users.sort(=> age).name"',
    'jora -i data.json -q "departments.sort(=> -budget)"'
  ],

  // Complex transformations
  transformations: [
    'jora -i data.json -q "users.{ fullName: name, dept: department, seniorityLevel: age > 30 ? \\"Senior\\" : \\"Junior\\" }"',
    'jora -i data.json -q "departments.{ name, budgetPerPerson: budget / headCount }"',
    'jora -i data.json -q "projects[status = \\"active\\"].team....unique().sort()"'
  ]
}

// ===== ADVANCED CLI USAGE =====

export const advancedCliCommands = {
  // Pretty printing
  prettyPrint: [
    'jora -p -i data.json -q "users[0]"',
    'jora --pretty -q "users.group(=> department)" < data.json'
  ],

  // Compressed input/output
  compression: [
    'jora -i data.json.gz -q "users.name"',
    'jora -i input.json -o output.json.gz -c gzip -q "users"',
    'jora -c deflate -q "large.dataset" < big-data.json > compressed.json.deflate'
  ],

  // Different encoding formats
  encoding: [
    'jora -e jsonxl -q "users" < data.json',
    'jora -i data.jsonxl -e json -q "users.name"',
    'jora --encoding jsonxl -o binary.jsonxl -q "users" < data.json'
  ],

  // Streaming operations
  streaming: [
    'cat large-dataset.json | jora "items[important]" | head -100',
    'find . -name "*.json" -exec jora -i {} -q "data.summary" \\;',
    'ls *.json | xargs -I {} jora -i {} -q "users.size()"'
  ]
}

// ===== BATCH PROCESSING SCRIPTS =====

export const batchProcessingScripts = {
  // Process multiple files
  processMultipleFiles: `#!/bin/bash
# Process all JSON files in a directory
for file in *.json; do
  echo "Processing $file"
  jora -i "$file" -o "processed_$file" -q 'users[active].{name, email}'
done`,

  // Generate reports
  generateReports: `#!/bin/bash
# Generate various reports from data
echo "User Summary Report" > report.txt
jora -i data.json -q 'users.size()' | sed 's/^/Total Users: /' >> report.txt

echo "Department Breakdown" >> report.txt
jora -i data.json -q 'users.group(=> department).map(=> key + ": " + value.size())' >> report.txt

echo "Active Users" >> report.txt
jora -i data.json -q 'users[active].name' >> report.txt`,

  // Data validation
  dataValidation: `#!/bin/bash
# Validate data structure
echo "Checking for required fields..."
MISSING_NAMES=$(jora -i data.json -q 'users[not name].size()')
MISSING_EMAILS=$(jora -i data.json -q 'users[not email].size()')

echo "Users missing names: $MISSING_NAMES"
echo "Users missing emails: $MISSING_EMAILS"

if [ "$MISSING_NAMES" -gt 0 ] || [ "$MISSING_EMAILS" -gt 0 ]; then
  echo "Data validation failed"
  exit 1
else
  echo "Data validation passed"
fi`,

  // Performance monitoring
  performanceMonitoring: `#!/bin/bash
# Monitor query performance
echo "Running performance test..."
time jora -i large-data.json -q 'users.filter(=> active).group(=> department).map(=> {
  department: key,
  count: value.size(),
  avgSalary: value.avg(=> salary)
})'`
}

// ===== INTEGRATION EXAMPLES =====

export const integrationExamples = {
  // Use with npm scripts
  npmScripts: {
    "scripts": {
      "analyze:users": "jora -i data/users.json -q 'users.group(=> department)'",
      "report:active": "jora -i data/users.json -q 'users[active]' -o reports/active-users.json",
      "stats:summary": "jora -i data/users.json -q '{totalUsers: users.size(), avgAge: users.avg(=> age)}'"
    }
  },

  // Use with Makefile
  makefile: `
analyze: data/users.json
\tjora -i $< -q 'users.group(=> department)' -o reports/department-analysis.json

validate: data/users.json
\tjora -i $< -q 'users[not name or not email].size()' | grep -q '^0$$' || (echo "Validation failed" && exit 1)

report: data/users.json
\tjora -i $< -q 'users[active].{name, email, department}' -o reports/active-users.json
\tjora -i $< -q 'users.group(=> department).map(=> {dept: key, count: value.size()})' -o reports/department-stats.json`,

  // Use with GitHub Actions
  githubActions: `
name: Data Analysis
on: [push]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: oven-sh/setup-bun@v1
      - run: bun add -g jora-cli
      - run: jora -i data/users.json -q 'users[active].size()' > active-count.txt
      - run: jora -i data/users.json -q 'users.group(=> department)' -o department-breakdown.json`
}

// ===== DEBUGGING AND TROUBLESHOOTING =====

export const debuggingCommands = {
  // Test query syntax
  syntaxTest: [
    'jora -q "users.name" <<< "{}"',  // Test with empty object
    'echo \'{"test": "data"}\' | jora "test"',  // Quick syntax test
    'jora -q "syntax[error" <<< "{}" || echo "Syntax error detected"'
  ],

  // Performance testing
  performance: [
    'time jora -i large-data.json -q "complex.query.here"',
    'jora -i data.json -q "users" | wc -l',  // Count output lines
    '/usr/bin/time -v jora -i big-file.json -q "data.process()"'  // Detailed timing
  ],

  // Memory usage monitoring
  memory: [
    'valgrind --tool=massif jora -i huge-data.json -q "users"',
    'top -p $(pgrep jora) -d 1'  // Monitor during execution
  ]
}

// ===== REAL-WORLD USE CASES =====

export const realWorldUseCases = {
  // Log analysis
  logAnalysis: [
    'jora -i server.log.json -q "entries[level = \\"error\\"].timestamp.sort()"',
    'jora -i access.log.json -q "requests.group(=> status).map(=> {status: key, count: value.size()})"',
    'jora -i app.log.json -q "events[timestamp > \\"2023-01-01\\"].user.unique().size()"'
  ],

  // Package.json analysis
  packageAnalysis: [
    'jora -i package.json -q "dependencies.keys().sort()"',
    'jora -i package-lock.json -q "packages[].resolved.group(=> split(\\"//\\")[1].split(\\"/\\")[0]).keys()"',
    'find node_modules -name package.json -exec jora -i {} -q "{name, version, license}" \\; | jora "group(=> license)"'
  ],

  // API response processing
  apiProcessing: [
    'curl "https://api.example.com/users" | jora "data[active].{id, name, email}"',
    'curl -s "https://api.github.com/repos/user/repo/issues" | jora "[state = \\"open\\"].title"',
    'curl -s "https://jsonplaceholder.typicode.com/posts" | jora "group(=> userId).map(=> {user: key, posts: value.size()})"'
  ],

  // Configuration management
  configManagement: [
    'jora -i config.json -q "environments.production.database"',
    'jora -i settings.json -q "features[enabled].name"',
    'jora -i deployment.json -q "services[status != \\"running\\"].{name, status, lastUpdate}"'
  ]
}

// ===== HELPER FUNCTIONS FOR NODE.JS INTEGRATION =====

import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

// Execute jora CLI from Node.js
export async function executeJoraQuery(
  query: string, 
  inputFile?: string, 
  options: { pretty?: boolean; output?: string } = {}
): Promise<string> {
  const args = ['-q', query]
  
  if (inputFile) {
    args.push('-i', inputFile)
  }
  
  if (options.pretty) {
    args.push('-p')
  }
  
  if (options.output) {
    args.push('-o', options.output)
  }
  
  const command = ['jora', ...args].join(' ')
  const { stdout } = await execAsync(command)
  return stdout.trim()
}

// Process JSON data through jora CLI
export function processWithJoraCli(
  data: unknown, 
  query: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('jora', ['-q', query])
    
    let output = ''
    let error = ''
    
    child.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    child.stderr.on('data', (data) => {
      error += data.toString()
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim())
      } else {
        reject(new Error(error || `Process exited with code ${code}`))
      }
    })
    
    // Send data to stdin
    child.stdin.write(JSON.stringify(data))
    child.stdin.end()
  })
}

export {
  sampleData,
  cliCommands,
  advancedCliCommands,
  batchProcessingScripts,
  integrationExamples,
  debuggingCommands,
  realWorldUseCases
}