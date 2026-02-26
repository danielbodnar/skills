// Chrome Gemini Nano - Chrome Extension Integration Examples
// Implementation patterns for Chrome Extensions using built-in AI

// Manifest.json permissions (no special permissions needed for Prompt API)
// "permissions": ["activeTab", "storage"]

// Background service worker with AI functionality
class AIExtensionBackground {
  private sessions: Map<string, any> = new Map();
  
  constructor() {
    this.initializeListeners();
  }
  
  private initializeListeners(): void {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(async (details) => {
      if (details.reason === 'install') {
        await this.initializeExtension();
      }
    });
    
    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        this.handleMessage(message, sender).then(sendResponse);
        return true; // Keep message channel open for async response
      }
    );
  }
  
  private async initializeExtension(): Promise<void> {
    // Check AI availability on installation
    const availability = await this.checkAIAvailability();
    
    await chrome.storage.local.set({
      aiAvailability: availability,
      settings: {
        enabled: true,
        temperature: 0.7,
        autoSummarize: false
      }
    });
  }
  
  private async checkAIAvailability(): Promise<string> {
    try {
      const capabilities = await (globalThis as any).ai?.languageModel?.capabilities();
      return capabilities?.available || 'unavailable';
    } catch (error) {
      console.error('AI availability check failed:', error);
      return 'unavailable';
    }
  }
  
  private async handleMessage(message: any, sender: chrome.runtime.MessageSender): Promise<any> {
    switch (message.type) {
      case 'CREATE_AI_SESSION':
        return await this.createAISession(message.sessionId, message.options);
        
      case 'AI_PROMPT':
        return await this.handleAIPrompt(message.sessionId, message.prompt);
        
      case 'AI_STREAM':
        return await this.handleAIStream(message.sessionId, message.prompt);
        
      case 'DESTROY_AI_SESSION':
        return this.destroyAISession(message.sessionId);
        
      case 'SUMMARIZE_PAGE':
        return await this.summarizePage(sender.tab?.id);
        
      default:
        return { error: 'Unknown message type' };
    }
  }
  
  private async createAISession(sessionId: string, options: any = {}): Promise<any> {
    try {
      const availability = await this.checkAIAvailability();
      
      if (availability !== 'readily') {
        return { error: 'AI not available', availability };
      }
      
      const session = await (globalThis as any).ai.languageModel.create({
        temperature: options.temperature || 0.7,
        topK: options.topK || 3,
        systemPrompt: options.systemPrompt
      });
      
      this.sessions.set(sessionId, session);
      
      return { success: true, sessionId };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  private async handleAIPrompt(sessionId: string, prompt: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { error: 'Session not found' };
    }
    
    try {
      const response = await session.prompt(prompt);
      return { response };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  private async handleAIStream(sessionId: string, prompt: string): Promise<any> {
    // Note: Streaming in service workers requires special handling
    // This is a simplified example
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { error: 'Session not found' };
    }
    
    try {
      // For service workers, we'll collect the full response
      const stream = session.promptStreaming(prompt);
      let fullResponse = '';
      
      for await (const chunk of stream) {
        fullResponse += chunk;
      }
      
      return { response: fullResponse };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  private destroyAISession(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.destroy();
      this.sessions.delete(sessionId);
      return { success: true };
    }
    
    return { error: 'Session not found' };
  }
  
  private async summarizePage(tabId?: number): Promise<any> {
    if (!tabId) {
      return { error: 'No tab ID provided' };
    }
    
    try {
      // Inject content script to get page content
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Extract main content from the page
          const article = document.querySelector('article') || 
                         document.querySelector('main') || 
                         document.body;
          
          return {
            title: document.title,
            content: article.textContent?.substring(0, 5000) || '',
            url: window.location.href
          };
        }
      });
      
      const pageData = result.result;
      
      // Create temporary session for summarization
      const sessionId = 'summary_' + Date.now();
      await this.createAISession(sessionId, {
        systemPrompt: 'You are a helpful assistant that creates concise summaries of web page content.'
      });
      
      const prompt = `Please summarize the following web page content:\n\nTitle: ${pageData.title}\nURL: ${pageData.url}\n\nContent: ${pageData.content}`;
      
      const result2 = await this.handleAIPrompt(sessionId, prompt);
      
      // Clean up
      this.destroyAISession(sessionId);
      
      return { summary: result2.response, pageData };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Content script AI integration
class AIContentScript {
  private sessionId: string;
  
  constructor() {
    this.sessionId = 'content_' + Date.now();
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    // Create AI session via background script
    const response = await chrome.runtime.sendMessage({
      type: 'CREATE_AI_SESSION',
      sessionId: this.sessionId,
      options: {
        temperature: 0.8,
        systemPrompt: 'You are an AI assistant integrated into a web page. Help users with content-related tasks.'
      }
    });
    
    if (response.error) {
      console.error('Failed to initialize AI:', response.error);
      return;
    }
    
    this.setupPageIntegration();
  }
  
  private setupPageIntegration(): void {
    // Add AI chat button to page
    this.createAIChatButton();
    
    // Add context menu for selected text
    this.setupTextSelection();
  }
  
  private createAIChatButton(): void {
    const button = document.createElement('button');
    button.textContent = '🤖 AI Assistant';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 10px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-family: system-ui;
    `;
    
    button.addEventListener('click', () => {
      this.openAIChat();
    });
    
    document.body.appendChild(button);
  }
  
  private setupTextSelection(): void {
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 10) {
        this.showTextActions(selectedText);
      }
    });
  }
  
  private showTextActions(text: string): void {
    // Remove existing action menu
    const existing = document.getElementById('ai-text-actions');
    if (existing) {
      existing.remove();
    }
    
    const menu = document.createElement('div');
    menu.id = 'ai-text-actions';
    menu.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10001;
    `;
    
    // Get selection position
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    
    if (rect) {
      menu.style.left = rect.left + 'px';
      menu.style.top = (rect.bottom + 5) + 'px';
    }
    
    // Add action buttons
    const actions = [
      { label: 'Explain', action: () => this.explainText(text) },
      { label: 'Summarize', action: () => this.summarizeText(text) },
      { label: 'Translate', action: () => this.translateText(text) }
    ];
    
    actions.forEach(({ label, action }) => {
      const button = document.createElement('button');
      button.textContent = label;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 5px 10px;
        margin: 2px 0;
        border: none;
        background: #f5f5f5;
        cursor: pointer;
      `;
      
      button.addEventListener('click', () => {
        action();
        menu.remove();
      });
      
      menu.appendChild(button);
    });
    
    document.body.appendChild(menu);
    
    // Remove menu after 5 seconds
    setTimeout(() => {
      if (menu.parentNode) {
        menu.remove();
      }
    }, 5000);
  }
  
  private async explainText(text: string): Promise<void> {
    const prompt = `Please explain this text in simple terms: "${text}"`;
    await this.showAIResponse(prompt);
  }
  
  private async summarizeText(text: string): Promise<void> {
    const prompt = `Please provide a brief summary of this text: "${text}"`;
    await this.showAIResponse(prompt);
  }
  
  private async translateText(text: string): Promise<void> {
    const prompt = `Please translate this text to English if it's in another language, or to Spanish if it's in English: "${text}"`;
    await this.showAIResponse(prompt);
  }
  
  private async showAIResponse(prompt: string): Promise<void> {
    const response = await chrome.runtime.sendMessage({
      type: 'AI_PROMPT',
      sessionId: this.sessionId,
      prompt
    });
    
    if (response.error) {
      alert('AI Error: ' + response.error);
      return;
    }
    
    // Show response in a modal
    this.showModal('AI Response', response.response);
  }
  
  private openAIChat(): void {
    // Create chat interface
    const chatContainer = this.createChatInterface();
    document.body.appendChild(chatContainer);
  }
  
  private createChatInterface(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'ai-chat-container';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 500px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      z-index: 10002;
      display: flex;
      flex-direction: column;
      font-family: system-ui;
    `;
    
    // Chat header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 15px;
      border-bottom: 1px solid #eee;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>AI Assistant</span>
      <button id="close-chat" style="border: none; background: none; font-size: 18px; cursor: pointer;">×</button>
    `;
    
    // Chat messages
    const messages = document.createElement('div');
    messages.id = 'chat-messages';
    messages.style.cssText = `
      flex: 1;
      padding: 15px;
      overflow-y: auto;
    `;
    
    // Chat input
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      padding: 15px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 10px;
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Ask me anything...';
    input.style.cssText = `
      flex: 1;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 5px;
    `;
    
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.cssText = `
      padding: 8px 15px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    `;
    
    // Event listeners
    header.querySelector('#close-chat')?.addEventListener('click', () => {
      container.remove();
    });
    
    const sendMessage = async () => {
      const message = input.value.trim();
      if (!message) return;
      
      // Add user message to chat
      this.addChatMessage(messages, 'user', message);
      input.value = '';
      
      // Get AI response
      const response = await chrome.runtime.sendMessage({
        type: 'AI_PROMPT',
        sessionId: this.sessionId,
        prompt: message
      });
      
      if (response.error) {
        this.addChatMessage(messages, 'error', 'AI Error: ' + response.error);
      } else {
        this.addChatMessage(messages, 'assistant', response.response);
      }
    };
    
    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Assemble interface
    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);
    container.appendChild(header);
    container.appendChild(messages);
    container.appendChild(inputContainer);
    
    return container;
  }
  
  private addChatMessage(container: HTMLElement, role: string, content: string): void {
    const message = document.createElement('div');
    message.style.cssText = `
      margin: 10px 0;
      padding: 10px;
      border-radius: 5px;
      ${role === 'user' ? 'background: #e3f2fd; margin-left: 20px;' : 
        role === 'error' ? 'background: #ffebee; color: #c62828;' : 
        'background: #f5f5f5; margin-right: 20px;'}
    `;
    
    const roleLabel = document.createElement('div');
    roleLabel.style.cssText = 'font-weight: bold; margin-bottom: 5px; font-size: 12px; text-transform: uppercase;';
    roleLabel.textContent = role === 'user' ? 'You' : role === 'error' ? 'Error' : 'AI Assistant';
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;
    
    message.appendChild(roleLabel);
    message.appendChild(contentDiv);
    container.appendChild(message);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }
  
  private showModal(title: string, content: string): void {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-height: 300px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      z-index: 10003;
      padding: 20px;
      font-family: system-ui;
    `;
    
    modal.innerHTML = `
      <h3 style="margin: 0 0 15px 0;">${title}</h3>
      <div style="margin-bottom: 15px; max-height: 200px; overflow-y: auto;">${content}</div>
      <button id="close-modal" style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
    `;
    
    modal.querySelector('#close-modal')?.addEventListener('click', () => {
      modal.remove();
    });
    
    document.body.appendChild(modal);
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 10000);
  }
}

// Initialize the extension components
const aiBackground = new AIExtensionBackground();

// For content script usage:
// const aiContent = new AIContentScript();

export {
  AIExtensionBackground,
  AIContentScript
};