// Claude Streaming API Examples

import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 1. Basic Streaming
export async function basicStreaming() {
  const stream = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    stream: true,
    messages: [
      {
        role: 'user',
        content: 'Write a comprehensive guide to TypeScript generics'
      }
    ]
  });

  let fullResponse = '';
  
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      const text = chunk.delta.text;
      fullResponse += text;
      process.stdout.write(text); // Stream to console
    }
  }

  return fullResponse;
}

// 2. Advanced Streaming with Event Handling
export async function advancedStreaming() {
  const stream = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    stream: true,
    messages: [
      {
        role: 'user',
        content: 'Explain how to build a real-time chat application with WebSockets'
      }
    ]
  });

  let messageId = '';
  let fullContent = '';
  let tokenCount = 0;
  const startTime = Date.now();

  for await (const chunk of stream) {
    switch (chunk.type) {
      case 'message_start':
        messageId = chunk.message.id;
        console.log(`Stream started: ${messageId}`);
        break;

      case 'content_block_delta':
        const text = chunk.delta.text;
        fullContent += text;
        tokenCount++;
        
        // Real-time processing
        process.stdout.write(text);
        
        // Emit events for real-time UI updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('claude-stream-delta', {
            detail: { text, fullContent, tokenCount }
          }));
        }
        break;

      case 'message_delta':
        if (chunk.delta.stop_reason) {
          console.log(`\nStream ended: ${chunk.delta.stop_reason}`);
        }
        break;

      case 'message_stop':
        const duration = Date.now() - startTime;
        console.log(`\nCompleted in ${duration}ms, ${tokenCount} tokens`);
        break;
    }
  }

  return {
    messageId,
    content: fullContent,
    tokenCount,
    duration: Date.now() - startTime
  };
}

// 3. Streaming with Error Handling
export async function robustStreaming() {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const stream = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        stream: true,
        messages: [
          {
            role: 'user',
            content: 'Generate a complete Node.js Express API with TypeScript'
          }
        ]
      });

      let content = '';
      const chunks: any[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
        
        if (chunk.type === 'content_block_delta') {
          content += chunk.delta.text;
        }
        
        // Handle potential errors during streaming
        if (chunk.type === 'error') {
          throw new Error(`Stream error: ${chunk.error.message}`);
        }
      }

      return { content, chunks };
    } catch (error) {
      attempt++;
      console.error(`Streaming attempt ${attempt} failed:`, error);

      if (attempt >= maxRetries) {
        throw new Error(`Streaming failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}

// 4. React Hook for Streaming
export function useClaudeStreaming() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startStream = async (prompt: string) => {
    setIsStreaming(true);
    setContent('');
    setError(null);

    try {
      const stream = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          setContent(prev => prev + chunk.delta.text);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsStreaming(false);
    }
  };

  return { content, isStreaming, error, startStream };
}

// 5. WebSocket Integration for Real-time UI
export class StreamingWebSocketHandler {
  private ws: WebSocket | null = null;
  private anthropic: Anthropic;

  constructor(wsUrl: string) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.connect(wsUrl);
  }

  private connect(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'stream_request') {
        await this.handleStreamRequest(data.prompt, data.sessionId);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private async handleStreamRequest(prompt: string, sessionId: string) {
    if (!this.ws) return;

    try {
      const stream = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      });

      // Send stream start event
      this.ws.send(JSON.stringify({
        type: 'stream_start',
        sessionId,
        timestamp: Date.now()
      }));

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          // Send each chunk to client
          this.ws.send(JSON.stringify({
            type: 'stream_delta',
            sessionId,
            text: chunk.delta.text,
            timestamp: Date.now()
          }));
        }
      }

      // Send stream end event
      this.ws.send(JSON.stringify({
        type: 'stream_end',
        sessionId,
        timestamp: Date.now()
      }));
    } catch (error) {
      this.ws.send(JSON.stringify({
        type: 'stream_error',
        sessionId,
        error: error.message,
        timestamp: Date.now()
      }));
    }
  }
}

// 6. Server-Sent Events (SSE) Implementation
export class StreamingSSEHandler {
  async handleSSERequest(req: Request, res: Response) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const prompt = req.query.prompt as string;
    
    try {
      const stream = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const data = JSON.stringify({
            type: 'delta',
            text: chunk.delta.text,
            timestamp: Date.now()
          });
          
          res.write(`data: ${data}\n\n`);
        }
      }

      res.write('data: {"type": "end"}\n\n');
    } catch (error) {
      const errorData = JSON.stringify({
        type: 'error',
        message: error.message
      });
      res.write(`data: ${errorData}\n\n`);
    } finally {
      res.end();
    }
  }
}

// 7. Streaming with Progress Tracking
export async function streamingWithProgress() {
  const stream = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 2000,
    stream: true,
    messages: [
      {
        role: 'user',
        content: 'Write a complete tutorial on building a microservices architecture'
      }
    ]
  });

  let content = '';
  let tokenCount = 0;
  const startTime = Date.now();
  const progressCallbacks: ((progress: any) => void)[] = [];

  // Add progress callback
  const onProgress = (callback: (progress: any) => void) => {
    progressCallbacks.push(callback);
  };

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      const text = chunk.delta.text;
      content += text;
      tokenCount++;

      const progress = {
        content,
        tokenCount,
        estimatedProgress: Math.min(tokenCount / 2000, 1), // Rough estimate
        elapsedTime: Date.now() - startTime,
        tokensPerSecond: tokenCount / ((Date.now() - startTime) / 1000)
      };

      // Notify progress callbacks
      progressCallbacks.forEach(callback => callback(progress));
    }
  }

  return { content, tokenCount, onProgress };
}

// 8. Streaming with Rate Limiting
export class RateLimitedStreaming {
  private requestCount = 0;
  private resetTime = Date.now() + 60000; // Reset every minute
  private readonly maxRequestsPerMinute = 50;

  async createStream(prompt: string) {
    // Check rate limits
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 60000;
    }

    if (this.requestCount >= this.maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    this.requestCount++;

    const stream = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      stream: true,
      messages: [{ role: 'user', content: prompt }]
    });

    return stream;
  }

  getRateLimitStatus() {
    return {
      requestCount: this.requestCount,
      remainingRequests: this.maxRequestsPerMinute - this.requestCount,
      resetTime: new Date(this.resetTime)
    };
  }
}

export {
  basicStreaming,
  advancedStreaming,
  robustStreaming,
  useClaudeStreaming,
  StreamingWebSocketHandler,
  StreamingSSEHandler,
  streamingWithProgress,
  RateLimitedStreaming
};