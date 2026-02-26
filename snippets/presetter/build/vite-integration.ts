// Presetter with Vite Build Configuration
import { preset } from 'presetter';
import esm from 'presetter-preset-esm';

// 1. Basic Vite configuration with Presetter
export default preset('vite-app', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      vite: '^6.0.0',
      '@vitejs/plugin-react': '^4.0.0',
      '@types/node': '^22.0.0'
    }
  },
  
  override: {
    'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@store': resolve(__dirname, './src/store'),
      '@assets': resolve(__dirname, './src/assets')
    }
  },
  
  build: {
    target: 'ES2023',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-dialog']
        }
      }
    }
  },
  
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: true
    }
  },
  
  preview: {
    port: 4173,
    host: true
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});`,

    'package.json': {
      type: 'module',
      scripts: {
        'dev': 'vite',
        'build': 'tsc && vite build',
        'preview': 'vite preview',
        'build:analyze': 'vite build --mode analyze'
      }
    },

    'tsconfig.json': {
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*'],
          '@components/*': ['./src/components/*'],
          '@utils/*': ['./src/utils/*'],
          '@types/*': ['./src/types/*'],
          '@hooks/*': ['./src/hooks/*'],
          '@store/*': ['./src/store/*'],
          '@assets/*': ['./src/assets/*']
        }
      }
    }
  }
});

// 2. Advanced Vite configuration with multiple environments
export const advancedVitePreset = preset('advanced-vite', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      vite: '^6.0.0',
      '@vitejs/plugin-react': '^4.0.0',
      'vite-plugin-pwa': '^0.20.0',
      'vite-bundle-analyzer': '^0.11.0',
      'vite-plugin-eslint': '^1.8.0',
      'rollup-plugin-visualizer': '^5.0.0'
    }
  },
  
  override: {
    'vite.config.ts': `import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'node:path';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const isDev = command === 'serve';
  const isProd = mode === 'production';
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      react({
        // Enable React DevTools in development
        jsxImportSource: isDev ? '@welldone-software/why-did-you-render' : 'react'
      }),
      
      // PWA configuration
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'My App',
          short_name: 'MyApp',
          description: 'My awesome application',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\\/\\/api\\.example\\.com\\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            }
          ]
        }
      }),
      
      // Bundle analyzer
      isAnalyze && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: isDev
    },
    
    build: {
      target: 'ES2023',
      minify: isProd ? 'esbuild' : false,
      sourcemap: isDev || env.VITE_SOURCEMAP === 'true',
      
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('lodash') || id.includes('date-fns')) {
                return 'utils-vendor';
              }
              return 'vendor';
            }
          }
        }
      },
      
      // Optimize chunk size warnings
      chunkSizeWarningLimit: 1000
    },
    
    server: {
      port: Number(env.VITE_PORT) || 3000,
      host: env.VITE_HOST || 'localhost',
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    
    preview: {
      port: Number(env.VITE_PREVIEW_PORT) || 4173,
      host: env.VITE_HOST || 'localhost'
    }
  };
});`,

    '.env.example': `# App Configuration
VITE_APP_TITLE="My Application"
VITE_APP_DESCRIPTION="My awesome application"

# Server Configuration
VITE_PORT=3000
VITE_HOST=localhost
VITE_PREVIEW_PORT=4173

# API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=10000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PWA=true
VITE_ENABLE_DEVTOOLS=true

# Build Configuration
VITE_SOURCEMAP=true
VITE_BUILD_ANALYZE=false`
  }
});

// 3. Library build configuration with Vite
export const libraryVitePreset = preset('vite-library', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      vite: '^6.0.0',
      '@vitejs/plugin-react': '^4.0.0',
      'vite-plugin-dts': '^4.0.0',
      'vite-plugin-externals': '^0.6.0'
    }
  },
  
  override: {
    'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.*', 'src/**/*.stories.*']
    })
  ],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyLibrary',
      formats: ['es', 'cjs'],
      fileName: (format) => \`index.\${format === 'es' ? 'mjs' : 'cjs'}\`
    },
    
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    
    sourcemap: true,
    minify: 'esbuild'
  }
});`,

    'package.json': {
      type: 'module',
      main: './dist/index.cjs',
      module: './dist/index.mjs',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          import: './dist/index.mjs',
          require: './dist/index.cjs',
          types: './dist/index.d.ts'
        }
      },
      files: ['dist'],
      scripts: {
        'build': 'tsc && vite build',
        'build:watch': 'vite build --watch'
      },
      peerDependencies: {
        react: '>=16.8.0',
        'react-dom': '>=16.8.0'
      }
    }
  }
});

// 4. Micro-frontend configuration with Vite
export const microfrontendVitePreset = preset('vite-microfrontend', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      vite: '^6.0.0',
      '@vitejs/plugin-react': '^4.0.0',
      '@originjs/vite-plugin-federation': '^1.3.0'
    }
  },
  
  override: {
    'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        mf_header: 'http://localhost:3001/assets/remoteEntry.js',
        mf_footer: 'http://localhost:3002/assets/remoteEntry.js'
      },
      shared: ['react', 'react-dom']
    })
  ],
  
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  },
  
  server: {
    port: 3000,
    cors: true
  }
});`
  }
});