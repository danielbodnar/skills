// WXT Basic Usage Examples - v0.20.7+
// Next-generation web extension framework - comprehensive usage guide

// ============================================================================
// PROJECT INITIALIZATION
// ============================================================================

// Initialize new WXT project with CLI (recommended: Bun)
// bunx wxt@latest init my-extension
// cd my-extension && bun install && bun dev

// Alternative package managers:
// npx wxt@latest init my-extension    # NPM
// pnpm dlx wxt@latest init           # PNPM
// yarn create wxt my-extension       # Yarn

// ============================================================================
// CONFIGURATION FILE - wxt.config.ts
// ============================================================================

import { defineConfig } from 'wxt';

export default defineConfig({
  // Source directory (default: ".")
  srcDir: 'src',
  
  // Output directory (default: ".output")
  outDir: 'dist',
  
  // Public assets directory (default: "public")
  publicDir: 'assets',
  
  // Entrypoints directory (default: "entrypoints")
  entrypointsDir: 'entrypoints',
  
  // Manifest configuration
  manifest: {
    name: 'My Extension',
    description: 'A web extension built with WXT',
    version: '1.0.0',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['*://*.google.com/*']
  },
  
  // Enable modules for framework integration
  modules: [
    '@wxt-dev/module-react',    // React support
    '@wxt-dev/module-vue',      // Vue support  
    '@wxt-dev/auto-icons',      // Automatic icon generation
    '@wxt-dev/webextension-polyfill' // Browser API polyfill
  ],
  
  // Vite configuration
  vite: () => ({
    plugins: [
      // Add any Vite plugins here
    ],
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
    }
  }),
  
  // Build configuration
  zip: {
    // Include/exclude files from ZIP
    excludeSources: ['**/*.test.ts', '**/*.spec.ts']
  }
});

// ============================================================================
// BASIC BACKGROUND SCRIPT - entrypoints/background.ts
// ============================================================================

// Simple background script
export default defineBackground(() => {
  console.log('Extension background script loaded');
  
  // Listen for extension installation
  browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
  
  // Handle browser action clicks
  browser.action.onClicked.addListener((tab) => {
    console.log('Browser action clicked on tab:', tab.url);
  });
});

// Background script with lifecycle hooks
export default defineBackground({
  // Configure background script
  persistent: false, // Use service worker (MV3)
  
  main() {
    console.log('Background script started');
    
    // Set up message listeners
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Received message:', message);
      
      if (message.type === 'GET_TAB_INFO') {
        browser.tabs.query({ active: true, currentWindow: true })
          .then(tabs => sendResponse({ tab: tabs[0] }));
        return true; // Keep response channel open
      }
    });
  }
});

// ============================================================================
// BASIC CONTENT SCRIPT - entrypoints/content.ts  
// ============================================================================

// Simple content script
export default defineContentScript({
  matches: ['*://*.example.com/*'],
  main() {
    console.log('Content script loaded on:', location.href);
    
    // Add event listener to page
    document.addEventListener('click', (event) => {
      console.log('Page clicked:', event.target);
    });
  }
});

// Advanced content script with options
export default defineContentScript({
  matches: ['*://*.google.com/*'],
  excludeMatches: ['*://mail.google.com/*'],
  runAt: 'document_idle',
  allFrames: false,
  world: 'ISOLATED', // or 'MAIN'
  
  // CSS injection configuration
  cssInjectionMode: 'ui', // 'manifest' | 'manual' | 'ui'
  
  main(ctx) {
    console.log('Advanced content script loaded');
    
    // Content script context provides utilities
    const ui = ctx.mountUI();
    
    // Inject custom styles
    ctx.injectCSS(`
      .wxt-injected {
        background: yellow !important;
        border: 2px solid red !important;
      }
    `);
    
    // Add class to body
    document.body.classList.add('wxt-injected');
  }
});

// ============================================================================
// BASIC POPUP - entrypoints/popup/index.html
// ============================================================================

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extension Popup</title>
</head>
<body>
  <div id="app">
    <h1>My Extension</h1>
    <button id="click-me">Click Me</button>
    <p id="status">Ready</p>
  </div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
*/

// entrypoints/popup/main.ts
import './style.css';

// Simple popup script
document.getElementById('click-me')?.addEventListener('click', async () => {
  const status = document.getElementById('status')!;
  status.textContent = 'Loading...';
  
  try {
    // Send message to background script
    const response = await browser.runtime.sendMessage({
      type: 'GET_TAB_INFO'
    });
    
    status.textContent = `Current tab: ${response.tab.title}`;
  } catch (error) {
    status.textContent = 'Error occurred';
    console.error(error);
  }
});

// ============================================================================
// DEVELOPMENT WORKFLOW
// ============================================================================

// Package.json scripts
const packageScripts = {
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build", 
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "postinstall": "wxt prepare"
  }
};

// Development commands:
// bun dev              # Start development with Chrome
// bun dev:firefox      # Start development with Firefox  
// bun build            # Build for production
// bun zip              # Create ZIP for Chrome Web Store
// bun zip:firefox      # Create ZIP for Firefox Add-ons

// ============================================================================
// BROWSER API USAGE
// ============================================================================

// Import browser APIs (auto-imported by default)
import { browser } from 'wxt/browser';

// Storage API usage
async function useStorage() {
  // Set storage value
  await browser.storage.local.set({ 
    userPrefs: { theme: 'dark', lang: 'en' }
  });
  
  // Get storage value
  const result = await browser.storage.local.get('userPrefs');
  console.log('User preferences:', result.userPrefs);
  
  // Listen for storage changes
  browser.storage.onChanged.addListener((changes, areaName) => {
    console.log('Storage changed:', changes, 'in area:', areaName);
  });
}

// Tabs API usage
async function useTabs() {
  // Get active tab
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true
  });
  
  console.log('Active tab:', activeTab.title);
  
  // Create new tab
  const newTab = await browser.tabs.create({
    url: 'https://example.com',
    active: false
  });
  
  console.log('Created tab:', newTab.id);
}

// Runtime messaging
async function useMessaging() {
  // Send message to background script
  const response = await browser.runtime.sendMessage({
    type: 'PING',
    data: { timestamp: Date.now() }
  });
  
  console.log('Response from background:', response);
}

// ============================================================================
// TYPESCRIPT CONFIGURATION
// ============================================================================

// tsconfig.json (automatically generated, but can be customized)
const tsConfig = {
  "extends": ".wxt/tsconfig.json",
  "compilerOptions": {
    // Add custom TypeScript options
    "jsx": "react-jsx",
    "strict": true
  }
};

// ============================================================================
// AUTO-IMPORTS CONFIGURATION
// ============================================================================

// Customize auto-imports in wxt.config.ts
export default defineConfig({
  imports: {
    // Disable auto-imports if needed
    disabled: false,
    
    // Add custom auto-imports
    presets: [
      // Built-in presets available
      'vue',
      'react'
    ],
    
    // Custom imports
    imports: [
      {
        name: 'useState',
        from: 'react'
      }
    ],
    
    // ESLint integration
    eslintrc: {
      enabled: 9 // Enable ESLint 9 integration
    }
  }
});

// ============================================================================
// BUILD CUSTOMIZATION
// ============================================================================

// Custom build configuration
export default defineConfig({
  // Target specific browsers
  browser: 'chrome', // 'chrome' | 'firefox' | 'safari' | 'edge'
  
  // Manifest version
  manifestVersion: 3, // 2 | 3
  
  // Custom output naming
  outDir: 'dist',
  
  // ZIP configuration
  zip: {
    name: 'my-extension-{{browser}}-v{{version}}.zip',
    includeSources: true, // Include sources for Firefox review
    excludeSources: [
      '**/*.test.ts',
      '**/*.spec.ts', 
      '**/node_modules/**'
    ]
  },
  
  // Environment variables
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version),
    __BROWSER__: JSON.stringify(process.env.BROWSER || 'chrome')
  }
});

// ============================================================================
// DEBUGGING AND DEVELOPMENT
// ============================================================================

// Development utilities
function debugExtension() {
  // Check if in development mode
  if (import.meta.env.DEV) {
    console.log('Development mode active');
    
    // Enable debug logging
    browser.runtime.setUninstallURL('http://localhost:3000/debug');
  }
  
  // Browser detection
  console.log('Browser:', import.meta.env.BROWSER);
  console.log('Manifest version:', import.meta.env.MANIFEST_VERSION);
  console.log('Environment:', import.meta.env.MODE);
}

// Error handling
function handleErrors() {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Report to analytics or error service
    browser.runtime.sendMessage({
      type: 'ERROR_REPORT',
      error: {
        message: event.error.message,
        stack: event.error.stack,
        url: location.href
      }
    });
  });
}

// Performance monitoring
function monitorPerformance() {
  // Measure script execution time
  const start = performance.now();
  
  // Your code here
  
  const end = performance.now();
  console.log(`Execution time: ${end - start}ms`);
}