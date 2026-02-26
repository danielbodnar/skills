// Comprehensive Error Handling for Voyage AI
import { VoyageAIClient, VoyageAIError } from "voyageai";

const client = new VoyageAIClient();

// Custom error types for better error handling
export class VoyageAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: string
  ) {
    super(message);
    this.name = 'VoyageAPIError';
  }
}

// Handle different types of errors
export async function embeddingWithErrorHandling(text: string) {
  try {
    const result = await client.embed({
      input: text,
      model: "voyage-3.5"
    });
    
    return {
      success: true,
      data: result.data[0].embedding,
      tokens: result.usage?.total_tokens
    };
  } catch (error) {
    // Handle VoyageAI specific errors
    if (error instanceof VoyageAIError) {
      console.error(`Voyage AI Error [${error.statusCode}]:`, error.message);
      
      switch (error.statusCode) {
        case 400:
          throw new VoyageAPIError(
            "Invalid request: Check input format and parameters",
            400,
            "INVALID_REQUEST"
          );
        case 401:
          throw new VoyageAPIError(
            "Authentication failed: Check API key",
            401,
            "UNAUTHORIZED"
          );
        case 403:
          throw new VoyageAPIError(
            "Access forbidden: IP address might be blocked",
            403,
            "FORBIDDEN"
          );
        case 429:
          throw new VoyageAPIError(
            "Rate limit exceeded: Implement backoff strategy",
            429,
            "RATE_LIMIT"
          );
        case 500:
        case 502:
        case 503:
        case 504:
          throw new VoyageAPIError(
            "Server error: Retry after brief wait",
            error.statusCode,
            "SERVER_ERROR"
          );
        default:
          throw new VoyageAPIError(
            `Unexpected API error: ${error.message}`,
            error.statusCode,
            "UNKNOWN"
          );
      }
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new VoyageAPIError(
        "Network error: Check internet connection",
        0,
        "NETWORK_ERROR"
      );
    }
    
    // Generic error fallback
    throw new VoyageAPIError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
      0,
      "GENERIC_ERROR"
    );
  }
}

// Retry mechanism with exponential backoff
export async function embeddingWithRetry(
  text: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
) {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await embeddingWithErrorHandling(text);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication or validation errors
      if (error instanceof VoyageAPIError) {
        if (['UNAUTHORIZED', 'FORBIDDEN', 'INVALID_REQUEST'].includes(error.errorType || '')) {
          throw error;
        }
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Batch processing with error recovery
export async function batchEmbeddingWithRecovery(texts: string[]) {
  const results: Array<{
    text: string;
    embedding?: number[];
    error?: string;
    success: boolean;
  }> = [];
  
  // Process in smaller batches to avoid hitting limits
  const batchSize = 32;
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    try {
      const result = await client.embed({
        input: batch,
        model: "voyage-3.5",
        input_type: "document"
      });
      
      // Process successful results
      result.data.forEach((embedding, index) => {
        results.push({
          text: batch[index],
          embedding: embedding.embedding,
          success: true
        });
      });
    } catch (error) {
      console.error(`Batch ${i}-${i + batch.length - 1} failed:`, error);
      
      // Try individual requests for failed batch
      for (const text of batch) {
        try {
          const individualResult = await embeddingWithRetry(text, 2, 500);
          results.push({
            text,
            embedding: individualResult.data,
            success: true
          });
        } catch (individualError) {
          results.push({
            text,
            error: individualError instanceof Error ? individualError.message : 'Unknown error',
            success: false
          });
        }
      }
    }
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Validate inputs before making API calls
export function validateEmbeddingInput(
  input: string | string[],
  model: string
): { valid: boolean; error?: string } {
  // Check if input is empty
  if (!input || (Array.isArray(input) && input.length === 0)) {
    return { valid: false, error: "Input cannot be empty" };
  }
  
  // Check array length limits
  if (Array.isArray(input) && input.length > 128) {
    return { valid: false, error: "Maximum 128 inputs per request" };
  }
  
  // Check individual text length (approximate token count)
  const texts = Array.isArray(input) ? input : [input];
  const maxContextLength = getModelContextLength(model);
  
  for (const text of texts) {
    if (typeof text !== 'string') {
      return { valid: false, error: "All inputs must be strings" };
    }
    
    // Rough token estimation: ~4 characters per token
    const estimatedTokens = text.length / 4;
    if (estimatedTokens > maxContextLength) {
      return { 
        valid: false, 
        error: `Text too long: ~${Math.round(estimatedTokens)} tokens (max: ${maxContextLength})` 
      };
    }
  }
  
  return { valid: true };
}

// Helper function to get model context length
function getModelContextLength(model: string): number {
  const contextLengths: Record<string, number> = {
    'voyage-3-large': 32000,
    'voyage-3.5': 32000,
    'voyage-3.5-lite': 32000,
    'voyage-code-3': 32000,
    'voyage-finance-2': 32000,
    'voyage-law-2': 16000,
    'voyage-multimodal-3': 32000
  };
  
  return contextLengths[model] || 32000;
}

// Usage tracking and cost estimation
export async function embeddingWithUsageTracking(text: string) {
  const startTime = Date.now();
  
  try {
    const result = await client.embed({
      input: text,
      model: "voyage-3.5"
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Embedding completed in ${duration}ms`);
    console.log(`Tokens used: ${result.usage?.total_tokens || 'unknown'}`);
    
    return {
      embedding: result.data[0].embedding,
      metadata: {
        tokens: result.usage?.total_tokens,
        duration,
        model: "voyage-3.5",
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`Embedding failed after ${duration}ms:`, error);
    throw error;
  }
}