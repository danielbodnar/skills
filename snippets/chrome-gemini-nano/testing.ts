// Chrome Gemini Nano - Testing Examples
// Testing patterns and utilities for Chrome AI integration

import { test, expect, describe, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";

// Mock implementation for testing environments without Chrome AI
class MockGeminiNano {
  private static instance: MockGeminiNano;
  private configs: Map<string, any> = new Map();
  private responses: Map<string, string> = new Map();
  private errors: Map<string, Error> = new Map();
  private delay = 100;
  
  static getInstance(): MockGeminiNano {
    if (!this.instance) {
      this.instance = new MockGeminiNano();
    }
    return this.instance;
  }
  
  setResponse(prompt: string, response: string): void {
    this.responses.set(prompt, response);
  }
  
  setError(prompt: string, error: Error): void {
    this.errors.set(prompt, error);
  }
  
  setDelay(delay: number): void {
    this.delay = delay;
  }
  
  async capabilities(): Promise<{ available: string }> {
    return { available: 'readily' };
  }
  
  async create(config: any): Promise<MockAISession> {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate initialization delay
    return new MockAISession(this, config);
  }
}

class MockAISession {
  private gemini: MockGeminiNano;
  private config: any;
  private destroyed = false;
  
  constructor(gemini: MockGeminiNano, config: any) {
    this.gemini = gemini;
    this.config = config;
  }
  
  async prompt(text: string): Promise<string> {
    if (this.destroyed) {
      throw new Error('Session has been destroyed');
    }
    
    // Check for configured error
    const error = this.gemini['errors'].get(text);
    if (error) {
      throw error;
    }
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, this.gemini['delay']));
    
    // Return configured response or default
    const response = this.gemini['responses'].get(text) || `Mock response to: ${text}`;
    
    // Apply temperature effect (simplified)
    if (this.config.temperature > 1.0) {
      return response + ' (creative variation)';
    } else if (this.config.temperature < 0.5) {
      return response + ' (precise)';
    }
    
    return response;
  }
  
  async *promptStreaming(text: string): AsyncGenerator<string, void, unknown> {
    if (this.destroyed) {
      throw new Error('Session has been destroyed');
    }
    
    const response = await this.prompt(text);
    const chunks = response.split(' ');
    
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 50));
      yield chunk + ' ';
    }
  }
  
  destroy(): void {
    this.destroyed = true;
  }
}

// Test utilities
class AITestUtils {
  static setupMockAI(): void {
    const mock = MockGeminiNano.getInstance();
    
    // Setup global mock
    (global as any).window = {
      ai: {
        languageModel: {
          capabilities: () => mock.capabilities(),
          create: (config: any) => mock.create(config)
        }
      }
    };
  }
  
  static teardownMockAI(): void {
    delete (global as any).window;
  }
  
  static configureMockResponse(prompt: string, response: string): void {
    MockGeminiNano.getInstance().setResponse(prompt, response);
  }
  
  static configureMockError(prompt: string, error: Error): void {
    MockGeminiNano.getInstance().setError(prompt, error);
  }
  
  static setMockDelay(delay: number): void {
    MockGeminiNano.getInstance().setDelay(delay);
  }
  
  static async waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
    const start = Date.now();
    
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!condition()) {
      throw new Error('Timeout waiting for condition');
    }
  }
  
  static measureResponseTime(fn: () => Promise<any>): Promise<{ result: any; time: number }> {
    return new Promise(async (resolve, reject) => {
      const start = performance.now();
      
      try {
        const result = await fn();
        const time = performance.now() - start;
        resolve({ result, time });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  static async testWithTimeout<T>(
    fn: () => Promise<T>, 
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      )
    ]);
  }
}

// Test example: Basic AI functionality
describe('Chrome Gemini Nano Basic Tests', () => {
  beforeAll(() => {
    AITestUtils.setupMockAI();
  });
  
  afterAll(() => {
    AITestUtils.teardownMockAI();
  });
  
  beforeEach(() => {
    // Reset mock state
    const mock = MockGeminiNano.getInstance();
    mock['responses'].clear();
    mock['errors'].clear();
    mock.setDelay(100);
  });
  
  test('should check AI availability', async () => {
    const capabilities = await (window as any).ai.languageModel.capabilities();
    
    expect(capabilities).toBeDefined();
    expect(capabilities.available).toBe('readily');
  });
  
  test('should create AI session with config', async () => {
    const config = {
      temperature: 0.7,
      topK: 3,
      systemPrompt: 'You are helpful.'
    };
    
    const session = await (window as any).ai.languageModel.create(config);
    
    expect(session).toBeDefined();
    expect(typeof session.prompt).toBe('function');
    expect(typeof session.promptStreaming).toBe('function');
    expect(typeof session.destroy).toBe('function');
    
    session.destroy();
  });
  
  test('should handle basic prompting', async () => {
    AITestUtils.configureMockResponse('Hello', 'Hi there!');
    
    const session = await (window as any).ai.languageModel.create();
    const response = await session.prompt('Hello');
    
    expect(response).toBe('Hi there!');
    
    session.destroy();
  });
  
  test('should handle streaming responses', async () => {
    const session = await (window as any).ai.languageModel.create();
    const chunks: string[] = [];
    
    for await (const chunk of session.promptStreaming('Tell me a story')) {
      chunks.push(chunk);
    }
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('').trim()).toContain('story');
    
    session.destroy();
  });
  
  test('should handle errors gracefully', async () => {
    const testError = new Error('AI service unavailable');
    AITestUtils.configureMockError('error prompt', testError);
    
    const session = await (window as any).ai.languageModel.create();
    
    await expect(session.prompt('error prompt')).rejects.toThrow('AI service unavailable');
    
    session.destroy();
  });
  
  test('should handle session destruction', async () => {
    const session = await (window as any).ai.languageModel.create();
    
    session.destroy();
    
    await expect(session.prompt('test')).rejects.toThrow('Session has been destroyed');
  });
});

// Performance testing
describe('Chrome Gemini Nano Performance Tests', () => {
  beforeAll(() => {
    AITestUtils.setupMockAI();
  });
  
  afterAll(() => {
    AITestUtils.teardownMockAI();
  });
  
  test('should respond within acceptable time limits', async () => {
    AITestUtils.setMockDelay(50);
    
    const session = await (window as any).ai.languageModel.create();
    
    const { time } = await AITestUtils.measureResponseTime(async () => {
      return await session.prompt('Quick response test');
    });
    
    expect(time).toBeLessThan(1000); // Should respond within 1 second
    
    session.destroy();
  });
  
  test('should handle concurrent requests', async () => {
    const session = await (window as any).ai.languageModel.create();
    
    const promises = Array.from({ length: 5 }, (_, i) => 
      session.prompt(`Concurrent request ${i}`)
    );
    
    const responses = await Promise.all(promises);
    
    expect(responses).toHaveLength(5);
    responses.forEach((response, i) => {
      expect(response).toContain(`Concurrent request ${i}`);
    });
    
    session.destroy();
  });
  
  test('should handle timeout scenarios', async () => {
    AITestUtils.setMockDelay(2000); // 2 second delay
    
    const session = await (window as any).ai.languageModel.create();
    
    await expect(
      AITestUtils.testWithTimeout(
        () => session.prompt('Slow response test'),
        1000 // 1 second timeout
      )
    ).rejects.toThrow('Test timeout');
    
    session.destroy();
  });
});

// Integration testing with real-world scenarios
describe('Chrome Gemini Nano Integration Tests', () => {
  beforeAll(() => {
    AITestUtils.setupMockAI();
  });
  
  afterAll(() => {
    AITestUtils.teardownMockAI();
  });
  
  test('should handle chat conversation flow', async () => {
    const session = await (window as any).ai.languageModel.create({
      systemPrompt: 'You are a helpful assistant.'
    });
    
    // Configure responses for conversation
    AITestUtils.configureMockResponse('Hello', 'Hello! How can I help you?');
    AITestUtils.configureMockResponse('What is AI?', 'AI is artificial intelligence...');
    AITestUtils.configureMockResponse('Thank you', 'You\'re welcome!');
    
    const responses = [];
    
    responses.push(await session.prompt('Hello'));
    responses.push(await session.prompt('What is AI?'));
    responses.push(await session.prompt('Thank you'));
    
    expect(responses[0]).toBe('Hello! How can I help you?');
    expect(responses[1]).toBe('AI is artificial intelligence...');
    expect(responses[2]).toBe('You\'re welcome!');
    
    session.destroy();
  });
  
  test('should handle different temperature settings', async () => {
    const creativeSession = await (window as any).ai.languageModel.create({
      temperature: 1.5
    });
    
    const conservativeSession = await (window as any).ai.languageModel.create({
      temperature: 0.2
    });
    
    const prompt = 'Write a story';
    
    const creativeResponse = await creativeSession.prompt(prompt);
    const conservativeResponse = await conservativeSession.prompt(prompt);
    
    expect(creativeResponse).toContain('creative variation');
    expect(conservativeResponse).toContain('precise');
    
    creativeSession.destroy();
    conservativeSession.destroy();
  });
  
  test('should handle content summarization task', async () => {
    const session = await (window as any).ai.languageModel.create({
      systemPrompt: 'Summarize the given content concisely.'
    });
    
    const longContent = 'This is a very long article about machine learning...';
    const expectedSummary = 'Summary: Article about ML concepts and applications.';
    
    AITestUtils.configureMockResponse(
      `Summarize this: ${longContent}`,
      expectedSummary
    );
    
    const summary = await session.prompt(`Summarize this: ${longContent}`);
    
    expect(summary).toBe(expectedSummary);
    
    session.destroy();
  });
});

// Error handling and edge cases
describe('Chrome Gemini Nano Error Handling Tests', () => {
  beforeAll(() => {
    AITestUtils.setupMockAI();
  });
  
  afterAll(() => {
    AITestUtils.teardownMockAI();
  });
  
  test('should handle network errors', async () => {
    const networkError = new Error('Network request failed');
    AITestUtils.configureMockError('network test', networkError);
    
    const session = await (window as any).ai.languageModel.create();
    
    await expect(session.prompt('network test')).rejects.toThrow('Network request failed');
    
    session.destroy();
  });
  
  test('should handle quota exceeded errors', async () => {
    const quotaError = new Error('Quota exceeded, please try again later');
    AITestUtils.configureMockError('quota test', quotaError);
    
    const session = await (window as any).ai.languageModel.create();
    
    await expect(session.prompt('quota test')).rejects.toThrow('Quota exceeded');
    
    session.destroy();
  });
  
  test('should handle invalid input errors', async () => {
    const invalidError = new Error('Invalid input provided');
    AITestUtils.configureMockError('', invalidError);
    
    const session = await (window as any).ai.languageModel.create();
    
    await expect(session.prompt('')).rejects.toThrow('Invalid input provided');
    
    session.destroy();
  });
  
  test('should handle session recreation after error', async () => {
    const session1 = await (window as any).ai.languageModel.create();
    
    // Simulate session error and destruction
    session1.destroy();
    
    // Create new session
    const session2 = await (window as any).ai.languageModel.create();
    
    const response = await session2.prompt('test after recreation');
    expect(response).toContain('test after recreation');
    
    session2.destroy();
  });
});

// Utility function for running AI tests with real Chrome AI (when available)
export async function runRealAITests(): Promise<void> {
  if (typeof window === 'undefined' || !window.ai?.languageModel) {
    console.log('Chrome AI not available, skipping real AI tests');
    return;
  }
  
  console.log('Running tests with real Chrome AI...');
  
  try {
    const capabilities = await window.ai.languageModel.capabilities();
    console.log('AI Capabilities:', capabilities);
    
    if (capabilities.available === 'readily') {
      const session = await window.ai.languageModel.create({
        temperature: 0.7
      });
      
      const response = await session.prompt('Hello, this is a test');
      console.log('Real AI Response:', response);
      
      session.destroy();
    }
  } catch (error) {
    console.error('Real AI test failed:', error);
  }
}

export {
  MockGeminiNano,
  MockAISession,
  AITestUtils
};