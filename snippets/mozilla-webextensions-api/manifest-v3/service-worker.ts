// Manifest V3 Service Worker Examples

// Advanced service worker with comprehensive event handling
class ManifestV3ServiceWorker {
  private isInitialized = false;
  private alarmHandlers = new Map<string, () => Promise<void>>();
  
  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Runtime events
    browser.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    browser.runtime.onStartup.addListener(this.handleStartup.bind(this));
    browser.runtime.onSuspend.addListener(this.handleSuspend.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    browser.runtime.onConnect.addListener(this.handleConnect.bind(this));

    // Action events
    browser.action.onClicked.addListener(this.handleActionClick.bind(this));

    // Tab events
    browser.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    browser.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    browser.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));

    // Web navigation events
    browser.webNavigation.onCompleted.addListener(this.handleNavigationCompleted.bind(this));

    // Alarm events
    browser.alarms.onAlarm.addListener(this.handleAlarm.bind(this));

    // Storage events
    browser.storage.onChanged.addListener(this.handleStorageChanged.bind(this));

    // Notification events
    browser.notifications.onClicked.addListener(this.handleNotificationClick.bind(this));
    browser.notifications.onClosed.addListener(this.handleNotificationClosed.bind(this));

    // Commands (keyboard shortcuts)
    browser.commands.onCommand.addListener(this.handleCommand.bind(this));
  }

  private async handleInstalled(details: browser.runtime.OnInstalledDetailsType) {
    console.log('Extension installed/updated:', details);

    switch (details.reason) {
      case 'install':
        await this.handleFirstInstall();
        break;
      case 'update':
        await this.handleUpdate(details.previousVersion);
        break;
      case 'chrome_update':
      case 'shared_module_update':
        await this.handleBrowserUpdate();
        break;
    }

    this.isInitialized = true;
  }

  private async handleStartup() {
    console.log('Extension started');
    await this.initializeExtension();
    this.isInitialized = true;
  }

  private handleSuspend() {
    console.log('Service worker suspending');
    // Clean up resources before suspension
    this.cleanup();
  }

  private async handleFirstInstall() {
    console.log('First-time installation');

    // Set up default settings
    const defaultSettings = {
      version: '1.0.0',
      enabled: true,
      autoSync: true,
      theme: 'system',
      notifications: true,
      shortcuts: {
        toggleExtension: 'Ctrl+Shift+E',
        openPopup: 'Ctrl+Shift+P'
      },
      features: {
        contentModification: true,
        dataCollection: false,
        analytics: false
      }
    };

    await browser.storage.local.set({
      settings: defaultSettings,
      installDate: Date.now(),
      userId: this.generateUserId()
    });

    // Set up default alarms
    await this.setupAlarms();

    // Create context menus
    await this.createContextMenus();

    // Show welcome notification
    await this.showWelcomeNotification();

    // Open onboarding page
    await browser.tabs.create({
      url: browser.runtime.getURL('pages/onboarding.html')
    });
  }

  private async handleUpdate(previousVersion?: string) {
    console.log('Extension updated from:', previousVersion);

    if (previousVersion) {
      await this.migrateSettings(previousVersion);
    }

    // Update context menus
    await this.updateContextMenus();

    // Show update notification
    await this.showUpdateNotification(previousVersion);
  }

  private async handleBrowserUpdate() {
    console.log('Browser updated');
    // Re-initialize if needed
    await this.initializeExtension();
  }

  private async initializeExtension() {
    if (this.isInitialized) return;

    // Validate and repair settings
    await this.validateSettings();

    // Set up alarms
    await this.setupAlarms();

    // Update badge and icon
    await this.updateExtensionBadge();

    // Register content scripts dynamically if needed
    await this.registerDynamicContentScripts();
  }

  private async handleMessage(
    message: any,
    sender: browser.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<any> {
    console.log('Message received:', message.type, 'from:', sender.tab?.url);

    try {
      switch (message.type) {
        case 'GET_SETTINGS':
          return await this.getSettings();

        case 'UPDATE_SETTINGS':
          return await this.updateSettings(message.settings);

        case 'PERFORM_ACTION':
          return await this.performAction(message.action, message.data);

        case 'GET_TAB_INFO':
          return await this.getTabInfo(sender.tab?.id);

        case 'LOG_EVENT':
          await this.logEvent(message.event, message.data);
          return { success: true };

        case 'REQUEST_PERMISSION':
          return await this.requestPermission(message.permission);

        case 'OPEN_OPTIONS':
          await browser.runtime.openOptionsPage();
          return { success: true };

        case 'SHOW_NOTIFICATION':
          await this.showNotification(message.notification);
          return { success: true };

        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      return { error: error.message };
    }
  }

  private handleConnect(port: browser.runtime.Port) {
    console.log('Port connected:', port.name);

    port.onMessage.addListener((message) => {
      console.log('Port message:', message);
      // Handle real-time communication
    });

    port.onDisconnect.addListener(() => {
      console.log('Port disconnected:', port.name);
    });
  }

  private async handleActionClick(tab: browser.tabs.Tab) {
    console.log('Action clicked on tab:', tab.url);

    const settings = await this.getSettings();
    
    if (!settings.enabled) {
      await this.showNotification({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Extension Disabled',
        message: 'Please enable the extension in settings'
      });
      return;
    }

    // Toggle extension state for current tab
    await this.toggleTabState(tab.id!);
  }

  private async handleTabActivated(activeInfo: browser.tabs.OnActivatedActiveInfoType) {
    console.log('Tab activated:', activeInfo.tabId);
    
    // Update extension state for new active tab
    const tab = await browser.tabs.get(activeInfo.tabId);
    await this.updateExtensionForTab(tab);
  }

  private async handleTabUpdated(
    tabId: number,
    changeInfo: browser.tabs.OnUpdatedChangeInfoType,
    tab: browser.tabs.Tab
  ) {
    if (changeInfo.status === 'complete' && tab.url) {
      console.log('Tab loaded:', tab.url);
      await this.processTabLoad(tabId, tab);
    }
  }

  private async handleTabRemoved(tabId: number, removeInfo: browser.tabs.OnRemovedRemoveInfoType) {
    console.log('Tab removed:', tabId);
    // Clean up tab-specific data
    await this.cleanupTabData(tabId);
  }

  private async handleNavigationCompleted(details: browser.webNavigation.OnCompletedDetailsType) {
    if (details.frameId === 0) { // Main frame only
      console.log('Navigation completed:', details.url);
      await this.processPageLoad(details.tabId, details.url);
    }
  }

  private async handleAlarm(alarm: browser.alarms.Alarm) {
    console.log('Alarm triggered:', alarm.name);
    
    const handler = this.alarmHandlers.get(alarm.name);
    if (handler) {
      try {
        await handler();
      } catch (error) {
        console.error(`Alarm handler error for ${alarm.name}:`, error);
      }
    }
  }

  private async handleStorageChanged(
    changes: { [key: string]: browser.storage.StorageChange },
    areaName: string
  ) {
    console.log('Storage changed:', changes, 'in area:', areaName);

    if (changes.settings) {
      await this.onSettingsChanged(changes.settings.newValue);
    }
  }

  private async handleNotificationClick(notificationId: string) {
    console.log('Notification clicked:', notificationId);
    
    // Handle notification actions
    switch (notificationId) {
      case 'welcome':
        await browser.tabs.create({
          url: browser.runtime.getURL('pages/welcome.html')
        });
        break;
      case 'update':
        await browser.tabs.create({
          url: browser.runtime.getURL('pages/changelog.html')
        });
        break;
    }

    await browser.notifications.clear(notificationId);
  }

  private async handleNotificationClosed(notificationId: string, byUser: boolean) {
    console.log('Notification closed:', notificationId, 'by user:', byUser);
  }

  private async handleCommand(command: string) {
    console.log('Command triggered:', command);

    switch (command) {
      case 'toggle-extension':
        const tab = await this.getCurrentTab();
        if (tab) {
          await this.toggleTabState(tab.id!);
        }
        break;
      case 'open-popup':
        // Can't programmatically open popup in V3, show notification instead
        await this.showNotification({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'Extension Shortcut',
          message: 'Click the extension icon to open the popup'
        });
        break;
    }
  }

  // Helper methods
  private async setupAlarms() {
    // Clear existing alarms
    await browser.alarms.clearAll();

    // Set up periodic sync
    await browser.alarms.create('periodicSync', {
      delayInMinutes: 1,
      periodInMinutes: 30
    });

    // Set up daily cleanup
    await browser.alarms.create('dailyCleanup', {
      delayInMinutes: 60,
      periodInMinutes: 24 * 60
    });

    // Register alarm handlers
    this.alarmHandlers.set('periodicSync', this.performPeriodicSync.bind(this));
    this.alarmHandlers.set('dailyCleanup', this.performDailyCleanup.bind(this));
  }

  private async createContextMenus() {
    await browser.contextMenus.removeAll();

    browser.contextMenus.create({
      id: 'main-menu',
      title: 'Extension Actions',
      contexts: ['page']
    });

    browser.contextMenus.create({
      id: 'toggle-feature',
      parentId: 'main-menu',
      title: 'Toggle Feature',
      contexts: ['page']
    });

    browser.contextMenus.create({
      id: 'open-options',
      parentId: 'main-menu',
      title: 'Open Options',
      contexts: ['page']
    });

    browser.contextMenus.onClicked.addListener(this.handleContextMenuClick.bind(this));
  }

  private async handleContextMenuClick(info: browser.contextMenus.OnClickData, tab?: browser.tabs.Tab) {
    switch (info.menuItemId) {
      case 'toggle-feature':
        if (tab) {
          await this.toggleTabState(tab.id!);
        }
        break;
      case 'open-options':
        await browser.runtime.openOptionsPage();
        break;
    }
  }

  private async getSettings() {
    const result = await browser.storage.local.get('settings');
    return result.settings || {};
  }

  private async updateSettings(newSettings: any) {
    await browser.storage.local.set({ settings: newSettings });
    await this.onSettingsChanged(newSettings);
    return { success: true };
  }

  private async onSettingsChanged(newSettings: any) {
    // Update extension state based on new settings
    await this.updateExtensionBadge();
    
    // Notify all tabs of settings change
    const tabs = await browser.tabs.query({});
    const notifications = tabs.map(tab =>
      browser.tabs.sendMessage(tab.id!, {
        type: 'SETTINGS_UPDATED',
        settings: newSettings
      }).catch(() => {}) // Ignore tabs without content scripts
    );
    
    await Promise.all(notifications);
  }

  private async performPeriodicSync() {
    console.log('Performing periodic sync');
    // Implement sync logic
  }

  private async performDailyCleanup() {
    console.log('Performing daily cleanup');
    // Clean up old data, logs, etc.
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Example: Clean up old logs
    const data = await browser.storage.local.get();
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (key.startsWith('log_') && value.timestamp < sevenDaysAgo) {
        return acc; // Skip old logs
      }
      acc[key] = value;
      return acc;
    }, {} as any);
    
    await browser.storage.local.clear();
    await browser.storage.local.set(cleanedData);
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private async getCurrentTab(): Promise<browser.tabs.Tab | undefined> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  private async toggleTabState(tabId: number) {
    try {
      await browser.tabs.sendMessage(tabId, { type: 'TOGGLE_STATE' });
    } catch (error) {
      // Content script not injected, inject it
      await browser.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      
      // Try again after injection
      setTimeout(async () => {
        try {
          await browser.tabs.sendMessage(tabId, { type: 'TOGGLE_STATE' });
        } catch (e) {
          console.error('Failed to toggle tab state:', e);
        }
      }, 100);
    }
  }

  private async updateExtensionBadge() {
    const settings = await this.getSettings();
    
    if (settings.enabled) {
      await browser.action.setBadgeText({ text: '' });
      await browser.action.setBadgeBackgroundColor({ color: '#007bff' });
    } else {
      await browser.action.setBadgeText({ text: 'OFF' });
      await browser.action.setBadgeBackgroundColor({ color: '#dc3545' });
    }
  }

  private async showWelcomeNotification() {
    await browser.notifications.create('welcome', {
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Welcome to Extension!',
      message: 'Click to learn more about the features'
    });
  }

  private async showUpdateNotification(previousVersion?: string) {
    await browser.notifications.create('update', {
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Extension Updated!',
      message: `Updated from ${previousVersion}. Click to see what's new.`
    });
  }

  private cleanup() {
    // Perform cleanup before service worker suspension
    this.alarmHandlers.clear();
  }

  // Additional helper methods would go here...
  private async validateSettings() { /* ... */ }
  private async migrateSettings(previousVersion: string) { /* ... */ }
  private async updateContextMenus() { /* ... */ }
  private async performAction(action: string, data: any) { /* ... */ }
  private async getTabInfo(tabId?: number) { /* ... */ }
  private async logEvent(event: string, data: any) { /* ... */ }
  private async requestPermission(permission: string) { /* ... */ }
  private async showNotification(notification: any) { /* ... */ }
  private async updateExtensionForTab(tab: browser.tabs.Tab) { /* ... */ }
  private async processTabLoad(tabId: number, tab: browser.tabs.Tab) { /* ... */ }
  private async cleanupTabData(tabId: number) { /* ... */ }
  private async processPageLoad(tabId: number, url: string) { /* ... */ }
  private async registerDynamicContentScripts() { /* ... */ }
}

// Initialize the service worker
new ManifestV3ServiceWorker();

export { ManifestV3ServiceWorker };