// Basic Typesense Client Setup and Usage Examples with Vector Search
import { Client } from 'typesense';

// Basic client initialization for Bun/TypeScript projects
const client = new Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || 'localhost',
    port: Number(process.env.TYPESENSE_PORT) || 8108,
    protocol: 'http'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 10,
  retryIntervalSeconds: 2,
  numRetries: 3,
  logLevel: 'info'
});

// Multi-node setup with failover
const multiNodeClient = new Client({
  nodes: [
    { host: 'node1.example.com', port: 443, protocol: 'https' },
    { host: 'node2.example.com', port: 443, protocol: 'https' },
    { host: 'node3.example.com', port: 443, protocol: 'https' }
  ],
  apiKey: process.env.TYPESENSE_API_KEY || 'your-api-key',
  connectionTimeoutSeconds: 10,
  numRetries: 3,
  retryIntervalSeconds: 1,
  healthcheckIntervalSeconds: 60
});

// Browser-safe client (search-only API key)
const searchClient = new Client({
  nodes: [{
    host: 'search.example.com',
    port: 443,
    protocol: 'https'
  }],
  apiKey: 'search-only-api-key', // Restricted to search operations only
  connectionTimeoutSeconds: 5
});

// Collection schema with embedding field for semantic search
const bookmarkSchema = {
  name: 'bookmarks',
  fields: [
    { name: 'id', type: 'string', facet: false },
    { name: 'title', type: 'string', facet: false },
    { name: 'url', type: 'string', facet: false },
    { name: 'description', type: 'string', facet: false, optional: true },
    { name: 'content', type: 'string', facet: false, optional: true },
    { name: 'tags', type: 'string[]', facet: true, optional: true },
    { name: 'domain', type: 'string', facet: true },
    { name: 'date_added', type: 'int64', sort: true },
    { name: 'date_modified', type: 'int64', sort: true },
    { name: 'visit_count', type: 'int32', facet: true, sort: true, optional: true },
    { name: 'is_favorite', type: 'bool', facet: true, optional: true },
    // Vector embedding field for semantic search
    { 
      name: 'embedding', 
      type: 'float[]', 
      embed: {
        from: ['title', 'description', 'content'],
        model_config: {
          model_name: 'ts/e5-small' // Built-in model, or use OpenAI API
        }
      }
    }
  ],
  default_sorting_field: 'date_modified'
};

// Create collection with vector search capabilities
async function createBookmarkCollection() {
  try {
    await client.collections().create(bookmarkSchema);
    console.log('Collection with vector search created successfully');
  } catch (error: any) {
    if (error.httpStatus === 409) {
      console.log('Collection already exists');
    } else {
      console.error('Error creating collection:', error);
      throw error;
    }
  }
}

// Health check with detailed output
async function checkHealth() {
  try {
    const health = await client.health.retrieve();
    console.log('Typesense server health:', health);
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// Get comprehensive server stats
async function getStats() {
  try {
    const stats = await client.stats.retrieve();
    console.log('Server statistics:', {
      memory_used_bytes: stats.memory_used_bytes,
      memory_total_bytes: stats.memory_total_bytes,
      memory_active_bytes: stats.memory_active_bytes,
      memory_mapped_bytes: stats.memory_mapped_bytes,
      disk_used_bytes: stats.disk_used_bytes
    });
    return stats;
  } catch (error) {
    console.error('Failed to get stats:', error);
    throw error;
  }
}

// List all collections
async function listCollections() {
  try {
    const collections = await client.collections().retrieve();
    console.log('Available collections:', collections.map((c: any) => c.name));
    return collections;
  } catch (error) {
    console.error('Failed to list collections:', error);
    throw error;
  }
}

// Add bookmark with automatic embedding generation
async function addBookmark(bookmark: any) {
  try {
    const result = await client.collections('bookmarks')
      .documents()
      .create({
        ...bookmark,
        date_added: bookmark.date_added || Date.now(),
        date_modified: bookmark.date_modified || Date.now()
      });
    
    console.log('Bookmark added with embedding:', result.id);
    return result;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
}

// Basic text search
async function searchBookmarks(query: string, options: any = {}) {
  try {
    const searchParams = {
      q: query,
      query_by: 'title,description,content',
      filter_by: options.filter_by || '',
      facet_by: 'tags,domain,is_favorite',
      sort_by: options.sort_by || 'date_modified:desc',
      per_page: options.per_page || 20,
      page: options.page || 1,
      include_fields: 'id,title,url,description,tags,domain,date_added',
      highlight_fields: 'title,description',
      highlight_start_tag: '<mark>',
      highlight_end_tag: '</mark>',
      typo_tokens_threshold: 1,
      drop_tokens_threshold: 1
    };

    const results = await client.collections('bookmarks')
      .documents()
      .search(searchParams);
    
    console.log(`Found ${results.found} bookmarks`);
    return results;
  } catch (error) {
    console.error('Error searching bookmarks:', error);
    throw error;
  }
}

// Semantic search using embeddings
async function semanticSearch(query: string, options: any = {}) {
  try {
    const searchParams = {
      q: query,
      query_by: 'embedding',
      filter_by: options.filter_by || '',
      per_page: options.per_page || 20,
      include_fields: 'id,title,url,description,tags,domain',
      exclude_fields: 'embedding' // Don't return large embedding vectors
    };

    const results = await client.collections('bookmarks')
      .documents()
      .search(searchParams);
    
    console.log(`Semantic search found ${results.found} similar bookmarks`);
    return results;
  } catch (error) {
    console.error('Error in semantic search:', error);
    throw error;
  }
}

// Hybrid search (keyword + semantic)
async function hybridSearch(query: string, options: any = {}) {
  try {
    const searchParams = {
      q: query,
      query_by: 'title,description,content,embedding',
      filter_by: options.filter_by || '',
      facet_by: 'tags,domain',
      per_page: options.per_page || 20,
      include_fields: 'id,title,url,description,tags,domain',
      highlight_fields: 'title,description',
      highlight_start_tag: '<mark>',
      highlight_end_tag: '</mark>'
    };

    const results = await client.collections('bookmarks')
      .documents()
      .search(searchParams);
    
    console.log(`Hybrid search found ${results.found} bookmarks`);
    return results;
  } catch (error) {
    console.error('Error in hybrid search:', error);
    throw error;
  }
}

// Faceted search to get categories/filters
async function getFacets(options: any = {}) {
  try {
    const searchParams = {
      q: '*',
      query_by: 'title',
      facet_by: 'tags,domain,is_favorite',
      max_facet_values: 50,
      per_page: 0 // Don't return documents, just facets
    };

    const results = await client.collections('bookmarks')
      .documents()
      .search(searchParams);
    
    return results.facet_counts;
  } catch (error) {
    console.error('Error getting facets:', error);
    throw error;
  }
}

// Comprehensive example demonstrating all features
async function comprehensiveExample() {
  console.log('=== Typesense Comprehensive Example ===');
  
  // 1. Check server health
  await checkHealth();
  
  // 2. Get server stats
  await getStats();
  
  // 3. Create collection with vector search
  await createBookmarkCollection();
  
  // 4. Add sample bookmarks
  const bookmarks = [
    {
      id: '1',
      title: 'TypeScript Handbook',
      url: 'https://www.typescriptlang.org/docs/',
      description: 'The official TypeScript documentation and guide',
      content: 'Learn TypeScript programming language features and advanced concepts',
      tags: ['typescript', 'programming', 'documentation'],
      domain: 'typescriptlang.org',
      is_favorite: true,
      visit_count: 15
    },
    {
      id: '2', 
      title: 'Typesense Vector Search Guide',
      url: 'https://typesense.org/docs/guide/vector-search.html',
      description: 'Learn how to implement semantic search with Typesense embeddings',
      content: 'Vector search semantic similarity embeddings machine learning',
      tags: ['typesense', 'vector-search', 'ai'],
      domain: 'typesense.org',
      is_favorite: false,
      visit_count: 3
    },
    {
      id: '3',
      title: 'Bun Runtime Documentation',
      url: 'https://bun.sh/docs',
      description: 'Fast all-in-one JavaScript runtime',
      content: 'Bun is a fast JavaScript runtime bundle transpiler package manager',
      tags: ['bun', 'javascript', 'runtime'],
      domain: 'bun.sh',
      is_favorite: true,
      visit_count: 8
    }
  ];

  for (const bookmark of bookmarks) {
    await addBookmark(bookmark);
  }

  console.log('\n=== Search Examples ===');
  
  // 5. Text search
  console.log('\n--- Text Search for "typescript" ---');
  const textResults = await searchBookmarks('typescript');
  console.log('Text search results:', textResults.hits?.length);

  // 6. Semantic search
  console.log('\n--- Semantic Search for "programming language guide" ---');
  const semanticResults = await semanticSearch('programming language guide');
  console.log('Semantic search results:', semanticResults.hits?.length);

  // 7. Hybrid search
  console.log('\n--- Hybrid Search for "fast runtime" ---');
  const hybridResults = await hybridSearch('fast runtime');
  console.log('Hybrid search results:', hybridResults.hits?.length);

  // 8. Faceted search
  console.log('\n--- Getting Facets ---');
  const facets = await getFacets();
  console.log('Available facets:', Object.keys(facets || {}));

  // 9. Filtered search
  console.log('\n--- Filtered Search (favorites only) ---');
  const filteredResults = await searchBookmarks('*', {
    filter_by: 'is_favorite:true',
    sort_by: 'visit_count:desc'
  });
  console.log('Filtered results:', filteredResults.hits?.length);

  console.log('\n=== Example Complete ===');
}

export {
  client,
  multiNodeClient,
  searchClient,
  bookmarkSchema,
  createBookmarkCollection,
  checkHealth,
  getStats,
  listCollections,
  addBookmark,
  searchBookmarks,
  semanticSearch,
  hybridSearch,
  getFacets,
  comprehensiveExample
};