// Vector Search Examples with Orama
// Demonstrates semantic search capabilities using embeddings

import { create, insert, searchVector, search } from '@orama/orama'
import { pluginEmbeddings } from '@orama/plugin-embeddings'
import '@tensorflow/tfjs-node' // Backend for Node.js

// Configure embeddings plugin
const embeddingsPlugin = await pluginEmbeddings({
  embeddings: {
    defaultProperty: 'embeddings',
    onInsert: {
      generate: true,
      properties: ['title', 'content'], // Generate embeddings from these fields
      verbose: true
    }
  }
})

// Create database with vector support
const vectorDB = await create({
  schema: {
    id: 'string',
    title: 'string',
    content: 'string',
    category: 'string',
    embeddings: 'vector[512]', // 512-dimensional vectors
    metadata: {
      author: 'string',
      publishDate: 'string',
      readingTime: 'number'
    }
  },
  plugins: [embeddingsPlugin]
})

// Sample documents for vector search
const documents = [
  {
    id: '1',
    title: 'Machine Learning Fundamentals',
    content: 'Introduction to artificial intelligence, neural networks, and deep learning concepts for beginners',
    category: 'technology',
    metadata: {
      author: 'John Doe',
      publishDate: '2024-01-15',
      readingTime: 8
    }
  },
  {
    id: '2', 
    title: 'Cooking Italian Pasta',
    content: 'Traditional recipes for preparing authentic Italian pasta dishes with fresh ingredients',
    category: 'food',
    metadata: {
      author: 'Maria Rossi',
      publishDate: '2024-02-10',
      readingTime: 6
    }
  },
  {
    id: '3',
    title: 'Understanding Neural Networks',
    content: 'Deep dive into how artificial neural networks process information and learn patterns',
    category: 'technology', 
    metadata: {
      author: 'Alice Smith',
      publishDate: '2024-01-20',
      readingTime: 12
    }
  },
  {
    id: '4',
    title: 'Mediterranean Diet Benefits',
    content: 'Health benefits of Mediterranean cuisine including olive oil, fresh vegetables, and seafood',
    category: 'health',
    metadata: {
      author: 'Dr. Brown',
      publishDate: '2024-02-05',
      readingTime: 7
    }
  }
]

// Insert documents with automatic embedding generation
for (const doc of documents) {
  await insert(vectorDB, doc)
}

// Pure vector search - semantic similarity
const vectorResults = await searchVector(vectorDB, {
  vector: [/* embedding vector would go here */],
  similarity: 0.8, // Minimum similarity threshold
  limit: 5,
  offset: 0,
  includeVectors: false // Don't include vectors in results
})

// Hybrid search - combines vector and full-text search
const hybridResults = await search(vectorDB, {
  term: 'artificial intelligence learning',
  mode: 'hybrid',
  properties: ['title', 'content'],
  similarity: 0.7,
  where: {
    category: 'technology'
  },
  limit: 10
})

// Vector search with custom embeddings
const customEmbedding = new Array(512).fill(0).map(() => Math.random())
const customVectorSearch = await searchVector(vectorDB, {
  vector: customEmbedding,
  similarity: 0.6,
  where: {
    'metadata.readingTime': {
      lte: 10 // Articles with 10 minutes or less reading time
    }
  }
})

// Search using generated embeddings from text
const semanticSearch = await search(vectorDB, {
  term: 'cooking recipes healthy food',
  mode: 'vector', // Pure vector search using term for embedding generation
  similarity: 0.75,
  properties: ['content'],
  facets: {
    category: {},
    'metadata.author': {}
  }
})

console.log('Semantic search results:', semanticSearch.hits.map(hit => ({
  title: hit.document.title,
  score: hit.score,
  category: hit.document.category
})))

// Advanced vector search with filters and sorting
const advancedVectorSearch = await searchVector(vectorDB, {
  vector: customEmbedding,
  similarity: 0.5,
  where: {
    'metadata.publishDate': {
      gte: '2024-01-01'
    }
  },
  sortBy: {
    property: 'metadata.readingTime',
    order: 'ASC'
  },
  groupBy: {
    properties: ['category'],
    maxResult: 2
  }
})

// Vector search with boosting
const boostedVectorSearch = await search(vectorDB, {
  term: 'machine learning AI',
  mode: 'vector',
  boost: {
    title: 2.0,
    content: 1.0,
    category: 0.5
  },
  similarity: 0.6
})

console.log('Vector database initialized with', documents.length, 'documents')
console.log('Hybrid search found', hybridResults.count, 'relevant results')