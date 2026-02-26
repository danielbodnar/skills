// GritQL Integration Examples with TypeScript

import * as grit from '@getgrit/api';

// Example 1: Basic transformation workflow
export async function modernizeJavaScript(options: grit.WorkflowOptions) {
  const transformResult = await grit.stdlib.transform(
    {
      objective: `Modernize JavaScript code to use ES6+ features`,
      principles: [
        'Convert var to const/let appropriately',
        'Use arrow functions where possible',
        'Replace string concatenation with template literals'
      ],
      model: 'fast',
      query: 'or { js"var $_", js"function $_($__) { return $_ }" }',
      examples: [
        {
          input: `var name = "John"; var greeting = "Hello " + name;`,
          replacements: [`const name = "John"; const greeting = \`Hello \${name}\`;`]
        },
        {
          input: `function double(x) { return x * 2; }`,
          replacements: [`const double = (x) => x * 2;`]
        }
      ]
    },
    options
  );
  
  if (!transformResult.success) return transformResult;
  
  // Apply additional cleanup patterns
  await grit.stdlib.apply(
    {
      query: `js"console.log($_)" => .`
    },
    { paths: transformResult.paths }
  );
  
  return {
    success: true,
    message: `Modernized ${transformResult.paths.length} JavaScript files`,
    paths: transformResult.paths
  };
}

// Example 2: React component migration
export async function migrateToHooks(options: grit.WorkflowOptions) {
  const transformResult = await grit.stdlib.transform(
    {
      objective: `Convert React class components to functional components with hooks`,
      principles: [
        'Use useState for state management',
        'Use useEffect for lifecycle methods',
        'Preserve component behavior and props'
      ],
      model: 'slow',
      query: 'js"class $_ extends React.Component { $_ }"',
      examples: [
        {
          input: `class Counter extends React.Component {
            constructor(props) {
              super(props);
              this.state = { count: 0 };
            }
            
            render() {
              return <div>{this.state.count}</div>;
            }
          }`,
          replacements: [
            `const Counter = (props) => {
              const [count, setCount] = useState(0);
              return <div>{count}</div>;
            }`
          ]
        }
      ]
    },
    options
  );
  
  if (!transformResult.success) return transformResult;
  
  // Ensure React hooks are imported
  await grit.stdlib.apply(
    {
      query: `js"useState" as $hook where { 
        $hook <: ensure_import_from(source=js"'react'") 
      }`
    },
    { paths: transformResult.paths }
  );
  
  return transformResult;
}

// Example 3: TypeScript migration
export async function addTypeScript(options: grit.WorkflowOptions) {
  const transformResult = await grit.stdlib.transform(
    {
      objective: `Add TypeScript type annotations to JavaScript code`,
      principles: [
        'Add proper type annotations to function parameters',
        'Define interfaces for object types',
        'Use strict type checking'
      ],
      model: 'slow',
      query: 'js"function $_($_) { $_ }"',
      examples: [
        {
          input: `function calculateTotal(items, tax) {
            return items.reduce((sum, item) => sum + item.price, 0) * (1 + tax);
          }`,
          replacements: [
            `interface Item {
              price: number;
            }
            
            function calculateTotal(items: Item[], tax: number): number {
              return items.reduce((sum, item) => sum + item.price, 0) * (1 + tax);
            }`
          ]
        }
      ]
    },
    options
  );
  
  return transformResult;
}

// Example 4: Security hardening
export async function hardenSecurity(options: grit.WorkflowOptions) {
  const patterns = [
    // Remove hardcoded secrets
    {
      query: `js"'sk-$_'" => js"process.env.OPENAI_API_KEY"`,
      description: 'Replace hardcoded API keys with environment variables'
    },
    // Add input validation
    {
      query: `js"$obj[$key]" => js"safeGet($obj, $key)" where {
        $key <: not string_literal()
      }`,
      description: 'Add safe property access for dynamic keys'
    },
    // SQL injection prevention
    {
      query: `js"query(\`SELECT * FROM users WHERE id = \${$id}\`)" => 
              js"query('SELECT * FROM users WHERE id = ?', [$id])"`,
      description: 'Use parameterized queries to prevent SQL injection'
    }
  ];
  
  const results = [];
  
  for (const pattern of patterns) {
    const result = await grit.stdlib.apply(pattern, options);
    results.push(result);
  }
  
  return {
    success: true,
    message: `Applied ${patterns.length} security hardening patterns`,
    results
  };
}

// Example 5: Performance optimization
export async function optimizePerformance(options: grit.WorkflowOptions) {
  const transformResult = await grit.stdlib.transform(
    {
      objective: `Optimize JavaScript performance by improving algorithms and patterns`,
      principles: [
        'Replace inefficient array operations',
        'Add memoization where appropriate',
        'Optimize loop structures'
      ],
      model: 'fast',
      query: 'js"for (let $i = 0; $i < $arr.length; $i++) { $_ }"',
      examples: [
        {
          input: `for (let i = 0; i < items.length; i++) {
            if (items[i].active) {
              processItem(items[i]);
            }
          }`,
          replacements: [
            `items.filter(item => item.active).forEach(processItem);`
          ]
        }
      ]
    },
    options
  );
  
  if (!transformResult.success) return transformResult;
  
  // Add memoization to expensive functions
  await grit.stdlib.apply(
    {
      query: `js"function $name($_) { return $expensive; }" => 
              js"const $name = memoize(($_) => { return $expensive; });" where {
        $expensive <: contains or { "map", "filter", "reduce", "sort" }
      }`
    },
    { paths: transformResult.paths }
  );
  
  return transformResult;
}

// Example 6: Test automation
export async function addTests(options: grit.WorkflowOptions) {
  const transformResult = await grit.stdlib.transform(
    {
      objective: `Generate basic unit tests for JavaScript functions`,
      principles: [
        'Test happy path scenarios',
        'Test edge cases and error conditions',
        'Use descriptive test names'
      ],
      model: 'slow',
      query: 'js"export function $_($_) { $_ }"',
      examples: [
        {
          input: `export function add(a, b) {
            return a + b;
          }`,
          replacements: [
            `import { describe, test, expect } from 'vitest';
            import { add } from './math';
            
            describe('add', () => {
              test('should add two positive numbers', () => {
                expect(add(2, 3)).toBe(5);
              });
              
              test('should handle negative numbers', () => {
                expect(add(-1, 1)).toBe(0);
              });
              
              test('should handle zero', () => {
                expect(add(0, 5)).toBe(5);
              });
            });`
          ]
        }
      ]
    },
    options
  );
  
  return transformResult;
}

// Example 7: Documentation generation
export async function addDocumentation(options: grit.WorkflowOptions) {
  const patterns = [
    // Add JSDoc comments to functions
    {
      query: `js"function $name($params) { $body }" => 
              js"/**
               * Description of $name function
               * @param {type} $params - Parameter description
               * @returns {type} Return value description
               */
              function $name($params) { $body }"`,
      description: 'Add JSDoc comments to functions'
    },
    // Add README sections
    {
      query: `file($f) where {
        $f <: ends_with(".js"),
        $f <: not contains "README"
      } => file($f) where {
        ensure_file("README.md", "# Project Documentation\\n\\n## Usage\\n\\n")
      }`,
      description: 'Ensure README.md exists for projects'
    }
  ];
  
  const results = [];
  
  for (const pattern of patterns) {
    const result = await grit.stdlib.apply(pattern, options);
    results.push(result);
  }
  
  return {
    success: true,
    message: `Added documentation patterns`,
    results
  };
}

// Example 8: Dependency management
export async function updateDependencies(options: grit.WorkflowOptions) {
  const updates = [
    // Update React imports
    {
      query: `js"import React from 'react'" => js"import React from 'react'"`,
      description: 'Update React imports'
    },
    // Update Lodash imports to reduce bundle size
    {
      query: `js"import _ from 'lodash'" => js"import { map, filter, reduce } from 'lodash'"`,
      description: 'Use specific Lodash imports'
    },
    // Update moment.js to date-fns
    {
      query: `js"import moment from 'moment'" => js"import { format, parseISO } from 'date-fns'"`,
      description: 'Migrate from moment.js to date-fns'
    }
  ];
  
  const results = [];
  
  for (const update of updates) {
    const result = await grit.stdlib.apply(update, options);
    results.push(result);
  }
  
  return {
    success: true,
    message: `Updated dependencies`,
    results
  };
}

// Example 9: Code style enforcement
export async function enforceCodeStyle(options: grit.WorkflowOptions) {
  const styleRules = [
    // Enforce semicolons
    {
      query: `js"$stmt" => js"$stmt;" where {
        $stmt <: expression_statement(),
        $stmt <: not contains ";"
      }`,
      description: 'Add missing semicolons'
    },
    // Enforce consistent quotes
    {
      query: `js"'$string'" => js'"$string"'`,
      description: 'Use double quotes consistently'
    },
    // Enforce const over let
    {
      query: `js"let $name = $value" => js"const $name = $value" where {
        $name <: not within assignment_expression()
      }`,
      description: 'Use const instead of let when possible'
    }
  ];
  
  const results = [];
  
  for (const rule of styleRules) {
    const result = await grit.stdlib.apply(rule, options);
    results.push(result);
  }
  
  return {
    success: true,
    message: `Enforced code style rules`,
    results
  };
}

// Example 10: Framework migration helper
export async function migrateFramework(
  fromFramework: string,
  toFramework: string,
  options: grit.WorkflowOptions
) {
  const migrationMap = {
    'jquery->vanilla': {
      patterns: [
        `js"$($selector)" => js"document.querySelector($selector)"`,
        `js"$.ajax($config)" => js"fetch($config.url, $config)"`,
        `js"$el.click($handler)" => js"$el.addEventListener('click', $handler)"`
      ]
    },
    'vue2->vue3': {
      patterns: [
        `js"new Vue($config)" => js"createApp($config)"`,
        `js"this.$emit($event, $data)" => js"emit($event, $data)"`,
        `js"Vue.filter($name, $fn)" => js"// Filters removed in Vue 3"`
      ]
    }
  };
  
  const migration = migrationMap[`${fromFramework}->${toFramework}`];
  
  if (!migration) {
    return {
      success: false,
      message: `Migration from ${fromFramework} to ${toFramework} not supported`
    };
  }
  
  const results = [];
  
  for (const pattern of migration.patterns) {
    const result = await grit.stdlib.apply({ query: pattern }, options);
    results.push(result);
  }
  
  return {
    success: true,
    message: `Migrated from ${fromFramework} to ${toFramework}`,
    results
  };
}

// Utility function to combine multiple workflows
export async function runMigrationSuite(options: grit.WorkflowOptions) {
  const workflows = [
    modernizeJavaScript,
    addTypeScript,
    hardenSecurity,
    optimizePerformance,
    enforceCodeStyle
  ];
  
  const results = [];
  
  for (const workflow of workflows) {
    try {
      const result = await workflow(options);
      results.push(result);
    } catch (error) {
      console.error(`Workflow failed:`, error);
      results.push({
        success: false,
        message: `Workflow failed: ${error.message}`
      });
    }
  }
  
  return {
    success: results.every(r => r.success),
    message: `Completed ${workflows.length} workflows`,
    results
  };
}