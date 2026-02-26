// WXT Framework Integration Examples
// React, Vue, Svelte, and Solid integration patterns

// ============================================================================
// REACT INTEGRATION
// ============================================================================

// Install: bun add react react-dom && bun add -D @wxt-dev/module-react

// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  
  react: {
    vite: {
      esbuild: {
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment'
      }
    }
  }
});

// React Content Script with Shadow DOM
// entrypoints/content/react-ui.content.ts
import { createRoot } from 'react-dom/client';
import App from './App';

export default defineContentScript({
  matches: ['*://*.example.com/*'],
  
  main(ctx) {
    // Create shadow DOM UI
    const ui = createShadowRootUi(ctx, {
      name: 'react-overlay',
      position: 'overlay',
      zIndex: 9999,
      onMount: (container) => {
        // Create React root and render app
        const root = createRoot(container);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        // Cleanup React root
        root?.unmount();
      }
    });
    
    ui.mount();
  }
});

// React Component Example
// entrypoints/content/App.tsx
import React, { useState, useEffect } from 'react';
import { storage } from 'wxt/storage';

const userPrefs = storage.defineItem<{
  theme: 'light' | 'dark';
}>('local:userPrefs');

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Load theme from storage
    userPrefs.getValue().then(prefs => {
      if (prefs?.theme) {
        setTheme(prefs.theme);
      }
    });
  }, []);
  
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await userPrefs.setValue({ theme: newTheme });
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`wxt-overlay wxt-${theme}`}>
      <div className="wxt-header">
        <h3>WXT React Extension</h3>
        <button onClick={() => setIsVisible(false)}>×</button>
      </div>
      
      <div className="wxt-content">
        <p>Current theme: {theme}</p>
        <button onClick={toggleTheme}>
          Switch to {theme === 'light' ? 'dark' : 'light'} theme
        </button>
      </div>
      
      <style jsx>{`
        .wxt-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 300px;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .wxt-light {
          background: white;
          color: black;
          border: 1px solid #ccc;
        }
        
        .wxt-dark {
          background: #2a2a2a;
          color: white;
          border: 1px solid #555;
        }
        
        .wxt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .wxt-header h3 {
          margin: 0;
          font-size: 16px;
        }
        
        .wxt-header button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: inherit;
        }
        
        .wxt-content button {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .wxt-dark .wxt-content button {
          background: #0d6efd;
        }
      `}</style>
    </div>
  );
};

export default App;

// React Popup Example
// entrypoints/popup/Popup.tsx
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface TabInfo {
  title: string;
  url: string;
  id: number;
}

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Get active tab info
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs[0]) {
          setActiveTab({
            title: tabs[0].title || '',
            url: tabs[0].url || '',
            id: tabs[0].id || 0
          });
        }
        setLoading(false);
      });
  }, []);
  
  const injectContentScript = async () => {
    if (!activeTab?.id) return;
    
    try {
      await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content-scripts/react-ui.js']
      });
    } catch (error) {
      console.error('Failed to inject script:', error);
    }
  };
  
  if (loading) {
    return <div className="popup-loading">Loading...</div>;
  }
  
  return (
    <div className="popup-container">
      <h2>WXT React Popup</h2>
      
      <div className="tab-info">
        <h3>Active Tab</h3>
        <p><strong>Title:</strong> {activeTab?.title}</p>
        <p><strong>URL:</strong> {activeTab?.url}</p>
      </div>
      
      <button onClick={injectContentScript} className="inject-btn">
        Inject React UI
      </button>
    </div>
  );
};

// Mount React app to popup
const container = document.getElementById('app')!;
const root = createRoot(container);
root.render(<Popup />);

// ============================================================================
// VUE INTEGRATION
// ============================================================================

// Install: bun add vue && bun add -D @wxt-dev/module-vue

// wxt.config.ts for Vue
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  
  vue: {
    vite: {
      script: {
        propsDestructure: true,
        defineModel: true
      }
    }
  }
});

// Vue Content Script
// entrypoints/content/vue-ui.content.ts
import { createApp } from 'vue';
import App from './App.vue';

export default defineContentScript({
  matches: ['*://*.example.com/*'],
  
  main(ctx) {
    const ui = createShadowRootUi(ctx, {
      name: 'vue-overlay',
      position: 'overlay',
      zIndex: 9999,
      onMount: (container) => {
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
      }
    });
    
    ui.mount();
  }
});

// Vue Component
// entrypoints/content/App.vue
<template>
  <div class="vue-overlay" :class="themeClass">
    <div class="overlay-header">
      <h3>WXT Vue Extension</h3>
      <button @click="isVisible = false">×</button>
    </div>
    
    <div class="overlay-content">
      <p>Current theme: {{ theme }}</p>
      <button @click="toggleTheme">
        Switch to {{ theme === 'light' ? 'dark' : 'light' }} theme
      </button>
      
      <div class="stats">
        <p>Page visits: {{ visitCount }}</p>
        <button @click="incrementVisits">Track Visit</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storage } from 'wxt/storage';

// Storage definitions
const userPrefs = storage.defineItem<{
  theme: 'light' | 'dark';
  visitCount: number;
}>('local:userPrefs', {
  defaultValue: { theme: 'light', visitCount: 0 }
});

// Reactive state
const isVisible = ref(true);
const theme = ref<'light' | 'dark'>('light');
const visitCount = ref(0);

// Computed properties
const themeClass = computed(() => `vue-${theme.value}`);

// Methods
const toggleTheme = async () => {
  const newTheme = theme.value === 'light' ? 'dark' : 'light';
  theme.value = newTheme;
  
  const current = await userPrefs.getValue();
  await userPrefs.setValue({
    ...current,
    theme: newTheme
  });
};

const incrementVisits = async () => {
  visitCount.value++;
  
  const current = await userPrefs.getValue();
  await userPrefs.setValue({
    ...current,
    visitCount: visitCount.value
  });
};

// Lifecycle
onMounted(async () => {
  const prefs = await userPrefs.getValue();
  if (prefs) {
    theme.value = prefs.theme;
    visitCount.value = prefs.visitCount;
  }
});
</script>

<style scoped>
.vue-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.vue-light {
  background: white;
  color: black;
  border: 1px solid #ccc;
}

.vue-dark {
  background: #2a2a2a;
  color: white;
  border: 1px solid #555;
}

.overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.overlay-header h3 {
  margin: 0;
  font-size: 16px;
}

.overlay-header button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: inherit;
}

.overlay-content button {
  background: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin: 4px;
}

.vue-dark .overlay-content button {
  background: #369870;
}

.stats {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ccc;
}

.vue-dark .stats {
  border-top-color: #555;
}
</style>

// ============================================================================
// SVELTE INTEGRATION
// ============================================================================

// Install: bun add svelte && bun add -D @wxt-dev/module-svelte

// wxt.config.ts for Svelte
export default defineConfig({
  modules: ['@wxt-dev/module-svelte'],
  
  svelte: {
    vite: {
      // Svelte Vite configuration options
    }
  }
});

// Svelte Content Script
// entrypoints/content/svelte-ui.content.ts
import App from './App.svelte';

export default defineContentScript({
  matches: ['*://*.example.com/*'],
  
  main(ctx) {
    const ui = createShadowRootUi(ctx, {
      name: 'svelte-overlay',
      position: 'overlay',
      zIndex: 9999,
      onMount: (container) => {
        const app = new App({
          target: container,
          props: {
            initialTheme: 'light'
          }
        });
        return app;
      },
      onRemove: (app) => {
        app?.$destroy();
      }
    });
    
    ui.mount();
  }
});

// Svelte Component
// entrypoints/content/App.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { storage } from 'wxt/storage';
  
  // Props
  export let initialTheme: 'light' | 'dark' = 'light';
  
  // State
  let isVisible = true;
  let theme = initialTheme;
  let visitCount = 0;
  
  // Storage
  const userPrefs = storage.defineItem<{
    theme: 'light' | 'dark';
    visitCount: number;
  }>('local:userPrefs', {
    defaultValue: { theme: 'light', visitCount: 0 }
  });
  
  // Methods
  const toggleTheme = async () => {
    theme = theme === 'light' ? 'dark' : 'light';
    
    const current = await userPrefs.getValue();
    await userPrefs.setValue({
      ...current,
      theme
    });
  };
  
  const incrementVisits = async () => {
    visitCount++;
    
    const current = await userPrefs.getValue();
    await userPrefs.setValue({
      ...current,
      visitCount
    });
  };
  
  // Lifecycle
  onMount(async () => {
    const prefs = await userPrefs.getValue();
    if (prefs) {
      theme = prefs.theme;
      visitCount = prefs.visitCount;
    }
  });
</script>

{#if isVisible}
  <div class="svelte-overlay {theme}">
    <div class="overlay-header">
      <h3>WXT Svelte Extension</h3>
      <button on:click={() => isVisible = false}>×</button>
    </div>
    
    <div class="overlay-content">
      <p>Current theme: {theme}</p>
      <button on:click={toggleTheme}>
        Switch to {theme === 'light' ? 'dark' : 'light'} theme
      </button>
      
      <div class="stats">
        <p>Page visits: {visitCount}</p>
        <button on:click={incrementVisits}>Track Visit</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .svelte-overlay {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  .light {
    background: white;
    color: black;
    border: 1px solid #ccc;
  }
  
  .dark {
    background: #2a2a2a;
    color: white;
    border: 1px solid #555;
  }
  
  .overlay-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .overlay-header h3 {
    margin: 0;
    font-size: 16px;
  }
  
  .overlay-header button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: inherit;
  }
  
  .overlay-content button {
    background: #ff3e00;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin: 4px;
  }
  
  .dark .overlay-content button {
    background: #cc3100;
  }
  
  .stats {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ccc;
  }
  
  .dark .stats {
    border-top-color: #555;
  }
</style>

// ============================================================================
// SOLID.JS INTEGRATION
// ============================================================================

// Install: bun add solid-js && bun add -D @wxt-dev/module-solid

// wxt.config.ts for Solid
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  
  solid: {
    vite: {
      // Solid Vite configuration options
    }
  }
});

// Solid Content Script
// entrypoints/content/solid-ui.content.ts
import { render } from 'solid-js/web';
import App from './App';

export default defineContentScript({
  matches: ['*://*.example.com/*'],
  
  main(ctx) {
    const ui = createShadowRootUi(ctx, {
      name: 'solid-overlay',
      position: 'overlay',
      zIndex: 9999,
      onMount: (container) => {
        const dispose = render(() => <App />, container);
        return dispose;
      },
      onRemove: (dispose) => {
        dispose?.();
      }
    });
    
    ui.mount();
  }
});

// Solid Component
// entrypoints/content/App.tsx (Solid)
import { createSignal, createEffect, onMount } from 'solid-js';
import { storage } from 'wxt/storage';

const userPrefs = storage.defineItem<{
  theme: 'light' | 'dark';
  visitCount: number;
}>('local:userPrefs', {
  defaultValue: { theme: 'light', visitCount: 0 }
});

const App = () => {
  const [isVisible, setIsVisible] = createSignal(true);
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light');
  const [visitCount, setVisitCount] = createSignal(0);
  
  const toggleTheme = async () => {
    const newTheme = theme() === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    const current = await userPrefs.getValue();
    await userPrefs.setValue({
      ...current,
      theme: newTheme
    });
  };
  
  const incrementVisits = async () => {
    const newCount = visitCount() + 1;
    setVisitCount(newCount);
    
    const current = await userPrefs.getValue();
    await userPrefs.setValue({
      ...current,
      visitCount: newCount
    });
  };
  
  onMount(async () => {
    const prefs = await userPrefs.getValue();
    if (prefs) {
      setTheme(prefs.theme);
      setVisitCount(prefs.visitCount);
    }
  });
  
  return (
    <>
      {isVisible() && (
        <div class={`solid-overlay ${theme()}`}>
          <div class="overlay-header">
            <h3>WXT Solid Extension</h3>
            <button onClick={() => setIsVisible(false)}>×</button>
          </div>
          
          <div class="overlay-content">
            <p>Current theme: {theme()}</p>
            <button onClick={toggleTheme}>
              Switch to {theme() === 'light' ? 'dark' : 'light'} theme
            </button>
            
            <div class="stats">
              <p>Page visits: {visitCount()}</p>
              <button onClick={incrementVisits}>Track Visit</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .solid-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 320px;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .light {
          background: white;
          color: black;
          border: 1px solid #ccc;
        }
        
        .dark {
          background: #2a2a2a;
          color: white;
          border: 1px solid #555;
        }
        
        .overlay-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .overlay-header h3 {
          margin: 0;
          font-size: 16px;
        }
        
        .overlay-header button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: inherit;
        }
        
        .overlay-content button {
          background: #2c4f7c;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin: 4px;
        }
        
        .dark .overlay-content button {
          background: #4a6fa5;
        }
        
        .stats {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #ccc;
        }
        
        .dark .stats {
          border-top-color: #555;
        }
      `}</style>
    </>
  );
};

export default App;

// ============================================================================
// VANILLA JS WITH WXT UTILITIES
// ============================================================================

// For projects not using frameworks but wanting WXT utilities
// entrypoints/content/vanilla-ui.content.ts
export default defineContentScript({
  matches: ['*://*.example.com/*'],
  
  main(ctx) {
    // Create UI without framework
    const ui = createShadowRootUi(ctx, {
      name: 'vanilla-overlay',
      position: 'overlay',
      zIndex: 9999,
      onMount: (container) => {
        // Create vanilla JS UI
        const overlay = createOverlayElement();
        container.appendChild(overlay);
        
        // Setup event listeners
        setupEventListeners(overlay);
        
        return overlay;
      },
      onRemove: (element) => {
        element?.remove();
      }
    });
    
    ui.mount();
  }
});

function createOverlayElement(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'vanilla-overlay light';
  
  overlay.innerHTML = `
    <div class="overlay-header">
      <h3>WXT Vanilla Extension</h3>
      <button id="close-btn">×</button>
    </div>
    
    <div class="overlay-content">
      <p>Current theme: <span id="theme-display">light</span></p>
      <button id="theme-btn">Switch to dark theme</button>
      
      <div class="stats">
        <p>Page visits: <span id="visit-count">0</span></p>
        <button id="visit-btn">Track Visit</button>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .vanilla-overlay {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .light {
      background: white;
      color: black;
      border: 1px solid #ccc;
    }
    
    .dark {
      background: #2a2a2a;
      color: white;
      border: 1px solid #555;
    }
    
    .overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .overlay-content button {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin: 4px;
    }
  `;
  
  overlay.appendChild(style);
  return overlay;
}

function setupEventListeners(overlay: HTMLElement) {
  let theme = 'light';
  let visitCount = 0;
  
  const themeDisplay = overlay.querySelector('#theme-display')!;
  const themeBtn = overlay.querySelector('#theme-btn') as HTMLButtonElement;
  const visitDisplay = overlay.querySelector('#visit-count')!;
  const visitBtn = overlay.querySelector('#visit-btn')!;
  const closeBtn = overlay.querySelector('#close-btn')!;
  
  // Theme toggle
  themeBtn.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    overlay.className = `vanilla-overlay ${theme}`;
    themeDisplay.textContent = theme;
    themeBtn.textContent = `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`;
  });
  
  // Visit counter
  visitBtn.addEventListener('click', () => {
    visitCount++;
    visitDisplay.textContent = visitCount.toString();
  });
  
  // Close button
  closeBtn.addEventListener('click', () => {
    overlay.remove();
  });
}