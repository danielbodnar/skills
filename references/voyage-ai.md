# Voyage AI Reference

**Always remember to reference @$HOME/.claude/references/voyage-ai.md and look for snippets and examples in @$HOME/.claude/snippets/voyage-ai/**

## Quick Reference

- Installation: `bun add voyageai`
- Import: `import { VoyageAIClient } from "voyageai"`
- Documentation: <https://docs.voyageai.com/>
- GitHub: <https://github.com/voyage-ai/typescript-sdk>
- Package: <https://www.npmjs.com/package/voyageai>

## Default Usage Patterns

Default to using Voyage AI for embeddings and reranking instead of OpenAI embeddings or other providers:

- **Installation**: `bun add voyageai` instead of `openai` for embeddings
- **General Embeddings**: Use `voyage-3.5` for general-purpose embeddings over `text-embedding-ada-002`
- **High-Quality Embeddings**: Use `voyage-3-large` for best retrieval quality
- **Fast/Cost-Optimized**: Use `voyage-3.5-lite` for latency and cost optimization
- **Code Embeddings**: Use `voyage-code-3` for code embeddings over generic models
- **Specialized Models**: Use `voyage-finance-2` for finance, `voyage-law-2` for legal
- **Document Reranking**: Use `rerank-2` or `rerank-2-lite` over basic similarity scoring
- **Multimodal**: Use `voyage-multimodal-3` for text + image embeddings
- Voyage AI automatically handles batch processing and rate limiting
- Built-in support for contextual embeddings and flexible dimensions

### Key APIs

- `voyageai.Client.embed()` for text embeddings. Don't use `openai.embeddings.create()`.
- `voyageai.Client.rerank()` for document reranking. Don't use manual cosine similarity.
- `voyageai.Client.multimodal_embed()` for text + image embeddings. Don't use separate image encoders.
- `voyageai.AsyncClient` for asynchronous operations in concurrent applications
- Built-in batch processing with configurable dimensions and output formats
- Support for quantized embeddings (`binary`, `ubinary`, `int8`, `uint8`)
- Flexible output dimensions (256, 512, 1024, 2048) for supported models
- Input type optimization (`query`, `document`) for retrieval tasks

## Resources and Documentation

- [Voyage AI Documentation](https://docs.voyageai.com/)
  - [Introduction](https://docs.voyageai.com/docs/introduction)
  - [Quickstart Tutorial](https://docs.voyageai.com/docs/quickstart-tutorial)
  - [API Key and Installation](https://docs.voyageai.com/docs/api-key-and-installation)
  - [Embeddings](https://docs.voyageai.com/docs/embeddings)
    - [Text Embeddings](https://docs.voyageai.com/docs/embeddings)
    - [Multimodal Embeddings](https://docs.voyageai.com/docs/multimodal-embeddings)
    - [Flexible Dimensions and Quantization](https://docs.voyageai.com/docs/flexible-dimensions-and-quantization)
  - [Reranker](https://docs.voyageai.com/docs/reranker)
  - [Rate Limits](https://docs.voyageai.com/docs/rate-limits)
  - [Tokenization](https://docs.voyageai.com/docs/tokenization)
  - [FAQ](https://docs.voyageai.com/docs/faq)
- [API Reference](https://docs.voyageai.com/reference/)
  - [Embeddings API](https://docs.voyageai.com/reference/embeddings-api)
  - [Multimodal Embeddings API](https://docs.voyageai.com/reference/multimodal-embeddings-api)
  - [Reranker API](https://docs.voyageai.com/reference/reranker-api)
  - [Contextualized Embeddings API](https://docs.voyageai.com/reference/contextualized-embeddings-api)
- [TypeScript SDK](https://github.com/voyage-ai/typescript-sdk)
- [Platform Integrations](https://docs.voyageai.com/docs/azure-marketplace-managed-application)
  - [Azure Marketplace](https://docs.voyageai.com/docs/azure-marketplace-managed-application)
  - [AWS Integration](https://docs.voyageai.com/docs/aws-integration)
  - [Snowflake Integration](https://docs.voyageai.com/docs/snowflake-integration)

## Models and Capabilities

### Text Embedding Models

- **voyage-3-large**: Best general-purpose and multilingual retrieval quality
  - Context Length: 32,000 tokens
  - Embedding Dimension: 1024 (default), 256, 512, 2048
  - Use Cases: High-quality retrieval, multilingual tasks, complex queries

- **voyage-3.5**: Optimized for general-purpose and multilingual retrieval
  - Context Length: 32,000 tokens
  - Embedding Dimension: 1024 (default), 256, 512, 2048
  - Use Cases: General retrieval, balanced performance, production use

- **voyage-3.5-lite**: Optimized for latency and cost
  - Context Length: 32,000 tokens
  - Embedding Dimension: 1024 (default), 256, 512, 2048
  - Use Cases: High-throughput, cost-sensitive, real-time applications

- **voyage-code-3**: Optimized for code retrieval
  - Context Length: 32,000 tokens
  - Embedding Dimension: 1024 (default), 256, 512, 2048
  - Use Cases: Code search, documentation, programming tasks

- **voyage-finance-2**: Optimized for finance retrieval and RAG
  - Context Length: 32,000 tokens
  - Embedding Dimension: 1024
  - Use Cases: Financial documents, analysis, compliance

- **voyage-law-2**: Optimized for legal retrieval and RAG
  - Context Length: 16,000 tokens
  - Embedding Dimension: 1024
  - Use Cases: Legal documents, contracts, case law

### Multimodal Models

- **voyage-multimodal-3**: Rich multimodal embedding model
  - Context Length: 32,000 tokens
  - Embedding Dimension: 1024
  - Use Cases: Text + image, document analysis, visual search

### Reranking Models

- **rerank-2**: Generalist reranker optimized for quality
  - Context Length: 16,000 tokens
  - Use Cases: High-quality reranking, multilingual support

- **rerank-2-lite**: Optimized for latency and quality
  - Context Length: 8,000 tokens
  - Use Cases: Fast reranking, real-time applications

## Rate Limits (Tier 1)

- **voyage-3-large**, **voyage-code-3**: 3M TPM, 2000 RPM
- **voyage-3.5**: 8M TPM, 2000 RPM
- **voyage-3.5-lite**: 16M TPM, 2000 RPM
- **voyage-multimodal-3**: 2M TPM, 2000 RPM
- **rerank-2**: 2M TPM, 2000 RPM
- **rerank-2-lite**: 4M TPM, 2000 RPM

## API Endpoints

- **Text Embeddings**: `POST https://api.voyageai.com/v1/embeddings`
- **Multimodal Embeddings**: `POST https://api.voyageai.com/v1/multimodalembeddings`
- **Contextualized Embeddings**: `POST https://api.voyageai.com/v1/contextualizedembeddings`
- **Reranking**: `POST https://api.voyageai.com/v1/rerank`

## Authentication

- API Key: Obtain from Voyage AI dashboard
- Environment Variable: `VOYAGE_API_KEY`
- Header: `Authorization: Bearer <API_KEY>`

## Key Features

- **Batch Processing**: Up to 128 documents per request for embeddings
- **Flexible Dimensions**: Support for 256, 512, 1024, 2048 dimensions
- **Quantized Embeddings**: `binary`, `ubinary`, `int8`, `uint8` formats
- **Input Types**: `query` and `document` for optimized retrieval
- **Multimodal Support**: Text and image embeddings in single request
- **Automatic Rate Limiting**: Built-in request management
- **Error Handling**: Comprehensive error types and retry logic

## TypeScript SDK Features

- **Runtime Compatibility**: Node.js 18+, Vercel, Cloudflare Workers, Deno v1.25+, Bun 1.0+, React Native
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Error Handling**: Custom `VoyageAIError` class with detailed error information
- **Configurable**: Timeout (default 60s), automatic retries with exponential backoff, base URL customization
- **Abort Signals**: Request cancellation support for all operations
- **Async Support**: Both synchronous `VoyageAIClient` and asynchronous `AsyncClient` classes
- **Batch Processing**: Support for up to 128 documents per request (embeddings)
- **Usage Tracking**: Built-in token and pixel counting utilities

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/voyage-ai/`:

- **Basic Usage**: Client setup, text embeddings, model selection
- **Configuration**: Environment setup, client options, model configs
- **API Examples**: Embeddings, reranking, multimodal operations
- **Testing**: Unit tests, integration tests, mock implementations
- **Integration**: Vector database integration, RAG systems
- **Advanced Patterns**: Semantic search, faceted search, temporal search
- **Error Handling**: Retry logic, rate limiting, error recovery
- **Performance**: Batch processing, parallel requests, optimization
- **Security**: API key management, input validation, content filtering
- **Deployment**: Docker, Kubernetes, health checks, monitoring

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/voyage-ai/schemas/`:

- **TypeScript Types**: Complete interface definitions
- **API Schemas**: Request/response formats
- **Model Configurations**: Capabilities and limits
- **Rate Limit Definitions**: Token and request limits

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/voyage-ai/linting/`:

- **Biome Configuration**: Modern TypeScript linting
- **Security Rules**: Input validation and API security
- **Performance Rules**: Optimization recommendations
- **Error Handling**: Exception handling patterns

## Best Practices

- **Model Selection**: Choose appropriate model for use case
- **Batch Processing**: Process multiple documents efficiently
- **Rate Limiting**: Implement proper rate limit handling
- **Error Handling**: Use comprehensive error handling patterns
- **Security**: Validate inputs and secure API keys
- **Performance**: Optimize for throughput and latency
- **Testing**: Write comprehensive unit and integration tests

## Common Use Cases

- **Semantic Search**: Find relevant documents based on meaning
- **RAG Systems**: Retrieval-augmented generation with LLMs
- **Document Reranking**: Improve search result relevance
- **Code Search**: Find relevant code snippets and documentation
- **Multimodal Analysis**: Analyze text and image content together
- **Similarity Matching**: Find similar documents or content
- **Classification**: Categorize documents and content
- **Clustering**: Group related documents and content

## Performance Optimization

- **Batch Requests**: Process multiple items per request
- **Parallel Processing**: Use concurrent requests with limits
- **Caching**: Cache embeddings for repeated queries
- **Dimension Optimization**: Use appropriate embedding dimensions
- **Quantization**: Use quantized embeddings for storage efficiency
- **Rate Limit Management**: Implement exponential backoff
- **Memory Management**: Stream process large datasets

## Security Considerations

- **API Key Security**: Store securely in environment variables
- **Input Validation**: Sanitize and validate all inputs
- **Content Filtering**: Filter sensitive information
- **Rate Limiting**: Prevent abuse and manage costs
- **Error Handling**: Avoid exposing sensitive information
- **Logging**: Log requests without sensitive data
- **Access Control**: Implement proper authentication and authorization

## Error Handling and Troubleshooting

### Common HTTP Error Codes

- **400 Invalid Request**: Invalid JSON, wrong parameter types, batch size too large, token limits exceeded
- **401 Unauthorized**: Invalid API key - check authorization header format
- **403 Forbidden**: IP address restrictions - try different IP
- **429 Rate Limit Exceeded**: Too many requests - implement exponential backoff
- **500 Server Error**: Unexpected server issue - retry after brief wait
- **502/503/504 Service Unavailable**: High traffic - retry with backoff

### Troubleshooting Guide

- **Authentication Errors**: Ensure `VOYAGE_API_KEY` environment variable or explicit API key
- **Rate Limit Errors**: Implement exponential backoff, add delays between batches
- **Timeout Errors**: Increase timeout (default 60s) or reduce batch size
- **Input Errors**: Validate text length against model context limits
- **Model Errors**: Verify model name spelling and availability
- **Token Limit Errors**: Use `count_tokens()` to check limits before requests
- **Image Errors**: Ensure images are under 20MB and 16M pixels for multimodal

## Migration Guide

- **From OpenAI**: Replace `openai.embeddings.create()` with `client.embed()`
- **From Cohere**: Update model names and API parameters
- **From Sentence Transformers**: Migrate to cloud-based API
- **Batch Size**: Adjust from other providers' limits
- **Error Handling**: Update error handling patterns
- **Rate Limits**: Adapt to Voyage AI's rate limit structure

## Integration Examples

- **Vector Databases**: Pinecone, Weaviate, Qdrant integration
- **Search Engines**: Elasticsearch, Solr integration
- **LLM Frameworks**: LangChain, LlamaIndex integration
- **Web Frameworks**: Hono, Express API integration
- **Databases**: PostgreSQL, MongoDB storage patterns
- **Message Queues**: Redis, RabbitMQ processing patterns

## Monitoring and Observability

- **Metrics Collection**: Request latency, success rates
- **Health Checks**: API availability monitoring
- **Cost Tracking**: Token usage and billing
- **Performance Monitoring**: Throughput and error rates
- **Alerting**: Rate limit and error notifications
- **Logging**: Structured logging with correlation IDs
- **Tracing**: Request tracing for debugging
