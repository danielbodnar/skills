// Orama Configuration Examples
// Complete guide to configuring Orama databases and components

import { create, insert, search } from '@orama/orama'
import { stemmer as englishStemmer } from '@orama/stemmers/english'
import { stemmer as spanishStemmer } from '@orama/stemmers/spanish'
import { stopwords as englishStopwords } from '@orama/stopwords/english'
import { stopwords as spanishStopwords } from '@orama/stopwords/spanish'

// Basic Database Configuration
const basicConfig = {
  schema: {
    title: 'string',
    content: 'string',
    category: 'string'
  }
}

const basicDB = create(basicConfig)

// Advanced Schema Configuration with All Data Types
const advancedSchema = {
  // String fields
  id: 'string',
  title: 'string',
  content: 'string',
  slug: 'string',
  
  // Numeric fields
  price: 'number',
  rating: 'number',
  views: 'number',
  
  // Boolean fields
  isPublished: 'boolean',
  isFeatured: 'boolean',
  
  // Array fields
  tags: 'string[]',
  categories: 'string[]',
  authors: 'string[]',
  
  // Enum fields (limited to specific values)
  status: 'enum',
  priority: 'enum',
  
  // Vector fields for embeddings
  embeddings: 'vector[512]',
  titleEmbedding: 'vector[256]',
  
  // Geopoint for location data
  location: 'geopoint',
  
  // Nested object structures
  metadata: {
    publishDate: 'string',
    lastModified: 'string',
    wordCount: 'number',
    readingTime: 'number'
  },
  
  // Complex nested structures
  author: {
    name: 'string',
    email: 'string',
    bio: 'string',
    social: {
      twitter: 'string',
      linkedin: 'string'
    }
  }
} as const

// Create database with advanced schema
const advancedDB = create({
  schema: advancedSchema
})

// Custom Tokenizer Configuration
const customTokenizerDB = create({
  schema: {
    title: 'string',
    content: 'string'
  },
  components: {
    tokenizer: {
      // Language settings
      language: 'english',
      
      // Enable/disable stemming
      stemming: true,
      stemmer: englishStemmer,
      stemmerSkipProperties: ['title'], // Skip stemming for specific properties
      
      // Stop words configuration
      stopwords: englishStopwords,
      
      // Custom stop words
      customStopwords: ['custom', 'stopword', 'example'],
      
      // Case sensitivity
      caseSensitive: false,
      
      // Enable normalization (accent removal, etc.)
      normalization: true
    }
  }
})

// Multi-language Configuration
const multiLanguageDB = create({
  schema: {
    title: 'string',
    content: 'string',
    language: 'string'
  },
  components: {
    tokenizer: {
      // Will use appropriate stemmer/stopwords based on document language
      language: 'auto', // Auto-detect language
      stemming: true,
      
      // Language-specific configurations
      languages: {
        english: {
          stemmer: englishStemmer,
          stopwords: englishStopwords
        },
        spanish: {
          stemmer: spanishStemmer,
          stopwords: spanishStopwords
        }
      }
    }
  }
})

// Performance Optimization Configuration
const optimizedDB = create({
  schema: {
    title: 'string',
    content: 'string',
    category: 'string',
    embeddings: 'vector[512]'
  },
  components: {
    tokenizer: {
      // Optimize for performance
      caseSensitive: false,
      stemming: true,
      normalization: true,
      
      // Limit token length to improve performance
      maxTokenLength: 50,
      
      // Custom token processing
      customTokenizer: (text: string) => {
        // Custom tokenization logic
        return text
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .split(/\s+/)           // Split on whitespace
          .filter(token => token.length > 2) // Filter short tokens
      }
    },
    
    // Custom index configuration
    index: {
      // Optimize index structure for specific use cases
      caseSensitive: false,
      
      // Custom scoring function
      scorer: {
        // BM25 parameters
        k1: 1.2,
        b: 0.75
      }
    }
  }
})

// Search Configuration Examples
const searchConfig = {
  // Basic search parameters
  basic: {
    term: 'search query',
    properties: ['title', 'content'],
    limit: 10,
    offset: 0
  },
  
  // Advanced search configuration
  advanced: {
    term: 'complex search',
    mode: 'hybrid' as const, // fulltext, vector, or hybrid
    properties: ['title^2', 'content^1', 'tags^1.5'], // Boosted fields
    
    // Filtering
    where: {
      isPublished: true,
      rating: { gte: 4.0 },
      category: { in: ['tech', 'science'] },
      publishDate: { gte: '2024-01-01' }
    },
    
    // Sorting
    sortBy: [
      { property: 'rating', order: 'DESC' },
      { property: 'publishDate', order: 'DESC' }
    ],
    
    // Pagination
    limit: 20,
    offset: 0,
    
    // Similarity threshold for vector search
    similarity: 0.8,
    
    // Result boosting
    boost: {
      title: 2.0,
      content: 1.0,
      tags: 1.5
    },
    
    // Typo tolerance
    tolerance: 1,
    
    // Exact matching
    exact: false,
    
    // Faceted search
    facets: {
      category: { limit: 10, order: 'DESC' },
      tags: { limit: 15 },
      rating: {
        ranges: [
          { from: 0, to: 2 },
          { from: 2, to: 4 },
          { from: 4, to: 5 }
        ]
      },
      publishDate: {
        ranges: [
          { from: '2024-01-01', to: '2024-03-31' },
          { from: '2024-04-01', to: '2024-06-30' }
        ]
      }
    },
    
    // Grouping
    groupBy: {
      properties: ['category', 'author.name'],
      maxResult: 3,
      
      // Custom reducer
      reduce: {
        reducer: (values: any[], acc: any, item: any) => {
          acc.totalRating += item.document.rating
          acc.count += 1
          acc.averageRating = acc.totalRating / acc.count
          return acc
        },
        getInitialValue: () => ({
          totalRating: 0,
          count: 0,
          averageRating: 0
        })
      }
    },
    
    // Include vectors in results
    includeVectors: false,
    
    // Highlighting
    highlight: {
      fields: ['title', 'content'],
      preTag: '<mark>',
      postTag: '</mark>',
      maxLength: 200
    }
  }
}

// Environment-specific Configuration
const getEnvironmentConfig = (env: 'development' | 'production' | 'test') => {
  const baseConfig = {
    schema: {
      title: 'string',
      content: 'string',
      category: 'string'
    }
  }

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        components: {
          tokenizer: {
            // More verbose logging in development
            verbose: true,
            caseSensitive: false,
            stemming: true
          }
        }
      }
    
    case 'production':
      return {
        ...baseConfig,
        components: {
          tokenizer: {
            // Optimized for production performance
            caseSensitive: false,
            stemming: true,
            normalization: true,
            maxTokenLength: 100
          }
        }
      }
    
    case 'test':
      return {
        ...baseConfig,
        components: {
          tokenizer: {
            // Minimal configuration for faster tests
            stemming: false,
            normalization: false
          }
        }
      }
  }
}

// Cloud Configuration for Orama Cloud
const cloudConfig = {
  // Public client configuration
  client: {
    endpoint: process.env.ORAMA_CLOUD_ENDPOINT || 'https://your-endpoint.oramacloud.io',
    api_key: process.env.ORAMA_CLOUD_PUBLIC_API_KEY || 'your-public-key',
    
    // Request configuration
    timeout: 10000, // 10 seconds
    retries: 3,
    
    // Caching
    cache: {
      enabled: true,
      ttl: 300000 // 5 minutes
    }
  },
  
  // Private management configuration
  manager: {
    api_key: process.env.ORAMA_CLOUD_PRIVATE_API_KEY || 'your-private-key',
    
    // Batch operations
    batch: {
      size: 100,
      timeout: 30000
    }
  },
  
  // Search configuration
  search: {
    // Default search parameters
    defaults: {
      limit: 20,
      mode: 'hybrid' as const,
      similarity: 0.7
    },
    
    // Search filters
    filters: {
      // Global filters applied to all searches
      global: {
        isPublished: true
      },
      
      // User-specific filters
      user: (userId: string) => ({
        'permissions.viewableBy': { contains: userId }
      })
    }
  }
}

// Database Factory with Configuration Presets
export function createDatabase(preset: 'basic' | 'advanced' | 'multilang' | 'optimized') {
  const presets = {
    basic: basicConfig,
    advanced: { schema: advancedSchema },
    multilang: {
      schema: {
        title: 'string',
        content: 'string',
        language: 'string'
      },
      components: {
        tokenizer: {
          language: 'auto',
          stemming: true
        }
      }
    },
    optimized: {
      schema: {
        title: 'string',
        content: 'string',
        embeddings: 'vector[512]'
      },
      components: {
        tokenizer: {
          caseSensitive: false,
          stemming: true,
          normalization: true,
          maxTokenLength: 50
        }
      }
    }
  }

  return create(presets[preset])
}

// Configuration Validation
export function validateConfiguration(config: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate schema
  if (!config.schema) {
    errors.push('Schema is required')
  } else {
    // Check for valid data types
    const validTypes = ['string', 'number', 'boolean', 'string[]', 'number[]', 'enum', 'geopoint']
    
    const validateSchema = (schema: any, path = '') => {
      Object.entries(schema).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key
        
        if (typeof value === 'string') {
          // Check if it's a valid type or vector format
          const isVector = /^vector\[\d+\]$/.test(value)
          if (!validTypes.includes(value) && !isVector) {
            errors.push(`Invalid type '${value}' at ${currentPath}`)
          }
        } else if (typeof value === 'object' && value !== null) {
          validateSchema(value, currentPath)
        }
      })
    }
    
    validateSchema(config.schema)
  }
  
  // Validate components if present
  if (config.components) {
    if (config.components.tokenizer) {
      const tokenizer = config.components.tokenizer
      
      if (tokenizer.language && !['english', 'spanish', 'auto'].includes(tokenizer.language)) {
        errors.push(`Unsupported language: ${tokenizer.language}`)
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export configurations
export {
  basicConfig,
  advancedSchema,
  customTokenizerDB,
  multiLanguageDB,
  optimizedDB,
  searchConfig,
  getEnvironmentConfig,
  cloudConfig
}

// Example usage
console.log('Orama configuration examples loaded')

// Validate example configuration
const validationResult = validateConfiguration({
  schema: {
    title: 'string',
    content: 'string',
    embeddings: 'vector[512]',
    invalid: 'invalidtype'
  }
})

console.log('Configuration validation:', validationResult)