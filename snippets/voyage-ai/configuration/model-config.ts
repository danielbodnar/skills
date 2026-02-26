// Model Configuration and Selection
import { VoyageAIClient } from "voyageai";

// Model configuration constants
export const MODELS = {
  // Text Embedding Models
  TEXT: {
    LARGE: "voyage-3-large",
    STANDARD: "voyage-3.5", 
    LITE: "voyage-3.5-lite",
    CODE: "voyage-code-3",
    FINANCE: "voyage-finance-2",
    LAW: "voyage-law-2"
  },
  
  // Multimodal Models
  MULTIMODAL: {
    STANDARD: "voyage-multimodal-3"
  },
  
  // Reranking Models
  RERANK: {
    STANDARD: "rerank-2",
    LITE: "rerank-2-lite"
  }
} as const;

// Model capabilities and configurations
export const MODEL_CONFIGS = {
  [MODELS.TEXT.LARGE]: {
    contextLength: 32000,
    dimensions: [256, 512, 1024, 2048],
    defaultDimension: 1024,
    description: "Best general-purpose and multilingual retrieval quality",
    useCases: ["high-quality retrieval", "multilingual tasks", "complex queries"]
  },
  
  [MODELS.TEXT.STANDARD]: {
    contextLength: 32000,
    dimensions: [256, 512, 1024, 2048],
    defaultDimension: 1024,
    description: "Optimized for general-purpose and multilingual retrieval",
    useCases: ["general retrieval", "balanced performance", "production use"]
  },
  
  [MODELS.TEXT.LITE]: {
    contextLength: 32000,
    dimensions: [256, 512, 1024, 2048],
    defaultDimension: 1024,
    description: "Optimized for latency and cost",
    useCases: ["high-throughput", "cost-sensitive", "real-time applications"]
  },
  
  [MODELS.TEXT.CODE]: {
    contextLength: 32000,
    dimensions: [256, 512, 1024, 2048],
    defaultDimension: 1024,
    description: "Optimized for code retrieval",
    useCases: ["code search", "documentation", "programming tasks"]
  },
  
  [MODELS.MULTIMODAL.STANDARD]: {
    contextLength: 32000,
    dimensions: [1024],
    defaultDimension: 1024,
    description: "Rich multimodal embedding model",
    useCases: ["text + image", "document analysis", "visual search"]
  },
  
  [MODELS.RERANK.STANDARD]: {
    contextLength: 16000,
    description: "Generalist reranker optimized for quality",
    useCases: ["high-quality reranking", "multilingual support"]
  },
  
  [MODELS.RERANK.LITE]: {
    contextLength: 8000,
    description: "Optimized for latency and quality",
    useCases: ["fast reranking", "real-time applications"]
  }
} as const;

// Model selection helper
export function selectModel(requirements: {
  task: 'embedding' | 'reranking' | 'multimodal';
  priority: 'quality' | 'speed' | 'cost';
  domain?: 'general' | 'code' | 'finance' | 'law';
  multilingual?: boolean;
}): string {
  const { task, priority, domain = 'general', multilingual = false } = requirements;
  
  if (task === 'embedding') {
    if (domain === 'code') return MODELS.TEXT.CODE;
    if (domain === 'finance') return MODELS.TEXT.FINANCE;
    if (domain === 'law') return MODELS.TEXT.LAW;
    
    if (priority === 'quality') return MODELS.TEXT.LARGE;
    if (priority === 'speed' || priority === 'cost') return MODELS.TEXT.LITE;
    return MODELS.TEXT.STANDARD;
  }
  
  if (task === 'reranking') {
    return priority === 'speed' ? MODELS.RERANK.LITE : MODELS.RERANK.STANDARD;
  }
  
  if (task === 'multimodal') {
    return MODELS.MULTIMODAL.STANDARD;
  }
  
  return MODELS.TEXT.STANDARD;
}

// Dimension optimization
export function optimizeDimensions(
  model: string,
  useCase: 'search' | 'classification' | 'clustering' | 'similarity'
): number {
  const config = MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS];
  if (!config?.dimensions) return 1024;
  
  // Recommendations based on use case
  const recommendations = {
    search: 1024,        // Balance of quality and performance
    classification: 512,  // Usually sufficient for classification
    clustering: 256,     // Lower dimensions often better for clustering
    similarity: 1024     // Higher dimensions for precise similarity
  };
  
  const recommended = recommendations[useCase];
  return config.dimensions.includes(recommended) ? recommended : config.defaultDimension;
}