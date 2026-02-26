// Batch Processing and Performance Optimization
import { VoyageAIClient } from "voyageai";

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY
});

// Efficient batch processing
export async function batchEmbeddings(
  texts: string[],
  options: {
    batchSize?: number;
    model?: string;
    inputType?: 'query' | 'document';
    delay?: number;
  } = {}
) {
  const {
    batchSize = 128,
    model = "voyage-3.5",
    inputType = "document",
    delay = 0
  } = options;
  
  const results: number[][] = [];
  const totalBatches = Math.ceil(texts.length / batchSize);
  
  console.log(`Processing ${texts.length} texts in ${totalBatches} batches`);
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);
    
    const startTime = Date.now();
    const result = await client.embed({
      input: batch,
      model,
      input_type: inputType
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Batch ${batchNumber} completed in ${duration}ms`);
    
    results.push(...result.embeddings);
    
    // Optional delay between batches
    if (delay > 0 && i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

// Parallel processing with controlled concurrency
export async function parallelEmbeddings(
  texts: string[],
  options: {
    concurrency?: number;
    model?: string;
    inputType?: 'query' | 'document';
  } = {}
) {
  const { concurrency = 3, model = "voyage-3.5", inputType = "document" } = options;
  
  const chunks = [];
  const chunkSize = Math.ceil(texts.length / concurrency);
  
  for (let i = 0; i < texts.length; i += chunkSize) {
    chunks.push(texts.slice(i, i + chunkSize));
  }
  
  const results = await Promise.all(
    chunks.map(async (chunk, index) => {
      console.log(`Starting chunk ${index + 1}/${chunks.length} (${chunk.length} items)`);
      
      const result = await client.embed({
        input: chunk,
        model,
        input_type: inputType
      });
      
      return result.embeddings;
    })
  );
  
  return results.flat();
}

// Progressive batch processing with monitoring
export async function progressiveBatchEmbeddings(
  texts: string[],
  onProgress?: (progress: { completed: number; total: number; percentage: number }) => void
) {
  const batchSize = 128;
  const results: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const result = await client.embed({
      input: batch,
      model: "voyage-3.5",
      input_type: "document"
    });
    
    results.push(...result.embeddings);
    
    const completed = Math.min(i + batchSize, texts.length);
    const percentage = Math.round((completed / texts.length) * 100);
    
    onProgress?.({
      completed,
      total: texts.length,
      percentage
    });
  }
  
  return results;
}

// Memory-efficient streaming processing
export async function* streamEmbeddings(
  texts: string[],
  batchSize: number = 128
) {
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const result = await client.embed({
      input: batch,
      model: "voyage-3.5",
      input_type: "document"
    });
    
    yield result.embeddings;
  }
}

// Performance monitoring wrapper
export async function monitoredEmbedding(
  texts: string[],
  model: string = "voyage-3.5"
) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  const result = await client.embed({
    input: texts,
    model
  });
  
  const endTime = Date.now();
  const endMemory = process.memoryUsage();
  
  const metrics = {
    duration: endTime - startTime,
    tokensProcessed: texts.join(' ').length,
    tokensPerSecond: Math.round((texts.join(' ').length / (endTime - startTime)) * 1000),
    memoryUsed: {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    }
  };
  
  return {
    embeddings: result.embeddings,
    metrics
  };
}

// Optimized similarity search
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findTopKSimilar(
  queryEmbedding: number[],
  documentEmbeddings: number[][],
  k: number = 5
): Array<{ index: number; score: number; embedding: number[] }> {
  const similarities = documentEmbeddings.map((embedding, index) => ({
    index,
    score: cosineSimilarity(queryEmbedding, embedding),
    embedding
  }));
  
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}