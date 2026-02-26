// Basic oxc-resolver usage examples

import resolve, { ResolverFactory } from 'oxc-resolver';
import * as path from 'node:path';

/**
 * Basic module resolution
 */
export const basicResolve = () => {
  const cwd = process.cwd();
  
  // Resolve relative path
  const relativeResult = resolve.sync(cwd, './src/index.js');
  console.log('Relative path resolved:', relativeResult.path);
  
  // Resolve npm package
  const packageResult = resolve.sync(cwd, 'react');
  console.log('Package resolved:', packageResult.path);
  
  return { relativeResult, packageResult };
};

/**
 * Using ResolverFactory for custom configurations
 */
export const customResolver = () => {
  // ESM resolver
  const esmResolver = new ResolverFactory({
    conditionNames: ['node', 'import'],
    extensions: ['.mjs', '.js', '.json', '.node']
  });
  
  // CommonJS resolver
  const cjsResolver = new ResolverFactory({
    conditionNames: ['node', 'require'],
    extensions: ['.js', '.json', '.node']
  });
  
  const cwd = process.cwd();
  
  // Resolve with ESM conditions
  const esmResult = esmResolver.sync(cwd, './src/module');
  console.log('ESM resolved:', esmResult);
  
  // Resolve with CommonJS conditions
  const cjsResult = cjsResolver.sync(cwd, './src/module');
  console.log('CJS resolved:', cjsResult);
  
  return { esmResult, cjsResult };
};

/**
 * TypeScript-aware resolver
 */
export const typeScriptResolver = () => {
  const tsResolver = new ResolverFactory({
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    mainFields: ['types', 'typings', 'main'],
    conditionNames: ['types', 'node', 'import']
  });
  
  const cwd = process.cwd();
  
  try {
    // Try to resolve TypeScript module
    const result = tsResolver.sync(cwd, './src/utils');
    console.log('TypeScript module resolved:', result.path);
    return result;
  } catch (error) {
    console.error('Failed to resolve:', error.message);
    return null;
  }
};

/**
 * Alias resolution
 */
export const aliasResolver = () => {
  const resolver = new ResolverFactory({
    alias: {
      '@': path.join(process.cwd(), 'src'),
      '@components': path.join(process.cwd(), 'src/components'),
      '@utils': path.join(process.cwd(), 'src/utils')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  });
  
  const cwd = process.cwd();
  
  // Resolve aliased imports
  const results = [
    resolver.sync(cwd, '@/index'),
    resolver.sync(cwd, '@components/Button'),
    resolver.sync(cwd, '@utils/helpers')
  ];
  
  results.forEach((result, index) => {
    console.log(`Alias ${index + 1} resolved:`, result.path);
  });
  
  return results;
};

/**
 * Monorepo package resolution
 */
export const monorepoResolver = () => {
  const resolver = new ResolverFactory({
    modules: [
      'node_modules',
      path.join(process.cwd(), 'packages/*/node_modules'),
      path.join(process.cwd(), 'packages')
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  });
  
  const cwd = process.cwd();
  
  try {
    // Resolve workspace package
    const result = resolver.sync(cwd, '@workspace/shared');
    console.log('Workspace package resolved:', result.path);
    return result;
  } catch (error) {
    console.error('Workspace resolution failed:', error.message);
    return null;
  }
};

/**
 * Browser field resolution
 */
export const browserResolver = () => {
  const resolver = new ResolverFactory({
    mainFields: ['browser', 'module', 'main'],
    conditionNames: ['browser', 'import', 'module', 'default']
  });
  
  const cwd = process.cwd();
  
  // Resolve with browser field preference
  try {
    const result = resolver.sync(cwd, 'some-package');
    console.log('Browser version resolved:', result.path);
    return result;
  } catch (error) {
    console.error('Browser resolution failed:', error.message);
    return null;
  }
};

/**
 * Comprehensive resolver for different environments
 */
export class UniversalResolver {
  private nodeResolver: ResolverFactory;
  private browserResolver: ResolverFactory;
  private esmResolver: ResolverFactory;
  private cjsResolver: ResolverFactory;
  
  constructor() {
    // Node.js environment
    this.nodeResolver = new ResolverFactory({
      conditionNames: ['node', 'require'],
      mainFields: ['main', 'module'],
      extensions: ['.js', '.json', '.node']
    });
    
    // Browser environment
    this.browserResolver = new ResolverFactory({
      conditionNames: ['browser', 'import', 'module', 'default'],
      mainFields: ['browser', 'module', 'main'],
      extensions: ['.js', '.mjs', '.json']
    });
    
    // ESM
    this.esmResolver = new ResolverFactory({
      conditionNames: ['import', 'module', 'default'],
      mainFields: ['module', 'main'],
      extensions: ['.mjs', '.js', '.json']
    });
    
    // CommonJS
    this.cjsResolver = new ResolverFactory({
      conditionNames: ['require', 'node', 'default'],
      mainFields: ['main'],
      extensions: ['.js', '.json', '.node']
    });
  }
  
  resolve(specifier: string, environment: 'node' | 'browser' | 'esm' | 'cjs') {
    const cwd = process.cwd();
    
    switch (environment) {
      case 'node':
        return this.nodeResolver.sync(cwd, specifier);
      case 'browser':
        return this.browserResolver.sync(cwd, specifier);
      case 'esm':
        return this.esmResolver.sync(cwd, specifier);
      case 'cjs':
        return this.cjsResolver.sync(cwd, specifier);
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }
  }
}

/**
 * Usage example for build tools integration
 */
export const buildToolIntegration = () => {
  const resolver = new ResolverFactory({
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.join(process.cwd(), 'src')
    }
  });
  
  // Simulate build tool resolving imports
  const importSpecifiers = [
    './components/Button',
    '@/utils/helpers',
    'react',
    'lodash/pick'
  ];
  
  const resolved = importSpecifiers.map(specifier => {
    try {
      const result = resolver.sync(process.cwd(), specifier);
      return {
        specifier,
        resolved: result.path,
        success: true
      };
    } catch (error) {
      return {
        specifier,
        error: error.message,
        success: false
      };
    }
  });
  
  console.log('Build resolution results:', resolved);
  return resolved;
};

// Example usage:
if (require.main === module) {
  console.log('Basic Resolution:');
  basicResolve();
  
  console.log('\nCustom Resolver:');
  customResolver();
  
  console.log('\nTypeScript Resolver:');
  typeScriptResolver();
  
  console.log('\nAlias Resolver:');
  aliasResolver();
}