// Chrome Gemini Nano - Error Handling and Resilience Examples
// Comprehensive error handling patterns for Chrome AI integration

// Error types and handling
enum AIErrorType {
  NOT_AVAILABLE = 'not_available',
  DOWNLOAD_REQUIRED = 'download_required',
  DOWNLOAD_FAILED = 'download_failed',
  SESSION_EXPIRED = 'session_expired',
  QUOTA_EXCEEDED = 'quota_exceeded',
  INVALID_INPUT = 'invalid_input',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown'
}

interface AIError {
  type: AIErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
}

class AIErrorHandler {
  private retryCount: Map<string, number> = new Map();
  private maxRetries = 3;
  
  handleError(error: any, context: string): AIError {
    const aiError: AIError = {
      type: this.categorizeError(error),
      message: this.getErrorMessage(error),
      originalError: error,
      retryable: this.isRetryable(error)
    };
    
    console.error(`AI Error in ${context}:`, aiError);
    
    return aiError;
  }
  
  private categorizeError(error: any): AIErrorType {
    if (!error) return AIErrorType.UNKNOWN;
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('not available') || message.includes('unavailable')) {
      return AIErrorType.NOT_AVAILABLE;
    }
    
    if (message.includes('download') && message.includes('required')) {
      return AIErrorType.DOWNLOAD_REQUIRED;
    }
    
    if (message.includes('download') && message.includes('failed')) {
      return AIErrorType.DOWNLOAD_FAILED;
    }
    
    if (message.includes('session') && (message.includes('expired') || message.includes('invalid'))) {
      return AIErrorType.SESSION_EXPIRED;
    }
    
    if (message.includes('quota') || message.includes('rate limit')) {
      return AIErrorType.QUOTA_EXCEEDED;
    }
    
    if (message.includes('invalid') && message.includes('input')) {
      return AIErrorType.INVALID_INPUT;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return AIErrorType.NETWORK_ERROR;
    }
    
    return AIErrorType.UNKNOWN;
  }
  
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.toString) return error.toString();
    return 'Unknown error occurred';
  }
  
  private isRetryable(error: any): boolean {
    const nonRetryableTypes = [
      AIErrorType.NOT_AVAILABLE,
      AIErrorType.INVALID_INPUT
    ];
    
    const errorType = this.categorizeError(error);
    return !nonRetryableTypes.includes(errorType);
  }
  
  async shouldRetry(operation: string, error: AIError): Promise<boolean> {
    if (!error.retryable) return false;
    
    const currentRetries = this.retryCount.get(operation) || 0;
    if (currentRetries >= this.maxRetries) {
      this.retryCount.delete(operation);
      return false;
    }
    
    this.retryCount.set(operation, currentRetries + 1);
    
    // Exponential backoff
    const delay = Math.pow(2, currentRetries) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return true;
  }
}

// Resilient AI session manager
class ResilientAISession {
  private session: any = null;
  private errorHandler = new AIErrorHandler();
  private sessionOptions: any;
  private isInitializing = false;
  
  constructor(options: any = {}) {
    this.sessionOptions = {
      temperature: 0.7,
      topK: 3,
      ...options
    };
  }
  
  async ensureSession(): Promise<boolean> {
    if (this.session) return true;
    
    if (this.isInitializing) {
      // Wait for ongoing initialization
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return !!this.session;
    }
    
    this.isInitializing = true;
    
    try {
      await this.initializeSession();
      return true;
    } catch (error) {
      const aiError = this.errorHandler.handleError(error, 'session_initialization');
      await this.handleInitializationError(aiError);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }
  
  private async initializeSession(): Promise<void> {
    // Check availability first
    const availability = await this.checkAvailability();
    
    if (availability === 'not-available') {
      throw new Error('AI not available on this device');
    }
    
    if (availability === 'after-download') {
      await this.handleDownload();
    }
    
    // Create session
    this.session = await (window as any).ai.languageModel.create(this.sessionOptions);
  }
  
  private async checkAvailability(): Promise<string> {
    try {
      const capabilities = await (window as any).ai?.languageModel?.capabilities();
      return capabilities?.available || 'not-available';
    } catch (error) {
      throw new Error('Failed to check AI availability: ' + error.message);
    }
  }
  
  private async handleDownload(): Promise<void> {
    console.log('AI model download required, starting download...');
    
    // Note: In practice, you might want to show a progress indicator
    // and handle download events
    const startTime = Date.now();
    const timeout = 300000; // 5 minutes
    
    while (Date.now() - startTime < timeout) {
      const availability = await this.checkAvailability();
      
      if (availability === 'readily') {
        console.log('AI model download completed');
        return;
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('AI model download timeout');
  }
  
  private async handleInitializationError(error: AIError): Promise<void> {
    switch (error.type) {
      case AIErrorType.NOT_AVAILABLE:
        console.warn('AI not available, app will run without AI features');
        break;
        
      case AIErrorType.DOWNLOAD_FAILED:
        console.error('AI model download failed, retrying later');
        // Could implement retry logic here
        break;
        
      case AIErrorType.NETWORK_ERROR:
        console.error('Network error during AI initialization');
        break;
        
      default:
        console.error('Unexpected error during AI initialization:', error);
    }
  }
  
  async prompt(text: string): Promise<string> {
    const operation = `prompt_${Date.now()}`;
    
    while (true) {
      try {
        if (!(await this.ensureSession())) {
          throw new Error('Failed to initialize AI session');
        }
        
        const response = await this.session.prompt(text);
        
        // Reset retry count on success
        this.errorHandler['retryCount'].delete(operation);
        
        return response;
      } catch (error) {
        const aiError = this.errorHandler.handleError(error, 'prompt');
        
        if (aiError.type === AIErrorType.SESSION_EXPIRED) {
          // Recreate session and retry
          this.session = null;
          continue;
        }
        
        const shouldRetry = await this.errorHandler.shouldRetry(operation, aiError);
        
        if (!shouldRetry) {
          throw new Error(`AI prompt failed: ${aiError.message}`);
        }
        
        console.log(`Retrying prompt operation: ${operation}`);
      }
    }
  }
  
  async *promptStreaming(text: string): AsyncGenerator<string, void, unknown> {
    const operation = `stream_${Date.now()}`;
    
    while (true) {
      try {
        if (!(await this.ensureSession())) {
          throw new Error('Failed to initialize AI session');
        }
        
        const stream = this.session.promptStreaming(text);
        
        for await (const chunk of stream) {
          yield chunk;
        }
        
        // Reset retry count on success
        this.errorHandler['retryCount'].delete(operation);
        return;
        
      } catch (error) {
        const aiError = this.errorHandler.handleError(error, 'streaming');
        
        if (aiError.type === AIErrorType.SESSION_EXPIRED) {
          // Recreate session and retry
          this.session = null;
          continue;
        }
        
        const shouldRetry = await this.errorHandler.shouldRetry(operation, aiError);
        
        if (!shouldRetry) {
          throw new Error(`AI streaming failed: ${aiError.message}`);
        }
        
        console.log(`Retrying streaming operation: ${operation}`);
      }
    }
  }
  
  destroy(): void {
    if (this.session) {
      try {
        this.session.destroy();
      } catch (error) {
        console.warn('Error destroying AI session:', error);
      }
      this.session = null;
    }
  }
}

// Fallback AI service for when Chrome AI is unavailable
class FallbackAIService {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/api/ai') {
    this.baseUrl = baseUrl;
  }
  
  async prompt(text: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: text })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      throw new Error(`Fallback AI service error: ${error.message}`);
    }
  }
  
  async *promptStreaming(text: string): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: text })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body not readable');
      }
      
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        yield chunk;
      }
    } catch (error) {
      throw new Error(`Fallback AI streaming error: ${error.message}`);
    }
  }
}

// Universal AI service with fallback
class UniversalAIService {
  private primaryService: ResilientAISession;
  private fallbackService: FallbackAIService;
  private useBuiltInAI: boolean = false;
  
  constructor(fallbackUrl?: string) {
    this.primaryService = new ResilientAISession();
    this.fallbackService = new FallbackAIService(fallbackUrl);
  }
  
  async initialize(): Promise<void> {
    try {
      // Check if built-in AI is available
      const hasAI = !!(window as any).ai?.languageModel;
      
      if (hasAI) {
        const availability = await (window as any).ai.languageModel.capabilities();
        this.useBuiltInAI = availability?.available === 'readily' || availability?.available === 'after-download';
      }
      
      console.log(`Using ${this.useBuiltInAI ? 'built-in' : 'fallback'} AI service`);
    } catch (error) {
      console.warn('Failed to check built-in AI availability:', error);
      this.useBuiltInAI = false;
    }
  }
  
  async prompt(text: string): Promise<string> {
    if (this.useBuiltInAI) {
      try {
        return await this.primaryService.prompt(text);
      } catch (error) {
        console.warn('Built-in AI failed, falling back to server:', error);
        this.useBuiltInAI = false;
      }
    }
    
    return await this.fallbackService.prompt(text);
  }
  
  async *promptStreaming(text: string): AsyncGenerator<string, void, unknown> {
    if (this.useBuiltInAI) {
      try {
        yield* this.primaryService.promptStreaming(text);
        return;
      } catch (error) {
        console.warn('Built-in AI streaming failed, falling back to server:', error);
        this.useBuiltInAI = false;
      }
    }
    
    yield* this.fallbackService.promptStreaming(text);
  }
  
  destroy(): void {
    this.primaryService.destroy();
  }
}

// Usage examples
async function demonstrateErrorHandling(): Promise<void> {
  const aiService = new UniversalAIService();
  
  try {
    await aiService.initialize();
    
    const response = await aiService.prompt('Hello, how are you?');
    console.log('AI Response:', response);
    
    // Streaming example
    console.log('Streaming response:');
    for await (const chunk of aiService.promptStreaming('Tell me a story')) {
      process.stdout.write(chunk);
    }
    
  } catch (error) {
    console.error('AI service error:', error);
  } finally {
    aiService.destroy();
  }
}

export {
  AIErrorType,
  AIErrorHandler,
  ResilientAISession,
  FallbackAIService,
  UniversalAIService,
  demonstrateErrorHandling
};