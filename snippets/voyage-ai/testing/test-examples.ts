// Testing Examples for Voyage AI Integration
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { VoyageAIClient } from "voyageai";

// Mock client for testing
const mockClient = {
  embed: async (params: any) => ({
    embeddings: [[0.1, 0.2, 0.3, 0.4, 0.5]],
    total_tokens: 10
  }),
  rerank: async (params: any) => ({
    results: [
      { document: "Test document", relevance_score: 0.9, index: 0 }
    ],
    total_tokens: 15
  }),
  multimodal_embed: async (params: any) => ({
    embeddings: [[0.1, 0.2, 0.3, 0.4, 0.5]],
    text_tokens: 5,
    image_pixels: 1000,
    total_tokens: 10
  })
};

describe('Voyage AI Client Tests', () => {
  let client: VoyageAIClient;
  
  beforeEach(() => {
    client = new VoyageAIClient({
      apiKey: process.env.VOYAGE_API_KEY || 'test-key'
    });
  });
  
  describe('Text Embeddings', () => {
    it('should generate embeddings for single text', async () => {
      const result = await client.embed({
        input: "Hello, world!",
        model: "voyage-3.5"
      });
      
      expect(result.embeddings).toHaveLength(1);
      expect(result.embeddings[0]).toBeInstanceOf(Array);
      expect(result.embeddings[0].length).toBeGreaterThan(0);
    });
    
    it('should generate embeddings for multiple texts', async () => {
      const texts = ["First text", "Second text", "Third text"];
      const result = await client.embed({
        input: texts,
        model: "voyage-3.5"
      });
      
      expect(result.embeddings).toHaveLength(3);
      result.embeddings.forEach(embedding => {
        expect(embedding).toBeInstanceOf(Array);
        expect(embedding.length).toBeGreaterThan(0);
      });
    });
    
    it('should handle different input types', async () => {
      const queryResult = await client.embed({
        input: "What is machine learning?",
        model: "voyage-3.5",
        input_type: "query"
      });
      
      const docResult = await client.embed({
        input: "Machine learning is a subset of AI.",
        model: "voyage-3.5",
        input_type: "document"
      });
      
      expect(queryResult.embeddings).toHaveLength(1);
      expect(docResult.embeddings).toHaveLength(1);
    });
    
    it('should handle different output dimensions', async () => {
      const result = await client.embed({
        input: "Test text",
        model: "voyage-3-large",
        output_dimension: 512
      });
      
      expect(result.embeddings[0]).toHaveLength(512);
    });
  });
  
  describe('Reranking', () => {
    it('should rerank documents based on query', async () => {
      const query = "machine learning applications";
      const documents = [
        "Deep learning is used in image recognition",
        "Natural language processing enables chatbots",
        "Computer vision powers autonomous vehicles"
      ];
      
      const result = await client.rerank({
        query,
        documents,
        model: "rerank-2",
        top_k: 2
      });
      
      expect(result.results).toHaveLength(2);
      expect(result.results[0].relevance_score).toBeGreaterThan(0);
      expect(result.results[0].index).toBeGreaterThanOrEqual(0);
    });
    
    it('should return all documents when top_k is not specified', async () => {
      const query = "test query";
      const documents = ["Doc 1", "Doc 2", "Doc 3"];
      
      const result = await client.rerank({
        query,
        documents,
        model: "rerank-2"
      });
      
      expect(result.results).toHaveLength(3);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid API key', async () => {
      const invalidClient = new VoyageAIClient({
        apiKey: 'invalid-key'
      });
      
      try {
        await invalidClient.embed({
          input: "Test",
          model: "voyage-3.5"
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    
    it('should handle empty input', async () => {
      try {
        await client.embed({
          input: "",
          model: "voyage-3.5"
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    
    it('should handle invalid model', async () => {
      try {
        await client.embed({
          input: "Test",
          model: "non-existent-model"
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
  
  describe('Performance Tests', () => {
    it('should handle batch processing efficiently', async () => {
      const texts = Array(100).fill(0).map((_, i) => `Test text ${i}`);
      const batchSize = 10;
      
      const startTime = Date.now();
      const results = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const result = await client.embed({
          input: batch,
          model: "voyage-3.5"
        });
        results.push(...result.embeddings);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});

// Integration test helpers
export class VoyageTestHelper {
  private client: VoyageAIClient;
  
  constructor() {
    this.client = new VoyageAIClient({
      apiKey: process.env.VOYAGE_API_KEY || 'test-key'
    });
  }
  
  async generateTestEmbeddings(count: number = 10) {
    const texts = Array(count).fill(0).map((_, i) => `Test document ${i}`);
    
    const result = await this.client.embed({
      input: texts,
      model: "voyage-3.5",
      input_type: "document"
    });
    
    return result.embeddings;
  }
  
  async testSimilaritySearch(query: string, documents: string[]) {
    const queryEmbedding = await this.client.embed({
      input: query,
      model: "voyage-3.5",
      input_type: "query"
    });
    
    const docEmbeddings = await this.client.embed({
      input: documents,
      model: "voyage-3.5",
      input_type: "document"
    });
    
    // Calculate similarities
    const similarities = docEmbeddings.embeddings.map((docEmb, index) => ({
      index,
      document: documents[index],
      similarity: this.cosineSimilarity(queryEmbedding.embeddings[0], docEmb)
    }));
    
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  async validateEmbedding(embedding: number[]) {
    return {
      isValid: Array.isArray(embedding) && embedding.length > 0,
      dimension: embedding.length,
      magnitude: Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)),
      hasNaN: embedding.some(val => isNaN(val)),
      hasInfinite: embedding.some(val => !isFinite(val))
    };
  }
}

// Mock implementations for testing
export const mockVoyageClient = {
  embed: async (params: any) => {
    const inputLength = Array.isArray(params.input) ? params.input.length : 1;
    const dimension = params.output_dimension || 1024;
    
    return {
      embeddings: Array(inputLength).fill(0).map(() => 
        Array(dimension).fill(0).map(() => Math.random() * 2 - 1)
      ),
      total_tokens: inputLength * 10
    };
  },
  
  rerank: async (params: any) => {
    const results = params.documents.map((doc: string, index: number) => ({
      document: doc,
      relevance_score: Math.random(),
      index
    }));
    
    results.sort((a: any, b: any) => b.relevance_score - a.relevance_score);
    
    return {
      results: params.top_k ? results.slice(0, params.top_k) : results,
      total_tokens: params.query.length + params.documents.join('').length
    };
  }
};

// Test data sets
export const testDataSets = {
  shortTexts: [
    "Hello world",
    "Machine learning",
    "Artificial intelligence",
    "Deep learning",
    "Natural language processing"
  ],
  
  longTexts: [
    "Machine learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.",
    "Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning. Learning can be supervised, semi-supervised or unsupervised.",
    "Natural language processing is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language, in particular how to program computers to process and analyze large amounts of natural language data."
  ],
  
  codeSnippets: [
    "function fibonacci(n) { return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2); }",
    "const quickSort = arr => arr.length <= 1 ? arr : [...quickSort(arr.slice(1).filter(x => x < arr[0])), arr[0], ...quickSort(arr.slice(1).filter(x => x >= arr[0]))];",
    "class LinkedList { constructor() { this.head = null; this.size = 0; } append(data) { const newNode = { data, next: null }; if (!this.head) { this.head = newNode; } else { let current = this.head; while (current.next) { current = current.next; } current.next = newNode; } this.size++; } }"
  ]
};