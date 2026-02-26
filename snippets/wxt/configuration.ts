// WXT Configuration Examples
// Comprehensive guide for configuring WXT projects

// ============================================================================
// BASIC CONFIGURATION - wxt.config.ts
// ============================================================================

import { defineConfig } from 'wxt';
import { resolve } from 'node:path';

export default defineConfig({
  // Project structure
  srcDir: 'src',
  outDir: 'dist',
  publicDir: 'assets',
  entrypointsDir: 'entrypoints',
  modulesDir: 'modules',
  
  // Manifest configuration
  manifest: {
    name: 'My Web Extension',
    description: 'A powerful web extension built with WXT',
    version: '1.0.0',
    
    // Permissions
    permissions: [
      'storage',
      'activeTab',
      'tabs',
      'scripting'
    ],
    
    // Host permissions (MV3)
    host_permissions: [
      '*://*.google.com/*',
      '*://*.github.com/*'
    ],
    
    // Icons
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png'
    },
    
    // Action (browser action)
    action: {
      default_popup: 'popup.html',
      default_title: 'My Extension'
    },
    
    // Content security policy
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'"
    },
    
    // Web accessible resources
    web_accessible_resources: [
      {
        resources: ['content-styles.css', 'images/*.png'],
        matches: ['*://*.example.com/*']
      }
    ]
  }
});

// ============================================================================
// ADVANCED CONFIGURATION WITH MODULES
// ============================================================================

export default defineConfig({
  // Enable framework modules
  modules: [
    '@wxt-dev/module-react',
    '@wxt-dev/module-vue', 
    '@wxt-dev/auto-icons',
    '@wxt-dev/webextension-polyfill',
    '@wxt-dev/i18n',
    '@wxt-dev/storage',
    '@wxt-dev/unocss'
  ],
  
  // Module-specific configuration
  react: {
    vite: {
      // React-specific Vite options
      esbuild: {
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment'
      }
    }
  },
  
  vue: {
    vite: {
      script: {
        propsDestructure: true,
        defineModel: true
      }
    }
  },
  
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de']
  },
  
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
    sizes: [16, 24, 32, 48, 96, 128]
  },
  
  unocss: {
    excludeEntrypoints: ['background']
  }
});

// ============================================================================
// TYPESCRIPT CONFIGURATION
// ============================================================================

export default defineConfig({
  // Path aliases
  alias: {
    '~': resolve('src'),
    '@': resolve('src'),
    'components': resolve('src/components'),
    'utils': resolve('src/utils'),
    'stores': resolve('src/stores')
  },
  
  // TypeScript configuration will be automatically generated
  // but you can customize tsconfig.json:
  /*
  {
    "extends": ".wxt/tsconfig.json",
    "compilerOptions": {
      "jsx": "react-jsx",
      "strict": true,
      "baseUrl": ".",
      "paths": {
        "~/*": ["src/*"],
        "@/*": ["src/*"]
      }
    }
  }
  */
});

// ============================================================================
// VITE INTEGRATION
// ============================================================================

import react from '@vitejs/plugin-react';
import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    plugins: [
      react(), // Add React support
      // Add any other Vite plugins
    ],
    
    // Build options
    build: {
      sourcemap: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    
    // Development server
    server: {
      port: 3000,
      open: false
    },
    
    // Environment variables
    define: {
      __VERSION__: JSON.stringify(process.env.npm_package_version),
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
    },
    
    // CSS configuration
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "~/styles/variables.scss";`
        }
      }
    }
  })
});

// ============================================================================
// AUTO-IMPORTS CONFIGURATION
// ============================================================================

export default defineConfig({
  imports: {
    // Enable/disable auto-imports
    disabled: false,
    
    // Presets for common frameworks
    presets: [
      'react',
      'vue',
      'vue-router'
    ],
    
    // Custom imports
    imports: [
      // Named imports
      {
        name: 'useState',
        from: 'react'
      },
      {
        name: 'ref',
        from: 'vue'
      },
      
      // Default imports
      {
        name: 'default',
        as: 'axios',
        from: 'axios'
      }
    ],
    
    // Directory-based auto-imports
    dirs: [
      'src/composables',
      'src/stores',
      'src/utils'
    ],
    
    // ESLint integration
    eslintrc: {
      enabled: 9, // ESLint version (8 or 9)
      filepath: './.wxt/eslint-auto-imports.mjs',
      globalsPropValue: true
    }
  }
});

// ============================================================================
// BUILD AND ZIP CONFIGURATION
// ============================================================================

export default defineConfig({
  // Target browser
  browser: process.env.BROWSER || 'chrome', // 'chrome' | 'firefox' | 'safari' | 'edge'
  
  // Manifest version
  manifestVersion: 3, // 2 | 3
  
  // Build output
  outDir: 'dist',
  
  // ZIP configuration for store submission
  zip: {
    // Output naming pattern
    name: 'extension-{{browser}}-v{{version}}.zip',
    
    // Include source files for Firefox AMO review
    includeSources: true,
    
    // Exclude files from ZIP
    excludeSources: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/node_modules/**',
      '**/.git/**',
      '**/coverage/**',
      '**/.env*',
      '**/tsconfig.json'
    ],
    
    // Additional ZIP files
    artifactTemplate: '{{name}}-{{version}}-{{browser}}.zip',
    
    // Compression level
    compressionLevel: 9
  },
  
  // Development configuration
  runner: {
    // Disable automatic browser opening
    disabled: false,
    
    // Browser startup configuration
    startUrls: ['https://example.com'],
    
    // Chrome-specific options
    chromiumArgs: [
      '--disable-extensions-except={{extensionDir}}',
      '--load-extension={{extensionDir}}'
    ]
  }
});

// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATION
// ============================================================================

export default defineConfig({
  // Define environment variables
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version),
    __BROWSER__: JSON.stringify(process.env.BROWSER || 'chrome'),
    __MANIFEST_VERSION__: JSON.stringify(process.env.MANIFEST_VERSION || 3),
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __API_BASE_URL__: JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? 'https://api.example.com'
        : 'http://localhost:3001'
    )
  },
  
  // Environment-specific manifest
  manifest: {
    name: process.env.NODE_ENV === 'production' 
      ? 'My Extension'
      : 'My Extension (Dev)',
    
    version: process.env.npm_package_version,
    
    // Conditional permissions
    permissions: [
      'storage',
      'activeTab',
      ...(process.env.NODE_ENV === 'development' ? ['tabs'] : [])
    ],
    
    // Development-only features
    ...(process.env.NODE_ENV === 'development' && {
      content_security_policy: {
        extension_pages: "script-src 'self' 'unsafe-eval'; object-src 'self'"
      }
    })
  }
});

// ============================================================================
// BROWSER-SPECIFIC CONFIGURATION
// ============================================================================

export default defineConfig({
  // Transform manifest for different browsers
  transformManifest: (manifest, browser) => {
    // Firefox-specific modifications
    if (browser === 'firefox') {
      manifest.browser_specific_settings = {
        gecko: {
          id: 'my-extension@example.com',
          strict_min_version: '90.0'
        }
      };
    }
    
    // Safari-specific modifications
    if (browser === 'safari') {
      // Safari doesn't support service workers yet
      if (manifest.manifest_version === 3) {
        manifest.background = {
          scripts: ['background.js'],
          persistent: false
        };
      }
    }
    
    return manifest;
  }
});

// ============================================================================
// DEVELOPMENT WORKFLOW CONFIGURATION
// ============================================================================

// Package.json scripts for different environments
const scripts = {
  // Development
  "dev": "wxt",
  "dev:chrome": "wxt -b chrome",
  "dev:firefox": "wxt -b firefox",
  "dev:safari": "wxt -b safari",
  
  // Building
  "build": "wxt build",
  "build:chrome": "wxt build -b chrome",
  "build:firefox": "wxt build -b firefox",
  
  // ZIP creation
  "zip": "wxt zip",
  "zip:all": "wxt zip -b chrome && wxt zip -b firefox",
  
  // Utilities
  "prepare": "wxt prepare",
  "typecheck": "tsc --noEmit"
};

// ============================================================================
// WEB-EXT CONFIGURATION (for Firefox development)
// ============================================================================

// web-ext.config.ts
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // Source directory
  sourceDir: 'dist',
  
  // Firefox-specific options
  run: {
    firefox: 'firefox-developer-edition',
    startUrl: ['https://example.com'],
    browserConsole: true,
    target: ['firefox-desktop']
  },
  
  // Build options
  build: {
    overwriteDest: true,
    filename: 'extension-{version}.zip'
  },
  
  // Linting
  lint: {
    pretty: true,
    warningsAsErrors: false
  }
});

// ============================================================================
// CUSTOM WXT MODULE CONFIGURATION
// ============================================================================

// Define custom module options interface
declare module 'wxt' {
  export interface InlineConfig {
    myCustomModule?: {
      enabled: boolean;
      options: Record<string, any>;
    };
  }
}

export default defineConfig({
  // Use custom module
  modules: ['./modules/my-custom-module'],
  
  // Configure custom module
  myCustomModule: {
    enabled: true,
    options: {
      feature1: true,
      feature2: 'advanced'
    }
  }
});

// ============================================================================
// VITEST CONFIGURATION FOR TESTING
// ============================================================================

// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [WxtVitest()],
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        'dist/'
      ]
    }
  }
});

// ============================================================================
// PUBLISHING CONFIGURATION
// ============================================================================

export default defineConfig({
  // Publishing to Chrome Web Store
  submit: {
    chrome: {
      extensionId: process.env.CHROME_EXTENSION_ID,
      clientId: process.env.CHROME_CLIENT_ID,
      clientSecret: process.env.CHROME_CLIENT_SECRET,
      refreshToken: process.env.CHROME_REFRESH_TOKEN
    },
    
    // Publishing to Firefox Add-ons
    firefox: {
      extensionId: process.env.FIREFOX_EXTENSION_ID,
      jwtIssuer: process.env.FIREFOX_JWT_ISSUER,
      jwtSecret: process.env.FIREFOX_JWT_SECRET
    }
  }
});