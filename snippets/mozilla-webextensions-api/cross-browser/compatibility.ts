// Cross-browser WebExtensions Compatibility Examples

// Browser detection and compatibility layer
class BrowserCompat {
  static readonly isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;
  static readonly isChrome = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest;
  static readonly isSafari = typeof safari !== 'undefined';
  static readonly isEdge = BrowserCompat.isChrome && navigator.userAgent.includes('Edg/');

  // Unified browser API - prefers 'browser' namespace, falls back to 'chrome'
  static readonly api = (() => {
    if (typeof browser !== 'undefined' && browser.runtime) {
      return browser;
    }
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // Promisify Chrome APIs
      return BrowserCompat.promisifyChrome(chrome);
    }
    throw new Error('WebExtensions API not available');
  })();

  // Get browser info
  static async getBrowserInfo(): Promise<{ name: string; version: string }> {
    if (BrowserCompat.isFirefox && BrowserCompat.api.runtime.getBrowserInfo) {
      const info = await BrowserCompat.api.runtime.getBrowserInfo();
      return { name: info.name, version: info.version };
    }
    
    if (BrowserCompat.isChrome) {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Edg/')) {
        const match = userAgent.match(/Edg\/(\d+\.\d+)/);
        return { name: 'Edge', version: match ? match[1] : 'unknown' };
      } else if (userAgent.includes('Chrome/')) {
        const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
        return { name: 'Chrome', version: match ? match[1] : 'unknown' };
      }
    }
    
    return { name: 'unknown', version: 'unknown' };
  }

  // Promisify Chrome APIs for consistency
  private static promisifyChrome(chromeApi: any): any {
    const promisified: any = {};

    // Helper to promisify a method
    const promisifyMethod = (obj: any, method: string) => {
      if (typeof obj[method] === 'function') {
        return (...args: any[]) => {
          return new Promise((resolve, reject) => {
            obj[method](...args, (result: any) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });
        };
      }
      return obj[method];
    };

    // Recursively promisify the API
    const promisifyObject = (source: any, target: any) => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          const value = source[key];
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            target[key] = {};
            promisifyObject(value, target[key]);
          } else if (typeof value === 'function') {
            // Special handling for specific APIs
            if (key === 'sendMessage' || key === 'create' || key === 'update' || 
                key === 'get' || key === 'set' || key === 'remove' || key === 'clear' ||
                key === 'query' || key === 'executeScript' || key === 'insertCSS') {
              target[key] = promisifyMethod(source, key);
            } else {
              target[key] = value;
            }
          } else {
            target[key] = value;
          }
        }
      }
    };

    promisifyObject(chromeApi, promisified);
    return promisified;
  }

  // Check if specific API is available
  static hasAPI(apiPath: string): boolean {
    const parts = apiPath.split('.');
    let current = BrowserCompat.api;
    
    for (const part of parts) {
      if (!current || typeof current[part] === 'undefined') {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }

  // Safe API call with fallback
  static async safeAPICall<T>(
    apiCall: () => Promise<T>,
    fallback?: T,
    errorHandler?: (error: Error) => void
  ): Promise<T | undefined> {
    try {
      return await apiCall();
    } catch (error) {
      if (errorHandler) {
        errorHandler(error as Error);
      } else {
        console.warn('API call failed:', error);
      }
      return fallback;
    }
  }
}

// Manifest compatibility helper
class ManifestCompat {
  private static manifest = BrowserCompat.api.runtime.getManifest();

  static getManifestVersion(): number {
    return ManifestCompat.manifest.manifest_version || 2;
  }

  static isV3(): boolean {
    return ManifestCompat.getManifestVersion() === 3;
  }

  static isV2(): boolean {
    return ManifestCompat.getManifestVersion() === 2;
  }

  // Get background configuration
  static getBackgroundConfig(): { 
    type: 'page' | 'scripts' | 'service_worker';
    files?: string[];
    file?: string;
    persistent?: boolean;
  } {
    const background = ManifestCompat.manifest.background;
    
    if (!background) {
      throw new Error('No background configuration found');
    }

    if ('service_worker' in background) {
      return {
        type: 'service_worker',
        file: background.service_worker
      };
    }
    
    if ('scripts' in background) {
      return {
        type: 'scripts',
        files: background.scripts,
        persistent: background.persistent
      };
    }
    
    if ('page' in background) {
      return {
        type: 'page',
        file: background.page,
        persistent: background.persistent
      };
    }

    throw new Error('Unknown background configuration');
  }

  // Get action configuration (V3) or browser_action (V2)
  static getActionConfig(): any {
    if (ManifestCompat.isV3()) {
      return ManifestCompat.manifest.action;
    } else {
      return ManifestCompat.manifest.browser_action || ManifestCompat.manifest.page_action;
    }
  }

  // Check if permission is declared
  static hasPermission(permission: string): boolean {
    const permissions = ManifestCompat.manifest.permissions || [];
    const hostPermissions = (ManifestCompat.manifest as any).host_permissions || [];
    
    return permissions.includes(permission) || hostPermissions.includes(permission);
  }
}

// Cross-browser event handling
class EventCompat {
  // Unified event listener setup
  static addListener<T extends (...args: any[]) => any>(
    event: { addListener: (callback: T) => void },
    callback: T
  ): void {
    try {
      event.addListener(callback);
    } catch (error) {
      console.warn('Failed to add event listener:', error);
    }
  }

  // Runtime message handling with proper typing
  static addMessageListener(
    callback: (
      message: any,
      sender: any,
      sendResponse: (response?: any) => void
    ) => any
  ): void {
    if (BrowserCompat.isFirefox) {
      // Firefox expects Promise return for async responses
      BrowserCompat.api.runtime.onMessage.addListener((message: any, sender: any) => {
        return Promise.resolve(callback(message, sender, () => {}));
      });
    } else {
      // Chrome expects return true for async responses
      BrowserCompat.api.runtime.onMessage.addListener((
        message: any,
        sender: any,
        sendResponse: (response?: any) => void
      ) => {
        const result = callback(message, sender, sendResponse);
        
        // If result is a Promise, handle it properly
        if (result instanceof Promise) {
          result.then(sendResponse).catch(error => {
            sendResponse({ error: error.message });
          });
          return true; // Indicates async response
        }
        
        return result;
      });
    }
  }

  // Storage change listener with compatibility
  static addStorageListener(
    callback: (changes: any, areaName: string) => void,
    area: 'local' | 'sync' | 'managed' = 'local'
  ): void {
    try {
      BrowserCompat.api.storage.onChanged.addListener((changes: any, areaName: string) => {
        if (areaName === area || area === 'local') {
          callback(changes, areaName);
        }
      });
    } catch (error) {
      console.warn('Storage listener not available:', error);
    }
  }
}

// Cross-browser storage abstraction
class StorageCompat {
  // Unified storage interface
  static async get(keys?: string | string[] | Record<string, any>): Promise<any> {
    try {
      return await BrowserCompat.api.storage.local.get(keys);
    } catch (error) {
      console.warn('Storage get failed:', error);
      return {};
    }
  }

  static async set(items: Record<string, any>): Promise<void> {
    try {
      await BrowserCompat.api.storage.local.set(items);
    } catch (error) {
      console.warn('Storage set failed:', error);
      throw error;
    }
  }

  static async remove(keys: string | string[]): Promise<void> {
    try {
      await BrowserCompat.api.storage.local.remove(keys);
    } catch (error) {
      console.warn('Storage remove failed:', error);
      throw error;
    }
  }

  static async clear(): Promise<void> {
    try {
      await BrowserCompat.api.storage.local.clear();
    } catch (error) {
      console.warn('Storage clear failed:', error);
      throw error;
    }
  }

  // Sync storage with fallback to local
  static async getSync(keys?: string | string[] | Record<string, any>): Promise<any> {
    if (BrowserCompat.hasAPI('storage.sync')) {
      try {
        return await BrowserCompat.api.storage.sync.get(keys);
      } catch (error) {
        console.warn('Sync storage failed, falling back to local:', error);
      }
    }
    return StorageCompat.get(keys);
  }

  static async setSync(items: Record<string, any>): Promise<void> {
    if (BrowserCompat.hasAPI('storage.sync')) {
      try {
        await BrowserCompat.api.storage.sync.set(items);
        return;
      } catch (error) {
        console.warn('Sync storage failed, falling back to local:', error);
      }
    }
    return StorageCompat.set(items);
  }
}

// Cross-browser scripting API
class ScriptingCompat {
  // Execute script with V2/V3 compatibility
  static async executeScript(
    target: { tabId: number; frameIds?: number[] },
    details: {
      files?: string[];
      func?: () => any;
      args?: any[];
      code?: string;
    }
  ): Promise<any[]> {
    if (ManifestCompat.isV3() && BrowserCompat.hasAPI('scripting.executeScript')) {
      // Manifest V3 approach
      const injection: any = { target };
      
      if (details.files) {
        injection.files = details.files;
      } else if (details.func) {
        injection.func = details.func;
        if (details.args) {
          injection.args = details.args;
        }
      } else if (details.code) {
        injection.func = new Function(details.code);
      }

      const results = await BrowserCompat.api.scripting.executeScript(injection);
      return results.map((result: any) => result.result);
    } else {
      // Manifest V2 approach
      const executeOptions: any = {};
      
      if (details.files && details.files.length > 0) {
        executeOptions.file = details.files[0];
      } else if (details.code) {
        executeOptions.code = details.code;
      } else if (details.func) {
        executeOptions.code = `(${details.func.toString()})()`;
      }

      if (target.frameIds && target.frameIds.length > 0) {
        executeOptions.frameId = target.frameIds[0];
      }

      return new Promise((resolve, reject) => {
        BrowserCompat.api.tabs.executeScript(target.tabId, executeOptions, (results: any) => {
          if (BrowserCompat.api.runtime.lastError) {
            reject(new Error(BrowserCompat.api.runtime.lastError.message));
          } else {
            resolve(results || []);
          }
        });
      });
    }
  }

  // Insert CSS with V2/V3 compatibility
  static async insertCSS(
    target: { tabId: number; frameIds?: number[] },
    css: { files?: string[]; css?: string }
  ): Promise<void> {
    if (ManifestCompat.isV3() && BrowserCompat.hasAPI('scripting.insertCSS')) {
      // Manifest V3 approach
      const injection: any = { target };
      
      if (css.files) {
        injection.files = css.files;
      } else if (css.css) {
        injection.css = css.css;
      }

      await BrowserCompat.api.scripting.insertCSS(injection);
    } else {
      // Manifest V2 approach
      const insertOptions: any = {};
      
      if (css.files && css.files.length > 0) {
        insertOptions.file = css.files[0];
      } else if (css.css) {
        insertOptions.code = css.css;
      }

      if (target.frameIds && target.frameIds.length > 0) {
        insertOptions.frameId = target.frameIds[0];
      }

      return new Promise((resolve, reject) => {
        BrowserCompat.api.tabs.insertCSS(target.tabId, insertOptions, () => {
          if (BrowserCompat.api.runtime.lastError) {
            reject(new Error(BrowserCompat.api.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    }
  }
}

// Cross-browser action API (browser_action in V2, action in V3)
class ActionCompat {
  private static getActionAPI() {
    if (ManifestCompat.isV3()) {
      return BrowserCompat.api.action;
    } else {
      return BrowserCompat.api.browserAction || BrowserCompat.api.pageAction;
    }
  }

  static async setTitle(title: string, tabId?: number): Promise<void> {
    const api = ActionCompat.getActionAPI();
    if (api && api.setTitle) {
      const details: any = { title };
      if (tabId) details.tabId = tabId;
      await api.setTitle(details);
    }
  }

  static async setBadgeText(text: string, tabId?: number): Promise<void> {
    const api = ActionCompat.getActionAPI();
    if (api && api.setBadgeText) {
      const details: any = { text };
      if (tabId) details.tabId = tabId;
      await api.setBadgeText(details);
    }
  }

  static async setBadgeBackgroundColor(color: string, tabId?: number): Promise<void> {
    const api = ActionCompat.getActionAPI();
    if (api && api.setBadgeBackgroundColor) {
      const details: any = { color };
      if (tabId) details.tabId = tabId;
      await api.setBadgeBackgroundColor(details);
    }
  }

  static async setIcon(iconPath: string | Record<string, string>, tabId?: number): Promise<void> {
    const api = ActionCompat.getActionAPI();
    if (api && api.setIcon) {
      const details: any = { path: iconPath };
      if (tabId) details.tabId = tabId;
      await api.setIcon(details);
    }
  }

  static addClickListener(callback: (tab: any) => void): void {
    const api = ActionCompat.getActionAPI();
    if (api && api.onClicked) {
      api.onClicked.addListener(callback);
    }
  }
}

// Cross-browser permissions API
class PermissionsCompat {
  static async request(permissions: {
    permissions?: string[];
    origins?: string[];
  }): Promise<boolean> {
    if (!BrowserCompat.hasAPI('permissions.request')) {
      console.warn('Permissions API not available');
      return false;
    }

    try {
      return await BrowserCompat.api.permissions.request(permissions);
    } catch (error) {
      console.warn('Permission request failed:', error);
      return false;
    }
  }

  static async contains(permissions: {
    permissions?: string[];
    origins?: string[];
  }): Promise<boolean> {
    if (!BrowserCompat.hasAPI('permissions.contains')) {
      // Fallback: check manifest permissions
      if (permissions.permissions) {
        return permissions.permissions.every(permission => 
          ManifestCompat.hasPermission(permission)
        );
      }
      return false;
    }

    try {
      return await BrowserCompat.api.permissions.contains(permissions);
    } catch (error) {
      console.warn('Permission check failed:', error);
      return false;
    }
  }

  static async remove(permissions: {
    permissions?: string[];
    origins?: string[];
  }): Promise<boolean> {
    if (!BrowserCompat.hasAPI('permissions.remove')) {
      console.warn('Permission removal not available');
      return false;
    }

    try {
      return await BrowserCompat.api.permissions.remove(permissions);
    } catch (error) {
      console.warn('Permission removal failed:', error);
      return false;
    }
  }
}

// Usage examples and initialization
class CrossBrowserExtension {
  private settings: any = {};

  async init() {
    console.log('Initializing cross-browser extension');
    
    // Get browser info
    const browserInfo = await BrowserCompat.getBrowserInfo();
    console.log(`Running on ${browserInfo.name} ${browserInfo.version}`);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load settings
    await this.loadSettings();
    
    // Apply browser-specific configurations
    await this.applyBrowserSpecificConfig();
  }

  private setupEventListeners() {
    // Message handling
    EventCompat.addMessageListener(this.handleMessage.bind(this));
    
    // Storage changes
    EventCompat.addStorageListener(this.handleStorageChange.bind(this));
    
    // Action clicks
    ActionCompat.addClickListener(this.handleActionClick.bind(this));
  }

  private async loadSettings() {
    this.settings = await StorageCompat.get('settings') || {};
  }

  private async handleMessage(message: any, sender: any, sendResponse: any) {
    switch (message.type) {
      case 'GET_BROWSER_INFO':
        return await BrowserCompat.getBrowserInfo();
      case 'GET_SETTINGS':
        return { settings: this.settings };
      case 'UPDATE_SETTINGS':
        await StorageCompat.set({ settings: message.settings });
        this.settings = message.settings;
        return { success: true };
      default:
        return { error: 'Unknown message type' };
    }
  }

  private handleStorageChange(changes: any, areaName: string) {
    if (changes.settings) {
      this.settings = changes.settings.newValue;
      console.log('Settings updated:', this.settings);
    }
  }

  private async handleActionClick(tab: any) {
    console.log('Action clicked on tab:', tab.url);
    
    // Execute cross-browser script injection
    try {
      await ScriptingCompat.executeScript(
        { tabId: tab.id },
        { func: () => console.log('Hello from injected script!') }
      );
    } catch (error) {
      console.error('Script injection failed:', error);
    }
  }

  private async applyBrowserSpecificConfig() {
    const browserInfo = await BrowserCompat.getBrowserInfo();
    
    switch (browserInfo.name) {
      case 'Firefox':
        await this.configureFirefox();
        break;
      case 'Chrome':
        await this.configureChrome();
        break;
      case 'Edge':
        await this.configureEdge();
        break;
      case 'Safari':
        await this.configureSafari();
        break;
    }
  }

  private async configureFirefox() {
    console.log('Applying Firefox-specific configuration');
    // Firefox-specific setup
  }

  private async configureChrome() {
    console.log('Applying Chrome-specific configuration');
    // Chrome-specific setup
  }

  private async configureEdge() {
    console.log('Applying Edge-specific configuration');
    // Edge-specific setup (similar to Chrome)
  }

  private async configureSafari() {
    console.log('Applying Safari-specific configuration');
    // Safari-specific setup
  }
}

// Initialize extension
const extension = new CrossBrowserExtension();
extension.init().catch(console.error);

export {
  BrowserCompat,
  ManifestCompat,
  EventCompat,
  StorageCompat,
  ScriptingCompat,
  ActionCompat,
  PermissionsCompat,
  CrossBrowserExtension
};