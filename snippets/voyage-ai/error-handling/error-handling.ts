// Error Handling and Retry Logic
import { VoyageAIClient, VoyageAIError } from "voyageai";

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY
});

// Basic error handling
export async function embedWithErrorHandling(text: string) {
  try {
    const result = await client.embed({
      input: text,
      model: "voyage-3.5"
    });
    
    return {
      success: true,
      data: result.embeddings[0]
    };
  } catch (error) {
    if (error instanceof VoyageAIError) {
      console.error('Voyage AI Error:', {
        status: error.statusCode,
        message: error.message,
        details: error.body
      });
      
      return {
        success: false,
        error: {
          type: 'VoyageAIError',
          status: error.statusCode,
          message: error.message
        }
      };
    }
    
    console.error('Unknown error:', error);
    return {
      success: false,
      error: {
        type: 'UnknownError',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Retry logic with exponential backoff
export async function embedWithRetry(
  text: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await client.embed({
        input: text,
        model: "voyage-3.5"
      });
      
      return {
        success: true,
        data: result.embeddings[0],
        attempts: attempt + 1
      };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      
      if (error instanceof VoyageAIError) {
        // Don't retry on client errors (4xx)
        if (error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }
        
        // Retry on server errors (5xx) and rate limits (429)
        if (!isLastAttempt && (error.statusCode >= 500 || error.statusCode === 429)) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      if (isLastAttempt) {
        throw error;
      }
    }
  }
}

// Rate limit handling
export class RateLimitHandler {
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 100; // Minimum milliseconds between requests
  
  async addRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }
      
      const request = this.requestQueue.shift()!;
      this.lastRequestTime = Date.now();
      
      try {
        await request();
      } catch (error) {
        console.error('Request failed:', error);
      }
    }
    
    this.processing = false;
  }
}

// Usage example with rate limiting
const rateLimitHandler = new RateLimitHandler();

export async function embedWithRateLimit(texts: string[]) {
  const results = await Promise.all(
    texts.map(text => 
      rateLimitHandler.addRequest(() => 
        client.embed({
          input: text,
          model: "voyage-3.5"
        })
      )
    )
  );
  
  return results.map(result => result.embeddings[0]);
}

// Comprehensive error handling wrapper
export async function safeVoyageRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    onError?: (error: any, attempt: number) => void;
  } = {}
): Promise<{ success: true; data: T } | { success: false; error: any }> {
  const { maxRetries = 3, baseDelay = 1000, onError } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await requestFn();
      return { success: true, data: result };
    } catch (error) {
      onError?.(error, attempt + 1);
      
      const isLastAttempt = attempt === maxRetries - 1;
      
      if (error instanceof VoyageAIError) {
        // Don't retry client errors
        if (error.statusCode >= 400 && error.statusCode < 500) {
          return { success: false, error };
        }
        
        // Retry server errors and rate limits
        if (!isLastAttempt && (error.statusCode >= 500 || error.statusCode === 429)) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      if (isLastAttempt) {
        return { success: false, error };
      }
    }
  }
  
  return { success: false, error: new Error('Max retries exceeded') };
}