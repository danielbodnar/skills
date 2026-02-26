// TypeScript Integration with Orama
// Complete examples for type-safe Orama usage

import type { 
  TypedDocument, 
  Orama, 
  Results, 
  SearchParams,
  ResultMap,
  AnyOrama,
  Language,
  SearchResult
} from '@orama/orama'

import { create, insert, search, insertMultiple } from '@orama/orama'

// Define strict schema with const assertion
const blogSchema = {
  id: 'string',
  title: 'string', 
  content: 'string',
  author: 'string',
  publishDate: 'string',
  tags: 'string[]',
  category: 'enum',
  readingTime: 'number',
  isPublished: 'boolean',
  metadata: {
    views: 'number',
    likes: 'number',
    comments: 'number'
  }
} as const // Important: const assertion for proper type inference

// Create typed database
const blogDB: Orama<typeof blogSchema> = create({
  schema: blogSchema
})

// Define document type from schema
type BlogDocument = TypedDocument<Orama<typeof blogSchema>>

// Custom interface for enriched document types (includes non-indexed properties)
interface EnrichedBlogPost extends BlogDocument {
  slug: string
  excerpt: string
  featuredImage?: string
  relatedPosts?: string[]
}

// Type-safe document insertion
const samplePosts: BlogDocument[] = [
  {
    id: '1',
    title: 'Getting Started with TypeScript',
    content: 'TypeScript is a powerful superset of JavaScript that adds static typing...',
    author: 'Jane Doe',
    publishDate: '2024-01-15',
    tags: ['typescript', 'javascript', 'programming'],
    category: 'tutorial',
    readingTime: 8,
    isPublished: true,
    metadata: {
      views: 1250,
      likes: 89,
      comments: 23
    }
  },
  {
    id: '2', 
    title: 'Advanced React Patterns',
    content: 'Explore advanced patterns in React including hooks, context, and performance optimization...',
    author: 'John Smith',
    publishDate: '2024-02-01',
    tags: ['react', 'javascript', 'frontend'],
    category: 'advanced',
    readingTime: 12,
    isPublished: true,
    metadata: {
      views: 890,
      likes: 67,
      comments: 18
    }
  }
]

// Insert with type safety
insertMultiple(blogDB, samplePosts)

// Type-safe search parameters
const searchParams: SearchParams<Orama<typeof blogSchema>> = {
  term: 'typescript react',
  properties: ['title', 'content', 'tags'],
  where: {
    isPublished: true,
    'metadata.views': {
      gte: 500
    },
    category: {
      in: ['tutorial', 'advanced']
    }
  },
  sortBy: {
    property: 'metadata.views',
    order: 'DESC'
  },
  limit: 10,
  offset: 0,
  facets: {
    category: {},
    author: {},
    tags: { limit: 10 }
  }
}

// Perform type-safe search
const results: Results<BlogDocument> = search(blogDB, searchParams)

// Type-safe result handling
results.hits.forEach((hit: SearchResult<BlogDocument>) => {
  console.log('Post title:', hit.document.title) // Fully typed
  console.log('Author:', hit.document.author)     // Fully typed
  console.log('Score:', hit.score)                // number
  console.log('Views:', hit.document.metadata.views) // Fully typed nested object
})

// Generic search function with type safety
function performTypedSearch<T extends AnyOrama>(
  database: T,
  params: SearchParams<T>
): Results<TypedDocument<T>> {
  return search(database, params)
}

// Usage of generic search function
const typedResults = performTypedSearch(blogDB, {
  term: 'javascript',
  where: {
    isPublished: true
  }
})

// Advanced type-safe search with enriched types
function searchWithEnrichment<DB extends AnyOrama, EnrichedType>(
  database: DB,
  params: SearchParams<DB>
): SearchResult<EnrichedType>[] {
  const results = search(database, params)
  
  return results.hits.map(hit => ({
    ...hit,
    document: hit.document as EnrichedType
  }))
}

// Use enriched search
const enrichedResults = searchWithEnrichment<typeof blogDB, EnrichedBlogPost>(blogDB, {
  term: 'tutorial',
  limit: 5
})

// Access enriched properties with type safety
enrichedResults.forEach(hit => {
  console.log('Title:', hit.document.title)      // From original schema
  console.log('Slug:', hit.document.slug)        // From enriched interface
  console.log('Excerpt:', hit.document.excerpt)  // From enriched interface
})

// Custom type guards for runtime validation
function isBlogDocument(doc: any): doc is BlogDocument {
  return (
    typeof doc === 'object' &&
    typeof doc.id === 'string' &&
    typeof doc.title === 'string' &&
    typeof doc.content === 'string' &&
    typeof doc.author === 'string' &&
    typeof doc.isPublished === 'boolean' &&
    Array.isArray(doc.tags)
  )
}

// Type-safe result mapping
interface SearchResultMap {
  id: string
  title: string
  summary: string
  url: string
  category: string
  publishedAt: string
}

function mapSearchResults(results: Results<BlogDocument>): SearchResultMap[] {
  return results.hits.map(hit => ({
    id: hit.document.id,
    title: hit.document.title,
    summary: hit.document.content.substring(0, 200) + '...',
    url: `/blog/${hit.document.id}`,
    category: hit.document.category,
    publishedAt: hit.document.publishDate
  }))
}

// Advanced schema with complex nested types
const productSchema = {
  id: 'string',
  name: 'string',
  description: 'string',
  price: 'number',
  currency: 'enum',
  inStock: 'boolean',
  categories: 'string[]',
  variants: {
    size: 'string',
    color: 'string', 
    sku: 'string',
    price: 'number'
  },
  reviews: {
    rating: 'number',
    count: 'number',
    averageRating: 'number'
  },
  tags: 'string[]',
  embedding: 'vector[512]'
} as const

type ProductDocument = TypedDocument<Orama<typeof productSchema>>

const productDB: Orama<typeof productSchema> = create({
  schema: productSchema
})

// Complex search with nested filtering
const complexSearch: SearchParams<Orama<typeof productSchema>> = {
  term: 'laptop gaming',
  mode: 'hybrid',
  where: {
    inStock: true,
    price: {
      gte: 500,
      lte: 2000
    },
    'reviews.averageRating': {
      gte: 4.0
    },
    'variants.size': {
      in: ['medium', 'large']
    }
  },
  facets: {
    categories: { limit: 5 },
    'variants.color': { limit: 10 },
    currency: {},
    price: {
      ranges: [
        { from: 0, to: 500 },
        { from: 500, to: 1000 },
        { from: 1000, to: 2000 },
        { from: 2000, to: 5000 }
      ]
    }
  },
  groupBy: {
    properties: ['categories'],
    maxResult: 3
  }
}

// Type-safe facet handling
function processFacets(results: Results<ProductDocument>) {
  if (results.facets) {
    // Categories facet
    const categoriesFacet = results.facets.categories
    if (categoriesFacet && 'values' in categoriesFacet) {
      categoriesFacet.values.forEach(facetValue => {
        console.log(`Category: ${facetValue.value} (${facetValue.count} items)`)
      })
    }

    // Price ranges facet
    const priceFacet = results.facets.price
    if (priceFacet && 'values' in priceFacet) {
      priceFacet.values.forEach(range => {
        console.log(`Price range: $${range.from}-$${range.to} (${range.count} items)`)
      })
    }
  }
}

// Export types for external use
export type {
  BlogDocument,
  EnrichedBlogPost,
  ProductDocument,
  SearchResultMap
}

export {
  blogDB,
  productDB,
  blogSchema,
  productSchema,
  performTypedSearch,
  searchWithEnrichment,
  mapSearchResults,
  processFacets,
  isBlogDocument
}

// Example usage with proper error handling
async function safeSearch(query: string): Promise<SearchResultMap[] | null> {
  try {
    const results = search(blogDB, {
      term: query,
      where: { isPublished: true },
      limit: 20
    })
    
    return mapSearchResults(results)
  } catch (error) {
    console.error('Search failed:', error)
    return null
  }
}

// Generic utility for creating typed databases
function createTypedDatabase<T extends Record<string, any>>(schema: T) {
  type DatabaseType = Orama<T>
  type DocumentType = TypedDocument<DatabaseType>
  
  const database: DatabaseType = create({ schema })
  
  return {
    database,
    insert: (doc: DocumentType) => insert(database, doc),
    insertMultiple: (docs: DocumentType[]) => insertMultiple(database, docs),
    search: (params: SearchParams<DatabaseType>) => search(database, params)
  }
}

// Usage of generic database creator
const typedBlogDB = createTypedDatabase(blogSchema)

console.log('TypeScript integration examples loaded successfully')