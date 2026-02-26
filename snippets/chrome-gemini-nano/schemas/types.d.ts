// Chrome Gemini Nano TypeScript Type Definitions
// Official type definitions for Chrome's built-in AI capabilities

declare namespace ChromeAI {
  // Core AI Capabilities Interface
  interface AICapabilities {
    available: 'readily' | 'after-download' | 'no';
    defaultTemperature?: number;
    defaultTopK?: number;
    maxTopK?: number;
  }

  // Session Configuration Options
  interface AISessionConfig {
    temperature?: number;        // 0-2, controls creativity/randomness
    topK?: number;              // 1-40, controls token diversity
    systemPrompt?: string;      // System-level instructions
    signal?: AbortSignal;       // Cancellation signal
  }

  // AI Session Interface
  interface AISession {
    /**
     * Send a prompt and receive a complete response
     * @param prompt - The text prompt to send
     * @returns Promise resolving to the AI's response
     */
    prompt(prompt: string): Promise<string>;

    /**
     * Send a prompt and receive a streaming response
     * @param prompt - The text prompt to send
     * @returns AsyncIterator yielding response chunks
     */
    promptStreaming(prompt: string): AsyncIterableIterator<string>;

    /**
     * Create a new session with the same configuration
     * @returns New AI session instance
     */
    clone?(): AISession;

    /**
     * Destroy the session and free resources
     */
    destroy(): void;
  }

  // Language Model Interface
  interface AILanguageModel {
    /**
     * Check AI model availability and capabilities
     * @returns Promise resolving to capabilities object
     */
    capabilities(): Promise<AICapabilities>;

    /**
     * Create a new AI session with optional configuration
     * @param config - Session configuration options
     * @returns Promise resolving to new session
     */
    create(config?: AISessionConfig): Promise<AISession>;
  }

  // Main AI Interface
  interface AI {
    languageModel: AILanguageModel;
  }

  // Error Types
  interface AIError extends Error {
    name: 'NotSupportedError' | 'NotAllowedError' | 'InvalidStateError' | 
          'AbortError' | 'QuotaExceededError' | 'NetworkError';
    message: string;
    code?: number;
  }

  // Configuration Presets
  interface ConfigPresets {
    creative: AISessionConfig;
    analytical: AISessionConfig;
    technical: AISessionConfig;
    conversational: AISessionConfig;
    educational: AISessionConfig;
    summarization: AISessionConfig;
  }

  // Performance Metrics
  interface PerformanceMetrics {
    responseTime: number;
    tokensPerSecond: number;
    memoryUsage: number;
    sessionCount: number;
    errorRate: number;
    averageRequestSize: number;
  }

  // Browser Support Detection
  interface BrowserSupport {
    hasAI: boolean;
    hasLanguageModel: boolean;
    chromeVersion?: string;
    platform?: string;
    deviceMemory?: number;
    hardwareConcurrency?: number;
  }
}

// Global Window Interface Extension
declare global {
  interface Window {
    ai?: ChromeAI.AI;
  }
}

// Utility Types for Chrome Extensions
declare namespace ChromeExtensionAI {
  // Message Types for Chrome Extension Communication
  interface AIMessage {
    type: 'AI_PROMPT' | 'AI_STREAM' | 'CREATE_SESSION' | 'DESTROY_SESSION' | 
          'CHECK_AVAILABILITY' | 'SUMMARIZE_PAGE';
    sessionId?: string;
    prompt?: string;
    config?: ChromeAI.AISessionConfig;
    data?: any;
  }

  // Response Types
  interface AIResponse {
    success: boolean;
    response?: string;
    error?: string;
    availability?: string;
    sessionId?: string;
  }

  // Extension Background Script AI Handler
  interface BackgroundAIHandler {
    handleMessage(
      message: AIMessage, 
      sender: chrome.runtime.MessageSender
    ): Promise<AIResponse>;
  }

  // Content Script AI Integration
  interface ContentScriptAI {
    enhancePageWithAI(): Promise<void>;
    summarizeSelection(): Promise<string>;
    translateText(text: string): Promise<string>;
  }
}

// React Hook Types (for React applications)
declare namespace ReactAI {
  interface UseAIOptions {
    config?: ChromeAI.AISessionConfig;
    autoCreate?: boolean;
    fallback?: (prompt: string) => Promise<string>;
  }

  interface UseAIReturn {
    prompt: (text: string) => Promise<string>;
    promptStreaming: (text: string) => AsyncIterableIterator<string>;
    isAvailable: boolean;
    isLoading: boolean;
    error: Error | null;
    session: ChromeAI.AISession | null;
  }

  interface UseStreamingAIReturn {
    start: (prompt: string) => void;
    stop: () => void;
    chunks: string[];
    fullResponse: string;
    isStreaming: boolean;
    error: Error | null;
  }
}

// Testing Utilities Types
declare namespace TestingAI {
  interface MockAICapabilities extends ChromeAI.AICapabilities {
    mockDelay?: number;
    mockResponses?: Map<string, string>;
    mockErrors?: Map<string, Error>;
  }

  interface MockAISession extends ChromeAI.AISession {
    setResponse(prompt: string, response: string): void;
    setError(prompt: string, error: Error): void;
    getCallHistory(): Array<{ prompt: string; timestamp: number }>;
  }

  interface AITestUtils {
    setupMockAI(): void;
    teardownMockAI(): void;
    configureMockResponse(prompt: string, response: string): void;
    configureMockError(prompt: string, error: Error): void;
    waitFor(condition: () => boolean, timeout?: number): Promise<void>;
    measureResponseTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }>;
  }
}

export {
  ChromeAI,
  ChromeExtensionAI,
  ReactAI,
  TestingAI
};