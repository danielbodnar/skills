// Advanced Content Script Examples

// Base content script class with common functionality
abstract class BaseContentScript {
  protected isInitialized = false;
  protected settings: any = {};
  protected observers: MutationObserver[] = [];
  protected eventListeners: Array<{ element: Element; type: string; handler: EventListener }> = [];

  constructor() {
    this.init();
  }

  protected async init() {
    if (this.isInitialized) return;

    console.log('Content script initializing on:', window.location.href);

    try {
      await this.loadSettings();
      this.setupMessageListener();
      await this.onReady();
      this.startObserving();
      this.isInitialized = true;
      console.log('Content script initialized successfully');
    } catch (error) {
      console.error('Content script initialization failed:', error);
    }
  }

  protected async loadSettings() {
    try {
      const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
      this.settings = response.settings || {};
    } catch (error) {
      console.warn('Failed to load settings:', error);
      this.settings = {};
    }
  }

  protected setupMessageListener() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      return this.handleMessage(message, sender, sendResponse);
    });
  }

  protected async handleMessage(
    message: any,
    sender: browser.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<any> {
    try {
      switch (message.type) {
        case 'PING':
          return { pong: true, url: window.location.href };

        case 'GET_PAGE_INFO':
          return this.getPageInfo();

        case 'SETTINGS_UPDATED':
          this.settings = message.settings;
          await this.onSettingsChanged();
          return { success: true };

        case 'TOGGLE_STATE':
          await this.toggle();
          return { success: true };

        case 'EXECUTE_ACTION':
          return await this.executeAction(message.action, message.data);

        case 'GET_SELECTION':
          return { selection: window.getSelection()?.toString() || '' };

        case 'SCROLL_TO_ELEMENT':
          return this.scrollToElement(message.selector);

        default:
          return await this.handleCustomMessage(message, sender, sendResponse);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      return { error: error.message };
    }
  }

  protected abstract onReady(): Promise<void>;
  protected abstract onSettingsChanged(): Promise<void>;
  protected abstract toggle(): Promise<void>;
  protected abstract handleCustomMessage(
    message: any,
    sender: browser.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<any>;

  protected startObserving() {
    // DOM mutation observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        this.handleMutation(mutation);
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });

    this.observers.push(observer);

    // Intersection observer for lazy loading
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.handleElementInView(entry.target);
        }
      });
    });

    // Observe all images initially
    document.querySelectorAll('img').forEach((img) => {
      intersectionObserver.observe(img);
    });
  }

  protected handleMutation(mutation: MutationRecord) {
    // Override in subclasses to handle specific mutations
  }

  protected handleElementInView(element: Element) {
    // Override in subclasses to handle elements coming into view
  }

  protected getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      hasScripts: document.scripts.length > 0,
      hasImages: document.images.length > 0,
      wordCount: document.body.innerText.split(/\s+/).length,
      lastModified: document.lastModified,
      charset: document.characterSet,
      lang: document.documentElement.lang,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  protected scrollToElement(selector: string): { success: boolean; error?: string } {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return { success: true };
      } else {
        return { success: false, error: 'Element not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  protected async executeAction(action: string, data: any): Promise<any> {
    switch (action) {
      case 'highlight_text':
        return this.highlightText(data.text, data.color);
      case 'remove_element':
        return this.removeElement(data.selector);
      case 'modify_css':
        return this.modifyCSS(data.selector, data.styles);
      case 'inject_html':
        return this.injectHTML(data.html, data.position);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  protected highlightText(text: string, color = '#ffff00'): { count: number } {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent?.includes(text)) {
        textNodes.push(node as Text);
      }
    }

    let count = 0;
    textNodes.forEach((textNode) => {
      const parent = textNode.parentElement;
      if (parent && !parent.classList.contains('extension-highlight')) {
        const content = textNode.textContent!;
        const highlighted = content.replace(
          new RegExp(text, 'gi'),
          `<mark class="extension-highlight" style="background-color: ${color};">$&</mark>`
        );

        if (highlighted !== content) {
          const wrapper = document.createElement('span');
          wrapper.innerHTML = highlighted;
          parent.replaceChild(wrapper, textNode);
          count++;
        }
      }
    });

    return { count };
  }

  protected removeElement(selector: string): { success: boolean; count: number } {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => el.remove());
    return { success: true, count: elements.length };
  }

  protected modifyCSS(selector: string, styles: Record<string, string>): { success: boolean; count: number } {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      Object.assign((el as HTMLElement).style, styles);
    });
    return { success: true, count: elements.length };
  }

  protected injectHTML(html: string, position: 'top' | 'bottom' = 'bottom'): { success: boolean } {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.className = 'extension-injected';

    if (position === 'top') {
      document.body.insertBefore(container, document.body.firstChild);
    } else {
      document.body.appendChild(container);
    }

    return { success: true };
  }

  protected addEventListener(element: Element, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    this.eventListeners.push({ element, type, handler });
  }

  protected cleanup() {
    // Remove observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    // Remove event listeners
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.eventListeners = [];

    // Remove injected elements
    document.querySelectorAll('.extension-injected, .extension-highlight').forEach((el) => {
      el.remove();
    });
  }
}

// Specific content script implementations
class TextManipulationScript extends BaseContentScript {
  private isActive = false;
  private highlightedElements: Set<Element> = new Set();

  protected async onReady() {
    console.log('Text manipulation script ready');
    
    if (this.settings.enabled && this.settings.autoHighlight) {
      await this.activateHighlighting();
    }
  }

  protected async onSettingsChanged() {
    if (this.settings.enabled) {
      if (!this.isActive) {
        await this.activateHighlighting();
      }
    } else {
      await this.deactivateHighlighting();
    }
  }

  protected async toggle() {
    if (this.isActive) {
      await this.deactivateHighlighting();
    } else {
      await this.activateHighlighting();
    }
  }

  protected async handleCustomMessage(message: any): Promise<any> {
    switch (message.type) {
      case 'HIGHLIGHT_SELECTION':
        return this.highlightCurrentSelection(message.color);
      case 'CLEAR_HIGHLIGHTS':
        return this.clearAllHighlights();
      case 'GET_HIGHLIGHTED_TEXT':
        return this.getHighlightedText();
      default:
        return { error: 'Unknown message type' };
    }
  }

  private async activateHighlighting() {
    this.isActive = true;
    
    // Add selection listener
    this.addEventListener(document, 'mouseup', this.handleTextSelection.bind(this));
    this.addEventListener(document, 'keyup', this.handleKeyboardSelection.bind(this));

    // Add visual indicator
    this.addActiveIndicator();
  }

  private async deactivateHighlighting() {
    this.isActive = false;
    this.removeActiveIndicator();
  }

  private handleTextSelection() {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      this.showSelectionOptions(selection);
    }
  }

  private handleKeyboardSelection(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'h') {
      event.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        this.highlightSelection(selection);
      }
    }
  }

  private showSelectionOptions(selection: Selection) {
    // Remove existing options
    this.removeSelectionOptions();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const options = document.createElement('div');
    options.className = 'extension-selection-options';
    options.style.cssText = `
      position: fixed;
      top: ${rect.top - 40}px;
      left: ${rect.left}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui;
      font-size: 12px;
    `;

    const highlightBtn = document.createElement('button');
    highlightBtn.textContent = 'Highlight';
    highlightBtn.style.cssText = 'margin-right: 4px; padding: 4px 8px; border: none; background: #007bff; color: white; border-radius: 2px; cursor: pointer;';
    highlightBtn.onclick = () => {
      this.highlightSelection(selection);
      this.removeSelectionOptions();
    };

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cssText = 'padding: 4px 8px; border: none; background: #28a745; color: white; border-radius: 2px; cursor: pointer;';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(selection.toString());
      this.removeSelectionOptions();
    };

    options.appendChild(highlightBtn);
    options.appendChild(copyBtn);
    document.body.appendChild(options);

    // Auto-remove after 3 seconds
    setTimeout(() => this.removeSelectionOptions(), 3000);
  }

  private removeSelectionOptions() {
    const options = document.querySelector('.extension-selection-options');
    if (options) {
      options.remove();
    }
  }

  private highlightCurrentSelection(color = '#ffff00') {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return this.highlightSelection(selection, color);
    }
    return { success: false, error: 'No text selected' };
  }

  private highlightSelection(selection: Selection, color = '#ffff00') {
    try {
      const range = selection.getRangeAt(0);
      
      // Create highlight element
      const highlight = document.createElement('mark');
      highlight.className = 'extension-text-highlight';
      highlight.style.backgroundColor = color;
      highlight.style.padding = '0';
      highlight.style.margin = '0';
      
      // Wrap selection
      range.surroundContents(highlight);
      this.highlightedElements.add(highlight);
      
      // Clear selection
      selection.removeAllRanges();
      
      return { success: true, text: highlight.textContent };
    } catch (error) {
      console.error('Failed to highlight selection:', error);
      return { success: false, error: error.message };
    }
  }

  private clearAllHighlights() {
    document.querySelectorAll('.extension-text-highlight').forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });
    
    this.highlightedElements.clear();
    return { success: true, count: document.querySelectorAll('.extension-text-highlight').length };
  }

  private getHighlightedText() {
    const highlights = Array.from(document.querySelectorAll('.extension-text-highlight'));
    return {
      highlights: highlights.map((el, index) => ({
        id: index,
        text: el.textContent,
        color: (el as HTMLElement).style.backgroundColor
      }))
    };
  }

  private addActiveIndicator() {
    if (document.getElementById('extension-text-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'extension-text-indicator';
    indicator.textContent = 'Text Tools Active';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #28a745;
      color: white;
      padding: 6px 10px;
      border-radius: 4px;
      font-family: system-ui;
      font-size: 11px;
      z-index: 10000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      cursor: pointer;
    `;

    indicator.onclick = () => this.toggle();
    document.body.appendChild(indicator);
  }

  private removeActiveIndicator() {
    const indicator = document.getElementById('extension-text-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

// Dark mode content script
class DarkModeScript extends BaseContentScript {
  private isDarkMode = false;
  private originalStyles: Map<Element, string> = new Map();

  protected async onReady() {
    console.log('Dark mode script ready');
    
    if (this.settings.darkMode) {
      await this.enableDarkMode();
    }
  }

  protected async onSettingsChanged() {
    if (this.settings.darkMode !== this.isDarkMode) {
      await this.toggle();
    }
  }

  protected async toggle() {
    if (this.isDarkMode) {
      await this.disableDarkMode();
    } else {
      await this.enableDarkMode();
    }
  }

  protected async handleCustomMessage(message: any): Promise<any> {
    switch (message.type) {
      case 'GET_DARK_MODE_STATUS':
        return { isDarkMode: this.isDarkMode };
      case 'SET_DARK_MODE':
        if (message.enabled) {
          await this.enableDarkMode();
        } else {
          await this.disableDarkMode();
        }
        return { success: true };
      default:
        return { error: 'Unknown message type' };
    }
  }

  private async enableDarkMode() {
    if (this.isDarkMode) return;

    this.isDarkMode = true;

    // Apply dark mode styles
    const style = document.createElement('style');
    style.id = 'extension-dark-mode';
    style.textContent = `
      html {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      
      img, video, iframe, svg, embed, object {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      
      [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
    `;

    document.head.appendChild(style);

    // Store original styles for restoration
    document.querySelectorAll('*').forEach((el) => {
      const computed = window.getComputedStyle(el);
      if (computed.backgroundImage && computed.backgroundImage !== 'none') {
        this.originalStyles.set(el, (el as HTMLElement).style.filter || '');
      }
    });

    console.log('Dark mode enabled');
  }

  private async disableDarkMode() {
    if (!this.isDarkMode) return;

    this.isDarkMode = false;

    // Remove dark mode styles
    const style = document.getElementById('extension-dark-mode');
    if (style) {
      style.remove();
    }

    // Restore original styles
    this.originalStyles.forEach((originalFilter, element) => {
      (element as HTMLElement).style.filter = originalFilter;
    });
    this.originalStyles.clear();

    console.log('Dark mode disabled');
  }
}

// Initialize appropriate content script based on page and settings
async function initializeContentScript() {
  try {
    // Get settings to determine which script to load
    const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const settings = response?.settings || {};

    // Initialize based on page type and settings
    if (settings.textManipulation && shouldLoadTextScript()) {
      new TextManipulationScript();
    }

    if (settings.darkMode !== undefined && shouldLoadDarkModeScript()) {
      new DarkModeScript();
    }

  } catch (error) {
    console.error('Failed to initialize content script:', error);
  }
}

function shouldLoadTextScript(): boolean {
  // Don't load on certain sites or document types
  const excludedSites = ['gmail.com', 'docs.google.com'];
  const isExcluded = excludedSites.some(site => window.location.hostname.includes(site));
  
  return !isExcluded && 
         document.contentType?.includes('text/html') && 
         document.body !== null;
}

function shouldLoadDarkModeScript(): boolean {
  // Load on most sites except those with native dark mode
  const nativeDarkModeSites = ['youtube.com', 'github.com'];
  const hasNativeDarkMode = nativeDarkModeSites.some(site => window.location.hostname.includes(site));
  
  return !hasNativeDarkMode;
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

export { BaseContentScript, TextManipulationScript, DarkModeScript };