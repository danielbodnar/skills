# Typesense Reference

**Always remember to reference @$HOME/.claude/references/typesense.md and look for snippets and examples in @$HOME/.claude/snippets/typesense/**

## Quick Reference

- Installation: `bun add typesense`
- Import: `import Typesense from 'typesense'`
- Documentation: <https://typesense.org/docs/>
- GitHub: <https://github.com/typesense/typesense>
- JavaScript Client: <https://github.com/typesense/typesense-js>
- Package: <https://www.npmjs.com/package/typesense>

## Resources and Documentation

- [Typesense Documentation](https://typesense.org/docs/)
  - [Getting Started](https://typesense.org/docs/guide/)
  - [API Reference](https://typesense.org/docs/api/)
    - [Collection Management](https://typesense.org/docs/api/collections.html)
    - [Document Management](https://typesense.org/docs/api/documents.html)
    - [Search API](https://typesense.org/docs/api/search.html)
    - [Authentication](https://typesense.org/docs/api/authentication.html)
  - [JavaScript Client Guide](https://typesense.org/docs/guide/install-typesense.html#option-2-local-development-install)
  - [Configuration](https://typesense.org/docs/guide/configure-typesense.html)
  - [Migration Guides](https://typesense.org/docs/guide/migration.html)
- [Community Resources](https://typesense.org/community/)
  - [Slack Community](https://typesense.org/slack)
  - [GitHub Discussions](https://github.com/typesense/typesense/discussions)
  - [Blog Posts](https://typesense.org/blog/)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/typesense/`:

- Basic client setup and configuration patterns
- Collection creation and management
- Document indexing and management
- Search query patterns and filtering
- Vector search and semantic search
- Authentication and security patterns
- Error handling and retry logic
- Performance optimization techniques
- Integration with frontend frameworks
- Testing patterns and mock data

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/typesense/schemas/`

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/typesense/linting/`

## Installation and Setup

### Server Installation

```bash
# Docker (recommended for development)
docker run -p 8108:8108 -v/tmp/data:/data typesense/typesense:29.0 --data-dir /data --api-key=YOUR_API_KEY

# Cloud hosting available at https://cloud.typesense.org/
```

### Client Installation

```bash
# Using Bun (recommended)
bun add typesense

# Using npm
npm install typesense

# Using yarn
yarn add typesense

# CDN for browsers
<script src="https://cdn.jsdelivr.net/npm/typesense@2/dist/typesense.min.js"></script>
```

## Core APIs and Methods

### Client Configuration

- `new Typesense.Client(config)` - Initialize client with nodes and API key
- Connection timeout and retry configuration
- Node failover and load balancing
- Search-only vs admin API keys

### Collection Management

- `client.collections().create(schema)` - Create collection with schema
- `client.collections().retrieve()` - List all collections
- `client.collections(name).retrieve()` - Get collection details
- `client.collections(name).update(schema)` - Update collection schema
- `client.collections(name).delete()` - Delete collection

### Document Operations

- `client.collections(name).documents().create(doc)` - Index single document
- `client.collections(name).documents().import(docs)` - Batch import
- `client.collections(name).documents(id).retrieve()` - Get document by ID
- `client.collections(name).documents(id).update(doc)` - Update document
- `client.collections(name).documents(id).delete()` - Delete document
- `client.collections(name).documents().export()` - Export all documents

### Search Operations

- `client.collections(name).documents().search(params)` - Full-text search
- Vector search with automatic embeddings
- Semantic search using built-in ML models
- Hybrid search (keyword + semantic)
- Conversational search (RAG) with context
- Faceted search and filtering
- Geospatial search capabilities
- Synonym and typo tolerance
- Search analytics and insights

### Advanced Features

- Multi-collection search
- Federated search across multiple Typesense clusters
- Curation and merchandising
- A/B testing for search results
- Real-time analytics and monitoring

## Key Configuration Options

### Client Configuration

```typescript
interface ClientConfig {
  nodes: Array<{
    host: string;
    port: number;
    protocol: 'http' | 'https';
  }>;
  apiKey: string;
  connectionTimeoutSeconds?: number;
  numRetries?: number;
  retryIntervalSeconds?: number;
  healthcheckIntervalSeconds?: number;
  nearestNode?: Node;
  logger?: Logger;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
```

### Collection Schema

```typescript
interface CollectionSchema {
  name: string;
  fields: Array<{
    name: string;
    type: 'string' | 'int32' | 'int64' | 'float' | 'bool' | 'geopoint' | 'string[]' | 'int32[]' | 'int64[]' | 'float[]' | 'bool[]' | 'geopoint[]';
    facet?: boolean;
    optional?: boolean;
    index?: boolean;
    sort?: boolean;
    infix?: boolean;
    locale?: string;
    stem?: boolean;
    embed?: {
      from: string[];
      model_config: {
        model_name: string;
      };
    };
  }>;
  default_sorting_field?: string;
  token_separators?: string[];
  symbols_to_index?: string[];
  enable_nested_fields?: boolean;
}
```

### Search Parameters

```typescript
interface SearchParameters {
  q: string;
  query_by: string;
  query_by_weights?: string;
  prefix?: boolean | string;
  filter_by?: string;
  sort_by?: string;
  facet_by?: string;
  max_facet_values?: number;
  facet_query?: string;
  num_typos?: string;
  page?: number;
  per_page?: number;
  group_by?: string;
  group_limit?: number;
  include_fields?: string;
  exclude_fields?: string;
  highlight_fields?: string;
  highlight_full_fields?: string;
  highlight_affix_num_tokens?: number;
  highlight_start_tag?: string;
  highlight_end_tag?: string;
  snippet_threshold?: number;
  drop_tokens_threshold?: number;
  typo_tokens_threshold?: number;
  pinned_hits?: string;
  hidden_hits?: string;
  limit_hits?: number;
  search_cutoff_ms?: number;
  exhaustive_search?: boolean;
  use_cache?: boolean;
  cache_ttl?: number;
  min_len_1typo?: number;
  min_len_2typo?: number;
  split_join_tokens?: 'off' | 'always' | 'fallback';
  vector_query?: string;
  remote_embedding_timeout_ms?: number;
  remote_embedding_num_tries?: number;
}
```

## Browser vs Server Usage

### Browser (Search-only API Key)

```typescript
const client = new Typesense.Client({
  nodes: [{
    host: 'your-typesense-server.com',
    port: 443,
    protocol: 'https'
  }],
  apiKey: 'search-only-api-key', // Only search operations allowed
  connectionTimeoutSeconds: 2
});
```

### Server (Admin API Key)

```typescript
const client = new Typesense.Client({
  nodes: [{
    host: 'localhost',
    port: 8108,
    protocol: 'http'
  }],
  apiKey: 'admin-api-key', // Full CRUD operations allowed
  connectionTimeoutSeconds: 2
});
```

## Error Handling Patterns

### Common Error Types

- `TypesenseError` - Base error class
- `ImportError` - Document import failures
- `ObjectNotFound` - Collection/document not found
- `ObjectAlreadyExists` - Collection already exists
- `ObjectUnprocessable` - Invalid schema or document
- `RequestMalformed` - Invalid request parameters
- `RequestUnauthorized` - Invalid API key
- `ServerError` - Internal server error

### Retry Logic

```typescript
const client = new Typesense.Client({
  // ... config
  numRetries: 3,
  retryIntervalSeconds: 0.1
});
```

## Performance Optimization

### Indexing Performance

- Use batch imports for large datasets
- Optimize field types and indexing options
- Configure appropriate token separators
- Use async operations where possible

### Search Performance

- Use appropriate page sizes
- Implement search result caching
- Optimize query structure and filters
- Use search analytics to improve relevance

### Memory and Storage

- Configure appropriate field options (index, facet, sort)
- Use data compaction features
- Monitor collection statistics
- Implement proper data lifecycle management

## Security Best Practices

### API Key Management

- Use search-only keys in client-side applications
- Rotate API keys regularly
- Implement proper key scoping
- Monitor API key usage

### Data Security

- Implement proper input validation
- Use HTTPS in production
- Configure appropriate CORS settings
- Implement rate limiting

## Integration Patterns

### Frontend Frameworks

- React with InstantSearch.js
- Vue.js integration patterns
- Angular integration
- Vanilla JavaScript implementations

### Backend Integration

- Express.js middleware
- Fastify plugins
- Next.js API routes
- Serverless function integration

### Third-party Services

- Firestore extension
- GatsbyJS plugin
- Algolia migration tools
- Elasticsearch migration utilities

## Vector Search and Embeddings

### Core Concepts

- **Automatic Embedding Generation**: Built-in ML models for text-to-vector conversion
- **Semantic Search**: Query by meaning rather than exact keywords
- **Hybrid Search**: Combine keyword and semantic search for best results
- **HNSW Index**: Hierarchical Navigable Small World for fast nearest-neighbor search
- **Distance Metrics**: Cosine similarity, L2, and dot product support

### Supported Embedding Models

- **Built-in Models**: ts/e5-small, ts/all-MiniLM-L6-v2, ts/all-MiniLM-L12-v2
- **OpenAI**: text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large
- **Google**: textembedding-gecko@001, textembedding-gecko-multilingual@001
- **Hugging Face**: Any sentence-transformers model
- **Custom ONNX**: Local ONNX models for on-premise deployments

### Embedding Field Configuration

```typescript
const schema = {
  name: 'documents',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'embedding', type: 'float[]', embed: {
      from: ['title', 'content'],
      model_config: {
        model_name: 'ts/e5-small',
        api_key: process.env.OPENAI_API_KEY  // If using external API
      }
    }}
  ]
};
```

### Semantic Search Examples

```typescript
// Pure semantic search
const semanticResults = await client.collections('documents')
  .documents()
  .search({
    q: 'machine learning tutorials',
    query_by: 'embedding',
    include_fields: 'title,content',
    per_page: 20
  });

// Hybrid search (keyword + semantic)
const hybridResults = await client.multi_search({
  searches: [{
    collection: 'documents',
    q: 'javascript frameworks',
    query_by: 'title,content,embedding',
    include_fields: 'title,content,url'
  }]
});
```

### Conversational Search (RAG)

```typescript
const response = await client.conversations.create({
  model: 'openai/gpt-3.5-turbo',
  context: 'You are a helpful assistant.',
  conversation: [
    { role: 'user', content: 'Find documents about React hooks' }
  ],
  search_config: {
    collection: 'documents',
    query_by: 'title,content,embedding'
  }
});
```

### Vector Search Performance

- **HNSW Parameters**: Configure ef_construction and M for speed vs accuracy
- **GPU Acceleration**: CUDA support for embedding generation
- **Batch Processing**: Efficient bulk operations
- **Caching**: Built-in result caching with TTL

### Natural Language Processing

- **Intent Recognition**: Automatic query categorization
- **Entity Extraction**: Identify dates, locations, names
- **Query Expansion**: Automatic synonym inclusion
- **Language Detection**: Multi-language search support
