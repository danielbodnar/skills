// WXT Testing Examples
// Comprehensive guide for testing WXT extensions

// ============================================================================
// VITEST CONFIGURATION
// ============================================================================

// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [WxtVitest()],
  
  test: {
    // Global test configuration
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    
    // Mock browser APIs
    browser: {
      enabled: true,
      name: 'chromium'
    },
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        'dist/',
        'entrypoints/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});

// ============================================================================
// TEST SETUP
// ============================================================================

// test/setup.ts
import { beforeEach, afterEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

// Reset fake browser state before each test
beforeEach(() => {
  fakeBrowser.reset();
});

// Cleanup after each test
afterEach(() => {
  fakeBrowser.reset();
});

// Global test utilities
declare global {
  function createMockTab(overrides?: Partial<browser.tabs.Tab>): browser.tabs.Tab;
  function waitForElement(selector: string, timeout?: number): Promise<Element>;
}

globalThis.createMockTab = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  index: 0,
  highlighted: false,
  active: true,
  pinned: false,
  incognito: false,
  windowId: 1,
  url: 'https://example.com',
  title: 'Example Page',
  ...overrides
});

globalThis.waitForElement = (selector: string, timeout = 5000): Promise<Element> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
};

// ============================================================================
// STORAGE TESTING
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from 'wxt/storage';
import { fakeBrowser } from 'wxt/testing';

describe('Storage Tests', () => {
  const userSettings = storage.defineItem<{
    theme: 'light' | 'dark';
    language: string;
  }>('local:userSettings', {
    defaultValue: { theme: 'light', language: 'en' }
  });
  
  beforeEach(() => {
    fakeBrowser.reset();
  });
  
  it('should store and retrieve user settings', async () => {
    // Set storage value
    await userSettings.setValue({
      theme: 'dark',
      language: 'es'
    });
    
    // Get storage value
    const settings = await userSettings.getValue();
    
    expect(settings).toEqual({
      theme: 'dark',
      language: 'es'
    });
  });
  
  it('should return default value when not set', async () => {
    const settings = await userSettings.getValue();
    
    expect(settings).toEqual({
      theme: 'light',
      language: 'en'
    });
  });
  
  it('should watch for storage changes', async () => {
    const watcherSpy = vi.fn();
    
    // Setup watcher
    const unwatch = userSettings.watch(watcherSpy);
    
    // Change value
    await userSettings.setValue({
      theme: 'dark',
      language: 'fr'
    });
    
    // Verify watcher was called
    expect(watcherSpy).toHaveBeenCalledWith(
      { theme: 'dark', language: 'fr' },
      { theme: 'light', language: 'en' }
    );
    
    unwatch();
  });
  
  it('should handle storage removal', async () => {
    // Set value
    await userSettings.setValue({
      theme: 'dark',
      language: 'es'
    });
    
    // Remove value
    await userSettings.removeValue();
    
    // Check value is removed
    const settings = await userSettings.getValue();
    expect(settings).toEqual({
      theme: 'light',
      language: 'en'
    });
  });
});

// ============================================================================
// MESSAGING TESTING
// ============================================================================

describe('Messaging Tests', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });
  
  it('should handle runtime messages', async () => {
    // Mock message handler
    const messageHandler = vi.fn().mockResolvedValue({ success: true });
    
    // Setup message listener
    fakeBrowser.runtime.onMessage.addListener(messageHandler);
    
    // Send message
    const response = await browser.runtime.sendMessage({
      type: 'TEST_MESSAGE',
      data: { foo: 'bar' }
    });
    
    // Verify handler was called
    expect(messageHandler).toHaveBeenCalledWith(
      { type: 'TEST_MESSAGE', data: { foo: 'bar' } },
      expect.any(Object),
      expect.any(Function)
    );
    
    expect(response).toEqual({ success: true });
  });
  
  it('should handle message sending errors', async () => {
    // Mock error
    fakeBrowser.runtime.sendMessage = vi.fn().mockRejectedValue(
      new Error('Extension context invalidated')
    );
    
    // Attempt to send message
    await expect(
      browser.runtime.sendMessage({ type: 'TEST' })
    ).rejects.toThrow('Extension context invalidated');
  });
  
  it('should handle port connections', () => {
    const mockPort = fakeBrowser.runtime.connect({ name: 'test-port' });
    const messageHandler = vi.fn();
    
    // Setup port listener
    mockPort.onMessage.addListener(messageHandler);
    
    // Simulate message from background
    fakeBrowser.runtime.onConnect.dispatch(mockPort);
    mockPort.onMessage.dispatch({ type: 'PING', data: 'test' });
    
    expect(messageHandler).toHaveBeenCalledWith({
      type: 'PING',
      data: 'test'
    });
  });
});

// ============================================================================
// CONTENT SCRIPT TESTING
// ============================================================================

describe('Content Script Tests', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    document.body.innerHTML = '';
  });
  
  it('should inject CSS into page', async () => {
    // Mock content script context
    const mockCtx = {
      injectCSS: vi.fn()
    };
    
    // Test CSS injection
    const css = '.test { color: red; }';
    mockCtx.injectCSS(css);
    
    expect(mockCtx.injectCSS).toHaveBeenCalledWith(css);
  });
  
  it('should create shadow root UI', async () => {
    // Mock createShadowRootUi function
    const mockUi = {
      mount: vi.fn(),
      remove: vi.fn()
    };
    
    const createShadowRootUi = vi.fn().mockReturnValue(mockUi);
    
    // Use the mock
    const ui = createShadowRootUi({}, {
      name: 'test-ui',
      position: 'overlay'
    });
    
    ui.mount();
    
    expect(createShadowRootUi).toHaveBeenCalled();
    expect(mockUi.mount).toHaveBeenCalled();
  });
  
  it('should handle DOM events', () => {
    // Create test element
    const button = document.createElement('button');
    button.id = 'test-button';
    document.body.appendChild(button);
    
    // Add event listener
    const clickHandler = vi.fn();
    button.addEventListener('click', clickHandler);
    
    // Simulate click
    button.click();
    
    expect(clickHandler).toHaveBeenCalled();
  });
});

// ============================================================================
// BACKGROUND SCRIPT TESTING
// ============================================================================

describe('Background Script Tests', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });
  
  it('should handle extension installation', () => {
    const installHandler = vi.fn();
    
    // Setup install listener
    browser.runtime.onInstalled.addListener(installHandler);
    
    // Simulate installation
    fakeBrowser.runtime.onInstalled.dispatch({
      reason: 'install',
      previousVersion: undefined
    });
    
    expect(installHandler).toHaveBeenCalledWith({
      reason: 'install',
      previousVersion: undefined
    });
  });
  
  it('should handle browser action clicks', async () => {
    const actionHandler = vi.fn();
    const mockTab = createMockTab();
    
    // Setup action listener
    browser.action.onClicked.addListener(actionHandler);
    
    // Simulate action click
    fakeBrowser.action.onClicked.dispatch(mockTab);
    
    expect(actionHandler).toHaveBeenCalledWith(mockTab);
  });
  
  it('should handle alarms', () => {
    const alarmHandler = vi.fn();
    
    // Setup alarm listener
    browser.alarms.onAlarm.addListener(alarmHandler);
    
    // Simulate alarm
    const alarm = { name: 'test-alarm', scheduledTime: Date.now() };
    fakeBrowser.alarms.onAlarm.dispatch(alarm);
    
    expect(alarmHandler).toHaveBeenCalledWith(alarm);
  });
});

// ============================================================================
// POPUP TESTING
// ============================================================================

import { render, fireEvent, waitFor } from '@testing-library/react';
import PopupComponent from '../entrypoints/popup/Popup';

describe('Popup Tests', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });
  
  it('should render popup correctly', async () => {
    // Mock active tab
    const mockTab = createMockTab({
      title: 'Test Page',
      url: 'https://test.example.com'
    });
    
    fakeBrowser.tabs.query = vi.fn().mockResolvedValue([mockTab]);
    
    // Render popup
    const { getByText, getByRole } = render(<PopupComponent />);
    
    // Wait for tab info to load
    await waitFor(() => {
      expect(getByText('Test Page')).toBeInTheDocument();
      expect(getByText('https://test.example.com')).toBeInTheDocument();
    });
  });
  
  it('should handle button clicks', async () => {
    const mockTab = createMockTab({ id: 123 });
    fakeBrowser.tabs.query = vi.fn().mockResolvedValue([mockTab]);
    fakeBrowser.scripting.executeScript = vi.fn().mockResolvedValue([]);
    
    const { getByRole } = render(<PopupComponent />);
    
    // Click inject button
    const injectButton = getByRole('button', { name: /inject/i });
    fireEvent.click(injectButton);
    
    // Verify script injection was called
    await waitFor(() => {
      expect(fakeBrowser.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: expect.arrayContaining([expect.stringContaining('content')])
      });
    });
  });
});

// ============================================================================
// UTILITY FUNCTION TESTING
// ============================================================================

describe('Utility Functions', () => {
  it('should format URLs correctly', () => {
    function formatUrl(url: string): string {
      try {
        const urlObj = new URL(url);
        return `${urlObj.hostname}${urlObj.pathname}`;
      } catch {
        return url;
      }
    }
    
    expect(formatUrl('https://example.com/path')).toBe('example.com/path');
    expect(formatUrl('invalid-url')).toBe('invalid-url');
  });
  
  it('should validate extension permissions', async () => {
    function hasRequiredPermissions(permissions: string[]): Promise<boolean> {
      return browser.permissions.contains({ permissions });
    }
    
    fakeBrowser.permissions.contains = vi.fn().mockResolvedValue(true);
    
    const result = await hasRequiredPermissions(['tabs', 'storage']);
    
    expect(result).toBe(true);
    expect(fakeBrowser.permissions.contains).toHaveBeenCalledWith({
      permissions: ['tabs', 'storage']
    });
  });
});

// ============================================================================
// E2E TESTING WITH @wxt-dev/runner
// ============================================================================

// test/e2e/extension.test.ts
import { describe, it, expect } from 'vitest';
import { run } from '@wxt-dev/runner';
import { Page, Browser } from 'playwright';

describe('Extension E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    // Start browser with extension
    const runner = await run({
      extensionDir: './dist',
      browser: 'chromium',
      headless: false // Set to true for CI
    });
    
    browser = runner.browser;
    page = await browser.newPage();
  });
  
  afterAll(async () => {
    await browser?.close();
  });
  
  it('should load extension popup', async () => {
    // Navigate to extension popup
    await page.goto('chrome-extension://[extension-id]/popup.html');
    
    // Check if popup loaded
    const title = await page.textContent('h1');
    expect(title).toContain('Extension Popup');
  });
  
  it('should inject content script', async () => {
    // Navigate to test page
    await page.goto('https://example.com');
    
    // Click extension action
    // Note: This requires proper extension ID handling
    await page.evaluate(() => {
      chrome.action.onClicked.dispatch({ url: location.href });
    });
    
    // Check if content script injected
    const injectedElement = await page.waitForSelector('.wxt-injected');
    expect(injectedElement).toBeTruthy();
  });
  
  it('should persist settings', async () => {
    // Open popup
    await page.goto('chrome-extension://[extension-id]/popup.html');
    
    // Change theme setting
    await page.click('[data-testid="theme-toggle"]');
    
    // Verify setting was saved
    const theme = await page.evaluate(() => {
      return chrome.storage.local.get('theme');
    });
    
    expect(theme.theme).toBe('dark');
  });
});

// ============================================================================
// MOCK FACTORIES
// ============================================================================

// test/mocks/browser-mocks.ts
export const mockBrowserAPIs = {
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    onCreated: { addListener: vi.fn() },
    onUpdated: { addListener: vi.fn() }
  },
  
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn()
    },
    onChanged: { addListener: vi.fn() }
  },
  
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
    connect: vi.fn(),
    onConnect: { addListener: vi.fn() },
    getManifest: vi.fn().mockReturnValue({
      name: 'Test Extension',
      version: '1.0.0'
    })
  }
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    theme: 'light',
    language: 'en'
  },
  ...overrides
});

export const createMockStorageData = (overrides = {}) => ({
  userSettings: {
    theme: 'light',
    notifications: true,
    autoSave: false
  },
  sessionData: {
    visitCount: 5,
    lastVisit: new Date().toISOString()
  },
  ...overrides
});

// ============================================================================
// TESTING UTILITIES
// ============================================================================

// test/utils/test-helpers.ts
export async function waitForStorageChange(
  storageItem: any,
  expectedValue: any,
  timeout = 5000
) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const currentValue = await storageItem.getValue();
    
    if (JSON.stringify(currentValue) === JSON.stringify(expectedValue)) {
      return currentValue;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Storage did not change to expected value within ${timeout}ms`);
}

export function createMockContentScriptContext() {
  return {
    injectCSS: vi.fn(),
    mountUI: vi.fn(),
    shadowRoot: document.createElement('div').attachShadow({ mode: 'open' })
  };
}

export async function triggerStorageChange(key: string, newValue: any) {
  await browser.storage.local.set({ [key]: newValue });
  
  // Manually trigger change event for testing
  const changeInfo = {
    [key]: { newValue, oldValue: undefined }
  };
  
  fakeBrowser.storage.onChanged.dispatch(changeInfo, 'local');
}

// Custom matchers
expect.extend({
  toHaveStorageValue(storageItem, expectedValue) {
    return storageItem.getValue().then((actualValue: any) => {
      const pass = JSON.stringify(actualValue) === JSON.stringify(expectedValue);
      
      return {
        pass,
        message: () => pass
          ? `Expected storage to not have value ${JSON.stringify(expectedValue)}`
          : `Expected storage to have value ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`
      };
    });
  }
});

// ============================================================================
// TESTING BEST PRACTICES
// ============================================================================

/*
1. Always reset fake browser state between tests
2. Use descriptive test names that explain what is being tested
3. Mock external APIs and dependencies
4. Test both success and error cases
5. Use data factories for consistent test data
6. Test storage operations with proper cleanup
7. Test message passing between different contexts
8. Use E2E tests for complex user flows
9. Mock time-dependent operations (alarms, timeouts)
10. Test permission handling and edge cases
*/