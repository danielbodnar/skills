// Typesense Integration Examples with Popular Frameworks

import Typesense from 'typesense';

// React Hook for Typesense
import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseTypesenseSearchOptions {
  client: Typesense.Client;
  collectionName: string;
  initialQuery?: string;
  initialFilters?: string;
  debounceMs?: number;
}

interface SearchState {
  query: string;
  results: any[];
  facets: any[];
  loading: boolean;
  error: string | null;
  found: number;
}

function useTypesenseSearch({
  client,
  collectionName,
  initialQuery = '',
  initialFilters = '',
  debounceMs = 300
}: UseTypesenseSearchOptions) {
  const [state, setState] = useState<SearchState>({
    query: initialQuery,
    results: [],
    facets: [],
    loading: false,
    error: null,
    found: 0
  });

  const [filters, setFilters] = useState(initialFilters);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, filterBy: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const searchParams = {
          q: searchQuery || '*',
          query_by: 'title,description',
          filter_by: filterBy || undefined,
          facet_by: 'category,brand',
          per_page: 20
        };

        const response = await client
          .collections(collectionName)
          .documents()
          .search(searchParams);

        setState(prev => ({
          ...prev,
          results: response.hits?.map(hit => hit.document) || [],
          facets: response.facet_counts || [],
          found: response.found || 0,
          loading: false
        }));
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Search failed',
          loading: false
        }));
      }
    }, debounceMs),
    [client, collectionName, debounceMs]
  );

  // Search effect
  useEffect(() => {
    debouncedSearch(state.query, filters);
  }, [state.query, filters, debouncedSearch]);

  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  const addFilter = useCallback((filter: string) => {
    setFilters(prev => prev ? `${prev} && ${filter}` : filter);
  }, []);

  const removeFilter = useCallback((filterToRemove: string) => {
    setFilters(prev => 
      prev.split(' && ').filter(f => f !== filterToRemove).join(' && ')
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilters('');
  }, []);

  return {
    ...state,
    setQuery,
    filters,
    addFilter,
    removeFilter,
    clearFilters
  };
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Express.js middleware for Typesense
import type { Request, Response, NextFunction } from 'express';

interface TypesenseRequest extends Request {
  typesense?: Typesense.Client;
}

function createTypesenseMiddleware(client: Typesense.Client) {
  return (req: TypesenseRequest, res: Response, next: NextFunction) => {
    req.typesense = client;
    next();
  };
}

// Express route handlers
const createSearchRoutes = (client: Typesense.Client) => {
  // Search endpoint
  const search = async (req: Request, res: Response) => {
    try {
      const {
        q = '*',
        collection,
        query_by = 'title,description',
        filter_by,
        facet_by,
        sort_by,
        page = 1,
        per_page = 20
      } = req.query;

      if (!collection) {
        return res.status(400).json({ error: 'Collection parameter is required' });
      }

      const searchParams = {
        q: String(q),
        query_by: String(query_by),
        filter_by: filter_by ? String(filter_by) : undefined,
        facet_by: facet_by ? String(facet_by) : undefined,
        sort_by: sort_by ? String(sort_by) : undefined,
        page: Number(page),
        per_page: Math.min(Number(per_page), 100) // Limit max results
      };

      const results = await client
        .collections(String(collection))
        .documents()
        .search(searchParams);

      res.json({
        success: true,
        data: results,
        meta: {
          found: results.found,
          page: Number(page),
          per_page: Number(per_page)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Search failed'
      });
    }
  };

  // Autocomplete endpoint
  const autocomplete = async (req: Request, res: Response) => {
    try {
      const { q, collection, field = 'title' } = req.query;

      if (!q || !collection) {
        return res.status(400).json({ 
          error: 'Query (q) and collection parameters are required' 
        });
      }

      const results = await client
        .collections(String(collection))
        .documents()
        .search({
          q: String(q),
          query_by: String(field),
          prefix: true,
          per_page: 5,
          num_typos: '0'
        });

      const suggestions = results.hits?.map(hit => hit.document[String(field)]) || [];

      res.json({
        success: true,
        suggestions: [...new Set(suggestions)] // Remove duplicates
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Autocomplete failed'
      });
    }
  };

  return { search, autocomplete };
};

// Next.js API route examples
const nextApiRoutes = {
  // pages/api/search.ts
  searchHandler: async (req: Request, res: Response) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const client = new Typesense.Client({
      nodes: [{ 
        host: process.env.TYPESENSE_HOST!, 
        port: Number(process.env.TYPESENSE_PORT!), 
        protocol: process.env.TYPESENSE_PROTOCOL! as 'http' | 'https'
      }],
      apiKey: process.env.TYPESENSE_SEARCH_API_KEY!,
      connectionTimeoutSeconds: 2
    });

    try {
      const { q, collection = 'products' } = req.query;
      
      const results = await client
        .collections(String(collection))
        .documents()
        .search({
          q: String(q || '*'),
          query_by: 'title,description',
          facet_by: 'category,brand',
          per_page: 20
        });

      res.status(200).json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};

// Astro component example
const astroSearchComponent = `
---
// SearchResults.astro
export interface Props {
  query?: string;
  collection?: string;
}

const { query = '', collection = 'products' } = Astro.props;

import Typesense from 'typesense';

const client = new Typesense.Client({
  nodes: [{ 
    host: import.meta.env.TYPESENSE_HOST, 
    port: Number(import.meta.env.TYPESENSE_PORT), 
    protocol: import.meta.env.TYPESENSE_PROTOCOL 
  }],
  apiKey: import.meta.env.TYPESENSE_SEARCH_API_KEY,
  connectionTimeoutSeconds: 2
});

let results = { hits: [], found: 0, facet_counts: [] };

if (query) {
  try {
    results = await client
      .collections(collection)
      .documents()
      .search({
        q: query,
        query_by: 'title,description',
        facet_by: 'category',
        per_page: 20
      });
  } catch (error) {
    console.error('Search failed:', error);
  }
}
---

<div class="search-results">
  <h2>Search Results ({results.found} found)</h2>
  
  {results.hits.map(hit => (
    <div class="result-item">
      <h3>{hit.document.title}</h3>
      <p>{hit.document.description}</p>
      <span class="price">${hit.document.price}</span>
    </div>
  ))}
  
  {results.facet_counts.length > 0 && (
    <aside class="facets">
      <h3>Filters</h3>
      {results.facet_counts.map(facet => (
        <div class="facet-group">
          <h4>{facet.field_name}</h4>
          {facet.counts.map(count => (
            <label>
              <input type="checkbox" value={count.value} />
              {count.value} ({count.count})
            </label>
          ))}
        </div>
      ))}
    </aside>
  )}
</div>
`;

// Vue 3 Composition API example
const vueSearchComposable = `
// composables/useTypesenseSearch.ts
import { ref, computed, watch } from 'vue'
import Typesense from 'typesense'

export function useTypesenseSearch(client: Typesense.Client, collectionName: string) {
  const query = ref('')
  const filters = ref('')
  const results = ref([])
  const facets = ref([])
  const loading = ref(false)
  const error = ref(null)
  const found = ref(0)

  const search = async () => {
    if (!query.value.trim()) {
      results.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await client
        .collections(collectionName)
        .documents()
        .search({
          q: query.value,
          query_by: 'title,description',
          filter_by: filters.value || undefined,
          facet_by: 'category,brand',
          per_page: 20
        })

      results.value = response.hits?.map(hit => hit.document) || []
      facets.value = response.facet_counts || []
      found.value = response.found || 0
    } catch (err) {
      error.value = err.message || 'Search failed'
      results.value = []
    } finally {
      loading.value = false
    }
  }

  // Debounced search
  let searchTimeout: NodeJS.Timeout
  watch([query, filters], () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(search, 300)
  })

  const addFilter = (filter: string) => {
    filters.value = filters.value ? \`\${filters.value} && \${filter}\` : filter
  }

  const removeFilter = (filterToRemove: string) => {
    filters.value = filters.value
      .split(' && ')
      .filter(f => f !== filterToRemove)
      .join(' && ')
  }

  return {
    query,
    filters,
    results,
    facets,
    loading,
    error,
    found,
    search,
    addFilter,
    removeFilter
  }
}
`;

// Svelte store example
const svelteSearchStore = `
// stores/search.ts
import { writable, derived } from 'svelte/store'
import Typesense from 'typesense'

interface SearchState {
  query: string
  results: any[]
  facets: any[]
  loading: boolean
  error: string | null
  found: number
}

function createSearchStore(client: Typesense.Client, collectionName: string) {
  const { subscribe, set, update } = writable<SearchState>({
    query: '',
    results: [],
    facets: [],
    loading: false,
    error: null,
    found: 0
  })

  let searchTimeout: NodeJS.Timeout

  const search = async (query: string, filters?: string) => {
    clearTimeout(searchTimeout)
    
    searchTimeout = setTimeout(async () => {
      update(state => ({ ...state, loading: true, error: null }))

      try {
        const response = await client
          .collections(collectionName)
          .documents()
          .search({
            q: query || '*',
            query_by: 'title,description',
            filter_by: filters,
            facet_by: 'category,brand',
            per_page: 20
          })

        update(state => ({
          ...state,
          results: response.hits?.map(hit => hit.document) || [],
          facets: response.facet_counts || [],
          found: response.found || 0,
          loading: false
        }))
      } catch (error) {
        update(state => ({
          ...state,
          error: error.message || 'Search failed',
          loading: false
        }))
      }
    }, 300)
  }

  const setQuery = (query: string) => {
    update(state => ({ ...state, query }))
    search(query)
  }

  return {
    subscribe,
    search,
    setQuery,
    reset: () => set({
      query: '',
      results: [],
      facets: [],
      loading: false,
      error: null,
      found: 0
    })
  }
}

export const searchStore = createSearchStore(typesenseClient, 'products')
`;

// GraphQL integration example
const graphqlSchema = `
// GraphQL schema with Typesense
import { gql } from 'apollo-server-express'

const typeDefs = gql\`
  type SearchResult {
    id: String!
    title: String!
    description: String
    price: Float
    category: String
  }

  type SearchResponse {
    hits: [SearchResult!]!
    found: Int!
    facets: [Facet!]!
  }

  type Facet {
    field: String!
    counts: [FacetCount!]!
  }

  type FacetCount {
    value: String!
    count: Int!
  }

  type Query {
    search(
      query: String!
      collection: String = "products"
      filterBy: String
      sortBy: String
      page: Int = 1
      perPage: Int = 20
    ): SearchResponse!
  }
\`

const resolvers = {
  Query: {
    search: async (_, { query, collection, filterBy, sortBy, page, perPage }, { typesenseClient }) => {
      const response = await typesenseClient
        .collections(collection)
        .documents()
        .search({
          q: query,
          query_by: 'title,description',
          filter_by: filterBy,
          sort_by: sortBy,
          page,
          per_page: Math.min(perPage, 100)
        })

      return {
        hits: response.hits?.map(hit => hit.document) || [],
        found: response.found || 0,
        facets: response.facet_counts?.map(facet => ({
          field: facet.field_name,
          counts: facet.counts
        })) || []
      }
    }
  }
}
`;

// Worker/Service Worker example for offline search
const serviceWorkerExample = `
// sw.ts - Service Worker with cached search
const CACHE_NAME = 'typesense-cache-v1'
const SEARCH_CACHE = 'search-results'

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  
  // Cache search requests
  if (url.pathname.includes('/api/search')) {
    event.respondWith(
      caches.open(SEARCH_CACHE).then(cache => 
        cache.match(event.request).then(response => {
          if (response) {
            // Serve from cache
            return response
          }
          
          // Fetch and cache
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone())
            return response
          })
        })
      )
    )
  }
})

// Background sync for offline document updates
self.addEventListener('sync', event => {
  if (event.tag === 'typesense-sync') {
    event.waitUntil(syncPendingDocuments())
  }
})

async function syncPendingDocuments() {
  const db = await openIndexedDB()
  const pendingDocs = await getPendingDocuments(db)
  
  for (const doc of pendingDocs) {
    try {
      await syncDocument(doc)
      await removePendingDocument(db, doc.id)
    } catch (error) {
      console.error('Failed to sync document:', error)
    }
  }
}
`;

export {
  useTypesenseSearch,
  createTypesenseMiddleware,
  createSearchRoutes,
  nextApiRoutes,
  astroSearchComponent,
  vueSearchComposable,
  svelteSearchStore,
  graphqlSchema,
  serviceWorkerExample
};