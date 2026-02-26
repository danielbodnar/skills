// Creating Custom Presetter Presets
import type { PresetConfig } from 'presetter';

// 1. Basic custom preset structure
export interface MyCustomPresetOptions {
  target?: string;
  framework?: 'react' | 'vue' | 'svelte';
  testing?: boolean;
  linting?: boolean;
}

export const myCustomPreset = (options: MyCustomPresetOptions = {}): PresetConfig => ({
  // Preset metadata
  displayName: 'My Custom Preset',
  description: 'Custom preset for my development workflow',

  // Dependencies to install
  dependencies: {
    // Runtime dependencies
    dependencies: {},

    // Development dependencies
    devDependencies: {
      typescript: '^5.6.0',
      '@types/node': '^22.0.0',
      vite: '^6.0.0',
      vitest: '^2.0.0',
      '@biomejs/biome': '^1.9.0'
    }
  },

  // Configuration files to generate
  config: {
    // TypeScript configuration
    'tsconfig.json': {
      compilerOptions: {
        target: options.target || 'ES2023',
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        forceConsistentCasingInFileNames: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    },

    // Package.json scripts
    'package.json': {
      type: 'module',
      scripts: {
        build: 'vite build',
        dev: 'vite dev',
        preview: 'vite preview',
        ...(options.testing && {
          test: 'vitest',
          'test:coverage': 'vitest --coverage'
        }),
        ...(options.linting && {
          lint: 'biome check .',
          'lint:fix': 'biome check --write .'
        })
      }
    },

    // Vite configuration
    'vite.config.ts': `
import { defineConfig } from 'vite';
${options.framework === 'react' ? "import react from '@vitejs/plugin-react';" : ''}
${options.framework === 'vue' ? "import vue from '@vitejs/plugin-vue';" : ''}

export default defineConfig({
  plugins: [
    ${options.framework === 'react' ? 'react()' : ''}
    ${options.framework === 'vue' ? 'vue()' : ''}
  ],
  build: {
    target: '${options.target || 'ES2023'}',
    minify: 'esbuild',
    sourcemap: true
  },
  ${options.testing ? `
  test: {
    globals: true,
    environment: 'jsdom'
  }
  ` : ''}
});`,

    // Biome configuration (if linting enabled)
    ...(options.linting && {
      'biome.json': {
        $schema: './node_modules/@biomejs/biome/configuration_schema.json',
        vcs: {
          enabled: true,
          clientKind: 'git',
          useIgnoreFile: true
        },
        files: {
          ignoreUnknown: false,
          ignore: ['dist/', 'node_modules/']
        },
        formatter: {
          enabled: true,
          indentStyle: 'space',
          indentWidth: 2
        },
        linter: {
          enabled: true,
          rules: {
            recommended: true
          }
        }
      }
    })
  },

  // Template files to copy
  templates: {
    'src/main.ts': options.framework === 'react'
      ? `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      : `console.log('Hello from ${options.framework || 'TypeScript'}!');`,

    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,

    '.gitignore': `# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime
.cache/
.temp/`
  }
});

// 2. Framework-specific presets
export const reactPreset = (options: Partial<MyCustomPresetOptions> = {}) =>
  myCustomPreset({ ...options, framework: 'react', testing: true, linting: true });

export const vuePreset = (options: Partial<MyCustomPresetOptions> = {}) =>
  myCustomPreset({ ...options, framework: 'vue', testing: true, linting: true });

// 3. Composable preset that extends existing presets
import esm from 'presetter-preset-esm';
import strict from 'presetter-preset-strict';

export const enhancedEsmPreset = preset('enhanced-esm', {
  extends: [esm, strict],
  override: {
    'package.json': {
      scripts: {
        'build': 'tsc && vite build',
        'build:types': 'tsc --emitDeclarationOnly',
        'build:bundle': 'vite build'
      }
    },
    'tsconfig.json': {
      compilerOptions: {
        declaration: true,
        declarationMap: true,
        outDir: 'dist/types'
      }
    }
  }
});

// 4. Utility functions for preset creation
export const createWebAppPreset = (name: string, framework: 'react' | 'vue') =>
  preset(name, {
    extends: [myCustomPreset({ framework, testing: true, linting: true })]
  });

export const createLibraryPreset = (name: string) =>
  preset(name, {
    extends: [esm],
    override: {
      'package.json': {
        main: 'dist/index.js',
        module: 'dist/index.esm.js',
        types: 'dist/index.d.ts',
        files: ['dist'],
        scripts: {
          'build': 'rollup -c',
          'build:types': 'tsc --emitDeclarationOnly'
        }
      }
    }
  });