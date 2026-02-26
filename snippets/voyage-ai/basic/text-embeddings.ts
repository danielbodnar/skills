// Text Embedding Examples
import { VoyageAIClient } from "voyageai";

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY
});

// Single text embedding
export async function singleTextEmbedding() {
  const result = await client.embed({
    input: "The quick brown fox jumps over the lazy dog",
    model: "voyage-3.5",
    input_type: "document"
  });
  
  return result.embeddings[0];
}

// Batch text embeddings
export async function batchTextEmbeddings() {
  const texts = [
    "The Mediterranean diet emphasizes fish, olive oil, and vegetables.",
    "Photosynthesis in plants converts light energy into glucose.",
    "20th-century innovations centered on electronic advancements.",
    "Rivers provide water, irrigation, and habitat for aquatic species."
  ];
  
  const result = await client.embed({
    input: texts,
    model: "voyage-3.5",
    input_type: "document"
  });
  
  return result.embeddings;
}

// Query embedding for search
export async function queryEmbedding() {
  const result = await client.embed({
    input: "What are the benefits of Mediterranean diet?",
    model: "voyage-3.5",
    input_type: "query"
  });
  
  return result.embeddings[0];
}

// Code embedding with specialized model
export async function codeEmbedding() {
  const codeSnippets = [
    "function quickSort(arr) { return arr.sort((a, b) => a - b); }",
    "const fetchData = async (url) => { const response = await fetch(url); return response.json(); }",
    "class DatabaseConnection { constructor(config) { this.config = config; } }"
  ];
  
  const result = await client.embed({
    input: codeSnippets,
    model: "voyage-code-3",
    input_type: "document"
  });
  
  return result.embeddings;
}