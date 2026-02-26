// Chrome Gemini Nano - Configuration Examples
// Configuration patterns and session management

// Configuration interface
interface GeminiNanoConfig {
  temperature?: number;        // Creativity/randomness (0-2)
  topK?: number;              // Number of top tokens to consider (1-40)
  systemPrompt?: string;      // System-level instructions
  signal?: AbortSignal;       // Cancellation signal
  maxTokens?: number;         // Maximum response length
  timeout?: number;           // Request timeout in ms
}

// Default configurations for different use cases
const ConfigPresets = {
  // Creative writing and brainstorming
  creative: {
    temperature: 1.5,
    topK: 8,
    systemPrompt: 'You are a creative writing assistant. Be imaginative and original.'
  },
  
  // Factual and analytical tasks
  analytical: {
    temperature: 0.3,
    topK: 3,
    systemPrompt: 'You are a precise analytical assistant. Provide accurate, well-reasoned responses.'
  },
  
  // Code generation and technical tasks
  technical: {
    temperature: 0.5,
    topK: 5,
    systemPrompt: 'You are a senior software engineer. Provide clean, efficient, and well-documented code.'
  },
  
  // Casual conversation
  conversational: {
    temperature: 0.8,
    topK: 6,
    systemPrompt: 'You are a friendly, helpful assistant. Be conversational and engaging.'
  },
  
  // Educational and explanatory content
  educational: {
    temperature: 0.6,
    topK: 4,
    systemPrompt: 'You are an expert teacher. Explain concepts clearly with examples and analogies.'
  },
  
  // Summary and content processing
  summarization: {
    temperature: 0.4,
    topK: 3,
    systemPrompt: 'You are a skilled editor. Create concise, accurate summaries that capture key points.'
  }
};

// Configuration manager
class ConfigManager {
  private configs: Map<string, GeminiNanoConfig> = new Map();
  private defaultConfig: GeminiNanoConfig = {
    temperature: 0.7,
    topK: 3,
    timeout: 30000
  };
  
  constructor() {
    this.loadPresets();
  }
  
  private loadPresets(): void {
    Object.entries(ConfigPresets).forEach(([name, config]) => {
      this.configs.set(name, { ...this.defaultConfig, ...config });
    });
  }
  
  getConfig(name: string): GeminiNanoConfig {
    return this.configs.get(name) || this.defaultConfig;
  }
  
  setConfig(name: string, config: GeminiNanoConfig): void {
    this.configs.set(name, { ...this.defaultConfig, ...config });
  }
  
  createCustomConfig(baseConfig: string, overrides: Partial<GeminiNanoConfig>): GeminiNanoConfig {
    const base = this.getConfig(baseConfig);
    return { ...base, ...overrides };
  }
  
  // Temperature helpers
  static getTemperatureForTask(task: 'creative' | 'factual' | 'mixed'): number {
    switch (task) {
      case 'creative': return 1.2;
      case 'factual': return 0.3;
      case 'mixed': return 0.7;
      default: return 0.7;
    }
  }
  
  // TopK helpers
  static getTopKForComplexity(complexity: 'simple' | 'moderate' | 'complex'): number {
    switch (complexity) {
      case 'simple': return 2;
      case 'moderate': return 4;
      case 'complex': return 8;
      default: return 3;
    }
  }
}

// Session configuration and management
class SessionManager {
  private sessions: Map<string, any> = new Map();
  private configManager = new ConfigManager();
  
  async createSession(id: string, configName: string, customConfig?: Partial<GeminiNanoConfig>): Promise<any> {
    try {
      // Get base configuration
      const baseConfig = this.configManager.getConfig(configName);
      
      // Apply custom overrides
      const finalConfig = customConfig ? { ...baseConfig, ...customConfig } : baseConfig;
      
      // Validate configuration
      this.validateConfig(finalConfig);
      
      // Create session
      const session = await (window as any).ai.languageModel.create(finalConfig);
      
      // Store session with metadata
      this.sessions.set(id, {
        session,
        config: finalConfig,
        createdAt: Date.now(),
        usageCount: 0
      });
      
      console.log(`Session ${id} created with config:`, finalConfig);
      
      return session;
    } catch (error) {
      console.error(`Failed to create session ${id}:`, error);
      throw error;
    }
  }
  
  getSession(id: string): any {
    const sessionData = this.sessions.get(id);
    return sessionData?.session;
  }
  
  getSessionMetadata(id: string): any {
    return this.sessions.get(id);
  }
  
  updateSessionUsage(id: string): void {
    const sessionData = this.sessions.get(id);
    if (sessionData) {
      sessionData.usageCount++;
    }
  }
  
  async recreateSession(id: string): Promise<any> {
    const sessionData = this.sessions.get(id);
    if (!sessionData) {
      throw new Error(`Session ${id} not found`);
    }
    
    // Destroy old session
    this.destroySession(id);
    
    // Create new session with same config
    const newSession = await (window as any).ai.languageModel.create(sessionData.config);
    
    // Update session data
    this.sessions.set(id, {
      session: newSession,
      config: sessionData.config,
      createdAt: Date.now(),
      usageCount: 0
    });
    
    return newSession;
  }
  
  destroySession(id: string): void {
    const sessionData = this.sessions.get(id);
    if (sessionData) {
      try {
        sessionData.session.destroy();
      } catch (error) {
        console.warn(`Error destroying session ${id}:`, error);
      }
      this.sessions.delete(id);
    }
  }
  
  destroyAllSessions(): void {
    for (const id of this.sessions.keys()) {
      this.destroySession(id);
    }
  }
  
  listSessions(): Array<{id: string, metadata: any}> {
    return Array.from(this.sessions.entries()).map(([id, metadata]) => ({
      id,
      metadata: {
        config: metadata.config,
        createdAt: metadata.createdAt,
        usageCount: metadata.usageCount
      }
    }));
  }
  
  private validateConfig(config: GeminiNanoConfig): void {
    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        throw new Error('Temperature must be between 0 and 2');
      }
    }
    
    if (config.topK !== undefined) {
      if (config.topK < 1 || config.topK > 40) {
        throw new Error('TopK must be between 1 and 40');
      }
    }
    
    if (config.timeout !== undefined) {
      if (config.timeout < 1000 || config.timeout > 300000) {
        throw new Error('Timeout must be between 1 second and 5 minutes');
      }
    }
  }
}

// Dynamic configuration based on context
class ContextualConfigGenerator {
  static forContentType(contentType: string): GeminiNanoConfig {
    switch (contentType.toLowerCase()) {
      case 'code':
      case 'programming':
        return ConfigPresets.technical;
        
      case 'story':
      case 'creative':
      case 'fiction':
        return ConfigPresets.creative;
        
      case 'analysis':
      case 'research':
      case 'report':
        return ConfigPresets.analytical;
        
      case 'summary':
      case 'tldr':
        return ConfigPresets.summarization;
        
      case 'tutorial':
      case 'explanation':
      case 'education':
        return ConfigPresets.educational;
        
      default:
        return ConfigPresets.conversational;
    }
  }
  
  static forUserExperience(isExperienced: boolean): GeminiNanoConfig {
    return {
      temperature: isExperienced ? 0.6 : 0.8,
      topK: isExperienced ? 4 : 6,
      systemPrompt: isExperienced 
        ? 'Provide detailed, technical responses assuming advanced knowledge.'
        : 'Explain concepts clearly and provide helpful context for beginners.'
    };
  }
  
  static forResponseLength(length: 'short' | 'medium' | 'long'): GeminiNanoConfig {
    const prompts = {
      short: 'Keep responses concise and to the point.',
      medium: 'Provide balanced responses with good detail.',
      long: 'Give comprehensive, detailed responses with examples.'
    };
    
    return {
      systemPrompt: prompts[length],
      temperature: length === 'short' ? 0.5 : 0.7
    };
  }
  
  static forEmergency(): GeminiNanoConfig {
    return {
      temperature: 0.2,
      topK: 2,
      timeout: 10000,
      systemPrompt: 'Provide immediate, actionable emergency assistance. Be clear and direct.'
    };
  }
}

// Configuration persistence
class ConfigPersistence {
  private storageKey = 'gemini_nano_configs';
  
  async saveConfig(name: string, config: GeminiNanoConfig): Promise<void> {
    try {
      const configs = await this.loadConfigs();
      configs[name] = config;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(configs));
      } else if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [this.storageKey]: configs });
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }
  
  async loadConfigs(): Promise<Record<string, GeminiNanoConfig>> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {};
      } else if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(this.storageKey);
        return result[this.storageKey] || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to load configs:', error);
      return {};
    }
  }
  
  async deleteConfig(name: string): Promise<void> {
    try {
      const configs = await this.loadConfigs();
      delete configs[name];
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(configs));
      } else if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [this.storageKey]: configs });
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  }
}

// Configuration testing and validation
class ConfigTester {
  async testConfiguration(config: GeminiNanoConfig): Promise<{
    success: boolean;
    responseTime: number;
    responseQuality: 'good' | 'fair' | 'poor';
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const session = await (window as any).ai.languageModel.create(config);
      
      const testPrompt = 'Hello, please respond with exactly three words.';
      const response = await session.prompt(testPrompt);
      
      session.destroy();
      
      const responseTime = Date.now() - startTime;
      const wordCount = response.trim().split(/\s+/).length;
      
      // Evaluate response quality based on how well it followed instructions
      const responseQuality = wordCount === 3 ? 'good' : 
                            wordCount >= 2 && wordCount <= 5 ? 'fair' : 'poor';
      
      return {
        success: true,
        responseTime,
        responseQuality
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        responseQuality: 'poor',
        error: error.message
      };
    }
  }
  
  async optimizeConfig(baseConfig: GeminiNanoConfig, targetTask: string): Promise<GeminiNanoConfig> {
    const testCases = [
      { ...baseConfig, temperature: 0.3 },
      { ...baseConfig, temperature: 0.7 },
      { ...baseConfig, temperature: 1.1 },
    ];
    
    let bestConfig = baseConfig;
    let bestScore = 0;
    
    for (const config of testCases) {
      const result = await this.testConfiguration(config);
      
      if (result.success) {
        // Score based on response time and quality
        const timeScore = Math.max(0, 5000 - result.responseTime) / 5000;
        const qualityScore = result.responseQuality === 'good' ? 1 : 
                           result.responseQuality === 'fair' ? 0.5 : 0;
        
        const totalScore = timeScore * 0.3 + qualityScore * 0.7;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestConfig = config;
        }
      }
    }
    
    return bestConfig;
  }
}

// Usage examples
async function demonstrateConfiguration(): Promise<void> {
  const sessionManager = new SessionManager();
  const configPersistence = new ConfigPersistence();
  const configTester = new ConfigTester();
  
  try {
    // Create different types of sessions
    await sessionManager.createSession('creative-session', 'creative');
    await sessionManager.createSession('tech-session', 'technical');
    
    // Create custom configuration
    const customConfig = ContextualConfigGenerator.forContentType('code');
    await sessionManager.createSession('custom-session', 'technical', customConfig);
    
    // Test configuration
    const testResult = await configTester.testConfiguration(ConfigPresets.analytical);
    console.log('Config test result:', testResult);
    
    // Save custom configuration
    await configPersistence.saveConfig('my-custom-config', customConfig);
    
    // List all sessions
    console.log('Active sessions:', sessionManager.listSessions());
    
  } catch (error) {
    console.error('Configuration demo error:', error);
  } finally {
    sessionManager.destroyAllSessions();
  }
}

export {
  GeminiNanoConfig,
  ConfigPresets,
  ConfigManager,
  SessionManager,
  ContextualConfigGenerator,
  ConfigPersistence,
  ConfigTester,
  demonstrateConfiguration
};