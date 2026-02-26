// Basic Orama Usage Examples
// Complete examples for getting started with Orama search engine

import { create, insert, search, insertMultiple, remove, update } from '@orama/orama'

// Basic database creation with simple schema
const basicDB = create({
  schema: {
    title: 'string',
    description: 'string',
    price: 'number',
    category: 'string',
    tags: 'string[]',
    inStock: 'boolean'
  }
})

// Insert single document
const documentId = insert(basicDB, {
  title: 'Wireless Headphones',
  description: 'High-quality noise-canceling wireless headphones with premium sound',
  price: 299.99,
  category: 'electronics',
  tags: ['audio', 'wireless', 'noise-canceling'],
  inStock: true
})

// Insert multiple documents
const products = [
  {
    title: 'Bluetooth Speaker',
    description: 'Portable waterproof Bluetooth speaker with excellent bass',
    price: 79.99,
    category: 'electronics',
    tags: ['audio', 'bluetooth', 'portable'],
    inStock: true
  },
  {
    title: 'Gaming Mouse',
    description: 'Professional gaming mouse with RGB lighting and high DPI',
    price: 59.99,
    category: 'electronics', 
    tags: ['gaming', 'mouse', 'rgb'],
    inStock: false
  },
  {
    title: 'Mechanical Keyboard',
    description: 'Cherry MX switches mechanical keyboard for gaming and typing',
    price: 149.99,
    category: 'electronics',
    tags: ['gaming', 'keyboard', 'mechanical'],
    inStock: true
  }
]

insertMultiple(basicDB, products)

// Basic full-text search
const searchResults = search(basicDB, {
  term: 'gaming'
})

console.log('Search results for "gaming":', searchResults.hits.map(hit => hit.document))

// Search with filters
const filteredResults = search(basicDB, {
  term: 'electronics',
  where: {
    inStock: true,
    price: {
      lte: 100
    }
  }
})

// Search with sorting
const sortedResults = search(basicDB, {
  term: '*', // Match all documents
  sortBy: {
    property: 'price',
    order: 'DESC'
  },
  limit: 5
})

// Search with facets
const facetedResults = search(basicDB, {
  term: 'audio',
  facets: {
    category: {},
    inStock: {},
    price: {
      ranges: [
        { from: 0, to: 50 },
        { from: 50, to: 150 },
        { from: 150, to: 300 }
      ]
    }
  }
})

console.log('Faceted search results:', facetedResults.facets)

// Update document
update(basicDB, documentId, {
  price: 249.99,
  inStock: false
})

// Remove document
remove(basicDB, documentId)

// Advanced search with multiple properties
const advancedSearch = search(basicDB, {
  term: 'wireless bluetooth',
  properties: ['title', 'description', 'tags'],
  boost: {
    title: 2,    // Boost title matches
    tags: 1.5    // Moderate boost for tags
  },
  threshold: 0.8, // Minimum similarity threshold
  limit: 10,
  offset: 0
})

// Search with typo tolerance
const typoResults = search(basicDB, {
  term: 'wireles headfones', // Intentional typos
  tolerance: 2 // Allow up to 2 character differences
})

console.log('Typo-tolerant search results:', typoResults.hits.length)

// Export the database for persistence
console.log('Database created with', basicDB.data.index.indexes.size, 'indexed fields')