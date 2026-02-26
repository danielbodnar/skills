// Basic WebExtensions API Usage Examples

// Basic manifest.json structure for Manifest V3
const manifestV3 = {
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "A sample WebExtension",
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "96": "icons/icon-96.png"
  },
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://example.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Extension Name",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"]
  }],
  "options_page": "options.html"
};

// Basic service worker (background.js) for Manifest V3
class ExtensionBackground {
  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Extension installation/startup
    browser.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    browser.runtime.onStartup.addListener(this.handleStartup.bind(this));
    
    // Action (toolbar button) clicks
    browser.action.onClicked.addListener(this.handleActionClick.bind(this));
    
    // Messages from content scripts or popup
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  private async handleInstall(details: browser.runtime.OnInstalledDetailsType) {
    console.log('Extension installed:', details.reason);
    
    if (details.reason === 'install') {
      // First time installation
      await this.initializeExtension();
    } else if (details.reason === 'update') {
      // Extension update
      await this.handleUpdate(details.previousVersion);
    }
  }

  private async handleStartup() {
    console.log('Extension started');
    // Perform startup tasks
  }

  private async handleActionClick(tab: browser.tabs.Tab) {
    console.log('Action clicked on tab:', tab.url);
    
    // Example: Toggle extension functionality
    try {
      const response = await browser.tabs.sendMessage(tab.id!, {
        type: 'TOGGLE_FEATURE'
      });
      console.log('Content script response:', response);
    } catch (error) {
      console.error('Failed to communicate with content script:', error);
      
      // Inject content script if not present
      await browser.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['content.js']
      });
    }
  }

  private async handleMessage(
    message: any,
    sender: browser.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) {
    console.log('Received message:', message, 'from:', sender);

    switch (message.type) {
      case 'GET_SETTINGS':
        const settings = await this.getSettings();
        return { settings };

      case 'UPDATE_SETTINGS':
        await this.updateSettings(message.settings);
        return { success: true };

      case 'OPEN_OPTIONS':
        await browser.runtime.openOptionsPage();
        return { success: true };

      default:
        console.warn('Unknown message type:', message.type);
        return { error: 'Unknown message type' };
    }
  }

  private async initializeExtension() {
    // Set default settings
    const defaultSettings = {
      enabled: true,
      theme: 'light',
      notifications: true
    };

    await browser.storage.local.set({
      settings: defaultSettings,
      installDate: Date.now()
    });

    // Open welcome page
    await browser.tabs.create({
      url: browser.runtime.getURL('welcome.html')
    });
  }

  private async handleUpdate(previousVersion?: string) {
    console.log('Extension updated from version:', previousVersion);
    
    // Perform migration if needed
    if (previousVersion && this.shouldMigrate(previousVersion)) {
      await this.migrateData(previousVersion);
    }
  }

  private shouldMigrate(previousVersion: string): boolean {
    // Example: migrate if updating from version < 2.0.0
    const [major] = previousVersion.split('.').map(Number);
    return major < 2;
  }

  private async migrateData(previousVersion: string) {
    console.log('Migrating data from version:', previousVersion);
    
    const data = await browser.storage.local.get();
    // Perform data migration logic here
    
    await browser.storage.local.set({
      ...data,
      migrated: true,
      previousVersion
    });
  }

  private async getSettings() {
    const result = await browser.storage.local.get('settings');
    return result.settings || {};
  }

  private async updateSettings(newSettings: any) {
    await browser.storage.local.set({ settings: newSettings });
    
    // Notify all content scripts of settings change
    const tabs = await browser.tabs.query({});
    const notifications = tabs.map(tab => 
      browser.tabs.sendMessage(tab.id!, {
        type: 'SETTINGS_UPDATED',
        settings: newSettings
      }).catch(() => {
        // Ignore tabs without content scripts
      })
    );
    
    await Promise.all(notifications);
  }
}

// Initialize background script
new ExtensionBackground();

// Basic content script example
class ContentScript {
  private enabled = false;
  private settings: any = {};

  constructor() {
    this.init();
  }

  private async init() {
    console.log('Content script loaded on:', window.location.href);
    
    // Get initial settings from background script
    try {
      const response = await browser.runtime.sendMessage({
        type: 'GET_SETTINGS'
      });
      this.settings = response.settings;
      this.enabled = this.settings.enabled;
    } catch (error) {
      console.error('Failed to get settings:', error);
    }

    // Set up message listener
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Apply initial state
    if (this.enabled) {
      this.activate();
    }

    // Set up page observation
    this.observePage();
  }

  private handleMessage(
    message: any,
    sender: browser.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) {
    switch (message.type) {
      case 'TOGGLE_FEATURE':
        this.toggle();
        sendResponse({ success: true, enabled: this.enabled });
        break;

      case 'SETTINGS_UPDATED':
        this.settings = message.settings;
        this.enabled = this.settings.enabled;
        if (this.enabled) {
          this.activate();
        } else {
          this.deactivate();
        }
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  private toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  private activate() {
    console.log('Activating extension features');
    document.body.classList.add('extension-active');
    
    // Example: Add visual indicator
    this.addIndicator();
  }

  private deactivate() {
    console.log('Deactivating extension features');
    document.body.classList.remove('extension-active');
    
    // Remove visual indicator
    this.removeIndicator();
  }

  private addIndicator() {
    if (document.getElementById('extension-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'extension-indicator';
    indicator.textContent = 'Extension Active';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #007bff;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: system-ui;
      font-size: 12px;
      z-index: 10000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(indicator);
  }

  private removeIndicator() {
    const indicator = document.getElementById('extension-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  private observePage() {
    // Example: Observe DOM changes
    const observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Process new elements
            this.processElement(node as Element);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private processElement(element: Element) {
    // Example: Process elements as they're added to the page
    if (element.tagName === 'A') {
      this.processLink(element as HTMLAnchorElement);
    }
  }

  private processLink(link: HTMLAnchorElement) {
    // Example: Add custom behavior to links
    if (link.hostname !== window.location.hostname) {
      link.setAttribute('data-external', 'true');
      link.style.borderBottom = '1px dotted #007bff';
    }
  }
}

// Initialize content script
if (typeof window !== 'undefined' && window.location) {
  new ContentScript();
}

// Utility functions for common WebExtensions patterns
export class WebExtensionUtils {
  // Check if running in extension context
  static isExtensionContext(): boolean {
    return typeof browser !== 'undefined' && browser.runtime && browser.runtime.id;
  }

  // Get extension URL for resource
  static getExtensionURL(path: string): string {
    return browser.runtime.getURL(path);
  }

  // Safe message sending with error handling
  static async sendMessage(message: any, options: { timeout?: number } = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 5000;
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Message timeout'));
      }, timeout);

      browser.runtime.sendMessage(message)
        .then((response) => {
          cleanup();
          resolve(response);
        })
        .catch((error) => {
          cleanup();
          reject(error);
        });
    });
  }

  // Storage helpers with type safety
  static async getStorageData<T>(key: string, defaultValue?: T): Promise<T> {
    const result = await browser.storage.local.get(key);
    return result[key] ?? defaultValue;
  }

  static async setStorageData(data: Record<string, any>): Promise<void> {
    await browser.storage.local.set(data);
  }

  // Tab helpers
  static async getCurrentTab(): Promise<browser.tabs.Tab | undefined> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  static async injectScript(tabId: number, files: string[]): Promise<void> {
    await browser.scripting.executeScript({
      target: { tabId },
      files
    });
  }

  // Permission helpers
  static async hasPermission(permission: string): Promise<boolean> {
    return browser.permissions.contains({ permissions: [permission] });
  }

  static async requestPermission(permission: string): Promise<boolean> {
    return browser.permissions.request({ permissions: [permission] });
  }
}

export { ExtensionBackground, ContentScript, WebExtensionUtils };