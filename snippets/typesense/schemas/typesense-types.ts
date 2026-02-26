// TypeScript Type Definitions for Typesense
import { z } from 'zod';

// Client Configuration Schema
export const ClientConfigSchema = z.object({
  nodes: z.array(z.object({
    host: z.string(),
    port: z.number(),
    protocol: z.enum(['http', 'https'])
  })),
  apiKey: z.string(),
  connectionTimeoutSeconds: z.number().optional().default(10),
  retryIntervalSeconds: z.number().optional().default(1),
  numRetries: z.number().optional().default(3),
  healthcheckIntervalSeconds: z.number().optional().default(60),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info')
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;

// Field Type Schema
export const FieldTypeSchema = z.enum([
  'string', 'int32', 'int64', 'float', 'bool', 'geopoint',
  'string[]', 'int32[]', 'int64[]', 'float[]', 'bool[]', 'geopoint[]'
]);

export type FieldType = z.infer<typeof FieldTypeSchema>;

// Collection Field Schema
export const CollectionFieldSchema = z.object({
  name: z.string(),
  type: FieldTypeSchema,
  facet: z.boolean().optional().default(false),
  optional: z.boolean().optional().default(false),
  index: z.boolean().optional().default(true),
  sort: z.boolean().optional().default(false),
  infix: z.boolean().optional().default(false),
  locale: z.string().optional(),
  stem: z.boolean().optional().default(false),
  num_dim: z.number().optional(), // For vector fields
  embed: z.object({
    from: z.array(z.string()),
    model_config: z.object({
      model_name: z.string(),
      api_key: z.string().optional(),
      model_params: z.record(z.any()).optional()
    })
  }).optional(),
  hnsw: z.object({
    ef_construction: z.number().optional().default(200),
    M: z.number().optional().default(16)
  }).optional()
});

export type CollectionField = z.infer<typeof CollectionFieldSchema>;

// Collection Schema
export const CollectionSchema = z.object({
  name: z.string(),
  fields: z.array(CollectionFieldSchema),
  default_sorting_field: z.string().optional(),
  token_separators: z.array(z.string()).optional(),
  symbols_to_index: z.array(z.string()).optional(),
  enable_nested_fields: z.boolean().optional().default(false)
});

export type Collection = z.infer<typeof CollectionSchema>;

// Search Parameters Schema
export const SearchParametersSchema = z.object({
  q: z.string(),
  query_by: z.string(),
  query_by_weights: z.string().optional(),
  prefix: z.union([z.boolean(), z.string()]).optional().default(true),
  filter_by: z.string().optional(),
  sort_by: z.string().optional(),
  facet_by: z.string().optional(),
  max_facet_values: z.number().optional().default(10),
  facet_query: z.string().optional(),
  num_typos: z.string().optional().default('2'),
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(10),
  group_by: z.string().optional(),
  group_limit: z.number().optional().default(3),
  include_fields: z.string().optional(),
  exclude_fields: z.string().optional(),
  highlight_fields: z.string().optional(),
  highlight_full_fields: z.string().optional(),
  highlight_affix_num_tokens: z.number().optional().default(3),
  highlight_start_tag: z.string().optional().default('<mark>'),
  highlight_end_tag: z.string().optional().default('</mark>'),
  snippet_threshold: z.number().optional().default(30),
  drop_tokens_threshold: z.number().optional().default(10),
  typo_tokens_threshold: z.number().optional().default(100),
  pinned_hits: z.string().optional(),
  hidden_hits: z.string().optional(),
  limit_hits: z.number().optional(),
  search_cutoff_ms: z.number().optional(),
  exhaustive_search: z.boolean().optional().default(false),
  use_cache: z.boolean().optional().default(true),
  cache_ttl: z.number().optional().default(60),
  min_len_1typo: z.number().optional().default(4),
  min_len_2typo: z.number().optional().default(7),
  split_join_tokens: z.enum(['off', 'always', 'fallback']).optional().default('fallback'),
  vector_query: z.string().optional(),
  remote_embedding_timeout_ms: z.number().optional().default(30000),
  remote_embedding_num_tries: z.number().optional().default(2)
});

export type SearchParameters = z.infer<typeof SearchParametersSchema>;

// Search Result Schema
export const SearchHitSchema = z.object({
  document: z.record(z.any()),
  highlight: z.record(z.object({
    matched_tokens: z.array(z.string()),
    snippet: z.string()
  })).optional(),
  highlights: z.array(z.object({
    field: z.string(),
    matched_tokens: z.array(z.string()),
    snippet: z.string()
  })).optional(),
  text_match: z.number().optional(),
  text_match_info: z.object({
    best_field_score: z.string(),
    best_field_weight: z.number(),
    fields_matched: z.number(),
    score: z.string(),
    tokens_matched: z.number()
  }).optional()
});

export type SearchHit = z.infer<typeof SearchHitSchema>;

export const FacetCountSchema = z.object({
  counts: z.array(z.object({
    count: z.number(),
    highlighted: z.string(),
    value: z.string()
  })),
  field_name: z.string(),
  stats: z.object({
    avg: z.number().optional(),
    max: z.number().optional(),
    min: z.number().optional(),
    sum: z.number().optional(),
    total_values: z.number()
  }).optional()
});

export type FacetCount = z.infer<typeof FacetCountSchema>;

export const SearchResultSchema = z.object({
  facet_counts: z.array(FacetCountSchema).optional(),
  found: z.number(),
  hits: z.array(SearchHitSchema).optional(),
  out_of: z.number(),
  page: z.number(),
  request_params: z.record(z.any()),
  search_cutoff: z.boolean(),
  search_time_ms: z.number()
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// Multi-Search Schema
export const MultiSearchRequestSchema = z.object({
  searches: z.array(SearchParametersSchema.extend({
    collection: z.string(),
    preset: z.string().optional()
  }))
});

export type MultiSearchRequest = z.infer<typeof MultiSearchRequestSchema>;

export const MultiSearchResultSchema = z.object({
  results: z.array(SearchResultSchema)
});

export type MultiSearchResult = z.infer<typeof MultiSearchResultSchema>;

// Document Operations Schema
export const DocumentSchema = z.record(z.any());
export type Document = z.infer<typeof DocumentSchema>;

export const DocumentCreateResponseSchema = z.object({
  id: z.string(),
  success: z.boolean().optional()
});

export type DocumentCreateResponse = z.infer<typeof DocumentCreateResponseSchema>;

// Conversation/RAG Schema
export const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export const ConversationRequestSchema = z.object({
  model: z.string(),
  context: z.string().optional(),
  conversation: z.array(ConversationMessageSchema),
  search_config: z.object({
    collection: z.string(),
    query_by: z.string(),
    filter_by: z.string().optional(),
    per_page: z.number().optional().default(5)
  }),
  max_tokens: z.number().optional().default(500),
  temperature: z.number().optional().default(0.7)
});

export type ConversationRequest = z.infer<typeof ConversationRequestSchema>;

export const ConversationResponseSchema = z.object({
  conversation: z.array(ConversationMessageSchema),
  context_documents: z.array(z.object({
    id: z.string(),
    document: z.record(z.any()),
    relevance_score: z.number().optional()
  })).optional(),
  model_used: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number()
  }).optional()
});

export type ConversationResponse = z.infer<typeof ConversationResponseSchema>;

// Vector Search Specific Types
export const VectorQuerySchema = z.object({
  vector_field: z.string(),
  vector: z.array(z.number()).optional(),
  k: z.number().optional().default(10),
  distance_threshold: z.number().optional(),
  ef: z.number().optional() // HNSW search parameter
});

export type VectorQuery = z.infer<typeof VectorQuerySchema>;

// Embedding Model Configuration
export const EmbeddingModelConfigSchema = z.object({
  model_name: z.string(),
  api_key: z.string().optional(),
  api_url: z.string().optional(),
  model_params: z.record(z.any()).optional(),
  dimensions: z.number().optional(),
  max_text_length: z.number().optional().default(8192)
});

export type EmbeddingModelConfig = z.infer<typeof EmbeddingModelConfigSchema>;

// Error Response Schema
export const TypesenseErrorSchema = z.object({
  message: z.string(),
  httpStatus: z.number(),
  requestId: z.string().optional()
});

export type TypesenseError = z.infer<typeof TypesenseErrorSchema>;

// Server Stats Schema
export const ServerStatsSchema = z.object({
  memory_used_bytes: z.number(),
  memory_total_bytes: z.number(),
  memory_active_bytes: z.number(),
  memory_mapped_bytes: z.number(),
  disk_used_bytes: z.number(),
  pending_search_requests: z.number(),
  pending_write_requests: z.number()
});

export type ServerStats = z.infer<typeof ServerStatsSchema>;

// Collection Stats Schema
export const CollectionStatsSchema = z.object({
  name: z.string(),
  num_documents: z.number(),
  num_memory_shards: z.number(),
  num_disk_shards: z.number()
});

export type CollectionStats = z.infer<typeof CollectionStatsSchema>;

// Utility Types for Bookmark-specific schemas
export const BookmarkDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  description: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  domain: z.string(),
  date_added: z.number(),
  date_modified: z.number(),
  visit_count: z.number().optional(),
  is_favorite: z.boolean().optional(),
  category: z.string().optional(),
  author: z.string().optional()
});

export type BookmarkDocument = z.infer<typeof BookmarkDocumentSchema>;

export const ProductDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  brand: z.string(),
  price: z.number(),
  rating: z.number(),
  review_count: z.number(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  in_stock: z.boolean(),
  created_at: z.number()
});

export type ProductDocument = z.infer<typeof ProductDocumentSchema>;

// Search Options for different use cases
export const BookmarkSearchOptionsSchema = z.object({
  filter_by: z.string().optional(),
  sort_by: z.string().optional(),
  per_page: z.number().optional().default(20),
  page: z.number().optional().default(1),
  include_favorites_only: z.boolean().optional().default(false),
  date_range: z.object({
    start: z.number(),
    end: z.number()
  }).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export type BookmarkSearchOptions = z.infer<typeof BookmarkSearchOptionsSchema>;

export const ProductSearchOptionsSchema = z.object({
  filter_by: z.string().optional(),
  sort_by: z.string().optional(),
  per_page: z.number().optional().default(20),
  page: z.number().optional().default(1),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  min_rating: z.number().optional(),
  categories: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
  in_stock_only: z.boolean().optional().default(false),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional()
});

export type ProductSearchOptions = z.infer<typeof ProductSearchOptionsSchema>;

// Export all schemas for runtime validation
export const TypesenseSchemas = {
  ClientConfig: ClientConfigSchema,
  CollectionField: CollectionFieldSchema,
  Collection: CollectionSchema,
  SearchParameters: SearchParametersSchema,
  SearchResult: SearchResultSchema,
  MultiSearchRequest: MultiSearchRequestSchema,
  MultiSearchResult: MultiSearchResultSchema,
  Document: DocumentSchema,
  ConversationRequest: ConversationRequestSchema,
  ConversationResponse: ConversationResponseSchema,
  VectorQuery: VectorQuerySchema,
  EmbeddingModelConfig: EmbeddingModelConfigSchema,
  TypesenseError: TypesenseErrorSchema,
  ServerStats: ServerStatsSchema,
  BookmarkDocument: BookmarkDocumentSchema,
  ProductDocument: ProductDocumentSchema,
  BookmarkSearchOptions: BookmarkSearchOptionsSchema,
  ProductSearchOptions: ProductSearchOptionsSchema
} as const;