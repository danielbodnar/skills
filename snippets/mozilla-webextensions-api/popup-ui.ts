// WebExtensions Popup UI Examples

// Modern popup component with TypeScript
class ExtensionPopup {
  private container: HTMLElement;
  private settings: any = {};
  private isLoading = false;

  constructor(containerId = 'popup-root') {
    this.container = document.getElementById(containerId) || document.body;
    this.init();
  }

  private async init() {
    await this.loadSettings();
    this.render();
    this.attachEventListeners();
    this.updateUI();
  }

  private async loadSettings() {
    try {
      const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
      this.settings = response.settings || {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showError('Failed to load settings');
    }
  }

  private render() {
    this.container.innerHTML = `
      <div class="popup-container">
        <header class="popup-header">
          <img src="../icons/icon-32.png" alt="Extension Icon" class="popup-icon">
          <h1 class="popup-title">Extension Name</h1>
          <div class="popup-version">v1.0.0</div>
        </header>

        <main class="popup-content">
          <div class="loading-overlay" id="loading">
            <div class="spinner"></div>
            <span>Loading...</span>
          </div>

          <div class="error-message" id="error" style="display: none;">
            <span class="error-text"></span>
            <button class="error-close">&times;</button>
          </div>

          <section class="toggle-section">
            <div class="toggle-item">
              <label class="toggle-label">
                <input type="checkbox" id="main-toggle" class="toggle-input">
                <span class="toggle-slider"></span>
                <span class="toggle-text">Enable Extension</span>
              </label>
            </div>
          </section>

          <section class="feature-section">
            <h3>Features</h3>
            
            <div class="feature-item">
              <label class="feature-label">
                <input type="checkbox" id="dark-mode-toggle">
                <span class="feature-text">Dark Mode</span>
              </label>
            </div>

            <div class="feature-item">
              <label class="feature-label">
                <input type="checkbox" id="text-tools-toggle">
                <span class="feature-text">Text Tools</span>
              </label>
            </div>

            <div class="feature-item">
              <label class="feature-label">
                <input type="checkbox" id="notifications-toggle">
                <span class="feature-text">Notifications</span>
              </label>
            </div>
          </section>

          <section class="actions-section">
            <h3>Quick Actions</h3>
            
            <div class="action-buttons">
              <button class="action-btn primary" id="toggle-current-tab">
                <span class="btn-icon">🔄</span>
                Toggle Current Tab
              </button>
              
              <button class="action-btn secondary" id="clear-data">
                <span class="btn-icon">🗑️</span>
                Clear Data
              </button>
              
              <button class="action-btn secondary" id="export-settings">
                <span class="btn-icon">📁</span>
                Export Settings
              </button>
            </div>
          </section>

          <section class="stats-section">
            <h3>Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value" id="pages-processed">0</div>
                <div class="stat-label">Pages Processed</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" id="time-saved">0m</div>
                <div class="stat-label">Time Saved</div>
              </div>
            </div>
          </section>
        </main>

        <footer class="popup-footer">
          <button class="footer-btn" id="options-btn">
            <span class="btn-icon">⚙️</span>
            Options
          </button>
          
          <button class="footer-btn" id="help-btn">
            <span class="btn-icon">❓</span>
            Help
          </button>
          
          <button class="footer-btn" id="rate-btn">
            <span class="btn-icon">⭐</span>
            Rate
          </button>
        </footer>
      </div>
    `;

    this.injectStyles();
  }

  private injectStyles() {
    const existingStyle = document.getElementById('popup-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'popup-styles';
    style.textContent = `
      .popup-container {
        width: 350px;
        min-height: 400px;
        font-family: system-ui, -apple-system, sans-serif;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }

      .popup-header {
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .popup-icon {
        width: 24px;
        height: 24px;
      }

      .popup-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        flex: 1;
      }

      .popup-version {
        font-size: 12px;
        opacity: 0.8;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 6px;
        border-radius: 10px;
      }

      .popup-content {
        padding: 20px;
        position: relative;
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        z-index: 10;
      }

      .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e3e3e3;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error-message {
        background: #f8d7da;
        color: #721c24;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .error-close {
        background: none;
        border: none;
        color: #721c24;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toggle-section {
        margin-bottom: 24px;
      }

      .toggle-item {
        display: flex;
        align-items: center;
      }

      .toggle-label {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        width: 100%;
      }

      .toggle-input {
        display: none;
      }

      .toggle-slider {
        position: relative;
        width: 44px;
        height: 24px;
        background: #ccc;
        border-radius: 12px;
        transition: background 0.3s;
      }

      .toggle-slider::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s;
      }

      .toggle-input:checked + .toggle-slider {
        background: #007bff;
      }

      .toggle-input:checked + .toggle-slider::before {
        transform: translateX(20px);
      }

      .toggle-text {
        font-weight: 500;
        flex: 1;
      }

      .feature-section, .actions-section, .stats-section {
        margin-bottom: 24px;
      }

      .feature-section h3, .actions-section h3, .stats-section h3 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: #333;
      }

      .feature-item {
        margin: 8px 0;
      }

      .feature-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .feature-label input[type="checkbox"] {
        margin: 0;
      }

      .feature-text {
        flex: 1;
        font-size: 13px;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
        text-align: left;
      }

      .action-btn.primary {
        background: #007bff;
        color: white;
      }

      .action-btn.primary:hover {
        background: #0056b3;
      }

      .action-btn.secondary {
        background: #f8f9fa;
        color: #333;
        border: 1px solid #dee2e6;
      }

      .action-btn.secondary:hover {
        background: #e9ecef;
      }

      .btn-icon {
        font-size: 14px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .stat-item {
        text-align: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: #007bff;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #666;
      }

      .popup-footer {
        background: #f8f9fa;
        padding: 12px 20px;
        display: flex;
        justify-content: space-around;
        border-top: 1px solid #dee2e6;
      }

      .footer-btn {
        background: none;
        border: none;
        color: #666;
        font-size: 11px;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        min-width: 60px;
      }

      .footer-btn:hover {
        background: rgba(0, 123, 255, 0.1);
        color: #007bff;
      }

      .footer-btn .btn-icon {
        font-size: 16px;
      }

      /* Dark mode styles */
      @media (prefers-color-scheme: dark) {
        .popup-container {
          background: #1a1a1a;
          color: #ffffff;
        }

        .popup-content {
          background: #1a1a1a;
        }

        .feature-section h3, .actions-section h3, .stats-section h3 {
          color: #ffffff;
        }

        .action-btn.secondary {
          background: #2d2d2d;
          color: #ffffff;
          border-color: #404040;
        }

        .action-btn.secondary:hover {
          background: #404040;
        }

        .stat-item {
          background: #2d2d2d;
        }

        .popup-footer {
          background: #2d2d2d;
          border-top-color: #404040;
        }

        .footer-btn {
          color: #cccccc;
        }
      }
    `;

    document.head.appendChild(style);
  }

  private attachEventListeners() {
    // Main toggle
    const mainToggle = document.getElementById('main-toggle') as HTMLInputElement;
    mainToggle?.addEventListener('change', this.handleMainToggle.bind(this));

    // Feature toggles
    const darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLInputElement;
    darkModeToggle?.addEventListener('change', this.handleFeatureToggle.bind(this, 'darkMode'));

    const textToolsToggle = document.getElementById('text-tools-toggle') as HTMLInputElement;
    textToolsToggle?.addEventListener('change', this.handleFeatureToggle.bind(this, 'textTools'));

    const notificationsToggle = document.getElementById('notifications-toggle') as HTMLInputElement;
    notificationsToggle?.addEventListener('change', this.handleFeatureToggle.bind(this, 'notifications'));

    // Action buttons
    document.getElementById('toggle-current-tab')?.addEventListener('click', this.toggleCurrentTab.bind(this));
    document.getElementById('clear-data')?.addEventListener('click', this.clearData.bind(this));
    document.getElementById('export-settings')?.addEventListener('click', this.exportSettings.bind(this));

    // Footer buttons
    document.getElementById('options-btn')?.addEventListener('click', this.openOptions.bind(this));
    document.getElementById('help-btn')?.addEventListener('click', this.openHelp.bind(this));
    document.getElementById('rate-btn')?.addEventListener('click', this.openRating.bind(this));

    // Error close button
    document.querySelector('.error-close')?.addEventListener('click', this.hideError.bind(this));
  }

  private updateUI() {
    // Update toggles based on settings
    const mainToggle = document.getElementById('main-toggle') as HTMLInputElement;
    if (mainToggle) mainToggle.checked = this.settings.enabled || false;

    const darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLInputElement;
    if (darkModeToggle) darkModeToggle.checked = this.settings.darkMode || false;

    const textToolsToggle = document.getElementById('text-tools-toggle') as HTMLInputElement;
    if (textToolsToggle) textToolsToggle.checked = this.settings.textTools || false;

    const notificationsToggle = document.getElementById('notifications-toggle') as HTMLInputElement;
    if (notificationsToggle) notificationsToggle.checked = this.settings.notifications || false;

    // Update stats
    this.updateStats();

    // Hide loading
    this.hideLoading();
  }

  private async updateStats() {
    try {
      const response = await browser.runtime.sendMessage({ type: 'GET_STATS' });
      const stats = response.stats || {};

      const pagesElement = document.getElementById('pages-processed');
      if (pagesElement) pagesElement.textContent = stats.pagesProcessed || '0';

      const timeElement = document.getElementById('time-saved');
      if (timeElement) timeElement.textContent = `${stats.timeSaved || 0}m`;

    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  private async handleMainToggle(event: Event) {
    const target = event.target as HTMLInputElement;
    const enabled = target.checked;

    this.showLoading();

    try {
      const newSettings = { ...this.settings, enabled };
      await this.updateSettings(newSettings);
      
      // Send message to current tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await browser.tabs.sendMessage(tabs[0].id!, {
          type: 'MAIN_TOGGLE',
          enabled
        });
      }

    } catch (error) {
      console.error('Failed to toggle extension:', error);
      this.showError('Failed to update settings');
      target.checked = !enabled; // Revert
    } finally {
      this.hideLoading();
    }
  }

  private async handleFeatureToggle(feature: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const enabled = target.checked;

    try {
      const newSettings = { ...this.settings, [feature]: enabled };
      await this.updateSettings(newSettings);

      // Send feature-specific message to current tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await browser.tabs.sendMessage(tabs[0].id!, {
          type: 'FEATURE_TOGGLE',
          feature,
          enabled
        });
      }

    } catch (error) {
      console.error(`Failed to toggle ${feature}:`, error);
      this.showError(`Failed to toggle ${feature}`);
      target.checked = !enabled; // Revert
    }
  }

  private async toggleCurrentTab() {
    this.showLoading();

    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        const response = await browser.tabs.sendMessage(tabs[0].id!, {
          type: 'TOGGLE_STATE'
        });
        
        if (response.success) {
          this.showSuccess('Tab state toggled successfully');
        } else {
          this.showError('Failed to toggle tab state');
        }
      }
    } catch (error) {
      console.error('Failed to toggle current tab:', error);
      this.showError('Extension not active on this tab');
    } finally {
      this.hideLoading();
    }
  }

  private async clearData() {
    if (!confirm('Are you sure you want to clear all extension data?')) {
      return;
    }

    this.showLoading();

    try {
      await browser.runtime.sendMessage({ type: 'CLEAR_DATA' });
      this.showSuccess('Data cleared successfully');
      
      // Reload settings
      await this.loadSettings();
      this.updateUI();
      
    } catch (error) {
      console.error('Failed to clear data:', error);
      this.showError('Failed to clear data');
    } finally {
      this.hideLoading();
    }
  }

  private async exportSettings() {
    try {
      const response = await browser.runtime.sendMessage({ type: 'EXPORT_SETTINGS' });
      const settings = response.settings;

      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extension-settings.json';
      a.click();
      
      URL.revokeObjectURL(url);
      this.showSuccess('Settings exported successfully');

    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showError('Failed to export settings');
    }
  }

  private async openOptions() {
    try {
      await browser.runtime.openOptionsPage();
      window.close();
    } catch (error) {
      console.error('Failed to open options:', error);
    }
  }

  private async openHelp() {
    try {
      await browser.tabs.create({
        url: browser.runtime.getURL('pages/help.html')
      });
      window.close();
    } catch (error) {
      console.error('Failed to open help:', error);
    }
  }

  private async openRating() {
    try {
      await browser.tabs.create({
        url: 'https://addons.mozilla.org/firefox/addon/your-extension/'
      });
      window.close();
    } catch (error) {
      console.error('Failed to open rating page:', error);
    }
  }

  private async updateSettings(newSettings: any) {
    await browser.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: newSettings
    });

    this.settings = newSettings;
  }

  private showLoading() {
    this.isLoading = true;
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
  }

  private hideLoading() {
    this.isLoading = false;
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }

  private showError(message: string) {
    const errorElement = document.getElementById('error');
    const errorText = document.querySelector('.error-text');
    
    if (errorElement && errorText) {
      errorText.textContent = message;
      errorElement.style.display = 'flex';
      
      // Auto-hide after 5 seconds
      setTimeout(() => this.hideError(), 5000);
    }
  }

  private hideError() {
    const errorElement = document.getElementById('error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  private showSuccess(message: string) {
    // You can implement a success notification similar to error
    console.log('Success:', message);
  }
}

// Simple popup HTML template (popup.html)
const popupHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Extension Popup</title>
</head>
<body>
  <div id="popup-root"></div>
  <script src="popup.js"></script>
</body>
</html>
`;

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ExtensionPopup();
});

export { ExtensionPopup, popupHTML };