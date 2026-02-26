// Typesense Search Examples and Patterns

import Typesense from 'typesense';

// Search parameter interfaces for type safety
interface SearchParams {
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
  vector_query?: string;
}

// Search manager class
class SearchManager {
  constructor(private client: Typesense.Client) {}

  // Basic text search
  async basicSearch(collectionName: string, query: string, fields: string[]) {
    const searchParams: SearchParams = {
      q: query,
      query_by: fields.join(','),
      per_page: 10
    };

    try {
      const results = await this.client
        .collections(collectionName)
        .documents()
        .search(searchParams);
      
      console.log(`Found ${results.found} results for "${query}"`);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  // Advanced search with filters and facets
  async advancedSearch(collectionName: string, params: SearchParams) {
    try {
      const results = await this.client
        .collections(collectionName)
        .documents()
        .search(params);
      
      console.log(`Advanced search found ${results.found} results`);
      return results;
    } catch (error) {
      console.error('Advanced search failed:', error);
      throw error;
    }
  }

  // Faceted search
  async facetedSearch(collectionName: string, query: string, facetFields: string[]) {
    const searchParams: SearchParams = {
      q: query || '*',
      query_by: 'title,description',
      facet_by: facetFields.join(','),
      max_facet_values: 20,
      per_page: 10
    };

    try {
      const results = await this.client
        .collections(collectionName)
        .documents()
        .search(searchParams);
      
      console.log('Faceted search results:', {
        found: results.found,
        facets: results.facet_counts
      });
      return results;
    } catch (error) {
      console.error('Faceted search failed:', error);
      throw error;
    }
  }

  // Geospatial search
  async geoSearch(collectionName: string, lat: number, lng: number, radiusKm: number) {
    const searchParams: SearchParams = {
      q: '*',
      query_by: 'name,description',
      filter_by: `location:(${lat}, ${lng}, ${radiusKm} km)`,
      sort_by: `location(${lat}, ${lng}):asc`,
      per_page: 20
    };

    try {
      const results = await this.client
        .collections(collectionName)
        .documents()
        .search(searchParams);
      
      console.log(`Found ${results.found} results within ${radiusKm}km`);
      return results;
    } catch (error) {
      console.error('Geo search failed:', error);
      throw error;
    }
  }

  // Vector/semantic search
  async vectorSearch(collectionName: string, query: string, vectorField = 'embedding') {
    const searchParams: SearchParams = {
      q: query,
      query_by: vectorField,
      vector_query: `${vectorField}:([], k:10)`,
      per_page: 10
    };

    try {
      const results = await this.client
        .collections(collectionName)
        .documents()
        .search(searchParams);
      
      console.log(`Vector search found ${results.found} semantic matches`);
      return results;
    } catch (error) {
      console.error('Vector search failed:', error);
      throw error;
    }
  }

  // Multi-collection search
  async multiCollectionSearch(collections: string[], query: string) {
    const searchPromises = collections.map(collection =>
      this.basicSearch(collection, query, ['title', 'description', 'name'])
        .then(results => ({ collection, results }))
        .catch(error => ({ collection, error }))
    );

    const results = await Promise.all(searchPromises);
    console.log('Multi-collection search completed');
    return results;
  }

  // Autocomplete/suggestions
  async autocomplete(collectionName: string, query: string, field = 'title') {
    const searchParams: SearchParams = {
      q: query,
      query_by: field,
      prefix: true,
      per_page: 5,
      num_typos: '0'
    };

    try {
      const results = await this.client
        .collections(collectionName)
        .documents()
        .search(searchParams);
      
      const suggestions = results.hits?.map(hit => hit.document[field]) || [];
      console.log(`Autocomplete suggestions for "${query}":`, suggestions);
      return suggestions;
    } catch (error) {
      console.error('Autocomplete failed:', error);
      throw error;
    }
  }
}

// Search query builders
class QueryBuilder {
  private params: SearchParams = {
    q: '*',
    query_by: '',
    per_page: 10
  };

  query(q: string) {
    this.params.q = q;
    return this;
  }

  queryBy(fields: string | string[]) {
    this.params.query_by = Array.isArray(fields) ? fields.join(',') : fields;
    return this;
  }

  filter(filter: string) {
    if (this.params.filter_by) {
      this.params.filter_by += ` && ${filter}`;
    } else {
      this.params.filter_by = filter;
    }
    return this;
  }

  facetBy(fields: string | string[]) {
    this.params.facet_by = Array.isArray(fields) ? fields.join(',') : fields;
    return this;
  }

  sortBy(field: string, direction: 'asc' | 'desc' = 'desc') {
    this.params.sort_by = `${field}:${direction}`;
    return this;
  }

  page(pageNum: number, perPage = 10) {
    this.params.page = pageNum;
    this.params.per_page = perPage;
    return this;
  }

  highlight(fields?: string | string[]) {
    if (fields) {
      this.params.highlight_fields = Array.isArray(fields) ? fields.join(',') : fields;
    } else {
      this.params.highlight_fields = this.params.query_by;
    }
    return this;
  }

  typoTolerance(numTypos: number) {
    this.params.num_typos = String(numTypos);
    return this;
  }

  prefix(enabled = true) {
    this.params.prefix = enabled;
    return this;
  }

  build(): SearchParams {
    return { ...this.params };
  }
}

// Predefined search patterns
const searchPatterns = {
  // Product search patterns
  productSearch: (query: string) => new QueryBuilder()
    .query(query)
    .queryBy(['title', 'description', 'category'])
    .facetBy(['category', 'brand', 'tags'])
    .filter('in_stock:true')
    .sortBy('rating')
    .highlight()
    .page(1, 20)
    .build(),

  // User search patterns
  userSearch: (query: string) => new QueryBuilder()
    .query(query)
    .queryBy(['name', 'email'])
    .facetBy(['interests', 'premium'])
    .sortBy('signup_date')
    .page(1, 10)
    .build(),

  // Article search patterns
  articleSearch: (query: string) => new QueryBuilder()
    .query(query)
    .queryBy(['title', 'content', 'excerpt'])
    .facetBy(['author', 'categories', 'tags'])
    .filter('published_at:>0')
    .sortBy('published_at')
    .highlight(['title', 'excerpt'])
    .page(1, 15)
    .build(),

  // Price range search
  priceRangeSearch: (query: string, minPrice: number, maxPrice: number) => 
    new QueryBuilder()
      .query(query)
      .queryBy(['title', 'description'])
      .filter(`price:>=${minPrice} && price:<=${maxPrice}`)
      .sortBy('price')
      .facetBy(['category', 'brand'])
      .build(),

  // Recent items search
  recentItemsSearch: (query: string, daysBack = 7) => {
    const timestamp = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    return new QueryBuilder()
      .query(query)
      .queryBy(['title', 'description'])
      .filter(`created_at:>=${timestamp}`)
      .sortBy('created_at')
      .page(1, 20)
      .build();
  },

  // Fuzzy search with high typo tolerance
  fuzzySearch: (query: string) => new QueryBuilder()
    .query(query)
    .queryBy(['title', 'description'])
    .typoTolerance(2)
    .prefix(false)
    .page(1, 10)
    .build()
};

// Search result processors
class SearchResultProcessor {
  static extractHighlights(hits: any[]) {
    return hits.map(hit => ({
      id: hit.document.id,
      title: hit.highlights?.[0]?.snippet || hit.document.title,
      highlights: hit.highlights || []
    }));
  }

  static groupByCategory(hits: any[]) {
    const groups: { [key: string]: any[] } = {};
    hits.forEach(hit => {
      const category = hit.document.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(hit);
    });
    return groups;
  }

  static extractFacetCounts(facetCounts: any[]) {
    const facets: { [key: string]: { [value: string]: number } } = {};
    facetCounts.forEach(facet => {
      facets[facet.field_name] = {};
      facet.counts.forEach((count: any) => {
        facets[facet.field_name][count.value] = count.count;
      });
    });
    return facets;
  }

  static paginate(results: any, currentPage: number, totalPages: number) {
    return {
      ...results,
      pagination: {
        currentPage,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        totalResults: results.found
      }
    };
  }
}

// Example usage
async function searchExamples(client: Typesense.Client) {
  const searchManager = new SearchManager(client);

  // Basic search
  const basicResults = await searchManager.basicSearch(
    'products',
    'wireless headphones',
    ['title', 'description']
  );

  // Advanced search with filters
  const advancedResults = await searchManager.advancedSearch('products', {
    q: 'shoes',
    query_by: 'title,description',
    filter_by: 'category:Sports && price:>=50 && price:<=200',
    facet_by: 'category,tags',
    sort_by: 'price:asc',
    highlight_fields: 'title,description',
    per_page: 20
  });

  // Using query builder
  const builderQuery = new QueryBuilder()
    .query('running')
    .queryBy(['title', 'description'])
    .filter('category:Sports')
    .filter('in_stock:true')
    .facetBy(['brand', 'tags'])
    .sortBy('rating')
    .highlight()
    .page(1, 10)
    .build();

  const builderResults = await searchManager.advancedSearch('products', builderQuery);

  // Autocomplete
  const suggestions = await searchManager.autocomplete('products', 'wirele');

  console.log('Search examples completed');
  return {
    basicResults,
    advancedResults,
    builderResults,
    suggestions
  };
}

export {
  SearchManager,
  QueryBuilder,
  searchPatterns,
  SearchResultProcessor,
  searchExamples,
  type SearchParams
};