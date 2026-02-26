# Orama Reference

**Always remember to reference @$HOME/.claude/references/orama.md and look for snippets and examples in @$HOME/.claude/snippets/orama/**

## Quick Reference

- Installation: `bun add @orama/orama`
- Cloud SDK: `bun add @oramacloud/client`
- Import: `import { create, insert, search } from '@orama/orama'`
- Documentation: <https://docs.orama.com/>
- GitHub: <https://github.com/oramasearch/orama>
- Package: <https://www.npmjs.com/package/@orama/orama>

## Resources and Documentation

- [Orama Documentation](https://docs.orama.com/)
  - [Getting Started](https://docs.orama.com/open-source)
  - [Open Source Usage](https://docs.orama.com/open-source/usage)
    - [Creating Database](https://docs.orama.com/open-source/usage/create)
    - [Search Operations](https://docs.orama.com/open-source/usage/search)
    - [Vector Search](https://docs.orama.com/open-source/usage/search/vector-search)
    - [Geosearch](https://docs.orama.com/open-source/usage/search/geosearch)
    - [TypeScript Support](https://docs.orama.com/open-source/usage/typescript)
  - [Plugins](https://docs.orama.com/open-source/plugins)
    - [Embeddings](https://docs.orama.com/open-source/plugins/plugin-embeddings)
    - [Analytics](https://docs.orama.com/open-source/plugins/plugin-analytics)
    - [Parsedoc](https://docs.orama.com/open-source/plugins/plugin-parsedoc)
    - [Data Persistence](https://docs.orama.com/open-source/plugins/plugin-data-persistence)
    - [Docusaurus](https://docs.orama.com/open-source/plugins/plugin-docusaurus)
    - [Astro](https://docs.orama.com/open-source/plugins/plugin-astro)
  - [Cloud Services](https://docs.orama.com/cloud)
    - [JavaScript SDK](https://docs.orama.com/cloud/integrating-orama-cloud/javascript-sdk)
    - [React SDK](https://docs.orama.com/cloud/integrating-orama-cloud/react-sdk)
    - [Search Operations](https://docs.orama.com/cloud/performing-search)
    - [Answer Engine](https://docs.orama.com/cloud/answer-engine)
    - [UI Components](https://docs.orama.com/cloud/ui-components)
  - [Internals](https://docs.orama.com/open-source/internals)
    - [Components](https://docs.orama.com/open-source/internals/components)
    - [Utilities](https://docs.orama.com/open-source/internals/utilities)
- [Community Resources](https://github.com/oramasearch/orama)
  - [GitHub Repository](https://github.com/oramasearch/orama)
  - [Examples](https://github.com/oramasearch/orama/tree/main/examples)
  - [Packages](https://github.com/oramasearch/orama/tree/main/packages)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/orama/`:

- Basic database creation and search operations
- Vector search implementation patterns
- Cloud SDK usage examples
- Plugin configuration and usage
- TypeScript integration patterns
- React/Vue component implementations
- Advanced search features (geosearch, facets, filters)
- Performance optimization techniques

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/orama/schemas/`:

- Database schema definitions
- Search result types
- Cloud API schemas
- Plugin configuration schemas

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/orama/linting/`:

- biome.json - Biome configuration for Orama projects
- TypeScript strict mode configurations

## Core Concepts

### Search Engine Types

- **Full-text Search**: Traditional keyword-based search with stemming and tokenization
- **Vector Search**: Semantic search using embeddings for meaning-based retrieval
- **Hybrid Search**: Combines full-text and vector search for optimal results
- **Geosearch**: Location-based search with radius and polygon filtering
- **Faceted Search**: Search with categorical filters and aggregations

### Database Operations

- **create()**: Initialize a new Orama database with schema
- **insert()**: Add documents to the database
- **insertMultiple()**: Batch insert multiple documents
- **remove()**: Delete documents from the database
- **update()**: Modify existing documents
- **search()**: Perform search queries with various modes

### Search Features

- **Typo Tolerance**: Automatic correction of spelling mistakes
- **Stemming**: Language-aware word reduction (30+ languages supported)
- **Filters**: Property-based result filtering
- **Facets**: Categorical aggregations and counting
- **Sorting**: Custom result ordering
- **Pagination**: Result limiting and offset support

## Default Usage Patterns

Default to using Orama for search functionality in JavaScript/TypeScript applications:

- Use `bun add @orama/orama` for open-source version
- Use `bun add @oramacloud/client` for cloud services
- Use `create()`, `insert()`, `search()` for basic operations
- Use `@orama/plugin-embeddings` for vector search capabilities
- Built-in TypeScript support with full type safety
- Plugin ecosystem for extended functionality

### Key APIs

#### Core Database Operations

```typescript
import { create, insert, search, remove, update } from '@orama/orama'

// Create database
const db = create({ schema: { title: 'string', content: 'string' } })

// Insert documents
insert(db, { title: 'Hello', content: 'World' })

// Search
const results = search(db, { term: 'hello' })
```

#### Cloud SDK Operations

```typescript
import { OramaClient } from '@oramacloud/client'

// Initialize client
const client = new OramaClient({
  endpoint: 'YOUR_ENDPOINT',
  api_key: 'YOUR_API_KEY'
})

// Perform search
const results = await client.search({ term: 'query' })
```

#### Vector Search with Embeddings

```typescript
import { pluginEmbeddings } from '@orama/plugin-embeddings'

// Configure embeddings plugin
const plugin = await pluginEmbeddings({
  embeddings: {
    defaultProperty: 'embeddings',
    onInsert: { generate: true, properties: ['content'] }
  }
})

// Create database with plugin
const db = await create({
  schema: { content: 'string', embeddings: 'vector[512]' },
  plugins: [plugin]
})
```

## Advanced Features

### TypeScript Integration

- Full type safety with schema inference
- TypedDocument interface for structured results
- Generic search parameters and results
- Custom type enrichment for non-indexed properties

### Plugin System

- **@orama/plugin-embeddings**: Automatic vector generation
- **@orama/plugin-analytics**: Usage analytics and insights
- **@orama/plugin-data-persistence**: Database serialization
- **@orama/plugin-parsedoc**: Document parsing and indexing
- **@orama/plugin-docusaurus**: Docusaurus integration
- **@orama/plugin-astro**: Astro framework integration

### React/Vue Components

- **@orama/react-components**: Search UI components
- **@orama/vue-components**: Vue.js search components
- **@orama/angular-components**: Angular search components
- **@orama/wc-components**: Web Components

### Cloud Features

- **Answer Engine**: AI-powered conversational search
- **Multi-index Search**: Search across multiple databases
- **Audience Management**: User segmentation and personalization
- **Analytics Dashboard**: Search performance insights
- **Global CDN**: 300+ edge locations worldwide

## Performance Characteristics

### Size and Speed

- **Bundle Size**: Less than 2kb minified and gzipped
- **Startup Time**: Near-instantaneous initialization
- **Search Speed**: Microsecond-level query execution
- **Memory Usage**: Minimal memory footprint
- **Indexing**: Real-time document indexing

### Scalability

- **Document Limit**: Handles millions of documents
- **Concurrent Searches**: High throughput search operations
- **Edge Deployment**: Runs on edge functions and workers
- **Browser Support**: Works in all modern browsers
- **Server Support**: Node.js, Bun, Deno, and edge runtimes

## Supported Data Types

### Schema Types

- **string**: Text content with full-text search
- **number**: Numeric values with range filtering
- **boolean**: Boolean values with exact matching
- **enum**: Predefined value sets
- **string[]**: Array of strings
- **number[]**: Array of numbers
- **vector[n]**: Vector embeddings of dimension n
- **geopoint**: Geographic coordinates for geosearch
- **date**: Date/time values with range support

### Nested Objects

- Support for nested object structures
- Deep property searching and filtering
- Hierarchical faceting and aggregation

## Integration Patterns

### Framework Integrations

- **Astro**: Static site generation with search
- **Docusaurus**: Documentation site search
- **Next.js**: Full-stack React applications
- **Nuxt**: Vue.js applications
- **Vite**: Modern build tool integration
- **Strapi**: Headless CMS integration

### Deployment Options

- **Edge Functions**: Vercel, Netlify, Cloudflare Workers
- **Serverless**: AWS Lambda, Azure Functions
- **Traditional Servers**: Node.js, Express, Fastify
- **Static Sites**: JAMstack deployments
- **Mobile Apps**: React Native, Ionic

## Security and Privacy

### Data Protection

- **Client-side Search**: No data leaves the browser
- **Encrypted Transit**: HTTPS/TLS encryption
- **API Key Management**: Secure authentication
- **GDPR Compliance**: Privacy-friendly design
- **No Tracking**: Optional analytics

### Access Control

- **API Key Authentication**: Secure endpoint access
- **Rate Limiting**: Request throttling
- **CORS Configuration**: Cross-origin restrictions
- **Index Permissions**: Fine-grained access control

## Migration and Upgrading

### From Other Search Solutions

- **Elasticsearch**: Direct schema and query migration
- **Algolia**: API-compatible migration path
- **Fuse.js**: Enhanced performance replacement
- **MiniSearch**: Drop-in replacement option
- **Lunr.js**: Modern alternative with better features

### Version Management

- **Semantic Versioning**: Predictable release cycles
- **Migration Guides**: Version-specific upgrade paths
- **Breaking Changes**: Clear documentation
- **Backward Compatibility**: Maintained when possible

## Troubleshooting

### Common Issues

- **Bundle Size**: Use tree shaking and dynamic imports
- **Memory Usage**: Implement pagination for large result sets
- **Performance**: Optimize schema design and indexing
- **TypeScript Errors**: Ensure proper type definitions
- **Plugin Conflicts**: Check plugin compatibility

### Debug Tools

- **Search Explain**: Query execution analysis
- **Performance Metrics**: Built-in timing information
- **Error Reporting**: Detailed error messages
- **Development Mode**: Enhanced debugging capabilities

## Community and Support

### Getting Help

- **Documentation**: Comprehensive guides and API reference
- **GitHub Issues**: Bug reports and feature requests
- **Community Forum**: Discussion and Q&A
- **Examples Repository**: Real-world implementation examples

### Contributing

- **Open Source**: Apache 2.0 license
- **GitHub**: <https://github.com/oramasearch/orama>
- **Pull Requests**: Community contributions welcome
- **Issue Tracking**: Feature requests and bug reports

## See Also

- Complete reference: `@$HOME/.claude/references/orama.md`
- Code examples: `@$HOME/.claude/snippets/orama/`
- Schemas: `@$HOME/.claude/snippets/orama/schemas/`
- Linting configs: `@$HOME/.claude/snippets/orama/linting/`
