// TypeScript Type Definitions for Voyage AI
export interface VoyageAIClientConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface EmbedRequest {
  input: string | string[];
  model: string;
  input_type?: 'query' | 'document';
  truncation?: boolean;
  output_dimension?: number;
  output_dtype?: 'float' | 'int8' | 'uint8' | 'binary' | 'ubinary';
}

export interface EmbedResponse {
  embeddings: number[][];
  total_tokens: number;
  model: string;
  object: 'list';
}

export interface RerankRequest {
  query: string;
  documents: string[];
  model: string;
  top_k?: number;
  truncation?: boolean;
}

export interface RerankResponse {
  results: RerankResult[];
  total_tokens: number;
  model: string;
  object: 'list';
}

export interface RerankResult {
  document: string;
  relevance_score: number;
  index: number;
}

export interface MultimodalEmbedRequest {
  inputs: MultimodalInput[];
  model: string;
  input_type?: 'query' | 'document';
  truncation?: boolean;
}

export interface MultimodalInput {
  content: Array<TextContent | ImageContent>;
}

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image_base64';
  image_base64: string;
}

export interface MultimodalEmbedResponse {
  embeddings: number[][];
  text_tokens: number;
  image_pixels: number;
  total_tokens: number;
  model: string;
  object: 'list';
}

export interface VoyageAIError extends Error {
  statusCode: number;
  body: any;
}

// Model constants
export const VOYAGE_MODELS = {
  TEXT_EMBEDDING: {
    'voyage-3-large': {
      contextLength: 32000,
      dimensions: [256, 512, 1024, 2048],
      defaultDimension: 1024
    },
    'voyage-3.5': {
      contextLength: 32000,
      dimensions: [256, 512, 1024, 2048],
      defaultDimension: 1024
    },
    'voyage-3.5-lite': {
      contextLength: 32000,
      dimensions: [256, 512, 1024, 2048],
      defaultDimension: 1024
    },
    'voyage-code-3': {
      contextLength: 32000,
      dimensions: [256, 512, 1024, 2048],
      defaultDimension: 1024
    },
    'voyage-finance-2': {
      contextLength: 32000,
      dimensions: [1024],
      defaultDimension: 1024
    },
    'voyage-law-2': {
      contextLength: 16000,
      dimensions: [1024],
      defaultDimension: 1024
    }
  },
  MULTIMODAL: {
    'voyage-multimodal-3': {
      contextLength: 32000,
      dimensions: [1024],
      defaultDimension: 1024
    }
  },
  RERANK: {
    'rerank-2': {
      contextLength: 16000
    },
    'rerank-2-lite': {
      contextLength: 8000
    }
  }
} as const;

// Rate limits
export const RATE_LIMITS = {
  BASIC: {
    'voyage-3-large': { TPM: 3_000_000, RPM: 2000 },
    'voyage-3.5': { TPM: 8_000_000, RPM: 2000 },
    'voyage-3.5-lite': { TPM: 16_000_000, RPM: 2000 },
    'voyage-code-3': { TPM: 3_000_000, RPM: 2000 },
    'voyage-multimodal-3': { TPM: 2_000_000, RPM: 2000 },
    'rerank-2': { TPM: 2_000_000, RPM: 2000 },
    'rerank-2-lite': { TPM: 4_000_000, RPM: 2000 }
  }
} as const;

// Utility types
export type EmbeddingModel = keyof typeof VOYAGE_MODELS.TEXT_EMBEDDING;
export type MultimodalModel = keyof typeof VOYAGE_MODELS.MULTIMODAL;
export type RerankModel = keyof typeof VOYAGE_MODELS.RERANK;
export type OutputDtype = 'float' | 'int8' | 'uint8' | 'binary' | 'ubinary';
export type InputType = 'query' | 'document';

// Helper interfaces for common patterns
export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface SearchResult {
  document: Document;
  score: number;
  index: number;
  metadata?: Record<string, any>;
}

export interface VectorDatabaseRecord {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
}