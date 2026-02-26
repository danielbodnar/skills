// Orama Plugins Usage Examples
// Complete guide to using and configuring Orama plugins

import { create, insert, search, insertMultiple } from '@orama/orama'
import { pluginEmbeddings } from '@orama/plugin-embeddings'
import { pluginAnalytics } from '@orama/plugin-analytics'
import { persistToFile, restoreFromFile } from '@orama/plugin-data-persistence'
import { pluginParsedoc } from '@orama/plugin-parsedoc'
import { createTokenizer } from '@orama/tokenizers/mandarin'
import { stemmer } from '@orama/stemmers/spanish'

// Embeddings Plugin Configuration
async function setupEmbeddingsPlugin() {
  const embeddingsPlugin = await pluginEmbeddings({
    embeddings: {
      defaultProperty: 'embeddings',
      onInsert: {
        generate: true,
        properties: ['title', 'content', 'description'],
        verbose: true
      },
      onSearch: {
        property: 'embeddings',
        k: 10 // Top-k nearest neighbors
      }
    }
  })

  const db = await create({
    schema: {
      id: 'string',
      title: 'string',
      content: 'string', 
      description: 'string',
      embeddings: 'vector[512]',
      category: 'string'
    },
    plugins: [embeddingsPlugin]
  })

  // Documents will automatically have embeddings generated
  await insert(db, {
    id: '1',
    title: 'Machine Learning Basics',
    content: 'Introduction to neural networks and deep learning concepts',
    description: 'A comprehensive guide for beginners',
    category: 'education'
  })

  // Vector search will work automatically
  const vectorResults = await search(db, {
    term: 'artificial intelligence learning',
    mode: 'vector',
    similarity: 0.8
  })

  return { db, vectorResults }
}

// Analytics Plugin Configuration
async function setupAnalyticsPlugin() {
  const analyticsPlugin = await pluginAnalytics({
    apiKey: process.env.ORAMA_ANALYTICS_API_KEY || 'your-analytics-api-key',
    indexId: process.env.ORAMA_ANALYTICS_INDEX_ID || 'your-index-id',
    endpoint: 'https://analytics.orama.com', // Optional custom endpoint
    flushInterval: 5000, // Send analytics every 5 seconds
    flushSize: 10, // Send when 10 events are queued
    enabled: process.env.NODE_ENV === 'production' // Only in production
  })

  const db = create({
    schema: {
      title: 'string',
      content: 'string',
      category: 'string'
    },
    plugins: [analyticsPlugin]
  })

  insertMultiple(db, [
    { title: 'Getting Started', content: 'How to begin...', category: 'tutorial' },
    { title: 'Advanced Topics', content: 'Deep dive...', category: 'advanced' },
    { title: 'Best Practices', content: 'Tips and tricks...', category: 'guide' }
  ])

  // Search operations will be automatically tracked
  const results = search(db, { term: 'tutorial' })
  console.log(`Analytics plugin tracking search: "${results.count}" results`)

  return { db, results }
}

// Data Persistence Plugin Usage
async function setupDataPersistence() {
  const db = create({
    schema: {
      id: 'string',
      name: 'string',
      description: 'string',
      price: 'number'
    }
  })

  // Add data to database
  const products = [
    { id: '1', name: 'Laptop', description: 'High-performance laptop', price: 1299 },
    { id: '2', name: 'Mouse', description: 'Wireless gaming mouse', price: 79 },
    { id: '3', name: 'Keyboard', description: 'Mechanical keyboard', price: 149 }
  ]

  insertMultiple(db, products)

  // Persist database to file
  const filePath = './orama-database.json'
  await persistToFile(db, 'json', filePath)
  console.log(`Database persisted to ${filePath}`)

  // Restore database from file
  const restoredDB = await restoreFromFile('json', filePath)
  console.log('Database restored from file')

  // Verify restoration
  const verificationResults = search(restoredDB, { term: '*' })
  console.log(`Restored database contains ${verificationResults.count} documents`)

  return { db, restoredDB }
}

// Parsedoc Plugin for Document Processing
async function setupParsedocPlugin() {
  const parsedocPlugin = await pluginParsedoc({
    defaultLanguage: 'english',
    transformFn: (document: any) => {
      // Transform and enrich documents during parsing
      return {
        ...document,
        processedAt: new Date().toISOString(),
        wordCount: document.content ? document.content.split(' ').length : 0
      }
    }
  })

  const db = await create({
    schema: {
      title: 'string',
      content: 'string',
      url: 'string',
      processedAt: 'string',
      wordCount: 'number'
    },
    plugins: [parsedocPlugin]
  })

  // Process and insert documents from various sources
  const documents = [
    {
      title: 'API Documentation',
      content: 'Complete API reference for developers including authentication, endpoints, and examples',
      url: '/api/docs'
    },
    {
      title: 'Getting Started Guide', 
      content: 'Step-by-step tutorial for new users to get up and running quickly',
      url: '/getting-started'
    }
  ]

  for (const doc of documents) {
    await insert(db, doc) // Plugin will automatically transform
  }

  return db
}

// Custom Tokenizer Configuration
async function setupCustomTokenizer() {
  // Create Mandarin tokenizer
  const mandarinTokenizer = await createTokenizer()

  const db = await create({
    schema: {
      title: 'string',
      content: 'string',
      language: 'string'
    },
    components: {
      tokenizer: mandarinTokenizer
    }
  })

  // Insert Chinese content
  await insertMultiple(db, [
    {
      title: '机器学习基础',
      content: '深度学习和神经网络的基本概念介绍',
      language: 'zh'
    },
    {
      title: '人工智能应用',
      content: '现代人工智能技术在各行业的实际应用案例',
      language: 'zh'
    }
  ])

  // Search in Chinese
  const chineseResults = search(db, {
    term: '机器学习',
    properties: ['title', 'content']
  })

  console.log(`Chinese search found ${chineseResults.count} results`)
  return { db, chineseResults }
}

// Spanish Stemmer Configuration
async function setupSpanishStemmer() {
  const db = create({
    schema: {
      titulo: 'string',
      contenido: 'string',
      categoria: 'string'
    },
    components: {
      tokenizer: {
        stemming: true,
        stemmerSkipProperties: ['categoria'], // Skip stemming for category
        stemmer: stemmer // Spanish stemmer
      }
    }
  })

  // Insert Spanish content
  insertMultiple(db, [
    {
      titulo: 'Programación Avanzada',
      contenido: 'Técnicas avanzadas de programación y desarrollo de software',
      categoria: 'programacion'
    },
    {
      titulo: 'Desarrollo Web Moderno',
      contenido: 'Frameworks y herramientas para el desarrollo web contemporáneo',
      categoria: 'web'
    }
  ])

  // Search with Spanish stemming
  const spanishResults = search(db, {
    term: 'programar desarrollo', // Will match "programación" and "desarrollo"
    properties: ['titulo', 'contenido']
  })

  console.log(`Spanish search found ${spanishResults.count} results`)
  return { db, spanishResults }
}

// Multiple Plugins Configuration
async function setupMultiplePlugins() {
  // Configure multiple plugins together
  const embeddingsPlugin = await pluginEmbeddings({
    embeddings: {
      defaultProperty: 'embeddings',
      onInsert: { generate: true, properties: ['content'] }
    }
  })

  const analyticsPlugin = await pluginAnalytics({
    apiKey: process.env.ORAMA_ANALYTICS_API_KEY || 'demo-key',
    indexId: 'multi-plugin-demo'
  })

  const db = await create({
    schema: {
      id: 'string',
      title: 'string',
      content: 'string',
      embeddings: 'vector[512]',
      category: 'string',
      tags: 'string[]'
    },
    plugins: [embeddingsPlugin, analyticsPlugin],
    components: {
      tokenizer: {
        stopwords: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
      }
    }
  })

  // Insert sample data
  const articles = [
    {
      id: '1',
      title: 'Introduction to Vector Search',
      content: 'Vector search enables semantic similarity matching using machine learning embeddings',
      category: 'tutorial',
      tags: ['vector-search', 'ml', 'embeddings']
    },
    {
      id: '2', 
      title: 'Analytics and Monitoring',
      content: 'Track search performance and user behavior with built-in analytics capabilities',
      category: 'guide',
      tags: ['analytics', 'monitoring', 'performance']
    }
  ]

  for (const article of articles) {
    await insert(db, article)
  }

  // Perform hybrid search (will trigger both embeddings and analytics)
  const hybridResults = await search(db, {
    term: 'machine learning search optimization',
    mode: 'hybrid',
    facets: {
      category: {},
      tags: { limit: 5 }
    }
  })

  console.log(`Hybrid search with multiple plugins: ${hybridResults.count} results`)
  return { db, hybridResults }
}

// Plugin Error Handling and Fallbacks
async function setupPluginErrorHandling() {
  try {
    // Attempt to load embeddings plugin with fallback
    let embeddingsPlugin
    try {
      embeddingsPlugin = await pluginEmbeddings({
        embeddings: {
          defaultProperty: 'embeddings',
          onInsert: { generate: true, properties: ['content'] }
        }
      })
      console.log('Embeddings plugin loaded successfully')
    } catch (error) {
      console.warn('Embeddings plugin failed to load:', error)
      embeddingsPlugin = null
    }

    // Create database with conditional plugin loading
    const plugins = [embeddingsPlugin].filter(Boolean)
    
    const db = await create({
      schema: {
        title: 'string',
        content: 'string',
        ...(embeddingsPlugin && { embeddings: 'vector[512]' })
      },
      plugins
    })

    // Insert data
    await insert(db, {
      title: 'Error Handling Example',
      content: 'This example shows how to handle plugin loading errors gracefully'
    })

    // Search with fallback behavior
    const searchMode = embeddingsPlugin ? 'hybrid' : 'fulltext'
    const results = search(db, {
      term: 'error handling',
      mode: searchMode
    })

    console.log(`Search completed in ${searchMode} mode: ${results.count} results`)
    return { db, results, hasEmbeddings: !!embeddingsPlugin }

  } catch (error) {
    console.error('Plugin setup failed:', error)
    
    // Fallback to basic database without plugins
    const fallbackDB = create({
      schema: {
        title: 'string',
        content: 'string'
      }
    })

    console.log('Using fallback database without plugins')
    return { db: fallbackDB, results: null, hasEmbeddings: false }
  }
}

// Export all plugin examples
export {
  setupEmbeddingsPlugin,
  setupAnalyticsPlugin,
  setupDataPersistence,
  setupParsedocPlugin,
  setupCustomTokenizer,
  setupSpanishStemmer,
  setupMultiplePlugins,
  setupPluginErrorHandling
}

// Example usage runner
async function runPluginExamples() {
  console.log('Running Orama plugin examples...')
  
  try {
    // Test embeddings plugin
    console.log('\n1. Testing Embeddings Plugin...')
    const embeddings = await setupEmbeddingsPlugin()
    console.log(`Embeddings plugin: ${embeddings.vectorResults.count} vector results`)

    // Test data persistence
    console.log('\n2. Testing Data Persistence...')
    const persistence = await setupDataPersistence()
    console.log('Data persistence: Save and restore completed')

    // Test multiple plugins
    console.log('\n3. Testing Multiple Plugins...')
    const multiPlugin = await setupMultiplePlugins()
    console.log(`Multiple plugins: ${multiPlugin.hybridResults.count} hybrid results`)

    // Test error handling
    console.log('\n4. Testing Error Handling...')
    const errorHandling = await setupPluginErrorHandling()
    console.log(`Error handling: Embeddings ${errorHandling.hasEmbeddings ? 'enabled' : 'disabled'}`)

  } catch (error) {
    console.error('Plugin examples failed:', error)
  }
}

// Uncomment to run examples
// runPluginExamples()