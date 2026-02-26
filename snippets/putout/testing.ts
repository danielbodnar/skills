// Putout Testing Examples

// 1. Basic Plugin Testing
import {test} from '@putout/test';
import plugin from './my-plugin';

test('should remove unused variables', (t) => {
  t.transform('const unused = 5; console.log("hello");');
  t.transformCode('const unused = 5; console.log("hello");', 'console.log("hello");');
});

// 2. Advanced Plugin Testing
const pluginTests = {
  // Test with options
  testWithOptions: () => {
    test('should handle options', (t) => {
      t.transform('const unused = 5;', {
        aggressive: true
      });
    });
  },

  // Test multiple transformations
  testMultipleTransforms: () => {
    test('should handle multiple transforms', (t) => {
      t.transformCode(
        'const unused = 5; debugger; console.log("test");',
        'console.log("test");'
      );
    });
  },

  // Test with custom rules
  testCustomRules: () => {
    test('should apply custom rules', (t) => {
      t.transform('const a = 1; const b = 2;', {
        rules: {
          'remove-unused-variables': 'on'
        }
      });
    });
  }
};

// 3. Test Helper Functions
const testHelpers = {
  // Create test for transformation
  createTransformTest: (name, input, expected, options = {}) => {
    test(name, (t) => {
      t.transformCode(input, expected, options);
    });
  },

  // Test plugin with multiple cases
  testPlugin: (plugin, testCases) => {
    testCases.forEach(({name, input, expected, options}) => {
      test(name, (t) => {
        t.transformCode(input, expected, options);
      });
    });
  },

  // Test error handling
  testErrorHandling: (plugin, input) => {
    test('should handle errors gracefully', (t) => {
      t.noTransform(input);
    });
  }
};

// 4. Custom Test Runner
const customTestRunner = {
  // Run tests with custom configuration
  runTests: (plugin, config) => {
    const {transform} = require('putout');

    config.tests.forEach(({name, input, expected}) => {
      test(name, (t) => {
        const result = transform(input, {
          plugins: [plugin],
          ...config.options
        });

        t.equal(result.code, expected);
      });
    });
  },

  // Batch test runner
  batchTest: (plugins, testSuite) => {
    testSuite.forEach(({name, input, expected, pluginName}) => {
      test(name, (t) => {
        const plugin = plugins[pluginName];
        t.transformCode(input, expected);
      });
    });
  }
};

// 5. Integration Testing
const integrationTests = {
  // Test with real files
  testWithFiles: () => {
    const fs = require('fs');
    const path = require('path');

    test('should transform real files', (t) => {
      const filePath = path.join(__dirname, 'fixtures/input.js');
      const expectedPath = path.join(__dirname, 'fixtures/expected.js');

      const input = fs.readFileSync(filePath, 'utf8');
      const expected = fs.readFileSync(expectedPath, 'utf8');

      t.transformCode(input, expected);
    });
  },

  // Test with multiple files
  testMultipleFiles: () => {
    const glob = require('glob');
    const fs = require('fs');

    test('should handle multiple files', (t) => {
      const files = glob.sync('fixtures/*.js');

      files.forEach(file => {
        const input = fs.readFileSync(file, 'utf8');
        t.noTransform(input); // or t.transform(input)
      });
    });
  }
};

// 6. Performance Testing
const performanceTests = {
  // Measure transformation time
  measureTime: (plugin, input) => {
    const start = process.hrtime();

    test('should transform quickly', (t) => {
      t.transform(input);

      const [seconds, nanoseconds] = process.hrtime(start);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;

      console.log(`Transformation took ${milliseconds}ms`);
      t.ok(milliseconds < 1000, 'Should complete in under 1 second');
    });
  },

  // Memory usage testing
  testMemoryUsage: (plugin, input) => {
    test('should not leak memory', (t) => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Run transformation multiple times
      for (let i = 0; i < 100; i++) {
        t.transform(input);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      t.ok(memoryIncrease < 50 * 1024 * 1024, 'Memory increase should be less than 50MB');
    });
  }
};

// 7. Edge Case Testing
const edgeCaseTests = {
  // Test with empty input
  testEmptyInput: () => {
    test('should handle empty input', (t) => {
      t.noTransform('');
    });
  },

  // Test with invalid syntax
  testInvalidSyntax: () => {
    test('should handle invalid syntax', (t) => {
      t.doesNotThrow(() => {
        t.transform('const invalid = ;');
      });
    });
  },

  // Test with complex nested structures
  testComplexStructures: () => {
    test('should handle complex structures', (t) => {
      const complexInput = `
        function complex() {
          return {
            nested: {
              deeply: {
                value: function() {
                  const unused = 5;
                  return 42;
                }
              }
            }
          };
        }
      `;

      t.transform(complexInput);
    });
  }
};

// 8. Mock Testing
const mockTests = {
  // Mock AST nodes
  mockAST: () => {
    const mockPath = {
      node: {
        type: 'Identifier',
        name: 'unused'
      },
      remove: jest.fn(),
      replaceWith: jest.fn()
    };

    test('should call remove on unused variable', (t) => {
      const plugin = require('./my-plugin');
      plugin.fix(mockPath);

      t.ok(mockPath.remove.called, 'Should call remove');
    });
  },

  // Mock file system
  mockFileSystem: () => {
    const fs = require('fs');
    const mockFs = {
      readFileSync: jest.fn().mockReturnValue('const unused = 5;'),
      writeFileSync: jest.fn()
    };

    test('should read and write files', (t) => {
      // Test file operations
      t.ok(mockFs.readFileSync.called);
    });
  }
};

// 9. Snapshot Testing
const snapshotTests = {
  // Test with snapshots
  testSnapshots: () => {
    test('should match snapshot', (t) => {
      const result = t.transform('const unused = 5; console.log("hello");');
      t.matchSnapshot(result);
    });
  },

  // Update snapshots
  updateSnapshots: () => {
    test('should update snapshots', (t) => {
      const result = t.transform('const unused = 5; console.log("hello");');
      t.updateSnapshot(result);
    });
  }
};

// 10. Test Fixtures
const testFixtures = {
  // Input/output pairs
  transformPairs: [
    {
      name: 'remove unused variables',
      input: 'const unused = 5; console.log("hello");',
      expected: 'console.log("hello");'
    },
    {
      name: 'remove debugger',
      input: 'debugger; console.log("hello");',
      expected: 'console.log("hello");'
    },
    {
      name: 'convert commonjs to esm',
      input: 'const fs = require("fs");',
      expected: 'import fs from "fs";'
    }
  ],

  // Error cases
  errorCases: [
    {
      name: 'invalid syntax',
      input: 'const invalid = ;',
      shouldThrow: false
    },
    {
      name: 'empty input',
      input: '',
      shouldThrow: false
    }
  ]
};

// 11. Test Configuration
const testConfig = {
  // Default test options
  defaultOptions: {
    rules: {
      'remove-unused-variables': 'on',
      'remove-debugger': 'on'
    }
  },

  // Test environments
  environments: {
    node: {
      rules: {
        'nodejs/convert-commonjs-to-esm': 'on'
      }
    },
    browser: {
      rules: {
        'browser/remove-console': 'on'
      }
    }
  }
};

// 12. Test Utilities
const testUtils = {
  // Create test suite
  createTestSuite: (name, tests) => {
    return {
      name,
      tests: tests.map(t => ({
        ...t,
        run: () => test(t.name, t.fn)
      }))
    };
  },

  // Run test suite
  runTestSuite: (suite) => {
    console.log(`Running test suite: ${suite.name}`);
    suite.tests.forEach(t => t.run());
  }
};

// 13. Test Examples
const testExamples = {
  // Basic transformation test
  basicTest: () => {
    test('plugin name: should remove unused variables', (t) => {
      t.transform('const unused = 5;');
    });
  },

  // No transformation test
  noTransformTest: () => {
    test('plugin name: should not transform used variables', (t) => {
      t.noTransform('const used = 5; console.log(used);');
    });
  },

  // Transform with comparison
  compareTest: () => {
    test('plugin name: should remove unused and keep used', (t) => {
      t.transformCode(
        'const unused = 5; const used = 10; console.log(used);',
        'const used = 10; console.log(used);'
      );
    });
  }
};

// 14. Test Coverage
const testCoverage = {
  // Coverage configuration
  coverageConfig: {
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/**/*.test.js'
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },

  // Run with coverage
  runWithCoverage: () => {
    const {exec} = require('child_process');
    exec('npm test -- --coverage', (error, stdout, stderr) => {
      if (error) {
        console.error('Coverage error:', error);
        return;
      }
      console.log('Coverage report:', stdout);
    });
  }
};

// 15. Continuous Integration Testing
const ciTests = {
  // GitHub Actions test
  githubTest: `
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
  `,

  // Test matrix
  testMatrix: `
strategy:
  matrix:
    node-version: [16, 18, 20]
    os: [ubuntu-latest, windows-latest, macos-latest]
  `
};

export {
  pluginTests,
  testHelpers,
  customTestRunner,
  integrationTests,
  performanceTests,
  edgeCaseTests,
  mockTests,
  snapshotTests,
  testFixtures,
  testConfig,
  testUtils,
  testExamples,
  testCoverage,
  ciTests
};