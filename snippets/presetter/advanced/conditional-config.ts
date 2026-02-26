// Advanced Presetter Patterns: Conditional Configuration
import { preset } from 'presetter';
import type { PresetConfig } from 'presetter';
import esm from 'presetter-preset-esm';
import strict from 'presetter-preset-strict';

// 1. Environment-based configuration
const getEnvironmentConfig = (env: string): PresetConfig => {
  const baseConfig = {
    extends: [esm, strict],
    variables: {
      target: 'ES2023'
    }
  };

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        override: {
          'vite.config.ts': {
            build: {
              sourcemap: true,
              minify: false
            },
            server: {
              hmr: true,
              port: 3000
            }
          }
        }
      };

    case 'production':
      return {
        ...baseConfig,
        override: {
          'vite.config.ts': {
            build: {
              sourcemap: false,
              minify: 'esbuild',
              rollupOptions: {
                output: {
                  manualChunks: {
                    vendor: ['react', 'react-dom']
                  }
                }
              }
            }
          }
        }
      };

    case 'testing':
      return {
        ...baseConfig,
        override: {
          'vitest.config.ts': {
            test: {
              environment: 'jsdom',
              coverage: {
                provider: 'v8',
                reporter: ['text', 'html', 'lcov']
              }
            }
          }
        }
      };

    default:
      return baseConfig;
  }
};

export default preset('conditional-app', getEnvironmentConfig(process.env.NODE_ENV || 'development'));

// 2. Feature flag based configuration
interface FeatureFlags {
  typescript: boolean;
  react: boolean;
  vue: boolean;
  testing: boolean;
  pwa: boolean;
  docker: boolean;
  storybook: boolean;
  tailwind: boolean;
}

const createFeatureBasedConfig = (features: Partial<FeatureFlags>): PresetConfig => {
  const config: PresetConfig = {
    extends: [esm],
    dependencies: {
      devDependencies: {}
    },
    override: {
      'package.json': {
        scripts: {}
      }
    }
  };

  // TypeScript support
  if (features.typescript) {
    config.dependencies!.devDependencies!.typescript = '^5.6.0';
    config.dependencies!.devDependencies!['@types/node'] = '^22.0.0';
    config.override!['tsconfig.json'] = {
      compilerOptions: {
        target: 'ES2023',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true
      }
    };
  }

  // React support
  if (features.react) {
    config.dependencies!.dependencies = {
      react: '^18.0.0',
      'react-dom': '^18.0.0'
    };
    config.dependencies!.devDependencies!['@vitejs/plugin-react'] = '^4.0.0';
    if (features.typescript) {
      config.dependencies!.devDependencies!['@types/react'] = '^18.0.0';
      config.dependencies!.devDependencies!['@types/react-dom'] = '^18.0.0';
    }
  }

  // Vue support
  if (features.vue) {
    config.dependencies!.dependencies = {
      vue: '^3.0.0'
    };
    config.dependencies!.devDependencies!['@vitejs/plugin-vue'] = '^5.0.0';
    if (features.typescript) {
      config.dependencies!.devDependencies!['vue-tsc'] = '^2.0.0';
    }
  }

  // Testing support
  if (features.testing) {
    config.dependencies!.devDependencies!.vitest = '^2.0.0';
    config.dependencies!.devDependencies!['@vitest/ui'] = '^2.0.0';
    config.override!['package.json']!.scripts!.test = 'vitest';
    config.override!['package.json']!.scripts!['test:ui'] = 'vitest --ui';
    
    if (features.react || features.vue) {
      config.dependencies!.devDependencies!.jsdom = '^25.0.0';
      config.dependencies!.devDependencies!['@testing-library/jest-dom'] = '^6.0.0';
    }
  }

  // PWA support
  if (features.pwa) {
    config.dependencies!.devDependencies!['vite-plugin-pwa'] = '^0.20.0';
    config.override!['vite.config.ts'] = `
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});`;
  }

  // Storybook support
  if (features.storybook) {
    config.dependencies!.devDependencies!['@storybook/react-vite'] = '^8.0.0';
    config.override!['package.json']!.scripts!.storybook = 'storybook dev -p 6006';
    config.override!['package.json']!.scripts!['build-storybook'] = 'storybook build';
  }

  // Tailwind CSS support
  if (features.tailwind) {
    config.dependencies!.devDependencies!.tailwindcss = '^3.0.0';
    config.dependencies!.devDependencies!.autoprefixer = '^10.0.0';
    config.dependencies!.devDependencies!.postcss = '^8.0.0';
  }

  // Docker support
  if (features.docker) {
    config.templates = {
      'Dockerfile': `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`,
      
      'docker-compose.yml': `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production`
    };
  }

  return config;
};

// 3. Dynamic preset selection based on project analysis
export const analyzeAndCreatePreset = async (projectPath: string) => {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  
  const features: Partial<FeatureFlags> = {};
  
  try {
    // Check for existing files to determine features
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
    );
    
    // Analyze dependencies
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    features.typescript = 'typescript' in allDeps;
    features.react = 'react' in allDeps;
    features.vue = 'vue' in allDeps;
    features.testing = 'vitest' in allDeps || 'jest' in allDeps;
    features.tailwind = 'tailwindcss' in allDeps;
    features.storybook = Object.keys(allDeps).some(dep => dep.includes('@storybook'));
    
    // Check for config files
    const files = await fs.readdir(projectPath);
    features.docker = files.includes('Dockerfile');
    features.pwa = files.includes('manifest.json') || packageJson.name?.includes('pwa');
    
  } catch (error) {
    console.warn('Could not analyze project, using defaults:', error);
  }
  
  return createFeatureBasedConfig(features);
};

// 4. Preset composition with conflict resolution
export const composePresets = (...presets: PresetConfig[]): PresetConfig => {
  const composed: PresetConfig = {
    extends: [],
    dependencies: {
      dependencies: {},
      devDependencies: {}
    },
    override: {},
    variables: {}
  };
  
  for (const preset of presets) {
    // Merge extends arrays
    if (preset.extends) {
      composed.extends = [...(composed.extends || []), ...preset.extends];
    }
    
    // Deep merge dependencies
    if (preset.dependencies) {
      Object.assign(composed.dependencies!.dependencies!, preset.dependencies.dependencies || {});
      Object.assign(composed.dependencies!.devDependencies!, preset.dependencies.devDependencies || {});
    }
    
    // Deep merge overrides (later presets win)
    if (preset.override) {
      for (const [file, config] of Object.entries(preset.override)) {
        if (composed.override![file]) {
          composed.override![file] = { ...composed.override![file], ...config };
        } else {
          composed.override![file] = config;
        }
      }
    }
    
    // Merge variables
    if (preset.variables) {
      Object.assign(composed.variables!, preset.variables);
    }
  }
  
  return composed;
};