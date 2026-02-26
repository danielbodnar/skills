// Real-World WebExtensions AI Examples

// 1. Smart Text Summarizer Extension
class SmartSummarizer {
  constructor() {
    this.engine = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.engine = await browser.trial.ml.createEngine({
        modelHub: "huggingface",
        taskName: "summarization",
        device: "wasm",
        quantization: "int8"
      });
      this.isInitialized = true;
      console.log("Smart Summarizer initialized");
    } catch (error) {
      console.error("Failed to initialize summarizer:", error);
      throw error;
    }
  }

  async summarizeSelectedText() {
    if (!this.isInitialized) await this.initialize();
    
    try {
      // Get selected text from current tab
      const [tab] = await browser.tabs.query({active: true, currentWindow: true});
      const results = await browser.tabs.executeScript(tab.id, {
        code: 'window.getSelection().toString()'
      });
      
      const selectedText = results[0];
      if (!selectedText || selectedText.length < 50) {
        throw new Error("Please select at least 50 characters to summarize");
      }
      
      // Perform summarization
      const summary = await browser.trial.ml.runEngine({
        args: [selectedText]
      });
      
      return {
        originalText: selectedText,
        summary: summary[0]?.summary_text || "No summary available",
        wordCount: {
          original: selectedText.split(' ').length,
          summary: summary[0]?.summary_text?.split(' ').length || 0
        }
      };
    } catch (error) {
      console.error("Summarization failed:", error);
      throw error;
    }
  }

  async summarizePageContent() {
    if (!this.isInitialized) await this.initialize();
    
    try {
      const [tab] = await browser.tabs.query({active: true, currentWindow: true});
      const results = await browser.tabs.executeScript(tab.id, {
        code: `
          // Extract main content from page
          const content = document.querySelector('main') || 
                         document.querySelector('article') || 
                         document.querySelector('.content') ||
                         document.body;
          
          const text = content.innerText || content.textContent;
          text.substring(0, 5000); // Limit to 5000 chars
        `
      });
      
      const pageText = results[0];
      if (!pageText || pageText.length < 100) {
        throw new Error("Page content is too short to summarize");
      }
      
      const summary = await browser.trial.ml.runEngine({
        args: [pageText]
      });
      
      return {
        pageTitle: tab.title,
        summary: summary[0]?.summary_text || "No summary available",
        url: tab.url
      };
    } catch (error) {
      console.error("Page summarization failed:", error);
      throw error;
    }
  }
}

// 2. Intelligent Tab Organizer
class TabOrganizer {
  constructor() {
    this.engine = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.engine = await browser.trial.ml.createEngine({
        modelHub: "mozilla",
        taskName: "summarization",
        modelId: "smart-tab-topic"
      });
      this.isInitialized = true;
      console.log("Tab Organizer initialized");
    } catch (error) {
      console.error("Failed to initialize tab organizer:", error);
      throw error;
    }
  }

  async organizeTabsByTopic() {
    if (!this.isInitialized) await this.initialize();
    
    try {
      // Get all tabs
      const tabs = await browser.tabs.query({});
      
      // Group tabs by similarity
      const tabGroups = await this.groupSimilarTabs(tabs);
      
      // Generate labels for each group
      const labeledGroups = await Promise.all(
        tabGroups.map(async (group) => {
          const label = await this.generateGroupLabel(group);
          return { label, tabs: group };
        })
      );
      
      return labeledGroups;
    } catch (error) {
      console.error("Tab organization failed:", error);
      throw error;
    }
  }

  async groupSimilarTabs(tabs) {
    // Simple grouping by domain and title similarity
    const groups = new Map();
    
    for (const tab of tabs) {
      const domain = new URL(tab.url).hostname;
      const key = domain.replace('www.', '');
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(tab);
    }
    
    return Array.from(groups.values()).filter(group => group.length > 1);
  }

  async generateGroupLabel(tabs) {
    try {
      const titles = tabs.map(tab => tab.title);
      const input = titles.length === 1 
        ? `Topic from keywords: . titles \n${titles[0]}`
        : `Topic from keywords: ${titles.join(',')}. titles: \n${titles.join('\n')}`;
      
      const result = await browser.trial.ml.runEngine({
        args: [input]
      });
      
      return result[0]?.generated_text || "Untitled Group";
    } catch (error) {
      console.error("Label generation failed:", error);
      return "Untitled Group";
    }
  }
}

// 3. Content Sentiment Analyzer
class SentimentAnalyzer {
  constructor() {
    this.engine = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.engine = await browser.trial.ml.createEngine({
        modelHub: "huggingface",
        taskName: "text-classification",
        modelId: "cardiffnlp/twitter-roberta-base-sentiment-latest"
      });
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize sentiment analyzer:", error);
      throw error;
    }
  }

  async analyzePageSentiment() {
    if (!this.isInitialized) await this.initialize();
    
    try {
      const [tab] = await browser.tabs.query({active: true, currentWindow: true});
      const results = await browser.tabs.executeScript(tab.id, {
        code: `
          // Extract text from comments, reviews, or main content
          const selectors = [
            '.comment', '.review', '.feedback',
            'article', 'main', '.content'
          ];
          
          const texts = [];
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              const text = element.textContent.trim();
              if (text.length > 50) {
                texts.push(text.substring(0, 500));
              }
            }
          }
          
          texts.slice(0, 10); // Limit to 10 texts
        `
      });
      
      const texts = results[0] || [];
      if (texts.length === 0) {
        throw new Error("No text content found to analyze");
      }
      
      // Analyze sentiment for each text
      const sentiments = await Promise.all(
        texts.map(async (text) => {
          const result = await browser.trial.ml.runEngine({
            args: [text]
          });
          return {
            text: text.substring(0, 100) + "...",
            sentiment: result[0]?.label || "UNKNOWN",
            confidence: result[0]?.score || 0
          };
        })
      );
      
      // Calculate overall sentiment
      const overallSentiment = this.calculateOverallSentiment(sentiments);
      
      return {
        pageTitle: tab.title,
        individualSentiments: sentiments,
        overallSentiment: overallSentiment,
        analysisCount: sentiments.length
      };
    } catch (error) {
      console.error("Sentiment analysis failed:", error);
      throw error;
    }
  }

  calculateOverallSentiment(sentiments) {
    const counts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
    let totalConfidence = 0;
    
    sentiments.forEach(item => {
      if (counts.hasOwnProperty(item.sentiment)) {
        counts[item.sentiment]++;
      }
      totalConfidence += item.confidence;
    });
    
    const dominant = Object.keys(counts).reduce((a, b) => 
      counts[a] > counts[b] ? a : b
    );
    
    return {
      dominant: dominant,
      distribution: counts,
      averageConfidence: totalConfidence / sentiments.length
    };
  }
}

// 4. Smart Translation Helper
class SmartTranslator {
  constructor() {
    this.engines = new Map();
    this.supportedLanguages = [
      { code: 'fr', name: 'French', model: 'Helsinki-NLP/opus-mt-en-fr' },
      { code: 'de', name: 'German', model: 'Helsinki-NLP/opus-mt-en-de' },
      { code: 'es', name: 'Spanish', model: 'Helsinki-NLP/opus-mt-en-es' },
      { code: 'it', name: 'Italian', model: 'Helsinki-NLP/opus-mt-en-it' }
    ];
  }

  async initializeEngine(targetLanguage) {
    if (this.engines.has(targetLanguage)) {
      return this.engines.get(targetLanguage);
    }
    
    const langConfig = this.supportedLanguages.find(l => l.code === targetLanguage);
    if (!langConfig) {
      throw new Error(`Language ${targetLanguage} not supported`);
    }
    
    try {
      const engine = await browser.trial.ml.createEngine({
        modelHub: "huggingface",
        taskName: "translation",
        modelId: langConfig.model
      });
      
      this.engines.set(targetLanguage, engine);
      return engine;
    } catch (error) {
      console.error(`Failed to initialize ${targetLanguage} translator:`, error);
      throw error;
    }
  }

  async translateSelectedText(targetLanguage) {
    const engine = await this.initializeEngine(targetLanguage);
    
    try {
      const [tab] = await browser.tabs.query({active: true, currentWindow: true});
      const results = await browser.tabs.executeScript(tab.id, {
        code: 'window.getSelection().toString()'
      });
      
      const selectedText = results[0];
      if (!selectedText) {
        throw new Error("Please select text to translate");
      }
      
      const translation = await browser.trial.ml.runEngine({
        args: [selectedText]
      });
      
      return {
        originalText: selectedText,
        translatedText: translation[0]?.translation_text || "Translation failed",
        targetLanguage: targetLanguage,
        languageName: this.supportedLanguages.find(l => l.code === targetLanguage)?.name
      };
    } catch (error) {
      console.error("Translation failed:", error);
      throw error;
    }
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

// 5. Complete AI-Powered Extension Example
class AIExtension {
  constructor() {
    this.summarizer = new SmartSummarizer();
    this.tabOrganizer = new TabOrganizer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.translator = new SmartTranslator();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if trialML permission is granted
      const hasPermission = await browser.permissions.contains({
        permissions: ['trialML']
      });
      
      if (!hasPermission) {
        throw new Error("trialML permission required");
      }
      
      // Initialize all components
      await Promise.all([
        this.summarizer.initialize(),
        this.tabOrganizer.initialize(),
        this.sentimentAnalyzer.initialize()
      ]);
      
      this.isInitialized = true;
      console.log("AI Extension fully initialized");
    } catch (error) {
      console.error("Extension initialization failed:", error);
      throw error;
    }
  }

  async handleContextMenu(info, tab) {
    await this.initialize();
    
    try {
      switch (info.menuItemId) {
        case 'summarize-selection':
          return await this.summarizer.summarizeSelectedText();
        case 'translate-selection':
          return await this.translator.translateSelectedText('fr');
        case 'analyze-sentiment':
          return await this.sentimentAnalyzer.analyzePageSentiment();
        case 'organize-tabs':
          return await this.tabOrganizer.organizeTabsByTopic();
        default:
          throw new Error(`Unknown action: ${info.menuItemId}`);
      }
    } catch (error) {
      console.error("Context menu action failed:", error);
      throw error;
    }
  }
}

// 6. Background Script Integration
if (typeof browser !== 'undefined') {
  const aiExtension = new AIExtension();
  
  // Create context menu items
  browser.contextMenus.create({
    id: 'summarize-selection',
    title: 'Summarize Selected Text',
    contexts: ['selection']
  });
  
  browser.contextMenus.create({
    id: 'translate-selection',
    title: 'Translate to French',
    contexts: ['selection']
  });
  
  browser.contextMenus.create({
    id: 'analyze-sentiment',
    title: 'Analyze Page Sentiment',
    contexts: ['page']
  });
  
  browser.contextMenus.create({
    id: 'organize-tabs',
    title: 'Organize Tabs by Topic',
    contexts: ['page']
  });
  
  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
      const result = await aiExtension.handleContextMenu(info, tab);
      
      // Send result to popup or content script
      await browser.tabs.sendMessage(tab.id, {
        action: 'ai-result',
        data: result
      });
    } catch (error) {
      await browser.tabs.sendMessage(tab.id, {
        action: 'ai-error',
        error: error.message
      });
    }
  });
}

// Export classes for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SmartSummarizer,
    TabOrganizer,
    SentimentAnalyzer,
    SmartTranslator,
    AIExtension
  };
}