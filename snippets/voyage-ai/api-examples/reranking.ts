// Document Reranking Examples
import { VoyageAIClient } from "voyageai";

// Client automatically uses VOYAGE_API_KEY environment variable
const client = new VoyageAIClient();

// Basic document reranking
export async function basicReranking() {
  const query = "When is Apple's conference call scheduled?";
  const documents = [
    "The Mediterranean diet emphasizes fish, olive oil, and vegetables.",
    "Photosynthesis in plants converts light energy into glucose.",
    "20th-century innovations centered on electronic advancements.",
    "Rivers provide water, irrigation, and habitat for aquatic species.",
    "Apple's conference call is scheduled for Thursday, November 2, 2023 at 2:00 p.m. PT.",
    "Shakespeare's works like 'Hamlet' endure in literature."
  ];
  
  const result = await client.rerank({
    query,
    documents,
    model: "rerank-2",
    top_k: 3
  });
  
  return result.results;
}

// Advanced reranking with full results
export async function advancedReranking() {
  const query = "machine learning applications";
  const documents = [
    "Neural networks are used in image recognition systems.",
    "Deep learning models require large datasets for training.",
    "Natural language processing enables chatbots and translation.",
    "Computer vision applications include autonomous vehicles.",
    "Recommendation systems use collaborative filtering algorithms."
  ];
  
  const result = await client.rerank({
    query,
    documents,
    model: "rerank-2-lite",
    // No top_k specified - returns all documents ranked
  });
  
  // Process results with scores
  const processedResults = result.results.map(r => ({
    document: r.document,
    score: r.relevance_score,
    originalIndex: r.index,
    isRelevant: r.relevance_score > 0.5
  }));
  
  return processedResults;
}

// Reranking with error handling
export async function safeReranking(query: string, documents: string[]) {
  try {
    const result = await client.rerank({
      query,
      documents,
      model: "rerank-2",
      top_k: Math.min(5, documents.length),
      truncation: true
    });
    
    return {
      success: true,
      results: result.results,
      totalTokens: result.total_tokens
    };
  } catch (error) {
    console.error('Reranking failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: []
    };
  }
}