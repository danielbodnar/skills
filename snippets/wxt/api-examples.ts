// WXT API Examples
// Comprehensive examples of WXT APIs and browser extension patterns

// ============================================================================
// ENTRYPOINT DEFINITIONS
// ============================================================================

// Background Script
export default defineBackground(() => {
  console.log('Background script loaded');
  
  // Extension lifecycle
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('Extension installed');
      browser.tabs.create({ url: 'https://example.com/welcome' });
    }
  });
  
  // Browser action handling
  browser.action.onClicked.addListener(async (tab) => {
    console.log('Action clicked on:', tab.url);
    
    // Execute content script
    await browser.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ['content.js']
    });
  });
});

// Content Script with Full Configuration
export default defineContentScript({
  matches: ['*://*.example.com/*', '*://*.test.com/*'],
  excludeMatches: ['*://admin.example.com/*'],
  runAt: 'document_idle',
  allFrames: false,
  world: 'ISOLATED',
  
  main(ctx) {
    console.log('Content script loaded');
    
    // Inject CSS
    ctx.injectCSS(`
      .wxt-highlight {
        background: yellow !important;
        outline: 2px solid red !important;
      }
    `);
    
    // DOM manipulation
    const highlightElements = () => {
      document.querySelectorAll('h1, h2, h3').forEach(el => {
        el.classList.add('wxt-highlight');
      });
    };
    
    highlightElements();
    
    // Listen for DOM changes
    const observer = new MutationObserver(highlightElements);
    observer.observe(document.body, { childList: true, subtree: true });
  }
});

// Popup Definition (with HTML file)
// entrypoints/popup/index.html + main.ts
export default definePopup({
  // HTML file will be automatically detected
  main() {
    console.log('Popup opened');
    
    // Setup popup UI
    setupPopupEventListeners();
    loadUserSettings();
  }
});

// Options Page
export default defineOptionsPage({
  main() {
    console.log('Options page loaded');
    
    // Setup options UI
    setupOptionsForm();
    loadAllSettings();
  }
});

// Devtools Panel
export default defineDevtoolsPage({
  main() {
    console.log('Devtools page loaded');
    
    // Create devtools panel
    browser.devtools.panels.create(
      'My Extension',
      'icon-16.png',
      'devtools-panel.html'
    );
  }
});

// ============================================================================
// STORAGE API USAGE
// ============================================================================

import { storage } from 'wxt/storage';

// Define typed storage items
const userSettings = storage.defineItem<{
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}>('local:userSettings', {
  defaultValue: {
    theme: 'light',
    language: 'en',
    notifications: true
  }
});

const sessionData = storage.defineItem<{
  visitCount: number;
  lastVisit: string;
}>('session:userData');

// Storage operations
async function storageOperations() {
  // Set values
  await userSettings.setValue({
    theme: 'dark',
    language: 'es',
    notifications: false
  });
  
  // Get values
  const settings = await userSettings.getValue();
  console.log('Current settings:', settings);
  
  // Watch for changes
  userSettings.watch((newValue, oldValue) => {
    console.log('Settings changed:', { newValue, oldValue });
  });
  
  // Bulk operations
  const items = await storage.getItems([userSettings, sessionData]);
  console.log('All items:', items);
  
  // Remove item
  await userSettings.removeValue();
  
  // Get with fallback
  const theme = await userSettings.getValue()?.theme ?? 'light';
}

// ============================================================================
// MESSAGING API
// ============================================================================

// Type-safe messaging
interface MessageTypes {
  GET_USER_DATA: { userId: string };
  UPDATE_SETTINGS: { settings: UserSettings };
  PING: undefined;
}

interface ResponseTypes {
  GET_USER_DATA: { user: User; success: boolean };
  UPDATE_SETTINGS: { success: boolean };
  PING: 'pong';
}

// Background script message handling
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  switch (message.type) {
    case 'GET_USER_DATA':
      getUserData(message.data.userId)
        .then(user => sendResponse({ user, success: true }))
        .catch(() => sendResponse({ user: null, success: false }));
      return true; // Keep response channel open
      
    case 'UPDATE_SETTINGS':
      updateUserSettings(message.data.settings)
        .then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));
      return true;
      
    case 'PING':
      sendResponse('pong');
      break;
  }
});

// Send messages from content script
async function sendMessageToBackground() {
  try {
    const response = await browser.runtime.sendMessage({
      type: 'GET_USER_DATA',
      data: { userId: '12345' }
    });
    
    console.log('Response:', response);
  } catch (error) {
    console.error('Message sending failed:', error);
  }
}

// Long-lived connections
function setupPortConnection() {
  const port = browser.runtime.connect({ name: 'content-background' });
  
  port.onMessage.addListener((message) => {
    console.log('Port message received:', message);
  });
  
  port.postMessage({ type: 'CONNECT', data: { tabId: 'current' } });
  
  // Handle disconnection
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected');
  });
}

// ============================================================================
// TABS API
// ============================================================================

async function tabOperations() {
  // Get all tabs
  const allTabs = await browser.tabs.query({});
  console.log('Total tabs:', allTabs.length);
  
  // Get active tab
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true
  });
  console.log('Active tab:', activeTab.title);
  
  // Create new tab
  const newTab = await browser.tabs.create({
    url: 'https://example.com',
    active: false,
    pinned: false
  });
  
  // Update tab
  await browser.tabs.update(newTab.id!, {
    url: 'https://updated-example.com',
    active: true
  });
  
  // Move tab
  await browser.tabs.move(newTab.id!, { index: 0 });
  
  // Duplicate tab
  const duplicatedTab = await browser.tabs.duplicate(newTab.id!);
  
  // Close tab
  await browser.tabs.remove([newTab.id!, duplicatedTab.id!]);
}

// Tab event listeners
browser.tabs.onCreated.addListener((tab) => {
  console.log('Tab created:', tab.url);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab finished loading:', tab.url);
  }
});

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab removed:', tabId);
});

// ============================================================================
// SCRIPTING API (MV3)
// ============================================================================

async function scriptingOperations() {
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true
  });
  
  if (!activeTab.id) return;
  
  // Execute script
  const results = await browser.scripting.executeScript({
    target: { tabId: activeTab.id },
    function: () => {
      return document.title;
    }
  });
  console.log('Script result:', results[0].result);
  
  // Execute script from file
  await browser.scripting.executeScript({
    target: { tabId: activeTab.id },
    files: ['injected-script.js']
  });
  
  // Insert CSS
  await browser.scripting.insertCSS({
    target: { tabId: activeTab.id },
    css: 'body { background: red !important; }'
  });
  
  // Remove CSS
  await browser.scripting.removeCSS({
    target: { tabId: activeTab.id },
    css: 'body { background: red !important; }'
  });
  
  // Register content scripts dynamically
  await browser.scripting.registerContentScripts([{
    id: 'dynamic-script',
    matches: ['*://*.example.com/*'],
    js: ['dynamic-content-script.js'],
    runAt: 'document_idle'
  }]);
  
  // Unregister content scripts
  await browser.scripting.unregisterContentScripts({ ids: ['dynamic-script'] });
}

// ============================================================================
// ALARMS API
// ============================================================================

// Create recurring alarms
async function setupAlarms() {
  // Create one-time alarm
  await browser.alarms.create('oneTime', { when: Date.now() + 60000 });
  
  // Create recurring alarm
  await browser.alarms.create('recurring', { 
    delayInMinutes: 1,
    periodInMinutes: 5
  });
  
  // Get all alarms
  const alarms = await browser.alarms.getAll();
  console.log('Active alarms:', alarms);
}

// Handle alarm events
browser.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);
  
  switch (alarm.name) {
    case 'recurring':
      performPeriodicTask();
      break;
    case 'oneTime':
      performOneTimeTask();
      break;
  }
});

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

async function showNotifications() {
  // Basic notification
  await browser.notifications.create('basic-notification', {
    type: 'basic',
    iconUrl: 'icon-48.png',
    title: 'Extension Notification',
    message: 'This is a basic notification'
  });
  
  // Rich notification
  await browser.notifications.create('rich-notification', {
    type: 'basic',
    iconUrl: 'icon-48.png',
    title: 'Rich Notification',
    message: 'This notification has action buttons',
    buttons: [
      { title: 'Action 1' },
      { title: 'Action 2' }
    ]
  });
  
  // Progress notification
  await browser.notifications.create('progress-notification', {
    type: 'progress',
    iconUrl: 'icon-48.png',
    title: 'Download Progress',
    message: 'Downloading file...',
    progress: 45
  });
}

// Handle notification events
browser.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
  browser.notifications.clear(notificationId);
});

browser.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  console.log('Notification button clicked:', notificationId, buttonIndex);
});

// ============================================================================
// CONTEXT MENUS API
// ============================================================================

// Create context menus
browser.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  
  switch (info.menuItemId) {
    case 'search-text':
      if (info.selectionText) {
        browser.tabs.create({
          url: `https://google.com/search?q=${encodeURIComponent(info.selectionText)}`
        });
      }
      break;
      
    case 'save-image':
      if (info.srcUrl) {
        saveImageToStorage(info.srcUrl);
      }
      break;
  }
});

// Setup context menus
browser.runtime.onInstalled.addListener(() => {
  // Text selection menu
  browser.contextMenus.create({
    id: 'search-text',
    title: 'Search "%s"',
    contexts: ['selection']
  });
  
  // Image context menu
  browser.contextMenus.create({
    id: 'save-image',
    title: 'Save image to extension',
    contexts: ['image']
  });
  
  // Page context menu
  browser.contextMenus.create({
    id: 'analyze-page',
    title: 'Analyze this page',
    contexts: ['page'],
    documentUrlPatterns: ['*://*.example.com/*']
  });
});

// ============================================================================
// COOKIES API
// ============================================================================

async function cookieOperations() {
  // Get cookies
  const cookies = await browser.cookies.getAll({
    domain: '.example.com'
  });
  console.log('Domain cookies:', cookies);
  
  // Get specific cookie
  const sessionCookie = await browser.cookies.get({
    url: 'https://example.com',
    name: 'session_id'
  });
  
  // Set cookie
  await browser.cookies.set({
    url: 'https://example.com',
    name: 'extension_data',
    value: 'some_value',
    expirationDate: (Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
  });
  
  // Remove cookie
  await browser.cookies.remove({
    url: 'https://example.com',
    name: 'unwanted_cookie'
  });
}

// Cookie change listener
browser.cookies.onChanged.addListener((changeInfo) => {
  console.log('Cookie changed:', changeInfo);
  
  if (changeInfo.removed) {
    console.log('Cookie removed:', changeInfo.cookie);
  } else {
    console.log('Cookie added/updated:', changeInfo.cookie);
  }
});

// ============================================================================
// DOWNLOADS API
// ============================================================================

async function downloadOperations() {
  // Start download
  const downloadId = await browser.downloads.download({
    url: 'https://example.com/file.pdf',
    filename: 'downloaded-file.pdf',
    saveAs: true
  });
  
  console.log('Download started:', downloadId);
  
  // Search downloads
  const downloads = await browser.downloads.search({
    state: 'complete',
    limit: 10
  });
  console.log('Recent downloads:', downloads);
  
  // Cancel download
  await browser.downloads.cancel(downloadId);
  
  // Open download
  await browser.downloads.open(downloadId);
  
  // Show in folder
  await browser.downloads.show(downloadId);
}

// Download event listeners
browser.downloads.onCreated.addListener((download) => {
  console.log('Download created:', download);
});

browser.downloads.onChanged.addListener((delta) => {
  console.log('Download changed:', delta);
  
  if (delta.state?.current === 'complete') {
    browser.notifications.create('download-complete', {
      type: 'basic',
      iconUrl: 'icon-48.png',
      title: 'Download Complete',
      message: 'Your file has finished downloading'
    });
  }
});

// ============================================================================
// BOOKMARKS API
// ============================================================================

async function bookmarkOperations() {
  // Create bookmark
  const bookmark = await browser.bookmarks.create({
    title: 'Example Site',
    url: 'https://example.com',
    parentId: '1' // Bookmarks bar folder
  });
  
  console.log('Bookmark created:', bookmark);
  
  // Search bookmarks
  const results = await browser.bookmarks.search('example');
  console.log('Search results:', results);
  
  // Get bookmark tree
  const tree = await browser.bookmarks.getTree();
  console.log('Bookmark tree:', tree);
  
  // Update bookmark
  await browser.bookmarks.update(bookmark.id!, {
    title: 'Updated Example Site'
  });
  
  // Move bookmark
  await browser.bookmarks.move(bookmark.id!, {
    parentId: '2' // Other bookmarks folder
  });
  
  // Remove bookmark
  await browser.bookmarks.remove(bookmark.id!);
}

// ============================================================================
// HISTORY API
// ============================================================================

async function historyOperations() {
  // Search history
  const history = await browser.history.search({
    text: 'example',
    maxResults: 10
  });
  console.log('History results:', history);
  
  // Get visits for a URL
  const visits = await browser.history.getVisits({
    url: 'https://example.com'
  });
  console.log('Visits:', visits);
  
  // Add URL to history
  await browser.history.addUrl({
    url: 'https://example.com/visited'
  });
  
  // Delete URL from history
  await browser.history.deleteUrl({
    url: 'https://example.com/delete-this'
  });
  
  // Delete all history
  await browser.history.deleteAll();
}

// ============================================================================
// PERMISSIONS API
// ============================================================================

async function permissionOperations() {
  // Check if permission is granted
  const hasPermission = await browser.permissions.contains({
    permissions: ['tabs'],
    origins: ['*://*.example.com/*']
  });
  
  console.log('Has permission:', hasPermission);
  
  // Request permission
  const granted = await browser.permissions.request({
    permissions: ['downloads'],
    origins: ['*://*.newsite.com/*']
  });
  
  if (granted) {
    console.log('Permission granted');
  }
  
  // Remove permission
  await browser.permissions.remove({
    permissions: ['downloads']
  });
}

// Permission change listener
browser.permissions.onAdded.addListener((permissions) => {
  console.log('Permissions added:', permissions);
});

browser.permissions.onRemoved.addListener((permissions) => {
  console.log('Permissions removed:', permissions);
});

// ============================================================================
// EXTENSION UTILITIES
// ============================================================================

// URL and resource handling
function getExtensionUrl(path: string): string {
  return browser.runtime.getURL(path);
}

// Get extension info
async function getExtensionInfo() {
  const manifest = browser.runtime.getManifest();
  console.log('Extension version:', manifest.version);
  console.log('Extension name:', manifest.name);
  
  // Get platform info
  const platformInfo = await browser.runtime.getPlatformInfo();
  console.log('Platform:', platformInfo);
}

// Handle extension updates
browser.runtime.onUpdateAvailable.addListener((details) => {
  console.log('Update available:', details.version);
  
  // Reload extension to apply update
  browser.runtime.reload();
});

// Error handling
browser.runtime.onSuspend.addListener(() => {
  console.log('Extension suspended');
  // Cleanup resources
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getUserData(userId: string) {
  // Fetch user data from API or storage
  return { id: userId, name: 'John Doe' };
}

async function updateUserSettings(settings: any) {
  // Update user settings in storage
  await userSettings.setValue(settings);
}

function performPeriodicTask() {
  console.log('Performing periodic task');
}

function performOneTimeTask() {
  console.log('Performing one-time task');
}

async function saveImageToStorage(imageUrl: string) {
  // Download and save image
  console.log('Saving image:', imageUrl);
}

function setupPopupEventListeners() {
  // Setup popup UI event listeners
}

function loadUserSettings() {
  // Load and display user settings
}

function setupOptionsForm() {
  // Setup options page form
}

function loadAllSettings() {
  // Load all extension settings
}