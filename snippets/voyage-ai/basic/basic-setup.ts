// Basic Voyage AI Client Setup
import { VoyageAIClient } from "voyageai";

// Initialize with environment variable (recommended)
// The client will automatically use VOYAGE_API_KEY environment variable
const client = new VoyageAIClient();

// Alternative: Initialize with explicit API key
const clientWithKey = new VoyageAIClient({
  apiKey: "your-api-key-here"
});

// Basic text embedding
async function basicEmbedding() {
  const result = await client.embed({
    input: "Hello, world!",
    model: "voyage-3.5"
  });
  
  console.log(result.data[0].embedding);
}

// Multiple text embeddings (batch processing)
async function batchEmbedding() {
  const result = await client.embed({
    input: ["Hello, world!", "Goodbye, world!"],
    model: "voyage-3.5"
  });
  
  result.data.forEach((embedding, index) => {
    console.log(`Embedding ${index}:`, embedding.embedding.slice(0, 5));
  });
}

// Export for reuse
export { client, clientWithKey, basicEmbedding, batchEmbedding };