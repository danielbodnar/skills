// Orama Cloud SDK Usage Examples
// Complete guide to using Orama Cloud services

import { OramaClient, CloudManager } from '@oramacloud/client'

// Initialize Orama Cloud client for search operations
const client = new OramaClient({
  endpoint: process.env.ORAMA_CLOUD_ENDPOINT || 'https://your-endpoint.oramacloud.io',
  api_key: process.env.ORAMA_CLOUD_PUBLIC_API_KEY || 'your-public-api-key'
})

// Initialize Cloud Manager for index management operations
const cloudManager = new CloudManager({
  api_key: process.env.ORAMA_CLOUD_PRIVATE_API_KEY || 'your-private-api-key'
})

// Basic full-text search
async function performBasicSearch() {
  try {
    const results = await client.search({
      term: 'javascript frameworks',
      mode: 'fulltext', // Options: 'fulltext', 'vector', 'hybrid'
      limit: 10,
      offset: 0
    })

    console.log('Search results:', results.hits.length)
    return results
  } catch (error) {
    console.error('Search failed:', error)
    throw error
  }
}

// Vector search with filtering
async function performVectorSearch() {
  const results = await client.search({
    term: 'modern web development',
    mode: 'vector',
    where: {
      category: 'technology',
      publishDate: {
        gte: '2024-01-01'
      },
      rating: {
        gt: 4.0
      }
    },
    returning: ['title', 'content', 'url', 'category'],
    limit: 20
  })

  return results
}

// Hybrid search combining full-text and vector search
async function performHybridSearch() {
  const results = await client.search({
    term: 'react typescript tutorial',
    mode: 'hybrid',
    properties: ['title', 'content', 'tags'],
    where: {
      difficulty: {
        in: ['beginner', 'intermediate']
      }
    },
    sortBy: [
      { property: 'relevance', order: 'DESC' },
      { property: 'publishDate', order: 'DESC' }
    ]
  })

  return results
}

// Search with facets for filtering UI
async function performFacetedSearch() {
  const results = await client.search({
    term: 'web development',
    facets: {
      category: {
        limit: 10,
        order: 'DESC'
      },
      tags: {
        limit: 15,
        order: 'DESC'
      },
      difficulty: {},
      rating: {
        ranges: [
          { from: 0, to: 2 },
          { from: 2, to: 3.5 },
          { from: 3.5, to: 5 }
        ]
      },
      publishDate: {
        ranges: [
          { from: '2024-01-01', to: '2024-03-31' },
          { from: '2024-04-01', to: '2024-06-30' },
          { from: '2024-07-01', to: '2024-12-31' }
        ]
      }
    },
    groupBy: {
      properties: ['category'],
      maxResult: 3
    }
  })

  console.log('Facets:', results.facets)
  return results
}

// Geosearch for location-based queries
async function performGeosearch() {
  const results = await client.search({
    term: 'coffee shops',
    where: {
      location: {
        radius: {
          coordinates: {
            lat: 40.7128,
            lon: -74.0060 // New York City
          },
          unit: 'km',
          value: 5 // 5km radius
        }
      }
    },
    sortBy: [
      { property: 'rating', order: 'DESC' },
      { property: 'distance', order: 'ASC' }
    ]
  })

  return results
}

// Multi-index search across different databases
async function performMultiIndexSearch() {
  const multiClient = new OramaClient({
    mergeResults: true,
    indexes: [
      {
        api_key: process.env.ORAMA_INDEX_1_API_KEY || 'index-1-key',
        endpoint: process.env.ORAMA_INDEX_1_ENDPOINT || 'https://index-1.oramacloud.io'
      },
      {
        api_key: process.env.ORAMA_INDEX_2_API_KEY || 'index-2-key',
        endpoint: process.env.ORAMA_INDEX_2_ENDPOINT || 'https://index-2.oramacloud.io'
      }
    ]
  })

  const results = await multiClient.search({
    term: 'documentation',
    mode: 'hybrid',
    limit: 50
  })

  return results
}

// Index management operations
async function manageIndex() {
  const indexId = 'your-index-id'
  const myIndex = cloudManager.index(indexId)

  // Insert documents
  await myIndex.insert([
    {
      id: 'doc1',
      title: 'Getting Started with Orama',
      content: 'Learn how to set up and use Orama search engine',
      category: 'tutorial',
      tags: ['orama', 'search', 'tutorial']
    },
    {
      id: 'doc2',
      title: 'Advanced Search Techniques',
      content: 'Master vector search and hybrid search methods',
      category: 'advanced',
      tags: ['vector-search', 'hybrid', 'advanced']
    }
  ])

  // Update documents
  await myIndex.update([
    {
      id: 'doc1',
      title: 'Updated: Getting Started with Orama',
      lastModified: new Date().toISOString()
    }
  ])

  // Delete documents
  await myIndex.delete(['doc2'])

  // Check for pending operations
  const hasPending = await myIndex.hasPendingOperations()
  console.log('Has pending operations:', hasPending)

  // Deploy changes
  if (hasPending) {
    await myIndex.deploy()
    console.log('Index deployed successfully')
  }

  return myIndex
}

// Answer Engine - AI-powered conversational search
async function createAnswerSession() {
  const answerSession = client.createAnswerSession({
    userContext: 'The user is a developer learning about modern web frameworks',
    inferenceType: 'documentation',
    initialMessages: [
      { role: 'user', content: 'What is Orama?' },
      { role: 'assistant', content: 'Orama is a next-generation search and answer engine.' }
    ],
    events: {
      onMessageChange: (messages) => console.log('Messages updated:', messages.length),
      onMessageLoading: (loading) => console.log('Loading:', loading),
      onSourceChange: (sources) => console.log('Sources:', sources.length),
      onAnswerAborted: () => console.log('Answer session aborted'),
      onStateChange: (state) => console.log('State changed:', state),
      onNewInteractionStarted: (id) => console.log('New interaction:', id)
    }
  })

  // Ask a question
  const answer = await answerSession.ask({
    term: 'How do I implement vector search?',
    related: {
      howMany: 3,
      format: 'query'
    }
  })

  console.log('AI Answer:', answer)
  return answerSession
}

// Advanced search with custom scoring
async function performAdvancedSearch() {
  const results = await client.search({
    term: 'typescript react',
    mode: 'hybrid',
    properties: ['title^2', 'content', 'tags^1.5'], // Boost specific fields
    where: {
      and: [
        { category: 'tutorial' },
        {
          or: [
            { difficulty: 'beginner' },
            { tags: { contains: 'getting-started' } }
          ]
        }
      ]
    },
    highlight: {
      fields: ['title', 'content'],
      preTag: '<mark>',
      postTag: '</mark>',
      maxLength: 200
    },
    includeVectors: false,
    similarity: 0.7
  })

  return results
}

// Export search functions
export {
  performBasicSearch,
  performVectorSearch,
  performHybridSearch,
  performFacetedSearch,
  performGeosearch,
  performMultiIndexSearch,
  manageIndex,
  createAnswerSession,
  performAdvancedSearch,
  client,
  cloudManager
}

// Example usage
async function runExamples() {
  console.log('Running Orama Cloud SDK examples...')
  
  try {
    const basicResults = await performBasicSearch()
    console.log(`Basic search returned ${basicResults.count} results`)
    
    const vectorResults = await performVectorSearch()
    console.log(`Vector search returned ${vectorResults.count} results`)
    
    const hybridResults = await performHybridSearch()
    console.log(`Hybrid search returned ${hybridResults.count} results`)
    
  } catch (error) {
    console.error('Example execution failed:', error)
  }
}