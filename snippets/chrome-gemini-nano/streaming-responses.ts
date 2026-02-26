// Chrome Gemini Nano - Streaming Response Examples
// Streaming API usage patterns for real-time responses

// Basic streaming example
async function basicStreaming(): Promise<void> {
  try {
    const session = await (window as any).ai.languageModel.create();
    
    const stream = session.promptStreaming('Write a short story about space exploration');
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      console.log('Chunk received:', chunk);
      fullResponse += chunk;
      
      // Update UI with incremental response
      updateUI(chunk);
    }
    
    console.log('Complete response:', fullResponse);
    session.destroy();
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

// Streaming with progress tracking
async function streamingWithProgress(): Promise<void> {
  const session = await (window as any).ai.languageModel.create();
  
  const prompt = 'Explain the history of artificial intelligence in detail';
  const stream = session.promptStreaming(prompt);
  
  let chunkCount = 0;
  let totalLength = 0;
  
  for await (const chunk of stream) {
    chunkCount++;
    totalLength += chunk.length;
    
    // Update progress
    updateProgress({
      chunks: chunkCount,
      totalLength,
      latestChunk: chunk
    });
    
    // Optional: Add artificial delay for better UX
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  session.destroy();
}

// Streaming with cancellation support
class CancellableStream {
  private abortController: AbortController;
  private session: any;
  
  constructor() {
    this.abortController = new AbortController();
  }
  
  async startStreaming(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      this.session = await (window as any).ai.languageModel.create({
        signal: this.abortController.signal
      });
      
      const stream = this.session.promptStreaming(prompt);
      
      for await (const chunk of stream) {
        if (this.abortController.signal.aborted) {
          break;
        }
        
        onChunk(chunk);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Streaming cancelled');
      } else {
        console.error('Streaming error:', error);
      }
    } finally {
      this.cleanup();
    }
  }
  
  cancel(): void {
    this.abortController.abort();
  }
  
  private cleanup(): void {
    if (this.session) {
      this.session.destroy();
    }
  }
}

// Real-time chat interface
class AIChat {
  private session: any;
  private conversationHistory: Array<{role: string, content: string}> = [];
  
  async initialize(): Promise<void> {
    this.session = await (window as any).ai.languageModel.create({
      temperature: 0.7,
      topK: 5,
      systemPrompt: 'You are a helpful assistant. Keep responses concise and helpful.'
    });
  }
  
  async sendMessage(message: string, onChunk: (chunk: string) => void): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: message });
    
    // Create context-aware prompt
    const contextPrompt = this.buildContextPrompt(message);
    
    const stream = this.session.promptStreaming(contextPrompt);
    let fullResponse = '';
    
    for await (const chunk of stream) {
      fullResponse += chunk;
      onChunk(chunk);
    }
    
    // Add assistant response to history
    this.conversationHistory.push({ role: 'assistant', content: fullResponse });
    
    return fullResponse;
  }
  
  private buildContextPrompt(newMessage: string): string {
    const context = this.conversationHistory
      .slice(-6) // Keep last 6 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    return context ? `${context}\nuser: ${newMessage}` : newMessage;
  }
  
  destroy(): void {
    if (this.session) {
      this.session.destroy();
    }
  }
}

// Streaming with error handling and retry
async function robustStreaming(prompt: string, maxRetries = 3): Promise<string> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const session = await (window as any).ai.languageModel.create();
      const stream = session.promptStreaming(prompt);
      
      let response = '';
      
      for await (const chunk of stream) {
        response += chunk;
      }
      
      session.destroy();
      return response;
      
    } catch (error) {
      attempt++;
      console.error(`Streaming attempt ${attempt} failed:`, error);
      
      if (attempt >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Helper functions (would be implemented based on your UI framework)
function updateUI(chunk: string): void {
  // Implementation depends on your UI framework
  console.log('UI Update:', chunk);
}

function updateProgress(progress: {chunks: number, totalLength: number, latestChunk: string}): void {
  console.log('Progress:', progress);
}

// Export for module usage
export {
  basicStreaming,
  streamingWithProgress,
  CancellableStream,
  AIChat,
  robustStreaming
};