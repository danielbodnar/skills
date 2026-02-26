// Advanced Semantic Search Patterns
import { VoyageAIClient } from "voyageai";

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY
});

// Semantic search with hybrid retrieval
export class HybridSemanticSearch {
  private documents: Array<{ id: string; text: string; metadata?: Record<string, any> }> = [];
  private embeddings: number[][] = [];
  private indexedAt: Date = new Date();
  
  async indexDocuments(documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>) {
    this.documents = documents;
    
    // Generate embeddings for all documents
    const result = await client.embed({
      input: documents.map(doc => doc.text),
      model: "voyage-3.5",
      input_type: "document"
    });
    
    this.embeddings = result.embeddings;
    this.indexedAt = new Date();
    
    console.log(`Indexed ${documents.length} documents`);
  }
  
  async search(query: string, options: {
    k?: number;
    threshold?: number;
    useReranking?: boolean;
    rerankTopK?: number;
    includeMetadata?: boolean;
  } = {}) {
    const {
      k = 10,
      threshold = 0.5,
      useReranking = true,
      rerankTopK = 3,
      includeMetadata = true
    } = options;
    
    // Step 1: Generate query embedding
    const queryEmbedding = await client.embed({
      input: query,
      model: "voyage-3.5",
      input_type: "query"
    });
    
    // Step 2: Calculate similarities
    const similarities = this.embeddings.map((embedding, index) => ({
      index,
      document: this.documents[index],
      similarity: this.cosineSimilarity(queryEmbedding.embeddings[0], embedding)
    }));
    
    // Step 3: Filter by threshold and get top-k
    const filteredResults = similarities
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
    
    // Step 4: Optional reranking
    if (useReranking && filteredResults.length > 0) {
      const documents = filteredResults.map(result => result.document.text);
      
      const rerankedResults = await client.rerank({
        query,
        documents,
        model: "rerank-2",
        top_k: Math.min(rerankTopK, filteredResults.length)
      });
      
      return rerankedResults.results.map(result => ({
        document: filteredResults[result.index].document,
        vectorScore: filteredResults[result.index].similarity,
        rerankScore: result.relevance_score,
        combinedScore: (filteredResults[result.index].similarity + result.relevance_score) / 2,
        metadata: includeMetadata ? filteredResults[result.index].document.metadata : undefined
      }));
    }
    
    return filteredResults.map(result => ({
      document: result.document,
      vectorScore: result.similarity,
      rerankScore: null,
      combinedScore: result.similarity,
      metadata: includeMetadata ? result.document.metadata : undefined
    }));
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  getStats() {
    return {
      totalDocuments: this.documents.length,
      indexedAt: this.indexedAt,
      avgEmbeddingLength: this.embeddings.length > 0 ? this.embeddings[0].length : 0
    };
  }
}

// Multi-stage search with query expansion
export class MultiStageSearch {
  private searchEngine: HybridSemanticSearch;
  
  constructor() {
    this.searchEngine = new HybridSemanticSearch();
  }
  
  async indexDocuments(documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>) {
    await this.searchEngine.indexDocuments(documents);
  }
  
  async searchWithExpansion(query: string, options: {
    expandQueries?: string[];
    weights?: number[];
    aggregationMethod?: 'max' | 'mean' | 'weighted';
    finalK?: number;
  } = {}) {
    const {
      expandQueries = [],
      weights = [1.0, ...Array(expandQueries.length).fill(0.5)],
      aggregationMethod = 'weighted',
      finalK = 5
    } = options;
    
    const allQueries = [query, ...expandQueries];
    const allResults = await Promise.all(
      allQueries.map(q => this.searchEngine.search(q, { k: 10, useReranking: false }))
    );
    
    // Aggregate results
    const documentScores = new Map<string, number>();
    const documentRefs = new Map<string, any>();
    
    allResults.forEach((results, queryIndex) => {
      results.forEach(result => {
        const docId = result.document.id;
        const weight = weights[queryIndex] || 1.0;
        const score = result.vectorScore * weight;
        
        if (!documentScores.has(docId)) {
          documentScores.set(docId, 0);
          documentRefs.set(docId, result);
        }
        
        const currentScore = documentScores.get(docId)!;
        
        switch (aggregationMethod) {
          case 'max':
            documentScores.set(docId, Math.max(currentScore, score));
            break;
          case 'mean':
            documentScores.set(docId, (currentScore + score) / 2);
            break;
          case 'weighted':
            documentScores.set(docId, currentScore + score);
            break;
        }
      });
    });
    
    // Sort and return top results
    const aggregatedResults = Array.from(documentScores.entries())
      .map(([docId, score]) => ({
        ...documentRefs.get(docId),
        combinedScore: score
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, finalK);
    
    return aggregatedResults;
  }
}

// Faceted search with embeddings
export class FacetedSemanticSearch {
  private searchEngine: HybridSemanticSearch;
  private facetEmbeddings: Map<string, Map<string, number[]>> = new Map();
  
  constructor() {
    this.searchEngine = new HybridSemanticSearch();
  }
  
  async indexDocuments(documents: Array<{ 
    id: string; 
    text: string; 
    metadata?: Record<string, any>;
    facets?: Record<string, string[]>;
  }>) {
    await this.searchEngine.indexDocuments(documents);
    
    // Index facet values
    for (const doc of documents) {
      if (doc.facets) {
        for (const [facetName, values] of Object.entries(doc.facets)) {
          if (!this.facetEmbeddings.has(facetName)) {
            this.facetEmbeddings.set(facetName, new Map());
          }
          
          const facetMap = this.facetEmbeddings.get(facetName)!;
          
          for (const value of values) {
            if (!facetMap.has(value)) {
              const embedding = await client.embed({
                input: value,
                model: "voyage-3.5",
                input_type: "document"
              });
              facetMap.set(value, embedding.embeddings[0]);
            }
          }
        }
      }
    }
  }
  
  async searchWithFacets(query: string, options: {
    facets?: Record<string, string[]>;
    facetWeight?: number;
    k?: number;
  } = {}) {
    const { facets = {}, facetWeight = 0.3, k = 10 } = options;
    
    // Standard semantic search
    const baseResults = await this.searchEngine.search(query, { k: k * 2, useReranking: false });
    
    if (Object.keys(facets).length === 0) {
      return baseResults.slice(0, k);
    }
    
    // Calculate facet scores
    const queryEmbedding = await client.embed({
      input: query,
      model: "voyage-3.5",
      input_type: "query"
    });
    
    const facetScores = new Map<string, number>();
    
    for (const [facetName, requestedValues] of Object.entries(facets)) {
      const facetMap = this.facetEmbeddings.get(facetName);
      if (!facetMap) continue;
      
      for (const value of requestedValues) {
        const valueEmbedding = facetMap.get(value);
        if (valueEmbedding) {
          const similarity = this.cosineSimilarity(queryEmbedding.embeddings[0], valueEmbedding);
          facetScores.set(`${facetName}:${value}`, similarity);
        }
      }
    }
    
    // Combine semantic and facet scores
    const combinedResults = baseResults.map(result => {
      let facetScore = 0;
      let facetMatches = 0;
      
      if (result.document.metadata?.facets) {
        for (const [facetName, values] of Object.entries(result.document.metadata.facets)) {
          if (facets[facetName]) {
            for (const value of values) {
              const key = `${facetName}:${value}`;
              if (facetScores.has(key)) {
                facetScore += facetScores.get(key)!;
                facetMatches++;
              }
            }
          }
        }
      }
      
      const avgFacetScore = facetMatches > 0 ? facetScore / facetMatches : 0;
      const combinedScore = (1 - facetWeight) * result.vectorScore + facetWeight * avgFacetScore;
      
      return {
        ...result,
        facetScore: avgFacetScore,
        combinedScore
      };
    });
    
    return combinedResults
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, k);
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// Time-aware semantic search
export class TemporalSemanticSearch {
  private searchEngine: HybridSemanticSearch;
  
  constructor() {
    this.searchEngine = new HybridSemanticSearch();
  }
  
  async indexDocuments(documents: Array<{ 
    id: string; 
    text: string; 
    timestamp: Date;
    metadata?: Record<string, any>;
  }>) {
    await this.searchEngine.indexDocuments(documents);
  }
  
  async searchWithTimeDecay(query: string, options: {
    decayRate?: number;
    timeWeight?: number;
    k?: number;
  } = {}) {
    const { decayRate = 0.1, timeWeight = 0.2, k = 10 } = options;
    
    const results = await this.searchEngine.search(query, { k: k * 2, useReranking: false });
    const now = new Date();
    
    const timeAwareResults = results.map(result => {
      const docTime = new Date(result.document.metadata?.timestamp || now);
      const timeDiff = (now.getTime() - docTime.getTime()) / (1000 * 60 * 60 * 24); // Days
      const timeDecay = Math.exp(-decayRate * timeDiff);
      
      const combinedScore = (1 - timeWeight) * result.vectorScore + timeWeight * timeDecay;
      
      return {
        ...result,
        timeDecay,
        combinedScore
      };
    });
    
    return timeAwareResults
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, k);
  }
}