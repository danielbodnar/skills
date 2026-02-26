// Typesense Configuration Examples for Different Environments
import { Client } from 'typesense';
import type { ClientConfig } from './schemas/typesense-types.js';

// Development Configuration
export const developmentConfig: ClientConfig = {
  nodes: [{
    host: 'localhost',
    port: 8108,
    protocol: 'http'
  }],
  apiKey: 'xyz', // Default development key
  connectionTimeoutSeconds: 10,
  retryIntervalSeconds: 1,
  numRetries: 3,
  logLevel: 'debug'
};

// Production Configuration
export const productionConfig: ClientConfig = {
  nodes: [
    { host: 'typesense-1.example.com', port: 443, protocol: 'https' },
    { host: 'typesense-2.example.com', port: 443, protocol: 'https' },
    { host: 'typesense-3.example.com', port: 443, protocol: 'https' }
  ],
  apiKey: process.env.TYPESENSE_API_KEY!,
  connectionTimeoutSeconds: 15,
  retryIntervalSeconds: 2,
  numRetries: 5,
  healthcheckIntervalSeconds: 30,
  logLevel: 'warn'
};

// Cloud Configuration (Typesense Cloud)
export const cloudConfig: ClientConfig = {
  nodes: [{
    host: process.env.TYPESENSE_CLOUD_HOST!,
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_CLOUD_API_KEY!,
  connectionTimeoutSeconds: 20,
  retryIntervalSeconds: 3,
  numRetries: 3,
  logLevel: 'info'
};

// High-performance Configuration
export const highPerformanceConfig: ClientConfig = {
  nodes: [
    { host: 'typesense-hp-1.example.com', port: 443, protocol: 'https' },
    { host: 'typesense-hp-2.example.com', port: 443, protocol: 'https' }
  ],
  apiKey: process.env.TYPESENSE_API_KEY!,
  connectionTimeoutSeconds: 5, // Faster timeout for high-performance
  retryIntervalSeconds: 0.5,
  numRetries: 2,
  healthcheckIntervalSeconds: 15,
  logLevel: 'error' // Minimal logging for performance
};

// Configuration Factory
export function createTypesenseConfig(environment: 'development' | 'production' | 'cloud' | 'high-performance' = 'development'): ClientConfig {
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'cloud':
      return cloudConfig;
    case 'high-performance':
      return highPerformanceConfig;
    default:
      return developmentConfig;
  }
}

// Environment-aware client factory
export function createTypesenseClient(environment?: string): Client {
  const env = (environment || process.env.NODE_ENV || 'development') as any;
  const config = createTypesenseConfig(env);
  
  return new Client(config);
}

// Collection Configurations for Different Use Cases

// Basic Bookmark Collection
export const basicBookmarkCollection = {
  name: 'bookmarks',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'title', type: 'string' as const },
    { name: 'url', type: 'string' as const },
    { name: 'description', type: 'string' as const, optional: true },
    { name: 'tags', type: 'string[]' as const, facet: true, optional: true },
    { name: 'domain', type: 'string' as const, facet: true },
    { name: 'date_added', type: 'int64' as const, sort: true },
    { name: 'is_favorite', type: 'bool' as const, facet: true, optional: true }
  ],
  default_sorting_field: 'date_added'
};

// Advanced Bookmark Collection with Vector Search
export const advancedBookmarkCollection = {
  name: 'advanced_bookmarks',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'title', type: 'string' as const },
    { name: 'url', type: 'string' as const },
    { name: 'description', type: 'string' as const, optional: true },
    { name: 'content', type: 'string' as const, optional: true },
    { name: 'tags', type: 'string[]' as const, facet: true, optional: true },
    { name: 'category', type: 'string' as const, facet: true, optional: true },
    { name: 'domain', type: 'string' as const, facet: true },
    { name: 'date_added', type: 'int64' as const, sort: true },
    { name: 'date_modified', type: 'int64' as const, sort: true },
    { name: 'visit_count', type: 'int32' as const, sort: true, optional: true },
    { name: 'is_favorite', type: 'bool' as const, facet: true, optional: true },
    { name: 'reading_time', type: 'int32' as const, sort: true, optional: true },
    { name: 'language', type: 'string' as const, facet: true, optional: true },
    
    // Vector embeddings for semantic search
    { 
      name: 'title_embedding', 
      type: 'float[]' as const, 
      embed: {
        from: ['title'],
        model_config: {
          model_name: 'ts/e5-small'
        }
      }
    },
    { 
      name: 'content_embedding', 
      type: 'float[]' as const, 
      embed: {
        from: ['title', 'description', 'content'],
        model_config: {
          model_name: 'ts/all-MiniLM-L6-v2'
        }
      }
    }
  ],
  default_sorting_field: 'date_modified',
  token_separators: ['-', '/', '.', '_'],
  symbols_to_index: ['@', '#', '$']
};

// E-commerce Product Collection
export const ecommerceProductCollection = {
  name: 'products',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'name', type: 'string' as const },
    { name: 'description', type: 'string' as const },
    { name: 'category', type: 'string' as const, facet: true },
    { name: 'subcategory', type: 'string' as const, facet: true, optional: true },
    { name: 'brand', type: 'string' as const, facet: true },
    { name: 'price', type: 'float' as const, sort: true },
    { name: 'sale_price', type: 'float' as const, sort: true, optional: true },
    { name: 'rating', type: 'float' as const, facet: true, sort: true },
    { name: 'review_count', type: 'int32' as const, sort: true },
    { name: 'tags', type: 'string[]' as const, facet: true, optional: true },
    { name: 'colors', type: 'string[]' as const, facet: true, optional: true },
    { name: 'sizes', type: 'string[]' as const, facet: true, optional: true },
    { name: 'materials', type: 'string[]' as const, facet: true, optional: true },
    { name: 'in_stock', type: 'bool' as const, facet: true },
    { name: 'inventory_count', type: 'int32' as const, sort: true },
    { name: 'created_at', type: 'int64' as const, sort: true },
    { name: 'updated_at', type: 'int64' as const, sort: true },
    { name: 'is_featured', type: 'bool' as const, facet: true, optional: true },
    { name: 'is_new', type: 'bool' as const, facet: true, optional: true },
    
    // Multiple embedding strategies
    { 
      name: 'name_embedding', 
      type: 'float[]' as const, 
      embed: {
        from: ['name'],
        model_config: {
          model_name: 'ts/e5-small'
        }
      }
    },
    { 
      name: 'description_embedding', 
      type: 'float[]' as const, 
      embed: {
        from: ['description'],
        model_config: {
          model_name: 'ts/all-MiniLM-L6-v2'
        }
      }
    },
    { 
      name: 'combined_embedding', 
      type: 'float[]' as const, 
      embed: {
        from: ['name', 'description', 'category', 'brand'],
        model_config: {
          model_name: 'ts/all-MiniLM-L6-v2'
        }
      },
      hnsw: {
        ef_construction: 400,
        M: 32
      }
    }
  ],
  default_sorting_field: 'rating'
};

// Knowledge Base Collection for RAG
export const knowledgeBaseCollection = {
  name: 'knowledge_base',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'title', type: 'string' as const },
    { name: 'content', type: 'string' as const },
    { name: 'summary', type: 'string' as const, optional: true },
    { name: 'category', type: 'string' as const, facet: true },
    { name: 'subcategory', type: 'string' as const, facet: true, optional: true },
    { name: 'tags', type: 'string[]' as const, facet: true, optional: true },
    { name: 'source_type', type: 'string' as const, facet: true }, // article, documentation, faq
    { name: 'source_url', type: 'string' as const, optional: true },
    { name: 'author', type: 'string' as const, facet: true, optional: true },
    { name: 'published_date', type: 'int64' as const, sort: true },
    { name: 'last_updated', type: 'int64' as const, sort: true },
    { name: 'word_count', type: 'int32' as const, sort: true, optional: true },
    { name: 'reading_time', type: 'int32' as const, sort: true, optional: true },
    { name: 'difficulty_level', type: 'string' as const, facet: true, optional: true },
    { name: 'language', type: 'string' as const, facet: true, optional: true },
    { name: 'is_featured', type: 'bool' as const, facet: true, optional: true },
    { name: 'view_count', type: 'int32' as const, sort: true, optional: true },
    
    // Optimized for RAG retrieval
    { 
      name: 'content_embedding', 
      type: 'float[]' as const, 
      embed: {
        from: ['title', 'content', 'summary'],
        model_config: {
          model_name: 'ts/all-MiniLM-L6-v2'
        }
      },
      hnsw: {
        ef_construction: 500,
        M: 48
      }
    }
  ],
  default_sorting_field: 'last_updated',
  enable_nested_fields: true
};

// Multi-modal Collection (Text + Image)
export const multiModalCollection = {
  name: 'multimedia_content',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'title', type: 'string' as const },
    { name: 'description', type: 'string' as const, optional: true },
    { name: 'content_type', type: 'string' as const, facet: true }, // text, image, video, audio
    { name: 'category', type: 'string' as const, facet: true },
    { name: 'tags', type: 'string[]' as const, facet: true, optional: true },
    { name: 'file_url', type: 'string' as const, optional: true },
    { name: 'file_size', type: 'int64' as const, sort: true, optional: true },
    { name: 'created_at', type: 'int64' as const, sort: true },
    { name: 'updated_at', type: 'int64' as const, sort: true },
    
    // Text embedding for textual content
    { 
      name: 'text_embedding', 
      type: 'float[]' as const, 
      embed: {
        from: ['title', 'description'],
        model_config: {
          model_name: 'ts/all-MiniLM-L6-v2'
        }
      },
      optional: true
    },
    
    // Pre-computed image/video embeddings
    { 
      name: 'visual_embedding', 
      type: 'float[]' as const,
      num_dim: 512,
      optional: true,
      hnsw: {
        ef_construction: 300,
        M: 24
      }
    }
  ],
  default_sorting_field: 'created_at'
};

// Environment-specific Collection Configurations
export const collectionConfigurations = {
  development: {
    bookmarks: basicBookmarkCollection,
    products: {
      ...ecommerceProductCollection,
      // Simpler config for development
      fields: ecommerceProductCollection.fields.filter(field => 
        !field.name.includes('embedding') || field.name === 'combined_embedding'
      )
    }
  },
  production: {
    bookmarks: advancedBookmarkCollection,
    products: ecommerceProductCollection,
    knowledge_base: knowledgeBaseCollection,
    multimedia: multiModalCollection
  }
};

// API Key Configuration
export const apiKeyConfig = {
  // Admin key for full CRUD operations
  admin: {
    value: process.env.TYPESENSE_ADMIN_API_KEY || 'admin-key',
    description: 'Full access for administration',
    actions: ['documents:search', 'documents:get', 'documents:create', 'documents:update', 'documents:delete', 'collections:create', 'collections:delete']
  },
  
  // Search-only key for frontend applications
  search: {
    value: process.env.TYPESENSE_SEARCH_API_KEY || 'search-key',
    description: 'Read-only access for search operations',
    actions: ['documents:search', 'documents:get'],
    collections: ['bookmarks', 'products', 'knowledge_base'],
    expires_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
  },
  
  // Scoped key for specific collections
  bookmarks_only: {
    value: process.env.TYPESENSE_BOOKMARKS_API_KEY || 'bookmarks-key',
    description: 'Access limited to bookmarks collection',
    actions: ['documents:search', 'documents:get', 'documents:create', 'documents:update'],
    collections: ['bookmarks']
  }
};

// Docker Compose Configuration
export const dockerComposeConfig = `
version: '3.8'
services:
  typesense:
    image: typesense/typesense:29.0
    restart: on-failure
    ports:
      - "8108:8108"
    volumes:
      - typesense-data:/data
    environment:
      TYPESENSE_DATA_DIR: /data
      TYPESENSE_API_KEY: \${TYPESENSE_API_KEY:-xyz}
      TYPESENSE_ENABLE_CORS: true
    command: >
      --data-dir /data
      --api-key=\${TYPESENSE_API_KEY:-xyz}
      --enable-cors
      --log-level=\${TYPESENSE_LOG_LEVEL:-info}

volumes:
  typesense-data:
`;

// Kubernetes Configuration
export const kubernetesConfig = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: typesense
spec:
  replicas: 3
  selector:
    matchLabels:
      app: typesense
  template:
    metadata:
      labels:
        app: typesense
    spec:
      containers:
      - name: typesense
        image: typesense/typesense:29.0
        ports:
        - containerPort: 8108
        env:
        - name: TYPESENSE_DATA_DIR
          value: "/data"
        - name: TYPESENSE_API_KEY
          valueFrom:
            secretKeyRef:
              name: typesense-secret
              key: api-key
        - name: TYPESENSE_ENABLE_CORS
          value: "true"
        volumeMounts:
        - name: typesense-storage
          mountPath: /data
        command:
        - "/opt/typesense-server"
        - "--data-dir=/data"
        - "--api-key=$(TYPESENSE_API_KEY)"
        - "--enable-cors"
        - "--log-level=info"
      volumes:
      - name: typesense-storage
        persistentVolumeClaim:
          claimName: typesense-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: typesense-service
spec:
  selector:
    app: typesense
  ports:
  - port: 8108
    targetPort: 8108
  type: LoadBalancer
`;

export {
  createTypesenseClient,
  createTypesenseConfig,
  collectionConfigurations,
  apiKeyConfig,
  dockerComposeConfig,
  kubernetesConfig
};