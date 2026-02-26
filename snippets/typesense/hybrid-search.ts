// Typesense Hybrid Search Examples - Combining Keyword and Semantic Search
import { Client } from 'typesense';

const client = new Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || 'localhost',
    port: Number(process.env.TYPESENSE_PORT) || 8108,
    protocol: 'http'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 10
});

// Product search schema optimized for e-commerce hybrid search
const productSchema = {
  name: 'products',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string', facet: false },
    { name: 'description', type: 'string', facet: false },
    { name: 'category', type: 'string', facet: true },
    { name: 'brand', type: 'string', facet: true },
    { name: 'price', type: 'float', sort: true },
    { name: 'rating', type: 'float', facet: true, sort: true },
    { name: 'review_count', type: 'int32', sort: true },
    { name: 'tags', type: 'string[]', facet: true, optional: true },
    { name: 'color', type: 'string', facet: true, optional: true },
    { name: 'size', type: 'string', facet: true, optional: true },
    { name: 'material', type: 'string', facet: true, optional: true },
    { name: 'in_stock', type: 'bool', facet: true },
    { name: 'created_at', type: 'int64', sort: true },
    
    // Multiple embeddings for different use cases
    { 
      name: 'name_embedding', 
      type: 'float[]', 
      embed: {
        from: ['name'],
        model_config: {
          model_name: 'ts/e5-small' // Fast for name matching
        }
      }
    },
    { 
      name: 'description_embedding', 
      type: 'float[]', 
      embed: {
        from: ['description'],
        model_config: {
          model_name: 'ts/all-MiniLM-L6-v2' // Better for longer text
        }
      }
    },
    { 
      name: 'combined_embedding', 
      type: 'float[]', 
      embed: {
        from: ['name', 'description', 'category', 'brand'],
        model_config: {
          model_name: 'ts/all-MiniLM-L6-v2'
        }
      }
    }
  ],
  default_sorting_field: 'rating'
};

async function createProductCollection() {
  try {
    await client.collections().create(productSchema);
    console.log('Product collection created for hybrid search');
  } catch (error: any) {
    if (error.httpStatus === 409) {
      console.log('Product collection already exists');
    } else {
      throw error;
    }
  }
}

// Basic hybrid search combining text and semantic search
async function basicHybridSearch(query: string, options: any = {}) {
  try {
    const searchParams = {
      q: query,
      // Combine text fields with embedding fields
      query_by: 'name,description,brand,name_embedding,description_embedding',
      // Weight the fields - embeddings get higher priority for semantic matching
      query_by_weights: '2,1,1,4,3',
      filter_by: options.filter_by || '',
      facet_by: 'category,brand,color,rating,in_stock',
      sort_by: options.sort_by || '_text_match:desc,rating:desc',
      per_page: options.per_page || 20,
      page: options.page || 1,
      include_fields: 'id,name,description,brand,price,rating,category,color,in_stock',
      exclude_fields: 'name_embedding,description_embedding,combined_embedding',
      highlight_fields: 'name,description',
      highlight_start_tag: '<mark>',
      highlight_end_tag: '</mark>',
      typo_tokens_threshold: 1,
      num_typos: '1,1' // Allow 1 typo for 1-4 char words, 1 for 5+ char words
    };

    const results = await client.collections('products')
      .documents()
      .search(searchParams);
    
    console.log(`Hybrid search found ${results.found} products`);
    return results;
  } catch (error) {
    console.error('Error in basic hybrid search:', error);
    throw error;
  }
}

// Advanced hybrid search with dynamic field weighting
async function advancedHybridSearch(query: string, options: any = {}) {
  try {
    const searchType = detectSearchType(query);
    let queryBy = '';
    let queryByWeights = '';
    
    switch (searchType) {
      case 'brand_focused':
        queryBy = 'brand,name,name_embedding,description_embedding';
        queryByWeights = '3,2,2,1';
        break;
      case 'descriptive':
        queryBy = 'description,description_embedding,name,combined_embedding';
        queryByWeights = '2,4,1,3';
        break;
      case 'product_name':
        queryBy = 'name,name_embedding,brand,combined_embedding';
        queryByWeights = '3,4,1,2';
        break;
      default:
        queryBy = 'name,description,brand,combined_embedding';
        queryByWeights = '2,1,1,3';
    }

    const searchParams = {
      q: query,
      query_by: queryBy,
      query_by_weights: queryByWeights,
      filter_by: buildAdvancedFilter(options),
      facet_by: 'category,brand,color,rating,price,in_stock',
      sort_by: options.sort_by || '_text_match:desc,rating:desc',
      per_page: options.per_page || 20,
      include_fields: 'id,name,description,brand,price,rating,review_count,category,color,in_stock',
      highlight_fields: 'name,description',
      highlight_affix_num_tokens: 2,
      group_by: options.group_by || '',
      group_limit: options.group_limit || 3
    };

    const results = await client.collections('products')
      .documents()
      .search(searchParams);
    
    console.log(`Advanced hybrid search (${searchType}) found ${results.found} products`);
    return {
      ...results,
      search_type: searchType,
      query_strategy: { queryBy, queryByWeights }
    };
  } catch (error) {
    console.error('Error in advanced hybrid search:', error);
    throw error;
  }
}

// Multi-search for different search strategies
async function multiStrategySearch(query: string, options: any = {}) {
  try {
    const searches = [
      // Strategy 1: Text-focused search
      {
        collection: 'products',
        q: query,
        query_by: 'name,description,brand',
        filter_by: options.filter_by || '',
        per_page: 10,
        include_fields: 'id,name,brand,price,rating',
        preset: 'text_search'
      },
      
      // Strategy 2: Semantic-focused search
      {
        collection: 'products',
        q: query,
        query_by: 'combined_embedding',
        filter_by: options.filter_by || '',
        per_page: 10,
        include_fields: 'id,name,brand,price,rating',
        preset: 'semantic_search'
      },
      
      // Strategy 3: Balanced hybrid
      {
        collection: 'products',
        q: query,
        query_by: 'name,description,combined_embedding',
        query_by_weights: '2,1,3',
        filter_by: options.filter_by || '',
        per_page: 10,
        include_fields: 'id,name,brand,price,rating',
        preset: 'hybrid_search'
      },
      
      // Strategy 4: Brand and name focused
      {
        collection: 'products',
        q: query,
        query_by: 'brand,name,name_embedding',
        query_by_weights: '2,3,2',
        filter_by: options.filter_by || '',
        per_page: 10,
        include_fields: 'id,name,brand,price,rating',
        preset: 'brand_focused'
      }
    ];

    const results = await client.multi_search({ searches });
    
    console.log('Multi-strategy search completed');
    return {
      text_results: results.results[0],
      semantic_results: results.results[1], 
      hybrid_results: results.results[2],
      brand_results: results.results[3]
    };
  } catch (error) {
    console.error('Error in multi-strategy search:', error);
    throw error;
  }
}

// Personalized hybrid search based on user behavior
async function personalizedHybridSearch(query: string, userId: string, options: any = {}) {
  try {
    // Get user preferences/history (mock implementation)
    const userProfile = await getUserProfile(userId);
    
    // Adjust search weights based on user preferences
    let categoryBoost = '';
    let brandBoost = '';
    
    if (userProfile.preferred_categories?.length > 0) {
      categoryBoost = userProfile.preferred_categories.map((cat: string) => `category:${cat}^2`).join(' || ');
    }
    
    if (userProfile.preferred_brands?.length > 0) {
      brandBoost = userProfile.preferred_brands.map((brand: string) => `brand:${brand}^1.5`).join(' || ');
    }

    const searchParams = {
      q: query,
      query_by: 'name,description,brand,combined_embedding',
      query_by_weights: '2,1,1,3',
      filter_by: options.filter_by || '',
      facet_by: 'category,brand,price,rating',
      sort_by: '_text_match:desc,rating:desc',
      per_page: options.per_page || 20,
      include_fields: 'id,name,description,brand,price,rating,category',
      // Boost preferred categories and brands
      boost_by: [categoryBoost, brandBoost].filter(Boolean).join(',') || undefined,
      typo_tokens_threshold: userProfile.experience_level === 'expert' ? 0 : 1
    };

    const results = await client.collections('products')
      .documents()
      .search(searchParams);
    
    console.log(`Personalized search for user ${userId} found ${results.found} products`);
    return {
      ...results,
      personalization_applied: {
        preferred_categories: userProfile.preferred_categories,
        preferred_brands: userProfile.preferred_brands,
        experience_level: userProfile.experience_level
      }
    };
  } catch (error) {
    console.error('Error in personalized search:', error);
    throw error;
  }
}

// Contextual hybrid search with conversation awareness
async function contextualHybridSearch(query: string, context: any = {}, options: any = {}) {
  try {
    // Expand query based on conversation context
    let expandedQuery = query;
    if (context.previous_queries?.length > 0) {
      const recentQueries = context.previous_queries.slice(-2).join(' ');
      expandedQuery = `${recentQueries} ${query}`;
    }
    
    // Adjust search based on context
    let contextualFilter = options.filter_by || '';
    
    if (context.viewed_categories?.length > 0) {
      const categoryFilter = context.viewed_categories.map((cat: string) => `category:${cat}`).join(' || ');
      contextualFilter = contextualFilter 
        ? `${contextualFilter} && (${categoryFilter})`
        : categoryFilter;
    }
    
    if (context.price_range) {
      const priceFilter = `price:>=${context.price_range.min} && price:<=${context.price_range.max}`;
      contextualFilter = contextualFilter 
        ? `${contextualFilter} && ${priceFilter}`
        : priceFilter;
    }

    const searchParams = {
      q: expandedQuery,
      query_by: 'name,description,brand,combined_embedding',
      query_by_weights: '2,1,1,3',
      filter_by: contextualFilter,
      facet_by: 'category,brand,price,rating',
      sort_by: options.sort_by || '_text_match:desc,rating:desc',
      per_page: options.per_page || 20,
      include_fields: 'id,name,description,brand,price,rating,category'
    };

    const results = await client.collections('products')
      .documents()
      .search(searchParams);
    
    console.log(`Contextual search found ${results.found} products`);
    return {
      ...results,
      context_applied: context,
      expanded_query: expandedQuery !== query ? expandedQuery : null
    };
  } catch (error) {
    console.error('Error in contextual search:', error);
    throw error;
  }
}

// Helper function to detect search intent
function detectSearchType(query: string): string {
  const queryLower = query.toLowerCase();
  
  // Brand names or specific product patterns
  if (/\b(nike|adidas|apple|samsung|sony)\b/.test(queryLower)) {
    return 'brand_focused';
  }
  
  // Descriptive searches (adjectives, use cases)
  if (/\b(comfortable|lightweight|durable|waterproof|wireless|portable)\b/.test(queryLower)) {
    return 'descriptive';
  }
  
  // Specific product names or model numbers
  if (/\b(model|version|\d+)\b/.test(queryLower) || queryLower.length < 20) {
    return 'product_name';
  }
  
  return 'general';
}

// Helper function to build advanced filters
function buildAdvancedFilter(options: any): string {
  const filters = [];
  
  if (options.filter_by) filters.push(options.filter_by);
  if (options.min_price) filters.push(`price:>=${options.min_price}`);
  if (options.max_price) filters.push(`price:<=${options.max_price}`);
  if (options.min_rating) filters.push(`rating:>=${options.min_rating}`);
  if (options.in_stock_only) filters.push('in_stock:true');
  if (options.categories?.length > 0) {
    const categoryFilter = options.categories.map((cat: string) => `category:${cat}`).join(' || ');
    filters.push(`(${categoryFilter})`);
  }
  if (options.brands?.length > 0) {
    const brandFilter = options.brands.map((brand: string) => `brand:${brand}`).join(' || ');
    filters.push(`(${brandFilter})`);
  }
  
  return filters.join(' && ');
}

// Mock user profile function
async function getUserProfile(userId: string) {
  // Mock implementation - replace with actual user data
  return {
    preferred_categories: ['electronics', 'sports'],
    preferred_brands: ['apple', 'nike'],
    experience_level: 'intermediate',
    purchase_history: [],
    search_history: []
  };
}

// Comprehensive hybrid search example
async function hybridSearchExample() {
  console.log('=== Hybrid Search Example ===');
  
  // 1. Create collection
  await createProductCollection();
  
  // 2. Add sample products
  const products = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      description: 'Latest Apple smartphone with advanced camera system and titanium design',
      category: 'electronics',
      brand: 'Apple',
      price: 999.99,
      rating: 4.8,
      review_count: 1250,
      tags: ['smartphone', 'camera', 'premium'],
      color: 'titanium',
      in_stock: true,
      created_at: Date.now()
    },
    {
      id: '2',
      name: 'Nike Air Max 270',
      description: 'Comfortable running shoes with air cushioning technology for all-day comfort',
      category: 'footwear',
      brand: 'Nike',
      price: 129.99,
      rating: 4.5,
      review_count: 800,
      tags: ['running', 'comfort', 'casual'],
      color: 'black',
      size: '10',
      in_stock: true,
      created_at: Date.now()
    },
    {
      id: '3',
      name: 'Sony WH-1000XM5',
      description: 'Premium wireless noise-canceling headphones with exceptional sound quality',
      category: 'audio',
      brand: 'Sony',
      price: 349.99,
      rating: 4.7,
      review_count: 600,
      tags: ['wireless', 'noise-canceling', 'premium'],
      color: 'silver',
      in_stock: false,
      created_at: Date.now()
    }
  ];

  for (const product of products) {
    await client.collections('products').documents().create(product);
  }

  console.log('\n--- Basic Hybrid Search: "comfortable phone" ---');
  const basicResults = await basicHybridSearch('comfortable phone');
  console.log('Results:', basicResults.hits?.map((h: any) => h.document.name));

  console.log('\n--- Advanced Hybrid Search: "apple wireless" ---');
  const advancedResults = await advancedHybridSearch('apple wireless');
  console.log('Search type:', advancedResults.search_type);
  console.log('Results:', advancedResults.hits?.map((h: any) => h.document.name));

  console.log('\n--- Multi-Strategy Search: "premium audio" ---');
  const multiResults = await multiStrategySearch('premium audio');
  console.log('Text results:', multiResults.text_results.hits?.length);
  console.log('Semantic results:', multiResults.semantic_results.hits?.length);
  console.log('Hybrid results:', multiResults.hybrid_results.hits?.length);

  console.log('\n--- Personalized Search: "running gear" ---');
  const personalizedResults = await personalizedHybridSearch('running gear', 'user123');
  console.log('Personalized results:', personalizedResults.hits?.length);
  console.log('Personalization applied:', personalizedResults.personalization_applied);

  console.log('\n--- Contextual Search with filters ---');
  const contextualResults = await contextualHybridSearch('smartphone', {
    previous_queries: ['mobile phone', 'camera'],
    viewed_categories: ['electronics'],
    price_range: { min: 500, max: 1500 }
  });
  console.log('Contextual results:', contextualResults.hits?.length);

  console.log('\n=== Hybrid Search Example Complete ===');
}

export {
  client,
  productSchema,
  createProductCollection,
  basicHybridSearch,
  advancedHybridSearch,
  multiStrategySearch,
  personalizedHybridSearch,
  contextualHybridSearch,
  detectSearchType,
  buildAdvancedFilter,
  hybridSearchExample
};