// Multimodal Embedding Examples
// Note: Multimodal embedding support in TypeScript SDK may be limited
// Check latest documentation at https://github.com/voyage-ai/typescript-sdk
import { VoyageAIClient } from "voyageai";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Client automatically uses VOYAGE_API_KEY environment variable
const client = new VoyageAIClient();

// Text and image embedding
export async function textImageEmbedding() {
  // Base64 encode image
  const imageBuffer = readFileSync(join(process.cwd(), "assets/sample-image.jpg"));
  const base64Image = imageBuffer.toString("base64");
  const mimeType = "image/jpeg";
  
  const inputs = [
    {
      content: [
        { type: "text", text: "This is a product image showing a red bicycle." },
        { 
          type: "image_base64", 
          image_base64: `data:${mimeType};base64,${base64Image}` 
        }
      ]
    }
  ];
  
  // Note: multimodal_embed might not be available in TypeScript SDK yet
  // This is based on Python client API - check SDK docs for TypeScript equivalent
  const result = await client.multimodal_embed({
    inputs,
    model: "voyage-multimodal-3",
    input_type: "document"
  });
  
  return result.embeddings[0];
}

// Multiple multimodal inputs
export async function batchMultimodalEmbedding() {
  const inputs = [
    {
      content: [
        { type: "text", text: "A sunset over the ocean with golden colors." },
        { type: "image_base64", image_base64: "data:image/jpeg;base64,..." }
      ]
    },
    {
      content: [
        { type: "text", text: "Modern architecture with glass and steel." },
        { type: "image_base64", image_base64: "data:image/png;base64,..." }
      ]
    }
  ];
  
  // Note: multimodal_embed might not be available in TypeScript SDK yet
  // This is based on Python client API - check SDK docs for TypeScript equivalent
  const result = await client.multimodal_embed({
    inputs,
    model: "voyage-multimodal-3",
    input_type: "document"
  });
  
  return result.embeddings;
}

// Helper function to convert image to base64
export function imageToBase64(imagePath: string): { base64: string; mimeType: string } {
  const buffer = readFileSync(imagePath);
  const base64 = buffer.toString("base64");
  
  // Determine MIME type from file extension
  const ext = imagePath.split('.').pop()?.toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : 
                   ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                   ext === 'gif' ? 'image/gif' : 'image/jpeg';
  
  return { base64, mimeType };
}

// Multimodal with document content
export async function documentMultimodalEmbedding() {
  const { base64, mimeType } = imageToBase64("document-screenshot.png");
  
  const inputs = [
    {
      content: [
        { 
          type: "text", 
          text: "Financial report showing quarterly earnings and growth metrics." 
        },
        { 
          type: "image_base64", 
          image_base64: `data:${mimeType};base64,${base64}` 
        }
      ]
    }
  ];
  
  // Note: multimodal_embed might not be available in TypeScript SDK yet
  // This is based on Python client API - check SDK docs for TypeScript equivalent
  const result = await client.multimodal_embed({
    inputs,
    model: "voyage-multimodal-3",
    input_type: "document",
    truncation: true
  });
  
  return {
    embeddings: result.embeddings,
    textTokens: result.text_tokens,
    imagePixels: result.image_pixels,
    totalTokens: result.total_tokens
  };
}