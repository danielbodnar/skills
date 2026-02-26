// Testing setup with Oxc tools

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { transform } from 'oxc-transform';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Test utilities for oxc-transform
 */
export class OxcTestUtils {
  static transformCode(code: string, filename = 'test.ts') {
    return transform(filename, code, {
      typescript: {
        declaration: false,
        onlyRemoveTypeImports: true
      }
    });
  }

  static transformReact(code: string, filename = 'test.tsx') {
    return transform(filename, code, {
      jsx: {
        plugin: 'react',
        development: true
      },
      typescript: {
        declaration: false
      }
    });
  }

  static expectValidJavaScript(transformedCode: string) {
    // Basic syntax validation - should not throw
    new Function(transformedCode);
  }

  static expectTypeScriptRemoved(transformedCode: string) {
    // Check that TypeScript syntax has been removed
    expect(transformedCode).not.toMatch(/:\s*\w+/); // No type annotations
    expect(transformedCode).not.toMatch(/interface\s+\w+/); // No interfaces
    expect(transformedCode).not.toMatch(/type\s+\w+/); // No type aliases
  }
}

/**
 * Linting test utilities
 */
export class OxlintTestUtils {
  static createTempFile(content: string, extension = '.ts'): string {
    const tempFile = join('/tmp', `test-${Date.now()}${extension}`);
    writeFileSync(tempFile, content);
    return tempFile;
  }

  static cleanupTempFile(filepath: string) {
    try {
      unlinkSync(filepath);
    } catch {
      // Ignore cleanup errors
    }
  }

  static runOxlint(filepath: string): { success: boolean; output: string; errors: string } {
    try {
      const output = execSync(`oxlint ${filepath}`, { encoding: 'utf8' });
      return { success: true, output, errors: '' };
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: error.message || String(error)
      };
    }
  }

  static expectLintErrors(code: string, expectedErrors: string[]) {
    const tempFile = this.createTempFile(code);
    const result = this.runOxlint(tempFile);
    
    expect(result.success).toBe(false);
    for (const expectedError of expectedErrors) {
      expect(result.errors).toContain(expectedError);
    }
    
    this.cleanupTempFile(tempFile);
  }

  static expectNoLintErrors(code: string) {
    const tempFile = this.createTempFile(code);
    const result = this.runOxlint(tempFile);
    
    expect(result.success).toBe(true);
    
    this.cleanupTempFile(tempFile);
  }
}

/**
 * Integration test suite
 */
describe('Oxc Transform Tests', () => {
  test('transforms TypeScript to JavaScript', () => {
    const input = `
      interface User {
        id: string;
        name: string;
      }
      
      const user: User = {
        id: '1',
        name: 'John'
      };
    `;

    const result = OxcTestUtils.transformCode(input);
    
    expect(result.code).toBeDefined();
    expect(result.errors).toHaveLength(0);
    
    OxcTestUtils.expectValidJavaScript(result.code);
    OxcTestUtils.expectTypeScriptRemoved(result.code);
  });

  test('transforms React JSX', () => {
    const input = `
      import React from 'react';
      
      interface Props {
        name: string;
      }
      
      const Greeting: React.FC<Props> = ({ name }) => {
        return <div>Hello, {name}!</div>;
      };
    `;

    const result = OxcTestUtils.transformReact(input);
    
    expect(result.code).toBeDefined();
    expect(result.errors).toHaveLength(0);
    expect(result.code).toContain('React.createElement');
  });

  test('handles isolated declarations', () => {
    const input = `
      export interface ApiResponse<T> {
        data: T;
        status: number;
      }
      
      export class ApiClient {
        constructor(private baseUrl: string) {}
        
        async get<T>(endpoint: string): Promise<ApiResponse<T>> {
          throw new Error('Not implemented');
        }
      }
    `;

    const result = transform('api.ts', input, {
      typescript: {
        declaration: true
      }
    });

    expect(result.declaration).toBeDefined();
    expect(result.declaration).toContain('export interface ApiResponse');
    expect(result.declaration).toContain('export declare class ApiClient');
  });
});

describe('Oxlint Tests', () => {
  afterEach(() => {
    // Cleanup any temp files
    execSync('rm -f /tmp/test-*.ts /tmp/test-*.js', { stdio: 'ignore' });
  });

  test('detects unused variables', () => {
    const code = `
      const unusedVar = 'hello';
      console.log('world');
    `;

    OxlintTestUtils.expectLintErrors(code, ['unused']);
  });

  test('detects type annotation issues', () => {
    const code = `
      function test(param: any) {
        return param;
      }
    `;

    OxlintTestUtils.expectLintErrors(code, ['no-explicit-any']);
  });

  test('passes clean TypeScript code', () => {
    const code = `
      interface User {
        id: string;
        name: string;
      }
      
      function createUser(id: string, name: string): User {
        return { id, name };
      }
      
      const user = createUser('1', 'John');
      console.log(user);
    `;

    OxlintTestUtils.expectNoLintErrors(code);
  });
});

/**
 * Performance benchmark tests
 */
describe('Performance Benchmarks', () => {
  test('transform performance', () => {
    const largeTypeScriptCode = `
      interface User {
        id: string;
        name: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
      }
      
      ${Array.from({ length: 100 }, (_, i) => `
        class Service${i} {
          private users: User[] = [];
          
          addUser(user: User): void {
            this.users.push(user);
          }
          
          getUser(id: string): User | undefined {
            return this.users.find(u => u.id === id);
          }
        }
      `).join('\n')}
    `;

    const startTime = performance.now();
    const result = OxcTestUtils.transformCode(largeTypeScriptCode);
    const endTime = performance.now();

    expect(result.code).toBeDefined();
    expect(result.errors).toHaveLength(0);
    
    const transformTime = endTime - startTime;
    console.log(`Transform time: ${transformTime.toFixed(2)}ms`);
    
    // Should be reasonably fast (adjust threshold as needed)
    expect(transformTime).toBeLessThan(1000);
  });

  test('lint performance', () => {
    const largeCode = Array.from({ length: 1000 }, (_, i) => 
      `const var${i} = 'value${i}'; console.log(var${i});`
    ).join('\n');

    const tempFile = OxlintTestUtils.createTempFile(largeCode);
    
    const startTime = performance.now();
    const result = OxlintTestUtils.runOxlint(tempFile);
    const endTime = performance.now();

    const lintTime = endTime - startTime;
    console.log(`Lint time: ${lintTime.toFixed(2)}ms`);
    
    expect(result.success).toBe(true);
    expect(lintTime).toBeLessThan(1000);
    
    OxlintTestUtils.cleanupTempFile(tempFile);
  });
});

/**
 * Integration with build tools
 */
describe('Build Tool Integration', () => {
  test('bun build with oxc transform', async () => {
    // Create a simple TypeScript module
    const testCode = `
      export interface Config {
        name: string;
        version: string;
      }
      
      export const createConfig = (name: string): Config => ({
        name,
        version: '1.0.0'
      });
    `;

    const tempFile = join('/tmp', 'test-module.ts');
    writeFileSync(tempFile, testCode);

    try {
      // Transform with oxc
      const transformed = OxcTestUtils.transformCode(testCode, 'test-module.ts');
      
      // Write transformed code
      const jsFile = join('/tmp', 'test-module.js');
      writeFileSync(jsFile, transformed.code);

      // Verify it can be imported by Bun
      const result = await import(jsFile);
      expect(result.createConfig).toBeFunction();
      
      const config = result.createConfig('test');
      expect(config.name).toBe('test');
      expect(config.version).toBe('1.0.0');

      // Cleanup
      unlinkSync(jsFile);
    } finally {
      try {
        unlinkSync(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });
});

/**
 * Configuration testing utilities
 */
export class ConfigTestUtils {
  static validateOxlintConfig(configPath: string) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      
      // Basic structure validation
      expect(config).toBeObject();
      
      if (config.rules) {
        expect(config.rules).toBeObject();
      }
      
      if (config.plugins) {
        expect(config.plugins).toBeArray();
      }
      
      if (config.env) {
        expect(config.env).toBeObject();
      }
      
      return true;
    } catch (error) {
      throw new Error(`Invalid oxlint config: ${error.message}`);
    }
  }
}

describe('Configuration Tests', () => {
  test('validates oxlint configuration', () => {
    const configPath = join(__dirname, '../configuration/.oxlintrc.json');
    expect(() => ConfigTestUtils.validateOxlintConfig(configPath)).not.toThrow();
  });
});