// WXT Storage Examples
// Comprehensive guide for extension storage patterns

// ============================================================================
// WXT STORAGE BASICS
// ============================================================================

import { storage } from 'wxt/storage';

// Define typed storage items
const userSettings = storage.defineItem<{
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  autoSave: boolean;
}>('local:userSettings', {
  defaultValue: {
    theme: 'light',
    language: 'en',
    notifications: true,
    autoSave: false
  }
});

const sessionData = storage.defineItem<{
  visitCount: number;
  lastVisit: string;
  tempData: Record<string, any>;
}>('session:currentSession');

const syncedPreferences = storage.defineItem<{
  bookmarks: string[];
  customFilters: string[];
}>('sync:userPreferences');

// Basic storage operations
async function basicStorageOperations() {
  // Set values
  await userSettings.setValue({
    theme: 'dark',
    language: 'es',
    notifications: true,
    autoSave: true
  });
  
  // Get values
  const settings = await userSettings.getValue();
  console.log('Current settings:', settings);
  
  // Get with fallback
  const theme = (await userSettings.getValue())?.theme ?? 'light';
  console.log('Theme:', theme);
  
  // Remove value
  await userSettings.removeValue();
  
  // Check if value exists
  const exists = await userSettings.getValue() !== null;
  console.log('Settings exist:', exists);
}

// ============================================================================
// STORAGE AREAS
// ============================================================================

// Local storage (persists locally)
const localCounter = storage.defineItem<number>('local:counter', {
  defaultValue: 0
});

// Sync storage (syncs across devices)
const syncedBookmarks = storage.defineItem<string[]>('sync:bookmarks', {
  defaultValue: []
});

// Session storage (cleared when session ends)
const sessionCache = storage.defineItem<Record<string, any>>('session:cache');

// Managed storage (read-only, set by enterprise policies)
const managedSettings = storage.defineItem<{
  blockedSites: string[];
  maxFileSize: number;
}>('managed:enterpriseSettings');

async function storageAreaExamples() {
  // Local storage - good for large data, user preferences
  await localCounter.setValue(42);
  
  // Sync storage - good for settings that should sync across devices
  await syncedBookmarks.setValue(['https://example.com', 'https://test.com']);
  
  // Session storage - good for temporary data
  await sessionCache.setValue({
    tempToken: 'abc123',
    timestamp: Date.now()
  });
  
  // Managed storage - read-only enterprise settings
  const enterpriseConfig = await managedSettings.getValue();
  console.log('Enterprise config:', enterpriseConfig);
}

// ============================================================================
// WATCHING STORAGE CHANGES
// ============================================================================

// Watch for changes to specific items
function setupStorageWatchers() {
  // Watch single item
  const unwatch = userSettings.watch((newValue, oldValue) => {
    console.log('Settings changed:', { newValue, oldValue });
    
    // Apply theme change
    if (newValue?.theme !== oldValue?.theme) {
      applyTheme(newValue?.theme || 'light');
    }
    
    // Handle language change
    if (newValue?.language !== oldValue?.language) {
      updateLanguage(newValue?.language || 'en');
    }
  });
  
  // Unwatch when no longer needed
  // unwatch();
  
  // Watch all storage changes
  browser.storage.onChanged.addListener((changes, areaName) => {
    console.log('Storage changed in', areaName, ':', changes);
    
    for (const [key, change] of Object.entries(changes)) {
      console.log(`${key}: ${change.oldValue} -> ${change.newValue}`);
    }
  });
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

const userProfile = storage.defineItem<{
  id: string;
  name: string;
  email: string;
}>('local:userProfile');

const appConfig = storage.defineItem<{
  version: string;
  features: string[];
}>('local:appConfig');

async function bulkStorageOperations() {
  // Get multiple items at once
  const items = await storage.getItems([userSettings, userProfile, appConfig]);
  console.log('All items:', items);
  
  // Set multiple items at once
  await storage.setItems([
    { item: userSettings, value: { theme: 'dark', language: 'en', notifications: true, autoSave: false } },
    { item: userProfile, value: { id: '123', name: 'John', email: 'john@example.com' } },
    { item: appConfig, value: { version: '1.0.0', features: ['feature1', 'feature2'] } }
  ]);
  
  // Remove multiple items
  await storage.removeItems([sessionCache, sessionData]);
  
  // Get metadata for items
  const metadata = await storage.getMetas([userSettings, userProfile]);
  console.log('Storage metadata:', metadata);
}

// ============================================================================
// STORAGE WITH METADATA
// ============================================================================

// Storage items can include metadata
const cachedData = storage.defineItem<{
  data: any[];
  lastFetch: number;
}>('local:apiCache');

async function storageWithMetadata() {
  // Set value with metadata
  await cachedData.setValue({
    data: [{ id: 1, name: 'Item 1' }],
    lastFetch: Date.now()
  });
  
  // Get metadata
  const meta = await cachedData.getMeta();
  console.log('Cache metadata:', meta);
  
  // Set custom metadata
  await cachedData.setMeta({
    version: '1.0',
    source: 'api',
    expires: Date.now() + (60 * 60 * 1000) // 1 hour
  });
  
  // Check if cache is expired
  const cacheMeta = await cachedData.getMeta();
  const isExpired = cacheMeta?.expires && Date.now() > cacheMeta.expires;
  
  if (isExpired) {
    console.log('Cache expired, refetching...');
    await cachedData.removeValue();
  }
}

// ============================================================================
// REACTIVE STORAGE WITH FRAMEWORKS
// ============================================================================

// React hook for storage
import { useState, useEffect } from 'react';

function useStorageItem<T>(storageItem: any) {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load initial value
    storageItem.getValue().then((val: T | null) => {
      setValue(val);
      setLoading(false);
    });
    
    // Watch for changes
    const unwatch = storageItem.watch((newValue: T | null) => {
      setValue(newValue);
    });
    
    return unwatch;
  }, [storageItem]);
  
  const updateValue = async (newValue: T) => {
    await storageItem.setValue(newValue);
    // setValue will be updated by the watcher
  };
  
  return { value, loading, updateValue };
}

// Vue composable for storage
import { ref, watchEffect } from 'vue';

function useStorageItem<T>(storageItem: any) {
  const value = ref<T | null>(null);
  const loading = ref(true);
  
  watchEffect(async (onInvalidate) => {
    // Load initial value
    const initialValue = await storageItem.getValue();
    value.value = initialValue;
    loading.value = false;
    
    // Watch for changes
    const unwatch = storageItem.watch((newValue: T | null) => {
      value.value = newValue;
    });
    
    onInvalidate(unwatch);
  });
  
  const updateValue = async (newValue: T) => {
    await storageItem.setValue(newValue);
  };
  
  return { value, loading, updateValue };
}

// Svelte store for storage
import { writable } from 'svelte/store';

function createStorageStore<T>(storageItem: any) {
  const { subscribe, set } = writable<T | null>(null);
  
  // Load initial value
  storageItem.getValue().then((value: T | null) => {
    set(value);
  });
  
  // Watch for changes
  storageItem.watch((newValue: T | null) => {
    set(newValue);
  });
  
  return {
    subscribe,
    update: async (newValue: T) => {
      await storageItem.setValue(newValue);
    },
    remove: async () => {
      await storageItem.removeValue();
    }
  };
}

// ============================================================================
// MIGRATION AND VERSIONING
// ============================================================================

// Handle storage migrations between extension versions
const storageVersion = storage.defineItem<number>('local:storageVersion', {
  defaultValue: 1
});

async function migrateStorage() {
  const currentVersion = await storageVersion.getValue();
  
  if (currentVersion === 1) {
    console.log('Migrating from version 1 to 2...');
    
    // Get old data
    const oldSettings = await browser.storage.local.get('oldUserSettings');
    
    if (oldSettings.oldUserSettings) {
      // Transform and move to new format
      await userSettings.setValue({
        theme: oldSettings.oldUserSettings.theme || 'light',
        language: oldSettings.oldUserSettings.lang || 'en',
        notifications: oldSettings.oldUserSettings.notify ?? true,
        autoSave: false // New field
      });
      
      // Remove old data
      await browser.storage.local.remove('oldUserSettings');
    }
    
    await storageVersion.setValue(2);
  }
  
  if (currentVersion === 2) {
    console.log('Migrating from version 2 to 3...');
    
    // Another migration step
    const settings = await userSettings.getValue();
    if (settings) {
      // Add new field or transform existing data
      await userSettings.setValue({
        ...settings,
        autoSave: settings.autoSave ?? false
      });
    }
    
    await storageVersion.setValue(3);
  }
}

// ============================================================================
// STORAGE BACKUP AND SYNC
// ============================================================================

// Export all storage data
async function exportStorageData() {
  const allData = {
    local: await browser.storage.local.get(null),
    sync: await browser.storage.sync.get(null),
    session: await browser.storage.session?.get(null) || {},
    timestamp: Date.now(),
    version: browser.runtime.getManifest().version
  };
  
  // Convert to JSON
  const dataBlob = new Blob([JSON.stringify(allData, null, 2)], {
    type: 'application/json'
  });
  
  // Create download link
  const url = URL.createObjectURL(dataBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `extension-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Import storage data
async function importStorageData(file: File) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate data structure
    if (!data.timestamp || !data.version) {
      throw new Error('Invalid backup file format');
    }
    
    // Restore data
    if (data.local) {
      await browser.storage.local.set(data.local);
    }
    
    if (data.sync) {
      await browser.storage.sync.set(data.sync);
    }
    
    console.log('Storage data imported successfully');
    
    // Trigger migration if needed
    await migrateStorage();
    
  } catch (error) {
    console.error('Failed to import storage data:', error);
    throw error;
  }
}

// ============================================================================
// STORAGE LIMITS AND OPTIMIZATION
// ============================================================================

async function checkStorageUsage() {
  // Check quota usage
  const localUsage = await browser.storage.local.getBytesInUse();
  const syncUsage = await browser.storage.sync.getBytesInUse();
  
  console.log('Local storage usage:', localUsage, 'bytes');
  console.log('Sync storage usage:', syncUsage, 'bytes');
  
  // Check against limits
  const SYNC_QUOTA_BYTES = 102400; // 100KB
  const LOCAL_QUOTA_BYTES = 5242880; // 5MB
  
  if (syncUsage > SYNC_QUOTA_BYTES * 0.9) {
    console.warn('Sync storage almost full');
    await cleanupOldData();
  }
  
  if (localUsage > LOCAL_QUOTA_BYTES * 0.9) {
    console.warn('Local storage almost full');
    await cleanupLargeData();
  }
}

async function cleanupOldData() {
  // Remove old session data
  const sessionKeys = Object.keys(await browser.storage.session?.get(null) || {});
  const oldSessions = sessionKeys.filter(key => key.startsWith('temp_'));
  
  if (oldSessions.length > 0) {
    await browser.storage.session?.remove(oldSessions);
  }
  
  // Cleanup cached data older than 1 week
  const cache = await cachedData.getValue();
  if (cache && Date.now() - cache.lastFetch > 7 * 24 * 60 * 60 * 1000) {
    await cachedData.removeValue();
  }
}

async function cleanupLargeData() {
  // Remove large temporary files
  const allLocal = await browser.storage.local.get(null);
  
  for (const [key, value] of Object.entries(allLocal)) {
    if (key.startsWith('temp_') || key.startsWith('cache_')) {
      const size = new Blob([JSON.stringify(value)]).size;
      
      if (size > 100000) { // > 100KB
        console.log(`Removing large item: ${key} (${size} bytes)`);
        await browser.storage.local.remove(key);
      }
    }
  }
}

// ============================================================================
// CROSS-CONTEXT STORAGE ACCESS
// ============================================================================

// Background script storage operations
export default defineBackground(() => {
  // Listen for storage requests from content scripts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STORAGE_GET') {
      userSettings.getValue()
        .then(value => sendResponse({ success: true, data: value }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    
    if (message.type === 'STORAGE_SET') {
      userSettings.setValue(message.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });
});

// Content script storage helper
async function getStorageFromBackground<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    browser.runtime.sendMessage(
      { type: 'STORAGE_GET', key },
      (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          console.error('Storage get failed:', response.error);
          resolve(null);
        }
      }
    );
  });
}

async function setStorageFromBackground<T>(key: string, value: T): Promise<boolean> {
  return new Promise((resolve) => {
    browser.runtime.sendMessage(
      { type: 'STORAGE_SET', key, data: value },
      (response) => {
        resolve(response.success);
        if (!response.success) {
          console.error('Storage set failed:', response.error);
        }
      }
    );
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme);
  console.log('Theme applied:', theme);
}

function updateLanguage(language: string) {
  document.documentElement.setAttribute('lang', language);
  console.log('Language updated:', language);
}

// Storage debugging utility
async function debugStorage() {
  console.group('Storage Debug Info');
  
  // List all storage items
  const local = await browser.storage.local.get(null);
  const sync = await browser.storage.sync.get(null);
  const session = await browser.storage.session?.get(null) || {};
  
  console.log('Local storage:', local);
  console.log('Sync storage:', sync);
  console.log('Session storage:', session);
  
  // Check usage
  await checkStorageUsage();
  
  console.groupEnd();
}