// Voyage AI Async Client Examples
import { VoyageAIClient } from "voyageai";

// Initialize async client
const asyncClient = new VoyageAIClient();

// Basic async embedding
export async function asyncEmbedding() {
  try {
    const result = await asyncClient.embed({
      input: "Hello, async world!",
      model: "voyage-3.5"
    });
    
    console.log("Embedding generated:", result.data[0].embedding.slice(0, 5));
    return result.data[0].embedding;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Embedding failed:", error.message);
    }
    throw error;
  }
}

// Concurrent embedding requests
export async function concurrentEmbeddings() {
  const texts = [
    "First text to embed",
    "Second text to embed", 
    "Third text to embed"
  ];

  try {
    // Process embeddings concurrently
    const promises = texts.map(text => 
      asyncClient.embed({
        input: text,
        model: "voyage-3.5",
        input_type: "document"
      })
    );

    const results = await Promise.all(promises);
    
    return results.map((result, index) => ({
      text: texts[index],
      embedding: result.data[0].embedding,
      tokens: result.usage?.total_tokens || 0
    }));
  } catch (error) {
    console.error("Concurrent embedding failed:", error);
    throw error;
  }
}

// Embedding with timeout and retry
export async function embeddingWithTimeout(
  text: string, 
  timeoutMs: number = 30000,
  maxRetries: number = 3
) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const result = await asyncClient.embed({
        input: text,
        model: "voyage-3.5"
      });
      
      clearTimeout(timeoutId);
      return result.data[0].embedding;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} retries: ${error}`);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}