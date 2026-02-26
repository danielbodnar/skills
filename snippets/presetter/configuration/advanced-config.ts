// Advanced Presetter Configuration Examples
import { preset } from 'presetter';
import esm from 'presetter-preset-esm';
import strict from 'presetter-preset-strict';
import web from 'presetter-preset-web';
import react from 'presetter-preset-react';

// 1. Multi-preset configuration with overrides
export default preset('my-web-app', {
  extends: [esm, strict, web, react],
  override: {
    // TypeScript configuration overrides
    'tsconfig.json': {
      compilerOptions: {
        target: 'ES2023',
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        noEmit: true,
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        exactOptionalPropertyTypes: true
      },
      include: ['src/**/*', 'tests/**/*'],
      exclude: ['node_modules', 'dist']
    },

    // Package.json script overrides
    'package.json': {
      scripts: {
        'dev': 'vite dev',
        'build': 'vite build',
        'preview': 'vite preview',
        'test': 'vitest',
        'test:ui': 'vitest --ui',
        'test:coverage': 'vitest --coverage',
        'lint': 'biome check .',
        'lint:fix': 'biome check --write .',
        'type-check': 'tsc --noEmit'
      }
    },

    // Vite configuration
    'vite.config.ts': {
      plugins: ['@vitejs/plugin-react'],
      build: {
        target: 'ES2023',
        minify: 'esbuild',
        sourcemap: true
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/tests/setup.ts']
      }
    },

    // Biome configuration override
    'biome.json': {
      $schema: './node_modules/@biomejs/biome/configuration_schema.json',
      vcs: {
        enabled: true,
        clientKind: 'git',
        useIgnoreFile: true
      },
      files: {
        ignoreUnknown: false,
        ignore: ['dist/', 'node_modules/', '*.d.ts']
      },
      formatter: {
        enabled: true,
        indentStyle: 'space',
        indentWidth: 2,
        lineWidth: 100
      },
      linter: {
        enabled: true,
        rules: {
          recommended: true,
          complexity: {
            noExcessiveCognitiveComplexity: 'error'
          },
          style: {
            noNonNullAssertion: 'off'
          }
        }
      },
      javascript: {
        formatter: {
          quoteStyle: 'single',
          trailingCommas: 'es5',
          semicolons: 'always'
        }
      }
    }
  },

  // Custom variables for template generation
  variables: {
    target: 'ES2023',
    source: 'src',
    output: 'dist',
    testDir: 'tests',
    author: 'Your Name',
    email: 'your.email@example.com',
    license: 'MIT'
  }
});

// 2. Monorepo configuration
export const monorepoConfig = preset('my-monorepo', {
  extends: ['presetter-preset-monorepo', 'presetter-preset-essentials'],
  override: {
    'package.json': {
      workspaces: ['packages/*', 'apps/*'],
      scripts: {
        'build:all': 'turbo build',
        'test:all': 'turbo test',
        'lint:all': 'turbo lint',
        'dev': 'turbo dev --parallel',
        'clean': 'turbo clean'
      }
    },
    'turbo.json': {
      $schema: 'https://turbo.build/schema.json',
      pipeline: {
        build: {
          dependsOn: ['^build'],
          outputs: ['dist/**']
        },
        test: {
          dependsOn: ['build']
        },
        lint: {},
        dev: {
          cache: false,
          persistent: true
        }
      }
    }
  }
});

// 3. Library configuration
export const libraryConfig = preset('my-library', {
  extends: ['presetter-preset-esm', 'presetter-preset-rollup'],
  override: {
    'rollup.config.js': {
      input: 'src/index.ts',
      output: [
        {
          file: 'dist/index.js',
          format: 'esm',
          sourcemap: true
        },
        {
          file: 'dist/index.cjs',
          format: 'cjs',
          sourcemap: true
        }
      ],
      external: ['react', 'react-dom'],
      plugins: ['@rollup/plugin-typescript', '@rollup/plugin-node-resolve']
    },
    'package.json': {
      main: 'dist/index.cjs',
      module: 'dist/index.js',
      types: 'dist/index.d.ts',
      exports: {
        '.': {
          import: './dist/index.js',
          require: './dist/index.cjs',
          types: './dist/index.d.ts'
        }
      },
      files: ['dist'],
      publishConfig: {
        access: 'public'
      }
    }
  }
});