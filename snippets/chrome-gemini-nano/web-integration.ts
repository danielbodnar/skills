// Chrome Gemini Nano - Web Integration Examples
// Patterns for integrating Chrome AI into web applications

// Progressive enhancement with feature detection
class AIEnhancedApplication {
  private aiService: any = null;
  private fallbackService: any = null;
  private isAIAvailable = false;
  
  async initialize(): Promise<void> {
    try {
      await this.detectAISupport();
      
      if (this.isAIAvailable) {
        await this.initializeAIFeatures();
        console.log('AI features enabled');
      } else {
        await this.initializeFallbackFeatures();
        console.log('Using fallback features');
      }
    } catch (error) {
      console.error('Initialization failed:', error);
      await this.initializeFallbackFeatures();
    }
  }
  
  private async detectAISupport(): Promise<void> {
    // Check browser support
    if (!window.ai?.languageModel) {
      this.isAIAvailable = false;
      return;
    }
    
    // Check AI availability
    try {
      const capabilities = await window.ai.languageModel.capabilities();
      this.isAIAvailable = capabilities.available === 'readily' || 
                          capabilities.available === 'after-download';
      
      if (capabilities.available === 'after-download') {
        await this.handleModelDownload();
      }
    } catch (error) {
      console.warn('AI detection failed:', error);
      this.isAIAvailable = false;
    }
  }
  
  private async handleModelDownload(): Promise<void> {
    // Show download progress UI
    this.showDownloadProgress();
    
    // Wait for model to become available
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10s intervals
    
    while (attempts < maxAttempts) {
      try {
        const capabilities = await window.ai.languageModel.capabilities();
        if (capabilities.available === 'readily') {
          this.hideDownloadProgress();
          return;
        }
      } catch (error) {
        console.warn('Download check failed:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }
    
    throw new Error('AI model download timeout');
  }
  
  private async initializeAIFeatures(): Promise<void> {
    this.aiService = new AIService();
    await this.aiService.initialize();
    
    // Enable AI-powered features
    this.enableSmartSearch();
    this.enableContentSummarization();
    this.enableWritingAssistance();
    this.enableCodeGeneration();
  }
  
  private async initializeFallbackFeatures(): Promise<void> {
    this.fallbackService = new FallbackService();
    await this.fallbackService.initialize();
    
    // Enable basic features without AI
    this.enableBasicSearch();
    this.enableManualSummarization();
  }
  
  private showDownloadProgress(): void {
    const progressDiv = document.createElement('div');
    progressDiv.id = 'ai-download-progress';
    progressDiv.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: white; 
                  border: 1px solid #ccc; border-radius: 5px; padding: 15px; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 10000;">
        <div>🤖 Downloading AI model...</div>
        <div style="margin-top: 10px; height: 4px; background: #f0f0f0; border-radius: 2px;">
          <div style="height: 100%; background: #4285f4; border-radius: 2px; 
                      width: 0%; animation: progress 30s linear infinite;"></div>
        </div>
        <style>
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        </style>
      </div>
    `;
    document.body.appendChild(progressDiv);
  }
  
  private hideDownloadProgress(): void {
    const progressDiv = document.getElementById('ai-download-progress');
    if (progressDiv) {
      progressDiv.remove();
    }
  }
  
  // AI-enhanced features
  private enableSmartSearch(): void {
    const searchInput = document.querySelector('#search-input') as HTMLInputElement;
    const searchResults = document.querySelector('#search-results');
    
    if (!searchInput || !searchResults) return;
    
    let debounceTimer: NodeJS.Timeout;
    
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const query = searchInput.value.trim();
        if (query.length < 3) return;
        
        try {
          const enhancedQuery = await this.aiService.enhanceSearchQuery(query);
          const results = await this.performSearch(enhancedQuery);
          this.displaySearchResults(results, searchResults);
        } catch (error) {
          console.error('Smart search failed:', error);
          // Fallback to basic search
          const results = await this.performBasicSearch(query);
          this.displaySearchResults(results, searchResults);
        }
      }, 300);
    });
  }
  
  private enableContentSummarization(): void {
    // Add summarize buttons to long content
    document.querySelectorAll('.long-content').forEach(content => {
      const button = document.createElement('button');
      button.textContent = '📝 Summarize';
      button.className = 'ai-summarize-btn';
      button.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
        background: #4285f4;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      `;
      
      button.addEventListener('click', async () => {
        try {
          button.textContent = '⏳ Summarizing...';
          button.disabled = true;
          
          const text = content.textContent || '';
          const summary = await this.aiService.summarizeContent(text);
          
          this.showSummaryModal(summary);
        } catch (error) {
          console.error('Summarization failed:', error);
          alert('Summary generation failed. Please try again.');
        } finally {
          button.textContent = '📝 Summarize';
          button.disabled = false;
        }
      });
      
      // Position relative for absolute button positioning
      content.style.position = 'relative';
      content.appendChild(button);
    });
  }
  
  private enableWritingAssistance(): void {
    document.querySelectorAll('textarea, [contenteditable]').forEach(element => {
      // Add AI writing assistance context menu
      element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showWritingAssistanceMenu(e, element as HTMLElement);
      });
    });
  }
  
  private enableCodeGeneration(): void {
    document.querySelectorAll('.code-editor, [data-language]').forEach(editor => {
      const generateButton = document.createElement('button');
      generateButton.textContent = '⚡ Generate Code';
      generateButton.className = 'ai-code-gen-btn';
      generateButton.style.cssText = `
        margin: 5px;
        padding: 5px 10px;
        background: #34a853;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      `;
      
      generateButton.addEventListener('click', async () => {
        const language = editor.getAttribute('data-language') || 'javascript';
        const prompt = window.prompt(`Describe the ${language} code you want to generate:`);
        
        if (prompt) {
          try {
            generateButton.textContent = '⏳ Generating...';
            generateButton.disabled = true;
            
            const code = await this.aiService.generateCode(prompt, language);
            
            if (editor instanceof HTMLTextAreaElement) {
              editor.value = code;
            } else {
              editor.textContent = code;
            }
          } catch (error) {
            console.error('Code generation failed:', error);
            alert('Code generation failed. Please try again.');
          } finally {
            generateButton.textContent = '⚡ Generate Code';
            generateButton.disabled = false;
          }
        }
      });
      
      editor.parentNode?.insertBefore(generateButton, editor);
    });
  }
  
  private async performSearch(query: string): Promise<any[]> {
    // Implement your search logic here
    return [];
  }
  
  private async performBasicSearch(query: string): Promise<any[]> {
    // Implement basic search fallback
    return [];
  }
  
  private displaySearchResults(results: any[], container: Element): void {
    container.innerHTML = results.map(result => `
      <div class="search-result">
        <h3>${result.title}</h3>
        <p>${result.description}</p>
        <a href="${result.url}">${result.url}</a>
      </div>
    `).join('');
  }
  
  private showSummaryModal(summary: string): void {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      max-height: 400px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      z-index: 10001;
      padding: 20px;
      overflow-y: auto;
    `;
    
    modal.innerHTML = `
      <h3 style="margin: 0 0 15px 0;">📝 AI Summary</h3>
      <div style="line-height: 1.5; margin-bottom: 15px;">${summary}</div>
      <button id="close-summary" style="padding: 8px 15px; background: #4285f4; 
              color: white; border: none; border-radius: 5px; cursor: pointer;">
        Close
      </button>
    `;
    
    modal.querySelector('#close-summary')?.addEventListener('click', () => {
      modal.remove();
    });
    
    document.body.appendChild(modal);
    
    // Auto-close after 30 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
  }
  
  private showWritingAssistanceMenu(event: MouseEvent, element: HTMLElement): void {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: absolute;
      left: ${event.pageX}px;
      top: ${event.pageY}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10002;
      min-width: 150px;
    `;
    
    const actions = [
      { label: '✏️ Improve Writing', action: 'improve' },
      { label: '📝 Make Shorter', action: 'shorten' },
      { label: '📖 Make Longer', action: 'expand' },
      { label: '🎯 Fix Grammar', action: 'grammar' },
      { label: '🔄 Rephrase', action: 'rephrase' }
    ];
    
    actions.forEach(({ label, action }) => {
      const button = document.createElement('button');
      button.textContent = label;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 10px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 14px;
      `;
      
      button.addEventListener('click', async () => {
        menu.remove();
        await this.performWritingAssistance(element, action);
      });
      
      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#f5f5f5';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'transparent';
      });
      
      menu.appendChild(button);
    });
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking elsewhere
    const removeMenu = (e: Event) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', removeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', removeMenu);
    }, 100);
  }
  
  private async performWritingAssistance(element: HTMLElement, action: string): Promise<void> {
    const text = element.textContent || '';
    if (!text.trim()) return;
    
    try {
      const improvedText = await this.aiService.improveText(text, action);
      
      if (element instanceof HTMLTextAreaElement) {
        element.value = improvedText;
      } else {
        element.textContent = improvedText;
      }
    } catch (error) {
      console.error('Writing assistance failed:', error);
      alert('Writing assistance failed. Please try again.');
    }
  }
  
  // Fallback features
  private enableBasicSearch(): void {
    console.log('Basic search enabled (no AI)');
  }
  
  private enableManualSummarization(): void {
    console.log('Manual summarization enabled (no AI)');
  }
}

// AI Service wrapper
class AIService {
  private session: any = null;
  
  async initialize(): Promise<void> {
    this.session = await window.ai.languageModel.create({
      temperature: 0.7,
      topK: 3,
      systemPrompt: 'You are a helpful AI assistant integrated into a web application.'
    });
  }
  
  async enhanceSearchQuery(query: string): Promise<string> {
    const response = await this.session.prompt(
      `Improve this search query to be more specific and effective: "${query}". Return only the improved query.`
    );
    return response.trim();
  }
  
  async summarizeContent(text: string): Promise<string> {
    const truncatedText = text.substring(0, 3000); // Limit input size
    const response = await this.session.prompt(
      `Summarize this content in 2-3 concise sentences:\n\n${truncatedText}`
    );
    return response.trim();
  }
  
  async generateCode(description: string, language: string): Promise<string> {
    const response = await this.session.prompt(
      `Generate clean, well-commented ${language} code for: ${description}. Include only the code without explanations.`
    );
    return response.trim();
  }
  
  async improveText(text: string, action: string): Promise<string> {
    const prompts = {
      improve: `Improve the clarity and quality of this text: "${text}"`,
      shorten: `Make this text more concise while keeping the key information: "${text}"`,
      expand: `Expand this text with more detail and context: "${text}"`,
      grammar: `Fix any grammar, spelling, and punctuation errors in this text: "${text}"`,
      rephrase: `Rephrase this text in a different way while keeping the same meaning: "${text}"`
    };
    
    const prompt = prompts[action as keyof typeof prompts] || prompts.improve;
    const response = await this.session.prompt(prompt);
    return response.trim();
  }
  
  destroy(): void {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
  }
}

// Fallback service for non-AI environments
class FallbackService {
  async initialize(): Promise<void> {
    console.log('Fallback service initialized');
  }
  
  async enhanceSearchQuery(query: string): Promise<string> {
    // Basic query enhancement without AI
    return query.trim().toLowerCase();
  }
  
  async summarizeContent(text: string): Promise<string> {
    // Simple text truncation as fallback
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 3).join('. ') + '.';
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new AIEnhancedApplication();
  await app.initialize();
});

// React Hook for AI integration (if using React)
function useChromeFallback(options: {
  config?: any;
  fallback?: (prompt: string) => Promise<string>;
} = {}) {
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [session, setSession] = React.useState<any>(null);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    async function initializeAI() {
      try {
        if (!window.ai?.languageModel) {
          setIsAvailable(false);
          return;
        }
        
        const capabilities = await window.ai.languageModel.capabilities();
        
        if (capabilities.available === 'readily') {
          const aiSession = await window.ai.languageModel.create(options.config);
          setSession(aiSession);
          setIsAvailable(true);
        } else {
          setIsAvailable(false);
        }
      } catch (err) {
        setError(err as Error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    initializeAI();
    
    return () => {
      if (session) {
        session.destroy();
      }
    };
  }, []);
  
  const prompt = React.useCallback(async (text: string): Promise<string> => {
    if (session) {
      return await session.prompt(text);
    } else if (options.fallback) {
      return await options.fallback(text);
    } else {
      throw new Error('AI not available and no fallback provided');
    }
  }, [session, options.fallback]);
  
  return {
    prompt,
    isAvailable,
    isLoading,
    error,
    session
  };
}

export {
  AIEnhancedApplication,
  AIService,
  FallbackService,
  useChromeFallback
};